// A self-contained SVG so a product without a photograph still renders
// something deliberate. Inline rather than a hosted file: it needs no
// network, no storage, and survives a database moving between deployments.
const PALETTE = [
  { match: ["pizza", "pitsa", "picca"], emoji: "🍕", background: "#fff1f0" },
  { match: ["burger", "gamburger", "chizburger"], emoji: "🍔", background: "#fff6e5" },
  // Before the kebab entry, so "Shashlik Xot-Dog" reads as a hot dog.
  { match: ["hot-dog", "hot dog", "xot-dog", "xot dog", "hotdog", "sosiska"], emoji: "🌭", background: "#fdf1e0" },
  { match: ["lavash", "donar", "doner", "shaurma", "shaverma", "shawarma", "burrito"], emoji: "🌯", background: "#f3f0e7" },
  { match: ["sushi", "roll"], emoji: "🍣", background: "#eaf1ff" },
  { match: ["kola", "cola", "ichimlik", "choy", "suv", "fresh", "sok"], emoji: "🥤", background: "#f7f7f8" },
  { match: ["shirinlik", "tort", "keks", "chizkeyk", "muzqaymoq", "desert"], emoji: "🍰", background: "#fdeef3" },
  { match: ["fri", "kartoshka", "nugget", "naggets", "snack"], emoji: "🍟", background: "#fdf3e3" },
  { match: ["sous", "ketchup", "mayonez", "xalapenyo", "jalapeno", "chili"], emoji: "🥫", background: "#fbeee6" },
  { match: ["salat", "salad"], emoji: "🥗", background: "#eef6ea" },
  { match: ["tost", "sendvich", "sandwich", "klab"], emoji: "🥪", background: "#f6f1e6" },
  { match: ["kombo", "set", "combo"], emoji: "🍱", background: "#fff1f0" },
  { match: ["sho'rva", "shorva", "lagmon", "osh", "palov", "mastava"], emoji: "🍲", background: "#f6efe7" },
  { match: ["somsa", "patir", "non", "lepyoshka"], emoji: "🥟", background: "#f7f0e4" },
  { match: ["manti", "chuchvara", "pelmen"], emoji: "🥠", background: "#f5f2ea" },
  { match: ["kabob", "kebab", "shashlik", "jigar"], emoji: "🍢", background: "#f6ece6" },
  { match: ["tovuq", "chicken", "qanot", "wings"], emoji: "🍗", background: "#fdf3e3" },
  { match: ["kofe", "coffee", "kapuchino"], emoji: "☕️", background: "#f4ede4" },
];

const DEFAULT = { emoji: "🍽", background: "#f7f7f8" };

function matchStyle(text) {
  const haystack = (text || "").toLowerCase();
  return PALETTE.find((entry) => entry.match.some((word) => haystack.includes(word)));
}

// A flat square with an icon reads as a missing photograph. A tinted
// gradient with the dish's icon lifted onto a soft disc reads as a chosen
// illustration — which is what a menu without photographs needs, and it
// costs nothing to serve since it is still a few hundred bytes of SVG.
function placeholderImage(emoji, background, accent) {
  const tint = accent || "#d8d8dc";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${background}"/>` +
    `<stop offset="1" stop-color="${tint}" stop-opacity="0.35"/>` +
    `</linearGradient>` +
    `<radialGradient id="d" cx="0.5" cy="0.45" r="0.5">` +
    `<stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>` +
    `<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="600" height="600" fill="url(#g)"/>` +
    `<circle cx="300" cy="278" r="190" fill="url(#d)"/>` +
    `<text x="300" y="285" font-size="250" text-anchor="middle" dominant-baseline="central">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Guesses a fitting icon from the product and category names, so a menu
// imported without photographs still looks sorted rather than blank.
function placeholderFor(name, categoryName, accent) {
  // The dish's own name decides, and the category only fills in when the
  // name says nothing — otherwise a shawarma sitting in a "Hot-dog va
  // shaverma" category would borrow the hot dog's icon.
  const style = matchStyle(name) || matchStyle(categoryName) || DEFAULT;
  return placeholderImage(style.emoji, style.background, accent);
}

module.exports = { placeholderImage, placeholderFor };
