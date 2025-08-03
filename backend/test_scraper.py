import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.scrapers.amazon_scraper import AmazonScraper

async def main():
    # Load environment variables
    load_dotenv()
    
    # Example Amazon product URL
    test_url = "https://www.amazon.com/dp/B08N5KWB9H"  # Example product
    
    print(f"Testing Amazon scraper with URL: {test_url}")
    
    # Create scraper instance
    async with AmazonScraper() as scraper:
        # Test the scraper
        print("Scraping product data...")
        product_data = await scraper.scrape_product(test_url)
        
        if product_data:
            print("\nScraped Product Data:")
            print("-" * 40)
            for key, value in product_data.items():
                print(f"{key.title().replace('_', ' ')}: {value}")
        else:
            print("Failed to scrape product data")

if __name__ == "__main__":
    asyncio.run(main())
