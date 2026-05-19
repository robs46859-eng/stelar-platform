"""
Dynadot API Data Models

Pydantic models for validating Dynadot API responses.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class DynadotAvailabilityResult(BaseModel):
    """Domain availability check result."""
    domain: str
    available: bool
    price: Optional[float] = None
    currency: str = "USD"


class DynadotSuggestion(BaseModel):
    """A suggested domain name."""
    domain: str
    price: float = 0.0
    currency: str = "USD"

    def __repr__(self):
        return f"<{self.domain} — ${self.price:.2f}>"


class MarketplaceListing(BaseModel):
    """Premium/aftermarket domain listing."""
    domain: str
    price: float
    currency: str = "USD"
    tld: str = ""
    is_premium: bool = False
    listing_type: str = "marketplace"

    def __repr__(self):
        premium_tag = "[PREMIUM]" if self.is_premium else ""
        return f"<{self.domain} {premium_tag} — ${self.price:.2f}>"


class TldPricing(BaseModel):
    """TLD pricing information."""
    tld: str
    registration: float = 0.0
    renewal: float = 0.0
    transfer: float = 0.0
    currency: str = "USD"


def parse_availability_response(raw: dict) -> List[DynadotAvailabilityResult]:
    """Parse raw Dynadot check response."""
    results = []
    idx = 0
    while f"domain{idx}" in raw:
        results.append(DynadotAvailabilityResult(
            domain=raw.get(f"domain{idx}", ""),
            available=raw.get(f"available{idx}", "no").lower() == "yes",
            price=float(raw.get(f"price{idx}", "0")) if raw.get(f"price{idx}") != "0" else None,
            currency=raw.get(f"price_currency{idx}", "USD"),
        ))
        idx += 1
    return results


def parse_marketplace_response(raw: dict) -> List[MarketplaceListing]:
    """Parse raw Dynadot marketplace search response."""
    listings = []
    idx = 0
    while f"domain{idx}" in raw:
        listings.append(MarketplaceListing(
            domain=raw.get(f"domain{idx}", ""),
            price=float(raw.get(f"price{idx}", "0")),
            currency=raw.get(f"currency{idx}", "USD"),
            tld=raw.get(f"tld{idx}", ""),
            is_premium=raw.get(f"is_premium{idx}", "no").lower() == "yes",
            listing_type=raw.get(f"listing_type{idx}", "marketplace"),
        ))
        idx += 1
    return listings


def parse_pricing_response(raw: dict) -> List[TldPricing]:
    """Parse raw Dynadot pricing response."""
    prices = []
    idx = 0
    while f"tld{idx}" in raw:
        prices.append(TldPricing(
            tld=raw.get(f"tld{idx}", ""),
            registration=float(raw.get(f"registration_price{idx}", "0")),
            renewal=float(raw.get(f"renewal_price{idx}", "0")),
            transfer=float(raw.get(f"transfer_price{idx}", "0")),
            currency=raw.get(f"currency{idx}", "USD"),
        ))
        idx += 1
    return prices
