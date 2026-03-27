import io

from groq import AsyncGroq

from src.backend.modules.stt.base import BaseSTT

MIME_TO_EXT = {
    "audio/webm": "webm",
    "audio/wav": "wav",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
}


class GroqSTT(BaseSTT):
    def __init__(self, api_key: str) -> None:
        self.client = AsyncGroq(api_key=api_key)

    async def transcribe(self, audio_data: bytes, mime_type: str = "audio/webm") -> str:
        ext = MIME_TO_EXT.get(mime_type, "webm")
        audio_file = io.BytesIO(audio_data)
        audio_file.name = f"audio.{ext}"

        transcription = await self.client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=audio_file,
            language="en",
        )
        return transcription.text.strip()
