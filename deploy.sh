#!/bin/bash

# Deployment script for Oracle VM with existing nginx
set -e

echo "🚀 Deploying Disposable Chat App to Oracle VM..."

# Stop existing containers
echo "⏹️ Stopping existing containers..."
docker-compose down || true

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo "📱 Chat app is running on port 3001"
    echo "🌐 Add this to your nginx config for disposable.giftrilo.store"
    echo ""
    echo "🔧 To view logs: docker-compose logs -f disposable-chat"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Deployment failed!"
    docker-compose logs
    exit 1
fi