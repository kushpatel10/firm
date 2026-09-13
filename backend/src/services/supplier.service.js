/**
 * Supplier Service
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const supplierService = {
  async getAll(firmId, { page = 1, pageSize = 20, search }) {
    const where = { firmId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
        include: { _count: { select: { purchases: true } } },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total, page, pageSize };
  },

  async getById(id, firmId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, firmId },
      include: { _count: { select: { purchases: true } } },
    });
    if (!supplier) throw new NotFoundError("Supplier");
    return supplier;
  },

  async create(data, firmId, createdById) {
    const { id: _, firmId: __, _count, purchases, ...cleanData } = data;
    return prisma.supplier.create({
      data: { ...cleanData, firmId, createdBy: createdById, updatedBy: createdById },
    });
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);
    const { id: _, firmId: __, _count, purchases, createdAt, updatedAt, ...cleanData } = data;
    return prisma.supplier.update({
      where: { id },
      data: { ...cleanData, updatedBy: updatedById, updatedAt: new Date() },
    });
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.supplier.delete({ where: { id } });
  },
};

module.exports = supplierService;
