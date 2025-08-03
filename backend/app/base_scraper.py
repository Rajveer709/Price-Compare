import random
import time
import logging
import json
import asyncio
from typing import Dict, Optional, Any, List, Tuple, Union
from dataclasses import dataclass, field
import aiohttp
from aiohttp import ClientSession, ClientTimeout, ClientResponseError
from fake_useragent import UserAgent
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
    retry_any
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class RequestConfig:
    """Configuration for HTTP requests."""
    timeout: int = 30
    max_retries: int = 3
    delay_range: Tuple[float, float] = (1.0, 3.0)
    
@dataclass
class ScraperConfig:
    """Configuration for the scraper."""
    request_config: RequestConfig = field(default_factory=RequestConfig)
    proxy_list: List[str] = field(default_factory=list)
    user_agent_rotator: Optional[UserAgent] = field(default_factory=UserAgent)

class BaseScraper:
    """Base class for all scrapers with common functionality."""
    
    def __init__(self, config: Optional[ScraperConfig] = None):
        """Initialize the base scraper with configuration."""
        self.config = config or ScraperConfig()
        self.session = None
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize required components."""
        if self.config.user_agent_rotator is None:
            self.config.user_agent_rotator = UserAgent()
        
        if self.config.proxy_list is None:
            self.config.proxy_list = []
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.start_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close_session()
    
    async def start_session(self):
        """Start a new aiohttp session."""
        if self.session is None or self.session.closed:
            timeout = ClientTimeout(total=self.config.request_config.timeout)
            self.session = ClientSession(timeout=timeout)
    
    async def close_session(self):
        """Close the aiohttp session."""
        if self.session and not self.session.closed:
            await self.session.close()
    
    def get_random_user_agent(self) -> str:
        """Get a random user agent."""
        return self.config.user_agent_rotator.random
    
    def get_random_proxy(self) -> Optional[str]:
        """Get a random proxy from the proxy list."""
        if not self.config.proxy_list:
            return None
        return random.choice(self.config.proxy_list)
    
    def _get_request_headers(self) -> Dict[str, str]:
        """Get default request headers with a random user agent and realistic browser headers."""
        ua = UserAgent()
        
        # Common browser accept headers
        accept_language = 'en-US,en;q=0.9'
        accept_encoding = 'gzip, deflate, br'
        
        # Common browser headers
        headers = {
            'User-Agent': ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': accept_language,
            'Accept-Encoding': accept_encoding,
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'DNT': '1',  # Do Not Track
            'Referer': 'https://www.amazon.com/',
            'Pragma': 'no-cache',
        }
        
        # Add some randomness to headers to appear more like a real browser
        if random.random() > 0.5:
            headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
            
        # Rotate between different accept languages occasionally
        if random.random() > 0.8:
            headers['Accept-Language'] = random.choice([
                'en-US,en;q=0.9',
                'en-GB,en;q=0.9',
                'en;q=0.8',
                'en-US,en;q=0.7',
            ])
            
        return headers
    
    async def _make_request(self, url: str, method: str = 'GET', **kwargs) -> Optional[str]:
        """Make an HTTP request with retries and error handling."""
        attempt = 0
        max_attempts = self.config.request_config.max_retries + 1  # +1 for the initial attempt
        
        while attempt < max_attempts:
            attempt += 1
            proxy = self.get_random_proxy()
            proxy_url = f"http://{proxy}" if proxy else None
            
            headers = self._get_request_headers()
            if 'headers' in kwargs:
                headers.update(kwargs.pop('headers'))
            
            try:
                logger.info(f"Making {method} request to {url} (attempt {attempt}/{max_attempts})")
                logger.debug(f"Request headers: {json.dumps(headers, indent=2)}")
                
                async with self.session.request(
                    method,
                    url,
                    proxy=proxy_url,
                    headers=headers,
                    timeout=ClientTimeout(total=self.config.request_config.timeout),
                    **kwargs
                ) as response:
                    logger.info(f"Received response with status: {response.status}")
                    
                    # Log response headers for debugging
                    logger.debug(f"Response headers: {dict(response.headers)}")
                    
                    # Check for error responses
                    if response.status >= 400:
                        error_text = await response.text()
                        logger.error(f"Error response ({response.status}): {error_text[:500]}")
                        
                        # If we get a 429 (Too Many Requests), wait before retrying
                        if response.status == 429:
                            retry_after = int(response.headers.get('Retry-After', 5))
                            logger.warning(f"Rate limited. Waiting {retry_after} seconds before retry...")
                            await asyncio.sleep(retry_after)
                            continue
                            
                        response.raise_for_status()
                    
                    # Get response text
                    text = await response.text()
                    logger.debug(f"Response length: {len(text)} bytes")
                    
                    # Check for captcha or bot detection
                    if any(term in text.lower() for term in ['captcha', 'bot', 'robot']):
                        logger.warning("Detected possible CAPTCHA or bot detection")
                    
                    return text
                    
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                logger.error(f"Request failed (attempt {attempt}/{max_attempts}): {str(e)}")
                if attempt == max_attempts:
                    logger.error(f"Max retries ({max_attempts}) reached for {url}")
                    return None
                
                # Exponential backoff with jitter
                delay = min(2 ** attempt + random.uniform(0, 1), 10)
                logger.info(f"Retrying in {delay:.2f} seconds...")
                await asyncio.sleep(delay)
                
        return None
    
    async def get(self, url: str, **kwargs) -> Optional[str]:
        """Make a GET request."""
        return await self._make_request(url, 'GET', **kwargs)
    
    async def post(self, url: str, **kwargs) -> Optional[str]:
        """Make a POST request."""
        return await self._make_request(url, 'POST', **kwargs)
    
    async def extract_data(self, html: str) -> Dict[str, Any]:
        """Extract data from HTML. To be implemented by subclasses."""
        raise NotImplementedError("Subclasses must implement extract_data method")
    
    async def scrape(self, url: str) -> Optional[Dict[str, Any]]:
        """Main scraping method that combines fetching and parsing."""
        html = await self.get(url)
        if not html:
            return None
        
        # Add a random delay between requests
        if self.config.request_config.delay_range:
            delay = random.uniform(*self.config.request_config.delay_range)
            await asyncio.sleep(delay)
        
        return await self.extract_data(html)
