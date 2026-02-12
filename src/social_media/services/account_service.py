"""
Social media account management service.

This module provides comprehensive account linking, verification, and token management
for social media integrations. Handles account lifecycle, duplicate detection, and
token refresh operations.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.social_media.enums.platform_enums import Platform, get_platform_config
from src.social_media.models.social_account import SocialAccount
from src.social_media.services.oauth_service import OAuthService
from src.social_media.services.platform_clients.facebook_client import FacebookClient
from src.social_media.services.platform_clients.instagram_client import InstagramClient
from src.social_media.services.platform_clients.twitter_client import TwitterClient
from src.social_media.services.platform_clients.tiktok_client import TikTokClient
from src.social_media.services.platform_clients.youtube_client import YouTubeClient

logger = logging.getLogger(__name__)


class AccountService:
    """
    Social media account management service.

    Provides comprehensive account lifecycle management including:
    - Account linking and unlinking
    - Verification status management
    - Token refresh and lifecycle management
    - Duplicate detection
    - Multi-account support per platform
    """

    def __init__(self, db_session: AsyncSession) -> None:
        """
        Initialize account service.

        Args:
            db_session: Database session for account operations
        """
        self.db = db_session
        self.oauth_service = OAuthService()
        logger.info("Account service initialized")

    async def close(self) -> None:
        """Close service resources."""
        await self.oauth_service.close()
        logger.debug("Account service closed")

    async def link_account(
        self,
        user_id: str,
        platform: Platform,
        account_id: str,
        access_token: str,
        refresh_token: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        scope: Optional[str] = None,
        username: Optional[str] = None,
        display_name: Optional[str] = None,
    ) -> SocialAccount:
        """
        Link social media account to user.

        Performs duplicate detection and creates or updates account record.

        Args:
            user_id: User ID
            platform: Social media platform
            account_id: Platform-specific account ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token (optional)
            expires_at: Token expiration timestamp (optional)
            scope: OAuth scopes (optional)
            username: Platform username (optional)
            display_name: Display name (optional)

        Returns:
            Created or updated SocialAccount instance

        Raises:
            ValueError: If duplicate account exists for different user

        Example:
            >>> service = AccountService(db_session)
            >>> account = await service.link_account(
            ...     "user123", Platform.FACEBOOK, "fb_account_id",
            ...     "access_token"
            ... )
            >>> account.platform == Platform.FACEBOOK.value
            True
        """
        try:
            existing = await self._check_duplicate_account(
                platform, account_id, user_id
            )

            if existing:
                if existing.user_id != user_id:
                    logger.error(
                        "Account already linked to different user",
                        extra={
                            "platform": platform.value,
                            "account_id": account_id,
                            "existing_user_id": existing.user_id,
                            "requested_user_id": user_id,
                        },
                    )
                    raise ValueError(
                        f"Account {account_id} on {platform.value} is already linked "
                        f"to another user"
                    )

                logger.info(
                    "Updating existing account link",
                    extra={
                        "user_id": user_id,
                        "platform": platform.value,
                        "account_id": account_id,
                    },
                )

                existing.update_tokens(access_token, refresh_token, expires_at)
                existing.scope = scope
                existing.username = username
                existing.display_name = display_name

                await self.db.commit()
                await self.db.refresh(existing)

                logger.info(
                    "Account link updated successfully",
                    extra={
                        "account_id": existing.id,
                        "user_id": user_id,
                        "platform": platform.value,
                    },
                )

                return existing

            encrypted_access_token = SocialAccount.encrypt_token(access_token)
            encrypted_refresh_token = None
            if refresh_token:
                encrypted_refresh_token = SocialAccount.encrypt_token(refresh_token)

            account = SocialAccount(
                user_id=user_id,
                platform=platform.value,
                account_id=account_id,
                access_token=encrypted_access_token,
                refresh_token=encrypted_refresh_token,
                expires_at=expires_at,
                scope=scope,
                username=username,
                display_name=display_name,
                is_verified=False,
            )

            self.db.add(account)
            await self.db.commit()
            await self.db.refresh(account)

            logger.info(
                "Account linked successfully",
                extra={
                    "account_id": account.id,
                    "user_id": user_id,
                    "platform": platform.value,
                    "account_platform_id": account_id,
                },
            )

            return account

        except ValueError:
            raise
        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "Failed to link account",
                extra={
                    "user_id": user_id,
                    "platform": platform.value,
                    "error": str(exc),
                },
            )
            raise ValueError(f"Failed to link account: {str(exc)}") from exc

    async def verify_account(
        self,
        account_id: str,
        client_id: str,
        client_secret: str,
    ) -> bool:
        """
        Verify social media account ownership.

        Args:
            account_id: Social account ID (database ID)
            client_id: OAuth client ID for platform
            client_secret: OAuth client secret for platform

        Returns:
            True if verification succeeds

        Raises:
            ValueError: If account not found or verification fails

        Example:
            >>> service = AccountService(db_session)
            >>> verified = await service.verify_account(
            ...     "account_id", "client_id", "client_secret"
            ... )
            >>> verified
            True
        """
        try:
            account = await self._get_account_by_id(account_id)

            if not account:
                logger.error("Account not found for verification", extra={"account_id": account_id})
                raise ValueError(f"Account {account_id} not found")

            platform = Platform(account.platform)
            access_token = account.get_access_token()

            client = self._create_platform_client(platform, access_token)

            if not client:
                logger.error(
                    "Failed to create platform client for verification",
                    extra={"platform": platform.value},
                )
                raise ValueError(f"Unsupported platform: {platform.value}")

            is_verified = await client.verify_account_ownership(account.account_id)

            if is_verified:
                account.mark_verified()
                await self.db.commit()

                logger.info(
                    "Account verified successfully",
                    extra={
                        "account_id": account_id,
                        "user_id": account.user_id,
                        "platform": platform.value,
                    },
                )
            else:
                logger.warning(
                    "Account verification failed",
                    extra={
                        "account_id": account_id,
                        "user_id": account.user_id,
                        "platform": platform.value,
                    },
                )

            await client.close()
            return is_verified

        except ValueError:
            raise
        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "Failed to verify account",
                extra={
                    "account_id": account_id,
                    "error": str(exc),
                },
            )
            raise ValueError(f"Failed to verify account: {str(exc)}") from exc

    async def unlink_account(
        self,
        account_id: str,
        user_id: str,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        revoke_token: bool = True,
    ) -> bool:
        """
        Unlink social media account from user.

        Args:
            account_id: Social account ID (database ID)
            user_id: User ID (for authorization check)
            client_id: OAuth client ID (for token revocation)
            client_secret: OAuth client secret (for token revocation)
            revoke_token: Whether to revoke OAuth token

        Returns:
            True if unlinking succeeds

        Raises:
            ValueError: If account not found or unauthorized

        Example:
            >>> service = AccountService(db_session)
            >>> success = await service.unlink_account("account_id", "user123")
            >>> success
            True
        """
        try:
            account = await self._get_account_by_id(account_id)

            if not account:
                logger.error("Account not found for unlinking", extra={"account_id": account_id})
                raise ValueError(f"Account {account_id} not found")

            if account.user_id != user_id:
                logger.error(
                    "Unauthorized account unlink attempt",
                    extra={
                        "account_id": account_id,
                        "account_user_id": account.user_id,
                        "requested_user_id": user_id,
                    },
                )
                raise ValueError("Unauthorized: Account belongs to different user")

            if revoke_token and client_id and client_secret:
                try:
                    platform = Platform(account.platform)
                    access_token = account.get_access_token()

                    await self.oauth_service.revoke_token(
                        platform=platform,
                        token=access_token,
                        client_id=client_id,
                        client_secret=client_secret,
                    )

                    logger.info(
                        "OAuth token revoked",
                        extra={
                            "account_id": account_id,
                            "platform": platform.value,
                        },
                    )
                except Exception as exc:
                    logger.warning(
                        "Failed to revoke OAuth token",
                        extra={
                            "account_id": account_id,
                            "error": str(exc),
                        },
                    )

            await self.db.delete(account)
            await self.db.commit()

            logger.info(
                "Account unlinked successfully",
                extra={
                    "account_id": account_id,
                    "user_id": user_id,
                    "platform": account.platform,
                },
            )

            return True

        except ValueError:
            raise
        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "Failed to unlink account",
                extra={
                    "account_id": account_id,
                    "user_id": user_id,
                    "error": str(exc),
                },
            )
            raise ValueError(f"Failed to unlink account: {str(exc)}") from exc

    async def disconnect_account(
        self,
        user_id: str,
        platform: str,
    ) -> SocialAccount:
        """
        Disconnect social media account by platform for a user.

        Args:
            user_id: User ID
            platform: Platform name to disconnect

        Returns:
            The disconnected SocialAccount (before deletion)

        Raises:
            ValueError: If account not found

        Example:
            >>> service = AccountService(db_session)
            >>> account = await service.disconnect_account("user123", "twitter")
            >>> account.platform
            'twitter'
        """
        try:
            # Normalize platform name
            platform_lower = platform.lower()

            # Find the account for this user and platform
            query = select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == platform_lower,
            )
            result = await self.db.execute(query)
            account = result.scalars().first()

            if not account:
                logger.error(
                    "Account not found for disconnection",
                    extra={"user_id": user_id, "platform": platform_lower},
                )
                raise ValueError(f"No {platform} account found for user")

            # Store account info before deletion for response
            account_copy = SocialAccount(
                id=account.id,
                user_id=account.user_id,
                platform=account.platform,
                account_id=account.account_id,
                username=account.username,
                display_name=account.display_name,
                access_token=account.access_token,
                refresh_token=account.refresh_token,
                expires_at=account.expires_at,
                scope=account.scope,
                is_verified=account.is_verified,
                last_verified_at=account.last_verified_at,
            )
            account_copy.created_at = account.created_at
            account_copy.updated_at = account.updated_at

            # Delete the account
            await self.db.delete(account)
            await self.db.commit()

            logger.info(
                "Account disconnected successfully",
                extra={
                    "user_id": user_id,
                    "platform": platform_lower,
                    "account_id": account_copy.id,
                },
            )

            return account_copy

        except ValueError:
            raise
        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "Failed to disconnect account",
                extra={
                    "user_id": user_id,
                    "platform": platform,
                    "error": str(exc),
                },
            )
            raise ValueError(f"Failed to disconnect account: {str(exc)}") from exc

    async def link_manual_account(
        self,
        user_id: str,
        platform: str,
        username: str,
    ) -> SocialAccount:
        """
        Manually link a social media account with username only.

        Creates an unverified account record. User must complete OAuth
        verification to verify the account ownership.

        Args:
            user_id: User ID
            platform: Social media platform
            username: Platform username/handle

        Returns:
            Created SocialAccount instance (unverified)

        Raises:
            ValueError: If platform invalid or account already exists

        Example:
            >>> service = AccountService(db_session)
            >>> account = await service.link_manual_account(
            ...     "user123", "twitter", "johndoe"
            ... )
            >>> account.is_verified
            False
        """
        try:
            # Validate platform
            platform_lower = platform.lower()
            try:
                platform_enum = Platform(platform_lower)
            except ValueError:
                valid_platforms = ", ".join([p.value for p in Platform])
                raise ValueError(
                    f"Invalid platform: {platform}. Valid: {valid_platforms}"
                )

            # Check for existing account
            existing = await self.get_user_accounts(user_id, platform=platform_enum)
            if existing:
                logger.warning(
                    "Account already exists for platform",
                    extra={"user_id": user_id, "platform": platform_lower},
                )
                raise ValueError(f"A {platform} account is already connected")

            # Create a placeholder token (encrypted)
            # Real token will be set when user completes OAuth
            placeholder_token = SocialAccount.encrypt_token("manual_link_placeholder")

            # Create the account
            account = SocialAccount(
                user_id=user_id,
                platform=platform_lower,
                account_id=f"manual_{username}_{user_id[:8]}",  # Placeholder account ID
                username=username,
                display_name=username,
                access_token=placeholder_token,
                refresh_token=None,
                expires_at=None,
                scope=None,
                is_verified=False,
                last_verified_at=None,
            )

            self.db.add(account)
            await self.db.commit()
            await self.db.refresh(account)

            logger.info(
                "Manual account linked successfully",
                extra={
                    "user_id": user_id,
                    "platform": platform_lower,
                    "username": username,
                    "account_id": account.id,
                },
            )

            return account

        except ValueError:
            raise
        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "Failed to link manual account",
                extra={
                    "user_id": user_id,
                    "platform": platform,
                    "username": username,
                    "error": str(exc),
                },
            )
            raise ValueError(f"Failed to link account: {str(exc)}") from exc

    async def refresh_all_tokens(
        self,
        client_id: str,
        client_secret: str,
        hours_before_expiry: int = 24,
    ) -> dict[str, int]:
        """
        Refresh tokens for accounts expiring soon.

        Args:
            client_id: OAuth client ID
            client_secret: OAuth client secret
            hours_before_expiry: Refresh tokens expiring within this many hours

        Returns:
            Dictionary with counts of successful, failed, and skipped refreshes

        Example:
            >>> service = AccountService(db_session)
            >>> result = await service.refresh_all_tokens("client_id", "secret")
            >>> "success" in result
            True
        """
        try:
            threshold = datetime.utcnow() + timedelta(hours=hours_before_expiry)

            query = select(SocialAccount).where(
                SocialAccount.expires_at.isnot(None),
                SocialAccount.expires_at <= threshold,
                SocialAccount.refresh_token.isnot(None),
            )

            result = await self.db.execute(query)
            accounts = result.scalars().all()

            stats = {"success": 0, "failed": 0, "skipped": 0}

            for account in accounts:
                try:
                    platform = Platform(account.platform)
                    config = get_platform_config(platform)

                    if not config.supports_refresh_token:
                        stats["skipped"] += 1
                        continue

                    refresh_token = account.get_refresh_token()
                    if not refresh_token:
                        stats["skipped"] += 1
                        continue

                    token_data = await self.oauth_service.refresh_token(
                        platform=platform,
                        refresh_token=refresh_token,
                        client_id=client_id,
                        client_secret=client_secret,
                    )

                    account.update_tokens(
                        access_token=token_data["access_token"],
                        refresh_token=token_data.get("refresh_token", refresh_token),
                        expires_at=token_data.get("expires_at"),
                    )

                    stats["success"] += 1

                    logger.info(
                        "Token refreshed",
                        extra={
                            "account_id": account.id,
                            "platform": platform.value,
                        },
                    )

                except Exception as exc:
                    stats["failed"] += 1
                    logger.error(
                        "Failed to refresh token",
                        extra={
                            "account_id": account.id,
                            "platform": account.platform,
                            "error": str(exc),
                        },
                    )

            await self.db.commit()

            logger.info(
                "Token refresh batch completed",
                extra={
                    "total_accounts": len(accounts),
                    "stats": stats,
                },
            )

            return stats

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "Failed to refresh tokens",
                extra={"error": str(exc)},
            )
            raise ValueError(f"Failed to refresh tokens: {str(exc)}") from exc

    async def get_user_accounts(
        self,
        user_id: str,
        platform: Optional[Platform] = None,
        verified_only: bool = False,
    ) -> list[SocialAccount]:
        """
        Get user's social media accounts.

        Args:
            user_id: User ID
            platform: Filter by specific platform (optional)
            verified_only: Return only verified accounts

        Returns:
            List of SocialAccount instances

        Example:
            >>> service = AccountService(db_session)
            >>> accounts = await service.get_user_accounts("user123")
            >>> isinstance(accounts, list)
            True
        """
        try:
            query = select(SocialAccount).where(SocialAccount.user_id == user_id)

            if platform:
                query = query.where(SocialAccount.platform == platform.value)

            if verified_only:
                query = query.where(SocialAccount.is_verified == True)

            result = await self.db.execute(query)
            accounts = result.scalars().all()

            logger.info(
                "Retrieved user accounts",
                extra={
                    "user_id": user_id,
                    "platform": platform.value if platform else "all",
                    "verified_only": verified_only,
                    "count": len(accounts),
                },
            )

            return list(accounts)

        except Exception as exc:
            logger.error(
                "Failed to get user accounts",
                extra={
                    "user_id": user_id,
                    "error": str(exc),
                },
            )
            raise ValueError(f"Failed to get user accounts: {str(exc)}") from exc

    async def refresh_account(
        self,
        user_id: str,
        platform: Platform,
    ) -> SocialAccount:
        """
        Refresh social media account data from platform API.

        Fetches fresh profile data (username, display_name, etc.) from the
        social media platform and updates the local account record.

        Args:
            user_id: User ID (for authorization check)
            platform: Social media platform

        Returns:
            Updated SocialAccount instance

        Raises:
            ValueError: If account not found or refresh fails

        Example:
            >>> service = AccountService(db_session)
            >>> account = await service.refresh_account("user123", Platform.FACEBOOK)
            >>> account.username
            'updated_username'
        """
        try:
            # Get the user's account for this platform
            accounts = await self.get_user_accounts(user_id, platform=platform)

            if not accounts:
                logger.error(
                    "Account not found for refresh",
                    extra={
                        "user_id": user_id,
                        "platform": platform.value,
                    },
                )
                raise ValueError(f"No {platform.value} account found for user")

            account = accounts[0]
            access_token = account.get_access_token()

            # Create platform client
            client = self._create_platform_client(platform, access_token)

            if not client:
                logger.error(
                    "Failed to create platform client for refresh",
                    extra={"platform": platform.value},
                )
                raise ValueError(f"Unsupported platform: {platform.value}")

            try:
                # Fetch fresh profile data from platform
                profile_data = await client.get_user_profile()

                # Update account with fresh data
                if profile_data.get("username"):
                    account.username = profile_data["username"]
                if profile_data.get("name") or profile_data.get("display_name"):
                    account.display_name = profile_data.get("name") or profile_data.get("display_name")

                await self.db.commit()
                await self.db.refresh(account)

                logger.info(
                    "Account refreshed successfully",
                    extra={
                        "user_id": user_id,
                        "platform": platform.value,
                        "account_id": account.id,
                        "username": account.username,
                    },
                )

                return account

            finally:
                await client.close()

        except ValueError:
            raise
        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "Failed to refresh account",
                extra={
                    "user_id": user_id,
                    "platform": platform.value,
                    "error": str(exc),
                },
            )
            raise ValueError(f"Failed to refresh account: {str(exc)}") from exc

    async def _check_duplicate_account(
        self,
        platform: Platform,
        account_id: str,
        user_id: str,
    ) -> Optional[SocialAccount]:
        """
        Check for duplicate account link.

        Args:
            platform: Social media platform
            account_id: Platform-specific account ID
            user_id: User ID

        Returns:
            Existing account if found, None otherwise
        """
        query = select(SocialAccount).where(
            SocialAccount.platform == platform.value,
            SocialAccount.account_id == account_id,
        )

        result = await self.db.execute(query)
        account = result.scalars().first()

        return account

    async def _get_account_by_id(self, account_id: str) -> Optional[SocialAccount]:
        """
        Get social account by database ID.

        Args:
            account_id: Social account ID

        Returns:
            SocialAccount instance or None
        """
        query = select(SocialAccount).where(SocialAccount.id == account_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    def _create_platform_client(
        self,
        platform: Platform,
        access_token: str,
    ) -> Optional[FacebookClient | InstagramClient | TwitterClient | TikTokClient | YouTubeClient]:
        """
        Create platform-specific API client.

        Args:
            platform: Social media platform
            access_token: OAuth access token

        Returns:
            Platform-specific client instance or None
        """
        if platform == Platform.FACEBOOK:
            return FacebookClient(access_token)
        elif platform == Platform.INSTAGRAM:
            return InstagramClient(access_token)
        elif platform == Platform.TWITTER:
            return TwitterClient(access_token)
        elif platform == Platform.TIKTOK:
            return TikTokClient(access_token)
        elif platform == Platform.YOUTUBE:
            return YouTubeClient(access_token)
        else:
            logger.warning(
                "Unsupported platform for client creation",
                extra={"platform": platform.value},
            )
            return None
