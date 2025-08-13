"""
Minimal test file to verify basic functionality with all external dependencies mocked.
"""
import os
import sys
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Set up test environment before any imports
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"

# Create a minimal FastAPI app for testing
app = FastAPI()

# Mock the Redis client
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

# Mock the database session
class MockDBSession:
    def __init__(self):
        self.committed = False
    
    def commit(self):
        self.committed = True
    
    def close(self):
        pass
    
    def execute(self, *args, **kwargs):
        return MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=None))))

# Mock the EBayService
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

# Create a test client
client = TestClient(app)

def test_minimal_search():
    """Minimal test to verify the search endpoint works with all dependencies mocked."""
    # Mock all external dependencies
    with patch('app.core.redis_client.Redis', new=MockRedis), \
         patch('app.services.ebay_service.ebay_service', new=MockEBayService()), \
         patch('app.api.deps.get_db', return_value=MockDBSession()):
        
        # Import the router after setting up mocks
        from app.api.v1.endpoints import search as search_router
        
        # Include the router in our test app
        app.include_router(search_router.router, prefix="/api/v1")
        
        # Make the request
        response = client.get("/api/v1/search?query=laptop")
        
        # Basic assertions
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
        if response.json():
            first_item = response.json()[0]
            assert 'id' in first_item
            assert 'product_id' in first_item
            assert 'price' in first_item
            assert 'url' in first_item
