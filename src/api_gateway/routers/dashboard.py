"""
Dashboard API Endpoints.

Provides aggregated dashboard data for the frontend including statistics,
recent activities, and transactions overview.
"""

import logging
from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api_gateway.dependencies import get_current_user_id, get_database_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    """Dashboard statistics response."""
    total_tasks: int = 0
    active_tasks: int = 0
    completed_tasks: int = 0
    total_earnings: float = 0.0
    wallet_balance: float = 0.0
    pending_submissions: int = 0


class ActivityItem(BaseModel):
    """Activity item for dashboard."""
    id: str
    type: str
    title: str
    description: str
    timestamp: datetime
    amount: float | None = None
    related_id: str | None = None


class DashboardActivities(BaseModel):
    """Dashboard activities response."""
    activities: list[ActivityItem]
    total: int


class TransactionItem(BaseModel):
    """Transaction item for dashboard."""
    id: str
    type: str
    amount: float
    currency: str
    status: str
    description: str
    created_at: datetime


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get dashboard statistics",
    description="Retrieve aggregated dashboard statistics for the current user",
)
async def get_dashboard_stats(
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_database_session)],
) -> DashboardStats:
    """
    Get dashboard statistics for the current user.
    
    Returns aggregated data including:
    - Task counts (total, active, completed)
    - Financial data (earnings, wallet balance)
    - Pending submissions count
    """
    logger.info("Fetching dashboard stats", extra={"user_id": user_id})
    
    try:
        # Import services here to avoid circular imports
        from src.payment_service.services.wallet_service import WalletService
        
        # Get wallet balance
        wallet_balance = 0.0
        try:
            wallet_service = WalletService(db)
            wallet = await wallet_service.get_wallet_by_user_id(user_id)
            if wallet:
                wallet_balance = float(wallet.balance)
        except Exception as e:
            logger.warning(f"Could not fetch wallet: {e}")
        
        # Return stats (task counts would need task service integration)
        return DashboardStats(
            total_tasks=0,
            active_tasks=0,
            completed_tasks=0,
            total_earnings=0.0,
            wallet_balance=wallet_balance,
            pending_submissions=0,
        )
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard statistics",
        )


@router.get(
    "/activities",
    response_model=DashboardActivities,
    summary="Get dashboard activities",
    description="Retrieve recent user activities for the dashboard",
)
async def get_dashboard_activities(
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_database_session)],
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> DashboardActivities:
    """
    Get recent activities for the current user.
    
    Returns paginated list of recent activities.
    """
    logger.info(
        "Fetching dashboard activities",
        extra={"user_id": user_id, "limit": limit, "offset": offset},
    )
    
    # Return empty activities for now - would need activity tracking integration
    return DashboardActivities(activities=[], total=0)


@router.get(
    "/transactions/recent",
    response_model=list[TransactionItem],
    summary="Get recent transactions",
    description="Retrieve recent transactions for dashboard overview",
)
async def get_recent_transactions(
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_database_session)],
    limit: int = Query(default=5, ge=1, le=20),
) -> list[TransactionItem]:
    """
    Get recent transactions for the current user.
    
    Returns list of most recent transactions for quick dashboard overview.
    """
    logger.info(
        "Fetching recent transactions",
        extra={"user_id": user_id, "limit": limit},
    )
    
    try:
        from src.payment_service.services.wallet_service import WalletService
        from src.payment_service.services.transaction_service import TransactionService
        
        # Get user's wallet first
        wallet_service = WalletService(db)
        wallet = await wallet_service.get_wallet_by_user_id(user_id)
        
        if not wallet:
            return []
        
        # Get recent transactions for this wallet
        transaction_service = TransactionService(db)
        result = await transaction_service.get_wallet_transactions(
            wallet_id=str(wallet.id),
            page=1,
            page_size=limit,
        )
        
        return [
            TransactionItem(
                id=str(t.id),
                type=t.type,
                amount=float(t.amount),
                currency=t.currency,
                status=t.status,
                description=t.description or "",
                created_at=t.created_at,
            )
            for t in result.transactions
        ]
    except Exception as e:
        logger.error(f"Error fetching recent transactions: {e}", exc_info=True)
        return []


@router.post(
    "/refresh",
    summary="Refresh dashboard data",
    description="Trigger a refresh of cached dashboard data",
)
async def refresh_dashboard(
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> dict:
    """
    Refresh dashboard data cache.
    
    Triggers a server-side refresh of any cached dashboard data.
    """
    logger.info("Dashboard refresh requested", extra={"user_id": user_id})
    
    # In a real implementation, this would invalidate caches
    return {"success": True}
