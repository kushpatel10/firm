/**
 * Activity Log Service
 */

const prisma = require("../config/database");

const activityService = {
  /** Get all activity logs (Super Admin). */
  async getAll({ page = 1, pageSize = 50, action, userId, firmId }) {
    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (firmId) where.firmId = firmId;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          firm: { select: { id: true, name: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total, page, pageSize };
  },

  /** Get activity for a specific firm. */
  async getByFirmId(firmId, { page = 1, pageSize = 50, action }) {
    const where = { firmId };
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total, page, pageSize };
  },
};

module.exports = activityService;
