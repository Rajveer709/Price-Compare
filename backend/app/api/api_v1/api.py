from fastapi import APIRouter

from app.api.endpoints import products, offers, search

api_router = APIRouter()
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(offers.router, prefix="/offers", tags=["offers"])
api_router.include_router(search.router, tags=["search"])
