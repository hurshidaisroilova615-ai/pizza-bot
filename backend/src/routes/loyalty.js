const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const telegramUser = require("../middleware/telegramUser");
const { getLoyaltySummary } = require("../lib/loyalty");

const router = express.Router();

// Mini App: current customer's loyalty balance + recent history.
router.get(
  "/me",
  telegramUser,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { telegramId: req.telegramUser.telegramId } });
    if (!user) return res.json({ balance: 0, transactions: [] });
    res.json(await getLoyaltySummary(user.id));
  })
);

const adjustSchema = z.object({
  userId: z.number().int(),
  points: z.number().int(),
  note: z.string().trim().max(300).optional(),
});

// Admin: manually adjust a customer's balance (goodwill credit, correction).
router.post(
  "/adjust",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { userId, points, note } = adjustSchema.parse(req.body);
    const balanceAfter = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { increment: points } },
      });
      await tx.loyaltyTransaction.create({
        data: { userId, type: "ADJUST", points, balanceAfter: user.loyaltyPoints, note },
      });
      return user.loyaltyPoints;
    });
    res.json({ balance: balanceAfter });
  })
);

module.exports = router;
