/**
 * Delivery Challan Service
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const deliveryChallanService = {
  async getAll(firmId, { page = 1, pageSize = 20, search, status, branchId }) {
    const where = { firmId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [challans, total] = await Promise.all([
      prisma.deliveryChallan.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "desc" },
        include: {
          customer: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
      prisma.deliveryChallan.count({ where }),
    ]);

    return { challans, total, page, pageSize };
  },

  async getById(id, firmId) {
    const challan = await prisma.deliveryChallan.findFirst({
      where: { id, firmId },
      include: { customer: true, branch: true },
    });
    if (!challan) throw new NotFoundError("Delivery Challan");
    return challan;
  },

  async create(data, firmId, createdById) {
    const { items, ...challanData } = data;

    return prisma.deliveryChallan.create({
      data: {
        ...challanData,
        firmId,
        status: challanData.status || "DELIVERED",
        createdBy: createdById,
        updatedBy: createdById,
      },
      include: { customer: true },
    });
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);
    const { items, ...challanData } = data;
    const updateData = { ...challanData, updatedBy: updatedById, updatedAt: new Date() };

    return prisma.deliveryChallan.update({
      where: { id },
      data: updateData,
      include: { customer: true },
    });
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.deliveryChallan.delete({ where: { id } });
  },
};

module.exports = deliveryChallanService;
