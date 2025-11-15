# ⚡ Quick Start - Deploy to bigbluff.btcnews.co.za

## One-Command Deployment

```bash
# From your local machine, in The Big Bluff folder
chmod +x deploy.sh
./deploy.sh YOUR_DROPLET_IP
```

Replace `YOUR_DROPLET_IP` with your actual Digital Ocean droplet IP.

## What This Does

1. **Fast Transfer** - Uses rsync to transfer only changed files (excludes node_modules, .git, logs)
2. **Auto Setup** - Copies production environment file
3. **Docker Build** - Builds and starts all containers
4. **Health Check** - Verifies containers are running

## After Deployment

### 1. Configure Environment (On Droplet)

```bash
ssh root@YOUR_DROPLET_IP
nano /opt/bigbluff/.env

# Change these:
DB_PASSWORD=CHANGE_ME_TO_STRONG_PASSWORD
DATABASE_URL=postgresql://postgres:CHANGE_ME_TO_STRONG_PASSWORD@postgres:5432/biglie_db

# Add your API keys:
ALPHA_VANTAGE_KEY=your_key
FRED_API_KEY=your_key
```

### 2. Set Up Nginx & SSL (On Droplet)

```bash
# Copy the Nginx config from DEPLOY.md
# Then run:
sudo certbot --nginx -d bigbluff.btcnews.co.za
```

### 3. Update DNS on GoDaddy

- Add A record: `bigbluff` → Your droplet IP
- Wait 5-10 minutes for DNS to propagate

### 4. Access Your App

```
https://bigbluff.btcnews.co.za
```

## Files Created

- **docker-compose.yml** - Updated with production settings
- **.env.production** - Production environment template
- **deploy.sh** - One-command deployment script
- **DEPLOY.md** - Detailed deployment guide
- **QUICK_START.md** - This file

## Troubleshooting

**Check container status:**
```bash
ssh root@YOUR_DROPLET_IP
cd /opt/bigbluff
docker-compose ps
docker-compose logs -f backend
```

**Restart containers:**
```bash
docker-compose restart
```

**View real-time logs:**
```bash
docker-compose logs -f
```

---

**Total time: ~5 minutes for transfer + 10 minutes for setup = 15 minutes total**
