"""
Test the search endpoint function directly with all dependencies mocked.
"""
import os
import pytest
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime

# Set test environment variables before any imports
os.environ["TESTING"] = "true"

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

# Import the search function after setting up mocks
from app.api.endpoints.search import search_products

@pytest.mark.asyncio
async def test_search_products():
    """Test the search_products function with all dependencies mocked."""
    # Create mock dependencies
    db = mock_get_db()
    ebay_service = MockEBayService()
    
    # Call the function directly with mocked dependencies
    result = await search_products(
        query="laptop",
        min_price=None,
        max_price=None,
        min_rating=None,
        min_discount=None,
        db=db,
        ebay_service=ebay_service
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
