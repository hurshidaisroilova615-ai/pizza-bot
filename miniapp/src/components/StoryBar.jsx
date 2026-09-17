export default function StoryBar({ stories, onSelect }) {
  return (
    <div className="story-row">
      {stories.map((s) => (
        <button className="story-item" key={s.key} onClick={() => onSelect(s)}>
          <div className={`story-circle ${s.dim ? "dim" : ""}`}>
            <div className="story-circle-inner">{s.emoji}</div>
          </div>
          <span className="story-label">{s.title}</span>
        </button>
      ))}
    </div>
  );
}
