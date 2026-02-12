"""
YouTube Data API v3 client.

This module implements YouTube-specific API operations including channel profile retrieval,
video listing, subscription verification, and engagement verification.
"""

import logging
from typing import Any, Optional

from src.social_media.enums.platform_enums import Platform
from src.social_media.services.platform_clients.base_client import BaseClient, PlatformAPIError

logger = logging.getLogger(__name__)


class YouTubeClient(BaseClient):
    """
    YouTube Data API v3 client.

    Provides methods for interacting with YouTube Data API including
    channel profiles, video listing, subscriptions, and engagement verification.
    """

    def __init__(self, access_token: str) -> None:
        """
        Initialize YouTube client.

        Args:
            access_token: YouTube/Google OAuth 2.0 access token
        """
        super().__init__(Platform.YOUTUBE, access_token)
        logger.info("YouTube client initialized")

    async def get_user_profile(self, user_id: Optional[str] = None) -> dict[str, Any]:
        """
        Get YouTube channel profile information.

        Args:
            user_id: YouTube channel ID (uses authenticated user's channel if None)

        Returns:
            Dictionary containing channel profile data (id, snippet, statistics, etc.)

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = YouTubeClient("access_token")
            >>> profile = await client.get_user_profile()
            >>> "items" in profile
            True
        """
        try:
            params: dict[str, str] = {
                "part": "snippet,statistics,contentDetails,brandingSettings",
            }

            if user_id:
                params["id"] = user_id
            else:
                params["mine"] = "true"

            response = await self.get("/channels", params=params)

            items = response.get("items", [])
            if items:
                channel_data = items[0]
                snippet = channel_data.get("snippet", {})

                logger.info(
                    "YouTube channel profile retrieved",
                    extra={
                        "channel_id": channel_data.get("id"),
                        "title": snippet.get("title"),
                    },
                )

            return response

        except Exception as exc:
            logger.error(
                "Failed to get YouTube channel profile",
                extra={
                    "user_id": user_id,
                    "error": str(exc),
                },
            )
            raise PlatformAPIError(
                f"Failed to get channel profile: {str(exc)}"
            ) from exc

    async def verify_account_ownership(self, account_id: str) -> bool:
        """
        Verify that authenticated user owns the specified YouTube channel.

        Args:
            account_id: YouTube channel ID to verify

        Returns:
            True if authenticated user's channel ID matches account_id

        Example:
            >>> client = YouTubeClient("access_token")
            >>> is_owner = await client.verify_account_ownership("UC_channel_id")
            >>> isinstance(is_owner, bool)
            True
        """
        try:
            profile = await self.get_user_profile()
            items = profile.get("items", [])

            if not items:
                logger.warning(
                    "No channel found for authenticated user",
                    extra={"account_id": account_id},
                )
                return False

            channel_id = items[0].get("id")
            is_owner = channel_id == account_id

            logger.info(
                "YouTube account ownership verification",
                extra={
                    "account_id": account_id,
                    "channel_id": channel_id,
                    "is_owner": is_owner,
                },
            )

            return is_owner

        except Exception as exc:
            logger.error(
                "Failed to verify YouTube account ownership",
                extra={
                    "account_id": account_id,
                    "error": str(exc),
                },
            )
            return False

    async def get_channel_videos(
        self,
        max_results: int = 25,
        page_token: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Get videos from the authenticated user's channel.

        Args:
            max_results: Maximum number of videos to return (default: 25, max: 50)
            page_token: Pagination token for next page

        Returns:
            Dictionary containing videos list and pagination info

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = YouTubeClient("access_token")
            >>> videos = await client.get_channel_videos(max_results=10)
            >>> "items" in videos
            True
        """
        try:
            # First get the user's channel to find uploads playlist
            channel_response = await self.get_user_profile()
            items = channel_response.get("items", [])

            if not items:
                logger.warning("No channel found for authenticated user")
                return {"items": []}

            uploads_playlist_id = items[0].get("contentDetails", {}).get(
                "relatedPlaylists", {}
            ).get("uploads")

            if not uploads_playlist_id:
                logger.warning("No uploads playlist found")
                return {"items": []}

            # Get videos from uploads playlist
            params: dict[str, str | int] = {
                "part": "snippet,contentDetails",
                "playlistId": uploads_playlist_id,
                "maxResults": min(max_results, 50),
            }

            if page_token:
                params["pageToken"] = page_token

            response = await self.get("/playlistItems", params=params)

            videos = response.get("items", [])

            logger.info(
                "YouTube channel videos retrieved",
                extra={
                    "video_count": len(videos),
                    "has_next_page": "nextPageToken" in response,
                },
            )

            return response

        except Exception as exc:
            logger.error(
                "Failed to get YouTube channel videos",
                extra={"error": str(exc)},
            )
            raise PlatformAPIError(
                f"Failed to get channel videos: {str(exc)}"
            ) from exc

    async def verify_subscription(self, target_channel_id: str) -> bool:
        """
        Verify that user is subscribed to a YouTube channel.

        Args:
            target_channel_id: YouTube channel ID to check if subscribed

        Returns:
            True if user is subscribed to the target channel

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = YouTubeClient("access_token")
            >>> is_subscribed = await client.verify_subscription("UC_target_channel")
            >>> isinstance(is_subscribed, bool)
            True
        """
        try:
            params = {
                "part": "snippet",
                "forChannelId": target_channel_id,
                "mine": "true",
            }

            response = await self.get("/subscriptions", params=params)

            items = response.get("items", [])
            is_subscribed = len(items) > 0

            logger.info(
                "YouTube subscription verification",
                extra={
                    "target_channel_id": target_channel_id,
                    "is_subscribed": is_subscribed,
                },
            )

            return is_subscribed

        except PlatformAPIError as exc:
            if exc.status_code == 404:
                logger.info(
                    "User not subscribed to channel",
                    extra={"target_channel_id": target_channel_id},
                )
                return False
            logger.error(
                "Failed to verify YouTube subscription",
                extra={
                    "target_channel_id": target_channel_id,
                    "error": str(exc),
                },
            )
            raise

    async def verify_like(self, video_id: str) -> bool:
        """
        Verify that user has liked a specific video.

        Args:
            video_id: YouTube video ID

        Returns:
            True if user has liked the video

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = YouTubeClient("access_token")
            >>> has_liked = await client.verify_like("video_id_123")
            >>> isinstance(has_liked, bool)
            True
        """
        try:
            params: dict[str, str | int] = {
                "part": "snippet",
                "myRating": "like",
                "maxResults": 50,
            }

            response = await self.get("/videos", params=params)

            items = response.get("items", [])
            has_liked = any(item.get("id") == video_id for item in items)

            # If not found in first page, we might need to paginate
            # For efficiency, we'll limit to first 50 results
            if not has_liked and "nextPageToken" in response:
                logger.info(
                    "Video not found in liked videos (first page only checked)",
                    extra={"video_id": video_id},
                )

            logger.info(
                "YouTube like verification",
                extra={
                    "video_id": video_id,
                    "has_liked": has_liked,
                },
            )

            return has_liked

        except PlatformAPIError as exc:
            if exc.status_code == 404:
                logger.info(
                    "Video not liked by user",
                    extra={"video_id": video_id},
                )
                return False
            logger.error(
                "Failed to verify YouTube like",
                extra={
                    "video_id": video_id,
                    "error": str(exc),
                },
            )
            raise

    async def verify_comment(self, video_id: str) -> bool:
        """
        Verify that user has commented on a specific video.

        Note: YouTube API doesn't provide a direct way to check if a specific
        user has commented on a video. This method returns False as the
        functionality requires additional implementation.

        Args:
            video_id: YouTube video ID

        Returns:
            False (requires additional implementation for full support)

        Example:
            >>> client = YouTubeClient("access_token")
            >>> has_commented = await client.verify_comment("video_id_123")
            >>> has_commented
            False
        """
        logger.warning(
            "YouTube comment verification not fully supported",
            extra={"video_id": video_id},
        )
        # YouTube API doesn't provide a direct endpoint to check if user commented
        # Would need to iterate through all comments which is inefficient
        return False

    async def get_video_info(self, video_ids: list[str]) -> dict[str, Any]:
        """
        Get information about specific videos.

        Args:
            video_ids: List of YouTube video IDs (max 50)

        Returns:
            Dictionary containing video information

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = YouTubeClient("access_token")
            >>> info = await client.get_video_info(["video1", "video2"])
            >>> "items" in info
            True
        """
        try:
            if len(video_ids) > 50:
                video_ids = video_ids[:50]
                logger.warning(
                    "YouTube video query limit exceeded, truncating to 50",
                    extra={"requested_count": len(video_ids)},
                )

            params = {
                "part": "snippet,statistics,contentDetails",
                "id": ",".join(video_ids),
            }

            response = await self.get("/videos", params=params)

            items = response.get("items", [])

            logger.info(
                "YouTube video info retrieved",
                extra={
                    "requested_count": len(video_ids),
                    "returned_count": len(items),
                },
            )

            return response

        except Exception as exc:
            logger.error(
                "Failed to get YouTube video info",
                extra={
                    "video_ids": video_ids,
                    "error": str(exc),
                },
            )
            raise PlatformAPIError(
                f"Failed to get video info: {str(exc)}"
            ) from exc

    async def get_subscriber_count(self) -> int:
        """
        Get the subscriber count for the authenticated user's channel.

        Returns:
            Number of subscribers

        Raises:
            PlatformAPIError: If API request fails

        Example:
            >>> client = YouTubeClient("access_token")
            >>> count = await client.get_subscriber_count()
            >>> isinstance(count, int)
            True
        """
        try:
            profile = await self.get_user_profile()
            items = profile.get("items", [])

            if not items:
                logger.warning("No channel found for subscriber count")
                return 0

            statistics = items[0].get("statistics", {})
            # Note: subscriberCount might be hidden if channel has it private
            subscriber_count = int(statistics.get("subscriberCount", 0))

            logger.info(
                "YouTube subscriber count retrieved",
                extra={"subscriber_count": subscriber_count},
            )

            return subscriber_count

        except Exception as exc:
            logger.error(
                "Failed to get YouTube subscriber count",
                extra={"error": str(exc)},
            )
            raise PlatformAPIError(
                f"Failed to get subscriber count: {str(exc)}"
            ) from exc

    async def get_channel_by_username(self, username: str) -> dict[str, Any]:
        """
        Get YouTube channel by custom URL or username.

        Args:
            username: YouTube channel custom URL or handle (without @)

        Returns:
            Dictionary containing channel information

        Raises:
            PlatformAPIError: If API request fails or channel not found

        Example:
            >>> client = YouTubeClient("access_token")
            >>> channel = await client.get_channel_by_username("GoogleDevelopers")
            >>> "items" in channel
            True
        """
        try:
            # Remove @ symbol if present
            clean_username = username.lstrip("@")

            params = {
                "part": "snippet,statistics,contentDetails",
                "forHandle": clean_username,
            }

            response = await self.get("/channels", params=params)

            items = response.get("items", [])

            if items:
                logger.info(
                    "YouTube channel found by username",
                    extra={
                        "username": username,
                        "channel_id": items[0].get("id"),
                    },
                )
            else:
                logger.warning(
                    "YouTube channel not found by username",
                    extra={"username": username},
                )

            return response

        except Exception as exc:
            logger.error(
                "Failed to get YouTube channel by username",
                extra={
                    "username": username,
                    "error": str(exc),
                },
            )
            raise PlatformAPIError(
                f"Failed to get channel: {str(exc)}"
            ) from exc
