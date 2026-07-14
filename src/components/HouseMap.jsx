import { press } from "../press.js";
import { DEFAULT_COLS, DEFAULT_ROWS, blockEdges } from "../houseMap.js";

// Percent geometry keeps blocks correct at any width and under the
// large-UI zoom setting.
export const rectStyle = (r, cols = DEFAULT_COLS, rows = DEFAULT_ROWS) => ({
  left: `${(r.x / cols) * 100}%`,
  top: `${(r.y / rows) * 100}%`,
  width: `${(r.w / cols) * 100}%`,
  height: `${(r.h / rows) * 100}%`,
});

// Position + size of a wall-segment marker (door/exit/open) on a block:
// centered on cell `at` of `side`, thin across the wall, most of a cell
// long along it.
export function edgeStyle(rect, { side, at, kind }) {
  const horizontal = side === "n" || side === "s";
  const len = horizontal ? rect.w : rect.h;
  const along = `${((at + 0.5) / len) * 100}%`;
  const size = `${(kind === "open" ? 84 : 50) / len}%`;
  const thick = kind === "open" ? 8 : 5;
  return horizontal
    ? { left: along, transform: "translateX(-50%)", width: size, height: thick, [side === "n" ? "top" : "bottom"]: -4 }
    : { top: along, transform: "translateY(-50%)", height: size, width: thick, [side === "e" ? "right" : "left"]: -4 };
}

export function BlockContent({ emoji, name, priority }) {
  return (
    <>
      {priority != null && <span className="map-priority">{priority}</span>}
      <span className="map-emoji" aria-hidden="true">{emoji}</span>
      <span className="map-name">{name}</span>
    </>
  );
}

export function EdgeMarks({ rect }) {
  return blockEdges(rect).map((edge) => (
    <span
      key={`${edge.side}:${edge.at}`}
      className={`map-edge edge-${edge.kind}`}
      style={edgeStyle(rect, edge)}
      aria-hidden="true"
    />
  ));
}

// Read-only house map, shared by mom's preview and the worker view.
// The canvas is always LTR: a floor plan is spatial, not text — it must
// not mirror when the UI language flips between Arabic and English.
// entries: [{id, roomId?, rect, emoji, name, type, priority, done, dimmed, showLabel?}]
// A hall can span several blocks: each is its own entry sharing one roomId,
// and only the primary segment shows the label (showLabel). Tap/selection act
// on roomId. (rect may carry edges/legacy door; blocks are tappable unless dimmed)
export default function HouseMap({ entries, cols = DEFAULT_COLS, rows = DEFAULT_ROWS, selectedId, onTapRoom, fit = false }) {
  // Fit mode (Home preview): crop to the placed rooms' bounding box and
  // let the container's aspect-ratio follow the real house shape, so a
  // wide house renders short-and-wide and a tall house a narrow strip —
  // never the full empty grid. CSS caps the height either way.
  let vcols = cols;
  let vrows = rows;
  let items = entries;
  const style = { "--cols": cols, "--rows": rows };
  if (fit && entries.length) {
    const minX = Math.min(...entries.map((e) => e.rect.x));
    const minY = Math.min(...entries.map((e) => e.rect.y));
    const maxX = Math.max(...entries.map((e) => e.rect.x + e.rect.w));
    const maxY = Math.max(...entries.map((e) => e.rect.y + e.rect.h));
    vcols = maxX - minX;
    vrows = maxY - minY;
    items = entries.map((e) => ({ ...e, rect: { ...e.rect, x: e.rect.x - minX, y: e.rect.y - minY } }));
    style["--cols"] = vcols;
    style["--rows"] = vrows;
    style["--ar"] = vcols / vrows;
  }
  const dense = vcols >= 15 ? " dense-3" : vcols >= 12 ? " dense-2" : vcols >= 9 ? " dense-1" : "";

  return (
    <div
      className={`house-map${dense}${fit ? " fit" : ""}`}
      dir="ltr"
      style={style}
    >
      {items.map((entry) => {
        const rid = entry.roomId ?? entry.id;
        const small = entry.rect.w === 1 || entry.rect.h === 1;
        const tappable = !!onTapRoom && !entry.dimmed;
        const cls = [
          "map-block",
          `type-${entry.type || "general"}`,
          small ? "small" : "",
          entry.done ? "done" : "",
          entry.dimmed ? "dimmed" : "",
          selectedId === rid ? "selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={entry.id}
            type="button"
            className={cls}
            style={rectStyle(entry.rect, vcols, vrows)}
            disabled={!tappable}
            aria-label={entry.name}
            aria-pressed={selectedId === rid}
            {...(tappable ? press(() => onTapRoom(rid)) : {})}
          >
            {entry.showLabel !== false && (
              <BlockContent emoji={entry.emoji} name={entry.name} priority={entry.priority} />
            )}
            <EdgeMarks rect={entry.rect} />
          </button>
        );
      })}
    </div>
  );
}
