# Start Development Environment

Start both frontend and backend development servers.

## Steps

1. Check if dependencies are installed:

   ```bash
   cd /Users/joakimliljedahl/Developer/project-scaffolder/pacy-training-system
   npm run install:all
   ```

2. Start the development servers:

   ```bash
   npm run dev
   ```

3. Open in browser:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Troubleshooting

If ports are in use:

```bash
lsof -i :5173
lsof -i :3001
```

If database issues:

```bash
cd backend && npx prisma migrate dev
```
