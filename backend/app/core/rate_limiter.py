import time
import asyncio
import logging
from typing import Dict, Optional, Any, Tuple, Callable, Awaitable, Union
from fastapi import HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from .redis_client import get_redis_client
from functools import wraps
import json

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        self.redis = get_redis_client()
        self.redis_available = self.redis is not None
        # Default rate limits (requests per minute)
        self.default_limits = {
            'public': 60,  # 60 requests per minute for unauthenticated users
            'authenticated': 300,  # 300 requests per minute for authenticated users
            'ebay_api': 100  # 100 requests per minute for eBay API endpoints
        }
    
    def get_client_identifier(self, request: Request) -> str:
        """Get a unique identifier for the client making the request"""
        # Try to get the user ID if authenticated
        user = request.state.user if hasattr(request.state, 'user') else None
        if user and hasattr(user, 'id'):
            return f"user:{user.id}"
            
        # Fall back to IP address
        forwarded = request.headers.get('X-Forwarded-For')
        if forwarded:
            client_ip = forwarded.split(',')[0]
        else:
            client_ip = request.client.host or 'unknown'
            
        return f"ip:{client_ip}"
        
    async def get_rate_limit_info(self, key: str, limit_type: str = 'public') -> Tuple[int, int]:
        """Get rate limit information for a key"""
        limit = self.default_limits.get(limit_type, self.default_limits['public'])
        period = 60  # 1 minute
        
        if not self.redis_available:
            return limit, 0
            
        current_time = int(time.time())
        window_start = current_time - period
        
        try:
            # Remove old requests from the sorted set
            await self.redis.zremrangebyscore(key, '-inf', window_start)
            
            # Get current request count
            count = await self.redis.zcard(key)
            
            # Calculate remaining requests
            remaining = max(0, limit - count)
            reset_time = current_time + period
            
            return remaining, reset_time
            
        except Exception as e:
            logger.error(f"Error getting rate limit info: {str(e)}")
            return limit, 0
            
    async def limit(
        self,
        request: Request,
        key_prefix: str,
        limit_type: str = 'public',
        block: bool = False,
        block_timeout: int = 60
    ) -> Dict[str, Any]:
        """
        Rate limit a request
        
        Args:
            request: The FastAPI request object
            key_prefix: Prefix for the rate limit key (e.g., 'search', 'api')
            limit_type: Type of rate limit to apply ('public', 'authenticated', 'ebay_api')
            block: Whether to block until the rate limit resets
            block_timeout: Maximum time to block in seconds
            
        Returns:
            Dictionary with rate limit information
            
        Raises:
            HTTPException: If rate limit is exceeded and block is False
        """
        client_id = self.get_client_identifier(request)
        key = f"rate_limit:{key_prefix}:{client_id}"
        
        limit = self.default_limits.get(limit_type, self.default_limits['public'])
        period = 60  # 1 minute
        
        # If Redis is not available, allow all requests (degraded mode)
        if not self.redis_available:
            logger.warning("Redis not available, running in degraded mode (rate limiting disabled)")
            return {
                "limit": limit,
                "remaining": limit,
                "reset": int(time.time()) + period,
                "retry_after": 0
            }
            
        current_time = int(time.time())
        window_start = current_time - period
        
        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            
            # Add current request to the sorted set
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiration on the key
            pipe.expire(key, period)
            
            # Get count of requests in the current window
            pipe.zcount(key, window_start, current_time)
            
            # Execute pipeline
            _, _, request_count = pipe.execute()
            
            remaining = max(0, limit - request_count)
            reset_time = current_time + period
            retry_after = max(0, reset_time - current_time)
            
            # If limit exceeded
            if request_count > limit:
                if block:
                    # Wait until the rate limit resets
                    await asyncio.sleep(retry_after)
                    return await self.limit(request, key_prefix, limit_type, block, block_timeout)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        headers={
                            "X-RateLimit-Limit": str(limit),
                            "X-RateLimit-Remaining": str(remaining),
                            "X-RateLimit-Reset": str(reset_time),
                            "Retry-After": str(retry_after)
                        },
                        detail={
                            "message": "Rate limit exceeded",
                            "retry_after": retry_after
                        }
                    )
            
            return {
                "limit": limit,
                "remaining": remaining,
                "reset": reset_time,
                "retry_after": 0
            }
            
        except Exception as e:
            logger.error(f"Rate limiter error: {str(e)}")
            # Fail open - allow the request through
            return {
                "limit": limit,
                "remaining": limit,
                "reset": current_time + period,
                "retry_after": 0
            }
    
    async def _wait_if_needed(self, wait_time: float) -> None:
        """Helper method to wait if rate limit is exceeded"""
        if wait_time > 0:
            await asyncio.sleep(wait_time)

    async def update_rate_limit(self, key: str, limit: int) -> None:
        """
        Update the rate limit counter for a key
        
        Args:
            key: The rate limit key
            limit: The rate limit value
        """
        if not self.redis_available:
            return
            
        try:
            current_time = time.time()
            period = 60  # 1 minute
            
            async with await self.redis.pipeline() as pipe:
                # Add current timestamp to the sorted set
                pipe.zadd(key, {str(current_time): current_time})
                
                # Remove old timestamps (older than 1 minute)
                pipe.zremrangebyscore(key, '-inf', current_time - period)
                
                # Set expiration on the key
                pipe.expire(key, period)
                
                # Execute all commands in a single transaction
                await pipe.execute()
                
        except Exception as e:
            logger.error(f"Error updating rate limit: {str(e)}")
            # Fail silently - we'll just allow the request through

    def rate_limit(self, key_prefix: str, limit_type: str = 'public') -> Callable:
        """
        Decorator to apply rate limiting to a route
        
        Args:
            key_prefix: Prefix for the rate limit key (e.g., 'search', 'api')
            limit_type: Type of rate limit to apply ('public', 'authenticated', 'ebay_api')
            
        Returns:
            Decorated function with rate limiting applied
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(request: Request, *args, **kwargs) -> Response:
                try:
                    # Get rate limit info
                    client_id = self.get_client_identifier(request)
                    key = f"rate_limit:{key_prefix}:{client_id}"
                    limit = self.default_limits.get(limit_type, self.default_limits['public'])
                    
                    # Check rate limit
                    remaining, reset_time = await self.get_rate_limit_info(key, limit_type)
                    wait_time = max(0, reset_time - time.time())
                    
                    # If rate limit exceeded, wait or raise exception
                    if remaining <= 0:
                        await self._wait_if_needed(wait_time)
                    
                    # Update rate limit
                    await self.update_rate_limit(key, limit)
                    
                    # Call the original function
                    response = await func(request, *args, **kwargs)
                    
                    # Add rate limit headers to the response
                    response.headers["X-RateLimit-Limit"] = str(limit)
                    response.headers["X-RateLimit-Remaining"] = str(max(0, remaining - 1))
                    response.headers["X-RateLimit-Reset"] = str(int(reset_time))
                    
                    return response
                    
                except HTTPException:
                    # Re-raise HTTP exceptions
                    raise
                    
                except Exception as e:
                    logger.error(f"Rate limit error: {str(e)}")
                    # Fail open - allow the request through
                    try:
                        return await func(request, *args, **kwargs)
                    except Exception as inner_e:
                        logger.error(f"Error in wrapped function: {str(inner_e)}")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An error occurred while processing your request"
                        )
                    
            return wrapper
            
        return decorator

# Global instance to be used by the application
rate_limiter = RateLimiter()
