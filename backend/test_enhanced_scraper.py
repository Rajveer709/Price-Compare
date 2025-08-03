import asyncio
import logging
import sys
import os
from dotenv import load_dotenv

# Set up logging to both console and file
log_file = 'test_enhanced_scraper.log'

# Clear previous log file
with open(log_file, 'w') as f:
    f.write('')

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file, mode='a', encoding='utf-8')
    ]
)

# Redirect stdout and stderr to log file
class StreamToLogger:
    def __init__(self, logger, log_level=logging.INFO):
        self.logger = logger
        self.log_level = log_level
        self.linebuf = ''

    def write(self, buf):
        for line in buf.rstrip().splitlines():
            self.logger.log(self.log_level, line.rstrip())

    def flush(self):
        pass

# Redirect stdout and stderr
def redirect_stdout_stderr():
    sys.stdout = StreamToLogger(logging.getLogger('STDOUT'), logging.INFO)
    sys.stderr = StreamToLogger(logging.getLogger('STDERR'), logging.ERROR)

redirect_stdout_stderr()
logger = logging.getLogger("EnhancedScraperTest")

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_amazon_scraper():
    """Test the enhanced Amazon scraper with CAPTCHA handling."""
    try:
        from app.scrapers.amazon_scraper import AmazonScraper
        from app.base_scraper import ScraperConfig, RequestConfig
    except ImportError as e:
        logger.error(f"Import error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False
    
    # Test URL - replace with an actual Amazon product URL
    test_url = "https://www.amazon.com/dp/B08N5KWB9H"
    
    logger.info(f"Testing enhanced Amazon scraper with URL: {test_url}")
    
    # Configure the scraper with enhanced settings
    config = ScraperConfig(
        request_config=RequestConfig(
            timeout=120,  # Increased timeout for better reliability
            max_retries=3,  # More retries for better success rate
            delay_range=(5.0, 10.0),  # Increased delay range to avoid rate limiting
        )
    )
    
    # Create scraper instance
    async with AmazonScraper(config=config) as scraper:
        try:
            # Test the scraper
            logger.info("Starting product data scraping...")
            product_data = await scraper.scrape_product(test_url)
            
            if product_data and product_data.get('scraped_successfully', False):
                logger.info("\nScraping successful! Product data:")
                logger.info("-" * 50)
                for key, value in product_data.items():
                    if key != 'html':  # Skip HTML content in the output
                        logger.info(f"{key.title().replace('_', ' ')}: {value}")
                return True
            else:
                error_msg = product_data.get('error', 'Unknown error') if isinstance(product_data, dict) else 'No data returned'
                logger.error(f"Scraping failed: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"Error during scraping: {str(e)}", exc_info=True)
            return False

async def main():
    """Run the test script."""
    # Load environment variables
    load_dotenv()
    
    # Run the test
    success = await test_amazon_scraper()
    
    # Print final result
    if success:
        logger.info("Test completed successfully!")
    else:
        logger.error("Test failed!")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
