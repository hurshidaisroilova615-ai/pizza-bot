require("dotenv").config();

// node-telegram-bot-api's long-polling transport can surface raw socket
// errors (e.g. ECONNRESET) as unhandled 'error' events on transient network
// issues. Without this, a single dropped connection would crash the whole
// API server along with the bot. We log and keep running instead.
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET .env faylida majburiy (production uchun)");
  }
  process.env.JWT_SECRET = "dev-only-secret-change-me";
  console.warn("⚠️  JWT_SECRET topilmadi, faqat development uchun vaqtinchalik qiymat ishlatilmoqda.");
}

const prisma = require("./lib/prisma");
const { bot, USE_WEBHOOK, WEBHOOK_PATH, syncMenuButton } = require("./bot");
const errorHandler = require("./middleware/errorHandler");

const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const ordersRouter = require("./routes/orders");
const usersRouter = require("./routes/users");
const customersRouter = require("./routes/customers");
const promoCodesRouter = require("./routes/promoCodes");
const loyaltyRouter = require("./routes/loyalty");
const offersRouter = require("./routes/offers");
const analyticsRouter = require("./routes/analytics");
const settingsRouter = require("./routes/settings");
const authRouter = require("./routes/auth");
const uploadsRouter = require("./routes/uploads");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const allowedOrigins = [
  process.env.MINIAPP_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_ORIGIN || "http://localhost:5174",
].flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean));

// Render assigns each service an *.onrender.com hostname that isn't known
// until after the first deploy, so allow that family too — the real access
// control is the admin JWT and the Telegram initData signature, not CORS.
function isAllowedOrigin(origin) {
  if (allowedOrigins.includes(origin)) return true;
  try {
    return new URL(origin).hostname.endsWith(".onrender.com");
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error("CORS orqali ruxsat berilmagan manzil"));
    },
    credentials: true,
  })
);

if (USE_WEBHOOK) {
  app.post(WEBHOOK_PATH, express.json(), (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  // Whether the instance is holding itself awake cannot be seen from
  // outside, and it is the first thing worth checking when a demo takes
  // half a minute to open — so the health check reports it in words.
  res.json({ status: "ok", time: new Date().toISOString(), keepAwake: keepAwakeReport() });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/users", usersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/promo-codes", promoCodesRouter);
app.use("/api/loyalty", loyaltyRouter);
app.use("/api/offers", offersRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/uploads", uploadsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Manzil topilmadi" });
});

app.use(errorHandler);

async function ensureDefaultAdmin() {
  const existing = await prisma.adminUser.count();
  if (existing > 0) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.warn(
      "⚠️  Hech qanday admin foydalanuvchi topilmadi va ADMIN_USERNAME/ADMIN_PASSWORD berilmagan. Admin panelga kirish uchun ularni .env fayliga qo'shing va serverni qayta ishga tushiring."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.create({ data: { username, passwordHash, name: "Administrator" } });
  console.log(`✅ Boshlang'ich admin foydalanuvchi yaratildi: ${username}`);
}

// A free instance sleeps after fifteen idle minutes, and the first visitor
// then waits the better part of a minute for it to wake — long enough that
// someone being shown the bot for the first time assumes it is broken.
// Requesting our own health endpoint counts as traffic and holds it open.
// Opt-in: it consumes the free tier's monthly instance hours, which is
// worth it while a demo is being shown around and not otherwise.
//
// This can only keep a running instance from going to sleep; nothing
// inside a stopped one can wake it. After a deploy, a crash or a restart,
// the first visitor still waits for the cold start — that is the free
// tier, not a fault here.
const startedAt = Date.now();
let keepAwake = {
  on: false,
  why: "o'chirilgan — Render'da KEEP_AWAKE=true qo'shing",
  target: null,
  pings: 0,
  failures: 0,
  lastPingAt: null,
  lastError: null,
};

// The owner cannot read our logs, so the health page has to answer the
// question on its own: is this switched on, is it actually reaching
// itself, and how long has this instance been up? An instance that is
// genuinely being held awake shows an uptime in hours; one that keeps
// being restarted shows minutes, which says the fault is elsewhere.
function keepAwakeReport() {
  const upMinutes = Math.round((Date.now() - startedAt) / 60000);
  return {
    ...keepAwake,
    uptimeMinutes: upMinutes,
    uptimeHuman: upMinutes >= 60 ? `${Math.floor(upMinutes / 60)} soat ${upMinutes % 60} daqiqa` : `${upMinutes} daqiqa`,
  };
}

function startKeepAwake() {
  const base = process.env.BOT_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;

  if (process.env.KEEP_AWAKE !== "true") {
    console.log(`⏰ ${keepAwake.why}`);
    return;
  }

  if (!base) {
    keepAwake.why =
      "yoqilgan, lekin server o'z manzilini bilmaydi — Render'da RENDER_EXTERNAL_URL yo'q";
    console.warn(`⏰ ${keepAwake.why}`);
    return;
  }

  // Five minutes rather than ten: one ping that fails — a blip, a deploy in
  // progress — then still leaves two more before the fifteen-minute idle
  // window closes. The requests themselves cost nothing; the free tier
  // bills running time, not traffic.
  const FIVE_MINUTES = 5 * 60 * 1000;
  const ping = async () => {
    try {
      const res = await fetch(`${base}/api/health`);
      keepAwake.pings += 1;
      keepAwake.lastPingAt = new Date().toISOString();
      if (!res.ok) {
        keepAwake.failures += 1;
        keepAwake.lastError = `HTTP ${res.status}`;
      } else {
        keepAwake.lastError = null;
      }
    } catch (err) {
      keepAwake.failures += 1;
      keepAwake.lastError = err.message;
      console.error("Keep-awake so'rovi muvaffaqiyatsiz:", err.message);
    }
  };

  // The first one goes now rather than in five minutes, so the health page
  // can be trusted the moment a deploy finishes.
  ping();
  setInterval(ping, FIVE_MINUTES);

  keepAwake.on = true;
  keepAwake.target = `${base}/api/health`;
  keepAwake.why = `yoqilgan — har 5 daqiqada ${keepAwake.target}`;
  console.log(`⏰ ${keepAwake.why}`);
}

const PORT = process.env.PORT || 4000;

ensureDefaultAdmin()
  .catch((err) => console.error("Admin foydalanuvchini yaratishda xatolik:", err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`✅ Backend server http://localhost:${PORT} manzilida ishga tushdi`);
      console.log(`🤖 Telegram bot ${USE_WEBHOOK ? "webhook" : "polling"} rejimida ishlamoqda`);
      // Points the chat's menu button at this deployment's Mini App. Safe to
      // repeat: Telegram just overwrites whatever was there before.
      syncMenuButton();
      startKeepAwake();
    });
  });

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
