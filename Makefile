.PHONY: up down pull-model test

VLM_MODEL ?= qwen2.5vl:7b

up:
	docker compose up -d --build
	@echo "Waiting for Ollama to start..."
	@sleep 5
	@docker exec listingforge-ollama ollama pull $(VLM_MODEL) || true
	@echo "ListingForge is running at http://localhost:5173"

down:
	docker compose down

pull-model:
	docker exec listingforge-ollama ollama pull $(VLM_MODEL)

test:
	cd backend && npm test

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev
