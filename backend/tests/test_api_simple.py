"""
Simplified API test file to verify basic API functionality.
"""
import os
import sys
import logging
from fastapi.testclient import TestClient
from fastapi import FastAPI
from unittest.mock import patch, MagicMock, AsyncMock
import pytest

# Configure logging to show debug output
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Set test environment variables before importing the app
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"
os.environ["EBAY_APP_ID"] = "test_app_id"
os.environ["EBAY_CERT_ID"] = "test_cert_id"
os.environ["EBAY_DEV_ID"] = "test_dev_id"

# Import the app with test settings
from app.main import app

# Create a test client
client = TestClient(app)

# Mock the eBay service
@pytest.fixture(autouse=True)
def mock_ebay_service():
    with patch('app.services.ebay_service.ebay_service') as mock_service:
        # Mock the search_products method
        mock_service.search_products = AsyncMock(return_value=[
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
        yield mock_service

# Patch the Redis client to return a mock
@pytest.fixture(autouse=True)
def mock_redis():
    with patch('app.core.redis_client.get_redis_client') as mock_redis:
        # Create a mock Redis client with async methods
        mock_redis.return_value = AsyncMock()
        # Make sure the mock doesn't try to connect to Redis
        mock_redis.return_value.ping.return_value = True
        # Mock other Redis methods that might be called
        mock_redis.return_value.get.return_value = None
        mock_redis.return_value.set.return_value = True
        yield mock_redis

def test_read_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_search_products():
    """Test the search products endpoint with a simple query."""
    try:
        # Make the request
        response = client.get("/api/v1/search?query=laptop")
        
        # Print response details for debugging
        print("\n" + "="*80)
        print(f"Status code: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"Response: {response_data}")
        except Exception as e:
            print(f"Could not parse JSON response: {e}")
            print(f"Raw response: {response.text}")
        
        # We expect a 200 with results
        assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
        
        # Verify the response structure
        response_data = response.json()
        assert isinstance(response_data, list), f"Expected a list but got: {type(response_data)}"
        
        if response_data:  # If we got results
            first_item = response_data[0]
            assert 'id' in first_item
            assert 'product_id' in first_item
            assert 'seller' in first_item
            assert 'price' in first_item
            assert 'url' in first_item
            assert 'website' in first_item
            assert 'created_at' in first_item
            assert 'updated_at' in first_item
            
    except Exception as e:
        # Print the full traceback for any unexpected errors
        print("\n" + "="*80)
        print("Unexpected error during test:")
        import traceback
        traceback.print_exc()
        print("="*80 + "\n")
        raise  # Re-raise the exception to fail the test
