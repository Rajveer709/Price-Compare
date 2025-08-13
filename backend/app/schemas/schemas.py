"""
Composite schemas for the application.
This module contains composite Pydantic models that depend on base models.
"""

from typing import List
from pydantic import BaseModel, EmailStr
from datetime import datetime

from .base import (
    Product, ProductInDBBase, ProductCreate, ProductUpdate, ProductBase,
    Offer, OfferInDBBase, OfferCreate, OfferUpdate, OfferBase,
    UserBase, UserCreate, UserLogin
)

# Additional schemas for API responses
class ProductWithOffers(Product):
    offers: List[Offer] = []

class OfferWithProduct(Offer):
    product: Product

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic v2

class Token(BaseModel):
    access_token: str
    token_type: str
