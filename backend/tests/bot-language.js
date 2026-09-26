// The bot's own language flow, exercised against the real database.
//
// Telegram is unreachable from here, so the handlers are driven directly:
// what matters is which language is stored, which is offered, and what the
// bot would say afterwards — not that a socket to Telegram opened.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:testpass@localhost:5432/pizzatest";
process.env.BOT_TOKEN = "000:test";
process.env.MINIAPP_PUBLIC_URL =
  process.env.MINIAPP_PUBLIC_URL || "https://smartorder-miniapp.onrender.com";
process.env.RENDER_EXTERNAL_URL =
  process.env.RENDER_EXTERNAL_URL || "https://test-backend.onrender.com";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  messagesFor,
  effectiveLanguage,
  LANGUAGE_CHOICES,
  SUPPORTED,
} = require("../src/lib/botMessages");

let pass = 0,
  fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log("  PASS  " + name);
  } else {
    fail++;
    console.log("  FAIL  " + name + "  " + extra);
  }
};

const BASE = process.env.API_BASE || "http://localhost:4111/api";
const TG = "770077";

(async () => {
  await prisma.user.deleteMany({ where: { telegramId: TG } });

  console.log("\n1) Birinchi /start — til so'raladi");
  // A phone set to Russian, which is only a hint.
  const created = await prisma.user.create({
    data: { telegramId: TG, firstName: "Test", languageCode: "ru-RU" },
  });
  check("a new customer has made no choice", created.language === null, String(created.language));
  check("so the bot would ask", !created.language);
    check(
    "four languages offered",
    LANGUAGE_CHOICES.length === 4,
    String(LANGUAGE_CHOICES.length)
  );
  check(
    "each label is in its own language",
    LANGUAGE_CHOICES.some((c) => c.label.includes("O'zbekcha")) &&
      LANGUAGE_CHOICES.some((c) => c.label.includes("Русский")) &&
      LANGUAGE_CHOICES.some((c) => c.label.includes("English")) &&
      LANGUAGE_CHOICES.some((c) => c.label.includes("Кыргызча")),
    LANGUAGE_CHOICES.map((c) => c.label).join(",")
  );
  check(
    "the prompt is readable in all four",
    messagesFor("ru").chooseLanguage.includes("Tilni") &&
      messagesFor("ru").chooseLanguage.includes("Тил тандаңыз") &&
      messagesFor("ru").chooseLanguage.includes("Выберите") &&
      messagesFor("ru").chooseLanguage.includes("Choose"),
    messagesFor("ru").chooseLanguage
  );

  console.log("\n2) Tanlagandan keyin");
  const chosen = await prisma.user.update({ where: { telegramId: TG }, data: { language: "uz" } });
  check("choice stored", chosen.language === "uz", String(chosen.language));
  check(
    "choice beats the phone's setting",
    effectiveLanguage(chosen) === "uz",
    effectiveLanguage(chosen)
  );
  check(
    "the bot now answers in Uzbek",
    messagesFor(effectiveLanguage(chosen)).orderCreated(1, "1").includes("qabul qilindi"),
    messagesFor(effectiveLanguage(chosen)).orderCreated(1, "1")
  );
  check("and never asks again", Boolean(chosen.language));

  console.log("\n3) Mini App bilan bir xil");
  const res = await fetch(`${BASE}/users/upsert?telegramId=${TG}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TG, language: "en" }),
  });
  check("Mini App may change it", res.status === 200, String(res.status));
  let after = await prisma.user.findUnique({ where: { telegramId: TG } });
  check("and the bot follows", effectiveLanguage(after) === "en", effectiveLanguage(after));

  const me = await fetch(`${BASE}/users/me?telegramId=${TG}`).then((r) => r.json());
  check("Mini App can read the choice back", me.language === "en", String(me.language));

  // The Mini App's opening call carries no language and must not disturb it.
  await fetch(`${BASE}/users/upsert?telegramId=${TG}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TG, firstName: "Test" }),
  });
  after = await prisma.user.findUnique({ where: { telegramId: TG } });
  check("opening the app keeps the choice", after.language === "en", String(after.language));

  console.log("\n4) Telefon sozlamasi alohida saqlanadi");
  check("the phone's setting is still recorded", after.languageCode === "ru-RU", String(after.languageCode));
  check(
    "a customer who never chose falls back to it",
    effectiveLanguage({ language: null, languageCode: "ru-RU" }) === "ru"
  );
  check("junk in the choice is ignored", effectiveLanguage({ language: "klingon", languageCode: "en" }) === "en");
  check("only the four are accepted", SUPPORTED.join(",") === "uz,ky,ru,en", SUPPORTED.join(","));

  console.log("\n5) Qirg'izcha");
  // Kyrgyz used to be answered in Russian, which is what a shop in Osh
  // would have noticed first.
  check("a Kyrgyz phone gets Kyrgyz", effectiveLanguage({ language: null, languageCode: "ky-KG" }) === "ky");
  check(
    "and the bot speaks it",
    messagesFor("ky").greeting.includes("Саламатсызбы"),
    messagesFor("ky").greeting
  );
  check(
    "with its own order wording",
    messagesFor("ky").orderCreated(7, "415").includes("кабыл алынды"),
    messagesFor("ky").orderCreated(7, "415")
  );
  check(
    "and no Uzbek left in it",
    !/Buyurtma|qabul|Jami/.test(messagesFor("ky").orderCreated(7, "415")),
    messagesFor("ky").orderCreated(7, "415")
  );
  // Kazakh and Tajik still land on Russian — they have no table of their own.
  check("Kazakh still reads Russian", effectiveLanguage({ language: null, languageCode: "kk" }) === "ru");

  console.log("\n6) Mini App havolasi to'g'ri do'konni ko'rsatadi");
  // The link the bot opens must name this backend, or a phone that has
  // opened another shop is shown that shop's menu instead.
  const { miniappUrl } = require("../src/bot");
  const stamped = miniappUrl();
  check(
    "the bot's own address is on the link",
    stamped.includes(encodeURIComponent("/api")) || stamped.includes("api="),
    stamped
  );

  await prisma.user.deleteMany({ where: { telegramId: TG } });
  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
