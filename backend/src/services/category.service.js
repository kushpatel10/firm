/**
 * Category & Product Configuration Service
 * Multi-tenant catalog configuration with dynamic dimensions, size presets, and formula rules.
 */

const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const DEFAULT_DOORS_CONFIG = {
  name: "Doors",
  icon: "🚪",
  description: "Flush Doors, Teak Doors, and custom architectural doors",
  hasSubtypes: true,
  formula: "(LENGTH * WIDTH) / 144",
  calculationLabel: "Square Feet",
  rateLabel: "Rate per sq.ft",
  unit: "sq.ft",
  sortOrder: 1,
  isActive: true,
  subtypes: [
    { name: "Flush Door", description: "Solid core flush door with standard laminate base", defaultRate: 250, sortOrder: 1 },
    { name: "Teak Door", description: "Premium natural teak wood carved / panel door", defaultRate: 450, sortOrder: 2 },
    { name: "Other", description: "Custom membrane, pine, or molded panel door", defaultRate: 300, sortOrder: 3 },
  ],
  dimensions: [
    { key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 84, placeholder: "e.g. 84", sortOrder: 1 },
    { key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 36, placeholder: "e.g. 36", sortOrder: 2 },
    { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 2, placeholder: "e.g. 2", sortOrder: 3 },
  ],
  sizePresets: [
    { name: "30 mm", standardRate: 250, sortOrder: 1 },
    { name: "35 mm", standardRate: 280, sortOrder: 2 },
  ],
  pricingRules: [
    {
      name: "Door Sq.Ft Calculation",
      formula: "(LENGTH * WIDTH) / 144",
      formulaExplanation: "Square Feet = (Length × Width) / 144",
      rounding: "ROUND_HALF_UP",
      decimalPlaces: 2,
      isActive: true,
    },
  ],
};

const DEFAULT_WINDOWS_CONFIG = {
  name: "Windows",
  icon: "🪟",
  description: "Aluminium, UPVC, and sliding window sections",
  hasSubtypes: true,
  formula: "(LENGTH * WIDTH) / 144",
  calculationLabel: "Square Feet",
  rateLabel: "Rate per sq.ft",
  unit: "sq.ft",
  sortOrder: 2,
  isActive: true,
  subtypes: [
    { name: "Aluminium Window", description: "Powder coated / anodized section", defaultRate: 320, sortOrder: 1 },
    { name: "UPVC Window", description: "Multi-chamber soundproof UPVC frame", defaultRate: 480, sortOrder: 2 },
    { name: "Sliding Window", description: "Heavy duty 3-track sliding section", defaultRate: 360, sortOrder: 3 },
  ],
  dimensions: [
    { key: "length", label: "Length (Height)", unit: "inch", type: "NUMBER", required: true, defaultValue: 48, placeholder: "e.g. 48", sortOrder: 1 },
    { key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 48, placeholder: "e.g. 48", sortOrder: 2 },
    { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 3 },
  ],
  sizePresets: [
    { name: "2 Track", standardRate: 320, sortOrder: 1 },
    { name: "3 Track", standardRate: 380, sortOrder: 2 },
  ],
  pricingRules: [
    {
      name: "Window Sq.Ft Calculation",
      formula: "(LENGTH * WIDTH) / 144",
      formulaExplanation: "Square Feet = (Length × Width) / 144",
      rounding: "ROUND_HALF_UP",
      decimalPlaces: 2,
      isActive: true,
    },
  ],
};

const DEFAULT_GLASS_CONFIG = {
  name: "Glass",
  icon: "🪞",
  description: "Toughened, frosted, and architectural glass panels",
  hasSubtypes: true,
  formula: "(LENGTH * WIDTH) / 144",
  calculationLabel: "Square Feet",
  rateLabel: "Rate per sq.ft",
  unit: "sq.ft",
  sortOrder: 3,
  isActive: true,
  subtypes: [
    { name: "Toughened Glass", description: "Tempered safety glass", defaultRate: 180, sortOrder: 1 },
    { name: "Frosted Glass", description: "Acid-etched privacy glass", defaultRate: 210, sortOrder: 2 },
    { name: "Tinted Glass", description: "Heat-reflective tinted sheet", defaultRate: 240, sortOrder: 3 },
  ],
  dimensions: [
    { key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 72, placeholder: "e.g. 72", sortOrder: 1 },
    { key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 30, placeholder: "e.g. 30", sortOrder: 2 },
    { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 3 },
  ],
  sizePresets: [
    { name: "8 mm", standardRate: 180, sortOrder: 1 },
    { name: "10 mm", standardRate: 220, sortOrder: 2 },
    { name: "12 mm", standardRate: 270, sortOrder: 3 },
  ],
  pricingRules: [
    {
      name: "Glass Sq.Ft Calculation",
      formula: "(LENGTH * WIDTH) / 144",
      formulaExplanation: "Square Feet = (Length × Width) / 144",
      rounding: "ROUND_HALF_UP",
      decimalPlaces: 2,
      isActive: true,
    },
  ],
};

