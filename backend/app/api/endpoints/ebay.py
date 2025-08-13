from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import logging

from ...database import get_db
from ...services.ebay_service import get_ebay_service
from ...models import SearchHistory, Product, PriceSnapshot, Watch
from ...schemas.ebay import (
    EBaySearchResponse, EBayProductDetail, EBayWatchlistItem,
    EBayPrice, EBayImage, EBaySeller, EBayShippingOption,
    EBayItemSummary, EBayItemDetail, EBaySearchRequest
)
from ...core.security import get_current_user_optional, get_current_user
from ...core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)
# No global dependencies - make all endpoints public by default
# and add auth only where needed
router = APIRouter(dependencies=[])

@router.get("/search", response_model=EBaySearchResponse)
async def search_ebay(
    request: Request,  # Required for rate limiting
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=200, description="Number of results to return (max 200)"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    condition: Optional[str] = Query(None, description="Item condition (e.g., NEW, USED, UNSPECIFIED)"),
    sort: Optional[str] = Query("best_match", description="Sort order (best_match, price, price_plus_shipping, newly_listed)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    Search for products on eBay
    
    Rate limits:
    - Authenticated users: 300 requests per minute
    - Unauthenticated users: 60 requests per minute
    - Includes proper rate limit headers in responses
    """
    # Apply rate limiting based on authentication status
    limit_type = "authenticated" if current_user else "public"
    await rate_limiter.limit(
        request=request,
        key_prefix="search",
        limit_type=limit_type
    )
    
    try:
        
        # Prepare filters
        filters = {}
        if min_price is not None:
            filters["filter=price:[{min_price}] "] = ""
        if max_price is not None:
            filters["filter=price:[..{max_price}]"] = ""
        if condition:
            filters["filter=conditionIds:{condition}"] = ""
        if sort:
            filters["sort="] = sort
        
        # Call eBay service
        ebay_service = get_ebay_service()
        result = await ebay_service.search_products(
            query=q,
            limit=limit,
            offset=offset,
            filters=filters
        )
        
        # Log search history only for authenticated users
        if current_user and hasattr(current_user, 'id'):
            try:
                search_log = SearchHistory(
                    user_id=current_user.id,
                    query=q,
                    results_count=len(result.get("itemSummaries", []))
                )
                db.add(search_log)
                db.commit()
            except Exception as e:
                # Don't fail the request if logging fails
                logger.warning(f"Failed to log search history: {str(e)}")
                db.rollback()
        
        return {
            "total": result.get("total", 0),
            "limit": limit,
            "offset": offset,
            "items": result.get("itemSummaries", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Search service is currently unavailable"
        )

@router.get("/products/{item_id}", response_model=EBayProductDetail)
async def get_ebay_product(
    item_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    Get detailed information about a specific eBay product
    """
    try:
        # Rate limit: 10 requests per minute per user
        await rate_limiter.limit(f"product:{current_user.id}", limit=10, period=60)
        
        # Call eBay service
        ebay_service = get_ebay_service()
        product = await ebay_service.get_product(item_id)
        
        # Check if product is in watchlist
        watch = db.query(Watch).filter(
            Watch.product_id == item_id,
            Watch.user_id == current_user.id
        ).first()
        
        # Get price history
        price_history = db.query(PriceSnapshot).filter(
            PriceSnapshot.product_id == item_id
        ).order_by(PriceSnapshot.timestamp.desc()).limit(30).all()
        
        return {
            **product,
            "in_watchlist": watch is not None,
            "target_price": watch.target_price if watch else None,
            "price_history": [
                {"price": p.price, "timestamp": p.timestamp}
                for p in price_history
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Product fetch error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or service unavailable"
        )

@router.post(
    "/watch/{item_id}", 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)]  # Require auth for write operations
)
async def add_to_watchlist(
    item_id: str,
    target_price: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add a product to the user's watchlist
    """
    try:
        # First, verify the product exists on eBay
        ebay_service = get_ebay_service()
        product = await ebay_service.get_product(item_id)
        
        # Check if already in watchlist
        existing = db.query(Watch).filter(
            Watch.product_id == item_id,
            Watch.user_id == current_user.id
        ).first()
        
        if existing:
            # Update existing watch
            existing.target_price = target_price
        else:
            # Create new watch
            watch = Watch(
                user_id=current_user.id,
                product_id=item_id,
                target_price=target_price
            )
            db.add(watch)
        
        # Update or create product in our DB
        db_product = db.query(Product).filter(Product.id == item_id).first()
        if not db_product:
            db_product = Product(
                id=item_id,
                title=product.get("title", ""),
                url=product.get("itemAffiliateWebUrl", ""),
                image_url=product.get("image", {}).get("imageUrl", ""),
                current_price=product.get("price", {}).get("value", 0),
                currency=product.get("price", {}).get("currency", "USD")
            )
            db.add(db_product)
        
        db.commit()
        
        return {"status": "success", "message": "Product added to watchlist"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Watchlist error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add product to watchlist"
        )
