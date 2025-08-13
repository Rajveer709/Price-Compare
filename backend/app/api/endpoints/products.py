import logging
import logging
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...database import get_db
from app import models
from app.schemas import schemas
from app.schemas.ebay import EBayItemSummary, EBayItemDetail
from ...core.security import get_current_user_optional, get_current_user
from ...core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)
router = APIRouter(dependencies=[])  # No global dependencies

@router.post(
    "/", 
    response_model=schemas.Product, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)]  # Require auth for write operations
)
async def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    try:
        db_product = models.Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating product: {str(e)}"
        )

@router.get("/", response_model=List[schemas.Product])
async def read_products(
    request: Request,
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    # Rate limit: 10 requests per minute for unauthenticated users, 30 for authenticated
    rate_limit_key = f"products:{current_user.id if current_user else request.client.host}"
    rate_limit = 30 if current_user else 10
    await rate_limiter.limit(rate_limit_key, limit=rate_limit, period=60)
    try:
        logger.info("Starting to fetch products...")
        
        # Simple test query
        try:
            from sqlalchemy import text
            test = db.execute(text("SELECT 1")).scalar()
            logger.info(f"Database connection test: {test}")
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise
            
        # Get products
        try:
            query = db.query(models.Product)
            
            # Apply filters if provided
            if category:
                query = query.filter(models.Product.category == category)
            if min_price is not None:
                query = query.filter(models.Product.price >= min_price)
            if max_price is not None:
                query = query.filter(models.Product.price <= max_price)
                
            products = query.offset(skip).limit(limit).all()
            logger.info(f"Found {len(products)} products")
            
            # Convert to list of dicts for debugging
            product_list = []
            for p in products:
                product_dict = {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'category': p.category,
                    'price': p.price,
                    'source': p.source,
                    'created_at': p.created_at.isoformat() if p.created_at else None,
                    'updated_at': p.updated_at.isoformat() if p.updated_at else None
                }
                product_list.append(product_dict)
            
            logger.debug(f"Products: {product_list[:2]}")  # Log first 2 products
            return products
            
        except Exception as e:
            logger.error(f"Error querying products: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving products: {str(e)}"
            )
            
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other exceptions
        logger.error(f"Unexpected error in read_products: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/{product_id}", response_model=schemas.Product)
async def read_product(product_id: int, db: Session = Depends(get_db)):
    try:
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if db_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return db_product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving product: {str(e)}"
        )

@router.put(
    "/{product_id}", 
    response_model=schemas.Product,
    dependencies=[Depends(get_current_user)]  # Require auth for write operations
)
async def update_product(
    product_id: int, 
    product_update: schemas.ProductUpdate, 
    db: Session = Depends(get_db)
):
    try:
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if db_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        
        update_data = product_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_product, key, value)
        
        db_product.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_product)
        return db_product
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating product: {str(e)}"
        )

@router.delete(
    "/{product_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_user)]  # Require auth for write operations
)
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    try:
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if db_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        
        db.delete(db_product)
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting product: {str(e)}"
        )
