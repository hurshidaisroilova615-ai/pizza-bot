import { useState } from "react";
import { BASE_URL } from "../api";
import { baseLabel, knownBases, switchBase, forgetBase } from "../apiBase";

// Which shop this panel is showing, and a way to move between them.
//
// One admin page serves every client, and which backend it talks to was
// only ever remembered from the last visit — so opening the panel could
// quietly bring up a different shop's orders than the one you meant. Now
// the name is always on screen, and switching is something you do rather
// than something that happens to you.
export default function WorkspaceSwitcher({ businessName }) {
  const [open, setOpen] = useState(false);
  const bases = knownBases();
  const others = bases.filter((b) => b.url !== BASE_URL);

  return (
    <div className="workspace">
      <button
        className={`workspace-current ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        disabled={others.length === 0}
        title={BASE_URL}
      >
        <span className="workspace-name">{businessName || "Admin"}</span>
        <span className="workspace-host">{baseLabel(BASE_URL)}</span>
        {others.length > 0 && <span className="workspace-caret">{open ? "▴" : "▾"}</span>}
      </button>

      {open && others.length > 0 && (
        <div className="workspace-list">
          {others.map((b) => (
            <div className="workspace-item" key={b.url}>
              <button className="workspace-switch" onClick={() => switchBase(b.url)}>
                <span className="workspace-name">{b.name || baseLabel(b.url)}</span>
                <span className="workspace-host">{baseLabel(b.url)}</span>
              </button>
              <button
                className="workspace-forget"
                title="Ro'yxatdan olib tashlash"
                onClick={() => {
                  forgetBase(b.url);
                  setOpen(false);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
