"""
Direct test of the search endpoint with all dependencies replaced by mocks.
This test bypasses the normal application initialization.
"""
import os
import sys
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock, patch

# Set test environment variables before any imports
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"

# Create a new FastAPI app for testing
app = FastAPI()

# Mock the database session
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

def test_direct_search():
    """Test the search endpoint with all dependencies directly mocked."""
    # Import the search router after setting up our mocks
    with patch('app.services.ebay_service.ebay_service', new=MockEBayService()):
        from app.api.v1.endpoints import search as search_router
        
        # Replace the router's dependencies
        search_router.router.dependencies = [
            Depends(mock_get_db)
        ]
        
        # Include the router in our test app
        app.include_router(search_router.router, prefix="/api/v1")
        
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
