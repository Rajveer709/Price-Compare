"""
Simplified API test file to verify basic API functionality.
"""
from fastapi.testclient import TestClient
from fastapi import FastAPI
from unittest.mock import MagicMock, patch
import pytest
import logging

# Configure logging to show debug output
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Import the app after setting up mocks to ensure they're in place
with patch('app.core.redis_client.get_redis_client') as mock_redis:
    # Mock Redis client
    mock_redis.return_value = MagicMock()
    mock_redis.return_value.ping.return_value = True
    
    # Now import the real app with the mocked Redis
    from app.main import app as real_app

# Create a test client with debug enabled
app = FastAPI(debug=True)
app.include_router(real_app.router)
client = TestClient(app)

# Apply Redis mock to all tests
@pytest.fixture(autouse=True)
def mock_redis_fixture():
    with patch('app.core.redis_client.get_redis_client') as mock_redis:
        # Mock Redis client
        mock_redis.return_value = MagicMock()
        mock_redis.return_value.ping.return_value = True
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

# Test with a simple search query
def test_search_products():
    """Test the search products endpoint with a simple query."""
    try:
        # Enable traceback for debugging
        import traceback
        import sys
        
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
        
        # Print headers for additional context
        print("\nResponse headers:")
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
            
        # Print request details
        print("\nRequest details:")
        print(f"  URL: {response.url}")
        print(f"  Method: {response.request.method}")
        print("  Request headers:")
        for header, value in response.request.headers.items():
            print(f"    {header}: {value}")
        
        # We expect either a 200 with results or a 429 if rate limited
        assert response.status_code in [200, 429], f"Unexpected status code: {response.status_code}"
        if response.status_code == 200:
            assert isinstance(response.json(), list), f"Expected a list but got: {type(response.json())}"
            
    except Exception as e:
        # Print the full traceback for any unexpected errors
        print("\n" + "="*80)
        print("Unexpected error during test:")
        traceback.print_exc()
        print("="*80 + "\n")
        raise  # Re-raise the exception to fail the test
