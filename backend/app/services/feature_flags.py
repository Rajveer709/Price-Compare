"""
Feature Flags Service

This module provides a centralized way to manage feature flags for the application.
Feature flags allow enabling/disabling features without code deployment.
"""
from typing import Dict, Any, Optional
import logging
from fastapi import HTTPException, status
from ..core.redis_client import get_redis_client
from ..core.config import settings

logger = logging.getLogger(__name__)

class FeatureFlags:
    """
    Manages feature flags for the application.
    
    Flags can be set at:
    1. The environment level (highest priority)
    2. The database/Redis level (medium priority)
    3. The default value (lowest priority)
    """
    
    def __init__(self):
        self.redis = get_redis_client()
        self.prefix = "feature_flag:"
        
        # Default values for all feature flags
        self.default_flags = {
            "enable_amazon_api": settings.ENABLE_AMAZON_API,
            "enable_ebay_api": settings.ENABLE_EBAY_API,
            "enable_safe_browsing": settings.ENABLE_SAFE_BROWSING,
            "enable_price_history": True,
            "enable_email_notifications": True,
            "enable_telemetry": False,
            "maintenance_mode": False,
        }
    
    async def is_enabled(self, flag_name: str, user_id: Optional[str] = None) -> bool:
        """
        Check if a feature flag is enabled.
        
        Args:
            flag_name: Name of the feature flag
            user_id: Optional user ID for user-specific flags
            
        Returns:
            bool: True if the feature is enabled, False otherwise
            
        Raises:
            HTTPException: If the feature flag doesn't exist
        """
        # Check if the flag exists
        if flag_name not in self.default_flags:
            logger.warning(f"Unknown feature flag: {flag_name}")
            return False
        
        # Check for user-specific flag first
        if user_id:
            user_flag = await self._get_redis_flag(f"{flag_name}:{user_id}")
            if user_flag is not None:
                return user_flag
        
        # Check for global flag
        redis_flag = await self._get_redis_flag(flag_name)
        if redis_flag is not None:
            return redis_flag
        
        # Fall back to environment/default value
        return self.default_flags[flag_name]
    
    async def set_flag(self, flag_name: str, value: bool, user_id: Optional[str] = None) -> None:
        """
        Set a feature flag value.
        
        Args:
            flag_name: Name of the feature flag
            value: Boolean value to set
            user_id: Optional user ID for user-specific flags
            
        Raises:
            HTTPException: If the feature flag doesn't exist or setting fails
        """
        if flag_name not in self.default_flags:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown feature flag: {flag_name}"
            )
        
        try:
            key = f"{self.prefix}{flag_name}"
            if user_id:
                key = f"{key}:{user_id}"
            
            self.redis.set(key, "1" if value else "0")
            logger.info(f"Set feature flag {key} to {value}")
            
        except Exception as e:
            logger.error(f"Failed to set feature flag {flag_name}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update feature flag"
            )
    
    async def _get_redis_flag(self, flag_name: str) -> Optional[bool]:
        """Get a feature flag value from Redis"""
        try:
            value = self.redis.get(f"{self.prefix}{flag_name}")
            if value is not None:
                return value == b"1"
            return None
        except Exception as e:
            logger.error(f"Error reading feature flag {flag_name}: {str(e)}")
            return None
    
    async def get_all_flags(self, user_id: Optional[str] = None) -> Dict[str, bool]:
        """
        Get all feature flags and their current values.
        
        Args:
            user_id: Optional user ID for user-specific flags
            
        Returns:
            Dict of flag names to their current values
        """
        result = {}
        for flag_name in self.default_flags:
            result[flag_name] = await self.is_enabled(flag_name, user_id)
        return result

# Global instance
feature_flags = FeatureFlags()

def get_feature_flags() -> FeatureFlags:
    """Dependency to get the feature flags service"""
    return feature_flags
