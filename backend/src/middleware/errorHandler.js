const { ZodError } = require("zod");

// Centralized error handler. Keeps route handlers free of repetitive
// try/catch + status-code boilerplate.
function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Kiritilgan ma'lumotlar noto'g'ri",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err.name === "PromoError") {
    return res.status(err.status || 400).json({ error: err.message });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Ma'lumot topilmadi" });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Bu qiymat allaqachon mavjud" });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.publicMessage || "Serverda xatolik yuz berdi" });
}

module.exports = errorHandler;
