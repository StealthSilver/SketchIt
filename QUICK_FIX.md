# Quick Fix for Database Connection Error

## The Problem

You're seeing this error:

```
Can't reach database server at `ep-dark-base-ad4b5iqt-pooler.c-2.us-east-1.aws.neon.tech:5432`
```

This means the application can't connect to the database because:

1. No `.env` file existed (now created)
2. No local database is running

## Solution: Choose One Option

### Option 1: Docker (Fastest - 2 minutes)

1. **Open Docker Desktop** (from your Applications folder)

2. **Run the setup script:**

   ```bash
   ./setup-db.sh
   ```

3. **Start the app:**
   ```bash
   pnpm run dev
   ```

✅ Done! The database will persist between restarts.

---

### Option 2: Install PostgreSQL Locally (5 minutes)

1. **Install PostgreSQL:**

   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create database:**

   ```bash
   createdb excelidraw
   ```

3. **Setup Prisma:**

   ```bash
   cd packages/db
   pnpm db:generate
   pnpm db:migrate
   cd ../..
   ```

4. **Start the app:**
   ```bash
   pnpm run dev
   ```

---

### Option 3: Use Cloud Database (3 minutes)

1. **Create free database:**
   - Go to [Neon.tech](https://neon.tech) and sign up
   - Create a new project
   - Copy the connection string

2. **Update `.env` file:**
   Replace the DATABASE_URL with your connection string:

   ```
   DATABASE_URL="postgresql://user:password@your-host.neon.tech:5432/yourdb?sslmode=require"
   ```

3. **Setup Prisma:**

   ```bash
   cd packages/db
   pnpm db:generate
   pnpm db:migrate
   cd ../..
   ```

4. **Start the app:**
   ```bash
   pnpm run dev
   ```

---

## Verify It Works

After choosing an option above, you should see:

```
✓ ws-backend#dev
✓ http-backend#dev
✓ frontend#dev
```

No more database connection errors! 🎉

## Troubleshooting

**"Port 5432 already in use"**

- Another PostgreSQL is running. Find and stop it:
  ```bash
  lsof -i :5432
  ```

**"Docker daemon not running"**

- Open Docker Desktop from Applications

**"Prisma migration failed"**

- Check your DATABASE_URL in `.env`
- Make sure the database is running
- Try: `cd packages/db && pnpm db:push`

## Next Steps

Once the database is connected:

- Visit http://localhost:3000 to see the app
- Create an account and start drawing!
- View database: `cd packages/db && pnpm db:studio`
