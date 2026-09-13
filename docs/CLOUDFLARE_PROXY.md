# Cloudflare Proxy & Tunnel Guide

This guide explains how to proxy the entire **Firm** platform (Web & Mobile) using Cloudflare so that anyone can securely access it from anywhere in the world over HTTPS.

---

## 🚀 1. Quick Start (Instant Free HTTPS Tunnel)

No account or DNS setup required. Cloudflare creates an encrypted public HTTPS URL directly to your running instance.

### Option A: Run Everything Together (Backend + Frontend + Cloudflare Tunnel)
```bash
npm run dev:tunnel
```

### Option B: Start Tunnel for an Already Running Instance
If `npm run dev` is already running:
```bash
npm run tunnel
```

Once launched, Cloudflare will display your public URL in the terminal, for example:
```
https://random-words-1234.trycloudflare.com
```

You can open this URL from **any smartphone, tablet, or PC** on cellular data or outside networks!

---

## ⚙️ 2. How the Unified Cloudflare Proxy Works

The application uses an integrated **Single-Origin Reverse Proxy Architecture**:

```
[ Remote Mobile / Web User ]
            │ (HTTPS)
            ▼
[ Cloudflare Edge Tunnel ] ──▶ https://your-tunnel.trycloudflare.com
            │
            ▼
[ Next.js Frontend (Port 3000) ]
     ├── Web UI Pages (`/`, `/firm/*`, etc.)
     └── Automatic API Rewrite Proxy:
            `/api/*` ──▶ [ Express Backend (Port 4000) ]
```

### Key Technical Benefits:
1. **Single Public URL**: You only need one Cloudflare tunnel pointing to port `3000`. Next.js handles proxying all backend `/api/*` endpoints to Express on port `4000`.
2. **Zero CORS / Mixed-Content Issues**: Both the frontend HTML and API calls share the exact same HTTPS origin.
3. **Full Native Mobile Support**: Android/iOS devices connecting via mobile browser or Capacitor PWA automatically route API traffic through the Cloudflare proxy.
4. **Trust Proxy Enabled**: Express server (`backend/src/server.js`) is configured with `app.set("trust proxy", true)` to accurately read `CF-Connecting-IP` and `X-Forwarded-Proto` for audit logs and rate-limiting.

---

## 🔒 3. Using a Custom Cloudflare Domain (Named Tunnel)

If you own a domain on Cloudflare (e.g., `app.yourdomain.com`):

1. **Install cloudflared CLI**:
   ```bash
   npm install -g cloudflared
   ```

2. **Login to Cloudflare**:
   ```bash
   cloudflared tunnel login
   ```

3. **Create a Tunnel**:
   ```bash
   cloudflared tunnel create firm-tunnel
   ```

4. **Route DNS to your tunnel**:
   ```bash
   cloudflared tunnel route dns firm-tunnel app.yourdomain.com
   ```

5. **Run your named tunnel**:
   ```bash
   cloudflared tunnel run --url http://localhost:3000 firm-tunnel
   ```
