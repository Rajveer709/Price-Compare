"""
Feature Flag Schemas

Pydantic models for feature flag related requests and responses.
"""
from typing import Optional
from pydantic import BaseModel, Field

class FeatureFlagBase(BaseModel):
    """Base model for feature flag operations"""
    name: str = Field(..., description="The name of the feature flag")
    enabled: bool = Field(..., description="Whether the feature is enabled")
    user_id: Optional[str] = Field(
        None,
        description="Optional user ID for user-specific feature flags"
    )

class FeatureFlagUpdate(FeatureFlagBase):
    """Schema for updating a feature flag"""
    pass

class FeatureFlagResponse(FeatureFlagBase):
    """Schema for feature flag responses"""
    class Config:
        schema_extra = {
            "example": {
                "name": "enable_ebay_api",
                "enabled": True,
                "user_id": "user_123"
            }
        }
