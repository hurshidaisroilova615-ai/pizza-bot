const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const rateLimit = require("express-rate-limit");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { signAdminToken, requireAdmin } = require("../middleware/adminAuth");

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

module.exports = router;
