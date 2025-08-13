# This file makes the services directory a Python package
from .ebay_service import EBayService

# Create eBay service instance
ebay_service = EBayService()

__all__ = ['EBayService', 'ebay_service']
