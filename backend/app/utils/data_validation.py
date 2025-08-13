"""
Data validation utilities for ensuring data quality in API responses
"""
from typing import Any, Dict, List, Optional
from decimal import Decimal, InvalidOperation
from datetime import datetime
from pydantic import BaseModel, validator
import re
import logging

logger = logging.getLogger(__name__)

class DataValidator:
    """Utility class for data validation and sanitization"""
    
    @staticmethod
    def format_price(price: Any, currency: str = "USD") -> Dict[str, Any]:
        """Format price consistently"""
        try:
            if isinstance(price, (int, float, Decimal)):
                value = float(price)
                return {
                    "value": round(value, 2),
                    "currency": currency,
                    "formatted_price": f"{currency} {value:,.2f}"
                }
            return {
                "value": 0.0,
                "currency": currency,
                "formatted_price": f"{currency} 0.00"
            }
        except (ValueError, TypeError, InvalidOperation) as e:
            logger.warning(f"Error formatting price {price}: {str(e)}")
            return {
                "value": 0.0,
                "currency": currency,
                "formatted_price": f"{currency} 0.00"
            }
    
    @staticmethod
    def sanitize_html(html: Optional[str]) -> str:
        """Remove potentially dangerous HTML"""
        if not html:
            return ""
        # Basic HTML sanitization - allow basic formatting but remove scripts
        return re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html)
    
    @staticmethod
    def validate_url(url: Optional[str]) -> Optional[str]:
        """Validate and clean URLs"""
        if not url:
            return None
        url = str(url).strip()
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'
        return url
    
    @classmethod
    def validate_product_data(cls, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and clean product data before sending it to the client
        """
        if not isinstance(product_data, dict):
            return {"error": "Invalid product data"}

        # Ensure required fields
        result = {
            "id": str(product_data.get("id", "")),
            "title": str(product_data.get("title", "")).strip(),
            "description": cls.sanitize_html(product_data.get("description")),
            "url": cls.validate_url(product_data.get("url")),
            "images": [],
            "price": cls.format_price(product_data.get("price")),
            "original_price": cls.format_price(product_data.get("original_price")),
            "availability": bool(product_data.get("available", False)),
            "condition": str(product_data.get("condition", "")).lower(),
            "seller": {
                "name": str(product_data.get("seller", {}).get("name", "")).strip(),
                "rating": float(product_data.get("seller", {}).get("rating", 0.0)),
            },
            "metadata": {}
        }
        
        # Handle images
        if isinstance(product_data.get("images"), list):
            result["images"] = [cls.validate_url(img) for img in product_data["images"] if img]
        
        # Add additional metadata
        for key in ["brand", "model", "upc", "mpn", "gtin"]:
            if key in product_data:
                result["metadata"][key] = str(product_data[key]).strip()
        
        # Add timestamps
        result["last_updated"] = datetime.utcnow().isoformat()
        
        return result
