// Loads a prepared client catalog on deploy.
//
// The owner sells this bot by setting it up for a prospect before ever
// contacting them, and the slowest part of that is retyping someone else's
// menu. A catalog prepared here as a file lets a whole business — its name,
// its menu, its add-on suggestions — arrive with a deploy instead.
//
// Two guards keep it from touching a business it was not meant for:
//   * it does nothing unless APPLY_CATALOG names a file, so a deployment
//     that never sets it is untouchable;
//   * it records what it applied, so redeploys leave the owner's later
//     edits alone. Bumping "revision" in the file is what re-applies it.
//
// Past orders survive: each order item keeps its own copy of the name and
// price, so clearing the menu only detaches it from the product.
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { placeholderFor } = require("../src/lib/placeholderImage");

const prisma = new PrismaClient();

async function main() {
  const name = (process.env.APPLY_CATALOG || "").trim();
  if (!name) return;

  if (!/^[a-z0-9-]+$/i.test(name)) {
    console.warn(`⚠️  APPLY_CATALOG nomi noto'g'ri: "${name}"`);
    return;
  }

  const file = path.join(__dirname, "catalogs", `${name}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  Katalog fayli topilmadi: ${name}.json`);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  const stamp = `${name}:${catalog.revision}`;

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings?.appliedCatalog === stamp) {
    console.log(`📦 "${name}" katalogi allaqachon qo'yilgan — o'tkazib yuborildi`);
    return;
  }

  const counts = await prisma.$transaction(async (tx) => {
    await tx.orderItem.updateMany({
      where: { productId: { not: null } },
      data: { productId: null },
    });
    await tx.product.deleteMany({});
    await tx.category.deleteMany({});

    let productCount = 0;
    const byName = new Map();

    for (const [index, group] of catalog.categories.entries()) {
      const category = await tx.category.create({
        data: { name: group.name, sortOrder: index },
      });

      for (const [position, item] of group.products.entries()) {
        const product = await tx.product.create({
          data: {
            name: item.name,
            price: item.price,
            oldPrice: item.oldPrice ?? null,
            description: item.description ?? "",
            // A prepared catalog carries no photographs, so each dish opens
            // with the drawn icon its name suggests until the owner
            // uploads a real one.
            imageUrl: item.imageUrl || placeholderFor(item.name, group.name),
            categoryId: category.id,
            sortOrder: position,
          },
        });
        byName.set(item.name, product.id);
        productCount++;
      }
    }

    // Add-on suggestions are keyed by name in the file, so they can only be
    // linked once every product exists.
    for (const [base, suggestions] of Object.entries(catalog.crossSell || {})) {
      const productId = byName.get(base);
      if (!productId) continue;

      for (const suggestion of suggestions) {
        const recommendedProductId = byName.get(suggestion);
        if (!recommendedProductId || recommendedProductId === productId) continue;
        await tx.productRecommendation.create({ data: { productId, recommendedProductId } });
      }
    }

    await tx.settings.upsert({
      where: { id: 1 },
      update: { ...catalog.settings, appliedCatalog: stamp },
      create: { id: 1, ...catalog.settings, appliedCatalog: stamp },
    });

    return { productCount, categoryCount: catalog.categories.length };
  });

  console.log(
    `📦 "${name}" katalogi qo'yildi: ${counts.categoryCount} kategoriya, ${counts.productCount} mahsulot`
  );
}

main()
  .catch((err) => {
    // A failed catalog load must not stop the server from starting — the
    // owner can still fix the menu from the admin panel.
    console.error("Katalogni qo'yishda xatolik:", err.message);
  })
  .finally(() => prisma.$disconnect());
