import logging
import time
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import httpx
from fastapi import HTTPException, status
from ..core.ebay_token import get_token_manager
from ..core.redis_client import get_redis_client
from ..core.config import settings

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter for eBay API calls"""
    
    def __init__(self, max_calls: int = 5000, period: int = 86400):
        """
        Initialize the rate limiter
        
        Args:
            max_calls: Maximum number of calls allowed in the period
            period: Period in seconds (default: 86400 = 24 hours)
        """
        self.max_calls = max_calls
        self.period = period
        self.redis = get_redis_client()
        self.redis_available = self.redis is not None
        self.lock = asyncio.Lock()
        self._local_usage = 0
        self._local_reset = time.time() + period
    
    async def _get_usage(self) -> Tuple[int, float]:
        """Get the current usage and reset time"""
        now = time.time()
        
        # If Redis is not available, use local counter
        if not self.redis_available:
            if now > self._local_reset:
                self._local_usage = 0
                self._local_reset = now + self.period
            return self._local_usage, self._local_reset
            
        # Use Redis if available
        async with self.lock:
            try:
                usage_key = "ebay:rate_limit:usage"
                reset_key = "ebay:rate_limit:reset_time"
                
                # Get current values from Redis
                usage = int(self.redis.get(usage_key) or 0)
                reset_time = float(self.redis.get(reset_key) or now + self.period)
                
                # Reset counter if period has passed
                if now > reset_time:
                    usage = 0
                    reset_time = now + self.period
                    try:
                        self.redis.set(usage_key, usage, ex=int(self.period))
                        self.redis.set(reset_key, reset_time, ex=int(self.period))
                    except Exception as e:
                        logger.warning(f"Failed to update Redis rate limit: {str(e)}")
                        self.redis_available = False
                        return await self._get_usage()  # Fall back to local counter
                
                return usage, reset_time
            except Exception as e:
                logger.warning(f"Failed to get rate limit from Redis: {str(e)}")
                self.redis_available = False
                return await self._get_usage()  # Fall back to local counter
    
    async def _increment_usage(self):
        """Increment the usage counter"""
        # Update local counter if Redis is not available
        if not self.redis_available:
            self._local_usage += 1
            return
            
        # Otherwise update Redis
        async with self.lock:
            try:
                usage_key = "ebay:rate_limit:usage"
                self.redis.incr(usage_key)
            except Exception as e:
                logger.warning(f"Failed to increment rate limit counter: {str(e)}")
                self.redis_available = False
                self._local_usage += 1  # Fall back to local counter
            if self.redis.ttl(usage_key) == -1:
                self.redis.expire(usage_key, self.period)
    
    async def wait_if_needed(self):
        """Wait if we're approaching the rate limit"""
        usage, reset_time = await self._get_usage()
        now = time.time()
        
        # Check if we've exceeded the limit
        if usage >= self.max_calls:
            sleep_time = reset_time - now
            if sleep_time > 0:
                logger.warning(f"Rate limit reached. Waiting {sleep_time:.2f} seconds until reset.")
                await asyncio.sleep(sleep_time)
                # Reset usage after waiting
                await self._get_usage()
        
        # Calculate delay to stay under rate limit
        time_since_last = now - self._get_last_request_time()
        min_interval = 1.0 / (self.max_calls / (self.period * 0.9))  # 90% of limit for safety
        
        if time_since_last < min_interval:
            sleep_time = min_interval - time_since_last
            await asyncio.sleep(sleep_time)
        
        # Update last request time
        self._update_last_request_time()
        
        # Increment usage counter
        await self._increment_usage()
    
    def _get_last_request_time(self) -> float:
        """Get the timestamp of the last request"""
        if not self.redis_available:
            return 0
        try:
            return float(self.redis.get("ebay:last_request_time") or 0)
        except Exception as e:
            logger.warning(f"Failed to get last request time from Redis: {str(e)}")
            self.redis_available = False
            return 0
    
    def _update_last_request_time(self):
        """Update the timestamp of the last request"""
        if not self.redis_available:
            return
        try:
            self.redis.set("ebay:last_request_time", time.time())
        except Exception as e:
            logger.warning(f"Failed to update last request time in Redis: {str(e)}")
            self.redis_available = False


