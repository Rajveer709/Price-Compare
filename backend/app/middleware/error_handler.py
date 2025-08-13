"""
Global error handling middleware for the FastAPI application
"""
import json
import logging
from typing import Callable, Dict, Any
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware for handling exceptions and formatting error responses"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        try:
            response = await call_next(request)
            return response
            
        except Exception as exc:
            return await self.handle_exception(exc, request)
    
    async def handle_exception(self, exc: Exception, request: Request) -> JSONResponse:
        """Handle exceptions and return appropriate JSON responses"""
        import traceback
        
        # Log the full exception with traceback
        logger.error(
            f"Unhandled exception: {str(exc)}\n"
            f"Path: {request.url.path}\n"
            f"Traceback: {traceback.format_exc()}"
        )
        
        # Default error response
        error_response = {
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected error occurred",
                "details": str(exc)
            },
            "request_id": request.state.request_id if hasattr(request.state, 'request_id') else None
        }
        
        # Set status code based on exception type
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Handle specific exception types
        if isinstance(exc, ValueError):
            error_response["error"]["code"] = "invalid_request"
            error_response["error"]["message"] = str(exc) or "Invalid request"
            status_code = status.HTTP_400_BAD_REQUEST
            
        elif isinstance(exc, PermissionError):
            error_response["error"]["code"] = "permission_denied"
            error_response["error"]["message"] = "You don't have permission to perform this action"
            status_code = status.HTTP_403_FORBIDDEN
            
        elif isinstance(exc, (FileNotFoundError, LookupError)):
            error_response["error"]["code"] = "not_found"
            error_response["error"]["message"] = "The requested resource was not found"
            status_code = status.HTTP_404_NOT_FOUND
        
        # Create JSON response
        return JSONResponse(
            status_code=status_code,
            content=error_response,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )

def setup_error_handlers(app: ASGIApp) -> None:
    """Set up global error handlers for the FastAPI application"""
    from fastapi import FastAPI
    from fastapi.exceptions import RequestValidationError, HTTPException
    
    if not isinstance(app, FastAPI):
        return
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            errors.append({
                "loc": error["loc"],
                "msg": error["msg"],
                "type": error["type"]
            })
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Invalid request data",
                    "details": errors
                }
            }
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.__class__.__name__.lower(),
                    "message": exc.detail,
                    "details": getattr(exc, "details", None)
                }
            }
        )
