"""
Amazon PA-API endpoints for the Price Comparison API.

This module provides API endpoints for interacting with Amazon's Product Advertising API (PA-API).
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel, HttpUrl, Field
from app.core.security import get_current_active_user
from app.scrapers.amazon_paapi import AmazonPAAPI, AmazonProduct
from app.core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize PA-API client
paapi_client = AmazonPAAPI(
    access_key=settings.AMAZON_PAAPI_ACCESS_KEY,
    secret_key=settings.AMAZON_PAAPI_SECRET_KEY,
    partner_tag=settings.AMAZON_PARTNER_TAG,
    region=settings.AMAZON_PAAPI_REGION
)

class ProductResponse(BaseModel):
    """Response model for product data."""
    asin: str
    title: str
    price: Optional[float] = None
    currency: str = 'USD'
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    url: str
    features: List[str] = []
    brand: Optional[str] = None
    model: Optional[str] = None
    is_prime: bool = False
    in_stock: bool = True
    rating: Optional[float] = None
    review_count: int = 0
    source: str = 'amazon'

class SearchResponse(BaseModel):
    """Response model for search results."""
    products: List[ProductResponse]
    total_results: int
    page: int
    page_size: int

@router.get("/amazon/search", response_model=SearchResponse)
async def search_amazon_products(
    query: str = Query(..., description="Search query string"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating filter"),
    # current_user: dict = Depends(get_current_active_user)  # Uncomment to require authentication
):
    """
    Search for products on Amazon using PA-API.
    
    Returns a paginated list of products matching the search criteria.
    """
    try:
        # PA-API has a limit of 10 items per request, so we'll make multiple requests if needed
        items_needed = min(page_size, 10)  # Max 10 items per PA-API request
        
        # Make the API request
        products = await paapi_client.search_products(
            keywords=query,
            item_count=items_needed,
            min_price=min_price,
            max_price=max_price,
            min_reviews_rating=min_rating
        )
        
        # Convert to response model
        response_products = [
            ProductResponse(**product.to_dict()) 
            for product in products
        ]
        
        return {
            "products": response_products,
            "total_results": len(response_products),
            "page": page,
            "page_size": len(response_products)
        }
        
    except Exception as e:
        logger.error(f"Error searching Amazon products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search Amazon products"
        )

@router.get("/amazon/products/{asin}", response_model=ProductResponse)
async def get_amazon_product(
    asin: str,
    # current_user: dict = Depends(get_current_active_user)  # Uncomment to require authentication
):
    """
    Get product details by ASIN (Amazon Standard Identification Number).
    """
    try:
        product = await paapi_client.get_product(asin)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
            
        return ProductResponse(**product.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Amazon product {asin}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch product details"
        )

@router.get("/amazon/deals", response_model=SearchResponse)
async def get_amazon_deals(
    category: Optional[str] = Query(None, description="Product category"),
    min_discount: Optional[float] = Query(20, ge=0, le=100, description="Minimum discount percentage"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    # current_user: dict = Depends(get_current_active_user)  # Uncomment to require authentication
):
    """
    Get current deals from Amazon.
    
    This endpoint returns products with discounts, optionally filtered by category.
    """
    try:
        # In a real implementation, we would use PA-API's deals functionality
        # For now, we'll use search with filters as a workaround
        query = f"{category or ''} on sale"
        products = await paapi_client.search_products(
            keywords=query,
            item_count=min(page_size, 10),
            min_reviews_rating=4.0  # Only show highly-rated deals by default
        )
        
        # Filter products with discount (original_price > price)
        deals = [
            p for p in products 
            if p.original_price and p.price and 
               ((p.original_price - p.price) / p.original_price * 100) >= min_discount
        ]
        
        # Convert to response model
        response_products = [
            ProductResponse(**product.to_dict()) 
            for product in deals
        ]
        
        return {
            "products": response_products,
            "total_results": len(response_products),
            "page": page,
            "page_size": len(response_products)
        }
        
    except Exception as e:
        logger.error(f"Error fetching Amazon deals: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch Amazon deals"
        )
