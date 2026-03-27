# InterView — AI Interview Practice

Aplicacion web para practicar entrevistas de trabajo en ingles con IA. El sistema genera preguntas en audio, graba tus respuestas, las transcribe, evalua y da feedback con una puntuacion.

## Requisitos

- Python 3.13+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (gestor de paquetes Python)
- Docker y Docker Compose (opcional, para despliegue con contenedores)

## API Keys (gratuitas)

La app necesita dos claves de API. Ambas tienen plan gratuito:

| Proveedor | Obtener clave |
|-----------|---------------|
| Google Gemini | https://aistudio.google.com/api-keys |
| Groq | https://console.groq.com/keys |

Configura las claves en un archivo `.env`:

```bash
cp .env.example .env
# Editar .env con tus claves
```

## Instalacion

```bash
# Clonar el repo
git clone <repo-url>
cd agent-interview

# Instalar dependencias Python
uv sync

# Instalar dependencias Frontend
cd src/frontend && npm install && cd ../..
```

## Uso

### Opcion 1 — Desarrollo local

```bash
# Terminal 1 — Backend (puerto 8000)
make backend

# Terminal 2 — Frontend (puerto 5173)
make frontend
```

Abre http://localhost:5173 en tu navegador.

### Opcion 2 — Docker Compose

Levanta todo con un solo comando:

```bash
make docker
```

Abre http://localhost en tu navegador.

Para detener los contenedores:

```bash
make docker-down
```

### Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `make backend` | Inicia el backend con hot-reload (puerto 8000) |
| `make frontend` | Inicia el frontend dev server (puerto 5173) |
| `make docker` | Build + levanta todo con Docker Compose |
| `make docker-down` | Detiene los contenedores |

## Como funciona

1. **Setup** — Escribe el contexto de la entrevista (puesto, empresa, tecnologias), elige el numero de preguntas y si quieres preguntas de seguimiento.
2. **Entrevista** — La IA genera una pregunta y la lee en audio. Escuchas la pregunta, grabas tu respuesta con el microfono, y la envias.
3. **Resultado** — Recibes una puntuacion (1-10), la transcripcion de tu respuesta, feedback detallado y una respuesta mejorada como ejemplo.
4. **Resumen** — Al terminar, ves tu puntuacion promedio, feedback general y el detalle de cada pregunta.

## Proveedores de IA

La app usa un patron de failover configurable en `config.yml`:

| Modulo | Primario | Fallback |
|--------|----------|----------|
| LLM    | Gemini   | Groq     |
| TTS    | Gemini   | Groq     |
| STT    | Groq     | Gemini   |

Si el proveedor primario falla, se usa automaticamente el fallback.

## Stack

- **Backend:** FastAPI + SQLAlchemy (async) + SQLite
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + Vite
- **LLM:** Gemini (`gemini-3-flash-preview`), Groq (`llama-3.3-70b-versatile`)
- **TTS:** Gemini (`gemini-2.5-flash-preview-tts`), Groq (`playai-tts`)
- **STT:** Groq (`whisper-large-v3-turbo`), Gemini (via `gemini-3-flash-preview`)
- **Infra:** Docker + Nginx (reverse proxy)

## Estructura del proyecto

```
├── main.py                  # Entry point (lanza uvicorn)
├── config.yml               # Prioridades de proveedores
├── Makefile                 # Comandos de desarrollo y Docker
├── docker-compose.yml       # Orquestacion de contenedores
├── docker/
│   ├── backend.Dockerfile   # Imagen del backend (Python + uv)
│   ├── frontend.Dockerfile  # Imagen del frontend (build + nginx)
│   └── nginx.conf           # Proxy reverso /api → backend
├── src/
│   ├── backend/
│   │   ├── main.py          # FastAPI app
│   │   ├── core/            # Config, DB, dependencias
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── api/             # Rutas y schemas
│   │   ├── modules/         # LLM, TTS, STT (patron Provider)
│   │   └── services/        # Logica de negocio
│   └── frontend/
│       └── src/
│           ├── pages/       # Setup, Interview, Summary, History
│           ├── components/  # AudioPlayer, ResultCard, Spinner
│           ├── hooks/       # useAudioRecorder
│           └── services/    # API client
├── audio_answers/           # Respuestas grabadas (auto-creado)
└── interview.db             # SQLite (auto-creado)
```

## API

Todos los endpoints bajo `/api`:

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/sessions` | Crear sesion de entrevista |
| `GET` | `/sessions` | Listar sesiones |
| `GET` | `/sessions/{id}` | Detalle de sesion |
| `GET` | `/sessions/{id}/next-question` | Siguiente pregunta (con audio) |
| `POST` | `/sessions/{id}/questions/{qid}/answer` | Enviar respuesta (multipart audio) |
| `GET` | `/sessions/{id}/summary` | Resumen final |
| `GET` | `/health` | Health check |
