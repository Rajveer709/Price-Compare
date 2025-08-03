import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.scrapers.amazon_scraper import AmazonScraper
from app.base_scraper import ScraperConfig, RequestConfig

# Load environment variables
load_dotenv()

# Test product URLs (replace with actual Amazon product URLs)
TEST_PRODUCTS = [
    "https://www.amazon.com/dp/B08N5KWB9H",  # Example product 1
    "https://www.amazon.com/dp/B07VGRJDFY",  # Example product 2
]

async def test_affiliate_links():
    # Initialize the scraper with default config
    config = ScraperConfig(
        request_config=RequestConfig(
            timeout=60,
            max_retries=2,
            delay_range=(3, 6)
        )
    )
    
    scraper = AmazonScraper(config=config)
    
    for url in TEST_PRODUCTS:
        print(f"\nTesting URL: {url}")
        print("-" * 50)
        
        try:
            # Scrape the product
            result = await scraper.scrape_product(url)
            
            # Print the results
            print(f"Title: {result.get('title')}")
            print(f"Price: {result.get('price')}")
            print(f"Original URL: {result.get('product_url')}")
            print(f"Affiliate URL: {result.get('affiliate_url')}")
            print(f"Scraped successfully: {result.get('scraped_successfully')}")
            
            # Check if affiliate URL was generated
            if result.get('affiliate_url') and 'tag=' in result.get('affiliate_url', ''):
                print("✅ Affiliate link generated successfully!")
            else:
                print("❌ Failed to generate affiliate link")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            
        print("=" * 50)
        await asyncio.sleep(5)  # Be nice to the server

if __name__ == "__main__":
    # Set your Amazon Associates tag in the environment
    if not os.getenv('AMAZON_AFFILIATE_TAG'):
        print("Warning: AMAZON_AFFILIATE_TAG not set in environment variables")
        print("Affiliate links will not be generated. Please set it in your .env file:")
        print("AMAZON_AFFILIATE_TAG=your-affiliate-tag-20")
    
    asyncio.run(test_affiliate_links())
