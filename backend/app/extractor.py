import re
import logging
from typing import Dict, List, Optional, Union, Any, Tuple
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import lxml.html

logger = logging.getLogger(__name__)

class DataExtractor:
    """Handles data extraction from web pages using CSS selectors or XPath."""
    
    def __init__(self, html_content: str = None, url: str = None):
        """Initialize the extractor with HTML content and optional URL.
        
        Args:
            html_content: Raw HTML content as string
            url: URL of the page (used for normalizing relative URLs)
        """
        self.html_content = html_content
        self.url = url
        self.base_url = self._get_base_url(url) if url else None
        
        # Initialize parsers
        self.soup = BeautifulSoup(html_content, 'lxml') if html_content else None
        self.tree = lxml.html.fromstring(html_content) if html_content else None
        
        # Common price patterns
        self.price_patterns = [
            r'\$\s*\d+(\.\d{1,2})?',  # $10.99
            r'\d+(\.\d{1,2})?\s*(?:USD|EUR|GBP|JPY)',  # 10.99 USD
            r'\d+[\s\d,]*(\.\d{1,2})?',  # 1,234.56 or 1 234,56
        ]
    
    def _get_base_url(self, url: str) -> str:
        """Extract base URL from a full URL."""
        if not url:
            return ''
        
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"
    
    def _normalize_url(self, url: str) -> str:
        """Normalize a URL by making it absolute if it's relative."""
        if not url or not self.base_url:
            return url
            
        if url.startswith(('http://', 'https://')):
            return url
            
        # Handle relative URLs
        if url.startswith('/'):
            return f"{self.base_url.rstrip('/')}{url}"
        else:
            return f"{self.base_url.rstrip('/')}/{url}"
    
    def extract(self, selector: str, method: str = 'css', attr: str = None, 
               first: bool = True, clean: bool = True) -> Union[str, List[str], None]:
        """Extract data using CSS selector or XPath.
        
        Args:
            selector: CSS selector or XPath expression
            method: 'css' or 'xpath'
            attr: Attribute to extract (if None, extracts text content)
            first: Return only the first match if True, otherwise return all matches
            clean: Clean whitespace and normalize text if True
            
        Returns:
            Extracted data as string or list of strings, or None if not found
        """
        if not self.html_content:
            logger.warning("No HTML content to extract from")
            return None if first else []
        
        try:
            if method.lower() == 'css':
                return self._extract_css(selector, attr, first, clean)
            elif method.lower() == 'xpath':
                return self._extract_xpath(selector, attr, first, clean)
            else:
                logger.error(f"Unsupported extraction method: {method}")
                return None if first else []
                
        except Exception as e:
            logger.error(f"Error during extraction: {e}")
            return None if first else []
    
    def _extract_css(self, selector: str, attr: str = None, 
                    first: bool = True, clean: bool = True) -> Union[str, List[str], None]:
        """Extract data using CSS selector."""
        if not self.soup:
            return None if first else []
            
        try:
            elements = self.soup.select(selector)
            if not elements:
                return None if first else []
                
            results = []
            for elem in elements:
                if attr:
                    # Handle special attributes like 'href' for URLs
                    value = elem.get(attr, '')
                    if attr in ['href', 'src'] and value:
                        value = self._normalize_url(value)
                else:
                    value = elem.get_text()
                    if clean:
                        value = self._clean_text(value)
                
                results.append(value)
                
            return results[0] if first and results else results
            
        except Exception as e:
            logger.error(f"CSS extraction failed for '{selector}': {e}")
            return None if first else []
    
    def _extract_xpath(self, xpath: str, attr: str = None, 
                      first: bool = True, clean: bool = True) -> Union[str, List[str], None]:
        """Extract data using XPath."""
        if not self.tree:
            return None if first else []
            
        try:
            elements = self.tree.xpath(xpath)
            if not elements:
                return None if first else []
                
            results = []
            for elem in elements:
                if attr and hasattr(elem, 'get'):
                    value = elem.get(attr, '')
                    if attr in ['href', 'src'] and value:
                        value = self._normalize_url(value)
                else:
                    if hasattr(elem, 'text_content'):
                        value = elem.text_content()
                    else:
                        value = str(elem)
                    
                    if clean:
                        value = self._clean_text(value)
                
                results.append(value)
                
            return results[0] if first and results else results
            
        except Exception as e:
            logger.error(f"XPath extraction failed for '{xpath}': {e}")
            return None if first else []
    
    def extract_price(self, selector: str = None, method: str = 'css', 
                     currency: str = '$') -> Optional[float]:
        """Extract and parse a price value.
        
        Args:
            selector: Optional selector to find the price element
            method: 'css' or 'xpath'
            currency: Currency symbol to look for
            
        Returns:
            Price as float, or None if not found
        """
        # If selector is provided, extract the text first
        text = None
        if selector:
            result = self.extract(selector, method=method, first=True, clean=True)
            if not result:
                return None
            text = str(result)
        
        # If no selector, search the entire document
        text = text or self.soup.get_text() if self.soup else ""
        
        # Try to find a price in the text
        price_match = self._find_price_in_text(text, currency)
        if price_match:
            return price_match
            
        return None
    
    def _find_price_in_text(self, text: str, currency: str = '$') -> Optional[float]:
        """Find and parse a price from text."""
        if not text:
            return None
            
        # Try different price patterns
        for pattern in self.price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    # Clean the match and convert to float
                    price_str = str(matches[0]).replace(currency, '').strip()
                    price_str = price_str.replace(',', '')
                    return float(price_str)
                except (ValueError, IndexError):
                    continue
                    
        return None
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
            
        # Replace multiple whitespace with single space
        text = ' '.join(text.split())
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def extract_metadata(self) -> Dict[str, Any]:
        """Extract metadata from the HTML document."""
        if not self.soup:
            return {}
            
        metadata = {
            'title': None,
            'description': None,
            'keywords': [],
            'language': 'en',
            'canonical_url': None,
            'og': {},
            'twitter': {}
        }
        
        # Basic meta tags
        if self.soup.title:
            metadata['title'] = self.soup.title.string
            
        meta_desc = self.soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            metadata['description'] = meta_desc['content']
            
        meta_keywords = self.soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords and meta_keywords.get('content'):
            metadata['keywords'] = [k.strip() for k in meta_keywords['content'].split(',')]
        
        # Language
        html_tag = self.soup.find('html')
        if html_tag and html_tag.get('lang'):
            metadata['language'] = html_tag['lang']
            
        # Canonical URL
        canonical = self.soup.find('link', rel='canonical')
        if canonical and canonical.get('href'):
            metadata['canonical_url'] = self._normalize_url(canonical['href'])
        
        # Open Graph metadata
        for meta in self.soup.find_all('meta', property=lambda x: x and x.startswith('og:')):
            key = meta['property'][3:]  # Remove 'og:' prefix
            metadata['og'][key] = meta.get('content')
        
        # Twitter Card metadata
        for meta in self.soup.find_all('meta', attrs={'name': lambda x: x and x.startswith('twitter:')}):
            key = meta['name'][8:]  # Remove 'twitter:' prefix
            metadata['twitter'][key] = meta.get('content')
        
        return metadata
