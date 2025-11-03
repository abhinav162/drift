#!/bin/bash

# Deployment script for Drift Chat on Oracle VM
set -e

echo "🚀 Deploying Drift Chat App to Oracle VM..."

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
    echo "📱 Drift Chat is running on port 3150"
    echo "🌐 Available at: https://drift.abhinavaditya.com"
    echo ""
    echo "Next steps (Nginx setup and SSL generation if not already done):"
    echo "1. Copy nginx.conf to /etc/nginx/sites-available/drift.abhinavaditya.com"
    echo "2. Enable site: sudo ln -s /etc/nginx/sites-available/drift.abhinavaditya.com /etc/nginx/sites-enabled/"
    echo "3. Test nginx: sudo nginx -t"
    echo "4. Reload nginx: sudo systemctl reload nginx"
    echo "5. Generate SSL: sudo certbot --nginx -d drift.abhinavaditya.com"
    echo ""
    echo "🔧 To view logs: docker-compose logs -f drift-chat"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Deployment failed!"
    docker-compose logs
    exit 1
fi