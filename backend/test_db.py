import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database configuration
from app.database import DATABASE_URL, engine
from app.models import Base

def test_database_connection():
    """Test database connection and list all tables"""
    try:
        # Create a new session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Test connection with a simple query
        result = session.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        
        # Get table information using SQL
        print("\n📊 Database tables:")
        if 'sqlite' in str(engine.url):
            # SQLite specific query to get tables
            tables_result = session.execute(
                text("SELECT name FROM sqlite_master WHERE type='table';")
            )
            tables = [row[0] for row in tables_result.fetchall()]
            
            for table in tables:
                print(f"- {table}")
                
                # Count rows in each table
                try:
                    count = session.execute(
                        text(f'SELECT COUNT(*) FROM "{table}"')
                    ).scalar()
                    print(f"  Rows: {count}")
                except Exception as e:
                    print(f"  Could not count rows: {str(e)}")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔍 Testing database connection...")
    test_database_connection()
