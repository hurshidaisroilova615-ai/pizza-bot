// Whether the kitchen is taking orders right now.
//
// The hours are kept on the business's own clock, and a window that ends
// before it starts runs past midnight — 07:00 to 02:00 is an ordinary
// late-night shift, not a mistake.

function minutesOf(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

function localMinutes(settings, now) {
  const offsetHours = Number.isFinite(settings.timezoneOffset) ? settings.timezoneOffset : 5;
  const local = new Date(now.getTime() + offsetHours * 3600000);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

// A business that has not set its hours is always open — that is the state
// a freshly set up bot is in, and it must not refuse orders because of it.
function openingState(settings, now = new Date()) {
  const open = minutesOf(settings.openTime);
  const close = minutesOf(settings.closeTime);
  if (open === null || close === null) {
    return { isOpen: true, openTime: null, closeTime: null };
  }

  const current = localMinutes(settings, now);
  const isOpen = open <= close ? current >= open && current < close : current >= open || current < close;
  return { isOpen, openTime: settings.openTime, closeTime: settings.closeTime };
}

module.exports = { openingState };
