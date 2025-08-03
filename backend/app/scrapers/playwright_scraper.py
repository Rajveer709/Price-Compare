import asyncio
import logging
import random
import time
from typing import Dict, Any, Optional, List, Tuple

from playwright.async_api import async_playwright, Browser, Page, BrowserContext, TimeoutError
from ..utils.cookie_manager import cookie_manager
from ..utils.captcha_handler import captcha_handler

logger = logging.getLogger(__name__)

class PlaywrightScraper:
    """A headless browser scraper using Playwright with cookie management."""
    
    def __init__(self, headless: bool = True, use_cookies: bool = True):
        """
        Initialize the Playwright scraper.
        
        Args:
            headless: Whether to run browser in headless mode
            use_cookies: Whether to enable cookie management
        """
        self.headless = headless
        self.use_cookies = use_cookies
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.domain: Optional[str] = None
        self.start_time: float = 0
        self.timeout: int = 60000  # 60 seconds default timeout
        
    async def __aenter__(self):
        await self.start()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
        
    async def start(self):
        """Start Playwright browser with anti-detection settings."""
        self.playwright = await async_playwright().start()
        
        # Launch browser with stealth settings
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        # Create a new browser context
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York'
        )
        
        # Create a new page
        self.page = await self.context.new_page()
        
        # Apply stealth settings
        await self.page.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        """)
        
    async def close(self):
        """Close the browser and save cookies if enabled."""
        if self.page:
            if self.use_cookies and self.domain:
                await self._save_cookies()
            await self.page.close()
            
        if self.context:
            await self.context.close()
            
        if self.browser:
            await self.browser.close()
            
        if hasattr(self, 'playwright') and self.playwright:
            await self.playwright.stop()
    
    async def get_page_content(
        self, 
        url: str, 
        wait_for: str = None, 
        timeout: int = None,
        handle_captcha: bool = True
    ) -> Tuple[Optional[str], bool]:
        """
        Get page content after JavaScript execution with cookie management.
        
        Args:
            url: The URL to navigate to
            wait_for: Optional CSS selector to wait for
            timeout: Maximum time to wait in milliseconds
            handle_captcha: Whether to attempt CAPTCHA solving
            
        Returns:
            Tuple of (page_content, success)
        """
        if not self.page:
            await self.start()
            
        self.start_time = time.time()
        timeout = timeout or self.timeout
        self.domain = self._extract_domain(url)
        
        try:
            # Load cookies if enabled
            if self.use_cookies and self.domain:
                await self._load_cookies()
            
            # Navigate to the URL with retries
            success = await self._navigate_with_retries(url, timeout)
            if not success:
                return None, False
            
            # Handle CAPTCHA if detected
            if handle_captcha:
                page_content = await self.page.content()
                if await captcha_handler.detect_captcha(page_content):
                    logger.warning("CAPTCHA detected, attempting to solve...")
                    if not await captcha_handler.handle_captcha(self.page):
                        logger.error("Failed to solve CAPTCHA")
                        return None, False
            
            # Wait for specific element if requested
            if wait_for:
                try:
                    await self.page.wait_for_selector(
                        wait_for, 
                        timeout=min(10000, timeout)
                    )
                except TimeoutError:
                    logger.warning(f"Timed out waiting for selector: {wait_for}")
            
            # Save cookies if enabled
            if self.use_cookies and self.domain:
                await self._save_cookies()
                
            return await self.page.content(), True
            
        except Exception as e:
            logger.error(f"Error getting page content: {e}")
            if self.page:
                try:
                    await self.page.screenshot(path=f'error_{int(time.time())}.png')
                except Exception as screenshot_error:
                    logger.error(f"Failed to take screenshot: {screenshot_error}")
            return None, False
    
    async def _navigate_with_retries(self, url: str, timeout: int, max_retries: int = 3) -> bool:
        """Navigate to URL with retries and error handling."""
        for attempt in range(max_retries):
            try:
                # Calculate remaining timeout
                elapsed = (time.time() - self.start_time) * 1000
                remaining_timeout = max(1000, timeout - elapsed)  # Ensure at least 1 second
                
                # Set navigation timeout
                self.page.set_default_navigation_timeout(remaining_timeout)
                
                # Add random delays between retries
                if attempt > 0:
                    delay = random.uniform(1, 3)
                    await asyncio.sleep(delay)
                
                # Navigate to the URL
                await self.page.goto(
                    url, 
                    wait_until='domcontentloaded',
                    timeout=remaining_timeout
                )
                
                # Wait for page to fully load
                await self.page.wait_for_load_state('networkidle')
                
                return True
                
            except TimeoutError:
                logger.warning(f"Navigation timeout (attempt {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    logger.error(f"Failed to load {url} after {max_retries} attempts")
                    return False
                
            except Exception as e:
                logger.error(f"Navigation error: {e}")
                if attempt == max_retries - 1:
                    return False
                
        return False
    
    async def _load_cookies(self):
        """Load cookies for the current domain with error handling."""
        if not self.domain or not self.context:
            return
            
        try:
            cookies = await cookie_manager.load_cookies(self.domain)
            if cookies:
                await self.context.add_cookies(cookies)
                logger.debug(f"Loaded {len(cookies)} cookies for {self.domain}")
        except Exception as e:
            logger.error(f"Error loading cookies: {e}")
    
    async def _save_cookies(self):
        """Save cookies for the current domain."""
        if not self.domain or not self.page:
            return
            
        cookies = await self.page.context.cookies()
        if cookies:
            await cookie_manager.save_cookies(self.domain, cookies)
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL."""
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        # Remove www. prefix if present
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
