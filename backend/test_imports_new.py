import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath('.'))

print("Python path:")
for path in sys.path:
    print(f" - {path}")

print("\nTrying to import base_scraper...")
try:
    from app.base_scraper import BaseScraper, ScraperConfig, RequestConfig
    print("Successfully imported base_scraper!")
    print(f"BaseScraper: {BaseScraper}")
    print(f"ScraperConfig: {ScraperConfig}")
    print(f"RequestConfig: {RequestConfig}")
except Exception as e:
    print(f"Error importing base_scraper: {e}")
    import traceback
    traceback.print_exc()

print("\nTrying to import amazon_scraper...")
try:
    from app.scrapers.amazon_scraper import AmazonScraper
    print("Successfully imported AmazonScraper!")
    print(f"AmazonScraper: {AmazonScraper}")
except Exception as e:
    print(f"Error importing amazon_scraper: {e}")
    import traceback
    traceback.print_exc()
