const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");

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

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  })
);

module.exports = router;
