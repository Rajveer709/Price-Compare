import os
import logging
from typing import Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

logger = logging.getLogger(__name__)

class AffiliateManager:
    """Manages affiliate link generation and tracking."""
    
    def __init__(self, affiliate_tag: Optional[str] = None):
        """
        Initialize the AffiliateManager.
        
        Args:
            affiliate_tag: Your Amazon Associates tracking ID (e.g., 'yourstore-20')
        """
        self.affiliate_tag = affiliate_tag or os.getenv('AMAZON_AFFILIATE_TAG')
        
    def convert_to_affiliate_link(self, url: str, custom_tag: Optional[str] = None) -> str:
        """
        Convert a regular Amazon product URL to an affiliate link.
        
        Args:
            url: The original product URL
            custom_tag: Optional custom affiliate tag to override the default
            
        Returns:
            str: The affiliate link with tracking parameters
        """
        if not url or 'amazon.' not in url.lower():
            return url
            
        tag = custom_tag or self.affiliate_tag
        if not tag:
            logger.warning("No affiliate tag provided. Using regular URL.")
            return url
            
        try:
            parsed = urlparse(url)
            query_params = parse_qs(parsed.query)
            
            # Update or add the affiliate tag
            query_params['tag'] = tag
            
            # Remove any existing tracking parameters
            for param in ['ref_', 'tag_', 'asc_', 'creative_']:
                query_params = {k: v for k, v in query_params.items() 
                              if not k.startswith(param)}
            
            # Rebuild the URL
            new_query = urlencode(query_params, doseq=True)
            new_parsed = parsed._replace(query=new_query)
            affiliate_url = urlunparse(new_parsed)
            
            logger.debug(f"Converted URL to affiliate link: {affiliate_url}")
            return affiliate_url
            
        except Exception as e:
            logger.error(f"Error converting to affiliate link: {str(e)}")
            return url

# Global instance
affiliate_manager = AffiliateManager()
