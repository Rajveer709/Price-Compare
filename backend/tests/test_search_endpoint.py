"""
Test file specifically for the search endpoint with proper async handling.
"""
import os
import sys
import logging
from fastapi.testclient import TestClient
from fastapi import FastAPI
from unittest.mock import patch, MagicMock, AsyncMock, ANY
import pytest
import json

# Configure logging to show debug output
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Set test environment variables before importing the app
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"
os.environ["EBAY_APP_ID"] = "test_app_id"
os.environ["EBAY_CERT_ID"] = "test_cert_id"
os.environ["EBAY_DEV_ID"] = "test_dev_id"

# Mock Redis client before importing the app
class MockRedis:
    def __init__(self, *args, **kwargs):
        self.data = {}
        self.ping = MagicMock(return_value=True)
    
    async def get(self, key):
        return self.data.get(key)
    
    async def set(self, key, value, ex=None):
        self.data[key] = value
        return True
    
    async def execute_command(self, *args, **kwargs):
        return True

# Patch the Redis client before importing the app
with patch('app.core.redis_client.Redis', new=MockRedis):
    # Import the app with test settings after mocking Redis
    from app.main import app

# Create a test client
client = TestClient(app)

# Sample mock response from eBay API
MOCK_EBAY_RESPONSE = [
    {
        'itemId': '12345',
        'title': 'Test Laptop',
        'price': {'value': 999.99, 'currency': 'USD'},
        'itemWebUrl': 'https://www.ebay.com/itm/12345',
        'sellerInfo': {'username': 'test_seller'},
        'condition': 'NEW',
        'shippingOptions': [{'shippingCost': {'value': 0.0, 'currency': 'USD'}}]
    }
]

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

# Mock the database dependency
def mock_get_db():
    return MockDBSession()

def test_search_products():
    """Test the search products endpoint with a simple query."""
    # Mock dependencies
    with patch('app.services.ebay_service.ebay_service') as mock_ebay_service, \
         patch('app.api.deps.get_db', new=mock_get_db):
        
        # Setup mock eBay service
        mock_ebay_service.search_products = AsyncMock(return_value=MOCK_EBAY_RESPONSE)
        
        # Make the request
        response = client.get("/api/v1/search?query=laptop")
        
        # Print response details for debugging
        print("\n" + "="*80)
        print(f"Status code: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"Response: {json.dumps(response_data, indent=2)}")
        except Exception as e:
            print(f"Could not parse JSON response: {e}")
            print(f"Raw response: {response.text}")
            raise
        
        # Verify the response
        assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
        assert isinstance(response_data, list), f"Expected a list but got: {type(response_data)}"
        
        if response_data:  # If we got results
            first_item = response_data[0]
            required_fields = [
                'id', 'product_id', 'seller', 'price', 
                'url', 'website', 'created_at', 'updated_at'
            ]
            
            for field in required_fields:
                assert field in first_item, f"Missing required field: {field}"
            
            # Verify the price is a number
            assert isinstance(first_item['price'], (int, float)), "Price should be a number"
            
            # Verify the URL is a valid string
            assert isinstance(first_item['url'], str) and first_item['url'].startswith('http'), "URL should be a valid HTTP URL"
            
            # Verify the timestamps are in the correct format
            assert 'T' in first_item['created_at'], "created_at should be an ISO format datetime"
            assert 'T' in first_item['updated_at'], "updated_at should be an ISO format datetime"
        else:
            pytest.fail("Expected at least one result in the response")
