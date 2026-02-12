"""
User-Scoped Wallet API Endpoints.

Provides a simplified REST API for current user's wallet operations,
mapping to the frontend's expected paths at /wallet/*.
"""

import logging
from typing import Annotated
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api_gateway.dependencies import get_current_user_id, get_database_session
from src.payment_service.services.wallet_service import WalletService
from src.payment_service.services.transaction_service import TransactionService
from src.payment_service.schemas.wallet import WalletCreate, WalletResponse
from src.payment_service.models.wallet import WalletStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wallet", tags=["wallet"])


class WalletInfo(BaseModel):
    """Wallet information response for current user."""
    id: str
    user_id: str
    balance: float
    available_balance: float
    pending_balance: float
    escrow_balance: float
    currency: str
    status: str
    created_at: str
    updated_at: str


class TransactionItem(BaseModel):
    """Transaction item in list."""
    id: str
    wallet_id: str
    type: str
    amount: float
    currency: str
    status: str
    description: str
    reference: str | None = None
    metadata: dict | None = None
    created_at: str
    updated_at: str


class TransactionListResponse(BaseModel):
    """Transaction list with pagination."""
    transactions: list[TransactionItem]
    pagination: dict


class DepositRequest(BaseModel):
    """Deposit request body."""
    amount: float = Field(gt=0, description="Amount to deposit")
    payment_method: str = Field(description="Payment method (stripe, paypal)")
    return_url: str | None = None


class DepositResponse(BaseModel):
    """Deposit response."""
    transaction_id: str
    payment_url: str | None = None
    payment_intent_id: str | None = None
    status: str


class WithdrawalRequest(BaseModel):
    """Withdrawal request body."""
    amount: float = Field(gt=0, description="Amount to withdraw")
    payout_method: str = Field(description="Payout method (bank_account, paypal)")


class WithdrawalResponse(BaseModel):
    """Withdrawal response."""
    transaction_id: str
    status: str
    estimated_arrival: str | None = None


async def get_wallet_service(
    session: Annotated[AsyncSession, Depends(get_database_session)],
) -> WalletService:
    """Get WalletService instance."""
    return WalletService(session)


async def get_transaction_service(
    session: Annotated[AsyncSession, Depends(get_database_session)],
) -> TransactionService:
    """Get TransactionService instance."""
    return TransactionService(session)


@router.get(
    "",
    response_model=WalletInfo,
    summary="Get current user's wallet",
    description="Retrieve wallet details for the authenticated user",
)
async def get_my_wallet(
    user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[WalletService, Depends(get_wallet_service)],
) -> WalletInfo:
    """
    Get wallet for the current authenticated user.
    
    Creates a wallet automatically if one doesn't exist.
    """
    logger.info("Fetching wallet for current user", extra={"user_id": user_id})
    
    wallet = await service.get_wallet_by_user_id(user_id)
    
    # Auto-create wallet if it doesn't exist
    if not wallet:
        logger.info("Creating wallet for new user", extra={"user_id": user_id})
        try:
            from src.payment_service.models.wallet import Currency
            wallet_data = WalletCreate(
                user_id=user_id,
                currency=Currency.USD,
                initial_balance=Decimal("0.00"),
            )
            wallet = await service.create_wallet(wallet_data)
        except Exception as e:
            logger.error(f"Failed to create wallet: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create wallet",
            )
    
    # Calculate available balance (balance - escrow)
    available = float(wallet.balance) - float(wallet.escrow_balance)
    
    return WalletInfo(
        id=str(wallet.id),
        user_id=str(wallet.user_id),
        balance=float(wallet.balance),
        available_balance=available,
        pending_balance=0.0,
        escrow_balance=float(wallet.escrow_balance),
        currency=wallet.currency.value if hasattr(wallet.currency, 'value') else str(wallet.currency),
        status=wallet.status.value if hasattr(wallet.status, 'value') else str(wallet.status),
        created_at=wallet.created_at.isoformat(),
        updated_at=wallet.updated_at.isoformat(),
    )


@router.get(
    "/transactions",
    response_model=TransactionListResponse,
    summary="Get current user's transactions",
    description="Retrieve paginated transactions for the authenticated user's wallet",
)
async def get_my_transactions(
    user_id: Annotated[str, Depends(get_current_user_id)],
    wallet_service: Annotated[WalletService, Depends(get_wallet_service)],
    transaction_service: Annotated[TransactionService, Depends(get_transaction_service)],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    types: str | None = Query(default=None, description="Comma-separated transaction types"),
    statuses: str | None = Query(default=None, description="Comma-separated statuses"),
) -> TransactionListResponse:
    """
    Get transactions for the current user's wallet.
    """
    logger.info(
        "Fetching transactions for current user",
        extra={"user_id": user_id, "page": page, "limit": limit},
    )
    
    # Get user's wallet
    wallet = await wallet_service.get_wallet_by_user_id(user_id)
    if not wallet:
        return TransactionListResponse(
            transactions=[],
            pagination={"total": 0, "page": page, "limit": limit, "totalPages": 0},
        )
    
    # Get transactions
    result = await transaction_service.get_wallet_transactions(
        wallet_id=str(wallet.id),
        page=page,
        page_size=limit,
    )
    
    transactions = [
        TransactionItem(
            id=str(t.id),
            wallet_id=str(t.wallet_id),
            type=t.type,
            amount=float(t.amount),
            currency=t.currency,
            status=t.status,
            description=t.description or "",
            reference=t.reference,
            metadata=t.metadata,
            created_at=t.created_at.isoformat(),
            updated_at=t.updated_at.isoformat(),
        )
        for t in result.transactions
    ]
    
    return TransactionListResponse(
        transactions=transactions,
        pagination={
            "total": result.total,
            "page": result.page,
            "limit": result.page_size,
            "totalPages": result.total_pages,
        },
    )


