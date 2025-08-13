"""
Test-specific FastAPI application with Redis dependency removed for testing.
"""
import os
import sys
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import pytest

# Set test environment variables before any imports
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a test FastAPI app
test_app = FastAPI()

# Mock database session
class MockDBSession:
    def __init__(self):
        self.committed = False
    
    def commit(self):
        self.committed = True
    
    def close(self):
        pass
    
    def execute(self, *args, **kwargs):
        return MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=None))))

def mock_get_db():
    return MockDBSession()

# Mock EBayService
class MockEBayService:
    def __init__(self):
        self.search_products = AsyncMock(return_value=[
            {
                'itemId': '12345',
                'title': 'Test Laptop',
                'price': {'value': 999.99, 'currency': 'USD'},
                'itemWebUrl': 'https://www.ebay.com/itm/12345',
                'sellerInfo': {'username': 'test_seller'},
                'condition': 'NEW',
                'shippingOptions': [{'shippingCost': {'value': 0.0, 'currency': 'USD'}}]
            }
        ])

# Mock the eBay service
mock_ebay_service = MockEBayService()

# Import and patch the router after setting up mocks
with patch('app.services.ebay_service.ebay_service', mock_ebay_service):
    from app.api.v1.endpoints import search as search_router

# Include the router in our test app
test_app.include_router(search_router.router, prefix="/api/v1")

# Create test client
client = TestClient(test_app)

def test_search_products():
    """Test the search endpoint with all dependencies properly mocked."""
    # Make the request
    response = client.get("/api/v1/search?query=laptop")
    
    # Debug output
    print("\n" + "="*80)
    print(f"Status code: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"Response: {response_data}")
    except Exception as e:
        print(f"Could not parse JSON response: {e}")
        print(f"Raw response: {response.text}")
        raise
    
    # Basic response validation
    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    assert isinstance(response_data, list), f"Expected a list but got: {type(response_data)}"
    
    if response_data:
        first_item = response_data[0]
        required_fields = [
            'id', 'product_id', 'seller', 'price', 
            'url', 'website', 'created_at', 'updated_at'
        ]
        
        for field in required_fields:
            assert field in first_item, f"Missing required field: {field}"
        
        # Additional validations
        assert isinstance(first_item['price'], (int, float)), "Price should be a number"
        assert isinstance(first_item['url'], str) and first_item['url'].startswith('http'), "URL should be a valid HTTP URL"
        assert 'T' in first_item['created_at'], "created_at should be an ISO format datetime"
        assert 'T' in first_item['updated_at'], "updated_at should be an ISO format datetime"
    else:
        pytest.fail("Expected at least one result in the response")
