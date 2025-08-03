import asyncio
import logging
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.scrapers.amazon_scraper import AmazonScraper
from app.scrapers.playwright_scraper import PlaywrightScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scraper_test.log')
    ]
)
logger = logging.getLogger(__name__)

# Test URLs
TEST_URLS = [
    'https://www.amazon.com/dp/B08N5KWB9H',  # MacBook Air
    'https://www.amazon.com/dp/B07VGRJDFY',  # iPhone 11
    'https://www.amazon.com/dp/B09G9BFKNN',  # Amazon Echo Dot
]

async def test_playwright_scraper():
    """Test the Playwright scraper with a sample URL."""
    logger.info("Testing Playwright scraper...")
    
    async with PlaywrightScraper(headless=False) as scraper:
        for url in TEST_URLS:
            logger.info(f"Scraping URL: {url}")
            content, success = await scraper.get_page_content(
                url,
                wait_for='#productTitle, #priceblock_ourprice, .a-price-whole',
                timeout=60000  # 60 seconds
            )
            
            if success and content:
                logger.info(f"Successfully scraped: {url}")
                logger.info(f"Content length: {len(content)} bytes")
            else:
                logger.error(f"Failed to scrape: {url}")

async def test_amazon_scraper():
    """Test the Amazon scraper with a sample URL."""
    logger.info("Testing Amazon scraper...")
    
    scraper = AmazonScraper()
    
    for url in TEST_URLS:
        logger.info(f"Scraping Amazon product: {url}")
        try:
            result = await scraper.scrape_product(url)
            if result.get('scraped_successfully', False):
                logger.info(f"Successfully scraped product: {result.get('title')}")
                logger.info(f"Price: {result.get('price')} {result.get('currency')}")
                logger.info(f"Availability: {result.get('availability')}")
                logger.info(f"Rating: {result.get('rating')} ({result.get('review_count')} reviews)")
            else:
                logger.error(f"Failed to scrape product: {url}")
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}", exc_info=True)

async def main():
    """Run all tests."""
    logger.info("Starting scraper tests...")
    
    # Test Playwright scraper
    await test_playwright_scraper()
    
    # Test Amazon scraper
    await test_amazon_scraper()
    
    logger.info("All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
