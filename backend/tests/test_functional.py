"""
Functional test of the search endpoint function.
This test directly calls the endpoint function with mocked dependencies.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, AsyncMock

# Set test environment variables before any imports
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"

# Import the search function directly
from app.api.v1.endpoints.search import search_products

# Mock the database session
class MockDBSession:
    def __init__(self):
        self.committed = False
    
    def commit(self):
        self.committed = True
    
    def close(self):
        pass
    
    def execute(self, *args, **kwargs):
        return MagicMock(
            scalars=MagicMock(
                return_value=MagicMock(
                    first=MagicMock(return_value=None)
                )
            )
        )

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

@pytest.mark.asyncio
async def test_search_products_function():
    """Test the search_products function directly with mocked dependencies."""
    # Create mock dependencies
    db = MockDBSession()
    ebay_service = MockEBayService()
    
    # Call the function directly
    result = await search_products(
        query="laptop",
        skip=0,
        limit=10,
        sort=None,
        db=db,
        ebay_service=ebay_service,
        current_user=None
    )
    
    # Verify the result
    assert isinstance(result, list)
    if result:
        item = result[0]
        assert 'id' in item
        assert 'product_id' in item
        assert 'price' in item
        assert isinstance(item['price'], (int, float))
        assert 'url' in item
        assert item['url'].startswith('http')
    else:
        pytest.fail("Expected at least one result in the response")
