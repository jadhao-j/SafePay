#!/bin/bash
set -e

echo "🚀 SafePay Phase 0 — Verify Setup"
echo "=================================="

cd "$(dirname "$0")/.."

echo "▶ Starting Docker services..."
docker compose up -d --build

echo "▶ Waiting for services to be healthy (up to 60s)..."
sleep 15

echo "▶ Checking backend health..."
HEALTH=$(curl -s http://localhost:8000/health || echo '{"status":"fail"}')
echo "   Backend: $HEALTH"

PG=$(echo $HEALTH | grep -o '"postgres":"[^"]*"' | cut -d'"' -f4)
RD=$(echo $HEALTH | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)

echo ""
if [ "$PG" = "ok" ] && [ "$RD" = "ok" ]; then
  echo "✅ SafePay Phase 0 Complete!"
  echo "   Frontend: http://localhost:3000"
  echo "   Backend:  http://localhost:8000"
  echo "   API Docs: http://localhost:8000/docs"
else
  echo "❌ Setup incomplete"
  echo "   Postgres: $PG"
  echo "   Redis:    $RD"
  echo "   Run: docker compose logs backend"
fi