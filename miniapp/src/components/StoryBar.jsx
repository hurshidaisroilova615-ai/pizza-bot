import Icon from "./Icon";
import { hapticFeedback } from "../telegram";

export default function StoryBar({ stories, onSelect }) {
  return (
    <div className="story-row">
      {stories.map((s) => (
        <button
          className="story-item"
          key={s.key}
          onClick={() => {
            hapticFeedback("light");
            onSelect(s);
          }}
        >
          <span className={`story-circle ${s.dim ? "dim" : ""}`}>
            <span className="story-circle-inner">
              <Icon name={s.icon || "tag"} size={24} strokeWidth={1.8} />
            </span>
          </span>
          <span className="story-label">{s.title}</span>
        </button>
      ))}
    </div>
  );
}
