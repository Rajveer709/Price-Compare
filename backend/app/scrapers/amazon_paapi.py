"""
Amazon Product Advertising API (PA-API) integration.

This module provides a clean interface to interact with Amazon's Product Advertising API
for retrieving product data in a compliant and reliable way.
"""
import os
import hmac
import hashlib
import requests
import urllib.parse
import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

@dataclass
class AmazonProduct:
    """Data class representing an Amazon product."""
    asin: str
    title: str
    price: Optional[float]
    currency: str = 'USD'
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    detail_page_url: str = ''
    features: List[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    is_prime: bool = False
    in_stock: bool = True
    rating: Optional[float] = None
    review_count: int = 0
    offers: List[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert product to dictionary format for JSON serialization."""
        return {
            'asin': self.asin,
            'title': self.title,
            'price': self.price,
            'currency': self.currency,
            'original_price': self.original_price,
            'image_url': self.image_url,
            'url': self.detail_page_url,
            'features': self.features or [],
            'brand': self.brand,
            'model': self.model,
            'is_prime': self.is_prime,
            'in_stock': self.in_stock,
            'rating': self.rating,
            'review_count': self.review_count,
            'offers': self.offers or [],
            'source': 'amazon',
        }

class AmazonPAAPI:
    """Client for Amazon Product Advertising API."""
    
    def __init__(self, 
                 access_key: str = None, 
                 secret_key: str = None, 
                 partner_tag: str = None, 
                 region: str = 'us-east-1'):
        """Initialize the PA-API client.
        
        Args:
            access_key: AWS access key for PA-API
            secret_key: AWS secret key for PA-API
            partner_tag: Amazon Associates tag for affiliate links
            region: AWS region for the API endpoint
        """
        self.access_key = access_key or settings.AMAZON_PAAPI_ACCESS_KEY
        self.secret_key = secret_key or settings.AMAZON_PAAPI_SECRET_KEY
        self.partner_tag = partner_tag or settings.AMAZON_PARTNER_TAG
        self.region = region
        self.host = f'webservices.amazon.{self.region.split("-")[0]}.com'
        self.uri = "/paapi5/searchitems"
        self.service = 'ProductAdvertisingAPI'
        self.algorithm = 'AWS4-HMAC-SHA256'
        
        self.enabled = all([self.access_key, self.secret_key, self.partner_tag])
        if not self.enabled:
            logger.warning("PA-API credentials not provided. Running in mock mode.")
    
    def _get_amazon_headers(self, payload_str: str) -> Dict[str, str]:
        """Generate the required headers for PA-API request."""
        # Get current timestamp
        amz_date = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        date_stamp = datetime.datetime.utcnow().strftime('%Y%m%d')
        
        # Create canonical request
        canonical_uri = self.uri
        canonical_querystring = ''
        canonical_headers = f'host:{self.host}\nx-amz-date:{amz_date}\n'
        signed_headers = 'host;x-amz-date'
        payload_hash = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
        
        canonical_request = f'POST\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{payload_hash}'
        
        # Create string to sign
        credential_scope = f"{date_stamp}/{self.region}/{self.service}/aws4_request"
        string_to_sign = f"{self.algorithm}\n{amz_date}\n{credential_scope}\n"
        string_to_sign += hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
        
        # Calculate signature
        signing_key = self._get_signature_key(self.secret_key, date_stamp, self.region, self.service)
        signature = hmac.new(signing_key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
        
        # Create authorization header
        authorization_header = (
            f"{self.algorithm} Credential={self.access_key}/{credential_scope}, "
            f"SignedHeaders={signed_headers}, Signature={signature}"
        )
        
        # Return headers
        return {
            'Content-Encoding': 'amz-1.0',
            'Content-Type': 'application/json; charset=utf-8',
            'Host': self.host,
            'X-Amz-Date': amz_date,
            'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
            'Authorization': authorization_header
        }
    
    def _get_signature_key(self, key: str, date_stamp: str, region_name: str, service_name: str) -> bytes:
        """Generate the signing key for AWS Signature Version 4."""
        k_date = self._sign(('AWS4' + key).encode('utf-8'), date_stamp)
        k_region = self._sign(k_date, region_name)
        k_service = self._sign(k_region, service_name)
        k_signing = self._sign(k_service, 'aws4_request')
        return k_signing
    
    @staticmethod
    def _sign(key: bytes, msg: str) -> bytes:
        """Sign a message with the given key."""
        return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()
    
    async def search_products(self, keywords: str, search_index: str = 'All', item_count: int = 10, 
                            min_price: int = None, max_price: int = None, min_reviews_rating: float = None) -> List[AmazonProduct]:
        """Search for products on Amazon.
        
        Args:
            keywords: Search keywords
            search_index: Amazon search index (e.g., 'All', 'Electronics', 'Books')
            item_count: Number of items to return (max 10 for PA-API)
            min_price: Minimum price filter
            max_price: Maximum price filter
            min_reviews_rating: Minimum average rating (1-5)
            
        Returns:
            List of AmazonProduct objects
        """
        if not self.enabled:
            # Return mock data when PA-API is not configured
            return [
                AmazonProduct(
                    asin=f"MOCK{str(i).zfill(10)}",
                    title=f"{keywords.capitalize()} Product {i+1} (Mock Data)",
                    price=99.99 - (i * 10),
                    original_price=129.99 - (i * 10),
                    image_url="https://via.placeholder.com/300",
                    detail_page_url="#",
                    features=[f"Feature {j+1}" for j in range(3)],
                    brand="Mock Brand",
                    is_prime=bool(i % 2),
                    in_stock=True,
                    rating=4.0 + (i * 0.2),
                    review_count=100 + (i * 10)
                ) for i in range(min(5, item_count))
            ]
            
        payload = {
            'Keywords': keywords,
            'SearchIndex': search_index,
            'ItemCount': min(item_count, 10),  # PA-API max is 10 items
            'Resources': [
                'Images.Primary.Medium',
                'ItemInfo.Title',
                'Offers.Listings.Price',
                'Offers.Summaries.LowestPrice',
                'ItemInfo.Features',
                'ItemInfo.ProductInfo',
                'Offers.Listings.SavingBasis',
                'Offers.Summaries.OfferCount'
            ]
        }
        
        # Add optional filters
        if min_price is not None:
            payload['MinPrice'] = min_price
        if max_price is not None:
            payload['MaxPrice'] = max_price
        if min_reviews_rating is not None:
            payload['MinReviewsRating'] = min_reviews_rating
            
        response = await self._make_request(payload, 'SearchItems')
        return self._parse_response(response, 'SearchItems')
    
    async def get_product(self, asin: str) -> Optional[AmazonProduct]:
        """Get product details by ASIN.
        
        Args:
            asin: Amazon Standard Identification Number
            
        Returns:
            AmazonProduct object or None if not found
        """
        payload = {
            'ItemIds': [asin],
            'PartnerTag': self.partner_tag,
            'PartnerType': 'Associates',
            'Resources': [
                'Images.Primary.Large',
                'ItemInfo.Title',
                'ItemInfo.Features',
                'ItemInfo.ProductInfo',
                'Offers.Listings',
                'Offers.Summaries.OfferCount',
                'CustomerReviews.Count',
                'CustomerReviews.Stars',
                'ParentASIN'
            ]
        }
        
        results = await self._make_request(payload, operation='GetItems')
        return results[0] if results else None
    
    async def _make_request(self, payload: Dict, operation: str = 'SearchItems') -> List[AmazonProduct]:
        """Make a request to the PA-API."""
        # Update the target based on the operation
        headers = self._get_amazon_headers(json.dumps(payload))
        
        if operation == 'GetItems':
            headers['X-Amz-Target'] = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
            url = f'https://{self.host}/paapi5/getitems'
        else:
            headers['X-Amz-Target'] = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
            url = f'https://{self.host}/paapi5/searchitems'
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'Errors' in data:
                for error in data['Errors']:
                    logger.error(f"PA-API Error: {error.get('Message', 'Unknown error')}")
                return []
                
            return self._parse_response(data, operation)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request to PA-API failed: {str(e)}")
            return []
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to parse PA-API response: {str(e)}")
            return []
    
    def _parse_response(self, data: Dict, operation: str) -> List[AmazonProduct]:
        """Parse the PA-API response into AmazonProduct objects."""
        products = []
        
        if operation == 'SearchItems':
            items = data.get('SearchResult', {}).get('Items', [])
        else:  # GetItems
            items = data.get('ItemsResult', {}).get('Items', [])
        
        for item in items:
            try:
                # Extract basic info
                asin = item.get('ASIN')
                title = item.get('ItemInfo', {}).get('Title', {}).get('DisplayValue', 'No title')
                
                # Extract price information
                price_info = item.get('Offers', {}).get('Listings', [{}])[0].get('Price', {})
                price = price_info.get('Amount')
                currency = price_info.get('Currency', 'USD')
                
                # Convert price to float if it exists
                if price is not None:
                    try:
                        price = float(price)
                    except (ValueError, TypeError):
                        price = None
                
                # Extract image URL
                image_url = item.get('Images', {}).get('Primary', {}).get('Medium', {}).get('URL')
                
                # Extract features
                features = item.get('ItemInfo', {}).get('Features', {}).get('DisplayValues', [])
                
                # Extract brand and model
                brand = item.get('ItemInfo', {}).get('ByLineInfo', {}).get('Brand', {}).get('DisplayValue')
                model = item.get('ItemInfo', {}).get('ProductInfo', {}).get('Model', {}).get('DisplayValue')
                
                # Extract review information
                review_info = item.get('CustomerReviews')
                rating = None
                review_count = 0
                
                if review_info:
                    rating = review_info.get('AverageStarRating')
                    review_count = review_info.get('TotalCount', 0)
                    
                    if rating is not None:
                        try:
                            rating = float(rating)
                        except (ValueError, TypeError):
                            rating = None
                
                # Create product object
                product = AmazonProduct(
                    asin=asin,
                    title=title,
                    price=price,
                    currency=currency,
                    image_url=image_url,
                    features=features,
                    brand=brand,
                    model=model,
                    rating=rating,
                    review_count=review_count,
                    detail_page_url=item.get('DetailPageURL', '')
                )
                
                # Check if product is in stock
                offers = item.get('Offers', {})
                if offers:
                    listings = offers.get('Listings', [])
                    if listings:
                        product.in_stock = listings[0].get('Availability', {}).get('Message') == 'In Stock.'
                        product.is_prime = listings[0].get('DeliveryInfo', {}).get('IsPrimeEligible', False)
                        
                        # Get original price if available
                        saving_basis = listings[0].get('Price', {}).get('SavingBasis')
                        if saving_basis and saving_basis.get('Amount'):
                            try:
                                product.original_price = float(saving_basis.get('Amount'))
                            except (ValueError, TypeError):
                                pass
                
                products.append(product)
                
            except Exception as e:
                logger.error(f"Error parsing product data: {str(e)}")
                continue
        
        return products

# Example usage
async def example_usage():
    """Example usage of the AmazonPAAPI class."""
    # Initialize with your credentials
    paapi = AmazonPAAPI(
        access_key='YOUR_ACCESS_KEY',
        secret_key='YOUR_SECRET_KEY',
        partner_tag='your-associate-tag-20',
        region='us-east-1'
    )
    
    # Search for products
    print("Searching for products...")
    products = await paapi.search_products("wireless earbuds", item_count=5)
    
    for i, product in enumerate(products, 1):
        print(f"\nProduct {i}:")
        print(f"Title: {product.title}")
        print(f"Price: {product.currency} {product.price}")
        if product.original_price:
            print(f"Original Price: {product.currency} {product.original_price}")
        print(f"Rating: {product.rating or 'N/A'} ({product.review_count} reviews)")
        print(f"In Stock: {'Yes' if product.in_stock else 'No'}")
        print(f"Prime: {'Yes' if product.is_prime else 'No'}")
        print(f"URL: {product.detail_page_url}")
    
    # Get product by ASIN
    print("\nGetting product by ASIN...")
    product = await paapi.get_product("B08JWV9J9B")  # Example ASIN
    if product:
        print(f"\nProduct Details:")
        print(f"Title: {product.title}")
        print(f"Price: {product.currency} {product.price}")
        print(f"Brand: {product.brand or 'N/A'}")
        print(f"Features: {', '.join(product.features[:3])}...")

if __name__ == "__main__":
    import asyncio
    asyncio.run(example_usage())