const DEFAULT_FURNITURE_CONFIG = {
  name: "Furniture",
  icon: "🛋️",
  description: "Standard unit-priced ready or custom modular furniture",
  hasSubtypes: false, // Category has NO subtypes — will test automatic subtype skip!
  formula: "QUANTITY * RATE",
  calculationLabel: "Units",
  rateLabel: "Rate per item",
  unit: "piece",
  sortOrder: 4,
  isActive: true,
  subtypes: [],
  dimensions: [
    { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 1 },
  ],
  sizePresets: [
    { name: "Standard", standardRate: 1500, sortOrder: 1 },
    { name: "Large", standardRate: 2500, sortOrder: 2 },
  ],
  pricingRules: [
    {
      name: "Direct Unit Price",
      formula: "QUANTITY * RATE",
      formulaExplanation: "Total = Quantity × Unit Rate",
      rounding: "ROUND_HALF_UP",
      decimalPlaces: 2,
      isActive: true,
    },
  ],
};

const categoryService = {
  /**
   * Seed default categories for a firm if none exist.
   */
  async seedDefaultCategories(firmId, createdById = null) {
    const defaults = [DEFAULT_DOORS_CONFIG, DEFAULT_WINDOWS_CONFIG, DEFAULT_GLASS_CONFIG, DEFAULT_FURNITURE_CONFIG];
    
    for (const conf of defaults) {
      const { subtypes, dimensions, sizePresets, pricingRules, ...catData } = conf;
      await prisma.category.create({
        data: {
          ...catData,
          firmId,
          createdBy: createdById,
          updatedBy: createdById,
          subtypes: {
            create: subtypes.map((s) => ({
              name: s.name,
              description: s.description,
              defaultRate: s.defaultRate,
              sortOrder: s.sortOrder,
            })),
          },
          dimensions: {
            create: dimensions.map((d) => ({
              key: d.key,
              label: d.label,
              unit: d.unit,
              type: d.type,
              required: d.required,
              defaultValue: d.defaultValue,
              placeholder: d.placeholder,
              sortOrder: d.sortOrder,
            })),
          },
          sizePresets: {
            create: sizePresets.map((sp) => ({
              name: sp.name,
              standardRate: sp.standardRate,
              sortOrder: sp.sortOrder,
            })),
          },
          pricingRules: {
            create: pricingRules.map((pr) => ({
              name: pr.name,
              formula: pr.formula,
              formulaExplanation: pr.formulaExplanation,
              rounding: pr.rounding,
              decimalPlaces: pr.decimalPlaces,
              isActive: pr.isActive,
            })),
          },
        },
      });
    }
  },

  /**
   * Get all active categories for the given firmId with all nested relations.
   * Auto-seeds default Door and product configurations if empty.
   */
  async getAll(firmId) {
    let categories = await prisma.category.findMany({
      where: { firmId, isActive: true },
      include: {
        subtypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        dimensions: { orderBy: { sortOrder: "asc" } },
        sizePresets: { orderBy: { sortOrder: "asc" } },
        pricingRules: { where: { isActive: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (categories.length === 0) {
      await this.seedDefaultCategories(firmId);
      categories = await prisma.category.findMany({
        where: { firmId, isActive: true },
        include: {
          subtypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          dimensions: { orderBy: { sortOrder: "asc" } },
          sizePresets: { orderBy: { sortOrder: "asc" } },
          pricingRules: { where: { isActive: true } },
        },
        orderBy: { sortOrder: "asc" },
      });
    }

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
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
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
