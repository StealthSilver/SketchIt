#!/bin/bash

# Database migration script for SketchIt

set -e

echo "=========================================="
echo "SketchIt Database Migration"
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable not set"
    exit 1
fi

echo "Running database migrations..."
cd packages/db

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run migrations
echo "Applying migrations..."
npx prisma migrate deploy

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

echo ""
echo "=========================================="
echo "Database migration complete!"
echo "=========================================="
