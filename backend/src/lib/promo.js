const prisma = require("./prisma");

class PromoError extends Error {
  constructor(message) {
    super(message);
    this.name = "PromoError";
    this.status = 400;
  }
}

// Validates a promo code against a specific user/order context and returns
// the resulting discount amount (never more than the subtotal). Throws a
// PromoError with a user-facing message on any failure.
async function validatePromoCode(code, { userId, subtotal, isNewCustomer }) {
  if (!code) return null;

  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo || !promo.isActive) throw new PromoError("Promo kod topilmadi yoki faol emas");

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) throw new PromoError("Promo kod hali faollashmagan");
  if (promo.expiresAt && now > promo.expiresAt) throw new PromoError("Promo kodning amal qilish muddati tugagan");
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    throw new PromoError("Promo kod limiti tugagan");
  }
  if (subtotal < promo.minOrderAmount) {
    throw new PromoError(`Promo kod uchun kamida ${promo.minOrderAmount.toLocaleString()} buyurtma kerak`);
  }
  if (promo.newCustomersOnly && !isNewCustomer) {
    throw new PromoError("Bu promo kod faqat yangi mijozlar uchun");
  }

  if (promo.perUserLimit != null && userId) {
    const usedByUser = await prisma.promoCodeUsage.count({
      where: { promoCodeId: promo.id, userId },
    });
    if (usedByUser >= promo.perUserLimit) {
      throw new PromoError("Siz bu promo koddan allaqachon foydalangansiz");
    }
  }

  const rawDiscount =
    promo.type === "PERCENTAGE" ? Math.floor((subtotal * promo.value) / 100) : promo.value;
  const discountAmount = Math.min(rawDiscount, subtotal);

  return { promo, discountAmount };
}

async function markPromoUsed(tx, { promoId, userId, orderId }) {
  await tx.promoCode.update({ where: { id: promoId }, data: { usedCount: { increment: 1 } } });
  await tx.promoCodeUsage.create({ data: { promoCodeId: promoId, userId, orderId } });
}

module.exports = { validatePromoCode, markPromoUsed, PromoError };
