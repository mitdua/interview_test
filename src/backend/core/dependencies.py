from src.backend.core.config import settings
from src.backend.modules.llm.gemini import GeminiLLM
from src.backend.modules.llm.groq import GroqLLM
from src.backend.modules.provider import Provider
from src.backend.modules.stt.gemini import GeminiSTT
from src.backend.modules.stt.groq import GroqSTT
from src.backend.modules.tts.gemini import GeminiTTS
from src.backend.modules.tts.groq import GroqTTS

_BUILDERS = {
    "llm": {
        "gemini": lambda: GeminiLLM(api_key=settings.gemini_api_key),
        "groq": lambda: GroqLLM(api_key=settings.groq_api_key),
    },
    "tts": {
        "gemini": lambda: GeminiTTS(api_key=settings.gemini_api_key),
        "groq": lambda: GroqTTS(api_key=settings.groq_api_key),
    },
    "stt": {
        "gemini": lambda: GeminiSTT(api_key=settings.gemini_api_key),
        "groq": lambda: GroqSTT(api_key=settings.groq_api_key),
    },
}


def _build_provider(module: str) -> Provider:
    cfg = getattr(settings, module)
    builders = _BUILDERS[module]
    return Provider(
        primary=builders[cfg.primary](),
        fallback=builders[cfg.fallback](),
    )


# Singleton providers — created once at import time
llm_provider: Provider = _build_provider("llm")
tts_provider: Provider = _build_provider("tts")
stt_provider: Provider = _build_provider("stt")
