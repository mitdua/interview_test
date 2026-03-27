.PHONY: backend frontend docker docker-down

backend:
	uv run uvicorn src.backend.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd src/frontend && npm run dev

docker:
	docker compose up --build -d

docker-down:
	docker compose down
