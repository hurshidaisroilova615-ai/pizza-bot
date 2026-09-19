// Checks the translation tables against each other.
//
// Run with: npm run test:i18n
//
// The bug this exists to catch: a string added in one language and forgotten
// in the others, which reaches a customer as an Uzbek sentence in the middle
// of a Russian screen. Two whole components were missed that way once
// already, so this compares every key, every placeholder and every plural
// form rather than trusting a reading of the diff.
import { messages, LANGUAGES, PLURALS, pluralIndex } from "../src/i18n/messages.js";

const REFERENCE = "uz";
const langs = Object.keys(messages);
const reference = new Set(Object.keys(messages[REFERENCE]));
const problems = [];

for (const code of LANGUAGES.map((l) => l.code)) {
  if (!messages[code]) problems.push(`${code}: offered in the picker but has no table`);
}

for (const lang of langs) {
  const keys = new Set(Object.keys(messages[lang]));
  for (const key of reference) {
    if (!keys.has(key)) problems.push(`${lang}: missing "${key}"`);
  }
  for (const key of keys) {
    if (!reference.has(key)) problems.push(`${lang}: has "${key}" which ${REFERENCE} does not`);
    if (!String(messages[lang][key]).trim()) problems.push(`${lang}: "${key}" is empty`);
  }
}

// A placeholder that exists in one language and not another renders a
// literal "{count}" on someone's screen.
const placeholders = (text) =>
  [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

for (const key of reference) {
  const expected = placeholders(messages[REFERENCE][key]);
  for (const lang of langs) {
    if (!messages[lang][key]) continue;
    const got = placeholders(messages[lang][key]);
    if (got !== expected) {
      problems.push(`${lang}: "${key}" takes [${got}] but ${REFERENCE} takes [${expected}]`);
    }
  }
}

for (const [lang, table] of Object.entries(PLURALS)) {
  for (const [key, forms] of Object.entries(table)) {
    if (!reference.has(key)) problems.push(`${lang}: plural forms for unknown key "${key}"`);
    if (forms.length !== 3) problems.push(`${lang}: "${key}" needs 3 plural forms, has ${forms.length}`);
    const expected = placeholders(messages[REFERENCE][key] ?? "");
    for (const form of forms) {
      if (placeholders(form) !== expected) {
        problems.push(`${lang}: plural form "${form}" does not take [${expected}]`);
      }
    }
  }
}

// Russian counts in three forms and the rule is arithmetic, so it can be
// checked outright rather than eyeballed.
const RU_CASES = [
  [1, 0], [2, 1], [4, 1], [5, 2], [11, 2], [12, 2], [14, 2],
  [21, 0], [22, 1], [25, 2], [101, 0], [111, 2], [0, 2],
];
for (const [n, expected] of RU_CASES) {
  const got = pluralIndex("ru", n);
  if (got !== expected) problems.push(`ru: ${n} should take form ${expected}, got ${got}`);
}

for (const p of problems) console.log("FAIL " + p);
console.log(
  problems.length
    ? `\n${problems.length} problems across ${langs.length} languages`
    : `${langs.join(", ")}: ${reference.size} keys each, placeholders and plurals consistent`
);
process.exit(problems.length ? 1 : 0);
