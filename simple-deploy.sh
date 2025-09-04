#!/bin/bash

# Simple deployment without nginx (if you just want the basic setup)
set -e

echo "🚀 Simple deployment of Chat App..."

# Build and run the container directly
docker build -t disposable-chat .
docker stop disposable-chat-container 2>/dev/null || true
docker rm disposable-chat-container 2>/dev/null || true

docker run -d \
  --name disposable-chat-container \
  -p 3000:3000 \
  --restart unless-stopped \
  disposable-chat

echo "✅ Chat app is running on:"
echo "   - External: http://$(curl -s ifconfig.me):3000"
echo "   - Local: http://localhost:3000"