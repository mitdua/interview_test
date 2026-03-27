from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TTSResult:
    audio_data: bytes
    mime_type: str


class BaseTTS(ABC):
    @abstractmethod
    async def synthesize(self, text: str) -> TTSResult:
        """Convert text to speech audio bytes."""
