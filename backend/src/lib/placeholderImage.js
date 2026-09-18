// A self-contained SVG so a product without a photograph still renders
// something deliberate. Inline rather than a hosted file: it needs no
// network, no storage, and survives a database moving between deployments.
const PALETTE = [
  { match: ["pizza", "picca"], emoji: "🍕", background: "#fff1f0" },
  { match: ["burger", "gamburger", "chizburger"], emoji: "🍔", background: "#fff6e5" },
  { match: ["lavash", "donar", "doner", "shaurma"], emoji: "🌯", background: "#f3f0e7" },
  { match: ["sushi", "roll"], emoji: "🍣", background: "#eaf1ff" },
  { match: ["kola", "cola", "ichimlik", "choy", "suv", "fresh", "sok"], emoji: "🥤", background: "#f7f7f8" },
  { match: ["shirinlik", "tort", "keks", "chizkeyk", "muzqaymoq", "desert"], emoji: "🍰", background: "#fdeef3" },
  { match: ["fri", "kartoshka", "nugget", "snack", "sous"], emoji: "🍟", background: "#fdf3e3" },
  { match: ["salat", "salad"], emoji: "🥗", background: "#eef6ea" },
  { match: ["kombo", "set", "combo"], emoji: "🍱", background: "#fff1f0" },
  { match: ["sho'rva", "shorva", "lagmon", "osh", "palov", "mastava"], emoji: "🍲", background: "#f6efe7" },
  { match: ["somsa", "patir", "non", "lepyoshka"], emoji: "🥟", background: "#f7f0e4" },
  { match: ["manti", "chuchvara", "pelmen"], emoji: "🥠", background: "#f5f2ea" },
  { match: ["kabob", "kebab", "shashlik", "jigar"], emoji: "🍢", background: "#f6ece6" },
  { match: ["tovuq", "chicken", "qanot", "wings"], emoji: "🍗", background: "#fdf3e3" },
  { match: ["kofe", "coffee", "kapuchino"], emoji: "☕️", background: "#f4ede4" },
];

const DEFAULT = { emoji: "🍽", background: "#f7f7f8" };

function pickStyle(...hints) {
  const haystack = hints.filter(Boolean).join(" ").toLowerCase();
  return PALETTE.find((entry) => entry.match.some((word) => haystack.includes(word))) || DEFAULT;
}

function placeholderImage(emoji, background) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
    `<rect width="600" height="600" fill="${background}"/>` +
    `<text x="300" y="300" font-size="240" text-anchor="middle" dominant-baseline="central">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Guesses a fitting icon from the product and category names, so a menu
// imported without photographs still looks sorted rather than blank.
function placeholderFor(name, categoryName) {
  const style = pickStyle(name, categoryName);
  return placeholderImage(style.emoji, style.background);
}

module.exports = { placeholderImage, placeholderFor };
