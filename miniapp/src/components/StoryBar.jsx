const DEFAULT_STORIES = [
  { emoji: "🔥", label: "Aksiyalar" },
  { emoji: "🆕", label: "Yangi" },
  { emoji: "🎁", label: "Bonus" },
  { emoji: "⭐️", label: "Top" },
  { emoji: "🚚", label: "Yetkazish" },
];

export default function StoryBar({ offers = [], onSelectOffer }) {
  const stories = offers.length > 0 ? offers.map((o) => ({ emoji: "🎁", label: o.title, offer: o })) : DEFAULT_STORIES;

  return (
    <div className="story-row">
      {stories.map((s, i) => (
        <div
          className="story-item"
          key={s.offer?.id ?? i}
          onClick={() => s.offer && onSelectOffer?.(s.offer)}
          role={s.offer ? "button" : undefined}
        >
          <div className="story-circle">
            <div className="story-circle-inner">{s.emoji}</div>
          </div>
          <span className="story-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
