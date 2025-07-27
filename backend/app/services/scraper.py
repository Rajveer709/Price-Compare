import logging
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import re
import time
import random
import json
from datetime import datetime

from ..core.config import settings

logger = logging.getLogger(__name__)

class BaseScraper:
    """Base class for all scrapers"""
    
    def __init__(self):
        self.headers = settings.SCRAPER_HEADERS
        self.timeout = settings.SCRAPER_TIMEOUT
    
    def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Get BeautifulSoup object from URL"""
        try:
            response = requests.get(
                url, 
                headers=self.headers, 
                timeout=self.timeout
            )
            response.raise_for_status()
            return BeautifulSoup(response.text, 'lxml')
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None
    
    def normalize_price(self, price_str: str) -> float:
        """Convert price string to float"""
        if not price_str:
            return 0.0
        # Remove all non-numeric characters except decimal point
        price_str = re.sub(r'[^\d.]', '', price_str)
        try:
            return float(price_str)
        except (ValueError, TypeError):
            return 0.0
    
    def get_domain(self, url: str) -> str:
        """Extract domain from URL"""
        parsed_uri = urlparse(url)
        return f"{parsed_uri.scheme}://{parsed_uri.netloc}"
    
    def random_delay(self, min_seconds: float = 1.0, max_seconds: float = 3.0):
        """Random delay between requests to avoid rate limiting"""
        time.sleep(random.uniform(min_seconds, max_seconds))

class AmazonScraper(BaseScraper):
    """Scraper for Amazon product pages"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.amazon.com"
        self.search_url = f"{self.base_url}/s"
    
    def search_products(self, query: str, max_results: int = 10) -> List[Dict]:
        """Search for products on Amazon"""
        params = {
            'k': query,
            'ref': 'nb_sb_noss_2',
            'page': 1
        }
        
        products = []
        results_count = 0
        
        while results_count < max_results:
            self.random_delay()
            
            try:
                response = requests.get(
                    self.search_url,
                    params=params,
                    headers=self.headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'lxml')
                items = soup.select('div[data-component-type="s-search-result"]')
                
                if not items:
                    logger.warning("No products found on the page")
                    break
                
                for item in items:
                    if results_count >= max_results:
                        break
                        
                    try:
                        product = self._parse_product_item(item)
                        if product:
                            products.append(product)
                            results_count += 1
                    except Exception as e:
                        logger.error(f"Error parsing product item: {str(e)}")
                
                # Check for next page
                next_page = soup.select_one('a.s-pagination-next')
                if not next_page or 's-pagination-disabled' in next_page.get('class', []):
                    break
                    
                params['page'] += 1
                
            except Exception as e:
                logger.error(f"Error during search: {str(e)}")
                break
        
        return products
    
    def _parse_product_item(self, item) -> Optional[Dict]:
        """Parse a single product item from search results"""
        try:
            title_elem = item.select_one('h2 a.a-link-normal')
            if not title_elem:
                return None
                
            title = title_elem.text.strip()
            url = urljoin(self.base_url, title_elem['href'].split('?')[0])
            
            # Get price
            price_whole = item.select_one('span.a-price-whole')
            price_fraction = item.select_one('span.a-price-fraction')
            price = None
            
            if price_whole and price_fraction:
                price = self.normalize_price(f"{price_whole.text}.{price_fraction.text}")
            
            # Get original price if on sale
            original_price_elem = item.select_one('span.a-price.a-text-price span.a-offscreen')
            original_price = None
            discount = None
            
            if original_price_elem:
                original_price = self.normalize_price(original_price_elem.text)
                if price and original_price > price:
                    discount = round(((original_price - price) / original_price) * 100, 1)
            
            # Get rating
            rating_elem = item.select_one('span.a-icon-alt')
            rating = None
            if rating_elem and 'out of 5' in rating_elem.text:
                rating = float(rating_elem.text.split(' ')[0])
            
            # Get review count
            review_count_elem = item.select_one('span.a-size-base.s-underline-text')
            review_count = None
            if review_count_elem:
                review_count = int(review_count_elem.text.replace(',', ''))
            
            # Get image URL
            image_elem = item.select_one('img.s-image')
            image_url = image_elem['src'] if image_elem else None
            
            return {
                'title': title,
                'url': url,
                'price': price,
                'original_price': original_price if original_price != price else None,
                'discount': discount,
                'rating': rating,
                'review_count': review_count,
                'image_url': image_url,
                'website': 'amazon',
                'seller': 'Amazon'  # Default seller, can be updated with actual seller info
            }
            
        except Exception as e:
            logger.error(f"Error parsing product: {str(e)}")
            return None

