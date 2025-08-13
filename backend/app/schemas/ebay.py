from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class EBayPrice(BaseModel):
    """eBay price information"""
    value: float = Field(..., description="The numeric price value")
    currency: str = Field("USD", description="The currency of the price")
    formatted_price: Optional[str] = Field(None, description="Formatted price string")

class EBayImage(BaseModel):
    """eBay product image information"""
    url: Optional[HttpUrl] = Field(None, description="URL of the image")
    width: Optional[int] = Field(None, description="Image width in pixels")
    height: Optional[int] = Field(None, description="Image height in pixels")

class EBaySeller(BaseModel):
    """eBay seller information"""
    username: Optional[str] = Field(None, description="Seller's username")
    feedback_score: Optional[int] = Field(None, description="Seller's feedback score")
    feedback_percentage: Optional[float] = Field(None, description="Seller's positive feedback percentage")

class EBayShippingOption(BaseModel):
    """eBay shipping option"""
    shipping_cost: Optional[EBayPrice] = Field(None, description="Shipping cost")
    shipping_service: Optional[str] = Field(None, description="Shipping service name")
    max_delivery_date: Optional[datetime] = Field(None, description="Estimated maximum delivery date")

class EBayItemSummary(BaseModel):
    """eBay item summary information"""
    item_id: str = Field(..., alias="itemId", description="eBay item ID")
    title: str = Field(..., description="Item title")
    price: EBayPrice = Field(..., description="Current price")
    image: Optional[EBayImage] = Field(None, description="Primary image")
    item_web_url: Optional[HttpUrl] = Field(None, alias="itemWebUrl", description="eBay item URL")
    condition: Optional[str] = Field(None, description="Item condition")
    condition_id: Optional[str] = Field(None, alias="conditionId", description="eBay condition ID")
    seller: Optional[EBaySeller] = Field(None, description="Seller information")
    shipping_options: Optional[List[EBayShippingOption]] = Field(
        None, 
        alias="shippingOptions",
        description="Available shipping options"
    )
    buying_options: Optional[List[str]] = Field(
        None,
        alias="buyingOptions",
        description="Available buying options (e.g., 'FIXED_PRICE', 'AUCTION')"
    )
    item_creation_date: Optional[datetime] = Field(
        None,
        alias="itemCreationDate",
        description="When the item was listed on eBay"
    )
    item_end_date: Optional[datetime] = Field(
        None,
        alias="itemEndDate",
        description="When the item listing ends"
    )
    item_affiliate_web_url: Optional[HttpUrl] = Field(
        None,
        alias="itemAffiliateWebUrl",
        description="Affiliate URL for this item"
    )
    eligible_for_inline_checkout: Optional[bool] = Field(
        None,
        alias="eligibleForInlineCheckout",
        description="Whether the item is eligible for inline checkout"
    )

class EBayItemDetail(EBayItemSummary):
    """Detailed eBay item information"""
    description: Optional[str] = Field(None, description="Item description (HTML)")
    category_path: Optional[str] = Field(None, alias="categoryPath", description="Category path")
    category_id: Optional[str] = Field(None, alias="categoryId", description="eBay category ID")
    brand: Optional[str] = Field(None, description="Brand name")
    mpn: Optional[str] = Field(None, description="Manufacturer Part Number")
    upc: Optional[List[str]] = Field(None, description="List of UPCs")
    ean: Optional[List[str]] = Field(None, description="List of EANs")
    isbn: Optional[List[str]] = Field(None, description="List of ISBNs")
    gtin: Optional[str] = Field(None, description="Global Trade Item Number")
    additional_images: Optional[List[EBayImage]] = Field(
        None,
        alias="additionalImages",
        description="Additional product images"
    )
    item_location: Optional[Dict[str, Any]] = Field(
        None,
        alias="itemLocation",
        description="Location of the item"
    )
    return_terms: Optional[Dict[str, Any]] = Field(
        None,
        alias="returnTerms",
        description="Return policy information"
    )
    estimated_availabilities: Optional[List[Dict[str, Any]]] = Field(
        None,
        alias="estimatedAvailabilities",
        description="Estimated availability information"
    )
    tax: Optional[Dict[str, Any]] = Field(None, description="Tax information")

class EBaySearchResponse(BaseModel):
    """Response model for eBay search"""
    total: int = Field(..., description="Total number of matching items")
    limit: int = Field(..., description="Number of items per page")
    offset: int = Field(..., description="Pagination offset")
    items: List[EBayItemSummary] = Field(..., description="List of matching items")

class EBayProductDetail(EBayItemDetail):
    """Extended product details with watchlist information"""
    in_watchlist: bool = Field(False, description="Whether the item is in the user's watchlist")
    target_price: Optional[float] = Field(None, description="User's target price for this item")
    price_history: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Historical price data"
    )

class EBayWatchlistItem(EBayItemSummary):
    """Watchlist item with additional tracking information"""
    target_price: Optional[float] = Field(None, description="User's target price")
    current_price: EBayPrice = Field(..., description="Current price")
    price_drop: Optional[float] = Field(None, description="Price drop since adding to watchlist")
    added_date: datetime = Field(..., description="When the item was added to watchlist")
    last_checked: datetime = Field(..., description="When the price was last checked")
    price_history: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Historical price data"
    )

class EBaySearchRequest(BaseModel):
    """Request model for eBay search"""
    query: str = Field(..., min_length=1, max_length=100, description="Search query")
    limit: int = Field(20, ge=1, le=200, description="Number of results to return (max 200)")
    offset: int = Field(0, ge=0, description="Pagination offset")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    condition: Optional[str] = Field(None, description="Item condition (e.g., NEW, USED, UNSPECIFIED)")
    sort: Optional[str] = Field("best_match", description="Sort order (best_match, price, price_plus_shipping, newly_listed)")

    @field_validator('sort')
    @classmethod
    def validate_sort(cls, v: str) -> str:
        valid_sorts = ["best_match", "price", "price_plus_shipping", "newly_listed"]
        if v not in valid_sorts:
            raise ValueError(f"Sort must be one of {', '.join(valid_sorts)}")
        return v
