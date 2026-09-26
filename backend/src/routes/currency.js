const express = require("express");
const { z } = require("zod");
const prisma = require("./../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const { getSettings, invalidateSettingsCache } = require("../lib/settings");

const router = express.Router();

// Moving a whole shop's prices from one currency to another.
//
// The same menu is sold to a cafe in Jizzakh and a cafe in Osh, and the
// numbers on it are not comparable: 60 000 so'm is a pizza, 60 000 som is a
// month's rent. Retyping thirty prices by hand before a demo is how a
// wrong price ends up in front of a customer, so the shop converts itself.
//
// Everything that is money moves together. A menu in som with a delivery
// fee still in so'm is worse than not converting at all, because only one
// of the two is obviously wrong.
const convertSchema = z.object({
  // How many of the old currency make one of the new: 145 so'm to the som.
  rate: z.number().positive().max(1e6),
  // Prices people read should end in round numbers. 5 suits som, 500 or
  // 1000 suits so'm.
  roundTo: z.number().int().positive().max(100000).optional().default(1),
  currency: z.string().trim().min(1).max(10).optional(),
});

function convert(amount, rate, roundTo) {
  if (!amount) return amount;
  const converted = amount / rate;
  return Math.max(roundTo, Math.round(converted / roundTo) * roundTo);
}

// What the change would do, without doing it. An owner about to move every
// price in the shop should see the new menu before agreeing to it.
router.post(
  "/preview",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rate, roundTo } = convertSchema.parse(req.body);
    const [products, settings] = await Promise.all([
      prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 200 }),
      getSettings(),
    ]);

    res.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        before: p.price,
        after: convert(p.price, rate, roundTo),
      })),
      settings: {
        deliveryFee: { before: settings.deliveryFee, after: convert(settings.deliveryFee, rate, roundTo) },
        minOrderAmount: {
          before: settings.minOrderAmount,
          after: convert(settings.minOrderAmount, rate, roundTo),
        },
        freeDeliveryThreshold: {
          before: settings.freeDeliveryThreshold,
          after: convert(settings.freeDeliveryThreshold, rate, roundTo),
        },
      },
    });
  })
);

router.post(
  "/apply",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rate, roundTo, currency } = convertSchema.parse(req.body);

    const changed = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany();
      for (const p of products) {
        await tx.product.update({
          where: { id: p.id },
          data: {
            price: convert(p.price, rate, roundTo),
            oldPrice: p.oldPrice ? convert(p.oldPrice, rate, roundTo) : null,
          },
        });
      }

      // A fixed-amount promo is money; a percentage one is not, and
      // dividing it would quietly destroy the discount.
      const promos = await tx.promoCode.findMany({ where: { type: "FIXED" } });
      for (const promo of promos) {
        await tx.promoCode.update({
          where: { id: promo.id },
          data: {
            value: convert(promo.value, rate, roundTo),
            minOrderAmount: convert(promo.minOrderAmount, rate, roundTo),
          },
        });
      }

      const settings = await tx.settings.findUnique({ where: { id: 1 } });
      await tx.settings.update({
        where: { id: 1 },
        data: {
          deliveryFee: convert(settings.deliveryFee, rate, roundTo),
          minOrderAmount: convert(settings.minOrderAmount, rate, roundTo),
          freeDeliveryThreshold: settings.freeDeliveryThreshold
            ? convert(settings.freeDeliveryThreshold, rate, roundTo)
            : null,
          // A point is worth some money too, and it is the one people
          // notice last.
          loyaltyPointValue: convert(settings.loyaltyPointValue, rate, roundTo),
          ...(currency && { currency }),
        },
      });

      return { products: products.length, promoCodes: promos.length };
    });

    invalidateSettingsCache();
    res.json({ ok: true, ...changed });
  })
);

module.exports = router;
