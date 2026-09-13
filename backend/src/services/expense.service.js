/**
 * Expense Service
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const expenseService = {
  async getAll(firmId, { page = 1, pageSize = 20, search, category, expenseType, branchId }) {
    const where = { firmId };
    if (category) where.category = category;
    if (expenseType) where.expenseType = expenseType;
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "desc" },
        include: { branch: { select: { id: true, name: true } } },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total, page, pageSize };
  },

  async getById(id, firmId) {
    const expense = await prisma.expense.findFirst({ where: { id, firmId } });
    if (!expense) throw new NotFoundError("Expense");
    return expense;
  },

  async create(data, firmId, createdById) {
    const { id: _, firmId: __, branch, ...cleanData } = data;
    return prisma.expense.create({
      data: {
        ...cleanData,
        amount: parseFloat(cleanData.amount) || 0,
        expenseType: cleanData.expenseType || "PAKU",
        firmId,
        createdBy: createdById,
        updatedBy: createdById,
      },
    });
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);
    const { id: _, firmId: __, branch, createdAt, updatedAt, ...cleanData } = data;
    if (cleanData.amount !== undefined) {
      cleanData.amount = parseFloat(cleanData.amount) || 0;
    }
    return prisma.expense.update({
      where: { id },
      data: { ...cleanData, updatedBy: updatedById, updatedAt: new Date() },
    });
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    return prisma.expense.delete({ where: { id } });
  },

  /** Monthly summary with category breakdown. */
  async getMonthlySummary(firmId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: { firmId, date: { gte: startDate, lte: endDate } },
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = {};
    let whiteTotal = 0;
    let blackTotal = 0;

    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      if (e.expenseType === "KACHU") {
        blackTotal += e.amount;
      } else {
        whiteTotal += e.amount;
      }
    });

    return {
      month: `${year}-${String(month).padStart(2, "0")}`,
      total: totalAmount,
      whiteTotal,
      blackTotal,
      count: expenses.length,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  },
};

module.exports = expenseService;
