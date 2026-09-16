const prisma = require("./prisma");

// Business configuration is a single DB row (id = 1). We cache it in memory
// so hot paths (pricing, bot replies) don't hit the DB on every request, and
// invalidate the cache whenever the admin panel updates settings.
let cache = null;

const DEFAULTS = {
  businessName: process.env.BUSINESS_NAME || "SmartOrder",
  businessType: process.env.BUSINESS_TYPE || "food",
  currency: process.env.BUSINESS_CURRENCY || "UZS",
  logoUrl: null,
  primaryColor: "#ff3b30",
  deliveryFee: 0,
  freeDeliveryThreshold: null,
  minOrderAmount: 0,
  loyaltyEnabled: true,
  loyaltyEarnRate: 0.05,
  loyaltyPointValue: 1,
  supportPhone: null,
  supportUsername: null,
  welcomeMessage: null,
  aboutText: null,
};

async function getSettings() {
  if (cache) return cache;
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 1, ...DEFAULTS } });
  }
  cache = settings;
  return settings;
}

function invalidateSettingsCache() {
  cache = null;
}

module.exports = { getSettings, invalidateSettingsCache, DEFAULTS };
