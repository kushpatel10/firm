# Firm — System Architecture

## Overview

Firm is a multi-tenant business management platform for managing multiple businesses, branches, users, and roles.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│              Next.js (App Router)                    │
│         Tailwind CSS + shadcn/ui                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Auth     │  │  Admin   │  │  Firm Dashboard  │  │
│  │  Pages    │  │  Panel   │  │  (Multi-tenant)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│       └──────────────┼─────────────────┘             │
│                      │                               │
│              ┌───────▼───────┐                       │
│              │ Service Layer │                       │
│              │  (API Client) │                       │
│              └───────┬───────┘                       │
└──────────────────────┼───────────────────────────────┘
                       │ HTTP (JWT Auth)
┌──────────────────────┼───────────────────────────────┐
│                Backend (Express/NestJS)               │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Auth    │  │  Tenant  │  │  Business Logic  │   │
│  │  Module  │  │  Guard   │  │  Controllers     │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       └──────────────┼─────────────────┘             │
│                      │                               │
│              ┌───────▼───────┐                       │
│              │  Prisma ORM   │                       │
│              └───────┬───────┘                       │
└──────────────────────┼───────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              │   Database      │
              └─────────────────┘
```

## Authentication Flow

1. User clicks "Sign in with Google"
2. Frontend redirects to Google OAuth consent screen
3. Google redirects back with authorization code
4. Frontend sends code to backend `/api/auth/callback`
5. Backend exchanges code for Google ID token
6. Backend checks if email exists in `User` table
7. If exists: returns JWT with user/firm/role/permissions
8. If not: returns 403 (Access Denied)
9. Frontend stores JWT, attaches to all API requests

## Multi-Tenant Isolation

- Every tenant-scoped table has a `firmId` column
- Backend middleware extracts `firmId` from JWT
- All queries are automatically filtered by `firmId`
- No firm can access another firm's data
- Super Admin has cross-tenant access

## Permission System

- Permissions follow `Module.Action` pattern (e.g., `Sales.View`, `Inventory.Edit`)
- Roles contain sets of permissions via `RolePermission` junction table
- Users are assigned roles per firm via `UserFirm` table
- Frontend uses `<PermissionGate>` component for conditional rendering
- Backend validates permissions on every request
