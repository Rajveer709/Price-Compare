from datetime import datetime, timedelta
from typing import Dict, Optional
import asyncio
from fastapi import HTTPException, Request

class RateLimiter:
    def __init__(self, max_requests: int, time_window_seconds: int):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum number of requests allowed in the time window
            time_window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = timedelta(seconds=time_window_seconds)
        self.requests: Dict[str, list[datetime]] = {}
        self.lock = asyncio.Lock()
    
    async def is_rate_limited(self, client_ip: str) -> bool:
        """Check if the client has exceeded the rate limit."""
        async with self.lock:
            now = datetime.utcnow()
            
            # Remove old requests outside the time window
            if client_ip in self.requests:
                self.requests[client_ip] = [
                    req_time for req_time in self.requests[client_ip]
                    if now - req_time < self.time_window
                ]
            
            # Add current request time
            if client_ip not in self.requests:
                self.requests[client_ip] = []
            
            # Check rate limit
            if len(self.requests[client_ip]) >= self.max_requests:
                return True
            
            self.requests[client_ip].append(now)
            return False

def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling various proxy scenarios."""
    if xff := request.headers.get('X-Forwarded-For'):
        # Get the first IP in the X-Forwarded-For header
        client_ip = xff.split(',')[0].strip()
    else:
        client_ip = request.client.host if request.client else 'unknown'
    return client_ip

# Global rate limiter instance (5 requests per minute per IP by default)
rate_limiter = RateLimiter(max_requests=5, time_window_seconds=60)

async def rate_limit_middleware(request: Request, call_next):
    """Middleware to handle rate limiting for all requests."""
    client_ip = get_client_ip(request)
    
    if await rate_limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail={
                "success": False,
                "error": "Rate limit exceeded. Please try again later.",
                "retry_after_seconds": 60
            }
        )
    
    response = await call_next(request)
    return response
