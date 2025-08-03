import logging
import time
from typing import Optional, Dict, Any, Union, Tuple
from anticaptchaofficial.recaptchav2proxyless import recaptchaV2Proxyless
from anticaptchaofficial.hcaptchaproxyless import hCaptchaProxyless

from .config import settings

logger = logging.getLogger(__name__)

class CaptchaSolver:
    """Handles CAPTCHA solving using Anti-Captcha service."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the CAPTCHA solver with API key."""
        self.api_key = api_key or settings.ANTICAPTCHA_KEY
        self.solvers = {
            'recaptcha': self._solve_recaptcha,
            'hcaptcha': self._solve_hcaptcha,
        }
        
    async def solve_captcha(
        self,
        captcha_type: str,
        website_url: str,
        website_key: str,
        **kwargs
    ) -> Optional[str]:
        """
        Solve a CAPTCHA.
        
        Args:
            captcha_type: Type of CAPTCHA ('recaptcha' or 'hcaptcha')
            website_url: URL of the page with CAPTCHA
            website_key: Site key for the CAPTCHA
            **kwargs: Additional parameters for the specific CAPTCHA type
            
        Returns:
            str: The CAPTCHA solution token, or None if failed
        """
        if not self.api_key:
            logger.warning("No Anti-Captcha API key provided")
            return None
            
        solver = self.solvers.get(captcha_type.lower())
        if not solver:
            logger.error(f"Unsupported CAPTCHA type: {captcha_type}")
            return None
            
        try:
            return await solver(website_url, website_key, **kwargs)
        except Exception as e:
            logger.error(f"Error solving {captcha_type} CAPTCHA: {str(e)}")
            return None
    
    def _solve_recaptcha(
        self,
        website_url: str,
        website_key: str,
        **kwargs
    ) -> Optional[str]:
        """Solve reCAPTCHA v2."""
        solver = recaptchaV2Proxyless()
        solver.set_verbose(settings.DEBUG)
        solver.set_key(self.api_key)
        solver.set_website_url(website_url)
        solver.set_website_key(website_key)
        
        # Additional parameters
        if 'invisible' in kwargs:
            solver.set_is_invisible(kwargs['invisible'])
        if 'enterprise' in kwargs:
            solver.set_enterprise_payload(kwargs['enterprise'])
        
        logger.info(f"Solving reCAPTCHA for {website_url}")
        start_time = time.time()
        
        try:
            result = solver.solve_and_return_solution()
            elapsed = time.time() - start_time
            
            if result != 0:
                logger.info(f"reCAPTCHA solved in {elapsed:.2f}s")
                return result
            else:
                logger.error(f"Failed to solve reCAPTCHA: {solver.error_code}")
                return None
        except Exception as e:
            logger.error(f"Exception while solving reCAPTCHA: {str(e)}")
            return None
    
    def _solve_hcaptcha(
        self,
        website_url: str,
        website_key: str,
        **kwargs
    ) -> Optional[str]:
        """Solve hCaptcha."""
        solver = hCaptchaProxyless()
        solver.set_verbose(settings.DEBUG)
        solver.set_key(self.api_key)
        solver.set_website_url(website_url)
        solver.set_website_key(website_key)
        
        # Additional parameters
        if 'user_agent' in kwargs:
            solver.set_user_agent(kwargs['user_agent'])
        
        logger.info(f"Solving hCaptcha for {website_url}")
        start_time = time.time()
        
        try:
            result = solver.solve_and_return_solution()
            elapsed = time.time() - start_time
            
            if result != 0:
                logger.info(f"hCaptcha solved in {elapsed:.2f}s")
                return result
            else:
                logger.error(f"Failed to solve hCaptcha: {solver.error_code}")
                return None
        except Exception as e:
            logger.error(f"Exception while solving hCaptcha: {str(e)}")
            return None

# Global instance
captcha_solver = CaptchaSolver() if settings.ANTICAPTCHA_KEY else None
