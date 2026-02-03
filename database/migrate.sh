#!/bin/bash
# Genii ERP Database Migration Runner
# Usage: ./migrate.sh [command] [options]

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-genii_erp}"
DB_USER="${DB_USER:-postgres}"
MIGRATIONS_DIR="$(dirname "$0")/migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_deps() {
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client (psql) not found"
        exit 1
    fi
}

# Test database connection
test_connection() {
    log_info "Testing connection to $DB_NAME..."
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Cannot connect to database"
        exit 1
    fi
    log_info "Connection successful"
}

# Create migrations tracking table
create_migrations_table() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);
EOF
}

# Run all pending migrations
migrate_up() {
    log_info "Running pending migrations..."
    create_migrations_table
    
    for file in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
        filename=$(basename "$file")
        
        # Check if already executed
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM schema_migrations WHERE filename = '$filename';" | grep -q 1; then
            log_warn "Skipping $filename (already executed)"
            continue
        fi
        
        log_info "Executing $filename..."
        
        # Calculate checksum
        checksum=$(sha256sum "$file" | cut -d' ' -f1)
        
        # Execute migration
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (filename, checksum) VALUES ('$filename', '$checksum');"
            log_info "✓ $filename completed"
        else
            log_error "✗ $filename failed"
            exit 1
        fi
    done
    
    log_info "All migrations completed!"
}

# Run full schema (for fresh install)
schema_load() {
    log_info "Loading full schema..."
    local schema_file="$(dirname "$0")/schema.sql"
    
    if [ ! -f "$schema_file" ]; then
        log_error "Schema file not found: $schema_file"
        exit 1
    fi
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$schema_file"
    log_info "Schema loaded successfully!"
}

# Reset database (DANGER!)
reset() {
    log_warn "This will DELETE ALL DATA in $DB_NAME!"
    read -p "Are you sure? Type 'yes' to continue: " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Reset cancelled"
        exit 0
    fi
    
    log_info "Dropping and recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    log_info "Database reset complete"
}

# Show migration status
status() {
    create_migrations_table
    
    echo ""
    echo "Migration Status"
    echo "================"
    echo ""
    
    for file in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
        filename=$(basename "$file")
        
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT executed_at FROM schema_migrations WHERE filename = '$filename';" | grep -q .; then
            executed_at=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT executed_at FROM schema_migrations WHERE filename = '$filename';" | xargs)
            echo -e "${GREEN}[EXECUTED]${NC} $filename ($executed_at)"
        else
            echo -e "${YELLOW}[PENDING]${NC}  $filename"
        fi
    done
    echo ""
}

# Show help
help() {
    cat << EOF
Genii ERP Database Migration Runner

Usage: $0 [command]

Commands:
    up          Run all pending migrations
    schema      Load full schema.sql (for fresh installs)
    reset       Reset database (DANGER - deletes all data!)
    status      Show migration status
    help        Show this help message

Environment Variables:
    DB_HOST     Database host (default: localhost)
    DB_PORT     Database port (default: 5432)
    DB_NAME     Database name (default: genii_erp)
    DB_USER     Database user (default: postgres)
    PGPASSWORD  Database password

Examples:
    $0 up
    $0 schema
    $0 status
    DB_NAME=my_db DB_USER=my_user $0 up

EOF
}

# Main
case "${1:-help}" in
    up)
        check_deps
        test_connection
        migrate_up
        ;;
    schema)
        check_deps
        test_connection
        schema_load
        ;;
    reset)
        check_deps
        test_connection
        reset
        ;;
    status)
        check_deps
        test_connection
        status
        ;;
    help|--help|-h)
        help
        ;;
    *)
        log_error "Unknown command: $1"
        help
        exit 1
        ;;
esac
