# Firm — Database Schema

## Overview

PostgreSQL database managed by Prisma ORM. All entities include audit fields.

## Tables

### Core
| Table | Purpose |
|---|---|
| `Firm` | Business entities (tenants) |
| `Branch` | Physical locations within a firm |
| `User` | Platform users (Google accounts) |
| `UserFirm` | Maps users to firms with roles |

### Authorization
| Table | Purpose |
|---|---|
| `Role` | Named permission groups (system or custom) |
| `Permission` | Individual permission codes (Module.Action) |
| `RolePermission` | Junction: which permissions belong to which role |

### Audit
| Table | Purpose |
|---|---|
| `ActivityLog` | Records important user actions |

## Audit Fields

Every entity (except `ActivityLog`) includes:
- `createdAt` — Timestamp of creation
- `updatedAt` — Timestamp of last update
- `createdBy` — User ID who created
- `updatedBy` — User ID who last updated

## Multi-Tenant Isolation

Tables that are tenant-scoped include a `firmId` foreign key:
- `Branch`
- `UserFirm`
- `Role` (custom roles)
- `ActivityLog`
- Future: `Sale`, `Purchase`, `Expense`, `InventoryItem`, etc.

## Enums

- `FirmStatus`: ACTIVE, ARCHIVED, SUSPENDED
- `BranchStatus`: ACTIVE, INACTIVE, CLOSED
- `UserStatus`: ACTIVE, INACTIVE, SUSPENDED
