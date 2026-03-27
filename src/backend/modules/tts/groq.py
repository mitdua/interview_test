from groq import AsyncGroq

from src.backend.modules.tts.base import BaseTTS, TTSResult


class GroqTTS(BaseTTS):
    def __init__(self, api_key: str) -> None:
        self.client = AsyncGroq(api_key=api_key)

    async def synthesize(self, text: str) -> TTSResult:
        response = await self.client.audio.speech.create(
            model="playai-tts",
            input=text,
            voice="Fritz-PlayAI",
            response_format="wav",
        )

        return TTSResult(
            audio_data=response.read(),
            mime_type="audio/wav",
        )
