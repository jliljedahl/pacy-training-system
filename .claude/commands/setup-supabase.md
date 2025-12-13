# Setup Supabase

Guide to migrating from SQLite to Supabase PostgreSQL.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Note your project URL and keys from Settings > API

## Steps

### 1. Install Supabase Client

```bash
cd backend && npm install @supabase/supabase-js
cd ../frontend && npm install @supabase/supabase-js
```

### 2. Update Prisma Schema

Edit `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 3. Update Environment Variables

**backend/.env:**
```
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_SERVICE_KEY="eyJ..."
```

**frontend/.env:**
```
VITE_SUPABASE_URL="https://[ref].supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
```

### 4. Run Migration

```bash
cd backend
npx prisma migrate dev --name init_supabase
```

### 5. Configure Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create bucket: `source-materials`
3. Set policies for authenticated access

### 6. Enable Auth (Optional)

In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Email/Password
3. Configure redirect URLs

## Verification

```bash
# Test database connection
cd backend && npx prisma studio

# Test API
curl http://localhost:3001/api/projects
```

## Rollback

To revert to SQLite, change schema.prisma back:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```
