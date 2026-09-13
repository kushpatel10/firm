/**
 * Sales Service
 * Multi-tenant CRUD with item management.
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const asymmetricCrypto = require("../utils/asymmetric-crypto");
const keyVaultService = require("./key-vault.service");

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

    // Decrypt fields if RAM vault is unlocked
    const privateKey = keyVaultService.getPrivateKey(firmId);
    const decryptedSales = sales.map((sale) => ({
      ...sale,
      customerName: asymmetricCrypto.decryptWithPrivateKey(sale.customerName, privateKey),
      description: asymmetricCrypto.decryptWithPrivateKey(sale.description, privateKey),
    }));

    return { sales: decryptedSales, total, page, pageSize };
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

    const privateKey = keyVaultService.getPrivateKey(firmId);
    return {
      ...sale,
      customerName: asymmetricCrypto.decryptWithPrivateKey(sale.customerName, privateKey),
      description: asymmetricCrypto.decryptWithPrivateKey(sale.description, privateKey),
    };
  },

  async create(data, firmId, createdById) {
    const { items = [], id: _, firm: __, customer: ___, branch: ____, ...saleData } = data;

    // Fetch Firm Public Key for encryption
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      select: { masterBusinessKey: true },
    });
    const publicKey = firm?.masterBusinessKey;

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

    // Encrypt sensitive party name and description using Public Key
    const encryptedCustomerName = publicKey ? asymmetricCrypto.encryptWithPublicKey(saleData.customerName, publicKey) : saleData.customerName;
    const encryptedDescription = publicKey && saleData.description ? asymmetricCrypto.encryptWithPublicKey(saleData.description, publicKey) : saleData.description;

    const createdSale = await prisma.sale.create({
      data: {
        ...saleData,
        firmId,
        customerName: encryptedCustomerName,
        invoiceNumber: generatedInvoiceNum,
        subtotal,
        tax,
        discount,
        total,
        saleType: saleData.saleType || "PAKU",
        description: encryptedDescription || null,
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

    const privateKey = keyVaultService.getPrivateKey(firmId);
    return {
      ...createdSale,
      customerName: asymmetricCrypto.decryptWithPrivateKey(createdSale.customerName, privateKey),
      description: asymmetricCrypto.decryptWithPrivateKey(createdSale.description, privateKey),
    };
  },


  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);

    const { items, id: _, firmId: __, firm: ___, customer: ____, branch: _____, createdAt, updatedAt, ...saleData } = data;
    const updateData = { ...saleData, updatedBy: updatedById, updatedAt: new Date() };

    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      select: { masterBusinessKey: true },
    });
    const publicKey = firm?.masterBusinessKey;

    if (saleData.customerName) {
      updateData.customerName = publicKey ? asymmetricCrypto.encryptWithPublicKey(saleData.customerName, publicKey) : saleData.customerName;
    }
    if (saleData.description !== undefined) {
      updateData.description = publicKey && saleData.description ? asymmetricCrypto.encryptWithPublicKey(saleData.description, publicKey) : saleData.description;
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

    const privateKey = keyVaultService.getPrivateKey(firmId);
    return {
      ...updatedSale,
      customerName: asymmetricCrypto.decryptWithPrivateKey(updatedSale.customerName, privateKey),
      description: asymmetricCrypto.decryptWithPrivateKey(updatedSale.description, privateKey),
    };
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.sale.delete({ where: { id } });
  },
};

module.exports = salesService;
