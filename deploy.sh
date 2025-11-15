#!/bin/bash

# Fast Deployment Script for The Big Bluff to Digital Ocean Droplet
# Usage: ./deploy.sh YOUR_DROPLET_IP

if [ -z "$1" ]; then
    echo "❌ Error: Droplet IP required"
    echo "Usage: ./deploy.sh YOUR_DROPLET_IP"
    exit 1
fi

SERVER_IP="$1"
SERVER_USER="root"
REMOTE_PATH="/opt/bigbluff"

echo "🚀 Starting fast deployment to $SERVER_IP..."
echo "📍 Domain: bigbluff.btcnews.co.za"

# Step 1: Fast bulk transfer using rsync (only changed files)
echo "📁 Fast transferring files (rsync)..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='logs' --exclude='.DS_Store' \
  . $SERVER_USER@$SERVER_IP:$REMOTE_PATH/

# Step 2: SSH into server and configure + start Docker
echo "🐳 Configuring and starting Docker containers..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /opt/bigbluff

# Copy production environment
cp .env.production .env

echo "⚠️  IMPORTANT: Edit .env file with your settings:"
echo "   - Change DB_PASSWORD to a strong password"
echo "   - Add your API keys"
echo "   - Run: nano .env"
echo ""
echo "Then run: docker-compose up -d"

# Stop any existing containers
docker-compose down 2>/dev/null || true

# Build and start containers
echo "🔨 Building Docker images..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Show running containers
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend: https://bigbluff.btcnews.co.za"
echo "🔧 Backend API: https://bigbluff.btcnews.co.za/api"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file: nano /opt/bigbluff/.env"
echo "   2. Configure Nginx: See DEPLOY.md for instructions"
echo "   3. Set up SSL: sudo certbot --nginx -d bigbluff.btcnews.co.za"
echo "   4. Update DNS on GoDaddy to point to this droplet IP"
ENDSSH

echo ""
echo "🎉 Deployment script finished!"
echo "📖 For detailed setup, see DEPLOY.md"
