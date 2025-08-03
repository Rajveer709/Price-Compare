from sqlalchemy import create_engine, inspect, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./price_compare.db")

def check_database():
    try:
        # Create engine
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
        
        # Create inspector
        inspector = inspect(engine)
        
        # Get all tables
        tables = inspector.get_table_names()
        print("\n=== Database Tables ===")
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"- {table}")
            
            # Get columns for each table
            columns = inspector.get_columns(table)
            print(f"  Columns in {table}:")
            for column in columns:
                print(f"  - {column['name']} ({column['type']})")
                
            # Get sample data (first 2 rows)
            with engine.connect() as conn:
                try:
                    result = conn.execute(text(f"SELECT * FROM {table} LIMIT 2"))
                    rows = result.fetchall()
                    if rows:
                        print(f"  Sample data from {table}:")
                        for i, row in enumerate(rows):
                            print(f"  Row {i+1}: {dict(row._mapping)}")
                    else:
                        print(f"  No data in {table}")
                except Exception as e:
                    print(f"  Error fetching data from {table}: {str(e)}")
            print()
            
    except Exception as e:
        print(f"Error checking database: {str(e)}")
        raise

if __name__ == "__main__":
    print("Checking database...")
    check_database()
    print("\nDatabase check complete.")
