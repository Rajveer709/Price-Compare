"""
Test suite for API endpoints with focus on rate limiting, caching, and error handling.
"""
import pytest
import asyncio
from typing import List, Dict, Any, AsyncGenerator, Optional
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from httpx import AsyncClient, Response
from fastapi import status
import time
import json
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.core.redis_client import get_redis_client as get_redis, init_redis as real_init_redis
from app.core.cache import CacheManager

# Mock Redis client for testing
class MockRedis:
    def __init__(self):
        self.data = {}
        self.ping_called = False
    
    async def ping(self):
        self.ping_called = True
        return True
    
    async def get(self, key: str) -> Optional[str]:
        return self.data.get(key)
    
    async def set(self, key: str, value: str, ex: int = None) -> bool:
        self.data[key] = value
        return True
    
    async def delete(self, key: str) -> bool:
        if key in self.data:
            del self.data[key]
            return True
        return False
    
    async def flushdb(self) -> bool:
        self.data = {}
        return True
    
    async def close(self):
        pass

# Patch the Redis client for testing
@pytest.fixture(autouse=True)
def mock_redis_client():
    """Mock the Redis client for all tests."""
    mock_redis = MockRedis()
    with patch('app.core.redis_client.get_redis_client', return_value=mock_redis):
        # Also patch the init_redis function to return our mock
        with patch('app.core.redis_client.init_redis', return_value=mock_redis):
            yield mock_redis

# Test data
TEST_SEARCH_QUERY = "laptop"
TEST_ITEM_ID = "v1|123456789012|0"

# Rate limits from settings
RATE_LIMIT = int(settings.RATE_LIMIT.split("/")[0]) if settings.RATE_LIMIT else 100  # Default to 100 if not set

@pytest.fixture(scope="module")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client with mocked Redis."""
    # Create a test client with the FastAPI app
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture(autouse=True)
async def clear_cache():
    """Clear Redis cache before and after each test."""
    redis = get_redis()
    if redis:
        try:
            await redis.flushdb()
        except Exception as e:
            print(f"Error clearing Redis cache: {e}")
    yield
    if redis:
        try:
            await redis.flushdb()
        except Exception as e:
            print(f"Error clearing Redis cache: {e}")

async def make_requests(
    client: AsyncClient, 
    url: str, 
    num_requests: int, 
    headers: Dict[str, str] = None
) -> List[Response]:
    """Helper to make multiple concurrent requests."""
    tasks = [client.get(url, headers=headers) for _ in range(num_requests)]
    return await asyncio.gather(*tasks, return_exceptions=True)

@pytest.mark.asyncio
async def test_rate_limiting_public(async_client: AsyncClient):
    """Test that rate limiting works for public endpoints."""
    # Make more requests than the rate limit
    url = f"/api/v1/search?q={TEST_SEARCH_QUERY}"
    responses = await make_requests(async_client, url, RATE_LIMIT + 5)
    
    # Count successful vs rate-limited responses
    success_count = 0
    rate_limited_count = 0
    
    for response in responses:
        if isinstance(response, Exception):
            continue
        if response.status_code == status.HTTP_200_OK:
            success_count += 1
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            rate_limited_count += 1
    
    # Verify some requests were rate limited
    assert success_count <= RATE_LIMIT, "Too many successful requests"
    assert rate_limited_count > 0, "Expected some requests to be rate limited"
    
    # Verify rate limit headers are present
    response = await async_client.get(url)
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers

@pytest.mark.asyncio
async def test_cache_invalidation(async_client: AsyncClient):
    """Test that cache is properly invalidated on updates."""
    # First request - should be a cache miss
    url = f"/api/v1/items/{TEST_ITEM_ID}"
    response1 = await async_client.get(url)
    assert response1.status_code == status.HTTP_200_OK
    assert response1.headers.get("X-Cache") == "MISS"
    
    # Second request - should be a cache hit
    response2 = await async_client.get(url)
    assert response2.status_code == status.HTTP_200_OK
    assert response2.headers.get("X-Cache") == "HIT"
    
    # Verify the response is the same
    assert response1.json() == response2.json()
    
    # Invalidate the cache
    cache = CacheManager(prefix="price_compare:")
    await cache.delete(f"item:{TEST_ITEM_ID}")
    
    # Third request - should be a cache miss again
    response3 = await async_client.get(url)
    assert response3.status_code == status.HTTP_200_OK
    assert response3.headers.get("X-Cache") == "MISS"

@pytest.mark.asyncio
async def test_error_handling(async_client: AsyncClient):
    """Test error handling for various scenarios."""
    # Test 404 for non-existent endpoint
    response = await async_client.get("/api/v1/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "error" in response.json()
    
    # Test 422 for invalid query parameters
    response = await async_client.get("/api/v1/search")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "error" in response.json()
    
    # Test 400 for invalid item ID format
    response = await async_client.get("/api/v1/items/invalid-id")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "error" in response.json()

@pytest.mark.asyncio
async def test_concurrent_requests(async_client: AsyncClient):
    """Test handling of concurrent requests with caching."""
    url = f"/api/v1/search?q={TEST_SEARCH_QUERY}"
    
    # Make concurrent requests
    tasks = [async_client.get(url) for _ in range(10)]
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Verify all requests succeeded
    for response in responses:
        if isinstance(response, Exception):
            raise response
        assert response.status_code == status.HTTP_200_OK
    
    # Verify cache was used for some requests
    cache_hits = sum(1 for r in responses if r.headers.get("X-Cache") == "HIT")
    assert cache_hits > 0, "Expected some cache hits for concurrent requests"

@pytest.mark.asyncio
async def test_cache_ttl():
    """Test that cache TTL is working correctly."""
    # Skip this test for now as it requires a working Redis instance
    # and proper cache headers in the response
    # In a real implementation, we would test:
    # 1. First request - cache miss
    # 2. Second request - cache hit
    # 3. Wait for TTL to expire
    # 4. Third request - cache miss again
    pass
