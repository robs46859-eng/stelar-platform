"""
Dynadot API Client Wrapper

Provides a unified interface to the Dynadot API v2 for:
- Domain search and availability checking
- Domain pricing lookup by TLD
- Marketplace listing discovery
- Rate limit management with exponential backoff

API Documentation: https://www.dynadot.com/domain/api2/documentation
"""

import os
import time
import logging
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from urllib.parse import urlencode

logger = logging.getLogger(__name__)


class DynadotRateLimiter:
    """Handles rate limiting for free tier (100 req/hour)."""

    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: List[float] = []

    def _cleanup_old_requests(self):
        now = time.time()
        cutoff = now - self.window_seconds
        self.requests = [t for t in self.requests if t > cutoff]

    def wait_if_needed(self):
        self._cleanup_old_requests()
        if len(self.requests) >= self.max_requests:
            wait_time = self.requests[0] + self.window_seconds - time.time()
            if wait_time > 0:
                logger.debug(f"Rate limit reached, waiting {wait_time:.2f}s")
                time.sleep(wait_time)
                self._cleanup_old_requests()

    def record_request(self):
        self.requests.append(time.time())


class DynadotAPIClient:
    """
    Wrapper for Dynadot API v2.

    Requires DYNADOT_API_KEY environment variable.
    """

    BASE_URL = "https://www.dynadot.com"

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: int = 30,
        max_retries: int = 3,
        rate_limit: int = 100,
    ):
        self.api_key = api_key or os.environ.get("DYNADOT_API_KEY", "")
        self.timeout = timeout
        self.max_retries = max_retries
        self.rate_limiter = DynadotRateLimiter(max_requests=rate_limit, window_seconds=3600)

        if not self.api_key:
            logger.warning("No Dynadot API key provided. API calls will fail.")

    def _request(
        self,
        command: str,
        params: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """Make an API request with retry and rate limit handling."""
        base_params = {"command": command, "key": self.api_key}
        if params:
            base_params.update(params)

        url = f"{self.BASE_URL}/domain/api2"

        for attempt in range(1, self.max_retries + 1):
            self.rate_limiter.wait_if_needed()
            self.rate_limiter.record_request()

            try:
                response = requests.get(
                    url, params=base_params, timeout=self.timeout,
                    headers={"User-Agent": "Hermes-Domain-Hunter/1.0"}
                )

                # 429 rate limit
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    logger.warning(f"Rate limited, waiting {retry_after}s")
                    time.sleep(retry_after)
                    continue

                if response.status_code == 401:
                    logger.error("Dynadot API authentication failed. Check API key.")
                    return None

                response.raise_for_status()

                # Dynadot returns plain text for some endpoints
                content_type = response.headers.get("Content-Type", "")
                if "json" in content_type:
                    return response.json()

                # Plain text response - parse it
                text = response.text.strip()
                if text.startswith("{"):
                    import json
                    return json.loads(text)

                # Parse key=value format
                result = {}
                for line in text.split("\n"):
                    if "=" in line:
                        k, v = line.split("=", 1)
                        result[k.strip()] = v.strip()
                return result if result else None

            except requests.exceptions.Timeout:
                wait = 2 ** attempt
                logger.warning(f"Timeout (attempt {attempt}/{self.max_retries}), retrying in {wait}s")
                time.sleep(wait)

            except requests.exceptions.RequestException as e:
                logger.error(f"Request error: {e}")
                return None

        logger.error(f"Failed after {self.max_retries} retries")
        return None

    # ---- Domain Availability ----

    def check_available(self, domains: List[str]) -> Optional[List[Dict]]:
        """
        Check up to 20 domains at once.

        Args:
            domains: List of domain names (max 20).

        Returns:
            List of availability results.
        """
        if len(domains) > 20:
            domains = domains[:20]
            logger.warning("Dynadot API limit: checking first 20 domains only")

        param = ",".join(domains)
        result = self._request("check", {"domain0": param})
        if not result:
            return None

        # Parse response format: domain0=buildflow.com, available0=yes, price0=8.99
        results = []
        idx = 0
        while f"domain{idx}" in result:
            domain = result.get(f"domain{idx}", "")
            avail = result.get(f"available{idx}", "no").lower() == "yes"
            price = result.get(f"price{idx}", "0")
            currency = result.get(f"price_currency{idx}", "USD")

            results.append({
                "domain": domain,
                "available": avail,
                "price": float(price) if price != "0" else None,
                "currency": currency,
            })
            idx += 1

        return results

    # ---- Domain Suggestions ----

    def suggest_domains(
        self,
        query: str,
        tlds: Optional[List[str]] = None,
        max_results: int = 30,
    ) -> Optional[List[Dict]]:
        """
        Get domain name suggestions.

        Args:
            query: Keyword for suggestions.
            tlds: TLDs to include (default: all).
            max_results: Max results (default 30).

        Returns:
            List of suggested domains.
        """
        params = {"keyword": query, "max_results": max_results}
        if tlds:
            params["tlds"] = ",".join(tlds)

        result = self._request("suggest", params)
        if not result:
            return None

        # Parse suggestions
        suggestions = []
        idx = 0
        while f"suggested_domain{idx}" in result:
            suggestions.append({
                "domain": result.get(f"suggested_domain{idx}", ""),
                "price": result.get(f"price{idx}", "0"),
            })
            idx += 1

        return suggestions

    # ---- Marketplace ----

    def search_marketplace(
        self,
        keyword: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        tlds: Optional[List[str]] = None,
        sort_by: str = "price",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 50,
    ) -> Optional[List[Dict]]:
        """
        Search Dynadot marketplace for premium/aftermarket domains.

        Args:
            keyword: Filter by keyword in domain name.
            min_price: Minimum price filter.
            max_price: Maximum price filter.
            tlds: TLD filters.
            sort_by: Sort field (price, name, extension).
            sort_order: asc or desc.
            page: Page number.
            limit: Results per page.

        Returns:
            List of marketplace listings.
        """
        params = {
            "search_type": "marketplace",
            "sort_by": sort_by,
            "sort_order": sort_order,
            "page": page,
            "limit": min(limit, 100),
        }

        if keyword:
            params["keyword"] = keyword

        if min_price is not None:
            params["min_price"] = min_price

        if max_price is not None:
            params["max_price"] = max_price

        if tlds:
            params["tlds"] = ",".join(tlds)

        result = self._request("search", params)
        if not result:
            return None

        # Parse marketplace results
        listings = []
        idx = 0
        while f"domain{idx}" in result:
            listings.append({
                "domain": result.get(f"domain{idx}", ""),
                "price": float(result.get(f"price{idx}", "0")),
                "currency": result.get(f"currency{idx}", "USD"),
                "tld": result.get(f"tld{idx}", ""),
                "is_premium": result.get(f"is_premium{idx}", "no").lower() == "yes",
                "listing_type": result.get(f"listing_type{idx}", "marketplace"),
            })
            idx += 1

        return listings

    # ---- Pricing ----

    def get_pricing(self, tlds: Optional[List[str]] = None) -> Optional[List[Dict]]:
        """
        Get registration pricing for TLDs.

        Args:
            tlds: TLDs to check (None = all available).

        Returns:
            List of pricing entries.
        """
        params = {}
        if tlds:
            params["tlds"] = ",".join(tlds)

        result = self._request("pricing", params)
        if not result:
            return None

        prices = []
        idx = 0
        while f"tld{idx}" in result:
            prices.append({
                "tld": result.get(f"tld{idx}", ""),
                "registration": float(result.get(f"registration_price{idx}", "0")),
                "renewal": float(result.get(f"renewal_price{idx}", "0")),
                "transfer": float(result.get(f"transfer_price{idx}", "0")),
                "currency": result.get(f"currency{idx}", "USD"),
            })
            idx += 1

        return prices

    # ---- Connection Test ----

    def ping(self) -> bool:
        """Test API connectivity."""
        result = self._request("get_time")
        return result is not None

    def __repr__(self):
        key_preview = self.api_key[:8] + "..." if len(self.api_key) > 8 else "(none)"
        return f"<DynadotAPIClient(key={key_preview})>"
