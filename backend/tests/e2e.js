// End-to-end checks against a running server and a real Postgres.
//
//   createdb pizzatest && DATABASE_URL=... npx prisma migrate deploy
//   PORT=4111 NODE_ENV=test node src/index.js &
//   DATABASE_URL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... node tests/e2e.js
//
// These exercise the rules an owner's money depends on — trading hours,
// delivery versus collection, what card payment does, what happens when a
// dish sells out — through the HTTP API rather than by calling functions,
// so a change to a route is caught the same way a customer would find it.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:testpass@localhost:5432/pizzatest";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.API_BASE || "http://localhost:4111/api";
const TG = { id: 555001, first_name: "Test" };

async function call(path, opts = {}) {
  // NODE_ENV is not "production" here, so the Mini App middleware accepts a
  // telegramId from the query string — the same fallback used for local
  // browser testing outside Telegram.
  const url = BASE + path + (path.includes("?") ? "&" : "?") + `telegramId=${TG.id}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name + "  " + extra); }
}

let adminAuth = null;

// Goes through the admin API rather than straight to the table, so each
// scenario also exercises the settings validation and the cache
// invalidation the panel relies on.
async function setSettings(patch) {
  const r = await call("/settings", { method: "PUT", headers: adminAuth, body: JSON.stringify(patch) });
  if (r.status !== 200) throw new Error("setSettings failed: " + JSON.stringify(r.body));
}

(async () => {
  const login0 = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }),
  });
  if (login0.status !== 200) throw new Error("admin login failed: " + JSON.stringify(login0.body));
  adminAuth = { Authorization: `Bearer ${login0.body.token}` };

  // --- fixtures -----------------------------------------------------------
  // Clear anything a previous run left behind, so the suite can be run twice
  // against the same database.
  await prisma.orderItem.updateMany({
    where: { product: { name: { startsWith: "Test " } } },
    data: { productId: null },
  });
  await prisma.productRecommendation.deleteMany({
    where: { product: { name: { startsWith: "Test " } } },
  });
  await prisma.product.deleteMany({ where: { name: { startsWith: "Test " } } });
  await prisma.category.deleteMany({ where: { name: "Test" } });

  const cat = await prisma.category.create({ data: { name: "Test" } });
  const pizza = await prisma.product.create({
    data: { name: "Test Pitsa", imageUrl: "http://x/i.png", price: 50000, categoryId: cat.id },
  });
  const soda = await prisma.product.create({
    data: { name: "Test Cola", imageUrl: "http://x/c.png", price: 10000, categoryId: cat.id },
  });

  const items = [{ productId: pizza.id, quantity: 1 }];

  console.log("\n1) Yopiq vaqt (closed hours)");
  await setSettings({
    openTime: "09:00", closeTime: "18:00", timezoneOffset: 5,
    deliveryEnabled: true, pickupEnabled: true, cardPaymentEnabled: false,
    deliveryFee: 15000, freeDeliveryThreshold: 0, minOrderAmount: 0,
  });
  let now = new Date();
  const localHour = (now.getUTCHours() + 5) % 24;
  const openNow = localHour >= 9 && localHour < 18;
  console.log(`  (server local hour ${localHour}, shop 09:00-18:00 -> ${openNow ? "open" : "closed"})`);
  // Force a window that is definitely closed right now.
  const closedOpen = String((localHour + 2) % 24).padStart(2, "0") + ":00";
  const closedClose = String((localHour + 4) % 24).padStart(2, "0") + ":00";
  await setSettings({ openTime: closedOpen, closeTime: closedClose });
  let r = await call("/orders", { method: "POST", body: JSON.stringify({ items, orderType: "DELIVERY" }) });
  check("closed shop rejects the order", r.status === 400, JSON.stringify(r.body));
  check("message names the hours", String(r.body.error || "").includes(closedOpen), JSON.stringify(r.body));

  const pub = await call("/settings");
  check("public settings report closed", pub.body.opening?.isOpen === false, JSON.stringify(pub.body.opening));

  console.log("\n2) Ochiq vaqt + yetkazib berish");
  const openOpen = String((localHour + 23) % 24).padStart(2, "0") + ":00";
  const openClose = String((localHour + 2) % 24).padStart(2, "0") + ":00";
  await setSettings({ openTime: openOpen, closeTime: openClose });
  const pub2 = await call("/settings");
  check("public settings report open", pub2.body.opening?.isOpen === true, JSON.stringify(pub2.body.opening));

  r = await call("/orders", {
    method: "POST",
    body: JSON.stringify({ items, orderType: "DELIVERY", deliveryAddress: "Amir Temur 12", phone: "+998901112233" }),
  });
  check("delivery order accepted", r.status === 201, JSON.stringify(r.body));
  check("delivery fee charged", r.body.deliveryFee === 15000, "fee=" + r.body.deliveryFee);
  check("address kept", r.body.deliveryAddress === "Amir Temur 12", r.body.deliveryAddress);
  check("orderType DELIVERY", r.body.orderType === "DELIVERY", r.body.orderType);
  check("paymentMethod defaults CASH", r.body.paymentMethod === "CASH", r.body.paymentMethod);

  console.log("\n3) Olib ketish (pickup)");
  let q = await call("/orders/quote", { method: "POST", body: JSON.stringify({ items, orderType: "PICKUP" }) });
  check("quote: pickup has no delivery fee", q.body.deliveryFee === 0, "fee=" + q.body.deliveryFee);
  q = await call("/orders/quote", { method: "POST", body: JSON.stringify({ items, orderType: "DELIVERY" }) });
  check("quote: delivery has the fee", q.body.deliveryFee === 15000, "fee=" + q.body.deliveryFee);

  r = await call("/orders", {
    method: "POST",
    body: JSON.stringify({ items, orderType: "PICKUP", deliveryAddress: "ignored", phone: "+998901112233" }),
  });
  check("pickup order accepted", r.status === 201, JSON.stringify(r.body));
  check("pickup fee is zero", r.body.deliveryFee === 0, "fee=" + r.body.deliveryFee);
  check("pickup address nulled", r.body.deliveryAddress === null, String(r.body.deliveryAddress));
  check("orderType PICKUP", r.body.orderType === "PICKUP", r.body.orderType);

  console.log("\n4) O'chirilgan turlar (disabled options)");
  await setSettings({ pickupEnabled: false });
  r = await call("/orders", { method: "POST", body: JSON.stringify({ items, orderType: "PICKUP" }) });
  check("pickup rejected when disabled", r.status === 400, JSON.stringify(r.body));

  await setSettings({ pickupEnabled: true, deliveryEnabled: false });
  r = await call("/orders", { method: "POST", body: JSON.stringify({ items, orderType: "DELIVERY" }) });
  check("delivery rejected when disabled", r.status === 400, JSON.stringify(r.body));

  await setSettings({ deliveryEnabled: true });
  r = await call("/orders", { method: "POST", body: JSON.stringify({ items, orderType: "PICKUP", paymentMethod: "CARD" }) });
  check("card rejected when disabled", r.status === 400, JSON.stringify(r.body));

  await setSettings({ cardPaymentEnabled: true });
  r = await call("/orders", { method: "POST", body: JSON.stringify({ items, orderType: "PICKUP", paymentMethod: "CARD" }) });
  check("card accepted when enabled", r.status === 201, JSON.stringify(r.body));
  check("paymentMethod CARD stored", r.body.paymentMethod === "CARD", r.body.paymentMethod);

  console.log("\n4b) Karta to'lovi sozlanmagan");
  await setSettings({ cardPaymentEnabled: true, cardPaymentDetails: null, cardPaymentHolder: null });
  r = await call("/orders", { method: "POST", body: JSON.stringify({ items, orderType: "PICKUP", paymentMethod: "CARD" }) });
  check("card refused with no card number", r.status === 400, JSON.stringify(r.body));
  check("card option hidden from the Mini App", !(await call("/settings")).body.cardPaymentDetails, "details leaked");

  await setSettings({ cardPaymentDetails: "8600 0000 0000 0000", cardPaymentHolder: "Test T." });
  r = await call("/orders", { method: "POST", body: JSON.stringify({ items, orderType: "PICKUP", paymentMethod: "CARD" }) });
  check("card accepted once a number is set", r.status === 201, JSON.stringify(r.body));
  const pubCard = await call("/settings");
  check("Mini App can show the card number", pubCard.body.cardPaymentDetails === "8600 0000 0000 0000", JSON.stringify(pubCard.body.cardPaymentDetails));

  console.log("\n5) Tugadi (sold out)");
  await prisma.product.update({ where: { id: soda.id }, data: { isAvailable: false } });
  const cat2 = await call("/products");
  const names = cat2.body.map((p) => p.name);
  check("sold-out dish still listed", names.includes("Test Cola"), names.join(","));
  // Relative, not absolute: the point is that selling out does not move a
  // dish, and the database may hold a real catalog alongside the fixtures.
  check(
    "sold-out dish keeps its place in the menu",
    names.indexOf("Test Cola") === names.indexOf("Test Pitsa") + 1,
    names.join(",")
  );
  const listed = cat2.body.find((p) => p.name === "Test Cola");
  check("listed as unavailable", listed.isAvailable === false, String(listed.isAvailable));

  const mixed = [{ productId: pizza.id, quantity: 1 }, { productId: soda.id, quantity: 2 }];
  q = await call("/orders/quote", { method: "POST", body: JSON.stringify({ items: mixed, orderType: "PICKUP" }) });
  check("quote flags the sold-out item", q.body.unavailableItems?.length === 1, JSON.stringify(q.body.unavailableItems));
  check("quote names it", q.body.unavailableItems?.[0]?.name === "Test Cola", JSON.stringify(q.body.unavailableItems));

  r = await call("/orders", { method: "POST", body: JSON.stringify({ items: mixed, orderType: "PICKUP" }) });
  check("order with sold-out item rejected", r.status === 400, JSON.stringify(r.body));

  const top = await call("/products/top");
  check("sold-out dish not in top list", !top.body.some((p) => p.name === "Test Cola"), JSON.stringify(top.body.map(p=>p.name)));

  console.log("\n6) Admin availability toggle");
  const auth = adminAuth;
  r = await call(`/products/${soda.id}/availability`, {
    method: "PATCH", headers: auth, body: JSON.stringify({ isAvailable: true }),
  });
  check("toggle back in stock", r.status === 200 && r.body.isAvailable === true, JSON.stringify(r.body));
  r = await call(`/products/${soda.id}/availability`, {
    method: "PATCH", body: JSON.stringify({ isAvailable: false }),
  });
  check("toggle needs admin auth", r.status === 401, JSON.stringify(r.body));

  console.log("\n6b) Til (language)");
  const { pickLanguage, statusLabelFor } = require("../src/lib/botMessages");
  check("russian phone -> russian", pickLanguage("ru-RU") === "ru");
  // Kyrgyz used to be answered in Russian because there was no table for
  // it. There is now, so a phone set to it gets its own language.
  check("kyrgyz phone -> kyrgyz", pickLanguage("ky") === "ky", pickLanguage("ky"));
  check("kazakh phone -> russian", pickLanguage("kk") === "ru", pickLanguage("kk"));
  check("english phone -> english", pickLanguage("en-GB") === "en");
  check("unknown phone -> uzbek", pickLanguage("de") === "uz", pickLanguage("de"));
  check(
    "pickup status worded for collection",
    statusLabelFor({ status: "ON_DELIVERY", orderType: "PICKUP" }, "ru").includes("забирать"),
    statusLabelFor({ status: "ON_DELIVERY", orderType: "PICKUP" }, "ru")
  );

  const LANG_USER = 909090;
  await fetch(`${BASE}/users/upsert?telegramId=${LANG_USER}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: LANG_USER, language: "ru" }),
  });
  let langUser = await prisma.user.findUnique({ where: { telegramId: String(LANG_USER) } });
  check("chosen language stored", langUser.languageCode === "ru", String(langUser.languageCode));

  // The Mini App's own opening call carries no language; it must not wipe
  // the choice the customer made.
  await fetch(`${BASE}/users/upsert?telegramId=${LANG_USER}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: LANG_USER, firstName: "Test" }),
  });
  langUser = await prisma.user.findUnique({ where: { telegramId: String(LANG_USER) } });
  check("a later call without a language keeps it", langUser.languageCode === "ru", String(langUser.languageCode));

  await fetch(`${BASE}/users/upsert?telegramId=${LANG_USER}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: LANG_USER, language: "klingon" }),
  });
  langUser = await prisma.user.findUnique({ where: { telegramId: String(LANG_USER) } });
  check("an unsupported language is refused", langUser.languageCode === "ru", String(langUser.languageCode));

  console.log("\n7) Ish vaqti belgilanmagan (no hours set = always open)");
  await setSettings({ openTime: null, closeTime: null });
  const pub3 = await call("/settings");
  check("open when no hours configured", pub3.body.opening?.isOpen === true, JSON.stringify(pub3.body.opening));

  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
