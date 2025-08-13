"""
Comprehensive test suite for the search endpoint with all Redis dependencies mocked.
This test focuses on the search endpoint with various test cases.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timedelta

# Set test environment variables before any imports
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"

# Mock Redis at the module level before any imports
class MockRedis:
    def __init__(self, *args, **kwargs):
        self.data = {}
    
    async def get(self, key):
        return self.data.get(key)
    
    async def set(self, key, value, ex=None):
        self.data[key] = value
        return True
    
    async def execute_command(self, *args, **kwargs):
        return True
    
    async def close(self):
        pass

# Apply the Redis mock at the module level
sys.modules['redis'] = MagicMock()
sys.modules['redis'].Redis = MockRedis

# Now import FastAPI and our app
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app import models, schemas

# Create a test client
client = TestClient(app)

# Test data
SAMPLE_ITEMS = [
    {
        'itemId': '12345',
        'title': 'Test Laptop',
        'price': {'value': 999.99, 'currency': 'USD'},
        'itemWebUrl': 'https://www.ebay.com/itm/12345',
        'sellerInfo': {'username': 'test_seller'},
        'condition': 'NEW',
        'shippingOptions': [{'shippingCost': {'value': 0.0, 'currency': 'USD'}}]
    },
    {
        'itemId': '67890',
        'title': 'Used Laptop',
        'price': {'value': 499.99, 'currency': 'USD'},
        'itemWebUrl': 'https://www.ebay.com/itm/67890',
        'sellerInfo': {'username': 'another_seller'},
        'condition': 'USED',
        'shippingOptions': [{'shippingCost': {'value': 10.0, 'currency': 'USD'}}]
    }
]

# Fixture for mock database
def mock_get_db():
    db = MagicMock(spec=Session)
    db.execute.return_value = MagicMock(
        scalars=MagicMock(
            return_value=MagicMock(
                first=MagicMock(return_value=None)
            )
        )
    )
    return db

# Fixture for mock eBay service
@pytest.fixture
def mock_ebay_service():
    service = MagicMock()
    service.search_products = AsyncMock(return_value=SAMPLE_ITEMS)
    return service

def test_search_basic(mock_ebay_service):
    """Test basic search functionality."""
    with patch('app.api.endpoints.search.get_db', return_value=mock_get_db()), \
         patch('app.api.endpoints.search.ebay_service', mock_ebay_service):
        
        response = client.get("/api/v1/search?query=laptop")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert all('id' in item and 'price' in item for item in data)

def test_search_with_price_filter(mock_ebay_service):
    """Test search with price filters."""
    with patch('app.api.endpoints.search.get_db', return_value=mock_get_db()), \
         patch('app.api.endpoints.search.ebay_service', mock_ebay_service):
        
        # Test min price filter
        response = client.get("/api/v1/search?query=laptop&min_price=500")
        assert response.status_code == 200
        data = response.json()
        assert all(item['price'] >= 500 for item in data)
        
        # Test max price filter
        response = client.get("/api/v1/search?query=laptop&max_price=500")
        assert response.status_code == 200
        data = response.json()
        assert all(item['price'] <= 500 for item in data)

def test_search_pagination_not_supported(mock_ebay_service):
    """Test that pagination parameters are not yet supported."""
    with patch('app.api.endpoints.search.get_db', return_value=mock_get_db()), \
         patch('app.api.endpoints.search.ebay_service', mock_ebay_service):
        
        # Get results without pagination
        response = client.get("/api/v1/search?query=laptop")
        assert response.status_code == 200
        all_results = response.json()
        
        # Try to use pagination parameters (they should be ignored)
        response = client.get("/api/v1/search?query=laptop&skip=1&limit=1")
        assert response.status_code == 200
        results_with_pagination = response.json()
        
        # The endpoint should return all results regardless of pagination parameters
        # since pagination is not yet implemented
        assert len(results_with_pagination) == len(all_results)

@patch('app.api.endpoints.search.ebay_service')
def test_search_error_handling(mock_ebay):
    """Test error handling in the search endpoint."""
    # Test invalid query parameter
    response = client.get("/api/v1/search")
    assert response.status_code == 422  # Validation error
    
    # Test service error - the endpoint should return a 500 error
    mock_ebay.search_products = AsyncMock(side_effect=Exception("API Error"))
    with patch('app.api.endpoints.search.get_db', return_value=mock_get_db()):
        response = client.get("/api/v1/search?query=laptop")
        assert response.status_code == 500
        
        # Parse the error response
        error_detail = response.json()
        print(f"Error detail: {error_detail}")  # Debug output
        assert "error" in error_detail
        assert "message" in error_detail["error"]
        assert "error" in error_detail["error"]["message"].lower() or "exception" in error_detail["error"]["message"].lower()
    
    # Test empty results - should return empty list
    mock_ebay.search_products = AsyncMock(return_value=[])
    with patch('app.api.endpoints.search.get_db', return_value=mock_get_db()):
        response = client.get("/api/v1/search?query=nonexistentproduct")
        assert response.status_code == 200
        assert response.json() == []

def test_search_response_structure(mock_ebay_service):
    """Test the structure of the search response."""
    with patch('app.api.endpoints.search.get_db', return_value=mock_get_db()), \
         patch('app.api.endpoints.search.ebay_service', mock_ebay_service):
        
        response = client.get("/api/v1/search?query=laptop")
        assert response.status_code == 200
        data = response.json()
        
        # Verify the response is a list
        assert isinstance(data, list)
        
        if not data:
            pytest.skip("No data returned from search endpoint")
        
        # Check that each item has the expected fields based on the Offer schema
        for item in data:
            # Required fields in OfferBase
            assert 'id' in item, "Missing field: id"
            assert 'product_id' in item, "Missing field: product_id"
            assert 'seller' in item, "Missing field: seller"
            assert 'price' in item, "Missing field: price"
            assert 'url' in item, "Missing field: url"
            assert 'website' in item, "Missing field: website"
            
            # Optional fields in OfferBase
            if 'original_price' in item:
                assert isinstance(item['original_price'], (int, float, type(None))), "original_price must be a number or null"
            if 'discount' in item:
                assert isinstance(item['discount'], (int, float, type(None))), "discount must be a number or null"
            
            # Fields from OfferInDBBase
            assert 'created_at' in item, "Missing field: created_at"
            assert 'updated_at' in item, "Missing field: updated_at"
            
            # Check types of required fields
            assert isinstance(item['id'], int), "id must be an integer"
            assert isinstance(item['product_id'], int), "product_id must be an integer"
            assert isinstance(item['seller'], str), "seller must be a string"
            assert isinstance(item['price'], (int, float)), "price must be a number"
            assert isinstance(item['url'], str), "url must be a string"
            assert item['url'].startswith('http'), "url must be a valid HTTP/HTTPS URL"
            assert isinstance(item['website'], str), "website must be a string"
            
            # Check that website is one of the expected values
            assert item['website'] in ['ebay'], f"Unexpected website value: {item['website']}"
