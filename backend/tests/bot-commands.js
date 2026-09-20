// Drives the bot's own command handlers, the way Telegram drives them.
//
// Run with: npm run test:commands
//
// This exists because /start silently stopped replying in production while
// everything else — order alerts, the menu button — kept working. Nothing
// in the other suites touched a command handler, so nothing caught it. Here
// the update goes in exactly as Telegram delivers it and the reply is
// captured on its way out, so a handler that throws fails the run instead
// of failing quietly in front of a customer.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:testpass@localhost:5432/pizzatest";
process.env.BOT_TOKEN = process.env.BOT_TOKEN || "000:test";
process.env.MINIAPP_PUBLIC_URL =
  process.env.MINIAPP_PUBLIC_URL || "https://smartorder-miniapp.onrender.com";
process.env.RENDER_EXTERNAL_URL =
  process.env.RENDER_EXTERNAL_URL || "https://test-backend.onrender.com";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { bot } = require("../src/bot");

let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log("  PASS  " + name);
  } else {
    fail++;
    console.log("  FAIL  " + name + "  " + extra);
  }
};

// Telegram is unreachable from a test box, and it is not what is being
// tested: what matters is that the handler runs to the end and hands a
// sendable message over. Both outgoing calls are captured instead of sent.
const sent = [];
const answered = [];
const thrown = [];
bot.sendMessage = async (chatId, text, opts) => {
  sent.push({ chatId, text, opts });
  return { message_id: sent.length, chat: { id: chatId } };
};
bot.answerCallbackQuery = async (id, opts) => {
  answered.push({ id, opts });
  return true;
};
bot.editMessageReplyMarkup = async () => true;
process.on("unhandledRejection", (err) => thrown.push(String(err && err.message)));

const TG = 880088;
const user = (extra = {}) => ({
  id: TG,
  is_bot: false,
  first_name: "Xurshida",
  language_code: "ru",
  ...extra,
});

// processUpdate is what the polling loop calls for every incoming update,
// so this is the same door a real message comes through.
function send(text) {
  bot.processUpdate({
    update_id: Math.floor(Math.random() * 1e9),
    message: { message_id: 1, from: user(), chat: { id: TG, type: "private" }, date: 0, text },
  });
}

function tapButton(data) {
  bot.processUpdate({
    update_id: Math.floor(Math.random() * 1e9),
    callback_query: {
      id: "cb1",
      from: user(),
      data,
      message: { message_id: 1, chat: { id: TG, type: "private" } },
    },
  });
}

const settle = (ms = 700) => new Promise((r) => setTimeout(r, ms));

// A message Telegram would refuse is as good as no message at all, so the
// checks below hold every reply to what its API actually requires.
function isSendable(msg) {
  if (!msg) return "nothing was sent";
  if (typeof msg.text !== "string" || !msg.text.trim()) return `text is ${JSON.stringify(msg.text)}`;
  if (msg.text.includes("undefined")) return "text contains the word undefined";
  const rows = msg.opts?.reply_markup?.inline_keyboard || [];
  for (const row of rows) {
    for (const btn of row) {
      if (!btn.text) return "a button has no label";
      if (btn.web_app) {
        try {
          const u = new URL(btn.web_app.url);
          if (u.protocol !== "https:") return `web_app url is not https: ${btn.web_app.url}`;
        } catch {
          return `web_app url is not a url: ${btn.web_app.url}`;
        }
      }
      if (!btn.web_app && !btn.callback_data && !btn.url) return "a button does nothing";
    }
  }
  return null;
}

(async () => {
  await prisma.user.deleteMany({ where: { telegramId: String(TG) } });

  console.log("\n1) Birinchi /start — til so'raydi");
  sent.length = 0;
  send("/start");
  await settle();
  check("/start replies at all", sent.length > 0, "no reply — the handler threw");
  let problem = isSendable(sent[0]);
  check("the reply is one Telegram would accept", problem === null, problem || "");
  const buttons = (sent[0]?.opts?.reply_markup?.inline_keyboard || []).flat();
  check("three language buttons", buttons.length === 3, String(buttons.length));
  check(
    "each carries a language",
    buttons.every((b) => /^lang:(uz|ru|en)$/.test(b.callback_data || "")),
    JSON.stringify(buttons.map((b) => b.callback_data))
  );

  console.log("\n2) Tilni tanlash");
  sent.length = 0;
  answered.length = 0;
  tapButton("lang:uz");
  await settle();
  check("the tap is acknowledged", answered.length === 1, String(answered.length));
  check("a welcome follows", sent.length > 0, "no welcome after choosing");
  problem = isSendable(sent[0]);
  check("the welcome is sendable", problem === null, problem || "");
  check(
    "it is in the language just chosen",
    (sent[0]?.text || "").includes("Assalomu alaykum"),
    (sent[0]?.text || "").slice(0, 40)
  );
  const stored = await prisma.user.findUnique({ where: { telegramId: String(TG) } });
  check("the choice is stored", stored?.language === "uz", String(stored?.language));

  console.log("\n3) Ikkinchi /start — endi so'ramaydi");
  sent.length = 0;
  send("/start");
  await settle();
  check("/start replies", sent.length > 0, "no reply on a repeat /start");
  problem = isSendable(sent[0]);
  check("the reply is sendable", problem === null, problem || "");
  check(
    "it is the welcome, not the question",
    !(sent[0]?.opts?.reply_markup?.inline_keyboard || []).flat().some((b) => b.callback_data),
    "asked for the language again"
  );
  check(
    "the order button is on it",
    (sent[0]?.opts?.reply_markup?.inline_keyboard || []).flat().some((b) => b.web_app),
    "no Mini App button"
  );

  console.log("\n4) Boshqa buyruqlar");
  for (const cmd of ["/til", "/help", "/id", "/orders"]) {
    sent.length = 0;
    send(cmd);
    await settle(500);
    const p = isSendable(sent[0]);
    check(`${cmd} replies and is sendable`, sent.length > 0 && p === null, p || "no reply");
  }

  console.log("\n5) Hech narsa jimgina yiqilmadi");
  check("no unhandled errors", thrown.length === 0, thrown.join(" | "));

  await prisma.user.deleteMany({ where: { telegramId: String(TG) } });
  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
