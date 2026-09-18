const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// Bump when the bundled catalog below changes. A deploy applies a newer
// revision once and records it, so shipping new demo items never re-adds
// products the owner has deliberately deleted.
const CATALOG_VERSION = 2;

// Self-contained SVG so a product always renders something deliberate
// instead of a broken image: the demo catalog ships without photographs,
// and the owner replaces these by uploading their own from the admin panel.
function placeholder(emoji, background) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
    `<rect width="600" height="600" fill="${background}"/>` +
    `<text x="300" y="300" font-size="240" text-anchor="middle" dominant-baseline="central">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CATEGORIES = [
  { name: "Kombo setlar", icon: "🍱", sortOrder: 0 },
  { name: "Pizza", icon: "🍕", sortOrder: 1 },
  { name: "Burgerlar", icon: "🍔", sortOrder: 2 },
  { name: "Lavash", icon: "🌯", sortOrder: 3 },
  { name: "Sushi", icon: "🍣", sortOrder: 4 },
  { name: "Snacklar", icon: "🍟", sortOrder: 5 },
  { name: "Shirinliklar", icon: "🍰", sortOrder: 6 },
  { name: "Ichimliklar", icon: "🥤", sortOrder: 7 },
];

const PRODUCTS = [
  // --- Kombo setlar: priced below the sum of their parts to lift basket size
  {
    name: "Burger kombo",
    description: "Chizburger, fri kartoshka, Kola 0.5L",
    category: "Kombo setlar",
    price: 58000,
    oldPrice: 72000,
    emoji: "🍱",
    bg: "#fff1f0",
  },
  {
    name: "Oilaviy set",
    description: "2 ta katta pizza, 2 ta Kola 0.5L, sarimsoqli sous",
    category: "Kombo setlar",
    price: 135000,
    oldPrice: 170000,
    emoji: "👨‍👩‍👧",
    bg: "#fff6e5",
  },
  {
    name: "Sushi set (16 dona)",
    description: "Filadelfiya, Kaliforniya, Kappa maki, zanjabil, vasabi",
    category: "Kombo setlar",
    price: 149000,
    oldPrice: 185000,
    emoji: "🍱",
    bg: "#eaf1ff",
  },

  // --- Pizza
  {
    name: "Margarita",
    description: "Pomidor sousi, mozzarella pishlog'i, rayhon bargi",
    category: "Pizza",
    price: 49000,
    oldPrice: 65000,
    emoji: "🍕",
    bg: "#fff1f0",
  },
  {
    name: "Peperoni",
    description: "Pomidor sousi, mozzarella, achchiq peperoni kolbasa",
    category: "Pizza",
    price: 59000,
    oldPrice: 75000,
    emoji: "🍕",
    bg: "#ffe9e6",
  },
  {
    name: "To'rt pishloqli pizza",
    description: "Mozzarella, cheddar, parmezan, gorgonzola, qaymoq sousi",
    category: "Pizza",
    price: 69000,
    oldPrice: null,
    emoji: "🧀",
    bg: "#fff6e5",
  },
  {
    name: "BBQ tovuqli pizza",
    description: "Tovuq filesi, BBQ sousi, qizil piyoz, mozzarella",
    category: "Pizza",
    price: 72000,
    oldPrice: null,
    emoji: "🍕",
    bg: "#f4ede4",
  },
  {
    name: "Qazili pizza",
    description: "Qazi, piyoz, pomidor sousi, mozzarella",
    category: "Pizza",
    price: 79000,
    oldPrice: 95000,
    emoji: "🍕",
    bg: "#f6efe7",
  },

  // --- Burgerlar
  {
    name: "Chizburger",
    description: "Mol go'shti kotleti, cheddar, tuzlangan bodring, maxsus sous",
    category: "Burgerlar",
    price: 32000,
    oldPrice: null,
    emoji: "🍔",
    bg: "#fff6e5",
  },
  {
    name: "Dabl burger",
    description: "Ikki qavat mol go'shti, ikki qavat pishloq, karam, pomidor",
    category: "Burgerlar",
    price: 55000,
    oldPrice: 68000,
    emoji: "🍔",
    bg: "#f9efe2",
  },
  {
    name: "Tovuqli burger",
    description: "Xrustyashiy tovuq filesi, salat bargi, sarimsoqli sous",
    category: "Burgerlar",
    price: 38000,
    oldPrice: null,
    emoji: "🍔",
    bg: "#fff3e0",
  },

  // --- Lavash
  {
    name: "Tovuqli lavash",
    description: "Tovuq go'shti, fri kartoshka, pomidor, bodring, sous",
    category: "Lavash",
    price: 30000,
    oldPrice: null,
    emoji: "🌯",
    bg: "#f3f0e7",
  },
  {
    name: "Mol go'shtli lavash",
    description: "Mol go'shti, fri kartoshka, sabzavotlar, achchiq sous",
    category: "Lavash",
    price: 35000,
    oldPrice: null,
    emoji: "🌯",
    bg: "#efeade",
  },
  {
    name: "Pishloqli lavash",
    description: "Tovuq, ikki xil pishloq, qaymoqli sous",
    category: "Lavash",
    price: 38000,
    oldPrice: 45000,
    emoji: "🌯",
    bg: "#f5f1e6",
  },

  // --- Sushi
  {
    name: "Filadelfiya roll",
    description: "8 dona — losos, Filadelfiya pishlog'i, bodring, guruch",
    category: "Sushi",
    price: 89000,
    oldPrice: null,
    emoji: "🍣",
    bg: "#eaf1ff",
  },
  {
    name: "Kaliforniya roll",
    description: "8 dona — qisqichbaqa, avokado, bodring, tobiko",
    category: "Sushi",
    price: 79000,
    oldPrice: 95000,
    emoji: "🍣",
    bg: "#e9f3f7",
  },

  // --- Snacklar
  {
    name: "Fri kartoshka",
    description: "Xrustyashiy, dengiz tuzi bilan",
    category: "Snacklar",
    price: 18000,
    oldPrice: null,
    emoji: "🍟",
    bg: "#fff6e5",
  },
  {
    name: "Tovuq nuggets",
    description: "6 dona, sousi bilan",
    category: "Snacklar",
    price: 28000,
    oldPrice: null,
    emoji: "🍗",
    bg: "#fdf3e3",
  },
  {
    name: "Sarimsoqli sous",
    description: "Uy sharoitida tayyorlangan",
    category: "Snacklar",
    price: 8000,
    oldPrice: null,
    emoji: "🥣",
    bg: "#f7f7f8",
    isRecommended: true,
  },

  // --- Shirinliklar
  {
    name: "Chizkeyk",
    description: "Klassik Nyu-York uslubida, rezavor sousi bilan",
    category: "Shirinliklar",
    price: 32000,
    oldPrice: null,
    emoji: "🍰",
    bg: "#fdeef3",
  },
  {
    name: "Shokoladli fondan",
    description: "Ichi suyuq issiq shokolad, muzqaymoq bilan",
    category: "Shirinliklar",
    price: 35000,
    oldPrice: 42000,
    emoji: "🍫",
    bg: "#f3ebe6",
  },

  // --- Ichimliklar
  {
    name: "Kola 0.5L",
    description: "Sovutilgan gazlangan ichimlik",
    category: "Ichimliklar",
    price: 12000,
    oldPrice: null,
    emoji: "🥤",
    bg: "#f7f7f8",
    isRecommended: true,
  },
  {
    name: "Limonli choy 0.5L",
    description: "Sovuq choy, limon va yalpiz bilan",
    category: "Ichimliklar",
    price: 15000,
    oldPrice: null,
    emoji: "🧋",
    bg: "#f4f7f0",
    isRecommended: true,
  },
];

// Which add-ons to suggest on each product's page.
const CROSS_SELL = {
  Margarita: ["Kola 0.5L", "Sarimsoqli sous", "Fri kartoshka"],
  Peperoni: ["Kola 0.5L", "Sarimsoqli sous", "Fri kartoshka"],
  "To'rt pishloqli pizza": ["Kola 0.5L", "Sarimsoqli sous"],
  "BBQ tovuqli pizza": ["Kola 0.5L", "Fri kartoshka"],
  "Qazili pizza": ["Kola 0.5L", "Sarimsoqli sous"],
  Chizburger: ["Fri kartoshka", "Kola 0.5L"],
  "Dabl burger": ["Fri kartoshka", "Kola 0.5L"],
  "Tovuqli burger": ["Fri kartoshka", "Limonli choy 0.5L"],
  "Tovuqli lavash": ["Kola 0.5L", "Sarimsoqli sous"],
  "Mol go'shtli lavash": ["Kola 0.5L", "Sarimsoqli sous"],
  "Pishloqli lavash": ["Limonli choy 0.5L", "Sarimsoqli sous"],
  "Filadelfiya roll": ["Limonli choy 0.5L"],
  "Kaliforniya roll": ["Limonli choy 0.5L"],
  Chizkeyk: ["Limonli choy 0.5L"],
  "Shokoladli fondan": ["Limonli choy 0.5L"],
};

async function seedSettings() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: process.env.BUSINESS_NAME || "SmartOrder Demo",
      businessType: process.env.BUSINESS_TYPE || "food",
      currency: process.env.BUSINESS_CURRENCY || "so'm",
      primaryColor: "#ff3b30",
      deliveryFee: 15000,
      freeDeliveryThreshold: 200000,
      minOrderAmount: 30000,
      loyaltyEnabled: true,
      loyaltyEarnRate: 0.05,
      loyaltyPointValue: 1,
      supportPhone: "+998901234567",
      welcomeMessage:
        "Assalomu alaykum! 👋\n\nPizza, burger, lavash, sushi — hammasi bir joyda. Buyurtma berish uchun pastdagi tugmani bosing.",
      aboutText: "Pizza, burger, lavash va sushi — 40 daqiqada eshigingiz oldida.",
    },
  });
  console.log("✅ Settings tayyor");
}

async function seedAdmin() {
  const count = await prisma.adminUser.count();
  if (count > 0) return;
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.create({ data: { username, passwordHash, name: "Administrator" } });
  console.log(`✅ Admin foydalanuvchi yaratildi: ${username} / ${password}`);
}

async function seedCatalog() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings && settings.catalogVersion >= CATALOG_VERSION) {
    console.log("Katalog allaqachon dolzarb, o'tkazib yuborildi.");
    return;
  }

  // A shop still on the very first catalog with no orders placed has never
  // been used, so whatever is in it is leftover demo content rather than a
  // real menu. Clear it, otherwise the earlier demo's categories linger
  // alongside the new ones. Once a revision is recorded this cannot run
  // again, and a shop with even one order is left untouched.
  const untouched = (settings?.catalogVersion ?? 0) === 0 && (await prisma.order.count()) === 0;
  if (untouched && (await prisma.product.count()) > 0) {
    await prisma.productRecommendation.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    console.log("ℹ️  Ishlatilmagan eski demo katalog tozalandi.");
  }

  const categories = {};
  for (const def of CATEGORIES) {
    categories[def.name] = await prisma.category.upsert({
      where: { name: def.name },
      update: { icon: def.icon, sortOrder: def.sortOrder },
      create: def,
    });
  }

  const products = {};
  let added = 0;
  for (const [index, def] of PRODUCTS.entries()) {
    const existing = await prisma.product.findFirst({ where: { name: def.name } });
    if (existing) {
      products[def.name] = existing;
      continue;
    }
    products[def.name] = await prisma.product.create({
      data: {
        name: def.name,
        description: def.description,
        imageUrl: placeholder(def.emoji, def.bg),
        price: def.price,
        oldPrice: def.oldPrice ?? null,
        categoryId: categories[def.category]?.id,
        isRecommended: def.isRecommended ?? false,
        sortOrder: index,
      },
    });
    added += 1;
  }

  for (const [productName, addOnNames] of Object.entries(CROSS_SELL)) {
    const product = products[productName];
    if (!product) continue;
    const addOnIds = addOnNames.map((n) => products[n]?.id).filter(Boolean);
    if (addOnIds.length === 0) continue;
    await prisma.productRecommendation.createMany({
      data: addOnIds.map((recommendedProductId) => ({ productId: product.id, recommendedProductId })),
      skipDuplicates: true,
    });
  }

  await prisma.settings.update({ where: { id: 1 }, data: { catalogVersion: CATALOG_VERSION } });
  console.log(`✅ Katalog tayyor: ${CATEGORIES.length} kategoriya, ${added} ta yangi mahsulot`);
}

async function seedPromoCodes() {
  const wanted = [
    {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrderAmount: 30000,
      newCustomersOnly: true,
      perUserLimit: 1,
    },
    {
      code: "COMBO20",
      type: "FIXED",
      value: 20000,
      minOrderAmount: 100000,
      usageLimit: 200,
      perUserLimit: 2,
    },
  ];

  for (const promo of wanted) {
    await prisma.promoCode.upsert({ where: { code: promo.code }, update: {}, create: promo });
  }
  console.log("✅ Promo kodlar tayyor: WELCOME10, COMBO20");
}

async function seedOffers() {
  if ((await prisma.specialOffer.count()) > 0) return;
  await prisma.specialOffer.createMany({
    data: [
      {
        title: "Birinchi buyurtmaga 10% chegirma",
        message: "Xush kelibsiz! WELCOME10 promo kodini kiriting va 10% chegirmaga ega bo'ling.",
        segment: "NEW_CUSTOMERS",
      },
      {
        title: "Sog'inib qoldik!",
        message: "Qaytib keling — 100,000 so'mdan yuqori buyurtmaga 20,000 so'm chegirma: COMBO20",
        segment: "INACTIVE_CUSTOMERS",
      },
      {
        title: "Sodiq mijozlarga maxsus",
        message: "5 tadan ortiq buyurtma berdingiz — rahmat! Keyingi buyurtmangizga bepul fri kartoshka.",
        segment: "LOYAL_CUSTOMERS",
      },
    ],
  });
  console.log("✅ Maxsus takliflar tayyor");
}

async function main() {
  await seedSettings();
  await seedAdmin();
  await seedCatalog();
  await seedPromoCodes();
  await seedOffers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
