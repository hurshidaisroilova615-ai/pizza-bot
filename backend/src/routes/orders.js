const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const telegramUser = require("../middleware/telegramUser");
const { getSettings } = require("../lib/settings");
const { openingState } = require("../lib/openingHours");
const { validatePromoCode, markPromoUsed, PromoError } = require("../lib/promo");
const { calculateEarnedPoints, earnPoints, redeemPoints } = require("../lib/loyalty");
const { notifyOrderCreated, notifyOrderStatusChanged, notifyAdmins } = require("../bot");
const { orderTypeLabel, paymentLabel } = require("../lib/orderLabels");

const router = express.Router();

const orderItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().positive().max(50),
});

// Collection costs nothing to deliver, and a large enough order may carry
// no charge either.
function feeFor(orderType, afterDiscount, settings) {
  if (orderType === "PICKUP") return 0;
  if (settings.freeDeliveryThreshold && afterDiscount >= settings.freeDeliveryThreshold) return 0;
  return settings.deliveryFee;
}

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  orderType: z.enum(["DELIVERY", "PICKUP"]).optional().default("DELIVERY"),
  paymentMethod: z.enum(["CASH", "CARD"]).optional().default("CASH"),
  phone: z.string().trim().min(5).max(30).optional(),
  deliveryAddress: z.string().trim().max(300).optional(),
  comment: z.string().trim().max(500).optional(),
  promoCode: z.string().trim().max(40).optional(),
  loyaltyPointsToRedeem: z.number().int().nonnegative().optional().default(0),
});

const ORDER_INCLUDE = {
  user: true,
  items: { include: { product: true } },
  statusHistory: { orderBy: { createdAt: "asc" } },
  promoCode: true,
};

function serializeOrder(order) {
  return {
    ...order,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      imageUrl: i.product?.imageUrl || null,
    })),
  };
}

// Admin: all orders, most recent first, with full customer + item detail.
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(orders.map(serializeOrder));
  })
);

router.get(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: ORDER_INCLUDE,
    });
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });
    res.json(serializeOrder(order));
  })
);

// Mini App: current customer's own order history (for Profile/reorder).
router.get(
  "/me/list",
  telegramUser,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { telegramId: req.telegramUser.telegramId } });
    if (!user) return res.json([]);
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(orders.map(serializeOrder));
  })
);

// Mini App: validate a promo code before checkout, so the UI can show the
// discount live without creating an order.
router.post(
  "/quote",
  telegramUser,
  asyncHandler(async (req, res) => {
    const { items, promoCode, loyaltyPointsToRedeem = 0, orderType = "DELIVERY" } = req.body;
    const settings = await getSettings();

    const productIds = (items || []).map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const subtotal = (items || []).reduce((sum, i) => {
      const product = productMap.get(i.productId);
      return product ? sum + product.price * i.quantity : sum;
    }, 0);

    // A dish can sell out while it sits in someone's cart. The quote says so
    // now, so the cart can warn before the customer taps confirm and gets a
    // rejection they don't understand.
    const unavailableItems = (items || [])
      .map((i) => productMap.get(i.productId))
      .filter((product) => product && !product.isAvailable)
      .map((product) => ({ id: product.id, name: product.name }));

    const user = await prisma.user.findUnique({ where: { telegramId: req.telegramUser.telegramId } });
    const isNewCustomer = !user || (await prisma.order.count({ where: { userId: user.id } })) === 0;

    let discountAmount = 0;
    let promo = null;
    if (promoCode) {
      const result = await validatePromoCode(promoCode, {
        userId: user?.id,
        subtotal,
        isNewCustomer,
      });
      discountAmount = result.discountAmount;
      promo = result.promo;
    }

    const maxRedeemable = user ? Math.min(user.loyaltyPoints, subtotal - discountAmount) : 0;
    const loyaltyDiscount = Math.min(loyaltyPointsToRedeem, maxRedeemable) * settings.loyaltyPointValue;

    const afterDiscount = Math.max(subtotal - discountAmount - loyaltyDiscount, 0);
    const deliveryFee = feeFor(orderType, afterDiscount, settings);
    const totalPrice = afterDiscount + deliveryFee;

    res.json({
      subtotal,
      discountAmount,
      loyaltyDiscount,
      deliveryFee,
      totalPrice,
      promoValid: Boolean(promo),
      loyaltyBalance: user?.loyaltyPoints || 0,
      minOrderAmount: settings.minOrderAmount,
      meetsMinimum: subtotal >= settings.minOrderAmount,
      unavailableItems,
    });
  })
);

