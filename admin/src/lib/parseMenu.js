// Owners hand over their menu in whatever shape they already keep it: a
// spreadsheet column, a pipe-separated list, or — most often — the plain
// text off their Instagram page, where the price is just the number at the
// end of the line and the category is a heading above a group of dishes.
// All three are accepted, because retyping someone else's menu into one
// fixed format is the slowest part of setting a new business up.

// The price is the number the line ends with. A digit inside the dish's own
// name — "Dom Burger x3", "Pitsa 50/50", "Combo 5" — must not be swallowed
// into it, so a price may only carry internal separators between groups of
// exactly three digits, the way a written thousand is. "x3 50000" therefore
// cannot read as 350000; the name keeps its 3 and the price stays 50000.
const PRICE = String.raw`\d{1,3}(?:[\s.,]\d{3})+|\d+`;
const PRICE_AT_END = new RegExp(
  String.raw`^(.*?)[\s.,:;\-–—]*(${PRICE})(?:\s*(?:so'm|so‘m|som|sum|uzs|usd|\$))?$`,
  "i"
);

// Prices arrive as "45000", "45 000", "45,000" or "45.000 so'm" — the
// separators differ by who typed them, the number does not.
function toPrice(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return Number(digits) || 0;
}

export function parseMenu(text) {
  const rows = [];
  const problems = [];
  let heading;

  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const lineNumber = index + 1;

      // The explicit form wins where it is used: "Nomi | narx | kategoriya",
      // also tab-separated, which is what pasting from a spreadsheet gives.
      if (/[|\t]/.test(line)) {
        const [name, rawPrice, category, description] = line.split(/\s*[|\t]\s*/);
        const price = toPrice(rawPrice);
        if (!name || !price) {
          problems.push({ line: lineNumber, text: line, why: "narxni o'qib bo'lmadi" });
          return;
        }
        rows.push({
          name,
          price,
          category: category || heading || undefined,
          description: description || undefined,
        });
        return;
      }

      const match = line.match(PRICE_AT_END);
      const price = match ? toPrice(match[2]) : 0;
      const name = match ? match[1].trim() : "";

      if (price && name) {
        rows.push({ name, price, category: heading || undefined });
        return;
      }

      // No price on the line: a menu heading, and the dishes below it belong
      // to it until the next heading.
      if (!/\d/.test(line) && line.length <= 40) {
        heading = line.replace(/[:：]+$/, "").trim();
        return;
      }

      problems.push({
        line: lineNumber,
        text: line,
        why: price ? "nomi yozilmagan" : "narxni o'qib bo'lmadi",
      });
    });

  return { rows, problems };
}
