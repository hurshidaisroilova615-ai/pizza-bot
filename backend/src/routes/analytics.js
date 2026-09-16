const express = require("express");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();
router.use(requireAdmin);

function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

const COMPLETED_STATUSES = ["PENDING", "PREPARING", "ON_DELIVERY", "DELIVERED"];

// Admin dashboard: today / this-week / this-month revenue + order counts,
// new customers, average order value, best-selling products, and a daily
// revenue series for charting. Cancelled orders are excluded from revenue.
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const todayStart = startOfDay(new Date());
    const weekStart = daysAgo(7);
    const monthStart = daysAgo(30);

    const revenueSince = (since) =>
      prisma.order.aggregate({
        where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
        _sum: { totalPrice: true },
        _count: true,
      });

    const [today, week, month, newCustomersToday, newCustomersWeek, allTimeOrders] = await Promise.all([
      revenueSince(todayStart),
      revenueSince(weekStart),
      revenueSince(monthStart),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { totalPrice: true }, _count: true }),
    ]);

    const avgOrderValue = allTimeOrders._count > 0 ? Math.round(allTimeOrders._sum.totalPrice / allTimeOrders._count) : 0;

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      select: { createdAt: true, totalPrice: true },
    });
    const byDay = new Map();
    for (let i = 29; i >= 0; i -= 1) {
      const key = daysAgo(i).toISOString().slice(0, 10);
      byDay.set(key, 0);
    }
    for (const order of recentOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, byDay.get(key) + order.totalPrice);
    }
    const dailyRevenue = Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue }));

    const statusCounts = await prisma.order.groupBy({ by: ["status"], _count: true });

    const topItems = await prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    });

    res.json({
      today: { revenue: today._sum.totalPrice || 0, orders: today._count },
      week: { revenue: week._sum.totalPrice || 0, orders: week._count },
      month: { revenue: month._sum.totalPrice || 0, orders: month._count },
      newCustomers: { today: newCustomersToday, week: newCustomersWeek },
      avgOrderValue,
      dailyRevenue,
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count })),
      topProducts: topItems.map((t) => ({
        productId: t.productId,
        name: t.name,
        quantity: t._sum.quantity,
        revenue: t._sum.lineTotal,
      })),
    });
  })
);

module.exports = router;
