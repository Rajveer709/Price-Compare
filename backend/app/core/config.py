from pydantic import AnyHttpUrl, field_validator, ConfigDict
from pydantic_settings import BaseSettings
from typing import List, Optional, Union, Any
import os

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Price Comparison API"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # Create React App default port
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:5173",  # Vite default port (alternative)
        "http://localhost:8000",  # FastAPI default port
    ]
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./price_compare.db")
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Scraper settings
    SCRAPER_TIMEOUT: int = 30  # seconds
    SCRAPER_HEADERS: dict = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    # Rate limiting
    RATE_LIMIT: str = "100/minute"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
        # eBay API Settings
    EBAY_CLIENT_ID: str = os.getenv("EBAY_CLIENT_ID", "RajveerS-Scrapper-PRD-581384bec-aba11b55")
    EBAY_CLIENT_SECRET: str = os.getenv("EBAY_CLIENT_SECRET", "PRD-81384bec9dab-75de-41f8-b405-313f")
    EBAY_API_BASE_URL: str = "https://api.ebay.com"
    EBAY_API_TIMEOUT: int = 10  # seconds
    
    # Redis Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_TIMEOUT: int = 5  # seconds
    
    # eBay API Rate Limiting
    EBAY_MAX_CALLS_PER_DAY: int = int(os.getenv("EBAY_MAX_CALLS_PER_DAY", "4900"))  # 4,900 to stay under 5,000/day limit
    EBAY_REQUESTS_PER_SECOND: float = float(os.getenv("EBAY_REQUESTS_PER_SECOND", "0.3"))  # ~3 requests per second
    
    # Cache TTLs (in seconds)
    EBAY_TOKEN_CACHE_TTL: int = 7000  # ~2 hours (eBay tokens expire in 2 hours)
    EBAY_PRODUCT_CACHE_TTL: int = 86400  # 24 hours
    EBAY_SEARCH_CACHE_TTL: int = 3600  # 1 hour
    
    # Feature Flags
    ENABLE_EBAY_API: bool = os.getenv("ENABLE_EBAY_API", "true").lower() == "true"
    ENABLE_SAFE_BROWSING: bool = os.getenv("ENABLE_SAFE_BROWSING", "true").lower() == "true"
    
    # Google Safe Browsing
    GOOGLE_SAFE_BROWSING_API_KEY: str = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "")
    
    @field_validator("BACKEND_CORS_ORIGINS", mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env.local"
    )

# Create settings instance
settings = Settings()
