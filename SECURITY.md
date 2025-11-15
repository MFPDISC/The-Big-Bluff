# 🔐 Security Guide - The Big Bluff Dashboard

## 🚨 CRITICAL: Before Going Public

### ⚠️ **URGENT: API Keys Were Exposed in .env.example**

**IMMEDIATE ACTION REQUIRED**:
Your real API keys were in `.env.example` file! This means they might be visible in Git history.

**Check if keys were committed**:
```bash
cd "/Users/on-set/Local-Coding-Repo/The Big Bluff"
git log --all --full-history -- .env.example
git log --all --full-history -- .env
```

**If you see output showing commits with your keys**:
1. **Regenerate ALL API keys immediately**:
   - Alpha Vantage: https://www.alphavantage.co/support/#api-key
   - FRED API: https://fred.stlouisfed.org/docs/api/api_key.html

2. **Remove from Git history**:
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.example" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## ✅ Security Measures Applied

### 1. **Rate Limiting** ✅
- **General API**: 100 requests per 15 minutes per IP
- **Expensive endpoints**: 30 requests per 15 minutes per IP
- **Protection against**: DDoS, brute force, API scraping

### 2. **Environment Variables** ✅
- `.env` is in `.gitignore`
- `.env.example` cleaned of real keys
- Production-ready template provided

### 3. **CORS Protection** ✅
- Configured for specific domains only
- Prevents unauthorized cross-origin requests

### 4. **Security Headers** ✅
- Helmet.js enabled for security headers
- XSS protection, content type sniffing prevention

---

## 🗄️ Database Security

### **Current Status**: ⚠️ NEEDS ATTENTION
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/biglie_db
```

**Problems**:
- Username: `postgres` (default, easily guessed)
- Password: `password` (extremely weak)
- No SSL encryption

### **Production Database Setup**

#### **Option A: Managed Database** (RECOMMENDED)
Use a hosted service for automatic security:

**Railway.app** (Free tier):
```bash
# 1. Sign up at railway.app
# 2. Create new project
# 3. Add PostgreSQL service
# 4. Copy connection string to .env
DATABASE_URL=postgresql://user:complex_pass@region.railway.app:5432/railway
```

**Supabase** (PostgreSQL + extras):
```bash
# 1. Sign up at supabase.com
# 2. Create new project
# 3. Go to Settings > Database
# 4. Copy connection string
DATABASE_URL=postgresql://postgres:[password]@db.region.supabase.co:5432/postgres
```

#### **Option B: Secure Self-Hosted Database**

**Step 1: Create Strong Credentials**
```bash
# Generate 32-character password
openssl rand -base64 32
# Example: kX9mP2nQ8rL4sT6vU0wY1zA3bC5dE7fG
```

**Step 2: Create Production User**
```sql
-- Connect as admin
psql -U postgres

-- Create secure user
CREATE USER biglie_prod WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE biglie_production;

-- Grant minimal permissions
GRANT CONNECT ON DATABASE biglie_production TO biglie_prod;
GRANT USAGE ON SCHEMA public TO biglie_prod;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO biglie_prod;

-- Remove dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

**Step 3: Enable SSL**
Edit `/etc/postgresql/*/main/postgresql.conf`:
```conf
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

**Step 4: Restrict Access**
Edit `/etc/postgresql/*/main/pg_hba.conf`:
```conf
# Require SSL for network connections
hostssl biglie_production biglie_prod 0.0.0.0/0 md5

# Local connections only for admin
local   all             postgres                peer
```

---

## 🔐 Redis Security

### **Current Status**: ⚠️ NO PASSWORD
```
REDIS_URL=redis://localhost:6379
```

### **Secure Redis Setup**

**Option A: Managed Redis** (RECOMMENDED)
- **Upstash**: Free serverless Redis
- **Redis Cloud**: Free 30MB tier
- **Railway**: Add Redis service

**Option B: Self-hosted Security**
Edit `/etc/redis/redis.conf`:
```conf
# Set strong password
requirepass YOUR_STRONG_REDIS_PASSWORD

# Bind to localhost only
bind 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

Update `.env`:
```bash
REDIS_URL=redis://:YOUR_STRONG_REDIS_PASSWORD@localhost:6379
```

---

## 🌐 Production Deployment Options

### **Option A: Vercel + Railway** (EASIEST)

**Frontend (Vercel)**:
```bash
# 1. Push to GitHub
# 2. Connect Vercel to repo
# 3. Set build command: cd client && npm run build
# 4. Set output directory: client/dist
# 5. Add environment variables in Vercel dashboard
```

**Backend (Railway)**:
```bash
# 1. Connect Railway to same GitHub repo
# 2. Select server folder as root
# 3. Add PostgreSQL service
# 4. Add Redis service
# 5. Set environment variables
# 6. Deploy
```

### **Option B: DigitalOcean App Platform**
```bash
# 1. Create app from GitHub
# 2. Add database component
# 3. Configure environment variables
# 4. Enable HTTPS (automatic)
```

### **Option C: AWS/Docker** (ADVANCED)
```bash
# Use existing Dockerfile
# Deploy to AWS ECS or EC2
# Set up RDS for database
# Configure ElastiCache for Redis
```

---

## 🔒 HTTPS/SSL Setup

### **Managed Platforms** (Automatic):
- Vercel, Netlify, Railway: SSL included
- DigitalOcean App Platform: SSL included

### **Self-hosted with Let's Encrypt**:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🛡️ Additional Security Measures

### **Environment Variables in Production**
```bash
# NEVER use these in production:
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/biglie_db

# USE these instead:
NODE_ENV=production
DATABASE_URL=postgresql://secure_user:strong_pass@secure-host:5432/prod_db
```

### **CORS for Production**
```javascript
// Update server/index.js for production
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

### **Monitoring & Logging**
```bash
# Add to package.json
npm install winston morgan

# Set up error tracking
# - Sentry.io (free tier)
# - LogRocket (session replay)
# - UptimeRobot (uptime monitoring)
```

---

## 📋 Pre-Deployment Checklist

### **CRITICAL** (Must Do):
- [ ] ✅ Rate limiting enabled
- [ ] ⚠️ API keys regenerated (if exposed)
- [ ] ⚠️ Database password changed
- [ ] ⚠️ Redis password set
- [ ] ⚠️ HTTPS/SSL configured
- [ ] ✅ CORS configured for production domain
- [ ] ✅ `.env` not in Git history

### **RECOMMENDED**:
- [ ] Database backups enabled
- [ ] Error monitoring (Sentry)
- [ ] Uptime monitoring
- [ ] CDN for static assets
- [ ] DDoS protection (Cloudflare)

### **OPTIONAL**:
- [ ] Admin authentication
- [ ] Two-factor authentication
- [ ] Audit logging
- [ ] Penetration testing

---

## 🆘 Emergency Response

### **If API Keys Are Compromised**:
1. **Immediately regenerate** all API keys
2. **Check API usage** for unauthorized requests
3. **Update production** environment variables
4. **Monitor** for unusual activity

### **If Database Is Compromised**:
1. **Change all passwords** immediately
2. **Check logs** for unauthorized access
3. **Backup current data**
4. **Audit user permissions**
5. **Enable additional monitoring**

---

## 📞 Support Resources

- **OWASP Security Guide**: https://owasp.org/www-project-top-ten/
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/
- **PostgreSQL Security**: https://www.postgresql.org/docs/current/security.html
- **Let's Encrypt**: https://letsencrypt.org/getting-started/

---

**Generated**: November 10, 2025  
**Status**: Security measures applied, database security pending
