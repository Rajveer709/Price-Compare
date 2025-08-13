import logging
from fastapi import FastAPI
from typing import Optional

from .core.redis_client import init_redis, close_redis
from .core.ebay_token import EBayTokenManager
from .services.ebay_service import EBayService

logger = logging.getLogger(__name__)

def initialize_services():
    """Initialize all required services"""
    try:
        # Initialize Redis
        redis_client = init_redis()
        
        # Initialize eBay Token Manager
        token_manager = EBayTokenManager(redis_client)
        
        # Initialize eBay Service
        ebay_service = EBayService()
        
        # Store references
        from .core import ebay_token, redis_client as rc
        from . import services
        ebay_token.token_manager = token_manager
        rc._redis_client = redis_client
        services.ebay_service = ebay_service
        
        logger.info("Services initialized successfully")
        return {
            "redis": redis_client,
            "ebay_token_manager": token_manager,
            "ebay_service": ebay_service
        }
    except Exception as e:
        logger.error(f"Failed to initialize services: {str(e)}", exc_info=True)
        raise

def shutdown_services():
    """Clean up services on application shutdown"""
    from .core import redis_client
    try:
        close_redis()
        logger.info("Services shut down successfully")
    except Exception as e:
        logger.error(f"Error during service shutdown: {str(e)}", exc_info=True)

def setup_app(app: FastAPI) -> None:
    """Set up the FastAPI application with lifecycle events"""
    @app.on_event("startup")
    async def startup_event():
        """Initialize services on application startup"""
        try:
            initialize_services()
            logger.info("Application startup completed")
        except Exception as e:
            logger.critical(f"Application startup failed: {str(e)}", exc_info=True)
            raise

    @app.on_event("shutdown")
    async def shutdown_event():
        """Clean up on application shutdown"""
        shutdown_services()
        logger.info("Application shutdown completed")
