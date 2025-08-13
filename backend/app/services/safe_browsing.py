import logging
import requests
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from ..core.config import settings
from ..core.redis_client import get_redis_client

logger = logging.getLogger(__name__)

class SafeBrowsingService:
    """Service for checking URL safety using Google Safe Browsing API"""
    
    def __init__(self):
        self.api_key = settings.GOOGLE_SAFE_BROWSING_API_KEY
        self.api_url = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
        self.redis = get_redis_client()
        self.cache_ttl = 86400  # 24 hours
    
    async def is_url_safe(self, url: str) -> bool:
        """
        Check if a URL is safe using Google Safe Browsing API
        
        Args:
            url: The URL to check
            
        Returns:
            bool: True if the URL is safe, False if it's flagged as malicious
        """
        if not self.api_key:
            logger.warning("Google Safe Browsing API key not configured")
            return True  # Assume safe if not configured
        
        # Check cache first
        cache_key = f"safe_browsing:{url}"
        cached = self.redis.get(cache_key)
        if cached is not None:
            return cached.decode().lower() == 'true'
        
        # Prepare the request payload
        payload = {
            "client": {
                "clientId": settings.PROJECT_NAME.lower().replace(" ", "-"),
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE",
                    "POTENTIALLY_HARMFUL_APPLICATION"
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                json=payload,
                timeout=5
            )
            response.raise_for_status()
            
            # If there are matches, the URL is not safe
            result = response.json()
            is_safe = not bool(result.get("matches", []))
            
            # Cache the result
            self.redis.setex(cache_key, self.cache_ttl, str(is_safe).lower())
            
            return is_safe
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Safe Browsing API error: {str(e)}")
            # In case of error, assume the URL is safe to avoid blocking content
            return True
        except Exception as e:
            logger.error(f"Error checking URL safety: {str(e)}")
            return True

# Global instance to be used by the application
safe_browsing_service: Optional[SafeBrowsingService] = None

def get_safe_browsing_service() -> SafeBrowsingService:
    """Dependency to get the Safe Browsing service"""
    global safe_browsing_service
    if safe_browsing_service is None:
        safe_browsing_service = SafeBrowsingService()
    return safe_browsing_service
