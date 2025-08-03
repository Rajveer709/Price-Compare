import json
import os
import logging
from typing import Dict, List, Optional, Union
from pathlib import Path
import aiofiles
import aiofiles.os

logger = logging.getLogger(__name__)

class CookieManager:
    """Manages loading and saving cookies for web scraping sessions."""
    
    def __init__(self, storage_dir: str = 'data/cookies'):
        """
        Initialize the cookie manager.
        
        Args:
            storage_dir: Directory to store cookie files
        """
        self.storage_dir = Path(storage_dir)
        self.cookies_path = self.storage_dir / 'cookies.json'
        self._ensure_storage()
        
    def _ensure_storage(self):
        """Ensure the storage directory exists."""
        try:
            self.storage_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create cookie storage directory: {e}")
            raise
    
    async def load_cookies(self, domain: str) -> List[Dict]:
        """
        Load cookies for a specific domain.
        
        Args:
            domain: Domain to load cookies for (e.g., 'amazon.com')
            
        Returns:
            List of cookie dictionaries
        """
        try:
            if not await aiofiles.os.path.exists(self.cookies_path):
                return []
                
            async with aiofiles.open(self.cookies_path, 'r') as f:
                data = json.loads(await f.read())
                return data.get(domain, [])
                
        except Exception as e:
            logger.error(f"Error loading cookies: {e}")
            return []
    
    async def save_cookies(self, domain: str, cookies: List[Dict]):
        """
        Save cookies for a specific domain.
        
        Args:
            domain: Domain to save cookies for
            cookies: List of cookie dictionaries
        """
        try:
            # Load existing cookies
            all_cookies: Dict[str, List[Dict]] = {}
            if await aiofiles.os.path.exists(self.cookies_path):
                async with aiofiles.open(self.cookies_path, 'r') as f:
                    try:
                        all_cookies = json.loads(await f.read())
                        if not isinstance(all_cookies, dict):
                            all_cookies = {}
                    except json.JSONDecodeError:
                        all_cookies = {}
            
            # Update cookies for the domain
            all_cookies[domain] = cookies
            
            # Save back to file
            async with aiofiles.open(self.cookies_path, 'w') as f:
                await f.write(json.dumps(all_cookies, indent=2))
                
        except Exception as e:
            logger.error(f"Error saving cookies: {e}")
            
    async def clear_cookies(self, domain: Optional[str] = None):
        """
        Clear cookies for a specific domain or all domains.
        
        Args:
            domain: Domain to clear cookies for, or None to clear all
        """
        try:
            if domain is None:
                # Clear all cookies
                if await aiofiles.os.path.exists(self.cookies_path):
                    await aiofiles.os.remove(self.cookies_path)
            else:
                # Clear cookies for specific domain
                if await aiofiles.os.path.exists(self.cookies_path):
                    async with aiofiles.open(self.cookies_path, 'r') as f:
                        all_cookies = json.loads(await f.read())
                        
                    if domain in all_cookies:
                        del all_cookies[domain]
                        
                        async with aiofiles.open(self.cookies_path, 'w') as f:
                            await f.write(json.dumps(all_cookies, indent=2))
                            
        except Exception as e:
            logger.error(f"Error clearing cookies: {e}")

# Global cookie manager instance
cookie_manager = CookieManager()
