const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET;

// A token carries a fingerprint of the password it was signed under. Change
// the password and every token issued before it stops working — which is
// what makes it safe to hand the admin login to someone for a trial and
// take it back afterwards, instead of leaving their session alive until the
// token expires a week later.
function passwordVersion(passwordHash) {
  return passwordHash.slice(-12);
}

// Checking that fingerprint costs one row read, and an admin page fires a
// handful of requests at once, so the row is cached for a moment.
const CACHE_MS = 30 * 1000;
const adminCache = new Map();

async function loadAdmin(id) {
  const cached = adminCache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.admin;

  const admin = await prisma.adminUser.findUnique({ where: { id } });
  adminCache.set(id, { admin, expiresAt: Date.now() + CACHE_MS });
  return admin;
}

function invalidateAdminCache(id) {
  if (id === undefined) adminCache.clear();
  else adminCache.delete(id);
}

async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Sessiya muddati tugagan, qayta kiring" });
  }

  try {
    const admin = await loadAdmin(payload.id);
    if (!admin || passwordVersion(admin.passwordHash) !== payload.pv) {
      return res.status(401).json({ error: "Sessiya bekor qilingan, qaytadan kiring" });
    }

    req.admin = { id: admin.id, username: admin.username, name: admin.name, role: admin.role };
    next();
  } catch (err) {
    next(err);
  }
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      pv: passwordVersion(admin.passwordHash),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = { requireAdmin, signAdminToken, invalidateAdminCache };
