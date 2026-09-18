const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const { placeholderFor } = require("../lib/placeholderImage");

const router = express.Router();

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  imageUrl: z.string().trim().url(),
  price: z.number().int().nonnegative(),
  oldPrice: z.number().int().nonnegative().nullable().optional(),
  categoryId: z.number().int().nullable().optional(),
  isAvailable: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  recommendedProductIds: z.array(z.number().int()).optional(),
});

function serialize(product) {
  return {
    ...product,
    recommendedProducts: (product.recommendsTo || []).map((r) => r.recommendedProduct),
    recommendsTo: undefined,
  };
}

// Public: catalog listing for the Mini App. Only available products by
// default; admin panel passes ?all=1 to see everything.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const includeAll = req.query.all === "1";
    const products = await prisma.product.findMany({
      where: includeAll ? undefined : { isAvailable: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        category: true,
        recommendsTo: { include: { recommendedProduct: true } },
      },
    });
    res.json(products.map(serialize));
  })
);

// Public: what customers actually order most. Declared before "/:id" so
// Express doesn't read "top" as a product id.
router.get(
  "/top",
  asyncHandler(async (req, res) => {
    const ranked = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: { status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: ranked.map((r) => r.productId) }, isAvailable: true },
      include: { category: true, recommendsTo: { include: { recommendedProduct: true } } },
    });

    // groupBy returns the ranking, findMany returns them in id order.
    const byId = new Map(products.map((p) => [p.id, p]));
    const ordered = ranked.map((r) => byId.get(r.productId)).filter(Boolean);

    res.json(ordered.map(serialize));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        category: true,
        recommendsTo: { include: { recommendedProduct: true } },
      },
    });
    if (!product) return res.status(404).json({ error: "Mahsulot topilmadi" });
    res.json(serialize(product));
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { recommendedProductIds, ...data } = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        ...data,
        oldPrice: data.oldPrice ?? null,
        ...(recommendedProductIds && {
          recommendsTo: {
            create: recommendedProductIds.map((id) => ({ recommendedProductId: id })),
          },
        }),
      },
      include: { category: true, recommendsTo: { include: { recommendedProduct: true } } },
    });
    res.status(201).json(serialize(product));
  })
);

router.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { recommendedProductIds, ...data } = productSchema.partial().parse(req.body);

    if (recommendedProductIds !== undefined) {
      await prisma.productRecommendation.deleteMany({ where: { productId: id } });
      if (recommendedProductIds.length > 0) {
        await prisma.productRecommendation.createMany({
          data: recommendedProductIds
            .filter((rid) => rid !== id)
            .map((recommendedProductId) => ({ productId: id, recommendedProductId })),
          skipDuplicates: true,
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, recommendsTo: { include: { recommendedProduct: true } } },
    });
    res.json(serialize(product));
  })
);

const bulkSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        price: z.number().int().nonnegative(),
        category: z.string().trim().max(60).optional(),
        description: z.string().trim().max(2000).optional(),
        oldPrice: z.number().int().nonnegative().nullable().optional(),
      })
    )
    .min(1)
    .max(300),
});

// Admin: create a whole menu in one go. Typing a shop's sixty dishes into
// the form one at a time is the slowest part of setting a business up, so
// this takes the list as it arrives from the owner. Missing categories are
// created, and names already in the catalog are reported rather than
// duplicated.
router.post(
  "/bulk",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { items } = bulkSchema.parse(req.body);

    const categoryNames = [...new Set(items.map((i) => i.category).filter(Boolean))];
    const categories = new Map();
    for (const name of categoryNames) {
      const category = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      categories.set(name, category.id);
    }

    const created = [];
    const skipped = [];

    for (const item of items) {
      const exists = await prisma.product.findFirst({ where: { name: item.name } });
      if (exists) {
        skipped.push(item.name);
        continue;
      }
      const product = await prisma.product.create({
        data: {
          name: item.name,
          description: item.description || "",
          imageUrl: placeholderFor(item.name, item.category),
          price: item.price,
          oldPrice: item.oldPrice ?? null,
          categoryId: item.category ? categories.get(item.category) : null,
        },
      });
      created.push(product.name);
    }

    res.status(201).json({
      createdCount: created.length,
      skippedCount: skipped.length,
      skipped,
      categoriesCreated: categoryNames.length,
    });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  })
);

module.exports = router;
