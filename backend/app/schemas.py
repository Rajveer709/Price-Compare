from pydantic import BaseModel, HttpUrl, EmailStr
from typing import List, Optional
from datetime import datetime

# Shared properties
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    category: Optional[str] = None
    price: Optional[float] = None
    source: Optional[str] = None

# Properties to receive on product creation
class ProductCreate(ProductBase):
    pass

# Properties to receive on product update
class ProductUpdate(ProductBase):
    name: Optional[str] = None

# Properties shared by models stored in DB
class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic v2

# Properties to return to client
class Product(ProductInDBBase):
    pass

# Shared Offer properties
class OfferBase(BaseModel):
    product_id: int
    seller: str
    price: float
    original_price: Optional[float] = None
    discount: Optional[float] = None
    url: HttpUrl
    website: str

# Properties to receive on offer creation
class OfferCreate(OfferBase):
    pass

# Properties to receive on offer update
class OfferUpdate(OfferBase):
    product_id: Optional[int] = None
    seller: Optional[str] = None
    price: Optional[float] = None
    url: Optional[HttpUrl] = None
    website: Optional[str] = None

# Properties shared by models stored in DB
class OfferInDBBase(OfferBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic v2

# Properties to return to client
class Offer(OfferInDBBase):
    pass

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
