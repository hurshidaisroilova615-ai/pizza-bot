// Ordering from the shop's own web address, with no Telegram anywhere.
//
//   PORT=4111 NODE_ENV=test node src/index.js &
//   node tests/web-orders.js
//
// This is the flow a Kyrgyz customer uses, where Telegram is not what
// people have on their phone. Nobody signs the request, so the checks here
// are mostly about the two things that replace a Telegram account: that one
// browser's orders stay that browser's, and that a request cannot claim to
// be somebody else.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:testpass@localhost:5432/pizzatest";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.API_BASE || "http://localhost:4111/api";

// Two separate browsers, each with the id it made for itself.
const ALIYA = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
const BEKZAT = "0f9e8d7c6b5a4938271605f4e3d2c1b0";

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

// No telegramId anywhere — only the header a browser sends.
async function web(guestId, path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(guestId ? { "X-Guest-Id": guestId } : {}),
      ...(opts.headers || {}),
    },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// Logging in once and keeping the token: the server rate-limits repeated
// login attempts, as it should, and a suite that signs in for every call
// eventually locks itself out and fails for a reason that has nothing to
// do with what it was checking.
let adminToken = null;

async function admin(path, opts = {}) {
  if (!adminToken) {
    const login = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    if (login.status !== 200) {
      throw new Error(`admin login failed (${login.status}): ${await login.text()}`);
    }
    adminToken = (await login.json()).token;
  }
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      ...(opts.headers || {}),
    },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// A customer is referenced by their orders, their loyalty history and any
