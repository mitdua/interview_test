from abc import ABC, abstractmethod


class BaseSTT(ABC):
    @abstractmethod
    async def transcribe(self, audio_data: bytes, mime_type: str = "audio/webm") -> str:
        """Transcribe audio bytes to text."""
