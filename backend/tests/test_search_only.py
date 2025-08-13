"""
Simplified test file focusing only on the search endpoint.
"""
import os
import sys
import logging
import traceback
from fastapi.testclient import TestClient
from fastapi import FastAPI
import pytest

# Configure logging to show debug output
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Set test environment variables before importing the app
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"

# Import the app with test settings
from app.main import app as real_app

# Create a test client with debug enabled
app = FastAPI(debug=True)
app.include_router(real_app.router)
client = TestClient(app)

def test_search_products_simple():
    """Test the search products endpoint with a simple query."""
    try:
        # Make the request
        response = client.get("/api/v1/search?query=test")
        
        # Print response details for debugging
        print("\n" + "="*80)
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Check if the response is successful
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        
        # Check if the response is a list
        data = response.json()
        assert isinstance(data, list), f"Expected a list, got {type(data)}"
        
        # If we have items, check their structure
        if data:
            item = data[0]
            assert "id" in item, f"Item missing 'id' field: {item}"
            assert "title" in item, f"Item missing 'title' field: {item}"
            assert "price" in item, f"Item missing 'price' field: {item}"
            
    except Exception as e:
        # Print the full traceback for any unexpected errors
        print("\n" + "="*80)
        print("Unexpected error during test:")
        traceback.print_exc()
        print("="*80 + "\n")
        raise  # Re-raise the exception to fail the test

if __name__ == "__main__":
    test_search_products_simple()
