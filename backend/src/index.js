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
const { bot, USE_WEBHOOK, WEBHOOK_PATH } = require("./bot");
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
  res.json({ status: "ok", time: new Date().toISOString(), keepAwake: keepAwakeStatus });
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
let keepAwakeStatus = "o'chirilgan";

function startKeepAwake() {
  const base = process.env.BOT_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;

  if (process.env.KEEP_AWAKE !== "true") {
    keepAwakeStatus = "o'chirilgan — Render'da KEEP_AWAKE=true qo'shing";
    console.log(`⏰ ${keepAwakeStatus}`);
    return;
  }

  if (!base) {
    keepAwakeStatus = "yoqilgan, lekin server o'z manzilini bilmaydi (RENDER_EXTERNAL_URL yo'q)";
    console.warn(`⏰ ${keepAwakeStatus}`);
    return;
  }

  // Five minutes rather than ten: one ping that fails — a blip, a deploy in
  // progress — then still leaves two more before the fifteen-minute idle
  // window closes. The requests themselves cost nothing; the free tier
  // bills running time, not traffic.
  const FIVE_MINUTES = 5 * 60 * 1000;
  setInterval(() => {
    fetch(`${base}/api/health`).catch((err) =>
      console.error("Keep-awake so'rovi muvaffaqiyatsiz:", err.message)
    );
  }, FIVE_MINUTES).unref();

  keepAwakeStatus = `yoqilgan — har 5 daqiqada ${base}/api/health`;
  console.log(`⏰ ${keepAwakeStatus}`);
}

const PORT = process.env.PORT || 4000;

ensureDefaultAdmin()
  .catch((err) => console.error("Admin foydalanuvchini yaratishda xatolik:", err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`✅ Backend server http://localhost:${PORT} manzilida ishga tushdi`);
      console.log(`🤖 Telegram bot ${USE_WEBHOOK ? "webhook" : "polling"} rejimida ishlamoqda`);
      startKeepAwake();
    });
  });

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
