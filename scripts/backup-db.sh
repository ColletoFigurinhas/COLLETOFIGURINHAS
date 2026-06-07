#!/usr/bin/env bash
# Backup diário do banco MySQL/MariaDB
# Cron recomendado: 0 2 * * * /opt/colleto/scripts/backup-db.sh >> /var/log/colleto-backup.log 2>&1

set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-album_supermedica}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/colleto}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup de $DB_NAME..."

MYSQL_PWD="$DB_PASSWORD" mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$FILE"

SIZE=$(du -sh "$FILE" | cut -f1)
echo "[$(date)] Backup concluído: $FILE ($SIZE)"

# Remove backups mais antigos que RETENTION_DAYS dias
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Arquivos antigos removidos (retenção: ${RETENTION_DAYS} dias)"

# Opcional: enviar para DO Spaces
# se SPACES_BUCKET e SPACES_KEY estiverem definidos, usa aws-cli
if [[ -n "${SPACES_KEY:-}" && -n "${SPACES_BUCKET:-}" ]]; then
  AWS_ACCESS_KEY_ID="$SPACES_KEY" \
  AWS_SECRET_ACCESS_KEY="$SPACES_SECRET" \
  aws s3 cp "$FILE" \
    "s3://${SPACES_BUCKET}/backups/$(basename "$FILE")" \
    --endpoint-url "${SPACES_ENDPOINT:-https://nyc3.digitaloceanspaces.com}" \
    --region "${SPACES_REGION:-nyc3}"
  echo "[$(date)] Backup enviado para DO Spaces: $SPACES_BUCKET"
fi
