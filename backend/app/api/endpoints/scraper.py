from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Optional, Dict, Any
from pydantic import BaseModel, HttpUrl
from app.scrapers.amazon_scraper import AmazonScraper
from app.base_scraper import ScraperConfig, RequestConfig
import asyncio
import logging

router = APIRouter()

class ScrapeRequest(BaseModel):
    url: HttpUrl
    
class ScrapeResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

@router.post("/amazon", response_model=ScrapeResponse, tags=["scraper"])
async def scrape_amazon(request: ScrapeRequest):
    """
    Scrape product information from an Amazon product page.
    
    Example URL: https://www.amazon.com/dp/B08N5KWB9H
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Received request to scrape URL: {request.url}")
        
        # Initialize the scraper with more detailed config
        config = ScraperConfig(
            request_config=RequestConfig(
                timeout=30,
                max_retries=3,
                delay_range=(2.0, 5.0)
            )
        )
        
        # Initialize the scraper
        async with AmazonScraper(config=config) as scraper:
            logger.info("Scraper initialized, starting request...")
            
            # Scrape the product data
            product_data = await scraper.scrape(str(request.url))
            logger.info(f"Scraping completed. Data: {product_data}")
            
            if not product_data or not product_data.get('scraped_successfully', False):
                error_msg = product_data.get('error', 'No data returned from scraper')
                logger.error(f"Failed to scrape product data: {error_msg}")
                return ScrapeResponse(
                    success=False,
                    error=f"Failed to scrape product data: {error_msg}"
                )
                
            # Remove internal fields before returning
            product_data.pop('scraped_successfully', None)
            
            return ScrapeResponse(
                success=True,
                data=product_data
            )
            
    except Exception as e:
        logger.exception(f"Unexpected error in scrape_amazon: {str(e)}")
        return ScrapeResponse(
            success=False,
            error=f"Internal server error: {str(e)}",
            data={"traceback": str(e.__traceback__) if hasattr(e, '__traceback__') else None}
        )
