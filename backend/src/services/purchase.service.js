/**
 * Purchase Service
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const purchaseService = {
  async getAll(firmId, { page = 1, pageSize = 20, search, status, branchId }) {
    const where = { firmId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "desc" },
        include: {
          supplier: { select: { id: true, name: true } },
          items: true,
          branch: { select: { id: true, name: true } },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    return { purchases, total, page, pageSize };
  },

  async getById(id, firmId) {
    const purchase = await prisma.purchase.findFirst({
      where: { id, firmId },
      include: { supplier: true, items: true, branch: true, firm: true },
    });
    if (!purchase) throw new NotFoundError("Purchase");
    return purchase;
  },

  async create(data, firmId, createdById) {
    const { items = [], id: _, firm: __, supplier: ___, branch: ____, ...purchaseData } = data;

    const subtotal = items && items.length > 0
      ? items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0), 0)
      : (parseFloat(purchaseData.subtotal) || parseFloat(purchaseData.total) || 0);

    const tax = parseFloat(purchaseData.tax) || 0;
    const discount = parseFloat(purchaseData.discount) || 0;
    const total = Math.max(0, subtotal + tax - discount);

    let generatedInvoiceNum = purchaseData.invoiceNumber?.trim();
    if (!generatedInvoiceNum) {
      const lastPurchase = await prisma.purchase.findFirst({
        where: { firmId, invoiceNumber: { startsWith: "PUR-" } },
        orderBy: { createdAt: "desc" },
        select: { invoiceNumber: true },
      });
      let nextSeq = 1;
      if (lastPurchase?.invoiceNumber) {
        const match = lastPurchase.invoiceNumber.match(/^PUR-(\d+)/);
        if (match) {
          nextSeq = parseInt(match[1], 10) + 1;
        }
      }
      generatedInvoiceNum = `PUR-${String(nextSeq).padStart(4, "0")}`;
    }

    return prisma.purchase.create({
      data: {
        ...purchaseData,
        firmId,
        invoiceNumber: generatedInvoiceNum,
        subtotal,
        tax,
        discount,
        total,
        status: purchaseData.status || "RECEIVED",
        createdBy: createdById,
        updatedBy: createdById,
        items: items && items.length > 0 ? {
          create: items.map((item) => ({
            name: item.name,
            category: item.category || null,
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || "pcs",
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
          })),
        } : undefined,
      },
      include: { items: true, supplier: true, branch: true, firm: true },
    });
  },

  async update(id, data, firmId, updatedById) {
    const existing = await this.getById(id, firmId);
    const { items, id: _, firmId: __, firm: ___, supplier: ____, branch: _____, createdAt, updatedAt, ...purchaseData } = data;
    const updateData = { ...purchaseData, updatedBy: updatedById, updatedAt: new Date() };

    const tax = purchaseData.tax !== undefined ? (parseFloat(purchaseData.tax) || 0) : (existing.tax || 0);
    const discount = purchaseData.discount !== undefined ? (parseFloat(purchaseData.discount) || 0) : (existing.discount || 0);

    let subtotal;
    if (items && items.length > 0) {
      subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0), 0);
      updateData.items = {
        create: items.map((item) => ({
          name: item.name,
          category: item.category || null,
          quantity: parseInt(item.quantity) || 1,
          unit: item.unit || "pcs",
          unitPrice: parseFloat(item.unitPrice) || 0,
          total: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
        })),
      };
    } else if (purchaseData.subtotal !== undefined) {
      subtotal = parseFloat(purchaseData.subtotal) || 0;
    } else if (purchaseData.total !== undefined) {
      subtotal = Math.max(0, (parseFloat(purchaseData.total) || 0) - tax + discount);
    } else {
      subtotal = existing.subtotal;
    }

    updateData.subtotal = subtotal;
    updateData.tax = tax;
    updateData.discount = discount;
    updateData.total = Math.max(0, subtotal + tax - discount);

    return prisma.$transaction(async (tx) => {
      if (items && items.length > 0) {
        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      }
      return tx.purchase.update({
        where: { id },
        data: updateData,
        include: { items: true, supplier: true, branch: true, firm: true },
      });
    });
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.purchase.delete({ where: { id } });
  },
};

module.exports = purchaseService;
