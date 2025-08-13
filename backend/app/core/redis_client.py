import os
import logging
import redis
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global Redis client instance
_redis_client: Optional[redis.Redis] = None

def init_redis() -> redis.Redis:
    """Initialize the Redis client with configuration from environment variables
    
    Returns:
        redis.Redis: Initialized Redis client instance or None if in development mode or disabled
    """
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    
    # Check if Redis is disabled via environment variable
    if os.getenv("REDIS_DISABLED", "false").lower() == "true":
        logger.warning("Redis is disabled via REDIS_DISABLED environment variable")
        _redis_client = None
        return _redis_client
        
    redis_url = os.getenv("REDIS_URL")
    redis_password = os.getenv("REDIS_PASSWORD")
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))
    redis_db = int(os.getenv("REDIS_DB", "0"))
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    
    try:
        if not redis_url:
            # Construct URL from individual components if REDIS_URL not provided
            auth_part = f":{redis_password}@" if redis_password else ""
            redis_url = f"redis://{auth_part}{redis_host}:{redis_port}/{redis_db}"
        
        # In development, don't let Redis connection block the application
        _redis_client = redis.Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,  # Reduced from 5s to 2s
            socket_timeout=2,          # Reduced from 5s to 2s
            retry_on_timeout=False,    # Disable retry on timeout
            max_connections=10,
            health_check_interval=30    # Add health check
        )
        
        # Test the connection with a short timeout
        try:
            _redis_client.ping()
            logger.info(f"Successfully connected to Redis at {redis_url}")
        except Exception as e:
            if is_production:
                logger.error(f"Failed to connect to Redis in production: {str(e)}")
                raise
            else:
                logger.warning(f"Could not connect to Redis at {redis_url}, running in degraded mode: {str(e)}")
                _redis_client = None
                
        return _redis_client
        
    except Exception as e:
        error_msg = f"Failed to initialize Redis client: {str(e)}"
        if is_production:
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e
        else:
            logger.warning(f"{error_msg} - Running in degraded mode")
            _redis_client = None
            return None

def get_redis_client() -> Optional[redis.Redis]:
    """Get the Redis client instance
    
    Returns:
        Optional[redis.Redis]: Redis client instance or None if not available
    """
    if _redis_client is None:
        init_redis()
    return _redis_client

def close_redis() -> None:
    """Close the Redis connection"""
    global _redis_client
    if _redis_client is not None:
        _redis_client.close()
        _redis_client = None

def clear_cache(prefix: str = None) -> int:
    """Clear cached items with optional prefix"""
    client = get_redis_client()
    if prefix:
        keys = client.keys(f"{prefix}:*")
        if keys:
            return client.delete(*keys)
    else:
        return client.flushdb()
    return 0
