/**
 * Customer Service
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const customerService = {
  async getAll(firmId, { page = 1, pageSize = 20, search }) {
    const where = { firmId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
        include: { _count: { select: { sales: true } } },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total, page, pageSize };
  },

  async getById(id, firmId) {
    const customer = await prisma.customer.findFirst({
      where: { id, firmId },
      include: { _count: { select: { sales: true } } },
    });
    if (!customer) throw new NotFoundError("Customer");
    return customer;
  },

  async create(data, firmId, createdById) {
    const { id: _, firmId: __, _count, sales, ...cleanData } = data;
    return prisma.customer.create({
      data: { ...cleanData, firmId, createdBy: createdById, updatedBy: createdById },
    });
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);
    const { id: _, firmId: __, _count, sales, createdAt, updatedAt, ...cleanData } = data;
    return prisma.customer.update({
      where: { id },
      data: { ...cleanData, updatedBy: updatedById, updatedAt: new Date() },
    });
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.customer.delete({ where: { id } });
  },
};

module.exports = customerService;
