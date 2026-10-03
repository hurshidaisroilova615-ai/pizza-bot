// A dish photograph, or something deliberate in its place.
//
// A cafe types its whole menu in long before anybody has time to
// photograph it, so a dish with no picture is ordinary. An <img> with no
// src is not: the browser paints its own broken-image glyph and the alt
// text across the card, and a shop that has simply not uploaded pictures
// yet looks broken to the customer reading it.
export default function Thumb({ src, alt = "", className = "", label = "" }) {
  if (src) return <img className={className} src={src} alt={alt} loading="lazy" />;

  const initial = label.trim().charAt(0).toUpperCase();
  return (
    <span className={`${className} thumb-empty`} aria-hidden="true">
      {initial}
    </span>
  );
}
