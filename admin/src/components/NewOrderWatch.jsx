import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useT } from "../i18n";

// The thing that tells a shop an order has arrived.
//
// A shop on Telegram gets a message in a chat. A shop that only has the
// website has no chat — the orders list quietly refreshed itself every
// fifteen seconds and waited to be looked at, which in a kitchen means an
// order sits until somebody happens to glance at a screen.
//
// So the panel itself has to be the bell: a sound, a banner, and a count
// in the browser tab, on whichever page the owner left open.
const POLL_MS = 15000;
const SEEN_KEY = "last_seen_order_id";
const MUTE_KEY = "order_sound_muted";

function readNumber(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : Number(raw);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // storage blocked; the bell still rings for this visit
  }
}

// Two short tones, made on the spot. A sound file would be one more thing
// to deploy and one more thing to be missing when it matters.
function ring(ctx) {
  if (!ctx) return;
  const at = ctx.currentTime;
  [0, 0.18].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = i === 0 ? 880 : 1175;
    gain.gain.setValueAtTime(0.0001, at + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, at + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + offset + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at + offset);
    osc.stop(at + offset + 0.18);
  });
}

export default function NewOrderWatch() {
  const { t } = useT();
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(0);
  const [muted, setMuted] = useState(() => readNumber(MUTE_KEY) === 1);
  const audio = useRef(null);
  const baseTitle = useRef(document.title);

  // A browser will not make a sound until the page has been clicked, so the
  // audio is opened on the first click and kept.
  useEffect(() => {
    function unlock() {
      try {
        if (!audio.current) audio.current = new (window.AudioContext || window.webkitAudioContext)();
        if (audio.current.state === "suspended") audio.current.resume();
      } catch {
        // no audio in this browser; the banner still shows
      }
    }
    document.addEventListener("click", unlock);
    return () => document.removeEventListener("click", unlock);
  }, []);

  useEffect(() => {
    let active = true;
    let lastRung = readNumber(SEEN_KEY);

    async function check() {
      let pending;
      try {
        pending = await api.getOrders("PENDING");
      } catch {
        return; // asleep or offline; the next tick tries again
      }
      if (!active || !Array.isArray(pending)) return;

      const seen = readNumber(SEEN_KEY);
      // First ever visit: take what is on the screen as already known,
      // rather than greeting a new owner with a week of alarms.
      if (seen == null) {
        write(SEEN_KEY, pending.reduce((max, o) => Math.max(max, o.id), 0));
        return;
      }

      const fresh = pending.filter((o) => o.id > seen);
      setWaiting(fresh.length);
      const newest = fresh.reduce((max, o) => Math.max(max, o.id), 0);
      if (newest > (lastRung ?? 0)) {
        lastRung = newest;
        if (!muted) ring(audio.current);
      }
    }

    check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [muted]);

  // The tab itself carries the count, for the panel left open behind
  // whatever else is on the screen.
  useEffect(() => {
    document.title = waiting > 0 ? `(${waiting}) ${baseTitle.current}` : baseTitle.current;
  }, [waiting]);

  const open = useCallback(() => {
    setWaiting(0);
    api
      .getOrders("PENDING")
      .then((pending) => {
        const max = (pending || []).reduce((m, o) => Math.max(m, o.id), 0);
        if (max) write(SEEN_KEY, max);
      })
      .catch(() => {});
    navigate("/orders");
  }, [navigate]);

  function toggleMute(e) {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    write(MUTE_KEY, next ? 1 : 0);
  }

  if (waiting === 0) return null;

  return (
    <button type="button" className="order-bell" onClick={open}>
      <span className="order-bell-dot" />
      <span>{t("{n} ta yangi buyurtma", { n: waiting })}</span>
      <span className="order-bell-mute" onClick={toggleMute} role="button">
        {muted ? t("Ovozni yoqish") : t("Ovozni o'chirish")}
      </span>
    </button>
  );
}
