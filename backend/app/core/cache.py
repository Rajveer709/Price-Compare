"""
Redis-based caching utilities for the application
"""
import json
import logging
from typing import Any, Optional, TypeVar, Type, Callable, Dict, Union
from functools import wraps
import time

from .redis_client import get_redis_client

logger = logging.getLogger(__name__)
T = TypeVar('T')

class CacheManager:
    """Redis-based cache manager with TTL support"""
    
    def __init__(self, prefix: str = "cache:", default_ttl: int = 3600):
        """
        Initialize the cache manager
        
        Args:
            prefix: Prefix for all cache keys
            default_ttl: Default TTL in seconds
        """
        self.redis = get_redis_client()
        self.prefix = prefix
        self.default_ttl = default_ttl
    
    def _get_key(self, key: str) -> str:
        """Get the full cache key with prefix"""
        return f"{self.prefix}{key}"
    
    async def get(self, key: str, model: Type[T] = None) -> Optional[T]:
        """
        Get a value from the cache
        
        Args:
            key: Cache key
            model: Optional Pydantic model to deserialize into
            
        Returns:
            The cached value or None if not found
        """
        if not self.redis:
            return None
            
        try:
            data = await self.redis.get(self._get_key(key))
            if not data:
                return None
                
            if model:
                return model.parse_raw(data)
            return json.loads(data)
            
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: int = None,
        serialize: bool = True
    ) -> bool:
        """
        Set a value in the cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Optional TTL in seconds
            serialize: Whether to serialize the value (set to False if already serialized)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False
            
        try:
            cache_key = self._get_key(key)
            if serialize:
                if hasattr(value, 'json'):
                    # Handle Pydantic models
                    serialized = value.json()
                else:
                    serialized = json.dumps(value, default=str)
            else:
                serialized = value
                
            ttl = ttl if ttl is not None else self.default_ttl
            
            if ttl > 0:
                return await self.redis.setex(cache_key, ttl, serialized)
            else:
                return await self.redis.set(cache_key, serialized)
                
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            return False
    
    async def delete(self, *keys: str) -> int:
        """
        Delete one or more keys from the cache
        
        Returns:
            Number of keys deleted
        """
        if not self.redis or not keys:
            return 0
            
        try:
            prefixed_keys = [self._get_key(k) for k in keys]
            return await self.redis.delete(*prefixed_keys)
        except Exception as e:
            logger.error(f"Cache delete error for keys {keys}: {str(e)}")
            return 0
    
    async def clear_pattern(self, pattern: str) -> int:
        """
        Clear all keys matching a pattern
        
        Returns:
            Number of keys deleted
        """
        if not self.redis:
            return 0
            
        try:
            pattern = self._get_key(pattern)
            keys = await self.redis.keys(pattern)
            if not keys:
                return 0
                
            return await self.redis.delete(*keys)
        except Exception as e:
            logger.error(f"Cache clear error for pattern {pattern}: {str(e)}")
            return 0
    
    def cached(
        self, 
        key_func: Callable[..., str],
        ttl: int = 3600,
        prefix: str = "",
        serialize: bool = True
    ) -> Callable:
        """
        Decorator to cache function results
        
        Args:
            key_func: Function that returns the cache key
            ttl: Time to live in seconds
            prefix: Optional prefix for cache keys
            serialize: Whether to serialize the result
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = prefix + key_func(*args, **kwargs)
                
                # Try to get from cache
                cached = await self.get(cache_key, model=None if serialize else str)
                if cached is not None:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return cached
                
                # Call the function
                result = await func(*args, **kwargs)
                
                # Cache the result
                if result is not None:
                    await self.set(cache_key, result, ttl=ttl, serialize=serialize)
                
                return result
            return wrapper
        return decorator

# Default cache instance
cache = CacheManager(prefix="price_compare:", default_ttl=3600)
