# Firm — Multi-Tenant Business Management Platform

Firm is an end-to-end multi-tenant business management platform featuring:
- **Frontend**: Next.js 16 (App Router) + Tailwind CSS + shadcn/ui
- **Backend API**: Express.js 5 + Prisma ORM
- **Database**: PostgreSQL with tenant-level isolation
- **Mobile**: Capacitor Android wrapper

---

## Quick Navigation

- [System Architecture](file:///docs/architecture.md)
- [24/7 VPS Deployment Guide](file:///docs/VPS_DEPLOYMENT_GUIDE.md)
- [Cloudflare Proxy & Tunnel Guide](file:///docs/CLOUDFLARE_PROXY.md)
- [Database Schema & Migrations](file:///docs/database.md)
- [Permissions & Roles](file:///docs/permissions.md)

---

## Local Development

```bash
# 1. Install all dependencies
npm run install:all

# 2. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 3. Start local development (Backend + Frontend)
npm run dev
```

---

## 24/7 Production on VPS

```bash
# Start with PM2
pm2 start ecosystem.config.cjs

# Make persistent across reboots
pm2 startup
pm2 save
```
See the complete [VPS Deployment Guide](file:///docs/VPS_DEPLOYMENT_GUIDE.md) for full instructions.
