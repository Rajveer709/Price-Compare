"""
Feature Flags API Endpoints

Provides endpoints to manage and check feature flags.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ...models.user import User
from ...schemas.feature_flag import FeatureFlagUpdate, FeatureFlagResponse
from ...services.feature_flags import get_feature_flags
from ...core.security import get_current_active_user, get_current_admin_user

router = APIRouter()
security = HTTPBearer()

@router.get(
    "",
    response_model=Dict[str, bool],
    summary="Get all feature flags",
    description="Retrieve the current state of all feature flags.",
    tags=["Feature Flags"]
)
async def get_flags(
    credentials: HTTPAuthorizationCredentials = Security(security),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, bool]:
    """
    Get all feature flags and their current values.
    
    Returns a dictionary of all feature flags with their current boolean values.
    """
    feature_flags = get_feature_flags()
    return await feature_flags.get_all_flags(user_id=str(current_user.id))

@router.get(
    "/{flag_name}",
    response_model=FeatureFlagResponse,
    summary="Get a feature flag",
    description="Check if a specific feature flag is enabled.",
    tags=["Feature Flags"]
)
async def get_flag(
    flag_name: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
    current_user: User = Depends(get_current_active_user)
) -> FeatureFlagResponse:
    """
    Check if a specific feature flag is enabled.
    
    Args:
        flag_name: The name of the feature flag to check
        
    Returns:
        FeatureFlagResponse with the flag name and its current value
    """
    feature_flags = get_feature_flags()
    try:
        is_enabled = await feature_flags.is_enabled(flag_name, user_id=str(current_user.id))
        return FeatureFlagResponse(name=flag_name, enabled=is_enabled)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to check feature flag: {str(e)}"
        )

@router.put(
    "/{flag_name}",
    response_model=FeatureFlagResponse,
    summary="Update a feature flag",
    description="Update the value of a feature flag. Requires admin privileges.",
    tags=["Feature Flags"]
)
async def update_flag(
    flag_name: str,
    flag_data: FeatureFlagUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
    current_user: User = Depends(get_current_admin_user)
) -> FeatureFlagResponse:
    """
    Update a feature flag value.
    
    Requires admin privileges.
    
    Args:
        flag_name: The name of the feature flag to update
        flag_data: The new value for the flag
        
    Returns:
        FeatureFlagResponse with the updated flag name and value
    """
    feature_flags = get_feature_flags()
    try:
        await feature_flags.set_flag(
            flag_name=flag_name,
            value=flag_data.enabled,
            user_id=flag_data.user_id
        )
        return FeatureFlagResponse(
            name=flag_name,
            enabled=flag_data.enabled,
            user_id=flag_data.user_id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update feature flag: {str(e)}"
        )