// Mini App: place a new order.
router.post(
  "/",
  telegramUser,
  asyncHandler(async (req, res) => {
    const data = createOrderSchema.parse(req.body);
    const settings = await getSettings();

    const opening = openingState(settings);
    if (!opening.isOpen) {
      throw Object.assign(new Error("Closed"), {
        status: 400,
        publicMessage: `Hozir buyurtma qabul qilinmaydi. Ish vaqti: ${opening.openTime} - ${opening.closeTime}`,
      });
    }

    if (data.orderType === "PICKUP" && !settings.pickupEnabled) {
      throw Object.assign(new Error("Pickup off"), {
        status: 400,
        publicMessage: "Olib ketish xizmati mavjud emas",
      });
    }
    if (data.orderType === "DELIVERY" && !settings.deliveryEnabled) {
      throw Object.assign(new Error("Delivery off"), {
        status: 400,
        publicMessage: "Yetkazib berish xizmati mavjud emas",
      });
    }
    if (data.paymentMethod === "CARD" && !settings.cardPaymentEnabled) {
      throw Object.assign(new Error("Card off"), {
        status: 400,
        publicMessage: "Karta orqali to'lov mavjud emas",
      });
    }
    const { telegramId, firstName, lastName, username, languageCode } = req.telegramUser;

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName,
        lastName,
        username,
        languageCode,
        ...(data.phone && { phone: data.phone }),
      },
      create: { telegramId, firstName, lastName, username, languageCode, phone: data.phone || null },
    });

    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const missing = data.items.find((i) => !productMap.has(i.productId));
    if (missing) throw Object.assign(new Error("Mahsulot topilmadi"), { status: 400, publicMessage: "Ba'zi mahsulotlar mavjud emas" });

    const unavailable = data.items.find((i) => !productMap.get(i.productId).isAvailable);
    if (unavailable) {
      const p = productMap.get(unavailable.productId);
      throw Object.assign(new Error("Unavailable"), { status: 400, publicMessage: `"${p.name}" hozircha mavjud emas` });
    }

    const subtotal = data.items.reduce((sum, i) => sum + productMap.get(i.productId).price * i.quantity, 0);

    if (subtotal < settings.minOrderAmount) {
      throw Object.assign(new Error("Below minimum"), {
        status: 400,
        publicMessage: `Minimal buyurtma summasi ${settings.minOrderAmount.toLocaleString()}`,
      });
    }

    const isNewCustomer = (await prisma.order.count({ where: { userId: user.id } })) === 0;

    let discountAmount = 0;
    let promo = null;
    if (data.promoCode) {
      const result = await validatePromoCode(data.promoCode, {
        userId: user.id,
        subtotal,
        isNewCustomer,
      });
      discountAmount = result.discountAmount;
      promo = result.promo;
    }

    const maxRedeemable = Math.min(user.loyaltyPoints, subtotal - discountAmount);
    const pointsToRedeem = Math.min(data.loyaltyPointsToRedeem, Math.max(maxRedeemable, 0));
    const loyaltyDiscount = pointsToRedeem * settings.loyaltyPointValue;

    const afterDiscount = Math.max(subtotal - discountAmount - loyaltyDiscount, 0);
    const deliveryFee = feeFor(data.orderType, afterDiscount, settings);
    const totalPrice = afterDiscount + deliveryFee;
    const pointsEarned = calculateEarnedPoints(afterDiscount, settings);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          subtotal,
          discountAmount: discountAmount + loyaltyDiscount,
          deliveryFee,
          loyaltyPointsUsed: pointsToRedeem,
          loyaltyPointsEarned: pointsEarned,
          totalPrice,
          orderType: data.orderType,
          paymentMethod: data.paymentMethod,
          phone: data.phone || user.phone || null,
          deliveryAddress: data.orderType === "PICKUP" ? null : data.deliveryAddress || null,
          comment: data.comment || null,
          promoCodeId: promo?.id || null,
          items: {
            create: data.items.map((i) => {
              const product = productMap.get(i.productId);
              return {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: i.quantity,
                lineTotal: product.price * i.quantity,
              };
            }),
          },
          statusHistory: { create: { status: "PENDING" } },
        },
        include: ORDER_INCLUDE,
      });

      if (promo) await markPromoUsed(tx, { promoId: promo.id, userId: user.id, orderId: created.id });
      if (pointsToRedeem > 0) {
        await redeemPoints(tx, { userId: user.id, orderId: created.id, points: pointsToRedeem, note: "Buyurtmada ishlatildi" });
      }
      if (pointsEarned > 0) {
        await earnPoints(tx, { userId: user.id, orderId: created.id, points: pointsEarned, note: "Buyurtma uchun bonus" });
      }

      return created;
    });

    notifyOrderCreated(user.telegramId, order);
    // The alert is what the kitchen acts on, so it carries the two things
    // they would otherwise have to open the panel for: how it goes out, and
    // how it is paid.
    const how = orderTypeLabel(order.orderType);
    const paid = paymentLabel(order.paymentMethod);
    notifyAdmins(
      [
        `🆕 Yangi buyurtma #${order.id}`,
        `Mijoz: ${user.firstName || user.telegramId}`,
        `${how} · ${paid}`,
        order.deliveryAddress ? `Manzil: ${order.deliveryAddress}` : null,
        order.phone ? `Telefon: ${order.phone}` : null,
        `Jami: ${order.totalPrice.toLocaleString()}`,
      ]
        .filter(Boolean)
        .join("\n")
    );

    res.status(201).json(serializeOrder(order));
  })
);

const statusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "ON_DELIVERY", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(300).optional(),
});

// Admin: change order status. Sends the customer a Telegram notification.
router.put(
  "/:id/status",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, note } = statusSchema.parse(req.body);
    const id = Number(req.params.id);

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status, statusHistory: { create: { status, note } } },
        include: ORDER_INCLUDE,
      });

      if (status === "CANCELLED" && updated.loyaltyPointsEarned > 0) {
        await tx.user.update({
          where: { id: updated.userId },
          data: { loyaltyPoints: { decrement: updated.loyaltyPointsEarned } },
        });
        await tx.loyaltyTransaction.create({
          data: {
            userId: updated.userId,
            orderId: updated.id,
            type: "ADJUST",
            points: -updated.loyaltyPointsEarned,
            balanceAfter: (await tx.user.findUnique({ where: { id: updated.userId } })).loyaltyPoints,
            note: "Bekor qilingan buyurtma uchun bonus qaytarildi",
          },
        });
      }

      return updated;
    });

    notifyOrderStatusChanged(order.user.telegramId, order);
    res.json(serializeOrder(order));
  })
);

module.exports = router;
