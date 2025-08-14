from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from urllib.parse import urlparse
import logging
import traceback
import json

from app.database import get_db
from app import models
from app.schemas import schemas
from app.services.ebay_service import get_ebay_service, EBayService
from app.core.config import settings
from app.schemas.ebay import EBayItemSummary

router = APIRouter()
logger = logging.getLogger(__name__)

# Removed create_default_offer function as it's only used for mock data

@router.get("/search", response_model=List[schemas.Offer])
async def search_products(
    query: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    min_discount: Optional[float] = None,
    db: Session = Depends(get_db),
    ebay_service: EBayService = Depends(get_ebay_service)
):
    """
    Search for products on eBay and return offers (cheapest first).
    Returns empty list if no products found.
    """
    logger.info(f"[SEARCH] Starting search for query: {query}")
    logger.info(f"[SEARCH] Filters - min_price: {min_price}, max_price: {max_price}, min_rating: {min_rating}, min_discount: {min_discount}")
    
    try:
        # Get search results from eBay service
        try:
            logger.info("[SEARCH] Starting search with query: %s", query)
            logger.debug("[SEARCH] eBay service instance: %s", type(ebay_service).__name__)
            
            # Log the type and methods of ebay_service for debugging
            logger.debug("[SEARCH] eBay service methods: %s", dir(ebay_service))
            
            # Log eBay service initialization status
            logger.info("[SEARCH] eBay service initialized: %s", ebay_service is not None)
            
            # Try to get search results
            search_start = datetime.now()
            logger.info("[SEARCH] Calling ebay_service.search_products...")
            
            try:
                # Attempt to get search results
                search_results = await ebay_service.search_products(query)
                logger.info("[SEARCH] Successfully retrieved %d results", len(search_results) if search_results else 0)
            except Exception as search_error:
                logger.error("[SEARCH] Error in ebay_service.search_products: %s", str(search_error), exc_info=True)
                raise
            search_duration = (datetime.now() - search_start).total_seconds()
            
            logger.info(
                "[SEARCH] Search completed in %.2f seconds. Found %d results",
                search_duration,
                len(search_results) if search_results else 0
            )
            
            if not search_results:
                logger.warning("[SEARCH] No results returned from eBay service")
                return []
                
            # Log first result for debugging (without sensitive data)
            if search_results and len(search_results) > 0:
                first_result = search_results[0]
                logger.debug(
                    "[SEARCH] First result - Title: %s, Price: %s",
                    first_result.get('title', 'No title'),
                    first_result.get('price', 'No price')
                )
                
        except HTTPException as http_exc:
            # Re-raise HTTP exceptions as they are
            logger.error(
                "[SEARCH] HTTP error during search: %s",
                str(http_exc),
                exc_info=True
            )
            raise
            
        except Exception as e:
            # Log detailed error information
            error_type = type(e).__name__
            error_trace = traceback.format_exc()
            
            logger.error(
                "[SEARCH] Error during eBay search. Type: %s, Message: %s",
                error_type,
                str(e)
            )
            logger.debug("[SEARCH] Full traceback:\n%s", error_trace)
            
            # Return more detailed error information in development
            error_detail = {
                "error": "search_failed",
                "message": str(e),
                "type": error_type,
                "query": query
            }
            
            if settings.DEBUG:
                error_detail["traceback"] = error_trace
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_detail
            )
        
        # Process and validate results
        offers = []
        logger.info(f"[SEARCH] Processing {len(search_results)} search results...")
        
        for i, prod in enumerate(search_results, 1):
            try:
                logger.debug(f"[SEARCH] Processing result {i}/{len(search_results)}")
                
                # Log the structure of the product data for debugging
                logger.debug(f"[SEARCH] Raw product data: {prod}")
                
                # Extract data from the product
                item_id = str(prod.get('itemId', f'unknown_{i}'))
                # Generate a consistent numeric ID from the item_id string
                numeric_id = abs(hash(item_id)) % (10**8)
                
                # Get seller info
                seller_info = prod.get('sellerInfo', {})
                seller = str(seller_info.get('username', 'eBay Seller'))
                
                # Parse price values
                price_value = 0.0
                if isinstance(prod.get('price'), dict):
                    price_value = float(prod['price'].get('value', 0.0))
                else:
                    try:
                        price_value = float(prod.get('price', 0.0))
                    except (TypeError, ValueError):
                        logger.warning(f"[SEARCH] Could not parse price: {prod.get('price')}")
                
                # Parse original price if available
                original_price_value = None
                if 'originalPrice' in prod:
                    if isinstance(prod['originalPrice'], dict):
                        original_price_value = float(prod['originalPrice'].get('value', 0.0))
                    else:
                        try:
                            original_price_value = float(prod['originalPrice'])
                        except (TypeError, ValueError):
                            logger.warning(f"[SEARCH] Could not parse original price: {prod.get('originalPrice')}")
                
                # Calculate discount if we have original price
                discount_value = None
                if original_price_value and original_price_value > 0 and price_value > 0:
                    discount_value = ((original_price_value - price_value) / original_price_value) * 100
                
                # Build the offer dictionary with only the fields that match the Offer model
                offer = {
                    'id': numeric_id,  # Must be an int for the primary key
                    'product_id': numeric_id,  # In a real app, this would reference a product in the database
                    'seller': seller,
                    'price': price_value,
                    'original_price': original_price_value if original_price_value and original_price_value > price_value else None,
                    'discount': float(discount_value) if discount_value else None,
                    'url': str(prod.get('itemWebUrl', f"https://www.ebay.com/itm/{query}")),
                    'website': 'ebay',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                
                logger.debug(f"[SEARCH] Processed offer: {offer}")
                
                # Apply filters
                if (min_price is not None and offer['price'] < min_price) or \
                   (max_price is not None and offer['price'] > max_price) or \
                   (min_rating is not None and 'rating' in offer and offer.get('rating', 0) < min_rating) or \
                   (min_discount is not None and 'discount' in offer and offer.get('discount', 0) < min_discount):
                    logger.debug(f"[SEARCH] Offer filtered out: {offer}")
                    continue
                    
                offers.append(offer)
                    
            except Exception as e:
                logger.error(f"[SEARCH] Error processing product: {e}")
                logger.error(f"[SEARCH] Problematic product data: {prod}")
                logger.error(f"[SEARCH] {traceback.format_exc()}")
                continue
        
        # Sort by price (cheapest first)
        offers.sort(key=lambda x: x['price'])
        logger.info(f"[SEARCH] Returning {len(offers)} offers after filtering")
        
        # If no offers after filtering, return mock data
        if not offers:
            logger.warning("[SEARCH] No valid offers found, returning mock data")
            offers = [create_default_offer(query, i) for i in range(3)]
        
        # Convert dictionaries to Offer models to ensure validation
        try:
            validated_offers = [schemas.Offer(**offer) for offer in offers]
            return validated_offers
        except HTTPException as he:
            # Re-raise HTTP exceptions as-is
            logger.error("[SEARCH] HTTP error in search: %s", str(he.detail), exc_info=True)
            raise
        except Exception as e:
            logger.error("[SEARCH] Unexpected error searching products: %s", str(e), exc_info=True)
            logger.error("[SEARCH] Error type: %s", type(e).__name__)
            import traceback
            logger.error("[SEARCH] Traceback: %s", traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "search_error",
                    "message": f"An error occurred while searching for products: {str(e)}",
                    "type": type(e).__name__
                }
            )
        
    except Exception as e:
        error_msg = f"[SEARCH] Unexpected error in search_products: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while searching for products. Please try again later."
        )


@router.get("/products/compare/{product_id}", response_model=List[schemas.Offer])
async def compare_product_prices(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Compare prices for a specific product across different sites.
    Returns all available offers for the given product.
    """
    offers = db.query(models.Offer).filter(
        models.Offer.product_id == product_id
    ).order_by(models.Offer.price).all()
    
    if not offers:
        raise HTTPException(
            status_code=404,
            detail="No offers found for this product"
        )
    
    return offers
