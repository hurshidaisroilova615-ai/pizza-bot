const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// Demo data models a pizza business by default, but every string here is
// just configuration — swap the categories/products/business name to adapt
// the same schema to burgers, sushi, clothing, cosmetics, etc.
async function seedSettings() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: process.env.BUSINESS_NAME || "Pizza Mania",
      businessType: process.env.BUSINESS_TYPE || "food",
      currency: process.env.BUSINESS_CURRENCY || "UZS",
      primaryColor: "#ff3b30",
      deliveryFee: 15000,
      freeDeliveryThreshold: 200000,
      minOrderAmount: 30000,
      loyaltyEnabled: true,
      loyaltyEarnRate: 0.05,
      loyaltyPointValue: 1,
      supportPhone: "+998901234567",
      welcomeMessage: "Assalomu alaykum! 🍕 Issiqqina pizzalarni buyurtma qilish uchun pastdagi tugmani bosing.",
      aboutText: "Biz eng mazali pizzalarni 30 daqiqada eshigingiz oldiga yetkazamiz.",
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
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log("Kategoriyalar mavjud, katalog seed o'tkazib yuborildi.");
    return;
  }

  const categoryDefs = [
    { name: "Klassik", icon: "🍕", sortOrder: 0 },
    { name: "Milliy", icon: "🥘", sortOrder: 1 },
    { name: "Pishloqli", icon: "🧀", sortOrder: 2 },
    { name: "Ichimliklar", icon: "🥤", sortOrder: 3 },
  ];
  const categories = {};
  for (const def of categoryDefs) {
    categories[def.name] = await prisma.category.create({ data: def });
  }

  const productDefs = [
    {
      name: "Margarita",
      description: "Pomidor sousi, mozzarella pishlog'i, rayhon bargi",
      imageUrl: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600",
      oldPrice: 65000,
      price: 49000,
      category: "Klassik",
      isRecommended: false,
    },
    {
      name: "Peperoni",
      description: "Pomidor sousi, mozzarella, achchiq peperoni kolbasa",
      imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600",
      oldPrice: 75000,
      price: 59000,
      category: "Klassik",
      isRecommended: false,
    },
    {
      name: "Qazi pizza",
      description: "Qazi go'shti, piyoz, pomidor sousi, mol go'shti kolbasasi",
      imageUrl: "https://images.unsplash.com/photo-1548365328-9f547fb0953b?w=600",
      oldPrice: 95000,
      price: 79000,
      category: "Milliy",
      isRecommended: false,
    },
    {
      name: "Pishloqli pizza",
      description: "To'rt xil pishloq: mozzarella, cheddar, parmezan, gorgonzola",
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600",
      oldPrice: 80000,
      price: 65000,
      category: "Pishloqli",
      isRecommended: false,
    },
    {
      name: "Kola 0.5L",
      description: "Sovutilgan gazlangan ichimlik",
      imageUrl: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600",
      oldPrice: null,
      price: 12000,
      category: "Ichimliklar",
      isRecommended: true,
    },
    {
      name: "Sarimsoqli sous",
      description: "Pizzangizga qo'shimcha mazali sous",
      imageUrl: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=600",
      oldPrice: null,
      price: 8000,
      category: "Ichimliklar",
      isRecommended: true,
    },
  ];

  const products = {};
  for (const def of productDefs) {
    const { category, ...data } = def;
    products[def.name] = await prisma.product.create({
      data: { ...data, categoryId: categories[category]?.id },
    });
  }

  const cola = products["Kola 0.5L"];
  const sauce = products["Sarimsoqli sous"];
  for (const name of ["Margarita", "Peperoni", "Qazi pizza", "Pishloqli pizza"]) {
    await prisma.productRecommendation.createMany({
      data: [
        { productId: products[name].id, recommendedProductId: cola.id },
        { productId: products[name].id, recommendedProductId: sauce.id },
      ],
      skipDuplicates: true,
    });
  }

  console.log("✅ Kategoriya va mahsulotlar qo'shildi");
}

async function seedPromoAndOffers() {
  const promoCount = await prisma.promoCode.count();
  if (promoCount === 0) {
    await prisma.promoCode.create({
      data: {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minOrderAmount: 30000,
        newCustomersOnly: true,
        perUserLimit: 1,
      },
    });
    const seasonal = await prisma.promoCode.create({
      data: {
        code: "SAVE20K",
        type: "FIXED",
        value: 20000,
        minOrderAmount: 100000,
        usageLimit: 200,
        perUserLimit: 2,
      },
    });
    console.log("✅ Promo kodlar qo'shildi (WELCOME10, SAVE20K)");

    const offerCount = await prisma.specialOffer.count();
    if (offerCount === 0) {
      await prisma.specialOffer.create({
        data: {
          title: "Yangi mijozlarga sovg'a",
          message: "Birinchi buyurtmangizga 10% chegirma! WELCOME10 promo kodini kiriting.",
          segment: "NEW_CUSTOMERS",
        },
      });
      await prisma.specialOffer.create({
        data: {
          title: "Sog'inib qoldik!",
          message: "Qaytib keling va 20,000 so'm chegirmaga ega bo'ling: SAVE20K",
          segment: "INACTIVE_CUSTOMERS",
          promoCodeId: seasonal.id,
        },
      });
      console.log("✅ Maxsus takliflar qo'shildi");
    }
  }
}

async function main() {
  await seedSettings();
  await seedAdmin();
  await seedCatalog();
  await seedPromoAndOffers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
