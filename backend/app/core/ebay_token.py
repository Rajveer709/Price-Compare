import os
import base64
import time
import logging
import redis
from typing import Optional, Dict, Any
import requests
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class EBayTokenManager:
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.token_key = "ebay:access_token"
        self.token_expiry_key = "ebay:token_expiry"
        self.token_type_key = "ebay:token_type"
        self.token_scope_key = "ebay:token_scope"
        self.token_mint_count_key = "ebay:token_mint_count"
        self.token_mint_reset_key = "ebay:token_mint_reset"
        self.redis_client = redis_client  # Store the Redis client instance
        self.redis_available = redis_client is not None
        
        # Maximum number of token mints per day (eBay limit is 1,000)
        self.max_mints_per_day = 900  # Conservative limit to stay under 1,000
        self.token_lock = None
        self._lock_acquired = False
    
    async def _acquire_lock(self):
        """Acquire a lock for token refresh"""
        if not self.redis_available or self._lock_acquired:
            return True
            
        try:
            self._lock_acquired = self.redis_client.set(
                "ebay_token_lock", 
                "1", 
                ex=60,  # 60 seconds expiration
                nx=True  # Only set if not exists
            )
            return self._lock_acquired
        except Exception as e:
            logger.warning(f"Failed to acquire lock: {str(e)}")
            return False
            
    async def _release_lock(self):
        """Release the lock"""
        if not self.redis_available or not self._lock_acquired:
            return
            
        try:
            self.redis_client.delete("ebay_token_lock")
            self._lock_acquired = False
        except Exception as e:
            logger.warning(f"Failed to release lock: {str(e)}")
            
    async def get_access_token(self) -> str:
        """
        Get a valid access token from cache or generate a new one.
        
        This method is thread-safe and will block if a token refresh is in progress.
        
        Returns:
            str: Valid access token
            
        Raises:
            HTTPException: If token refresh fails or rate limits are exceeded
        """
        # Try to get token from cache first
        try:
            if self.redis_available:
                token = self.redis_client.get(self.token_key)
                token_expiry = self.redis_client.get(self.token_expiry_key)
                
                # If we have a valid token, return it
                if token and token_expiry and float(token_expiry) > time.time() + 60:  # 1 min buffer
                    return token.decode('utf-8') if isinstance(token, bytes) else token
            
            # If we get here, we need to refresh the token
            return await self._refresh_token()
            
        except Exception as e:
            logger.error(f"Error in get_access_token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to get access token"
            )
    
    async def _check_mint_limit(self) -> bool:
        """Check if we've hit our daily token mint limit"""
        if not self.redis_available or self.redis_client is None:
            return False
            
        try:
            # Check if we need to reset the counter (new day)
            reset_time = self.redis_client.get(self.token_mint_reset_key)
            current_time = time.time()
            
            if not reset_time or float(reset_time) < current_time:
                # Reset the counter for a new day
                try:
                    pipe = self.redis_client.pipeline()
                    pipe.set(self.token_mint_count_key, 0)
                    pipe.set(self.token_mint_reset_key, current_time + 86400)  # 24 hours from now
                    pipe.execute()
                except Exception as e:
                    logger.warning(f"Failed to reset mint counter: {str(e)}")
                    self.redis_available = False
                return False
                
            # Check current count
            try:
                count = int(self.redis_client.get(self.token_mint_count_key) or 0)
                return count >= self.max_mints_per_day
            except Exception as e:
                logger.warning(f"Failed to get mint count: {str(e)}")
                self.redis_available = False
                return False
            
        except Exception as e:
            logger.warning(f"Failed to check mint limit: {str(e)}")
            self.redis_available = False
            return False
    
    async def _increment_mint_count(self) -> None:
        """Increment the token mint counter"""
        if self.redis_available and self.redis_client is not None:
            try:
                self.redis_client.incr(self.token_mint_count_key)
            except Exception as e:
                logger.warning(f"Failed to increment mint count in Redis: {str(e)}")
                self.redis_available = False
    
    async def _refresh_token(self) -> str:
        """
        Refresh the eBay OAuth token
        """
        logger.info("Starting eBay token refresh...")
        
        # Check if we've hit our daily mint limit
        if self.redis_available:
            try:
                if await self._check_mint_limit():
                    error_msg = "Daily token mint limit reached. Please try again later."
                    logger.error(error_msg)
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=error_msg
                    )
            except Exception as e:
                logger.warning(f"Error checking mint limit: {str(e)}")
                # Continue with token refresh even if mint limit check fails
            
        # Only allow one token refresh at a time if Redis is available
        if self.redis_available:
            if not await self._acquire_lock():
                error_msg = "Token refresh in progress. Please try again shortly."
                logger.warning(error_msg)
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=error_msg
                )
        
        logger.info("Acquired token refresh lock")
            
        try:
            # Get client credentials from environment
            client_id = os.getenv("EBAY_CLIENT_ID")
            client_secret = os.getenv("EBAY_CLIENT_SECRET")
            
            if not client_id or not client_secret:
                logger.error("EBAY_CLIENT_ID or EBAY_CLIENT_SECRET not set")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Server configuration error"
                )
            
            # Prepare the request
            logger.info("Preparing eBay OAuth request...")
            auth_string = f"{client_id}:{client_secret}"
            encoded_auth = base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')
            
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {encoded_auth}"
            }
            
            data = {
                "grant_type": "client_credentials",
                "scope": "https://api.ebay.com/oauth/api_scope"
            }
            
            logger.debug(f"eBay OAuth request headers: {headers}")
            logger.debug(f"eBay OAuth request data: {data}")
            
            # Log the OAuth URL without credentials for security
            oauth_url = "https://api.ebay.com/identity/v1/oauth2/token"
            logger.info(f"Sending OAuth request to: {oauth_url}")
            
            # Make the actual request to eBay OAuth endpoint
            import requests
            response = requests.post(oauth_url, headers=headers, data=data)
            response.raise_for_status()
            
            # Parse the response
            token_data = response.json()
            access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 7200)  # Default 2 hours
            token_type = token_data.get("token_type", "Bearer")
            
            if not access_token:
                raise ValueError("No access token in response")
            
            # Calculate expiry time (with 5 minute buffer)
            expiry_time = time.time() + expires_in - 300
            
            # Store the token in Redis if available
            if self.redis_available and self.redis_client is not None:
                try:
                    pipe = self.redis_client.pipeline()
                    pipe.set(self.token_key, access_token)
                    pipe.set(self.token_expiry_key, str(expiry_time))
                    pipe.set(self.token_type_key, token_type)
                    
                    # Set expiration slightly longer than token expiry
                    pipe.expire(self.token_key, expires_in)
                    pipe.expire(self.token_expiry_key, expires_in)
                    pipe.expire(self.token_type_key, expires_in)
                    
                    # Increment the mint counter if we can
                    try:
                        await self._increment_mint_count()
                    except Exception as e:
                        logger.warning(f"Failed to increment mint count: {str(e)}")
                    
                    pipe.execute()
                except Exception as e:
                    logger.warning(f"Failed to store token in Redis: {str(e)}")
                    self.redis_available = False
            
            return access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to refresh token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to refresh token. Please try again later."
            )
        except Exception as e:
            logger.error(f"Unexpected error refreshing token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )
            
        finally:
            if self.redis_available:
                await self._release_lock()

def get_redis_client() -> redis.Redis:
    """Create and return a Redis client instance"""
    return redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        db=int(os.getenv('REDIS_DB', 0)),
        decode_responses=True
    )

# Global instance
token_manager = None

def get_token_manager() -> EBayTokenManager:
    """Get the global token manager instance"""
    global token_manager
    if token_manager is None:
        redis_client = get_redis_client()
        token_manager = EBayTokenManager(redis_client)
    return token_manager
