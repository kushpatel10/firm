require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// All permission codes following Module.Action pattern
const PERMISSIONS = [
  // Sales
  { code: 'Sales.View', name: 'View Sales', module: 'Sales', action: 'View' },
  { code: 'Sales.Create', name: 'Create Sales', module: 'Sales', action: 'Create' },
  { code: 'Sales.Edit', name: 'Edit Sales', module: 'Sales', action: 'Edit' },
  { code: 'Sales.Delete', name: 'Delete Sales', module: 'Sales', action: 'Delete' },
  // Purchase
  { code: 'Purchase.View', name: 'View Purchases', module: 'Purchase', action: 'View' },
  { code: 'Purchase.Create', name: 'Create Purchases', module: 'Purchase', action: 'Create' },
  { code: 'Purchase.Edit', name: 'Edit Purchases', module: 'Purchase', action: 'Edit' },
  { code: 'Purchase.Delete', name: 'Delete Purchases', module: 'Purchase', action: 'Delete' },
  // Expense
  { code: 'Expense.View', name: 'View Expenses', module: 'Expense', action: 'View' },
  { code: 'Expense.Create', name: 'Create Expenses', module: 'Expense', action: 'Create' },
  { code: 'Expense.Edit', name: 'Edit Expenses', module: 'Expense', action: 'Edit' },
  { code: 'Expense.Delete', name: 'Delete Expenses', module: 'Expense', action: 'Delete' },
  // Inventory
  { code: 'Inventory.View', name: 'View Inventory', module: 'Inventory', action: 'View' },
  { code: 'Inventory.Create', name: 'Create Inventory', module: 'Inventory', action: 'Create' },
  { code: 'Inventory.Edit', name: 'Edit Inventory', module: 'Inventory', action: 'Edit' },
  { code: 'Inventory.Delete', name: 'Delete Inventory', module: 'Inventory', action: 'Delete' },
  // Customers
  { code: 'Customers.View', name: 'View Customers', module: 'Customers', action: 'View' },
  { code: 'Customers.Create', name: 'Create Customers', module: 'Customers', action: 'Create' },
  { code: 'Customers.Edit', name: 'Edit Customers', module: 'Customers', action: 'Edit' },
  { code: 'Customers.Delete', name: 'Delete Customers', module: 'Customers', action: 'Delete' },
  // Suppliers
  { code: 'Suppliers.View', name: 'View Suppliers', module: 'Suppliers', action: 'View' },
  { code: 'Suppliers.Create', name: 'Create Suppliers', module: 'Suppliers', action: 'Create' },
  { code: 'Suppliers.Edit', name: 'Edit Suppliers', module: 'Suppliers', action: 'Edit' },
  { code: 'Suppliers.Delete', name: 'Delete Suppliers', module: 'Suppliers', action: 'Delete' },
  // Delivery Challans
  { code: 'DeliveryChallans.View', name: 'View Delivery Challans', module: 'DeliveryChallans', action: 'View' },
  { code: 'DeliveryChallans.Create', name: 'Create Delivery Challans', module: 'DeliveryChallans', action: 'Create' },
  { code: 'DeliveryChallans.Edit', name: 'Edit Delivery Challans', module: 'DeliveryChallans', action: 'Edit' },
  { code: 'DeliveryChallans.Delete', name: 'Delete Delivery Challans', module: 'DeliveryChallans', action: 'Delete' },
  // Reports
  { code: 'Reports.View', name: 'View Reports', module: 'Reports', action: 'View' },
  // Settings
  { code: 'Settings.Manage', name: 'Manage Settings', module: 'Settings', action: 'Manage' },
  // Users
  { code: 'Users.Manage', name: 'Manage Users', module: 'Users', action: 'Manage' },
];

// Default system roles with their permission codes
const SYSTEM_ROLES = [
  {
    name: 'Owner',
    description: 'Full access to all firm features',
    permissions: PERMISSIONS.map((p) => p.code), // All permissions
  },
  {
    name: 'Manager',
    description: 'All permissions except settings and user management',
    permissions: PERMISSIONS.filter(
      (p) => p.code !== 'Settings.Manage' && p.code !== 'Users.Manage'
    ).map((p) => p.code),
  },
  {
    name: 'Accountant',
    description: 'Sales, purchases, expenses, and reports access',
    permissions: [
      'Sales.View', 'Sales.Create', 'Sales.Edit',
      'Purchase.View', 'Purchase.Create', 'Purchase.Edit',
      'Expense.View', 'Expense.Create', 'Expense.Edit',
      'Reports.View',
    ],
  },
  {
    name: 'Sales',
    description: 'Sales, customers, and delivery challans access',
    permissions: [
      'Sales.View', 'Sales.Create', 'Sales.Edit',
      'Customers.View', 'Customers.Create', 'Customers.Edit',
      'DeliveryChallans.View', 'DeliveryChallans.Create', 'DeliveryChallans.Edit',
    ],
  },
  {
    name: 'Inventory',
    description: 'Inventory management and supplier viewing',
    permissions: [
      'Inventory.View', 'Inventory.Create', 'Inventory.Edit',
      'Suppliers.View',
    ],
  },
  {
    name: 'Staff',
    description: 'View-only access to basic modules',
    permissions: [
      'Sales.View',
      'Customers.View',
      'Inventory.View',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. Seed permissions
  console.log('📋 Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module, action: perm.action },
      create: perm,
    });
  }
  console.log(`   ✅ ${PERMISSIONS.length} permissions seeded.\n`);

  // 2. Seed system roles
  console.log('🔐 Seeding system roles...');
  for (const roleDef of SYSTEM_ROLES) {
    let role = await prisma.role.findFirst({
      where: { name: roleDef.name, isSystem: true, firmId: null },
    });

    if (role) {
      role = await prisma.role.update({
        where: { id: role.id },
        data: { description: roleDef.description },
      });
    } else {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
          firmId: null,
        },
      });
    }

    // Assign permissions to role
    const permissions = await prisma.permission.findMany({
      where: { code: { in: roleDef.permissions } },
    });

    for (const perm of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }

    console.log(`   ✅ Role "${roleDef.name}" with ${roleDef.permissions.length} permissions.`);
  }

  // 3. Seed super admin user
  // NOTE: Replace the email below with the actual Super Admin Google email
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
  console.log(`\n👑 Seeding Super Admin (${superAdminEmail})...`);

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { isSuperAdmin: true },
    create: {
      email: superAdminEmail,
      name: 'Super Admin',
      isSuperAdmin: true,
    },
  });
  console.log('   ✅ Super Admin seeded.\n');

  // 4. Seed default Dev Firm and assign Super Admin as Owner
  console.log('🏢 Seeding default Dev Firm...');
  const devFirm = await prisma.firm.upsert({
    where: { id: 'dev-firm-001' },
    update: {
      name: 'Dev Firm',
      status: 'ACTIVE',
    },
    create: {
      id: 'dev-firm-001',
      name: 'Dev Firm',
      businessType: 'Technology',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
    },
  });

  const ownerRole = await prisma.role.findFirst({
    where: { name: 'Owner', isSystem: true, firmId: null },
  });

  if (superAdminUser && ownerRole) {
    await prisma.userFirm.upsert({
      where: {
        userId_firmId: {
          userId: superAdminUser.id,
          firmId: devFirm.id,
        },
      },
      update: { status: 'ACTIVE' },
      create: {
        userId: superAdminUser.id,
        firmId: devFirm.id,
        roleId: ownerRole.id,
        status: 'ACTIVE',
      },
    });
    console.log('   ✅ Super Admin assigned to Dev Firm as Owner.\n');
  }

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
