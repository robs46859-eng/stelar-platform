"""
GoDaddy API Client Wrapper

Provides a unified interface to the GoDaddy developer API for:
- Domain search and availability checking
- Domain pricing lookup by TLD
- Domain auction discovery
- Rate limit management with exponential backoff

API Documentation: https://developer.godaddy.com/doc
"""

import os
import time
import logging
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class GoDaddyRateLimiter:
    """Handles rate limiting with token bucket algorithm."""

    def __init__(self, max_requests: int = 150, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: List[float] = []
        self.lock = False  # Simple lock for single-threaded use

    def _cleanup_old_requests(self):
        """Remove requests outside the current window."""
        now = time.time()
        cutoff = now - self.window_seconds
        self.requests = [t for t in self.requests if t > cutoff]

    def wait_if_needed(self):
        """Block if we're at the rate limit."""
        self._cleanup_old_requests()
        if len(self.requests) >= self.max_requests:
            # Wait until the oldest request expires from the window
            wait_time = self.requests[0] + self.window_seconds - time.time()
            if wait_time > 0:
                logger.debug(f"Rate limit reached, waiting {wait_time:.2f}s")
                time.sleep(wait_time)
                self._cleanup_old_requests()

    def record_request(self):
        """Record that a request was made."""
        self.requests.append(time.time())


class GoDaddyAPIClient:
    """
    Wrapper for GoDaddy Developer API.

    Requires GO_DADDY_API_KEY and GO_DADDY_API_SECRET environment variables.
    Set GO_DADDY_SANDBOX=1 to use the OTE/test environment.
    """

    SANDBOX_BASE_URL = "https://api.ote-godaddy.com/v1"
    PRODUCTION_BASE_URL = "https://api.godaddy.com/v1"

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        sandbox: Optional[bool] = None,
        timeout: int = 30,
        max_retries: int = 3,
        rate_limit: int = 150,
        rate_window: int = 60,
    ):
        self.api_key = api_key or os.environ.get("GO_DADDY_API_KEY", "")
        self.api_secret = api_secret or os.environ.get("GO_DADDY_API_SECRET", "")
        self.timeout = timeout
        self.max_retries = max_retries

        if sandbox is None:
            sandbox = os.environ.get("GO_DADDY_SANDBOX", "0") == "1"
        self.sandbox = sandbox

        self.base_url = self.SANDBOX_BASE_URL if sandbox else self.PRODUCTION_BASE_URL
        self.rate_limiter = GoDaddyRateLimiter(max_requests=rate_limit, window_seconds=rate_window)
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"sso-key {self.api_key}:{self.api_secret}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

        if not self.api_key or not self.api_secret:
            logger.warning("No GoDaddy API credentials provided. API calls will fail.")

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        json_body: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """
        Make an authenticated API request with retry and rate limit handling.
        Returns parsed JSON response or None on failure.
        """
        url = urljoin(self.base_url.rstrip("/") + "/", endpoint.lstrip("/"))

        for attempt in range(1, self.max_retries + 1):
            self.rate_limiter.wait_if_needed()
            self.rate_limiter.record_request()

            try:
                response = self.session.request(
                    method, url, params=params, json=json_body, timeout=self.timeout
                )

                # Check for rate limit (429)
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 30))
                    logger.warning(f"Rate limited by GoDaddy API, waiting {retry_after}s")
                    time.sleep(retry_after)
                    continue

                # Check for auth errors
                if response.status_code == 401:
                    logger.error("GoDaddy API authentication failed. Check your API key/secret.")
                    return None

                if response.status_code == 403:
                    logger.error("GoDaddy API access forbidden. Check your permissions.")
                    return None

                if response.status_code == 404:
                    logger.warning(f"GoDaddy API endpoint not found: {url}")
                    return None

                response.raise_for_status()

                # Handle empty responses
                if not response.text.strip():
                    return {}

                return response.json()

            except requests.exceptions.Timeout:
                wait = 2 ** attempt
                logger.warning(f"GoDaddy API timeout (attempt {attempt}/{self.max_retries}), retrying in {wait}s")
                time.sleep(wait)

            except requests.exceptions.RequestException as e:
                logger.error(f"GoDaddy API request error: {e}")
                return None

        logger.error(f"GoDaddy API request failed after {self.max_retries} retries")
        return None

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Convenience method for GET requests."""
        return self._request("GET", endpoint, params=params)

    def post(self, endpoint: str, json_body: Optional[Dict] = None) -> Optional[Dict]:
        """Convenience method for POST requests."""
        return self._request("POST", endpoint, json_body=json_body)

    # ---- Domain Availability ----

    def check_available(
        self,
        domains: List[str],
        check_type: str = "full",
        for_transfer: bool = False,
    ) -> Optional[List[Dict]]:
        """
        Check domain availability.

        Args:
            domains: List of domain names to check.
            check_type: "full" (exact) or "quick" (approximate).
            for_transfer: If True, check for transfer availability.

        Returns:
            List of domain availability results.
        """
        params: Dict[str, Any] = {
            "domainCheckType": check_type,
            "forTransfer": str(for_transfer).lower(),
        }
        # Each domain goes as a separate query param
        domain_list: List[str] = []
        for domain in domains:
            domain_list.append(domain)
        params["domain"] = domain_list

        return self.get("domains/available", params=params)  # type: ignore[return-value]

    def suggest_domains(
        self,
        query: str,
        tlds: Optional[List[str]] = None,
        max_results: int = 30,
        types: Optional[List[str]] = None,
    ) -> Optional[List[Dict]]:
        """
        Suggest domain names based on a keyword query.

        Args:
            query: Keyword string for domain suggestions.
            tlds: List of TLDs to filter (e.g., ["com", "net"]).
            max_results: Maximum number of results (default 30).
            types: Domain types to include (default ["exact", "suggestion"]).

        Returns:
            List of suggested domains with availability and pricing.
        """
        params = {
            "query": query,
            "max": min(max_results, 30),
        }

        if tlds:
            params["tlds"] = ",".join(tlds)

        if types:
            params["types"] = ",".join(types)
        else:
            params["types"] = "exact,suggestion"

        return self.get("domains/suggest", params=params)

    # ---- Domain Pricing ----

    def get_pricing(
        self,
        tlds: Optional[List[str]] = None,
        years: int = 1,
        action: str = "purchase",
    ) -> Optional[Dict]:
        """
        Get current pricing for TLDs.

        Args:
            tlds: List of TLDs (e.g., ["com", "net"]). None = default list.
            years: Registration period (1-10).
            action: "purchase", "renew", or "transfer".

        Returns:
            Pricing data by TLD.
        """
        params = {
            "period": years,
            "action": action,
        }

        if tlds:
            params["tlds"] = ",".join(tlds)

        return self.get("domains/pricing", params=params)

    # ---- Domain Details ----

    def get_domain_details(self, domain: str) -> Optional[Dict]:
        """
        Get detailed information about a registered domain.

        Args:
            domain: The domain name to lookup.

        Returns:
            Domain details including registrant, nameservers, etc.
        """
        return self.get(f"domains/{domain}")

    # ---- Auctions ----

    def search_auctions(
        self,
        keyword: Optional[str] = None,
        max_price: Optional[float] = None,
        min_price: Optional[float] = None,
        sort_by: str = "relevance",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 25,
    ) -> Optional[Dict]:
        """
        Search GoDaddy domain auctions.

        Args:
            keyword: Filter by keyword in domain name.
            max_price: Maximum auction price.
            min_price: Minimum auction price.
            sort_by: Sort field (relevance, price, endingSoon, bidCount).
            sort_order: asc or desc.
            page: Results page number.
            limit: Results per page.

        Returns:
            Auction results with pagination info.
        """
        params = {
            "sort": sort_by,
            "sortOrder": sort_order,
            "page": page,
            "limit": min(limit, 100),
        }

        if keyword:
            params["keyword"] = keyword

        if max_price is not None:
            params["maxPrice"] = max_price

        if min_price is not None:
            params["minPrice"] = min_price

        return self.get("auctions/search", params=params)

    def list_closing_auctions(
        self,
        hours_left: int = 24,
        limit: int = 50,
    ) -> Optional[List[Dict]]:
        """
        List auctions closing within the next N hours.

        Args:
            hours_left: Only include auctions ending within these hours.
            limit: Maximum results to return.

        Returns:
            List of closing auction items.
        """
        results = self.search_auctions(
            sort_by="endingSoon",
            sort_order="asc",
            page=1,
            limit=limit,
        )

        if not results:
            return None

        items: List[Dict] = results.get("items", []) if isinstance(results, dict) else []
        # Filter by time remaining if the API returns endTime data
        closing: List[Dict] = []
        for item in items:
            end_time_str = item.get("endTime") or item.get("closeDate")
            if end_time_str:
                try:
                    # Try to parse ISO format
                    end_time = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
                    from datetime import timezone
                    if end_time.tzinfo is None:
                        end_time = end_time.replace(tzinfo=timezone.utc)
                    now_utc = datetime.now(timezone.utc)
                    hours_remaining = (end_time - now_utc).total_seconds() / 3600
                    if 0 < hours_remaining <= hours_left:
                        item["hoursRemaining"] = round(hours_remaining, 1)
                        closing.append(item)
                except (ValueError, TypeError):
                    closing.append(item)
            else:
                closing.append(item)

        return closing[:limit]

    def get_auction_detail(self, auction_id: str) -> Optional[Dict]:
        """
        Get details for a specific auction.

        Args:
            auction_id: The auction identifier.

        Returns:
            Auction detail information.
        """
        return self.get(f"auctions/{auction_id}")

    # ---- Connection Test ----

    def ping(self) -> bool:
        """
        Test API connectivity. Returns True if credentials are valid.
        """
        result = self.get("domains/suggest", params={"query": "test", "max": 1})
        return result is not None

    def __repr__(self):
        env = "SANDBOX" if self.sandbox else "PRODUCTION"
        return f"<GoDaddyAPIClient({env}, key={self.api_key[:8]}...)>"
