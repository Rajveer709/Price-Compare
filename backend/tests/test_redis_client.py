"""
Test the Redis client in isolation.
"""
import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

# Set test environment variables before any imports
os.environ["TESTING"] = "true"

# Test that Redis client can be mocked before import
def test_redis_client_mocking():
    """Test that we can mock the Redis client before it's imported."""
    # Create a mock Redis class
    class MockRedis:
        def __init__(self, *args, **kwargs):
            self.data = {}
        
        async def get(self, key):
            return self.data.get(key)
        
        async def set(self, key, value, ex=None):
            self.data[key] = value
            return True
        
        async def ping(self):
            return True
        
        async def close(self):
            pass
    
    # Patch the Redis client before importing our module
    with patch('redis.Redis', new=MockRedis):
        # Now import the Redis client
        from app.core.redis_client import get_redis_client, init_redis
        
        # Test that we can get a Redis client
        redis_client = init_redis()
        assert redis_client is not None
        
        # Test basic operations
        assert redis_client.ping() is True
        assert redis_client.set("test_key", "test_value") is True
        assert redis_client.get("test_key") == "test_value"

# Test the Redis client with the actual implementation
def test_redis_client_real():
    """Test the Redis client with the actual implementation."""
    # Skip this test if we're not connected to a real Redis instance
    if os.getenv("REDIS_DISABLED", "true").lower() == "true":
        pytest.skip("Redis is disabled")
    
    from app.core.redis_client import get_redis_client, init_redis
    
    # Initialize Redis
    redis_client = init_redis()
    assert redis_client is not None
    
    try:
        # Test basic operations
        assert redis_client.ping() is True
        assert redis_client.set("test_key", "test_value") is True
        assert redis_client.get("test_key") == "test_value"
    finally:
        # Clean up
        redis_client.delete("test_key")
        redis_client.close()
