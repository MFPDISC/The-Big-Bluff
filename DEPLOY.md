# 🚀 Fast Deployment Guide - The Big Bluff

## Quick Transfer & Deploy to Digital Ocean Droplet

### Step 1: Prepare Your Droplet

```bash
# SSH into your new droplet
ssh root@YOUR_DROPLET_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Create app directory
sudo mkdir -p /opt/bigbluff
sudo chown $USER:$USER /opt/bigbluff
```

### Step 2: Fast Bulk Transfer (From Your Local Machine)

```bash
# Navigate to parent directory
cd /Users/on-set/Local-Coding-Repo

# Transfer entire folder using rsync (FAST - only transfers changed files)
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='logs' \
  "The Big Bluff/" root@YOUR_DROPLET_IP:/opt/bigbluff/

# Or use tar for one-shot transfer (also fast)
tar --exclude='node_modules' --exclude='.git' --exclude='logs' \
  -czf bigbluff.tar.gz "The Big Bluff/"
scp bigbluff.tar.gz root@YOUR_DROPLET_IP:/opt/
ssh root@YOUR_DROPLET_IP "cd /opt && tar -xzf bigbluff.tar.gz && mv 'The Big Bluff'/* bigbluff/ && rm -rf 'The Big Bluff' bigbluff.tar.gz"
```

### Step 3: Configure Environment on Droplet

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Navigate to app
cd /opt/bigbluff

# Copy production env file
cp .env.production .env

# Edit with your strong password and API keys
nano .env
# Change:
# - DB_PASSWORD to a strong password
# - DATABASE_URL password to match
# - Add your API keys (Alpha Vantage, FRED, etc.)
```

### Step 4: Configure Nginx Reverse Proxy

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/bigbluff.btcnews.co.za > /dev/null <<EOF
upstream bigbluff_backend {
    server localhost:5000;
}

upstream bigbluff_frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name bigbluff.btcnews.co.za;
    
    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bigbluff.btcnews.co.za;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/bigbluff.btcnews.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bigbluff.btcnews.co.za/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        proxy_pass http://bigbluff_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://bigbluff_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://bigbluff_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/bigbluff.btcnews.co.za /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Get SSL Certificate

```bash
# Run certbot
sudo certbot --nginx -d bigbluff.btcnews.co.za

# Auto-renewal (already enabled by default)
sudo systemctl enable certbot.timer
```

### Step 6: Configure DNS on GoDaddy

1. Go to GoDaddy DNS settings
2. Add A record:
   - **Name**: `bigbluff`
   - **Type**: A
   - **Value**: Your droplet IP
   - **TTL**: 600

Or add CNAME:
   - **Name**: `bigbluff`
   - **Type**: CNAME
   - **Value**: `btcnews.co.za`

### Step 7: Start Docker Containers

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP
cd /opt/bigbluff

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 8: Initialize Database

```bash
# Run database setup
docker-compose exec backend npm run setup-db

# Seed initial data
docker-compose exec backend npm run seed
```

## 📊 Monitoring & Maintenance

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend
docker-compose restart frontend

# Stop all
docker-compose down

# Update (after pulling new code)
docker-compose down
docker-compose up -d --build
```

## 🔒 Security Checklist

- [ ] Changed DB_PASSWORD in .env
- [ ] Added API keys to .env
- [ ] SSL certificate installed
- [ ] Nginx security headers configured
- [ ] Firewall rules configured (only 80, 443 open)
- [ ] Regular backups enabled

## 🆘 Troubleshooting

**Port 80/443 already in use:**
```bash
sudo lsof -i :80
sudo lsof -i :443
```

**Docker permission denied:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Database connection error:**
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U postgres -d biglie_db
```

**Check if domain is resolving:**
```bash
nslookup bigbluff.btcnews.co.za
```

---

**Total deployment time: ~15-20 minutes**
