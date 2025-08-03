import random
import time
import asyncio
from typing import List, Optional, Dict, Any, Tuple
import aiohttp
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

from .config import settings

logger = logging.getLogger(__name__)

@dataclass
class ProxyInfo:
    proxy: str
    last_used: datetime = None
    last_failed: datetime = None
    failures: int = 0
    success_count: int = 0
    avg_response_time: float = 0.0
    enabled: bool = True

class ProxyManager:
    def __init__(self):
        self.proxies: List[ProxyInfo] = []
        self._current_proxy_index = -1
        self._lock = asyncio.Lock()
        self._health_check_interval = 300  # 5 minutes
        self._last_health_check = datetime.min
        self._test_url = "http://httpbin.org/ip"
        self._initialize_proxies()

    def _initialize_proxies(self):
        """Initialize the proxy list from settings."""
        if not settings.PROXY_ENABLED or not settings.PROXY_LIST:
            logger.info("Proxy support is disabled or no proxies configured")
            return

        self.proxies = [
            ProxyInfo(proxy=proxy) 
            for proxy in settings.PROXY_LIST
            if proxy.strip()
        ]
        
        if not self.proxies:
            logger.warning("Proxy is enabled but no valid proxies found in settings")
        else:
            logger.info(f"Initialized {len(self.proxies)} proxies")

    async def get_proxy(self) -> Optional[Dict[str, str]]:
        """Get the next available proxy in rotation."""
        if not settings.PROXY_ENABLED or not self.proxies:
            return None

        async with self._lock:
            # Rotate to next proxy
            self._current_proxy_index = (self._current_proxy_index + 1) % len(self.proxies)
            proxy_info = self.proxies[self._current_proxy_index]
            proxy_info.last_used = datetime.utcnow()
            
            # If proxy is disabled, find the next enabled one
            if not proxy_info.enabled:
                for _ in range(len(self.proxies)):
                    self._current_proxy_index = (self._current_proxy_index + 1) % len(self.proxies)
                    proxy_info = self.proxies[self._current_proxy_index]
                    if proxy_info.enabled:
                        break
                else:
                    logger.warning("No enabled proxies available")
                    return None

            logger.debug(f"Using proxy: {proxy_info.proxy}")
            return self._format_proxy(proxy_info.proxy)

    def _format_proxy(self, proxy_url: str) -> Dict[str, str]:
        """Format proxy URL for aiohttp."""
        if not proxy_url:
            return {}
            
        if "@" in proxy_url:  # Already has auth
            return {"http": f"http://{proxy_url}", "https": f"http://{proxy_url}"}
            
        if settings.PROXY_USER and settings.PROXY_PASSWORD:
            protocol, rest = proxy_url.split("://") if "://" in proxy_url else ("http", proxy_url)
            return {
                "http": f"{protocol}://{settings.PROXY_USER}:{settings.PROXY_PASSWORD}@{rest}",
                "https": f"{protocol}://{settings.PROXY_USER}:{settings.PROXY_PASSWORD}@{rest}"
            }
            
        return {"http": proxy_url, "https": proxy_url}

    async def mark_failed(self, proxy_url: str):
        """Mark a proxy as failed."""
        if not proxy_url or not self.proxies:
            return
            
        for proxy_info in self.proxies:
            if proxy_info.proxy in proxy_url:
                proxy_info.failures += 1
                proxy_info.last_failed = datetime.utcnow()
                
                # Disable proxy temporarily after too many failures
                if proxy_info.failures >= 3:
                    proxy_info.enabled = False
                    logger.warning(f"Proxy {proxy_info.proxy} disabled due to multiple failures")
                
                logger.debug(f"Proxy {proxy_info.proxy} marked as failed (failures: {proxy_info.failures})")
                break

    async def mark_success(self, proxy_url: str, response_time: float):
        """Mark a proxy as successful."""
        if not proxy_url or not self.proxies:
            return
            
        for proxy_info in self.proxies:
            if proxy_info.proxy in proxy_url:
                proxy_info.success_count += 1
                # Update average response time
                if proxy_info.avg_response_time == 0:
                    proxy_info.avg_response_time = response_time
                else:
                    proxy_info.avg_response_time = (proxy_info.avg_response_time + response_time) / 2
                
                # Reset failures on success
                if proxy_info.failures > 0:
                    proxy_info.failures = 0
                    
                # Re-enable if previously disabled
                if not proxy_info.enabled:
                    proxy_info.enabled = True
                    logger.info(f"Re-enabled proxy {proxy_info.proxy} after success")
                
                break

    async def health_check(self):
        """Check health of all proxies."""
        if not settings.PROXY_ENABLED or not self.proxies:
            return
            
        now = datetime.utcnow()
        if (now - self._last_health_check).total_seconds() < self._health_check_interval:
            return
            
        logger.info("Starting proxy health check...")
        self._last_health_check = now
        
        async with aiohttp.ClientSession() as session:
            tasks = [self._check_proxy_health(session, proxy) for proxy in self.proxies]
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _check_proxy_health(self, session: aiohttp.ClientSession, proxy_info: ProxyInfo):
        """Check the health of a single proxy."""
        if not proxy_info.enabled and proxy_info.last_failed:
            # Check if enough time has passed to re-enable
            time_since_failure = (datetime.utcnow() - proxy_info.last_failed).total_seconds()
            if time_since_failure < 3600:  # 1 hour cooldown
                return
                
        proxy_dict = self._format_proxy(proxy_info.proxy)
        
        try:
            start_time = time.monotonic()
            async with session.get(self._test_url, proxy=proxy_dict.get('http'), timeout=10) as response:
                if response.status == 200:
                    response_time = (time.monotonic() - start_time) * 1000  # in ms
                    await self.mark_success(proxy_info.proxy, response_time)
                    logger.debug(f"Proxy {proxy_info.proxy} is healthy (response time: {response_time:.2f}ms)")
                else:
                    await self.mark_failed(proxy_info.proxy)
                    logger.warning(f"Proxy {proxy_info.proxy} returned status {response.status}")
        except Exception as e:
            await self.mark_failed(proxy_info.proxy)
            logger.debug(f"Proxy {proxy_info.proxy} health check failed: {str(e)}")

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about proxy usage."""
        enabled = [p for p in self.proxies if p.enabled]
        disabled = [p for p in self.proxies if not p.enabled]
        
        return {
            "total_proxies": len(self.proxies),
            "enabled": len(enabled),
            "disabled": len(disabled),
            "avg_success_rate": sum(p.success_count for p in self.proxies) / max(1, len(self.proxies)),
            "avg_response_time": sum(p.avg_response_time for p in self.proxies) / max(1, len(self.proxies))
        }

# Global instance
proxy_manager = ProxyManager()
