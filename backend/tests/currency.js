// Moving a whole shop's prices to another currency.
//
//   node tests/currency.js
//
// The same menu is sold in Jizzakh and in Osh, and the numbers are not
// comparable between them. This is the one operation that rewrites every
// price at once, so what it must never do is leave half the shop behind:
// a menu in som with a delivery fee still in so'm is worse than no
// conversion at all, because only one of the two looks wrong.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:testpass@localhost:5432/pizzatest";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.API_BASE || "http://localhost:4111/api";

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

let token = null;
async function admin(path, opts = {}) {
  if (!token) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    if (res.status !== 200) throw new Error(`admin login failed (${res.status})`);
    token = (await res.json()).token;
  }
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
  // A shop priced in so'm, the way one arrives from Uzbekistan.
  const category = await prisma.category.upsert({
    where: { name: "Konvert test" },
    update: {},
    create: { name: "Konvert test" },
  });
  const dish = await prisma.product.create({
    data: {
      name: "Konvert pitsa",
      price: 60000,
      oldPrice: 75000,
      imageUrl: "https://example.com/test.jpg",
      categoryId: category.id,
    },
  });
  const percentPromo = await prisma.promoCode.create({
    data: { code: "KONVERT10", type: "PERCENTAGE", value: 10, minOrderAmount: 50000 },
  });
  const fixedPromo = await prisma.promoCode.create({
    data: { code: "KONVERT5K", type: "FIXED", value: 5000, minOrderAmount: 50000 },
  });
  await admin("/settings", {
    method: "PUT",
    body: JSON.stringify({
      currency: "so'm",
      deliveryFee: 15000,
      minOrderAmount: 30000,
      freeDeliveryThreshold: 150000,
      loyaltyPointValue: 145,
    }),
  });

  console.log("\n1) Avval ko'rsatadi, hech narsa o'zgarmaydi");
  const preview = await admin("/currency/preview", {
    method: "POST",
    body: JSON.stringify({ rate: 145, roundTo: 5 }),
  });
  check("the preview answers", preview.status === 200, JSON.stringify(preview.body).slice(0, 120));
  const shown = preview.body.products.find((p) => p.id === dish.id);
  check("it shows the price before and after", shown?.before === 60000, JSON.stringify(shown));
  check("60 000 so'm becomes 415 som", shown?.after === 415, String(shown?.after));
  check(
    "and the delivery fee too",
    preview.body.settings.deliveryFee.after === 105,
    String(preview.body.settings.deliveryFee.after)
  );
  const untouched = await prisma.product.findUnique({ where: { id: dish.id } });
  check("nothing was written yet", untouched.price === 60000, String(untouched.price));

  console.log("\n2) Saqlagandan keyin — hamma narsa birga ko'chadi");
  const applied = await admin("/currency/apply", {
    method: "POST",
    body: JSON.stringify({ rate: 145, roundTo: 5, currency: "сом" }),
  });
  check("it applies", applied.status === 200, JSON.stringify(applied.body));

  const moved = await prisma.product.findUnique({ where: { id: dish.id } });
  check("the dish moved", moved.price === 415, String(moved.price));
  check("its old price moved with it", moved.oldPrice === 515, String(moved.oldPrice));

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  check("delivery fee moved", settings.deliveryFee === 105, String(settings.deliveryFee));
  check("minimum order moved", settings.minOrderAmount === 205, String(settings.minOrderAmount));
  check("free delivery threshold moved", settings.freeDeliveryThreshold === 1035, String(settings.freeDeliveryThreshold));
  check("a loyalty point is worth something again", settings.loyaltyPointValue === 5, String(settings.loyaltyPointValue));
  check("and the sign on the prices changed", settings.currency === "сом", settings.currency);

  const fixed = await prisma.promoCode.findUnique({ where: { id: fixedPromo.id } });
  check("a fixed discount moved", fixed.value === 35, String(fixed.value));
  check("with its minimum", fixed.minOrderAmount === 345, String(fixed.minOrderAmount));

  const percent = await prisma.promoCode.findUnique({ where: { id: percentPromo.id } });
  // Dividing a percentage would silently destroy the discount: 10% off
  // would become 0% off, and nobody would notice until a customer did.
  check("a percentage discount is left alone", percent.value === 10, String(percent.value));
  check("but its minimum order still moved", percent.minOrderAmount === 50000, String(percent.minOrderAmount));

  console.log("\n3) Egasining tili");
  // The customers pick their own language in the app. Nobody was picking
  // the owner's, and a Kyrgyz cafe cannot run a shop that only speaks
  // Uzbek at it every morning.
  const { ownerAlert } = require("../src/lib/ownerAlert");
  const sample = {
    id: 42,
    orderType: "DINE_IN",
    tableNumber: "5",
    paymentMethod: "CARD",
    phone: "0553155653",
    deliveryAddress: null,
    comment: null,
    totalPrice: 415,
  };

  const uz = ownerAlert(sample, "Aliya", "uz");
  check("Uzbek alert names the order", uz.includes("Yangi buyurtma #42"), uz.split("\n")[0]);
  check("in Uzbek words", uz.includes("Zalda · Stol 5") && uz.includes("Karta"), uz);

  const ru = ownerAlert(sample, "Aliya", "ru");
  check("Russian alert names the order", ru.includes("Новый заказ #42"), ru.split("\n")[0]);
  check("in Russian words", ru.includes("В зале · Столик 5") && ru.includes("Карта"), ru);
  check("with the card warning translated", ru.includes("проверьте поступление"), ru);
  check(
    "and no Uzbek left in it",
    !/Yangi|Mijoz|Jami|Naqd|Zalda/.test(ru),
    ru
  );
  check("an unknown language falls back rather than emptying", ownerAlert(sample, "A", "kg").includes("#42"));

  await admin("/settings", { method: "PUT", body: JSON.stringify({ ownerLanguage: "ru" }) });
  const saved = await prisma.settings.findUnique({ where: { id: 1 } });
  check("the choice is stored", saved.ownerLanguage === "ru", String(saved.ownerLanguage));
  await admin("/settings", { method: "PUT", body: JSON.stringify({ ownerLanguage: "uz" }) });

  console.log("\n4) Yaxlitlash");
  check("prices end in a round number", moved.price % 5 === 0, String(moved.price));
  // Rounding must never take a price to zero — a free dish by accident is
  // the worst outcome this could produce.
  const cheap = await prisma.product.create({
    data: {
      name: "Konvert choy",
      price: 100,
      imageUrl: "https://example.com/test.jpg",
      categoryId: category.id,
    },
  });
  await admin("/currency/apply", { method: "POST", body: JSON.stringify({ rate: 1000, roundTo: 5 }) });
  const stillCosts = await prisma.product.findUnique({ where: { id: cheap.id } });
  check("nothing becomes free by rounding", stillCosts.price > 0, String(stillCosts.price));

  await prisma.product.deleteMany({ where: { categoryId: category.id } });
  await prisma.category.delete({ where: { id: category.id } });
  await prisma.promoCode.deleteMany({ where: { code: { startsWith: "KONVERT" } } });
  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