class EBayService:
    """Service for interacting with the eBay Browse API"""
    
    BASE_URL = "https://api.ebay.com/buy/browse/v1"
    
    def __init__(self):
        self.redis = get_redis_client()
        self.rate_limiter = RateLimiter(
            max_calls=settings.EBAY_MAX_CALLS_PER_DAY,
            period=86400  # 24 hours
        )
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make an authenticated request to the eBay API with rate limiting
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (e.g., /item_summary/search)
            **kwargs: Additional arguments to pass to the HTTP client
            
        Returns:
            Dict containing the JSON response from the API
            
        Raises:
            HTTPException: If the request fails or the API returns an error
        """
        # Apply rate limiting
        await self.rate_limiter.wait_if_needed()
        
        # Get OAuth token
        token = await get_token_manager().get_access_token()
        
        # Prepare headers
        headers = kwargs.pop('headers', {})
        headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY-US",  # Default to US marketplace
            "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=<US>,zip=<10001>"
        })
        
        # Build the full URL
        url = f"{self.BASE_URL}{endpoint}"
        
        # Add request to history for debugging
        request_id = f"ebay_req_{int(time.time() * 1000)}"
        logger.debug(f"eBay API Request [{request_id}]: {method} {url}")
        
        # Create a timeout object
        timeout = httpx.Timeout(settings.EBAY_API_TIMEOUT, connect=10.0)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                # Make the async request
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    **kwargs
                )
                
                # Log response status
                logger.debug(f"eBay API Response [{request_id}]: {response.status_code}")
                
                # Handle rate limiting
                if response.status_code == 429:  # Too Many Requests
                    retry_after = int(response.headers.get('Retry-After', '5'))
                    logger.warning(f"Rate limited by eBay API. Retrying after {retry_after} seconds.")
                    await asyncio.sleep(retry_after)
                    return await self._make_request(method, endpoint, **kwargs)
                
                # Handle other errors
                response.raise_for_status()
                
                # Return JSON response
                return response.json()
                
            except httpx.HTTPStatusError as e:
                logger.error(f"eBay API request failed with status {e.response.status_code} [{request_id}]: {str(e)}")
                
                # Try to extract error details from the response
                status_code = e.response.status_code
                detail = "Failed to communicate with eBay API"
                
                try:
                    error_data = e.response.json()
                    detail = error_data.get('errors', [{}])[0].get('message', detail)
                except (json.JSONDecodeError, AttributeError, IndexError, KeyError):
                    detail = e.response.text or detail
                
                raise HTTPException(
                    status_code=status_code,
                    detail={
                        "error": "ebay_api_error",
                        "message": detail,
                        "request_id": request_id
                    }
                )
                
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.error(f"eBay API request failed [{request_id}]: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={
                        "error": "service_unavailable",
                        "message": "Failed to connect to eBay API. Please try again later.",
                        "request_id": request_id
                    }
                )
    
    async def search_products(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for products on eBay"""
        # Only use Redis if it's available
        if self.redis is not None:
            try:
                cache_key = f"ebay:search:{query}:{limit}:{offset}"
                # Try to get from cache first
                cached = self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Failed to read from Redis cache: {str(e)}")
        
        params = {
            "q": query,
            "limit": min(limit, 200),  # Max 200 items per request
            "offset": offset
        }
        
        if filters:
            # Add any additional filters (price range, condition, etc.)
            params.update(filters)
        
        result = await self._make_request("GET", "/item_summary/search", params=params)
        
        # Cache for 1 hour if Redis is available
        if self.redis is not None:
            try:
                cache_key = f"ebay:search:{query}:{limit}:{offset}"
                self.redis.setex(cache_key, 3600, json.dumps(result))
            except Exception as e:
                logger.warning(f"Failed to write to Redis cache: {str(e)}")
        
        return result
    
    async def get_product(self, item_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific product"""
        # Only use Redis if it's available
        if self.redis is not None:
            try:
                cache_key = f"ebay:product:{item_id}"
                # Try to get from cache first
                cached = self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Failed to read from Redis cache: {str(e)}")
        
        result = await self._make_request("GET", f"/item/{item_id}?fieldgroups=COMPACT")
        
        # Cache for 1 day
        self.redis.setex(cache_key, 86400, json.dumps(result))
        
        return result

# Global instance to be used by the application
ebay_service: Optional[EBayService] = None

def get_ebay_service() -> EBayService:
    """Dependency to get the eBay service"""
    global ebay_service
    if ebay_service is None:
        try:
            # Initialize the service with Redis client
            redis_client = get_redis_client()
            ebay_service = EBayService()
            logger.info("EBayService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize EBayService: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Search service initialization failed"
            )
    return ebay_service
