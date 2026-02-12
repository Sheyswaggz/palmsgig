"""
TikTok API v2 client.

This module implements TikTok-specific API operations including user profile retrieval,
video listing, and engagement verification.
"""

import logging
from typing import Any, Optional

from src.social_media.enums.platform_enums import Platform
from src.social_media.services.platform_clients.base_client import BaseClient, PlatformAPIError

logger = logging.getLogger(__name__)


class TikTokClient(BaseClient):
    """
    TikTok API v2 client.

    Provides methods for interacting with TikTok API v2 including
    user profiles, video listing, and engagement verification.
    """

    def __init__(self, access_token: str) -> None:
        """
        Initialize TikTok client.

        Args:
            access_token: TikTok OAuth 2.0 access token
        """
        super().__init__(Platform.TIKTOK, access_token)
        logger.info("TikTok client initialized")

    async def get_user_profile(self, user_id: Optional[str] = None) -> dict[str, Any]:
        """
        Get TikTok user profile information.

        Args:
            user_id: TikTok user ID (uses authenticated user if None)

        Returns:
            Dictionary containing user profile data (open_id, display_name, avatar_url, etc.)

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = TikTokClient("access_token")
            >>> profile = await client.get_user_profile()
            >>> "data" in profile
            True
        """
        try:
            fields = "open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count"

            response = await self.post(
                "/user/info/",
                json={"fields": fields},
            )

            user_data = response.get("data", {}).get("user", {})

            logger.info(
                "TikTok user profile retrieved",
                extra={
                    "open_id": user_data.get("open_id"),
                    "display_name": user_data.get("display_name"),
                },
            )

            return response

        except Exception as exc:
            logger.error(
                "Failed to get TikTok user profile",
                extra={
                    "user_id": user_id,
                    "error": str(exc),
                },
            )
            raise PlatformAPIError(
                f"Failed to get user profile: {str(exc)}"
            ) from exc

    async def verify_account_ownership(self, account_id: str) -> bool:
        """
        Verify that authenticated user owns the specified TikTok account.

        Args:
            account_id: TikTok account ID (open_id) to verify

        Returns:
            True if authenticated user's open_id matches account_id

        Example:
            >>> client = TikTokClient("access_token")
            >>> is_owner = await client.verify_account_ownership("open_id_123")
            >>> isinstance(is_owner, bool)
            True
        """
        try:
            profile = await self.get_user_profile()
            user_data = profile.get("data", {}).get("user", {})
            open_id = user_data.get("open_id")

            is_owner = open_id == account_id

            logger.info(
                "TikTok account ownership verification",
                extra={
                    "account_id": account_id,
                    "open_id": open_id,
                    "is_owner": is_owner,
                },
            )

            return is_owner

        except Exception as exc:
            logger.error(
                "Failed to verify TikTok account ownership",
                extra={
                    "account_id": account_id,
                    "error": str(exc),
                },
            )
            return False

    async def get_user_videos(
        self,
        max_count: int = 20,
        cursor: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Get videos posted by the authenticated user.

        Args:
            max_count: Maximum number of videos to return (default: 20, max: 20)
            cursor: Pagination cursor for next page

        Returns:
            Dictionary containing videos list and pagination info

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = TikTokClient("access_token")
            >>> videos = await client.get_user_videos(max_count=10)
            >>> "data" in videos
            True
        """
        try:
            fields = "id,create_time,cover_image_url,share_url,video_description,duration,title,like_count,comment_count,share_count,view_count"

            request_body: dict[str, Any] = {
                "fields": fields,
                "max_count": min(max_count, 20),
            }

            if cursor:
                request_body["cursor"] = cursor

            response = await self.post(
                "/video/list/",
                json=request_body,
            )

            videos = response.get("data", {}).get("videos", [])

            logger.info(
                "TikTok videos retrieved",
                extra={
                    "video_count": len(videos),
                    "has_more": response.get("data", {}).get("has_more", False),
                },
            )

            return response

        except Exception as exc:
            logger.error(
                "Failed to get TikTok videos",
                extra={
                    "error": str(exc),
                },
            )
            raise PlatformAPIError(
                f"Failed to get videos: {str(exc)}"
            ) from exc

    async def verify_follow(self, target_user_id: str) -> bool:
        """
        Verify that user follows another TikTok account.

        Note: TikTok API v2 doesn't provide a direct endpoint to check
        if a user follows another account. This method returns False as
        the functionality is not available.

        Args:
            target_user_id: TikTok user ID to check if followed

        Returns:
            False (TikTok API doesn't support this verification)

        Example:
            >>> client = TikTokClient("access_token")
            >>> is_following = await client.verify_follow("user123")
            >>> is_following
            False
        """
        logger.warning(
            "TikTok follow verification not supported by API",
            extra={"target_user_id": target_user_id},
        )
        # TikTok API v2 doesn't provide following list endpoint
        return False

    async def verify_video_engagement(
        self,
        video_id: str,
        engagement_type: str = "like",
    ) -> bool:
        """
        Verify user engagement with a specific video.

        Note: TikTok API v2 has limited engagement verification capabilities.
        This returns False as direct verification is not available without
        additional API permissions.

        Args:
            video_id: TikTok video ID
            engagement_type: Type of engagement ('like', 'comment', 'share')

        Returns:
            False (TikTok API doesn't support this verification)

        Example:
            >>> client = TikTokClient("access_token")
            >>> has_liked = await client.verify_video_engagement("video123", "like")
            >>> has_liked
            False
        """
        logger.warning(
            "TikTok engagement verification not fully supported by API",
            extra={
                "video_id": video_id,
                "engagement_type": engagement_type,
            },
        )
        # TikTok API v2 has limited engagement verification
        return False

    async def get_video_info(self, video_ids: list[str]) -> dict[str, Any]:
        """
        Get information about specific videos.

        Args:
            video_ids: List of TikTok video IDs (max 20)

        Returns:
            Dictionary containing video information

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = TikTokClient("access_token")
            >>> info = await client.get_video_info(["video1", "video2"])
            >>> "data" in info
            True
        """
        try:
            if len(video_ids) > 20:
                video_ids = video_ids[:20]
                logger.warning(
                    "TikTok video query limit exceeded, truncating to 20",
                    extra={"requested_count": len(video_ids)},
                )

            fields = "id,create_time,cover_image_url,share_url,video_description,duration,title,like_count,comment_count,share_count,view_count"

            response = await self.post(
                "/video/query/",
                json={
                    "filters": {
                        "video_ids": video_ids,
                    },
                    "fields": fields,
                },
            )

            videos = response.get("data", {}).get("videos", [])

            logger.info(
                "TikTok video info retrieved",
                extra={
                    "requested_count": len(video_ids),
                    "returned_count": len(videos),
                },
            )

            return response

        except Exception as exc:
            logger.error(
                "Failed to get TikTok video info",
                extra={
                    "video_ids": video_ids,
                    "error": str(exc),
                },
            )
            raise PlatformAPIError(
                f"Failed to get video info: {str(exc)}"
            ) from exc

    async def get_follower_count(self) -> int:
        """
        Get the follower count for the authenticated user.

        Returns:
            Number of followers

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = TikTokClient("access_token")
            >>> count = await client.get_follower_count()
            >>> isinstance(count, int)
            True
        """
        try:
            profile = await self.get_user_profile()
            user_data = profile.get("data", {}).get("user", {})
            follower_count = user_data.get("follower_count", 0)

            logger.info(
                "TikTok follower count retrieved",
                extra={"follower_count": follower_count},
            )

            return follower_count

        except Exception as exc:
            logger.error(
                "Failed to get TikTok follower count",
                extra={"error": str(exc)},
            )
            raise PlatformAPIError(
                f"Failed to get follower count: {str(exc)}"
            ) from exc
