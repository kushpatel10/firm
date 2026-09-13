/**
 * User Service
 * CRUD operations for platform users.
 */

const prisma = require("../config/database");
const { NotFoundError, ConflictError, ValidationError } = require("../utils/errors");

const userService = {
  /**
   * Get all users with pagination (Super Admin).
   */
  async getAll({ page = 1, pageSize = 20, search, status }) {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          firmAssignments: {
            where: { status: "ACTIVE" },
            include: { firm: { select: { id: true, name: true } }, role: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, pageSize };
  },

  /**
   * Get users assigned to a specific firm.
   */
  async getByFirmId(firmId, { page = 1, pageSize = 20, search }) {
    const where = {
      firmAssignments: { some: { firmId, status: "ACTIVE" } },
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          firmAssignments: {
            where: { firmId, status: "ACTIVE" },
            include: { role: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, pageSize };
  },

  /**
   * Get a single user by ID.
   */
  async getById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        firmAssignments: {
          include: { firm: true, role: true },
        },
      },
    });
    if (!user) throw new NotFoundError("User");
    return user;
  },

  /**
   * Create a user and assign to a firm with a role.
   */
  async create({ email, name, firmId, roleId, branchId }, createdById) {
    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError("A user with this email already exists");

    // Validate firm exists
    const firm = await prisma.firm.findUnique({ where: { id: firmId } });
    if (!firm) throw new ValidationError("Invalid firm ID");

    // Validate role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new ValidationError("Invalid role ID");

    return prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        createdBy: createdById,
        updatedBy: createdById,
        firmAssignments: {
          create: {
            firmId,
            roleId,
            branchId: branchId || null,
            status: "ACTIVE",
          },
        },
      },
      include: {
        firmAssignments: {
          include: { firm: true, role: true },
        },
      },
    });
  },

  /**
   * Update a user.
   */
  async update(id, data, updatedById) {
    await this.getById(id);
    const { id: _, firmAssignments, activityLogs, createdAt, updatedAt, ...cleanData } = data;

    return prisma.user.update({
      where: { id },
      data: {
        ...cleanData,
        updatedBy: updatedById,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Deactivate a user.
   */
  async deactivate(id, updatedById) {
    await this.getById(id);

    return prisma.user.update({
      where: { id },
      data: {
        status: "INACTIVE",
        updatedBy: updatedById,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Invite or assign a user to a firm.
   */
  async inviteToFirm(firmId, { email, name, roleId, roleName }, createdById) {
    let targetRoleId = roleId;
    if (!targetRoleId && roleName) {
      const foundRole = await prisma.role.findFirst({
        where: { name: { equals: roleName, mode: "insensitive" } },
      });
      if (foundRole) targetRoleId = foundRole.id;
    }

    if (!targetRoleId) {
      const defaultRole = await prisma.role.findFirst();
      targetRoleId = defaultRole ? defaultRole.id : undefined;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingAssignment = await prisma.userFirm.findUnique({
        where: { userId_firmId: { userId: existingUser.id, firmId } },
      });
      if (existingAssignment) {
        return prisma.userFirm.update({
          where: { id: existingAssignment.id },
          data: { status: "ACTIVE", roleId: targetRoleId },
        });
      }
      return prisma.userFirm.create({
        data: {
          userId: existingUser.id,
          firmId,
          roleId: targetRoleId,
          status: "ACTIVE",
        },
      });
    }

    return this.create(
      { email, name: name || email.split("@")[0], firmId, roleId: targetRoleId },
      createdById
    );
  },
};

module.exports = userService;

