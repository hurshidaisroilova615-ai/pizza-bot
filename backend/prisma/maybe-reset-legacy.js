// One-time adoption helper.
//
// Earlier versions of this project shipped a much smaller schema (Product
// had a `newPrice` column) and were applied with `prisma db push`, so the
// database carries those tables with no migration history. Deploying the
// current schema onto such a database dies with "relation Product already
// exists", and the failed migration it records then blocks every later
// deploy with P3009.
//
// When that legacy schema is detected we drop it so migrations can apply
// cleanly. The check keys on Product.newPrice — a column the current schema
// never defines — so it cannot fire against an up-to-date database and
// disarms itself permanently after the first successful run.
const { PrismaClient } = require("@prisma/client");

async function main() {
  if (process.env.DB_RESET_LEGACY_SCHEMA !== "true") return;

  const prisma = new PrismaClient();
  try {
    const legacy = await prisma.$queryRaw`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Product'
        AND column_name = 'newPrice'
      LIMIT 1
    `;

    if (legacy.length === 0) return;

    console.warn("⚠️  Eski loyihaning jadvallari topildi — public schema tozalanmoqda...");
    await prisma.$executeRawUnsafe("DROP SCHEMA public CASCADE");
    await prisma.$executeRawUnsafe("CREATE SCHEMA public");
    console.log("✅ Baza tozalandi, migratsiyalar toza schema'ga qo'llaniladi.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Eski schema tekshiruvida xatolik:", err.message);
  process.exit(1);
});
