import { press } from "../press.js";
import { GRID_COLS, GRID_ROWS } from "../houseMap.js";

// Percent geometry keeps blocks correct at any width and under the
// large-UI zoom setting.
export const rectStyle = (r) => ({
  left: `${(r.x / GRID_COLS) * 100}%`,
  top: `${(r.y / GRID_ROWS) * 100}%`,
  width: `${(r.w / GRID_COLS) * 100}%`,
  height: `${(r.h / GRID_ROWS) * 100}%`,
});

export function BlockContent({ emoji, name, priority }) {
  return (
    <>
      {priority != null && <span className="map-priority">{priority}</span>}
      <span className="map-emoji" aria-hidden="true">{emoji}</span>
      <span className="map-name">{name}</span>
    </>
  );
}

// Read-only house map, shared by mom's preview and the worker view.
// The canvas is always LTR: a floor plan is spatial, not text — it must
// not mirror when the UI language flips between Arabic and English.
// entries: [{id, rect, emoji, name, type, priority, done, dimmed}]
export default function HouseMap({ entries, selectedId, onTapRoom }) {
  return (
    <div className="house-map" dir="ltr">
      {entries.map((entry) => {
        const small = entry.rect.w === 1 || entry.rect.h === 1;
        const tappable = !!onTapRoom && !entry.dimmed;
        const cls = [
          "map-block",
          `type-${entry.type || "general"}`,
          small ? "small" : "",
          entry.done ? "done" : "",
          entry.dimmed ? "dimmed" : "",
          selectedId === entry.id ? "selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={entry.id}
            type="button"
            className={cls}
            style={rectStyle(entry.rect)}
            disabled={!tappable}
            aria-label={entry.name}
            aria-pressed={selectedId === entry.id}
            {...(tappable ? press(() => onTapRoom(entry.id)) : {})}
          >
            <BlockContent emoji={entry.emoji} name={entry.name} priority={entry.priority} />
          </button>
        );
      })}
    </div>
  );
}
