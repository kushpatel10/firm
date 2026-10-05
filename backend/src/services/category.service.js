/**
 * Category & Product Configuration Service
 * Multi-tenant catalog configuration with dynamic dimensions, size presets, and formula rules.
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const categoryService = {
  /**
   * Seed default categories for a firm if needed (no-op: users configure categories according to their needs).
   */
  async seedDefaultCategories(firmId, createdById = null) {
    // No preset categories; users add categories and formulas dynamically per firm requirements
    return [];
  },

  /**
   * Get all active categories for the given firmId with all nested relations.
   */
  async getAll(firmId) {
    const categories = await prisma.category.findMany({
      where: { firmId, isActive: true },
      include: {
        subtypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        dimensions: { orderBy: { sortOrder: "asc" } },
        sizePresets: { orderBy: { sortOrder: "asc" } },
        pricingRules: { where: { isActive: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return categories;
  },

  async getById(id, firmId) {
    const category = await prisma.category.findFirst({
      where: { id, firmId },
      include: {
        subtypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        dimensions: { orderBy: { sortOrder: "asc" } },
        sizePresets: { orderBy: { sortOrder: "asc" } },
        pricingRules: { where: { isActive: true } },
      },
    });
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  async create(data, firmId, createdById) {
    const { subtypes = [], dimensions = [], sizePresets = [], pricingRules = [], ...categoryData } = data;

    return prisma.category.create({
      data: {
        ...categoryData,
        firmId,
        createdBy: createdById,
        updatedBy: createdById,
        subtypes: subtypes.length > 0 ? { create: subtypes } : undefined,
        dimensions: dimensions.length > 0 ? { create: dimensions } : undefined,
        sizePresets: sizePresets.length > 0 ? { create: sizePresets } : undefined,
        pricingRules: pricingRules.length > 0 ? { create: pricingRules } : undefined,
      },
      include: {
        subtypes: true,
        dimensions: true,
        sizePresets: true,
        pricingRules: true,
      },
    });
  },

  async update(id, data, firmId, updatedById) {
    await this.getById(id, firmId);
    const { subtypes, dimensions, sizePresets, pricingRules, ...categoryData } = data;

    return prisma.category.update({
      where: { id },
      data: {
        ...categoryData,
        updatedBy: updatedById,
        updatedAt: new Date(),
      },
      include: {
        subtypes: true,
        dimensions: true,
        sizePresets: true,
        pricingRules: true,
      },
    });
  },

  async delete(id, firmId) {
    await this.getById(id, firmId);
    try {
      return await prisma.category.delete({
        where: { id },
      });
    } catch {
      return await prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    }
  },

  async addSizePreset(categoryId, firmId, { name, standardRate = null, isCustom = false }) {
    await this.getById(categoryId, firmId);
    return prisma.sizePreset.create({
      data: {
        categoryId,
        name,
        standardRate: standardRate ? parseFloat(standardRate) : null,
        isCustom,
      },
    });
  },
};

module.exports = categoryService;
