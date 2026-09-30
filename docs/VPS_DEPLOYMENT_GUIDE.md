# Firm Platform — 24/7 VPS Deployment Guide

Complete step-by-step guide to deploying and running the **Firm** platform 24/7 on an Ubuntu/Debian Linux VPS using **PM2**, **PostgreSQL**, and either **Cloudflare Tunnel** or **Nginx + Let's Encrypt SSL**.

---

## 🏛️ Architecture on VPS

```
Internet (HTTPS)
      │
      ▼
[ Cloudflare Tunnel OR Nginx (Port 443 SSL) ]
      │
      ▼ (Port 3000)
[ Next.js Frontend (PM2) ]
      │
      ├── UI Pages & Static Assets
      │
      └── Proxy Rewrites (/api/*) ──▶ [ Express API (Port 4000) (PM2) ]
                                                │
                                                ▼ (Port 5432)
                                      [ PostgreSQL Database ]
```

- **Process Manager (PM2)**: Keeps both the backend and frontend alive 24/7, restarts them immediately if they crash, and re-launches them automatically if the VPS reboots.
- **Port 3000**: Next.js frontend handles public requests and internally proxies `/api/*` to port 4000.
- **Port 4000**: Express API server (accessible locally).
- **Port 5432**: PostgreSQL server (accessible locally only).

---

## 📋 Recommended VPS Specs
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- **RAM**: Minimum 1 GB (with swap enabled) / 2 GB+ recommended
- **CPU**: 1–2 vCPUs
- **Disk**: 20 GB+ SSD

---

## Step 1: Server Setup & Swap File (Essential for 1GB VPS)

SSH into your VPS as `root` or a sudo user:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw build-essential
```

Next.js build (`npm run build`) can use around 1 GB of memory. If your VPS has 1 GB or 2 GB RAM, enable a 2 GB swap file to prevent Out-Of-Memory (OOM) errors:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 2: Install Node.js v20 (LTS) & PM2

```bash
# Install Node.js 20 LTS from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should be v20.x.x
npm -v

# Install PM2 globally
sudo npm install -g pm2
```

---

## Step 3: Install & Configure PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create Database and User
sudo -u postgres psql
```

Inside the PostgreSQL prompt (`postgres=#`), run:

```sql
CREATE DATABASE firm_db;
CREATE USER firm_user WITH ENCRYPTED PASSWORD 'ReplaceWithStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE firm_db TO firm_user;
ALTER DATABASE firm_db OWNER TO firm_user;
\q
```

---

## Step 4: Clone the Project & Setup Environment

```bash
# Recommended deployment location
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# Clone repository
git clone <YOUR_GIT_REPO_URL> firm
cd firm

# Create environment configuration from template
cp .env.example .env
cp .env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Now edit `.env` (and `backend/.env`, `frontend/.env.local`):

```bash
nano .env
```

Ensure the following variables are set:
```env
PUBLIC_URL=https://app.yourdomain.com
PORT=4000
NODE_ENV=production

# PostgreSQL connection string
DATABASE_URL="postgresql://firm_user:ReplaceWithStrongPassword123!@localhost:5432/firm_db"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-random-32-char-secret-key-here
JWT_EXPIRES_IN=7d

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://app.yourdomain.com/callback
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://app.yourdomain.com/callback

FRONTEND_URL=https://app.yourdomain.com
BACKEND_INTERNAL_URL=http://127.0.0.1:4000/api

SUPER_ADMIN_EMAIL=admin@yourcompany.com
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin@yourcompany.com
NEXT_PUBLIC_DEV_AUTH_BYPASS=false
```

---

## Step 5: Install Dependencies, Migrate Database & Build

Run the automated installation and build commands:

```bash
# 1. Install all dependencies (backend, frontend, database)
npm run install:all

# 2. Generate Prisma Client
npm run db:generate

# 3. Apply schema to PostgreSQL database
npm run db:push

# 4. Seed database (permissions, default roles, super admin)
npm run db:seed

# 5. Build Next.js production bundle
npm run build
```

---

## Step 6: Start 24/7 with PM2

Use the pre-configured [ecosystem.config.cjs](../ecosystem.config.cjs):

```bash
# Start backend and frontend services
pm2 start ecosystem.config.cjs

# Verify both services are online
pm2 status
```

### Enable Auto-Restart on VPS Reboot:
```bash
# Generate and execute startup hook for systemd
pm2 startup

# (Copy and paste the sudo command shown in your terminal if prompted)

# Save the current PM2 process list
pm2 save
```
> Both `firm-backend` and `firm-frontend` will now start automatically whenever your VPS boots up or restarts.

---

## Step 7: Expose to the Internet with HTTPS

Choose **Option A** (easiest & most secure) or **Option B** (standard Nginx).

### Option A: Cloudflare Tunnel (Recommended — No open ports, free SSL)

1. In your Cloudflare Dashboard:
   - Go to **Zero Trust** ➔ **Networks** ➔ **Tunnels**.
   - Click **Create a Tunnel** (named e.g. `firm-vps`).
   - Choose your OS (Debian/Ubuntu 64-bit) and copy the tunnel token.
   - Set the Public Hostname:
     - Domain: `app.yourdomain.com`
     - Service: `HTTP` ➔ `127.0.0.1:3000`
2. On your VPS, install and run `cloudflared`:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
   ```
3. That's it! Your app is now live at `https://app.yourdomain.com` with zero open firewall ports.

---

### Option B: Nginx + Let's Encrypt SSL (Standard Custom Domain)

1. Configure firewall:
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. Install Nginx and Certbot:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. Copy the Nginx configuration:
   ```bash
   sudo cp scripts/nginx-firm.conf /etc/nginx/sites-available/firm
   ```

4. Edit the domain name in the config:
   ```bash
   sudo nano /etc/nginx/sites-available/firm
   # Replace 'your-domain.com' with your actual domain
   ```

5. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/firm /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. Obtain a free SSL certificate with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```
   Certbot will automatically install the certificate and configure auto-renewal.

---

## 🛠️ Daily Management & Cheat Sheet

| Task | Command |
|---|---|
| View real-time logs | `pm2 logs` or `npm run pm2:logs` |
| View backend logs only | `pm2 logs firm-backend` |
| View frontend logs only | `pm2 logs firm-frontend` |
| Check service health | `pm2 status` |
| Restart all services | `pm2 restart ecosystem.config.cjs` |
| Deploy git updates | `bash scripts/deploy.sh` |
| Test API health directly | `curl http://127.0.0.1:4000/api/health` |
| Backup database | `pg_dump -U firm_user -d firm_db > backup_$(date +%F).sql` |
