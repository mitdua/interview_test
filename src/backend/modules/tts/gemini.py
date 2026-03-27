import io
import wave

from google import genai
from google.genai import types

from src.backend.modules.tts.base import BaseTTS, TTSResult


class GeminiTTS(BaseTTS):
    def __init__(self, api_key: str) -> None:
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash-preview-tts"

    async def synthesize(self, text: str) -> TTSResult:
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=f"Please read the following text aloud clearly and naturally:\n\n{text}",
            config=types.GenerateContentConfig(
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
                    )
                ),
                response_modalities=["AUDIO"],
            ),
        )

        audio_part = response.candidates[0].content.parts[0]
        pcm_data = audio_part.inline_data.data

        # Gemini returns raw PCM (L16, 24kHz, mono) — wrap in WAV header
        wav_data = self._pcm_to_wav(pcm_data, sample_rate=24000)

        return TTSResult(audio_data=wav_data, mime_type="audio/wav")

    @staticmethod
    def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000) -> bytes:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_data)
        return buf.getvalue()
