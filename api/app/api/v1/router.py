from fastapi import APIRouter
from app.api.v1 import discovery

api_router = APIRouter()
api_router.include_router(discovery.router, tags=["discovery"])
