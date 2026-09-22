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
        // A web customer's name arrives with their first order and not on
        // every app open, so an empty one means "unchanged", never "erase
        // the name they already gave". Same reasoning as the two fields
        // below it.
        ...(firstName && { firstName }),
        lastName,
        username,
        // Telegram's own setting is refreshed when the request actually
        // carries one. A call that does not know it — the Mini App opened
        // outside Telegram, an older client — must not erase what is on
        // record, or a customer who never chose explicitly loses the only
        // thing the bot had to go on. The choice itself lives in `language`
        // and changes only when a request names one, for the same reason.
        ...(languageCode && { languageCode }),
        ...(chosen && { language: chosen }),
        ...(phone !== undefined && { phone }),
      },
      create: {
        telegramId,
        firstName,
        lastName,
        username,
        languageCode,
        language: chosen,
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
