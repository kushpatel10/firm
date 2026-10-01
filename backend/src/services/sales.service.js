/**
 * Sales Service
 * Multi-tenant CRUD with item management (plain text, no encryption).
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

function sanitizeEncryptedField(val, fallback = "") {
  if (!val || typeof val !== "string") return val;
  if (val.startsWith("enc:rsa:")) return fallback;
  return val;
}

const salesService = {
  async getAll(firmId, { page = 1, pageSize = 20, search, status, saleType, branchId }) {
    const where = { firmId };
    if (status) where.status = status;
    if (saleType) where.saleType = saleType;
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "desc" },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } },
          items: true,
          branch: { select: { id: true, name: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    const cleanSales = sales.map((sale) => ({
      ...sale,
      customerName: sanitizeEncryptedField(sale.customerName, sale.customer?.name || "Customer"),
      description: sanitizeEncryptedField(sale.description, ""),
    }));

    return { sales: cleanSales, total, page, pageSize };
  },

  async getById(id, firmId) {
    const sale = await prisma.sale.findFirst({
      where: { id, firmId },
      include: {
        customer: true,
        items: true,
        branch: true,
        firm: true,
      },
    });
    if (!sale) throw new NotFoundError("Sale");

    return {
      ...sale,
      customerName: sanitizeEncryptedField(sale.customerName, sale.customer?.name || "Customer"),
      description: sanitizeEncryptedField(sale.description, ""),
    };
  },

  async create(data, firmId, createdById) {
    const { items = [], id: _, firm: __, customer: ___, branch: ____, ...saleData } = data;

    // Calculate subtotal from items if provided, or fallback to subtotal/total
    const subtotal = items.length > 0
      ? items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0), 0)
      : (parseFloat(saleData.subtotal) || parseFloat(saleData.total) || 0);

    const tax = parseFloat(saleData.tax) || 0;
    const discount = parseFloat(saleData.discount) || 0;
    const total = subtotal + tax - discount;

    const prefix = (saleData.saleType || "PAKU") === "KACHU" ? "KCH" : "INV";
    let generatedInvoiceNum = saleData.invoiceNumber;
    if (!generatedInvoiceNum) {
      const lastSale = await prisma.sale.findFirst({
        where: { firmId, invoiceNumber: { startsWith: prefix } },
        orderBy: { createdAt: "desc" },
        select: { invoiceNumber: true },
      });
      let nextSeq = 1;
      if (lastSale?.invoiceNumber) {
        const match = lastSale.invoiceNumber.match(new RegExp(`^${prefix}-(\\d+)`));
        if (match) {
          nextSeq = parseInt(match[1], 10) + 1;
        }
      }
      generatedInvoiceNum = `${prefix}-${String(nextSeq).padStart(4, "0")}`;
    }

    const createdSale = await prisma.sale.create({
      data: {
        ...saleData,
        firmId,
        customerName: saleData.customerName,
        invoiceNumber: generatedInvoiceNum,
        subtotal,
        tax,
        discount,
        total,
        saleType: saleData.saleType || "PAKU",
        description: saleData.description || null,
        status: saleData.status || "CONFIRMED",
        createdBy: createdById,
        updatedBy: createdById,
        items: items.length > 0 ? {
          create: items.map((item) => ({
            name: item.name,
            category: item.category || null,
            size: item.size || null,
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || "pcs",
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
          })),
        } : undefined,
      },
      include: { items: true, customer: true, firm: true },
    });

    return createdSale;
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);

    const { items, id: _, firmId: __, firm: ___, customer: ____, branch: _____, createdAt, updatedAt, ...saleData } = data;
    const updateData = { ...saleData, updatedBy: updatedById, updatedAt: new Date() };

    if (saleData.customerName) {
      updateData.customerName = saleData.customerName;
    }
    if (saleData.description !== undefined) {
      updateData.description = saleData.description;
    }

    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0), 0);
      updateData.subtotal = subtotal;
      updateData.total = subtotal + (parseFloat(saleData.tax) || 0) - (parseFloat(saleData.discount) || 0);

      updateData.items = {
        create: items.map((item) => ({
          name: item.name,
          category: item.category || null,
          size: item.size || null,
          quantity: parseInt(item.quantity) || 1,
          unit: item.unit || "pcs",
          unitPrice: parseFloat(item.unitPrice) || 0,
          total: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
        })),
      };
    }

    // Atomic transaction ensures items are not lost if update fails
    const updatedSale = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.saleItem.deleteMany({ where: { saleId: id } });
      }
      return tx.sale.update({
        where: { id },
        data: updateData,
        include: { items: true, customer: true, firm: true },
      });
    });

    return updatedSale;
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.sale.delete({ where: { id } });
  },
};

module.exports = salesService;
