"""
API v1 Router.

Aggregates all v1 service routers and provides versioned API endpoints.
"""

import logging

from fastapi import APIRouter

from src.user_management.routers import auth_router, mfa_router, oauth_router
from src.task_management.routers import tasks_router, assignments_router
from src.payment_service.routers import (
    wallet_router,
    transaction_router,
    escrow_router,
    stripe_router,
    paypal_router,
)
from src.social_media.routers import social_accounts_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["API v1"])

# User management routes
router.include_router(auth_router, tags=["User Authentication"])
router.include_router(oauth_router, tags=["OAuth Authentication"])
router.include_router(mfa_router, tags=["Multi-Factor Authentication"])

# Task management routes
router.include_router(tasks_router, tags=["Tasks"])
router.include_router(assignments_router, tags=["Task Assignments"])

# Payment service routes
router.include_router(wallet_router, tags=["Wallets"])
router.include_router(transaction_router, tags=["Transactions"])
router.include_router(escrow_router, tags=["Escrow"])
router.include_router(stripe_router, tags=["Stripe Payments"])
router.include_router(paypal_router, tags=["PayPal Payments"])

# Social media routes
router.include_router(social_accounts_router, tags=["Social Accounts"])

# Dashboard and user-scoped routes (imported from api_gateway)
from src.api_gateway.routers.dashboard import router as dashboard_router
from src.api_gateway.routers.my_wallet import router as my_wallet_router

router.include_router(dashboard_router, tags=["Dashboard"])
router.include_router(my_wallet_router, tags=["My Wallet"])

logger.info(
    "API v1 router configured with authentication, OAuth, MFA, tasks, payments, and social endpoints"
)
