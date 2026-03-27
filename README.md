# InterView — AI Interview Practice

![Python](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

A web application for practicing job interviews in English with AI. The system generates audio questions, records your answers, transcribes them, evaluates them, and provides feedback with a score.

## Requirements

- Python 3.13+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Docker and Docker Compose (optional, for containerized deployment)

## API Keys (free tier)

The app requires two API keys. Both offer a free tier:

| Provider | Get key |
|----------|---------|
| Google Gemini | https://aistudio.google.com/api-keys |
| Groq | https://console.groq.com/keys |

Set up the keys in a `.env` file:

```bash
cp .env.example .env
# Edit .env with your keys
```

## Installation

```bash
# Clone the repo
git clone <repo-url>
cd agent-interview

# Install Python dependencies
uv sync

# Install frontend dependencies
cd src/frontend && npm install && cd ../..
```

## Usage

### Option 1 — Local development

```bash
# Terminal 1 — Backend (port 8000)
make backend

# Terminal 2 — Frontend (port 5173)
make frontend
```

Open http://localhost:5173 in your browser.

### Option 2 — Docker Compose

Spin everything up with a single command:

```bash
make docker
```

Open http://localhost in your browser.

To stop the containers:

```bash
make docker-down
```

### Available commands

| Command | Description |
|---------|-------------|
| `make backend` | Start the backend with hot-reload (port 8000) |
| `make frontend` | Start the frontend dev server (port 5173) |
| `make docker` | Build and start everything with Docker Compose |
| `make docker-down` | Stop the containers |

## How it works

1. **Setup** — Enter the interview context (position, company, technologies), choose the number of questions, and whether you want follow-up questions.
2. **Interview** — The AI generates a question and reads it aloud. You listen to the question, record your answer with the microphone, and submit it.
3. **Result** — You receive a score (1–10), the transcription of your answer, detailed feedback, and an improved sample answer.
4. **Summary** — When finished, you see your average score, overall feedback, and the details for each question.

## AI Providers

The app uses a configurable failover pattern defined in `config.yml`:

| Module | Primary | Fallback |
|--------|---------|----------|
| LLM    | Gemini  | Groq     |
| TTS    | Gemini  | Groq     |
| STT    | Groq    | Gemini   |

If the primary provider fails, the fallback is used automatically.

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy (async) + SQLite
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + Vite
- **LLM:** Gemini (`gemini-3-flash-preview`), Groq (`llama-3.3-70b-versatile`)
- **TTS:** Gemini (`gemini-2.5-flash-preview-tts`), Groq (`playai-tts`)
- **STT:** Groq (`whisper-large-v3-turbo`), Gemini (via `gemini-3-flash-preview`)
- **Infra:** Docker + Nginx (reverse proxy)

## Project Structure

```
├── main.py                  # Entry point (launches uvicorn)
├── config.yml               # Provider priorities
├── Makefile                 # Development and Docker commands
├── docker-compose.yml       # Container orchestration
├── docker/
│   ├── backend.Dockerfile   # Backend image (Python + uv)
│   ├── frontend.Dockerfile  # Frontend image (build + nginx)
│   └── nginx.conf           # Reverse proxy /api → backend
├── src/
│   ├── backend/
│   │   ├── main.py          # FastAPI app
│   │   ├── core/            # Config, DB, dependencies
│   │   ├── models/          # SQLAlchemy models
│   │   ├── api/             # Routes and schemas
│   │   ├── modules/         # LLM, TTS, STT (Provider pattern)
│   │   └── services/        # Business logic
│   └── frontend/
│       └── src/
│           ├── pages/       # Setup, Interview, Summary, History
│           ├── components/  # AudioPlayer, ResultCard, Spinner
│           ├── hooks/       # useAudioRecorder
│           └── services/    # API client
├── audio_answers/           # Recorded answers (auto-created)
└── interview.db             # SQLite (auto-created)
```

## API

All endpoints under `/api`:

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/sessions` | Create an interview session |
| `GET` | `/sessions` | List sessions |
| `GET` | `/sessions/{id}` | Session details |
| `GET` | `/sessions/{id}/next-question` | Next question (with audio) |
| `POST` | `/sessions/{id}/questions/{qid}/answer` | Submit answer (multipart audio) |
| `GET` | `/sessions/{id}/summary` | Final summary |
| `GET` | `/health` | Health check |
