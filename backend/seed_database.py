import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db
from app.models import Product, Offer, PriceSnapshot
from app.core.config import settings
from app.database import Base, engine

def seed_database():
    # Use the engine from database.py
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if we already have products
        if db.query(Product).count() > 0:
            print("Database already has data. Skipping seeding.")
            return
            
        print("Seeding database with sample products...")
        
        # Sample products
        sample_products = [
            {
                "name": "Wireless Bluetooth Headphones",
                "description": "High-quality wireless headphones with noise cancellation",
                "category": "Electronics",
                "price": 99.99,
                "source": "ebay"
            },
            {
                "name": "Smartphone 128GB",
                "description": "Latest smartphone with 128GB storage and 48MP camera",
                "category": "Electronics",
                "price": 699.99,
                "source": "ebay"
            },
            {
                "name": "Laptop Backpack",
                "description": "Water-resistant backpack for 15.6 inch laptops",
                "category": "Accessories",
                "price": 39.99,
                "source": "ebay"
            },
            {
                "name": "Wireless Mouse",
                "description": "Ergonomic wireless mouse with silent click",
                "category": "Electronics",
                "price": 24.99,
                "source": "ebay"
            },
            {
                "name": "Mechanical Keyboard",
                "description": "RGB mechanical keyboard with blue switches",
                "category": "Electronics",
                "price": 89.99,
                "source": "ebay"
            }
        ]
        
        # Add products to database
        for product_data in sample_products:
            # Create product
            product = Product(
                name=product_data["name"],
                description=product_data["description"],
                category=product_data["category"],
                price=product_data["price"],
                source=product_data["source"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(product)
            db.flush()  # Get the product ID
            
            # Create initial price snapshot
            snapshot = PriceSnapshot(
                product_id=product.id,
                price=product_data["price"],
                timestamp=datetime.utcnow()
            )
            db.add(snapshot)
            
            # Create an offer
            offer = Offer(
                product_id=product.id,
                seller="Example Seller",
                price=product_data["price"],
                original_price=product_data["price"] * 1.1,  # 10% discount
                discount=10.0,
                url=f"https://example.com/products/{product.id}",
                website="ebay",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(offer)
        
        # Commit all changes
        db.commit()
        print("Successfully seeded database with sample data!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
