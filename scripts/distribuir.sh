#!/bin/bash
# Distribuição diária de pacotes — chamado pelo cron às 21:00 UTC (18:00 BRT)
# Para alterar horário, URL ou comportamento: edite este arquivo e faça git push.
# O crontab do servidor aponta fixo para este script.

set -euo pipefail

ENV_FILE="/var/www/album-figurinhas/.env"
LOG_FILE="/var/log/album-cron.log"
URL="https://copa.samsung.com.br/api/cron/distribuir"

# Carrega variáveis do .env
if [ ! -f "$ENV_FILE" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERRO: .env não encontrado em $ENV_FILE" >> "$LOG_FILE"
  exit 1
fi

CRON_SECRET=$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)

if [ -z "$CRON_SECRET" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERRO: CRON_SECRET não encontrado no .env" >> "$LOG_FILE"
  exit 1
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Iniciando distribuição..." >> "$LOG_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  --max-time 30)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] HTTP $HTTP_CODE — $BODY" >> "$LOG_FILE"

if [ "$HTTP_CODE" != "200" ]; then
  exit 1
fi
