import os
import logging
import json
import time
import traceback
import uuid
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.routing import Route
from starlette.middleware import Middleware
from starlette.types import ASGIApp
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

# Application imports
from .middleware.safe_browsing_middleware import SafeBrowsingMiddleware
from .middleware.error_handler import ErrorHandlerMiddleware, setup_error_handlers
from .core.monitoring import MonitorRoute, metrics_endpoint
from .core.cache import CacheManager
from .core.redis_client import init_redis
from .core.ebay_token import EBayTokenManager
from .services.ebay_service import EBayService
from .database import create_tables, get_db, engine
from .core.config import settings
from .api.api_v1.api import api_router as api_router_v1

# Configure logging
logging.basicConfig(
    level=logging.INFO if os.getenv('ENVIRONMENT') == 'production' else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# Configure JSON logging in production
if os.getenv('ENVIRONMENT') == 'production':
    import json_log_formatter
    formatter = json_log_formatter.JSONFormatter()
    json_handler = logging.StreamHandler()
    json_handler.setFormatter(formatter)
    logging.getLogger().addHandler(json_handler)

logger = logging.getLogger(__name__)

# Initialize services dictionary to hold our application services
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # Startup logic
    logger.info("Initializing services...")
    
    try:
        # Initialize Redis
        redis_client = init_redis()
        
        # Initialize services
        services['redis'] = redis_client
        services['cache'] = CacheManager(prefix="price_compare:", default_ttl=3600)
        services['token_manager'] = EBayTokenManager(redis_client)
        services['ebay_service'] = EBayService()
        
        # Make services available to the application
        from .core import ebay_token, redis_client as rc
        from . import services as svc
        ebay_token.token_manager = services['token_manager']
        rc._redis_client = redis_client
        svc.ebay_service = services['ebay_service']
        
        # Create database tables
        logger.info("Creating database tables...")
        create_tables()
        
        logger.info("Services initialized successfully")
        
        # Yield control to the application
        yield
        
    except Exception as e:
        logger.critical(f"Failed to initialize services: {str(e)}", exc_info=True)
        raise
    
    finally:
        # Shutdown logic
        logger.info("Shutting down services...")
        if 'redis' in services:
            await services['redis'].close()
        logger.info("Services shut down successfully")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT])

# CORS configuration
frontend_origins = [
    "http://localhost:3000",  # React dev server (default port)
    "http://localhost:5173",  # Vite dev server (default port)
    "https://price-compare708.vercel.app",  # Production frontend URL
    "http://localhost:3001",  # React dev server (alternative port)
    "http://localhost:8000",  # Local API
]

# Allow all origins in development
if os.getenv('ENVIRONMENT') != 'production':
    frontend_origins = ["*"]

# Create FastAPI app with lifespan and middleware
app = FastAPI(
    title="Price Compare API",
    description="API for comparing prices across different platforms",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    route_class=MonitorRoute,
    lifespan=lifespan,
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=frontend_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
        ),
        Middleware(ErrorHandlerMiddleware)
    ]
)

# Add metrics endpoint
app.router.routes.append(Route("/metrics", endpoint=metrics_endpoint))

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
    "http://localhost:5173",  # Vite dev server (default port)
    "https://price-compare708.vercel.app",  # Production frontend URL
    "http://localhost:3001",  # React dev server (alternative port)
    "http://localhost:8000",  # Local API
    "http://localhost:5173",  # Vite dev server
    # Add your production domain(s) here
    # "https://yourdomain.com",
]

# Allow all origins in development for easier testing
if os.getenv("ENVIRONMENT", "development") == "development":
    frontend_origins = ["*"]

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        security_headers = {
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.ebay.com https://safebrowsing.googleapis.com;",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "X-Permitted-Cross-Domain-Policies": "none",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-site"
        }
        
        # Add security headers to response
        for header, value in security_headers.items():
            if header not in response.headers:
                response.headers[header] = value
                
        return response

# Add CORS middleware with secure defaults
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Length", "X-Total-Count"],
    max_age=600,  # 10 minutes
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add monitoring middleware
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    """
    Middleware to monitor and log all requests.
    Tracks request timing, adds request IDs, and logs structured request/response data.
    """
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Add request ID to request state
    request.state.request_id = request_id
    
    # Prepare request context for logging
    request_context = {
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "client": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "referer": request.headers.get("referer")
    }
    
    # Log request
    logger.info(
        "Incoming request",
        extra={
            "type": "request",
            **request_context
        }
    )
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate request duration
        process_time = time.time() - start_time
        
        # Add performance headers
        response.headers.update({
            "X-Process-Time": f"{process_time:.4f}",
            "X-Request-ID": request_id,
            "X-Content-Type-Options": "nosniff"
        })
        
        # Log successful response
        logger.info(
            "Request completed",
            extra={
                "type": "response",
                **request_context,
                "status_code": response.status_code,
                "duration_ms": round(process_time * 1000, 2),
                "content_type": response.headers.get("content-type")
            }
        )
        
        return response
        
    except Exception as e:
        # Calculate error duration
        process_time = time.time() - start_time
        
        # Log error with full context
        logger.error(
            f"Request failed: {str(e)}",
            extra={
                "type": "error",
                **request_context,
                "error": str(e),
                "error_type": e.__class__.__name__,
                "duration_ms": round(process_time * 1000, 2),
                "traceback": traceback.format_exc()
            },
            exc_info=True
        )
        
        # Re-raise the exception to be handled by the error handler
        raise

# Add Safe Browsing middleware if enabled
if settings.ENABLE_SAFE_BROWSING:
    app.add_middleware(
        SafeBrowsingMiddleware,
        enabled=settings.ENABLE_SAFE_BROWSING
    )

# Include API routers with optional authentication
app.include_router(api_router_v1, prefix=settings.API_V1_STR, dependencies=[])

# Add a simple test endpoint that doesn't require authentication
@app.get("/test-public")
async def test_public():
    return {"message": "This is a public endpoint"}

# Root endpoint
@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request):
    return {
        "message": "Welcome to Price Comparison API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint - simplified to not depend on database
@app.get("/health")
async def health_check():
    """Simple health check that doesn't depend on database"""
    return {"status": "healthy", "api": "running"}

def setup_app(app: FastAPI) -> None:
    """Set up the FastAPI application with all necessary configurations.
    
    Args:
        app: The FastAPI application instance to configure.
    """
    # Add startup and shutdown event handlers
    app.router.lifespan_context = lifespan
    
    # Add exception handlers
    setup_error_handlers(app)
    
    # Add monitoring route
    app.add_route("/metrics", metrics_endpoint)

# Set up application lifecycle events
setup_app(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
