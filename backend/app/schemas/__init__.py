"""
Schemas package for the application.
This module exports all schema-related classes and functions.
"""

# Import base schemas first to avoid circular imports
from .base import (
    ProductBase, ProductCreate, ProductUpdate, ProductInDBBase,
    OfferBase, OfferCreate, OfferUpdate, OfferInDBBase,
    UserBase, UserCreate, UserLogin
)

# Import composite schemas
from .schemas import (
    Product, Offer, ProductWithOffers, OfferWithProduct, User, Token
)

# Import eBay schemas
from .ebay import (
    EBayPrice,
    EBayImage,
    EBaySeller,
    EBayShippingOption,
    EBayItemSummary,
    EBayItemDetail,
    EBaySearchResponse,
    EBayProductDetail,
    EBayWatchlistItem,
    EBaySearchRequest
)

# Re-export everything
__all__ = [
    # Main schemas
    'ProductBase', 'ProductCreate', 'ProductUpdate', 'ProductInDBBase', 'Product',
    'OfferBase', 'OfferCreate', 'OfferUpdate', 'OfferInDBBase', 'Offer',
    'ProductWithOffers', 'OfferWithProduct',
    'UserBase', 'UserCreate', 'UserLogin', 'User', 'Token',
    
    # eBay schemas
    'EBayPrice',
    'EBayImage',
    'EBaySeller',
    'EBayShippingOption',
    'EBayItemSummary',
    'EBayItemDetail',
    'EBaySearchResponse',
    'EBayProductDetail',
    'EBayWatchlistItem',
    'EBaySearchRequest'
]
