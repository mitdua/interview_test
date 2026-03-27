from dataclasses import dataclass, field
from pathlib import Path

import yaml
from dotenv import load_dotenv
import os

PROJECT_ROOT = Path(__file__).resolve().parents[3]

load_dotenv(PROJECT_ROOT / ".env")


@dataclass
class ProviderConfig:
    primary: str
    fallback: str


@dataclass
class Settings:
    gemini_api_key: str = ""
    groq_api_key: str = ""
    database_url: str = ""
    llm: ProviderConfig = field(default_factory=lambda: ProviderConfig("gemini", "groq"))
    tts: ProviderConfig = field(default_factory=lambda: ProviderConfig("gemini", "groq"))
    stt: ProviderConfig = field(default_factory=lambda: ProviderConfig("groq", "gemini"))


def load_settings() -> Settings:
    config_path = PROJECT_ROOT / "config.yml"
    provider_kwargs = {}

    if config_path.exists():
        with open(config_path) as f:
            cfg = yaml.safe_load(f) or {}
        for module in ("llm", "tts", "stt"):
            if module in cfg:
                provider_kwargs[module] = ProviderConfig(
                    primary=cfg[module].get("primary", "gemini"),
                    fallback=cfg[module].get("fallback", "groq"),
                )

    default_db = f"sqlite+aiosqlite:///{PROJECT_ROOT / 'interview.db'}"

    return Settings(
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        groq_api_key=os.getenv("GROQ_API_KEY", ""),
        database_url=os.getenv("DATABASE_URL", default_db),
        **provider_kwargs,
    )


settings = load_settings()
