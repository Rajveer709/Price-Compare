"""
Test only the search endpoint with all Redis dependencies mocked at the module level.
This is a minimal test that focuses solely on the search endpoint.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

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
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.main import app

# Create a test client
client = TestClient(app)

def test_search_endpoint_only():
    """Test the search endpoint with all Redis dependencies mocked."""
    # Mock the database session
    mock_db = MagicMock()
    mock_db.execute.return_value = MagicMock(
        scalars=MagicMock(
            return_value=MagicMock(
                first=MagicMock(return_value=None)
            )
        )
    )
    
    # Mock the eBay service
    mock_ebay_service = MagicMock()
    mock_ebay_service.search_products = AsyncMock(return_value=[
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
    
    # Patch the dependencies
    with patch('app.api.endpoints.search.get_db', return_value=mock_db), \
         patch('app.api.endpoints.search.ebay_service', mock_ebay_service):
        
        # Make the request
        response = client.get("/api/v1/search?query=laptop")
        
        # Basic assertions
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if data:
            item = data[0]
            assert 'id' in item
            assert 'product_id' in item
            assert 'price' in item
            assert isinstance(item['price'], (int, float))
            assert 'url' in item
            assert item['url'].startswith('http')
        else:
            pytest.fail("Expected at least one result in the response")
