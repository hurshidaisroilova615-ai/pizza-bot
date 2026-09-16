const express = require("express");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const telegramUser = require("../middleware/telegramUser");
const { getLoyaltySummary } = require("../lib/loyalty");

const router = express.Router();

// Mini App opens -> create/update the customer record for this Telegram user.
router.post(
  "/upsert",
  telegramUser,
  asyncHandler(async (req, res) => {
    const { telegramId, firstName, lastName, username, languageCode } = req.telegramUser;
    const phone = req.body?.phone;
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName,
        lastName,
        username,
        languageCode,
        ...(phone !== undefined && { phone }),
      },
      create: { telegramId, firstName, lastName, username, languageCode, phone: phone || null },
    });
    res.json(user);
  })
);

// Mini App: the logged-in customer's own profile + loyalty balance.
router.get(
  "/me",
  telegramUser,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { telegramId: req.telegramUser.telegramId } });
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    const loyalty = await getLoyaltySummary(user.id);
    res.json({ ...user, loyalty });
  })
);

module.exports = router;
