import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pathlib import Path

import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from .config import settings
from .models import Product, PriceHistory, Base

logger = logging.getLogger(__name__)

class StorageManager:
    """Handles data storage operations including JSON backup and database storage."""
    
    def __init__(self, db_session: AsyncSession = None, backup_dir: str = "data/backups"):
        """Initialize the storage manager.
        
        Args:
            db_session: SQLAlchemy async session for database operations
            backup_dir: Directory to store JSON backups
        """
        self.db_session = db_session
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_product(self, product_data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Save product data to both database and JSON backup.
        
        Args:
            product_data: Dictionary containing product information
            source: Source website/domain of the product
            
        Returns:
            Dictionary with save results
        """
        if not product_data.get('url') or not product_data.get('name'):
            logger.error("Product data missing required fields (url, name)")
            return {"success": False, "error": "Missing required fields (url, name)"}
        
        # Generate a unique key for the product
        product_key = self._generate_product_key(product_data['url'], source)
        
        # Save to database
        db_result = await self._save_to_database(product_data, source, product_key) if self.db_session else None
        
        # Save to JSON backup
        json_result = await self._save_to_json(product_data, source, product_key)
        
        return {
            "success": db_result.get('success', True) if db_result else True,
            "database": db_result,
            "json": json_result
        }
    
    async def _save_to_database(self, product_data: Dict[str, Any], source: str, product_key: str) -> Dict[str, Any]:
        """Save product data to the database."""
        if not self.db_session:
            return {"success": False, "error": "No database session available"}
            
        try:
            # Check if product exists
            result = await self.db_session.execute(
                select(Product).where(Product.product_key == product_key)
            )
            product = result.scalar_one_or_none()
            
            current_price = float(product_data.get('price', 0))
            
            if product:
                # Update existing product
                product.name = product_data.get('name', product.name)
                product.image_url = product_data.get('image_url', product.image_url)
                product.brand = product_data.get('brand', product.brand)
                product.category = product_data.get('category', product.category)
                product.updated_at = datetime.utcnow()
                
                # Only update price if it has changed
                if current_price and current_price != product.current_price:
                    # Create price history entry
                    price_history = PriceHistory(
                        product_id=product.id,
                        price=current_price,
                        currency=product_data.get('currency', 'USD')
                    )
                    self.db_session.add(price_history)
                    product.current_price = current_price
                    
                action = "updated"
            else:
                # Create new product
                product = Product(
                    product_key=product_key,
                    url=product_data['url'],
                    name=product_data['name'],
                    source=source,
                    image_url=product_data.get('image_url'),
                    brand=product_data.get('brand'),
                    category=product_data.get('category'),
                    current_price=current_price,
                    currency=product_data.get('currency', 'USD')
                )
                self.db_session.add(product)
                action = "created"
                
                # Create initial price history entry
                if current_price:
                    price_history = PriceHistory(
                        product=product,
                        price=current_price,
                        currency=product_data.get('currency', 'USD')
                    )
                    self.db_session.add(price_history)
            
            await self.db_session.commit()
            
            return {
                "success": True,
                "action": action,
                "product_id": product.id
            }
            
        except Exception as e:
            await self.db_session.rollback()
            logger.error(f"Error saving product to database: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _save_to_json(self, product_data: Dict[str, Any], source: str, product_key: str) -> Dict[str, Any]:
        """Save product data to a JSON file as backup."""
        try:
            # Create a filename based on the source and current date
            today = datetime.utcnow().strftime("%Y-%m-%d")
            filename = self.backup_dir / f"{source}_{today}.json"
            
            # Add metadata
            data = {
                "timestamp": datetime.utcnow().isoformat(),
                "source": source,
                "product_key": product_key,
                "data": product_data
            }
            
            # Read existing data if file exists
            existing_data = []
            if filename.exists():
                async with aiofiles.open(filename, 'r', encoding='utf-8') as f:
                    content = await f.read()
                    if content.strip():
                        existing_data = json.loads(content)
            
            # Check if product already exists in the file
            updated = False
            for i, item in enumerate(existing_data):
                if item.get('product_key') == product_key:
                    existing_data[i] = data
                    updated = True
                    break
            
            # Add new product if not found
            if not updated:
                existing_data.append(data)
            
            # Write back to file
            async with aiofiles.open(filename, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(existing_data, indent=2))
            
            return {
                "success": True,
                "action": "updated" if updated else "created",
                "filename": str(filename)
            }
            
        except Exception as e:
            logger.error(f"Error saving product to JSON: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_product_key(self, url: str, source: str) -> str:
        """Generate a unique key for a product based on URL and source."""
        import hashlib
        key = f"{source}:{url}".encode('utf-8')
        return hashlib.sha256(key).hexdigest()
    
    async def get_product_history(self, product_id: int) -> Dict[str, Any]:
        """Get price history for a product."""
        if not self.db_session:
            return {"success": False, "error": "Database session not available"}
            
        try:
            # Get product
            result = await self.db_session.execute(
                select(Product).where(Product.id == product_id)
            )
            product = result.scalar_one_or_none()
            
            if not product:
                return {"success": False, "error": "Product not found"}
            
            # Get price history
            result = await self.db_session.execute(
                select(PriceHistory)
                .where(PriceHistory.product_id == product_id)
                .order_by(PriceHistory.created_at.desc())
            )
            history = result.scalars().all()
            
            return {
                "success": True,
                "product": {
                    "id": product.id,
                    "name": product.name,
                    "url": product.url,
                    "current_price": product.current_price,
                    "currency": product.currency,
                    "source": product.source,
                    "created_at": product.created_at.isoformat(),
                    "updated_at": product.updated_at.isoformat() if product.updated_at else None
                },
                "history": [
                    {
                        "price": entry.price,
                        "currency": entry.currency,
                        "created_at": entry.created_at.isoformat()
                    }
                    for entry in history
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting product history: {e}")
            return {
                "success": False,
                "error": str(e)
            }
