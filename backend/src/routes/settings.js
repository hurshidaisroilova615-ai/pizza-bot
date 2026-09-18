const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const { getSettings, invalidateSettingsCache } = require("../lib/settings");

const router = express.Router();

// Public: the Mini App reads branding/business rules on load (name,
// currency, delivery fee, loyalty rate) so nothing about the business is
// hardcoded in the frontend.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Everything here is branding the Mini App needs, except the owner's
    // alert recipients — those are nobody else's business.
    const { orderNotifyChatIds, ...publicSettings } = await getSettings();
    res.json(publicSettings);
  })
);

// Admin: the same settings including the alert recipients, which the
// public endpoint withholds.
router.get(
  "/admin",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await getSettings());
  })
);

const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(100).optional(),
  businessType: z.string().trim().min(1).max(50).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  logoUrl: z.string().trim().url().nullable().optional(),
  primaryColor: z.string().trim().max(20).optional(),
  deliveryFee: z.number().int().nonnegative().optional(),
  freeDeliveryThreshold: z.number().int().nonnegative().nullable().optional(),
  minOrderAmount: z.number().int().nonnegative().optional(),
  loyaltyEnabled: z.boolean().optional(),
  loyaltyEarnRate: z.number().min(0).max(1).optional(),
  loyaltyPointValue: z.number().int().positive().optional(),
  supportPhone: z.string().trim().max(30).nullable().optional(),
  supportUsername: z.string().trim().max(60).nullable().optional(),
  orderNotifyChatIds: z.string().trim().max(300).nullable().optional(),
  welcomeMessage: z.string().trim().max(500).nullable().optional(),
  aboutText: z.string().trim().max(2000).nullable().optional(),
});

router.put(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    invalidateSettingsCache();
    res.json(settings);
  })
);

module.exports = router;
