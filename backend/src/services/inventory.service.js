/**
 * Inventory Service
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const inventoryService = {
  async getAll(firmId, { page = 1, pageSize = 20, search, category, branchId } = {}) {
    const where = { firmId };
    if (category) where.category = category;
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
        include: { branch: { select: { id: true, name: true } } },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getById(id, firmId) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, firmId },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });
    if (!item) throw new NotFoundError("Inventory item");
    return item;
  },

  async create(data, firmId, createdById) {
    const { id: _, branch, ...itemData } = data;
    let sizes = itemData.sizes;
    if (typeof sizes === "string") {
      try { sizes = JSON.parse(sizes); } catch { sizes = sizes.split(",").map(s => s.trim()).filter(Boolean); }
    }
    return prisma.inventoryItem.create({
      data: {
        ...itemData,
        sizes: sizes !== undefined ? sizes : null,
        sellingPrice: parseFloat(itemData.sellingPrice) || 0,
        purchasePrice: parseFloat(itemData.purchasePrice) || 0,
        quantity: parseInt(itemData.quantity) || 0,
        minStock: parseInt(itemData.minStock) || 5,
        firmId,
        createdBy: createdById,
        updatedBy: createdById,
      },
    });
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);
    const { id: _, firmId: __, branch, createdAt, updatedAt, ...updateData } = data;
    if (updateData.sellingPrice !== undefined) updateData.sellingPrice = parseFloat(updateData.sellingPrice) || 0;
    if (updateData.purchasePrice !== undefined) updateData.purchasePrice = parseFloat(updateData.purchasePrice) || 0;
    if (updateData.quantity !== undefined) updateData.quantity = parseInt(updateData.quantity) || 0;
    if (updateData.minStock !== undefined) updateData.minStock = parseInt(updateData.minStock) || 5;
    if (updateData.sizes !== undefined) {
      if (typeof updateData.sizes === "string") {
        try { updateData.sizes = JSON.parse(updateData.sizes); } catch { updateData.sizes = updateData.sizes.split(",").map(s => s.trim()).filter(Boolean); }
      }
    }

    return prisma.inventoryItem.update({
      where: { id },
      data: { ...updateData, updatedBy: updatedById, updatedAt: new Date() },
    });
  },

  /** Add a stock entry (IN or OUT) and update current stock quantity. */
  async addStockEntry(itemId, { type, quantity, reference, notes }, firmId, createdById) {
    const item = await this.getById(itemId, firmId);
    const qty = parseInt(quantity) || 0;

    const newQuantity = type === "IN"
      ? item.quantity + qty
      : item.quantity - qty;

    if (newQuantity < 0) {
      throw new Error("Insufficient stock");
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { quantity: newQuantity, updatedBy: createdById, updatedAt: new Date() },
    });

    return {
      itemId,
      type,
      quantity: qty,
      newQuantity,
      reference: reference || null,
      notes: notes || null,
      updatedAt: updatedItem.updatedAt,
    };
  },

  /** Get items below minimum stock. */
  async getLowStock(firmId) {
    return prisma.$queryRaw`
      SELECT * FROM "inventory_items"
      WHERE "firmId" = ${firmId}
        AND "quantity" <= "minStock"
      ORDER BY "quantity" ASC
    `;
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.inventoryItem.delete({ where: { id } });
  },
};

module.exports = inventoryService;
