#!/usr/bin/env bash
set -euo pipefail

VLM_MODEL="${VLM_MODEL:-qwen2.5vl:7b}"

echo "=== ListingForge — Starting Up ==="

# Start all services
docker compose up -d --build

echo "Waiting for Ollama to become ready..."
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done

# Pull the model on first run
echo "Checking if model '$VLM_MODEL' is available..."
if ! docker exec listingforge-ollama ollama list | grep -q "$VLM_MODEL"; then
  echo "Pulling model '$VLM_MODEL' — this may take a while on first run..."
  docker exec listingforge-ollama ollama pull "$VLM_MODEL"
else
  echo "Model '$VLM_MODEL' is already available."
fi

echo ""
echo "=== ListingForge is ready! ==="
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:4000"
echo "  Ollama:    http://localhost:11434"
echo ""
echo "To stop: docker compose down"
