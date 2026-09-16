const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const telegramUser = require("../middleware/telegramUser");
const { validatePromoCode } = require("../lib/promo");

const router = express.Router();

const promoSchema = z.object({
  code: z.string().trim().min(3).max(40).transform((v) => v.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().nonnegative().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().optional(),
  newCustomersOnly: z.boolean().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

function toDateFields(data) {
  return {
    ...data,
    ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
    ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
  };
}

// Mini App: check a promo code without an order (used for cart preview).
router.post(
  "/validate",
  telegramUser,
  asyncHandler(async (req, res) => {
    const { code, subtotal } = req.body;
    const user = await prisma.user.findUnique({ where: { telegramId: req.telegramUser.telegramId } });
    const isNewCustomer = !user || (await prisma.order.count({ where: { userId: user.id } })) === 0;
    const result = await validatePromoCode(code, { userId: user?.id, subtotal: Number(subtotal) || 0, isNewCustomer });
    res.json({ valid: true, discountAmount: result.discountAmount, type: result.promo.type, value: result.promo.value });
  })
);

router.use(requireAdmin);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
    res.json(promoCodes);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = toDateFields(promoSchema.parse(req.body));
    const promo = await prisma.promoCode.create({ data });
    res.status(201).json(promo);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = toDateFields(promoSchema.partial().parse(req.body));
    const promo = await prisma.promoCode.update({ where: { id: Number(req.params.id) }, data });
    res.json(promo);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.promoCode.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  })
);

module.exports = router;
