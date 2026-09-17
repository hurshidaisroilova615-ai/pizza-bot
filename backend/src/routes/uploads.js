const express = require("express");
const multer = require("multer");
const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 3 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(Object.assign(new Error("Unsupported type"), {
        status: 400,
        publicMessage: "Faqat JPG, PNG, WEBP yoki GIF rasm yuklash mumkin",
      }));
    }
    cb(null, true);
  },
});

// Admin uploads a product photo and gets back an absolute URL to store on
// the product. Absolute because the Mini App is served from a different
// origin than this API, so a relative path would resolve against the wrong
// host.
router.post(
  "/",
  requireAdmin,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Rasm tanlanmagan" });
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
      },
      select: { id: true },
    });

    res.status(201).json({
      id: asset.id,
      url: `${req.protocol}://${req.get("host")}/api/uploads/${asset.id}`,
    });
  })
);

// Public: the Mini App loads these directly in <img>. Contents never change
// for a given id, so they can be cached indefinitely.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
    if (!asset) return res.status(404).json({ error: "Rasm topilmadi" });

    res.set("Content-Type", asset.mimeType);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(asset.data);
  })
);

module.exports = router;
