"""
Test the search endpoint with Redis and other dependencies mocked at the module level.
This approach ensures that Redis is mocked before any imports that might use it.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

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

# Patch Redis before any imports
with patch('redis.Redis', new=MockRedis):
    # Now import FastAPI and our app
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.main import app
    from app.database import get_db
    from app.services.ebay_service import ebay_service

# Create a test client
client = TestClient(app)

# Mock database session
def mock_get_db():
    db = MagicMock()
    db.execute.return_value = MagicMock(
        scalars=MagicMock(
            return_value=MagicMock(
                first=MagicMock(return_value=None)
            )
        )
    )
    return db

# Mock the eBay service
ebay_service.search_products = AsyncMock(return_value=[
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

def test_search_endpoint():
    """Test the search endpoint with all dependencies mocked."""
    # Replace the get_db dependency with our mock
    app.dependency_overrides[get_db] = mock_get_db
    
    try:
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
    finally:
        # Clean up
        app.dependency_overrides = {}
