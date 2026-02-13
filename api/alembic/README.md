# Database Migrations with Alembic

This directory contains database migration scripts for UrbanAid API.

## Quick Start

### Apply all migrations
```bash
cd api
alembic upgrade head
```

### Create a new migration
```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "Description of changes"

# Create empty migration
alembic revision -m "Description of changes"
```

### View migration history
```bash
# Show current revision
alembic current

# Show history
alembic history

# Show pending migrations
alembic history --indicate-current
```

### Downgrade
```bash
# Downgrade one revision
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade <revision_id>

# Downgrade to beginning
alembic downgrade base
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./urbanaid.db` | Database connection string |
| `DB_POOL_SIZE` | `5` | Connection pool size (PostgreSQL) |
| `DB_MAX_OVERFLOW` | `10` | Max overflow connections (PostgreSQL) |

## Database URL Examples

```bash
# SQLite (development)
export DATABASE_URL="sqlite:///./urbanaid.db"

# PostgreSQL (production)
export DATABASE_URL="postgresql://user:password@localhost:5432/urbanaid"

# PostgreSQL with SSL (Heroku, AWS RDS)
export DATABASE_URL="postgresql://user:password@host:5432/urbanaid?sslmode=require"
```

## Migration Best Practices

1. **Always test migrations** on a copy of production data before deploying
2. **Include both upgrade and downgrade** functions
3. **Use batch_alter_table** for SQLite compatibility
4. **Add indexes for frequently queried columns**
5. **Use server_default** instead of default for existing tables

## Troubleshooting

### "Can't locate revision" error
```bash
# Stamp database with current revision
alembic stamp head
```

### Foreign key errors (SQLite)
SQLite has limited ALTER TABLE support. Use batch_alter_table in migrations:
```python
with op.batch_alter_table('table_name') as batch_op:
    batch_op.add_column(...)
```

### Multiple heads
```bash
# Merge heads
alembic merge heads -m "Merge migrations"
```
