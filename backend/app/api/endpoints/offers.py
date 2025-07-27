from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...database import get_db
from app import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.Offer)
def create_offer(offer: schemas.OfferCreate, db: Session = Depends(get_db)):
    # Check if product exists
    db_product = db.query(models.Product).filter(models.Product.id == offer.product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Calculate discount if original_price is provided
    if offer.original_price and offer.original_price > offer.price:
        offer_dict = offer.dict()
        offer_dict["discount"] = round((1 - (offer.price / offer.original_price)) * 100, 2)
        db_offer = models.Offer(**offer_dict)
    else:
        db_offer = models.Offer(**offer.dict())
    
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return db_offer

@router.get("/", response_model=List[schemas.Offer])
def read_offers(
    skip: int = 0, 
    limit: int = 100,
    product_id: Optional[int] = None,
    website: Optional[str] = None,
    min_discount: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Offer)
    
    if product_id is not None:
        query = query.filter(models.Offer.product_id == product_id)
    if website is not None:
        query = query.filter(models.Offer.website.ilike(f"%{website}%"))
    if min_discount is not None:
        query = query.filter(models.Offer.discount >= min_discount)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{offer_id}", response_model=schemas.OfferWithProduct)
def read_offer(offer_id: int, db: Session = Depends(get_db)):
    db_offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if db_offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    return db_offer

@router.put("/{offer_id}", response_model=schemas.Offer)
def update_offer(
    offer_id: int, 
    offer: schemas.OfferUpdate, 
    db: Session = Depends(get_db)
):
    db_offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if db_offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    update_data = offer.dict(exclude_unset=True)
    
    # Recalculate discount if price or original_price is updated
    if 'price' in update_data or 'original_price' in update_data:
        new_price = update_data.get('price', db_offer.price)
        new_original_price = update_data.get('original_price', db_offer.original_price)
        
        if new_original_price and new_original_price > new_price:
            update_data['discount'] = round((1 - (new_price / new_original_price)) * 100, 2)
    
    for field, value in update_data.items():
        setattr(db_offer, field, value)
    
    db_offer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_offer)
    return db_offer

@router.delete("/{offer_id}")
def delete_offer(offer_id: int, db: Session = Depends(get_db)):
    db_offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if db_offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    db.delete(db_offer)
    db.commit()
    return {"message": "Offer deleted successfully"}
