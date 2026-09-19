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
    // The language the Mini App is actually showing, which the bot's own
    // messages then follow. Only the three the bot speaks are accepted, so
    // a stale or tampered client can't write anything else onto the record.
    const chosen = ["uz", "ru", "en"].includes(req.body?.language) ? req.body.language : null;
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName,
        lastName,
        username,
        // Only a request that names a language may change it. The Mini App
        // opens with a call that carries none, and letting that one through
        // wiped the customer's choice on every launch — they picked Russian,
        // reopened the app, and the bot went back to Uzbek.
        ...(chosen && { languageCode: chosen }),
        ...(phone !== undefined && { phone }),
      },
      create: {
        telegramId,
        firstName,
        lastName,
        username,
        languageCode: chosen || languageCode,
        phone: phone || null,
      },
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
