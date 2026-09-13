# Firm — Permissions Reference

## Permission Code Format

All permissions follow the `Module.Action` pattern.

## Permission Codes

| Module | View | Create | Edit | Delete | Manage |
|---|---|---|---|---|---|
| Sales | `Sales.View` | `Sales.Create` | `Sales.Edit` | `Sales.Delete` | — |
| Purchase | `Purchase.View` | `Purchase.Create` | `Purchase.Edit` | `Purchase.Delete` | — |
| Expense | `Expense.View` | `Expense.Create` | `Expense.Edit` | `Expense.Delete` | — |
| Inventory | `Inventory.View` | `Inventory.Create` | `Inventory.Edit` | `Inventory.Delete` | — |
| Customers | `Customers.View` | `Customers.Create` | `Customers.Edit` | `Customers.Delete` | — |
| Suppliers | `Suppliers.View` | `Suppliers.Create` | `Suppliers.Edit` | `Suppliers.Delete` | — |
| DeliveryChallans | `DeliveryChallans.View` | `DeliveryChallans.Create` | `DeliveryChallans.Edit` | `DeliveryChallans.Delete` | — |
| Reports | `Reports.View` | — | — | — | — |
| Settings | — | — | — | — | `Settings.Manage` |
| Users | — | — | — | — | `Users.Manage` |

## Default Role Mappings

### Owner
All permissions.

### Manager
All except `Settings.Manage`, `Users.Manage`.

### Accountant
`Sales.View`, `Sales.Create`, `Sales.Edit`, `Purchase.View`, `Purchase.Create`, `Purchase.Edit`, `Expense.View`, `Expense.Create`, `Expense.Edit`, `Reports.View`.

### Sales
`Sales.View`, `Sales.Create`, `Sales.Edit`, `Customers.View`, `Customers.Create`, `Customers.Edit`, `DeliveryChallans.View`, `DeliveryChallans.Create`, `DeliveryChallans.Edit`.

### Inventory
`Inventory.View`, `Inventory.Create`, `Inventory.Edit`, `Suppliers.View`.

### Staff
`Sales.View`, `Customers.View`, `Inventory.View`.

## Usage in Frontend

```jsx
import { PermissionGate } from '@/components/shared/permission-gate';

// Conditionally render based on permission
<PermissionGate permission="Sales.Create">
  <Button>New Sale</Button>
</PermissionGate>

// Hook usage
import { usePermission } from '@/hooks/use-permissions';
const canEdit = usePermission('Sales.Edit');
```
