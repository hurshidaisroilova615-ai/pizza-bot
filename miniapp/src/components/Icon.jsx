// Line icons drawn as inline SVG. Emoji were doing this job, and emoji are
// the single clearest sign of a bot thrown together in an afternoon: they
// render differently on every phone, they can't take the accent colour, and
// they never line up with each other. These do all three.
const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H9.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V21h3a1 1 0 0 0 1-1V9.5",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  cart: "M3 4h2.2a1 1 0 0 1 1 .8L6.6 7m0 0 1.6 8.1a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.55L21 7H6.6ZM10 21h.01M17 21h.01",
  user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4.5 21a7.5 7.5 0 0 1 15 0",
  fire: "M12 3c.6 3.2-1.8 4.3-2.9 6.2A5.6 5.6 0 0 0 8.4 12 5.2 5.2 0 0 0 12 21a5.2 5.2 0 0 0 3.6-9c-.5-.6-1.2-1-1.3-2 -1 .8-1.6 1.9-1.6 3 -1.6-1.3-1.4-4.6-.7-10Z",
  sparkle: "M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5ZM18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z",
  star: "m12 3.8 2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.75-5.2 2.75 1-5.8-4.2-4.1 5.8-.85L12 3.8Z",
  gift: "M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M3 8h18v4H3V8ZM12 8v13M12 8S10.5 3.5 8 3.5 5.5 8 8 8h4Zm0 0s1.5-4.5 4-4.5S20.5 8 18 8h-4Z",
  truck: "M3 6.5h10.5v10H3zM13.5 10H17l3 3v3.5h-6.5zM7 20a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM17.5 20a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z",
  tag: "M3.5 11.3V4.8a1.3 1.3 0 0 1 1.3-1.3h6.5a1.3 1.3 0 0 1 .92.38l8 8a1.3 1.3 0 0 1 0 1.84l-6.5 6.5a1.3 1.3 0 0 1-1.84 0l-8-8a1.3 1.3 0 0 1-.38-.92ZM7.75 8.25h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5.2l3.2 1.9",
  // A pot with steam: the chef's-hat outline collapsed into a blob at 16px.
  chef: "M4 11h16v3.5a5.5 5.5 0 0 1-5.5 5.5h-5A5.5 5.5 0 0 1 4 14.5V11ZM20 12.5h1.2a1.8 1.8 0 0 1 0 3.6H20M9 7.5c0-1.2 1.2-1.5 1.2-2.5M13 7.5c0-1.2 1.2-1.5 1.2-2.5",
  check: "m4.5 12.5 5 5 10-11",
  plus: "M12 5v14M5 12h14",
  walk: "M13.5 5.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM10 22l2.2-5.4-2.4-2.3.9-5.1L8 11.4 6.5 14M14.6 9.2l1.7 2.6 2.7.9M12.7 14.6l1.6 3 .9 4.4",
  card: "M3 8.5h18M3 7a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 7v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17V7ZM6.5 14.5h3",
  cash: "M3 6.5h18v11H3zM12 15a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6.5 9.5h.01M17.5 14.5h.01",
  pin: "M12 21s6.5-5.7 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21ZM12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  bag: "M6 8h12l1 12.5H5L6 8ZM9 8V6.5a3 3 0 0 1 6 0V8",
  // A handset: on a shop's own web page this one is tapped more than
  // anything else, because half these customers still prefer to call.
  phone: "M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z",
};

export default function Icon({ name, size = 22, strokeWidth = 1.7, className = "", filled = false }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
