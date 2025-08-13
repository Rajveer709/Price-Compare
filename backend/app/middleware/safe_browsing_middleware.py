from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response, JSONResponse
from typing import Callable, Awaitable, Any
import logging
import re

from ..services.safe_browsing import get_safe_browsing_service

logger = logging.getLogger(__name__)

class SafeBrowsingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check URLs against Google Safe Browsing API
    before they're processed by the application.
    """
    
    def __init__(self, app, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled
        self.safe_browsing = None
        self.url_pattern = re.compile(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        )
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Process the request and check any URLs in the request body.
        """
        if not self.enabled:
            return await call_next(request)
        
        # Only check POST, PUT, PATCH requests that might contain URLs
        if request.method in ("POST", "PUT", "PATCH"):
            try:
                # Get the request body
                body = await request.body()
                
                # Check if the body contains URLs
                urls = self.extract_urls(body.decode())
                
                if urls:
                    # Initialize the Safe Browsing service if needed
                    if self.safe_browsing is None:
                        self.safe_browsing = get_safe_browsing_service()
                    
                    # Check each URL
                    for url in urls:
                        if not await self.safe_browsing.is_url_safe(url):
                            logger.warning(f"Blocked potentially malicious URL: {url}")
                            return JSONResponse(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                content={
                                    "detail": f"URL blocked by Safe Browsing: {url}",
                                    "status": "error",
                                    "code": "unsafe_url"
                                }
                            )
                
                # Reset the request body for the next middleware/endpoint
                request._body = body
                
            except Exception as e:
                logger.error(f"Error in Safe Browsing middleware: {str(e)}")
                # Allow the request to continue if there's an error
                pass
        
        # Call the next middleware/endpoint
        response = await call_next(request)
        return response
    
    def extract_urls(self, text: str) -> list:
        """Extract URLs from text using regex"""
        if not text:
            return []
        return self.url_pattern.findall(text)
