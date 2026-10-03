const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");
const { getSettings } = require("../lib/settings");

const router = express.Router();

// A guest at a table raising their hand.
//
// The code on the table already opens the menu; this is the rest of what
// somebody sitting there actually wants from a waiter — come over, and
// bring the bill. It is the part of table service that has nothing to do
// with ordering, and the part that leaves a guest craning their neck.

const createSchema = z.object({
  tableNumber: z.string().trim().min(1).max(20),
  kind: z.enum(["WAITER", "BILL"]).optional().default("WAITER"),
});

// How long the same table has to wait before it can call again. A guest
// who is being ignored taps the button repeatedly; the shop should see one
// raised hand, not thirty.
const REPEAT_MS = 60_000;

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const settings = await getSettings();
    if (!settings.dineInEnabled) {
      return res.status(400).json({ error: "Zaldan buyurtma o'chirilgan" });
    }

    const data = createSchema.parse(req.body);

    const open = await prisma.tableCall.findFirst({
      where: { tableNumber: data.tableNumber, kind: data.kind, resolvedAt: null },
      orderBy: { createdAt: "desc" },
    });
    // Already waiting: say yes without adding another, so the guest sees
    // their tap worked and the shop still sees one call.
    if (open && Date.now() - open.createdAt.getTime() < REPEAT_MS) {
      return res.status(201).json({ id: open.id, kind: open.kind });
    }

    const call = await prisma.tableCall.create({ data });
    res.status(201).json({ id: call.id, kind: call.kind });
  })
);

// Admin: what is still waiting, oldest first — the table that has been
// ignored longest is the one to go to.
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const calls = await prisma.tableCall.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    res.json(calls);
  })
);

// Somebody went over.
router.put(
  "/:id/resolve",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Noto'g'ri raqam" });
    const existing = await prisma.tableCall.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Chaqiruv topilmadi" });
    const call = await prisma.tableCall.update({
      where: { id },
      data: { resolvedAt: existing.resolvedAt || new Date() },
    });
    res.json(call);
  })
);

module.exports = router;
