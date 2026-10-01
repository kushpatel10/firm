/**
 * Category & Product Configuration Routes
 */

const { Router } = require("express");
const categoryService = require("../services/category.service");
const { success, created } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { logActivity } = require("../middleware/activity");

const router = Router({ mergeParams: true });

router.use(authenticate, requireFirm);

// GET / — List all configured categories for active firm (auto-seeds Doors if none exist)
router.get("/", async (req, res, next) => {
  try {
    const categories = await categoryService.getAll(req.activeFirmId);
    success(res, categories);
  } catch (err) {
    next(err);
  }
});

// GET /:id — Get single category
router.get("/:id", async (req, res, next) => {
  try {
    const category = await categoryService.getById(req.params.id, req.activeFirmId);
    success(res, category);
  } catch (err) {
    next(err);
  }
});

// POST / — Create new product category
router.post("/", logActivity("CREATE", "Category"), async (req, res, next) => {
  try {
    const category = await categoryService.create(req.body, req.activeFirmId, req.user.id);
    created(res, category, "Category created successfully");
  } catch (err) {
    next(err);
  }
});

// PUT /:id — Update category configuration
router.put("/:id", logActivity("UPDATE", "Category"), async (req, res, next) => {
  try {
    const category = await categoryService.update(req.params.id, req.body, req.activeFirmId, req.user.id);
    success(res, category, "Category updated successfully");
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — Deactivate category
router.delete("/:id", logActivity("DELETE", "Category"), async (req, res, next) => {
  try {
    await categoryService.delete(req.params.id, req.activeFirmId);
    success(res, null, "Category deleted successfully");
  } catch (err) {
    next(err);
  }
});

// POST /:id/size-presets — Save custom size or new preset
router.post("/:id/size-presets", logActivity("CREATE", "SizePreset"), async (req, res, next) => {
  try {
    const preset = await categoryService.addSizePreset(req.params.id, req.activeFirmId, req.body);
    created(res, preset, "Size preset added successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
