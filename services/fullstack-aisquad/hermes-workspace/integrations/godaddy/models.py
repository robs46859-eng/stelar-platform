"""
GoDaddy API Data Models

Pydantic models for validating GoDaddy API responses.
"""

from __future__ import annotations

from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator


class GoDaddyPricing(BaseModel):
    """Pricing information for a single domain action."""

    currency: str = "USD"
    regular: Optional[float] = None
    discount: Optional[float] = None
    promo: Optional[float] = None
    renew: Optional[float] = None

    @field_validator("currency", mode="before")
    @classmethod
    def uppercase_currency(cls, v: str) -> str:
        return v.upper() if isinstance(v, str) else v


class DomainAvailability(BaseModel):
    """Domain availability check result."""

    domain: str
    available: bool
    status: str = "unknown"
    price: Optional[GoDaddyPricing] = None
    tld: Optional[str] = None

    @field_validator("tld", mode="before")
    @classmethod
    def extract_tld(cls, v: str, info) -> Optional[str]:
        if v:
            return v
        domain = info.data.get("domain", "")
        if "." in domain:
            return domain.split(".")[-1]
        return v


class DomainSuggestion(BaseModel):
    """A suggested domain name with metadata."""

    domain: str
    tld: Optional[str] = None
    available: bool = True
    price: Optional[GoDaddyPricing] = None
    type: str = "suggestion"  # exact, suggestion
    length: Optional[int] = None

    def __repr__(self):
        status = "AVAILABLE" if self.available else "TAKEN"
        return f"<{self.domain} [{status}] - ${self.price.regular if self.price else 'N/A'}>"


class AuctionItem(BaseModel):
    """Domain auction listing item."""

    domain: str
    domain_id: Optional[str] = None
    current_bid: Optional[float] = Field(None, alias="currentBid")
    starting_price: Optional[float] = Field(None, alias="startingPrice")
    buy_now_price: Optional[float] = Field(None, alias="buyNowPrice")
    bid_count: int = Field(0, alias="bidCount")
    end_time: Optional[datetime] = Field(None, alias="endTime")
    hours_remaining: Optional[float] = None
    auction_type: str = "auction"
    featured: bool = False

    class Config:
        populate_by_name = True

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        if self.end_time:
            data["endTime"] = self.end_time.isoformat()
        return data


class AuctionSearchResult(BaseModel):
    """Paginated auction search results."""

    items: List[AuctionItem] = []
    total: int = 0
    page: int = 1
    limit: int = 25
    total_pages: int = Field(0, alias="totalPages")

    class Config:
        populate_by_name = True

    @property
    def has_more(self) -> bool:
        return self.page < self.total_pages


class DomainDetails(BaseModel):
    """Detailed domain information."""

    domain: str
    status: str = "unknown"
    expires: Optional[datetime] = None
    created: Optional[datetime] = None
    renew_auto: bool = False
    locked: bool = False
    nameservers: Optional[List[str]] = None
    contacts: Optional[dict] = None


class PricingLookup(BaseModel):
    """TLD pricing data from GoDaddy."""

    tld: str
    currency: str = "USD"
    period_years: int = 1
    action: str = "purchase"
    regular_price: Optional[float] = Field(None, alias="regularPrice")
    discount_price: Optional[float] = Field(None, alias="discountPrice")

    class Config:
        populate_by_name = True


def parse_auctions_response(raw: dict) -> AuctionSearchResult:
    """Parse raw API response into an AuctionSearchResult."""
    items_data = raw.get("items", [])
    items = [AuctionItem.model_validate(item) for item in items_data if isinstance(item, dict)]

    return AuctionSearchResult(
        items=items,
        total=raw.get("total", 0),
        page=raw.get("page", 1),
        limit=raw.get("limit", 25),
        total_pages=raw.get("totalPages", 0),
    )


def parse_suggestions_response(raw: list | dict) -> list[DomainSuggestion]:
    """Parse raw API response into DomainSuggestions list."""
    if isinstance(raw, dict):
        raw = raw.get("items", raw.get("domains", [raw]))
    if not isinstance(raw, list):
        return []

    suggestions = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        price_data = item.get("price")
        pricing = None
        if isinstance(price_data, dict):
            pricing = GoDaddyPricing.model_validate(price_data)

        suggestions.append(
            DomainSuggestion(
                domain=item.get("domain", ""),
                tld=item.get("tld"),
                available=item.get("available", True),
                price=pricing,
                type=item.get("type", "suggestion"),
                length=item.get("length"),
            )
        )
    return suggestions
