from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from .models import Base, Product, Offer, User  # Import models from models.py

# Load environment variables
load_dotenv()

# Database URL configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./price_compare.db")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Drop all tables and recreate them
def create_tables():
    """Drop and recreate all tables in the database."""
    try:
        # Drop all tables first
        Base.metadata.drop_all(bind=engine)
        print("Dropped all existing tables")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Successfully created all tables")
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Available tables: {tables}")
        
        # Verify columns in products table
        if 'products' in tables:
            columns = [col['name'] for col in inspector.get_columns('products')]
            print(f"Columns in 'products' table: {columns}")
            
    except Exception as e:
        error_msg = f"Error initializing database: {str(e)}"
        print(error_msg)
        raise RuntimeError(error_msg) from e
