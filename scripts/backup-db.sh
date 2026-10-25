#!/usr/bin/env bash
set -e

# Load backend .env if exists
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"
ENV_FILE="${ROOT_DIR}/backend/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep 'DATABASE_URL' | xargs)
fi

RAW_DB_URL="${DATABASE_URL:-postgresql://cafe:cafepw@localhost:5432/cafe?schema=public}"
# Strip Prisma ?schema= parameter which pg_dump rejects
CLEAN_DB_URL="${RAW_DB_URL%%\?*}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

SQL_FILE="${BACKUP_DIR}/cafe_backup_${TIMESTAMP}.sql"
DUMP_FILE="${BACKUP_DIR}/cafe_backup_${TIMESTAMP}.dump"

echo "📦 Backing up PostgreSQL database: ${DB_URL%%:*}..."

# Find pg_dump path
PG_DUMP_BIN=$(which pg_dump || true)
if [ -z "$PG_DUMP_BIN" ] && [ -x "/opt/homebrew/opt/postgresql@16/bin/pg_dump" ]; then
  PG_DUMP_BIN="/opt/homebrew/opt/postgresql@16/bin/pg_dump"
fi

if [ -z "$PG_DUMP_BIN" ]; then
  echo "❌ Error: pg_dump not found in PATH or standard locations."
  exit 1
fi

"$PG_DUMP_BIN" "$CLEAN_DB_URL" -F p -f "$SQL_FILE"
"$PG_DUMP_BIN" "$CLEAN_DB_URL" -F c -f "$DUMP_FILE"

# Prune backups older than 30 days to save disk space
find "$BACKUP_DIR" -type f \( -name "*.sql" -o -name "*.dump" \) -mtime +30 -delete 2>/dev/null || true

echo "✅ Backup completed successfully!"
echo "   - SQL:  $SQL_FILE"
echo "   - Dump: $DUMP_FILE"
