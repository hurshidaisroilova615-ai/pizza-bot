const express = require("express");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.use(requireAdmin);

// CRM: customer list with aggregated stats (order count, lifetime spend,
// last order date). Search by name/phone/telegramId.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { telegramId: { contains: search } },
              { username: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { orders: true } },
        orders: { select: { totalPrice: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const result = users.map((u) => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      loyaltyPoints: u.loyaltyPoints,
      createdAt: u.createdAt,
      ordersCount: u._count.orders,
      totalSpent: u.orders.reduce((sum, o) => sum + o.totalPrice, 0),
      lastOrderAt: u.orders[0]?.createdAt || null,
    }));

    res.json(result);
  })
);

// CRM: single customer profile — full order history + favorite products.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
        loyaltyTxns: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!user) return res.status(404).json({ error: "Mijoz topilmadi" });

    const productCounts = new Map();
    for (const order of user.orders) {
      for (const item of order.items) {
        const key = item.productId ?? item.name;
        const entry = productCounts.get(key) || { name: item.name, quantity: 0 };
        entry.quantity += item.quantity;
        productCounts.set(key, entry);
      }
    }
    const favoriteProducts = Array.from(productCounts.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const totalSpent = user.orders.reduce((sum, o) => sum + o.totalPrice, 0);

    res.json({
      ...user,
      ordersCount: user.orders.length,
      totalSpent,
      lastOrderAt: user.orders[0]?.createdAt || null,
      favoriteProducts,
    });
  })
);

module.exports = router;
