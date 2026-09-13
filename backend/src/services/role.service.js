/**
 * Role Service
 * CRUD for roles and permission assignment.
 */

const prisma = require("../config/database");
const { NotFoundError, ConflictError, ValidationError } = require("../utils/errors");

const roleService = {
  /** Get all roles, optionally filtered by firm. */
  async getAll({ firmId, includeSystem = true }) {
    const where = {};
    if (firmId) where.firmId = firmId;
    if (!includeSystem) where.isSystem = false;

    return prisma.role.findMany({
      where,
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { userFirms: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  /** Get a role by ID. */
  async getById(id) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { userFirms: true } },
      },
    });
    if (!role) throw new NotFoundError("Role");
    return role;
  },

  /** Create a custom role. */
  async create({ name, description, firmId }, createdById) {
    const existing = await prisma.role.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, firmId },
    });
    if (existing) throw new ConflictError("A role with this name already exists in this firm");

    return prisma.role.create({
      data: {
        name,
        description: description || null,
        firmId: firmId || null,
        isSystem: false,
        createdBy: createdById,
        updatedBy: createdById,
      },
    });
  },

  /** Update a role (cannot update system roles). */
  async update(id, data, updatedById) {
    const role = await this.getById(id);
    if (role.isSystem) throw new ValidationError("Cannot modify system roles");

    return prisma.role.update({
      where: { id },
      data: { ...data, updatedBy: updatedById, updatedAt: new Date() },
    });
  },

  /** Delete a custom role. */
  async delete(id) {
    const role = await this.getById(id);
    if (role.isSystem) throw new ValidationError("Cannot delete system roles");
    if (role._count.userFirms > 0) throw new ValidationError("Cannot delete a role that has assigned users");

    return prisma.role.delete({ where: { id } });
  },

  /** Get all available permissions. */
  async getPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });
  },

  /** Assign permissions to a role (replace existing). */
  async assignPermissions(roleId, permissionIds) {
    const role = await this.getById(roleId);
    if (role.isSystem) throw new ValidationError("Cannot modify system role permissions");

    // Delete existing
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    // Create new
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }

    return this.getById(roleId);
  },
};

module.exports = roleService;
