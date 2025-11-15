#!/bin/bash

# Setup script for Digital Ocean Droplet
# Installs Docker, Docker Compose, Nginx, and other dependencies

echo "🔧 Setting up Digital Ocean Droplet..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Install Node.js (for potential manual setup)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Create app directory
echo "📁 Creating app directory..."
sudo mkdir -p /opt/bigbluff
sudo chown $USER:$USER /opt/bigbluff

# Verify installations
echo ""
echo "✅ Verifying installations..."
docker --version
docker-compose --version
nginx -v
node --version
npm --version

echo ""
echo "🎉 Droplet setup complete!"
echo ""
echo "Next steps:"
echo "1. cd /opt/bigbluff"
echo "2. nano .env (edit with your API keys and strong password)"
echo "3. docker-compose up -d"
echo "4. Follow DEPLOY.md for Nginx and SSL setup"
