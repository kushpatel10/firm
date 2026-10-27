# Firm — Multi-Tenant Business Management Platform & Zero-Knowledge Encrypted Cloud Backup Engine

> **End-Term Software Engineering Project Submission**  
> **Official Submission Form:** [Google Form Link](https://forms.gle/sBy4sfqyiRG2Zpom9)  
> **Submission Deadline:** 27 October 2026, 11:59 PM IST

---

## 📋 Submission Information

| Field | Details |
|---|---|
| **Project Name** | **Firm — Multi-Tenant Business Management Platform** |
| **Student Name** | *[Insert Your Full Name]* |
| **Problem Statement** | Scalable multi-tenant business operations (sales, procurement, inventory, multi-branch) combined with true zero-knowledge, cryptographically hardened (Argon2id + AES-256-GCM) cloud backups and atomic dry-run restoration. |
| **GitHub Repository** | *[Insert Your Accessible GitHub Repo Link]* |
| **Deployed Application / Build** | *[Insert Your Live Deployment URL / Cloudflare Tunnel / VPS Hostname / APK Download]* |
| **Demo Video** | *[Insert Accessible Video Link — Google Drive (Public) or YouTube (Unlisted)]* |
| **Tech Stack** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, shadcn/ui, Node.js / Express 5, Prisma ORM 6, PostgreSQL, Capacitor 8 (Android), Argon2id, AES-256-GCM, Google Drive API, PM2. |
| **Major Features** | Strict Multi-Tenant Data Isolation, Granular Role-Based Access Control (`Module.Action`), Point-in-Sale Invoicing (Paku/Kachu GST Engine) with Auto-Inventory Sync, Procurement & Supplier Ledger, Zero-Knowledge Google Drive Backup with Advisory Locking & 2-Phase Atomic Restore, Omni-Scale Engineering Dimensioning Calculator, and Mobile Client wrapper. |

---

## 1. Problem Statement

Small-to-medium enterprises (SMEs), trading houses, and manufacturing firms face two critical operational bottlenecks:

1. **Fragmented, Inflexible Business Operations:** Traditional business software either forces generic single-tenant installations or expensive enterprise ERPs that lack flexibility for multi-branch operations, tiered credit tracking, and dual-mode billing workflows (e.g., standard tax invoices vs. delivery challans and preliminary vouchers).
2. **Catastrophic Cloud Backup Vulnerabilities:** Most SaaS platforms either store sensitive financial data in plaintext cloud backups or use weak derivation methods (like single-iteration PBKDF2), exposing businesses to insider data leaks, credential interception, and offline GPU brute-force attacks. Furthermore, naive backup solutions use incremental chains that permanently corrupt data if any link in the chain is broken or desynchronized.

---

## 2. Target Users

- **Business Owners & Managing Directors:** Need bird's-eye visibility over multiple firms and branches, daily sales metrics, expense allocations, and absolute assurance that business turnover figures remain cryptographically private.
- **Accountants & Branch Managers:** Require rapid voucher generation, automated customer and supplier ledgers, credit tracking, inventory balance alerts, and delivery challan dispatches.
- **Cashiers & Sales Executives:** Need low-latency, resilient invoice entry with automatic GST calculations, unit conversions, and multi-format item pricing.
- **System Administrators (Super Admin):** Require cross-tenant governance, firm onboarding, audit trails, and automated, collision-free background backup scheduling.

---

## 3. The Solution

**Firm** is an end-to-end, multi-tenant enterprise resource planning (ERP) platform designed around two foundational pillars:
1. **High-Velocity Business Operations:** A unified interface for managing multiple branches, customers, suppliers, inventory items, delivery challans, and double-entry transaction ledgers with strict role-based access control.
2. **True Zero-Knowledge Encrypted Backup Engine:** A point-in-time snapshot engine that derives 256-bit symmetric encryption keys directly on the server in-memory using **Argon2id** and seals full business states with **AES-256-GCM**. Passphrases and encryption keys are **never stored** in the database. Backups upload directly to the tenant's own isolated Google Drive folder with PostgreSQL advisory locks preventing concurrent snapshot corruption.

---

## 4. Key Features & Core Workflows

### 🔄 Workflow 1: Multi-Tenant Hierarchy & Granular RBAC
- **Tenant Isolation:** Every firm operates as an isolated tenant. All queries in Prisma are scoped through `firmId` verified via signed JWT tokens.
- **Granular Permissions:** Over 20+ fine-grained permissions follow the `Module.Action` convention (e.g., `Sales.Create`, `Sales.Edit`, `Inventory.Manage`, `Reports.View`).
- **Dynamic Permission Gating:** Frontend `<PermissionGate>` components conditionally render UI elements, and backend middleware strictly validates rights prior to executing mutations.

### 💰 Workflow 2: Sales & Invoicing Lifecycle with Real-Time Reconciliation
- **Dual Invoice Generation:** Supports both standard tax invoices (**PAKU** / `INV-XXXX`) and internal delivery vouchers (**KACHU** / `KCH-XXXX`) with auto-incrementing sequential counters per firm.
- **Item Pricing & Formulas:** Supports variable dimensions, calculated area/volume formulas, rates, discounts, and GST tax profiles.
- **Automatic Inventory & Ledger Sync:** Confirming a sale automatically deducts warehouse stock and credits the customer's outstanding balance ledger.

### 📦 Workflow 3: Procurement & Supplier Inventory Replenishment
- **Purchase Recording:** Log purchase bills with supplier invoice numbers, itemized purchase prices, and incoming quantities.
- **Real-Time Stock Updates:** Incoming shipments automatically increment branch-level inventory items and recalculate unit cost averages.
- **Accounts Payable Ledger:** Tracks payments made, pending credits, and historical purchase trends.

### 🔐 Workflow 4: Zero-Knowledge Google Drive Backup & Two-Phase Atomic Restore
- **Self-Contained Point-in-Time Snapshots (`.firmbak` v2):** Encapsulates entire firm state (customers, suppliers, categories, items, sales, purchases, expenses, delivery challans) in a single compressed JSON snapshot.
- **Argon2id + AES-256-GCM:** 64 MB memory cost, 3 iterations, and 4 lanes protect against GPU/ASIC brute forcing. Outer envelope leaks zero business metadata.
- **PostgreSQL Advisory Locks:** Scheduled backups use `pg_try_advisory_xact_lock` to ensure only one backup process executes per firm, eliminating race conditions.
- **Two-Phase Restore Engine:**
  1. *Phase 1 (Inspection & Dry-Run):* Decrypts in-memory, verifies schema version, runs structural integrity checks, and previews record counts without writing to the database.
  2. *Phase 2 (Atomic Restore):* Executes inside a single PostgreSQL transaction (`REPEATABLE READ`), remapping foreign keys and rolling back entirely upon any error.

### 📐 Workflow 5: Omni-Scale Engineering & Material Estimation
- Built-in dimensional scale conversion engine (1:1 to 1:500, architectural, automotive, dollhouse).
- Timber, lumber, sheet metal, and area calculators directly integrated for industrial quoting and on-the-fly billing.

---

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                               │
│      Next.js 16 (App Router, Turbopack) + React 19 + shadcn/ui           │
│                                                                          │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │   Auth & Onboarding   │  │ Multi-Tenant ERP  │  │ Omni-Scale Tool  │  │
│  │ (Google OAuth + RBAC) │  │ (Sales/Inv/Purch) │  │  (Engineering)   │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └────────┬─────────┘  │
│              │                        │                     │            │
│              └────────────────────────┼─────────────────────┘            │
│                                       │ HTTP / Secure Cookies            │
└───────────────────────────────────────┼──────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼──────────────────────────────────┐
│                      Reverse Proxy & Edge Network                        │
│          Cloudflare Tunnel / Tailscale Funnel / Helmet / CORS            │
└───────────────────────────────────────┬──────────────────────────────────┘
                                        │ Forwarded Headers (Client IP)
┌───────────────────────────────────────▼──────────────────────────────────┐
│                           API Backend Layer                              │
│                    Express.js 5 + Node.js (PM2 Daemon)                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: Rate Limiting, Compression, Auth & Tenant Guard       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────┐  ┌────────────────────┐  ┌───────────────────┐    │
│  │  CRUD Controllers │  │  Zero-Knowledge    │  │ Automated Daily   │    │
│  │  & Service Layer  │  │  Backup Engine     │  │ Scheduler (Cron)  │    │
│  │  (Sales/Purch/Inv)│  │ (Argon2id+AES-GCM) │  │ (Advisory Locks)  │    │
│  └─────────┬─────────┘  └──────────┬─────────┘  └─────────┬─────────┘    │
│            │                       │                      │              │
│            └───────────────────────┼──────────────────────┘              │
│                                    │                                     │
│                            ┌───────▼────────┐                            │
│                            │   Prisma ORM   │                            │
│                            └───────┬────────┘                            │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             │                                               │
             ▼                                               ▼
┌─────────────────────────┐                     ┌──────────────────────────┐
│   PostgreSQL Database   │                     │  Google Drive API (v3)   │
│  (Tenant-Isolated Data  │                     │   (Encrypted .firmbak    │
│   + Advisory Locks)     │                     │     Snapshot Storage)    │
└─────────────────────────┘                     └──────────────────────────┘
```

---

## 6. Technology Stack

### Frontend
- **Framework:** Next.js 16.2 (App Router with Turbopack)
- **UI Library:** React 19, Tailwind CSS v4, `@tailwindcss/postcss`
- **Components:** shadcn/ui, Radix / Base UI, Lucide Icons, Sonner toasts
- **Mobile Runtime:** Capacitor 8 (Android build with system insets handling)

### Backend API
- **Runtime:** Node.js (v20+ LTS)
- **Framework:** Express.js 5.2
- **Process Manager:** PM2 (Cluster / Fork mode with persistent startup)
- **ORM:** Prisma ORM 6.19
- **Authentication:** Google Auth Library (`google-auth-library`), JWT (`jsonwebtoken`)
- **Cryptography:** `argon2` (Argon2id KDF), Node.js native `crypto` (AES-256-GCM)
- **Background Jobs:** `node-cron` with transactional database locking

### Database & Storage
- **Primary Database:** PostgreSQL 15+
- **Cloud Backup Target:** Google Drive REST API v3 (`googleapis`)
- **File Uploads:** Multer (in-memory buffer processing)

---

## 7. Security & Engineering Decisions

1. **Zero Password Storage for Backups:**
   Backup passphrases are never persisted to disk or the database. AES-256-GCM's 16-byte authentication tag acts as a mathematical guarantee of correctness: invalid passphrases fail immediately during decryption with zero data parsed.
2. **Argon2id Password Hashing:**
   Unlike vulnerable single-iteration PBKDF2 implementations, Argon2id allocates 64 MB of RAM and 3 iterations, eliminating GPU/ASIC offline dictionary attacks.
3. **Outer Envelope Privacy:**
   `.firmbak` files expose zero unencrypted business metadata. Firm name, sales turnover, customer count, and creation dates are stored inside the encrypted ciphertext.
4. **Advisory Locking for Race Conditions:**
   Automated background schedulers acquire `pg_try_advisory_xact_lock` before triggering a snapshot, guaranteeing idempotency across clustered servers.
5. **Reverse Proxy & Trust Proxy Compliance:**
   Configured with Helmet, Express Rate Limiter, and Cloudflare/Tailscale connecting IP extractors (`cf-connecting-ip`, `x-real-ip`).

---

## 8. Database Schema Overview

The database leverages 15+ interconnected relational models:
- **`Firm`**: Tenant entity with GST, currency, timezone, and business configuration.
- **`Branch`**: Physical locations and retail outlets under a firm.
- **`User` & `UserFirm`**: Cross-tenant users with per-firm role assignments.
- **`Role` & `RolePermission`**: Granular role-to-permission mapping.
- **`Customer` & `Supplier`**: Entities with contact details, GSTN, and running balance ledgers.
- **`Category` & `InventoryItem`**: Product catalog with SKU, barcode, unit, and branch-level stock tracking.
- **`Sale` & `SaleItem`**: Invoices with discount, tax, subtotal, payment type, and dimensions.
- **`Purchase` & `PurchaseItem`**: Procurement bills updating inventory and payables.
- **`Expense`**: Operating expense tracking by category.
- **`DeliveryChallan`**: Dispatch notes with vehicle and driver tracking.
- **`FirmBackupConfig` & `BackupHistory`**: Encrypted OAuth refresh tokens, scheduled backup timing, and audit logs.
- **`ActivityLog`**: Immutable audit logs of all user actions.

---

## 9. Error Handling & Edge Cases

- **Decryption Failures:** Catches GCM authTag mismatches cleanly and warns users without exposing server stack traces.
- **Schema Migration on Restore:** Automatic schema version check against the target database with migration hooks for legacy backup snapshots.
- **Transactional Rollback:** All multi-entity creations (Sales + Items, Purchases + Stock, Two-Phase Restores) run within Prisma `$transaction` blocks. If any step fails, the entire transaction rolls back.
- **Database Connection Retries:** Graceful error handling for database drops and Google Drive token expiration (`AUTH_EXPIRED` status tracking).

---

## 10. Local Setup & Development

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 15+ running locally or in Docker
- npm package manager

### Step-by-Step Installation

```bash
# 1. Clone repository
git clone <your-repository-url>
cd Firm

# 2. Install all dependencies (Root, Backend, Frontend, Database)
npm run install:all

# 3. Configure Environment Variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret

# 4. Generate Prisma Client & Push Database Schema
npm run db:generate
npm run db:push

# 5. Seed Initial Data (Super Admin, Default Roles & Permissions)
npm run db:seed

# 6. Start Development Servers (Backend on :4000, Frontend on :3000)
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 11. Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `PUBLIC_URL` | Public base URL of the deployment | `http://localhost:3000` |
| `PORT` | Backend server port | `4000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/firm_db` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | *Random 64-char string* |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | *Private Server Secret* |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL | `http://localhost:3000/callback` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `BACKEND_INTERNAL_URL` | Internal proxy target for Next.js API | `http://127.0.0.1:4000/api` |
| `SUPER_ADMIN_EMAIL` | Email granted global super-admin rights | `admin@example.com` |

---

## 12. Production Deployment Guide

### Running 24/7 with PM2 on a VPS
```bash
# Start backend and frontend via PM2 ecosystem configuration
pm2 start ecosystem.config.cjs

# Enable persistent auto-start across system reboots
pm2 startup
pm2 save

# Monitor logs
pm2 logs
```

### Public Access via Cloudflare Tunnel / Tailscale Funnel
```bash
# Run local Cloudflare Tunnel script
npm run tunnel
```

### Android Mobile Client Build (Capacitor)
```bash
# Build frontend and sync Android assets
npm run cap:build

# Open project in Android Studio to build APK
npm run cap:open
# Pre-built debug APK is available in repository root: Calculator-debug.apk
```

---

## 13. Project Structure

```
Firm/
├── backend/                  # Express.js REST API
│   ├── src/
│   │   ├── config/           # Database, environment, and OAuth config
│   │   ├── middleware/       # Auth, RBAC, tenant isolation, activity logging
│   │   ├── routes/           # REST routes for all modules
│   │   ├── services/         # Business logic (Sales, Backup, Scheduler, Drive)
│   │   ├── utils/            # Argon2id crypto, errors, responses
│   │   └── server.js         # Entry point & middleware pipeline
│   └── package.json
├── frontend/                 # Next.js 16 Web & Mobile Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router (Auth, Admin, Dashboard)
│   │   │   ├── admin/        # Super Admin portal (Firms, Users, Roles)
│   │   │   ├── dashboard/    # Firm modules (Sales, Inventory, Backup, etc.)
│   │   │   └── (auth)/       # Google OAuth callback & login
│   │   ├── components/       # shadcn/ui components & custom widgets
│   │   ├── contexts/         # Authentication and tenant state
│   │   └── services/         # Client-side API service connectors
│   ├── capacitor.config.json # Capacitor mobile configuration
│   └── package.json
├── database/                 # Prisma ORM & Database migrations
│   ├── prisma/
│   │   ├── schema.prisma     # 15+ Multi-tenant models
│   │   └── seed.js           # Default seed script
│   └── package.json
├── docs/                     # Technical specifications & guides
├── scripts/                  # Cloudflare tunnel & automation scripts
├── ecosystem.config.cjs      # PM2 24/7 process configuration
├── Calculator-debug.apk      # Compiled Android application build
├── IMPLEMENTATION.md         # Cryptographic backup blueprint
└── README.md                 # Primary project documentation
```

---

## 14. Verification & Testing Matrix

| Component | Test / Verification Method | Expected Result |
|---|---|---|
| **Tenant Isolation** | Query firm data using valid JWT for Firm B on Firm A's route | HTTP 403 Forbidden / Data Scoped to Firm B |
| **RBAC Enforcement** | Perform sale deletion without `Sales.Delete` permission | HTTP 403 Forbidden with exact missing permission |
| **Argon2id Encryption** | Export `.firmbak` file and attempt decryption with wrong passphrase | Immediate AES-256-GCM authentication tag error; zero data leaked |
| **Atomic Restore** | Restore backup file with simulated mid-transaction corruption | Entire transaction rolls back; database state untouched |
| **Scheduler Concurrency** | Trigger concurrent backup runs simultaneously | PostgreSQL advisory lock allows first process; second returns gracefully |