@router.get(
    "/transactions/{transaction_id}",
    response_model=TransactionItem,
    summary="Get a specific transaction",
    description="Retrieve details of a specific transaction",
)
async def get_transaction(
    transaction_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    wallet_service: Annotated[WalletService, Depends(get_wallet_service)],
    transaction_service: Annotated[TransactionService, Depends(get_transaction_service)],
) -> TransactionItem:
    """
    Get a specific transaction by ID.
    
    Verifies the transaction belongs to the current user's wallet.
    """
    logger.info(
        "Fetching transaction",
        extra={"transaction_id": transaction_id, "user_id": user_id},
    )
    
    # Get user's wallet
    wallet = await wallet_service.get_wallet_by_user_id(user_id)
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found",
        )
    
    # Get transaction
    transaction = await transaction_service.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    
    # Verify ownership
    if str(transaction.wallet_id) != str(wallet.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Transaction does not belong to your wallet",
        )
    
    return TransactionItem(
        id=str(transaction.id),
        wallet_id=str(transaction.wallet_id),
        type=transaction.type,
        amount=float(transaction.amount),
        currency=transaction.currency,
        status=transaction.status,
        description=transaction.description or "",
        reference=transaction.reference,
        metadata=transaction.metadata,
        created_at=transaction.created_at.isoformat(),
        updated_at=transaction.updated_at.isoformat(),
    )


@router.post(
    "/deposit",
    response_model=DepositResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a deposit",
    description="Start a deposit to the user's wallet",
)
async def initiate_deposit(
    deposit_data: DepositRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    wallet_service: Annotated[WalletService, Depends(get_wallet_service)],
) -> DepositResponse:
    """
    Initiate a deposit to the current user's wallet.
    
    Returns payment URL for completing the deposit via the selected payment method.
    """
    logger.info(
        "Initiating deposit",
        extra={
            "user_id": user_id,
            "amount": deposit_data.amount,
            "payment_method": deposit_data.payment_method,
        },
    )
    
    # Get or create wallet
    wallet = await wallet_service.get_wallet_by_user_id(user_id)
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found. Please create a wallet first.",
        )
    
    # Check wallet status
    if wallet.status != WalletStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet is not active",
        )
    
    # In a real implementation, this would:
    # 1. Create a pending transaction
    # 2. Initialize payment with Stripe/PayPal
    # 3. Return payment URL
    
    # For now, return a placeholder response
    return DepositResponse(
        transaction_id="pending",
        payment_url=f"/payment/{deposit_data.payment_method}/checkout",
        payment_intent_id=None,
        status="pending",
    )


@router.post(
    "/withdraw",
    response_model=WithdrawalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a withdrawal",
    description="Start a withdrawal from the user's wallet",
)
async def initiate_withdrawal(
    withdrawal_data: WithdrawalRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    wallet_service: Annotated[WalletService, Depends(get_wallet_service)],
) -> WithdrawalResponse:
    """
    Initiate a withdrawal from the current user's wallet.
    """
    logger.info(
        "Initiating withdrawal",
        extra={
            "user_id": user_id,
            "amount": withdrawal_data.amount,
            "payout_method": withdrawal_data.payout_method,
        },
    )
    
    # Get wallet
    wallet = await wallet_service.get_wallet_by_user_id(user_id)
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found",
        )
    
    # Check wallet status
    if wallet.status != WalletStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet is not active",
        )
    
    # Check sufficient balance
    if float(wallet.available_balance) < withdrawal_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance",
        )
    
    # In a real implementation, this would:
    # 1. Create a pending transaction
    # 2. Deduct from available balance (move to pending)
    # 3. Initiate payout via payment provider
    
    return WithdrawalResponse(
        transaction_id="pending",
        status="pending",
        estimated_arrival="2-5 business days",
    )


@router.post(
    "/refresh",
    response_model=WalletInfo,
    summary="Refresh wallet balance",
    description="Refresh and return updated wallet balance",
)
async def refresh_wallet_balance(
    user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[WalletService, Depends(get_wallet_service)],
) -> WalletInfo:
    """
    Refresh wallet balance and return updated wallet info.
    
    Useful after transactions to get the latest balance.
    """
    logger.info("Refreshing wallet balance", extra={"user_id": user_id})
    
    wallet = await service.get_wallet_by_user_id(user_id)
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found",
        )
    
    # In a real implementation, this might recalculate pending transactions
    # or sync with external payment providers
    
    # Calculate available balance (balance - escrow)
    available = float(wallet.balance) - float(wallet.escrow_balance)
    
    return WalletInfo(
        id=str(wallet.id),
        user_id=str(wallet.user_id),
        balance=float(wallet.balance),
        available_balance=available,
        pending_balance=0.0,
        escrow_balance=float(wallet.escrow_balance),
        currency=wallet.currency.value if hasattr(wallet.currency, 'value') else str(wallet.currency),
        status=wallet.status.value if hasattr(wallet.status, 'value') else str(wallet.status),
        created_at=wallet.created_at.isoformat(),
        updated_at=wallet.updated_at.isoformat(),
    )
