from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

# Example Product model (customize fields as needed)
class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(Float)
    link = Column(String)
    image = Column(String)
    source = Column(String)  # e.g., 'amazon', 'flipkart'
    rating = Column(Float, nullable=True)
    discount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Add more models as needed for your app (e.g., Offer, User, etc.)
