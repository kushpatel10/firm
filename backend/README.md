# Firm — Backend API

Express.js REST API for the Firm multi-tenant business management platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: PostgreSQL via Prisma ORM (schema in `../database/`)
- **Auth**: Google OAuth 2.0 → JWT
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client (from shared schema)
npm run prisma:generate

# 3. Create .env from template
cp .env.example .env
# Edit .env with your PostgreSQL credentials and Google OAuth keys

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed the database (permissions, roles, super admin)
npm run db:seed

# 6. Start the dev server
npm run dev
# → http://localhost:4000
```

## API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/google` | Get Google OAuth consent URL |
| POST | `/api/auth/callback` | Exchange Google auth code for JWT |
| GET | `/api/auth/session` | Validate current session |
| POST | `/api/auth/logout` | Clear session |

### Admin (Super Admin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/firms` | List all firms |
| POST | `/api/firms` | Create a firm |
| GET | `/api/firms/:id` | Get firm details |
| PUT | `/api/firms/:id` | Update a firm |
| PATCH | `/api/firms/:id/archive` | Archive a firm |
| DELETE | `/api/firms/:id` | Delete a firm |
| GET/POST/PUT/DELETE | `/api/firms/:firmId/branches` | Branch CRUD |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create a user |
| PUT | `/api/users/:id` | Update a user |
| PATCH | `/api/users/:id/deactivate` | Deactivate user |
| POST | `/api/users/:id/reassign` | Reassign user |
| GET | `/api/roles` | List roles |
| POST | `/api/roles` | Create role |
| PUT | `/api/roles/:id/permissions` | Assign permissions |
| GET | `/api/activity` | Activity logs |

### Business (Tenant-Scoped)
All routes require `firmId` and are permission-gated.

| Method | Route | Permission |
|--------|-------|-----------|
| GET/POST | `/api/firms/:firmId/sales` | Sales.View / Sales.Create |
| GET/PUT/DELETE | `/api/firms/:firmId/sales/:id` | Sales.View / Sales.Edit / Sales.Delete |
| GET/POST | `/api/firms/:firmId/purchases` | Purchase.View / Purchase.Create |
| GET/POST | `/api/firms/:firmId/expenses` | Expense.View / Expense.Create |
| GET | `/api/firms/:firmId/expenses/summary` | Expense.View |
| GET/POST | `/api/firms/:firmId/inventory` | Inventory.View / Inventory.Create |
| GET | `/api/firms/:firmId/inventory/low-stock` | Inventory.View |
| POST | `/api/firms/:firmId/inventory/:id/stock` | Inventory.Edit |
| GET/POST | `/api/firms/:firmId/customers` | Customers.View / Customers.Create |
| GET/POST | `/api/firms/:firmId/suppliers` | Suppliers.View / Suppliers.Create |
| GET/POST | `/api/firms/:firmId/delivery-challans` | DeliveryChallans.View / Create |

## Architecture

```
src/
├── config/         # Environment & database setup
├── middleware/      # Auth, tenant, permissions, activity, errors
├── services/       # Business logic (Prisma queries)
├── routes/         # Express route handlers
├── utils/          # Response helpers, error classes
└── server.js       # Entry point
```

### Middleware Pipeline

```
Request
  → helmet (security headers)
  → cors (frontend origin)
  → rate-limit (500 req/15min)
  → authenticate (JWT → user)
  → requireFirm (tenant isolation)
  → requirePermission (RBAC check)
  → logActivity (audit trail)
  → route handler
  → errorHandler (global catch)
```

### Key Design Decisions

- **CRUD Factory**: `crud-factory.js` generates standard CRUD routes for all business entities, reducing boilerplate by ~80%.
- **Tenant Isolation**: Every business query filters by `firmId` — enforced at the middleware level, not just the service level.
- **Activity Logging**: Non-blocking — logs are written after the response via `res.json` interception, so they never slow down requests.
- **Error Handling**: Custom error classes (AppError, NotFoundError, etc.) map to HTTP status codes. Prisma errors are also caught and translated.