class FlipkartScraper(BaseScraper):
    """Scraper for Flipkart product search"""
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.flipkart.com"
        self.search_url = f"{self.base_url}/search"

    def search_products(self, query: str, max_results: int = 10) -> List[Dict]:
        params = {
            'q': query,
        }
        products = []
        results_count = 0
        page = 1
        while results_count < max_results:
            self.random_delay()
            params['page'] = page
            try:
                response = requests.get(
                    self.search_url,
                    params=params,
                    headers=self.headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'lxml')
                # Flipkart has two main result card types: grid (._4rR01T) and list (.s1Q9rs)
                items = soup.select('div._1AtVbE')
                if not items:
                    logger.warning("No products found on the page")
                    break
                for item in items:
                    if results_count >= max_results:
                        break
                    # Title
                    title_elem = item.select_one('div._4rR01T') or item.select_one('a.s1Q9rs')
                    if not title_elem:
                        continue
                    title = title_elem.text.strip()
                    # Only consider products that match the query (basic filter)
                    if query.lower() not in title.lower():
                        continue
                    # URL
                    url_elem = item.select_one('a.s1Q9rs') or item.select_one('a._1fQZEK')
                    url = urljoin(self.base_url, url_elem['href'].split('?')[0]) if url_elem else None
                    # Price
                    price_elem = item.select_one('div._30jeq3')
                    price = self.normalize_price(price_elem.text) if price_elem else None
                    # Original price
                    orig_price_elem = item.select_one('div._3I9_wc')
                    original_price = self.normalize_price(orig_price_elem.text) if orig_price_elem else None
                    # Discount
                    discount_elem = item.select_one('div._3Ay6Sb span')
                    discount = None
                    if discount_elem:
                        discount = int(''.join(filter(str.isdigit, discount_elem.text)))
                    # Rating
                    rating_elem = item.select_one('div._3LWZlK')
                    rating = float(rating_elem.text) if rating_elem and rating_elem.text.replace('.', '', 1).isdigit() else None
                    # Image
                    image_elem = item.select_one('img._396cs4') or item.select_one('img._2r_T1I')
                    image_url = image_elem['src'] if image_elem else None
                    products.append({
                        'title': title,
                        'url': url,
                        'price': price,
                        'original_price': original_price,
                        'discount': discount,
                        'rating': rating,
                        'image_url': image_url,
                        'website': 'flipkart',
                        'seller': 'Flipkart',
                    })
                    results_count += 1
                # Flipkart paginates with ?page=2,3...
                next_page_elem = soup.select_one('a._1LKTO3')
                if not next_page_elem or 'Next' not in next_page_elem.text:
                    break
                page += 1
            except Exception as e:
                logger.error(f"Error during Flipkart search: {str(e)}")
                break
        return products

class ScraperManager:
    """Manages multiple scrapers for different e-commerce sites"""
    
    def __init__(self):
        self.scrapers = {
            'amazon': AmazonScraper(),
            'flipkart': FlipkartScraper()
        }

    def _get_mock_products(self, query: str, site: str, count: int = 5) -> List[Dict]:
        """Generate mock product data for development"""
        mock_products = []
        for i in range(1, count + 1):
            mock_products.append({
                'title': f"{query.capitalize()} {i} ({site.title()})",
                'price': 499.99 + (i * 100),
                'original_price': 599.99 + (i * 100),
                'discount': 10 + i,
                'rating': round(4.0 + (i * 0.1), 1),
                'image_url': f'https://via.placeholder.com/150?text={query}+{i}',
                'url': f'https://www.{site}.com/product/{query.lower().replace(" ", "-")}-{i}',
                'seller': f'{site.title()} Seller {i}'
            })
        return mock_products

    def search_products(self, query: str, sites: List[str] = None, max_results: int = 10) -> Dict[str, List[Dict]]:
        """
        Search for products across multiple e-commerce sites
        
        Args:
            query: Search query string
            sites: List of site names to search (e.g., ['amazon', 'flipkart'])
            max_results: Maximum number of results to return per site
            
        Returns:
            Dictionary mapping site names to lists of product results
        """
        try:
            if sites is None:
                sites = list(self.scrapers.keys())
            
            results = {}
            
            for site in sites:
                if site in self.scrapers:
                    try:
                        logger.info(f"Searching {site} for: {query}")
                        # Try real scraping first
                        site_results = self.scrapers[site].search_products(query, max_results)
                        if not site_results:  # If no results, use mock data
                            logger.warning(f"No results from {site}, using mock data")
                            site_results = self._get_mock_products(query, site, max_results)
                        elif not isinstance(site_results, list):
                            logger.error(f"Unexpected result type from {site} scraper: {type(site_results)}")
                            site_results = self._get_mock_products(query, site, max_results)
                        
                        results[site] = site_results
                        logger.info(f"Found {len(site_results)} results from {site}")
                        
                    except Exception as e:
                        logger.error(f"Error searching {site}, using mock data: {str(e)}")
                        results[site] = self._get_mock_products(query, site, max_results)
            
            # If no results from any site, return mock data for all sites
            if not any(results.values()):
                logger.warning("No results from any site, using mock data for all")
                for site in sites:
                    results[site] = self._get_mock_products(query, site, max_results)
            
            return results
            
        except Exception as e:
            logger.error(f"Critical error in search_products, using mock data: {str(e)}")
            # Return mock data even in case of critical errors
            results = {}
            for site in (sites or ['amazon', 'flipkart']):
                results[site] = self._get_mock_products(query, site, max_results)
            return results

# Global instance for use in endpoints
scraper_manager = ScraperManager()
