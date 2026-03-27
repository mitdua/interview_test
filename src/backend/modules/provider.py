import logging
from typing import Generic, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class Provider(Generic[T]):
    """Generic provider with automatic failover from primary to fallback."""

    def __init__(self, primary: T, fallback: T) -> None:
        self.primary = primary
        self.fallback = fallback

    async def call(self, method: str, *args, **kwargs):
        """Try calling method on primary, fall back to fallback on failure."""
        primary_method = getattr(self.primary, method)
        try:
            return await primary_method(*args, **kwargs)
        except Exception as e:
            logger.warning(
                "Primary provider %s.%s failed: %s. Trying fallback.",
                type(self.primary).__name__,
                method,
                e,
            )

        fallback_method = getattr(self.fallback, method)
        return await fallback_method(*args, **kwargs)
