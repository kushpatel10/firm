/**
 * Branch Service
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const branchService = {
  async getByFirmId(firmId) {
    return prisma.branch.findMany({
      where: { firmId },
      orderBy: { name: "asc" },
    });
  },

  async getById(id, firmId = null) {
    const where = { id };
    if (firmId) where.firmId = firmId;
    const branch = await prisma.branch.findFirst({ where });
    if (!branch) throw new NotFoundError("Branch");
    return branch;
  },

  async create(data, createdById) {
    return prisma.branch.create({
      data: {
        name: data.name,
        code: data.code ? data.code.trim().toUpperCase() : null,
        address: data.address || null,
        phone: data.phone || null,
        firmId: data.firmId,
        createdBy: createdById,
        updatedBy: createdById,
      },
    });
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);
    const { id: _, firmId: __, createdAt, updatedAt, ...updateData } = data;
    if (updateData.code !== undefined) {
      updateData.code = updateData.code ? updateData.code.trim().toUpperCase() : null;
    }
    return prisma.branch.update({
      where: { id },
      data: { ...updateData, updatedBy: updatedById, updatedAt: new Date() },
    });
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.branch.delete({ where: { id } });
  },
};

module.exports = branchService;