// promo they used, so the rows come off in that order.
async function clearWebCustomers() {
  const users = await prisma.user.findMany({
    where: { telegramId: { startsWith: "web:" } },
    select: { id: true },
  });
  if (!users.length) return;
  const userId = { in: users.map((u) => u.id) };
  await prisma.promoCodeUsage.deleteMany({ where: { userId } });
  await prisma.loyaltyTransaction.deleteMany({ where: { userId } });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

(async () => {
  await clearWebCustomers();

  // The shop has to be open and delivering for any of this to be reachable.
  await admin("/settings", {
    method: "PUT",
    body: JSON.stringify({
      deliveryEnabled: true,
      pickupEnabled: true,
      openTime: "00:00",
      closeTime: "23:59",
      minOrderAmount: 0,
    }),
  });

  const products = await prisma.product.findMany({ where: { isAvailable: true }, take: 1 });
  if (!products.length) throw new Error("no available product to order — run the seed first");
  const item = { productId: products[0].id, quantity: 2 };

  console.log("\n1) Telegramsiz mijoz taniladi");
  const me = await web(ALIYA, "/users/upsert", { method: "POST", body: JSON.stringify({}) });
  check("a browser id is accepted", me.status === 200, JSON.stringify(me.body));
  check(
    "and opens an account of its own",
    me.body.telegramId === `web:${ALIYA}`,
    String(me.body.telegramId)
  );

  console.log("\n2) Soxta so'rov Telegram mijoziga tusha olmaydi");
  // The prefix is the guarantee: whatever a header says, it can never name
  // a Telegram account, because those are always numbers.
  const forged = await web("555001", "/users/upsert", { method: "POST", body: JSON.stringify({}) });
  check("a short id is refused outright", forged.status === 401, String(forged.status));
  const forged2 = await web(
    "555001555001555001",
    "/users/upsert",
    { method: "POST", body: JSON.stringify({}) }
  );
  check(
    "a long numeric id lands under web:, not on the Telegram account",
    forged2.body.telegramId === "web:555001555001555001",
    String(forged2.body.telegramId)
  );

  console.log("\n3) Ism va telefonsiz buyurtma qabul qilinmaydi");
  const noName = await web(ALIYA, "/orders", {
    method: "POST",
    body: JSON.stringify({ items: [item], orderType: "DELIVERY" }),
  });
  check("a nameless order is refused", noName.status === 400, String(noName.status));
  const noPhone = await web(ALIYA, "/orders", {
    method: "POST",
    body: JSON.stringify({ items: [item], orderType: "DELIVERY", customerName: "Aliya" }),
  });
  check("a phoneless order is refused", noPhone.status === 400, JSON.stringify(noPhone.body));
  const noAddress = await web(ALIYA, "/orders", {
    method: "POST",
    body: JSON.stringify({
      items: [item],
      orderType: "DELIVERY",
      customerName: "Aliya",
      phone: "+996 555 12 34 56",
    }),
  });
  check("a delivery with no address is refused", noAddress.status === 400, JSON.stringify(noAddress.body));

  console.log("\n4) To'liq buyurtma o'tadi");
  const placed = await web(ALIYA, "/orders", {
    method: "POST",
    body: JSON.stringify({
      items: [item],
      orderType: "DELIVERY",
      paymentMethod: "CASH",
      customerName: "Aliya",
      phone: "+996 555 12 34 56",
      deliveryAddress: "Osh, Kurmanjan Datka 12",
    }),
  });
  check("the order is created", placed.status === 201, JSON.stringify(placed.body));
  check("it carries a number to quote", Number.isInteger(placed.body.id), String(placed.body.id));
  check("the name reached the account", placed.body.user?.firstName === "Aliya", String(placed.body.user?.firstName));
  check("the phone is on the order", Boolean(placed.body.phone), String(placed.body.phone));

  // Opening the app again sends no name at all; the stored one must survive.
  await web(ALIYA, "/users/upsert", { method: "POST", body: JSON.stringify({}) });
  const stored = await prisma.user.findUnique({ where: { telegramId: `web:${ALIYA}` } });
  check("re-opening the site does not erase the name", stored.firstName === "Aliya", String(stored.firstName));

  console.log("\n5) Har bir brauzer faqat o'zinikini ko'radi");
  const mine = await web(ALIYA, "/orders/me/list");
  check("the browser that ordered sees it", mine.body.some((o) => o.id === placed.body.id));
  const theirs = await web(BEKZAT, "/orders/me/list");
  check("another browser sees nothing", Array.isArray(theirs.body) && theirs.body.length === 0, JSON.stringify(theirs.body));

  console.log("\n6) Raqam va telefon orqali topish");
  const found = await fetch(`${BASE}/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Written differently from how it was given: same person, same order.
    body: JSON.stringify({ orderId: placed.body.id, phone: "0555123456" }),
  });
  const foundBody = await found.json();
  check("the right pair finds the order", found.status === 200, JSON.stringify(foundBody));
  check("with its status", Boolean(foundBody.status), String(foundBody.status));
  check("and its items", Array.isArray(foundBody.items) && foundBody.items.length > 0);
  check("but not the account behind it", !("telegramId" in foundBody) && !("user" in foundBody), Object.keys(foundBody).join(","));

  const wrongPhone = await fetch(`${BASE}/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: placed.body.id, phone: "+996 700 00 00 00" }),
  });
  check("a wrong phone finds nothing", wrongPhone.status === 404, String(wrongPhone.status));

  const wrongId = await fetch(`${BASE}/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: 999999, phone: "+996 555 12 34 56" }),
  });
  check("a number that is not theirs finds nothing", wrongId.status === 404, String(wrongId.status));
  // Both wrong answers must read the same, or the endpoint would confirm
  // which order numbers exist to anyone who tried them in turn.
  const a = await wrongPhone.json();
  const b = await wrongId.json();
  check("and both refusals say the same thing", a.error === b.error, `${a.error} | ${b.error}`);

  console.log("\n7) Olib ketishda manzil so'ralmaydi");
  const pickup = await web(BEKZAT, "/orders", {
    method: "POST",
    body: JSON.stringify({
      items: [item],
      orderType: "PICKUP",
      customerName: "Bekzat",
      phone: "0770 11 22 33",
    }),
  });
  check("a collection order needs no address", pickup.status === 201, JSON.stringify(pickup.body));
  check("and is charged no delivery fee", pickup.body.deliveryFee === 0, String(pickup.body.deliveryFee));

  console.log("\n8) Zaldan buyurtma — stoldagi QR kod orqali");
  // A customer sitting at a table scanned the code on it. They are in the
  // room, so nothing about delivery applies: no address, no fee, and the
  // name and phone a delivery needs would only be a form in the way.
  await admin("/settings", { method: "PUT", body: JSON.stringify({ dineInEnabled: true }) });

  const seated = await web(BEKZAT, "/orders", {
    method: "POST",
    body: JSON.stringify({ items: [item], orderType: "DINE_IN", tableNumber: "7" }),
  });
  check("no name, phone or address is asked for", seated.status === 201, JSON.stringify(seated.body));
  check("the table is on the order", seated.body.tableNumber === "7", String(seated.body.tableNumber));
  check("nothing is charged for delivery", seated.body.deliveryFee === 0, String(seated.body.deliveryFee));
  check("and no address is stored", seated.body.deliveryAddress === null, String(seated.body.deliveryAddress));
  check(
    "the kitchen sees the table as the customer",
    seated.body.user?.firstName === "Stol 7",
    String(seated.body.user?.firstName)
  );

  const noTable = await web(BEKZAT, "/orders", {
    method: "POST",
    body: JSON.stringify({ items: [item], orderType: "DINE_IN" }),
  });
  check("an order with no table is refused", noTable.status === 400, JSON.stringify(noTable.body));

  await admin("/settings", { method: "PUT", body: JSON.stringify({ dineInEnabled: false }) });
  const off = await web(BEKZAT, "/orders", {
    method: "POST",
    body: JSON.stringify({ items: [item], orderType: "DINE_IN", tableNumber: "7" }),
  });
  check("a shop that does not seat people refuses it", off.status === 400, String(off.status));
  await admin("/settings", { method: "PUT", body: JSON.stringify({ dineInEnabled: true }) });

  // The words a seated customer reads must not be a courier's.
  const { statusLabel, orderTypeLabel } = require("../src/lib/orderLabels");
  check(
    "the status reads for a room, not a road",
    statusLabel({ orderType: "DINE_IN", status: "ON_DELIVERY" }) === "Tayyor, olib kelinmoqda 🍽",
    statusLabel({ orderType: "DINE_IN", status: "ON_DELIVERY" })
  );
  check(
    "the alert names the table",
    orderTypeLabel("DINE_IN", "7").includes("Stol 7"),
    orderTypeLabel("DINE_IN", "7")
  );

  console.log("\n9) Telegramsiz mijozga xabar yuborilmaydi");
  // notifySafe skips non-numeric chat ids; if it did not, the order above
  // would have thrown on its way out to Telegram, which is unreachable here.
  check("placing an order did not try to message Telegram", pickup.status === 201);

  await clearWebCustomers();
  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
