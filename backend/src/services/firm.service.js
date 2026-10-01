/**
 * Firm Service
 * CRUD operations for firms — Super Admin only.
 */

const prisma = require("../config/database");
const { NotFoundError, ConflictError } = require("../utils/errors");

const firmService = {
  /**
   * Get all firms with pagination and filtering.
   */
  async getAll({ page = 1, pageSize = 20, search, status }) {
    const where = {};
    if (search && search.trim() !== "") {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { gstNumber: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim(), mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [firms, total] = await Promise.all([
      prisma.firm.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { userAssignments: true, branches: true } },
        },
      }),
      prisma.firm.count({ where }),
    ]);

    return { firms, total, page, pageSize };
  },

  /**
   * Get a firm by ID with branches and user count.
   */
  async getById(id) {
    const firm = await prisma.firm.findUnique({
      where: { id },
      include: {
        branches: { orderBy: { name: "asc" } },
        _count: { select: { userAssignments: true } },
      },
    });

    if (!firm) throw new NotFoundError("Firm");
    return firm;
  },

  /**
   * Create a new firm.
   */
  async create(data, createdById) {
    // Check for duplicate name
    const existing = await prisma.firm.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" } },
    });
    if (existing) throw new ConflictError("A firm with this name already exists");

    const createdFirm = await prisma.firm.create({
      data: {
        name: data.name,
        businessType: data.businessType,
        address: data.address || null,
        phone: data.phone || null,
        gstNumber: data.gstNumber || null,
        currency: data.currency || "INR",
        timezone: data.timezone || "Asia/Kolkata",
        createdBy: createdById,
        updatedBy: createdById,
      },
    });

    return createdFirm;
  },

  /**
   * Update a firm.
   */
  async update(id, data, updatedById) {
    await this.getById(id); // Throws if not found

    return prisma.firm.update({
      where: { id },
      data: {
        ...data,
        updatedBy: updatedById,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Archive a firm (soft delete).
   */
  async archive(id, updatedById) {
    await this.getById(id);

    return prisma.firm.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        updatedBy: updatedById,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Delete a firm permanently.
   */
  async delete(id) {
    await this.getById(id);
    return prisma.firm.delete({ where: { id } });
  },
};

module.exports = firmService;
