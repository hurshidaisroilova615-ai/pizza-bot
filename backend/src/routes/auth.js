const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const rateLimit = require("express-rate-limit");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { signAdminToken, requireAdmin, invalidateAdminCache } = require("../middleware/adminAuth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring." },
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ error: "Login yoki parol noto'g'ri" });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ error: "Login yoki parol noto'g'ri" });

    const token = signAdminToken(admin);
    res.json({ token, admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } });
  })
);

router.get(
  "/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(req.admin);
  })
);

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring." },
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

// Changing the password also retires every token signed under the old one,
// so an admin login lent out for a trial can be taken back the same minute.
router.put(
  "/password",
  requireAdmin,
  passwordLimiter,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);

    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin.id } });
    if (!admin) return res.status(401).json({ error: "Foydalanuvchi topilmadi" });

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) return res.status(400).json({ error: "Joriy parol noto'g'ri" });

    if (await bcrypt.compare(newPassword, admin.passwordHash)) {
      return res.status(400).json({ error: "Yangi parol eskisidan farq qilishi kerak" });
    }

    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    invalidateAdminCache(admin.id);

    // The admin who made the change keeps working: they get a token signed
    // under the new password.
    res.json({ token: signAdminToken(updated) });
  })
);

module.exports = router;
