// Ordering from the table you are sitting at.
//
// The cafe prints one code per table; the code is this page's address with
// ?table=5 on the end. A customer scans it, the menu opens already knowing
// where they are sitting, and nothing about delivery is ever asked — there
// is no address, no fee, and no courier. The waiter's alert says the table.
//
// The number survives the visit but not longer: somebody who scanned a
// table at lunch and opens the same shop from home in the evening is not
// at that table any more.
const TABLE_KEY = "dine_in_table";

// Whatever the cafe calls its tables, printed on a sticker: "5", "A3",
// "terrasa 2". Kept short so a mistyped link cannot smuggle a paragraph
// into the kitchen's alert.
const SHAPE = /^[\p{L}\p{N} ._/-]{1,20}$/u;

function clean(raw) {
  const value = String(raw || "").trim();
  return SHAPE.test(value) ? value : null;
}

export function currentTable() {
  const fromLink = clean(new URLSearchParams(window.location.search).get("table"));
  if (fromLink) {
    try {
      sessionStorage.setItem(TABLE_KEY, fromLink);
    } catch {
      // storage blocked; the number still holds for this page
    }
    return fromLink;
  }
  try {
    return clean(sessionStorage.getItem(TABLE_KEY));
  } catch {
    return null;
  }
}

// Leaving the table, after the order is placed or if they say they are not
// there — otherwise the next order would go to a table they have left.
export function forgetTable() {
  try {
    sessionStorage.removeItem(TABLE_KEY);
  } catch {
    // nothing stored to forget
  }
}
