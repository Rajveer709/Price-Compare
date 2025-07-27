# This file makes the services directory a Python package
from .scraper import ScraperManager, AmazonScraper

# Create a default scraper manager instance
scraper_manager = ScraperManager()

__all__ = ['ScraperManager', 'AmazonScraper', 'scraper_manager']
