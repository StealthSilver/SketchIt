# Database Setup Guide

This project requires a PostgreSQL database. You have several options:

## Option 1: Using Docker (Recommended for Development)

1. **Start Docker Desktop** on your Mac
2. **Run the database container:**
   ```bash
   docker-compose up -d
   ```
3. **Verify it's running:**
   ```bash
   docker ps
   ```
4. The database will be available at: `postgresql://postgres:postgres@localhost:5432/excelidraw`

## Option 2: Install PostgreSQL Locally

1. **Install PostgreSQL using Homebrew:**

   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create the database:**

   ```bash
   createdb excelidraw
   ```

3. **Update `.env` if needed with your credentials**

## Option 3: Use a Cloud Database (Neon, Supabase, etc.)

1. Create a free database at [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Copy the connection string
3. Update the `DATABASE_URL` in `.env` file

## After Setting Up Database

1. **Generate Prisma Client:**

   ```bash
   cd packages/db
   pnpm prisma generate
   ```

2. **Run migrations:**

   ```bash
   pnpm prisma migrate dev
   ```

3. **Start the application:**
   ```bash
   cd ../..
   pnpm run dev
   ```

## Troubleshooting

- **Port 5432 already in use:** Another PostgreSQL instance is running. Stop it or use a different port.
- **Docker not running:** Start Docker Desktop from Applications.
- **Connection refused:** Check if the database service is running and the credentials are correct.
