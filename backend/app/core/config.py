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
    
    # Amazon PA-API Settings
    AMAZON_PAAPI_ACCESS_KEY: str = os.getenv("AMAZON_PAAPI_ACCESS_KEY", "")
    AMAZON_PAAPI_SECRET_KEY: str = os.getenv("AMAZON_PAAPI_SECRET_KEY", "")
    AMAZON_PARTNER_TAG: str = os.getenv("AMAZON_PARTNER_TAG", "")
    AMAZON_PAAPI_REGION: str = os.getenv("AMAZON_PAAPI_REGION", "us-east-1")
    
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
        env_file=".env"
    )

# Create settings instance
settings = Settings()
