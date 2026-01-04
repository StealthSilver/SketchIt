#!/bin/bash

# Deployment script for SketchIt application to Vercel

set -e

echo "=========================================="
echo "SketchIt Deployment Script"
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Check git status
echo "Checking git status..."
if ! git diff-index --quiet HEAD --; then
    echo "Error: Uncommitted changes found. Please commit or stash changes."
    exit 1
fi

# Get deployment type
echo ""
echo "Select what to deploy:"
echo "1) Frontend only"
echo "2) HTTP Backend only"
echo "3) WebSocket Backend only"
echo "4) All (Frontend + HTTP Backend)"
echo "5) Exit"
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "Deploying Frontend..."
        cd apps/frontend
        vercel --prod
        ;;
    2)
        echo "Deploying HTTP Backend..."
        cd apps/http-backend
        vercel --prod
        ;;
    3)
        echo "Note: WebSocket backend should be deployed to Railway or another provider"
        echo "Instructions:"
        echo "1. Go to railway.app"
        echo "2. Create new project and connect your GitHub repo"
        echo "3. Select root directory: apps/ws-backend"
        echo "4. Add environment variables: DATABASE_URL, JWT_SECRET"
        ;;
    4)
        echo "Deploying Frontend and HTTP Backend..."
        echo "Frontend:"
        cd apps/frontend
        vercel --prod
        echo "HTTP Backend:"
        cd ../../apps/http-backend
        vercel --prod
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
