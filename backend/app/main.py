import os
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from fastapi import FastAPI, Depends, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from .database import create_tables, get_db
from .api.api_v1.api import api_router
from .core.config import settings

# Create database tables
create_tables()

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT])

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for Price Comparison Service",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up rate limiter
app.state.limiter = limiter

# Custom rate limit exceeded handler
@app.exception_handler(429)
async def rate_limit_exceeded_handler(request: Request, exc: HTTPException):
    return _rate_limit_exceeded_handler(request, exc)

# Configure CORS with production-ready settings
# In production, replace with your actual frontend domain
frontend_origins = [
    "http://localhost:3000",  # React dev server (default port)
    "http://localhost:3001",  # React dev server (alternative port)
    "http://localhost:8000",  # Local API
    # Add your production domain(s) here
    # "https://yourdomain.com",
]

# Allow all origins in development for easier testing
if os.getenv("ENVIRONMENT", "development") == "development":
    frontend_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["Content-Range", "X-Total-Count"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint
@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request):
    return {
        "message": "Welcome to Price Comparison API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
