from google import genai
from google.genai import types

from src.backend.modules.stt.base import BaseSTT


class GeminiSTT(BaseSTT):
    def __init__(self, api_key: str) -> None:
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-3-flash-preview"

    async def transcribe(self, audio_data: bytes, mime_type: str = "audio/webm") -> str:
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=[
                "Transcribe the following audio exactly as spoken. "
                "Return only the transcription text, nothing else.",
                types.Part.from_bytes(data=audio_data, mime_type=mime_type),
            ],
        )
        return response.text.strip()
