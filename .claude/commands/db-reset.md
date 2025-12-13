# Reset Database

Reset the development database and run migrations fresh.

## Steps

1. Navigate to backend:

   ```bash
   cd /Users/joakimliljedahl/Developer/project-scaffolder/pacy-training-system/backend
   ```

2. Delete existing database:

   ```bash
   rm -f prisma/dev.db
   ```

3. Run migrations:

   ```bash
   npx prisma migrate dev
   ```

4. (Optional) Open Prisma Studio to verify:
   ```bash
   npx prisma studio
   ```

## Warning

This will delete ALL data in the development database!
