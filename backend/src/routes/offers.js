const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const telegramUser = require("../middleware/telegramUser");
const { notifyOffer } = require("../bot");

const router = express.Router();

const offerSchema = z.object({
  title: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(1000),
  imageUrl: z.string().trim().url().nullable().optional(),
  segment: z.enum(["ALL", "NEW_CUSTOMERS", "LOYAL_CUSTOMERS", "INACTIVE_CUSTOMERS"]),
  promoCodeId: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
});

const LOYAL_ORDER_THRESHOLD = 5;
const INACTIVE_DAYS = 30;

async function resolveSegmentUsers(segment) {
  const now = Date.now();

  if (segment === "ALL") return prisma.user.findMany();

  if (segment === "NEW_CUSTOMERS") {
    return prisma.user.findMany({ where: { orders: { none: {} } } });
  }

  if (segment === "LOYAL_CUSTOMERS") {
    const users = await prisma.user.findMany({ include: { _count: { select: { orders: true } } } });
    return users.filter((u) => u._count.orders >= LOYAL_ORDER_THRESHOLD);
  }

  if (segment === "INACTIVE_CUSTOMERS") {
    const users = await prisma.user.findMany({
      include: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return users.filter((u) => {
      if (u.orders.length === 0) return false;
      const daysSince = (now - u.orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= INACTIVE_DAYS;
    });
  }

  return [];
}

// Mini App: personal offers the current customer currently qualifies for.
router.get(
  "/for-me",
  telegramUser,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.telegramUser.telegramId },
      include: { _count: { select: { orders: true } }, orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const activeOffers = await prisma.specialOffer.findMany({
      where: { isActive: true },
      include: { promoCode: true },
      orderBy: { createdAt: "desc" },
    });

    const eligible = activeOffers.filter((offer) => {
      if (offer.segment === "ALL") return true;
      if (!user) return offer.segment === "NEW_CUSTOMERS";
      if (offer.segment === "NEW_CUSTOMERS") return user._count.orders === 0;
      if (offer.segment === "LOYAL_CUSTOMERS") return user._count.orders >= LOYAL_ORDER_THRESHOLD;
      if (offer.segment === "INACTIVE_CUSTOMERS") {
        if (user.orders.length === 0) return false;
        const daysSince = (Date.now() - user.orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince >= INACTIVE_DAYS;
      }
      return false;
    });

    res.json(eligible);
  })
);

router.use(requireAdmin);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const offers = await prisma.specialOffer.findMany({
      include: { promoCode: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(offers);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = offerSchema.parse(req.body);
    const offer = await prisma.specialOffer.create({ data });
    res.status(201).json(offer);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = offerSchema.partial().parse(req.body);
    const offer = await prisma.specialOffer.update({ where: { id: Number(req.params.id) }, data });
    res.json(offer);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.specialOffer.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  })
);

// Admin: broadcast the offer as a Telegram notification to every user in
// its target segment right now.
router.post(
  "/:id/send",
  asyncHandler(async (req, res) => {
    const offer = await prisma.specialOffer.findUnique({ where: { id: Number(req.params.id) } });
    if (!offer) return res.status(404).json({ error: "Taklif topilmadi" });

    const users = await resolveSegmentUsers(offer.segment);
    let sent = 0;
    for (const user of users) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await notifyOffer(user.telegramId, offer);
      if (ok) sent += 1;
    }

    const updated = await prisma.specialOffer.update({
      where: { id: offer.id },
      data: { sentAt: new Date(), sentCount: { increment: sent } },
    });

    res.json({ sent, total: users.length, offer: updated });
  })
);

module.exports = router;
