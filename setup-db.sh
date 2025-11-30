#!/bin/bash

# Excelidraw Database Setup Script
# This script helps set up the PostgreSQL database for the project

set -e

echo "🚀 Excelidraw Database Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with DATABASE_URL"
    echo "See .env.example for reference"
    exit 1
fi

echo "✅ Found .env file"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running or not installed"
    echo ""
    echo "You have several options:"
    echo "1. Start Docker Desktop and run this script again"
    echo "2. Install PostgreSQL locally: brew install postgresql@16"
    echo "3. Use a cloud database (Neon, Supabase, etc.)"
    echo ""
    echo "See DATABASE_SETUP.md for detailed instructions"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
docker-compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
cd packages/db
pnpm prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate dev --name init

echo ""
echo "✨ Database setup complete!"
echo ""
echo "You can now run: pnpm run dev"
echo ""
echo "To view your database: cd packages/db && pnpm db:studio"
