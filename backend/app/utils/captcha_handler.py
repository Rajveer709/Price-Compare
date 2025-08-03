import logging
import asyncio
from typing import Optional, Dict, Any
import random

logger = logging.getLogger(__name__)

class CaptchaHandler:
    """Handles CAPTCHA detection and solving strategies."""
    
    def __init__(self, max_attempts: int = 3):
        """
        Initialize the CAPTCHA handler.
        
        Args:
            max_attempts: Maximum number of CAPTCHA solving attempts
        """
        self.max_attempts = max_attempts
        
    async def detect_captcha(self, page_content: str) -> bool:
        """
        Detect if the page contains a CAPTCHA.
        
        Args:
            page_content: HTML content of the page
            
        Returns:
            bool: True if CAPTCHA is detected, False otherwise
        """
        captcha_indicators = [
            'captcha',
            'g-recaptcha',
            'hcaptcha',
            'recaptcha',
            'robot',
            'verification',
            'challenge',
            'enter the characters you see',
            'prove you are human',
            'are you a robot',
            'cloudflare',
            'distil_r_block'
        ]
        
        content_lower = page_content.lower()
        return any(indicator in content_lower for indicator in captcha_indicators)
    
    async def handle_captcha(self, page, max_attempts: int = 3) -> bool:
        """
        Handle CAPTCHA on the current page with multiple strategies.
        
        Args:
            page: Playwright page object
            max_attempts: Maximum number of attempts to solve CAPTCHA
            
        Returns:
            bool: True if CAPTCHA was handled successfully, False otherwise
        """
        content = await page.content()
        if not await self.detect_captcha(content):
            return True
            
        logger.warning("CAPTCHA detected, attempting to solve...")
        
        # Try multiple CAPTCHA solving strategies
        strategies = [
            self._solve_by_refresh,
            self._solve_by_navigation,
            self._solve_by_waiting,
        ]
        
        for attempt in range(1, max_attempts + 1):
            logger.info(f"Attempt {attempt}/{max_attempts} to solve CAPTCHA")
            
            # Try each strategy in order
            for strategy in strategies:
                try:
                    logger.info(f"Trying strategy: {strategy.__name__}")
                    success = await strategy(page)
                    if success:
                        logger.info("CAPTCHA solved successfully!")
                        return True
                except Exception as e:
                    logger.error(f"Error in {strategy.__name__}: {str(e)}")
            
            # Wait before next attempt with increasing delay
            if attempt < max_attempts:
                retry_delay = random.uniform(5, 15) * (attempt + 1)  # Increase delay with each attempt
                retry_delay = min(retry_delay, 60)  # Cap at 60 seconds
                logger.info(f"Waiting {retry_delay:.1f} seconds before next attempt...")
                await asyncio.sleep(retry_delay)
        
        logger.error("All CAPTCHA solving attempts failed")
        return False
        
    async def _solve_by_refresh(self, page) -> bool:
        """Try to bypass CAPTCHA by refreshing the page."""
        logger.info("Attempting to solve CAPTCHA by refreshing the page")
        await page.reload(wait_until="networkidle")
        return not await self._detect_captcha(page)
        return not await self.detect_captcha(await page.content())
    
    async def _solve_with_retry(self, page) -> bool:
        """Try solving CAPTCHA by waiting and retrying."""
        logger.info("Attempting to solve CAPTCHA by waiting and retrying")
        await asyncio.sleep(10)  # Wait for CAPTCHA to potentially resolve itself
        await page.wait_for_load_state('networkidle')
        return not await self.detect_captcha(await page.content())
    
    async def _solve_with_delays(self, page) -> bool:
        """Try solving CAPTCHA by simulating human-like delays."""
        logger.info("Attempting to solve CAPTCHA with human-like delays")
        
        # Simulate human-like behavior
        actions = [
            (page.mouse.move, (100, 100), {}),
            (asyncio.sleep, (1,), {}),
            (page.mouse.down, (), {}),
            (asyncio.sleep, (0.2,), {}),
            (page.mouse.up, (), {}),
            (asyncio.sleep, (0.5,), {}),
            (page.keyboard.press, ('Tab',), {'delay': random.randint(50, 150)}),
            (asyncio.sleep, (0.5,), {}),
            (page.keyboard.press, ('Tab',), {'delay': random.randint(50, 150)}),
            (asyncio.sleep, (0.5,), {}),
            (page.keyboard.press, ('Enter',), {'delay': random.randint(50, 150)}),
            (asyncio.sleep, (3,), {}),  # Wait for any potential submission
        ]
        
        for action, args, kwargs in actions:
            await action(*args, **kwargs)
            
        return not await self.detect_captcha(await page.content())

# Global CAPTCHA handler instance
captcha_handler = CaptchaHandler()
