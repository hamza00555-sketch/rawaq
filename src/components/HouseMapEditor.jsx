import { useRef, useState } from "react";
import { GRID_COLS, GRID_ROWS, collides } from "../houseMap.js";
import { rectStyle, BlockContent } from "./HouseMap.jsx";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Grid editor: drag a block to move it, drag the selected block's corner
// handle to resize, tap the ✕ chip to unplace. The grid is a no-scroll
// island (touch-action none), so dragging starts immediately — no
// long-press needed. Geometry is committed on pointerup only; an
// overlapping drop tints red and reverts. Selection is controlled by the
// parent, which shows a size/door toolbar for the selected block.
export default function HouseMapEditor({ entries, blocks, onChange, selected, setSelected }) {
  const [draft, setDraft] = useState(null); // {id, rect, valid}
  const gesture = useRef(null);
  const gridRef = useRef(null);

  const startGesture = (mode, id) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // synthetic events (tests) have no active pointer — capture is optional
    }
    setSelected(id);
    gesture.current = {
      mode,
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      orig: blocks[id],
      moved: false,
      last: null,
    };
  };

  const handleMove = (e) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.pointerId) return;
    const grid = gridRef.current?.getBoundingClientRect();
    if (!grid || !grid.width) return;
    // Rect-relative cell math — safe under the large-UI zoom.
    const dCol = Math.round((e.clientX - g.startX) / (grid.width / GRID_COLS));
    const dRow = Math.round((e.clientY - g.startY) / (grid.height / GRID_ROWS));
    // spread orig first: keeps non-geometry fields (door) through commits
    let rect;
    if (g.mode === "move") {
      rect = {
        ...g.orig,
        x: clamp(g.orig.x + dCol, 0, GRID_COLS - g.orig.w),
        y: clamp(g.orig.y + dRow, 0, GRID_ROWS - g.orig.h),
      };
    } else {
      rect = {
        ...g.orig,
        w: clamp(g.orig.w + dCol, 1, GRID_COLS - g.orig.x),
        h: clamp(g.orig.h + dRow, 1, GRID_ROWS - g.orig.y),
      };
    }
    if (dCol !== 0 || dRow !== 0) g.moved = true;
    g.last = { rect, valid: !collides(blocks, g.id, rect) };
    setDraft({ id: g.id, ...g.last });
  };

  const handleUp = (e) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.pointerId) return;
    gesture.current = null;
    if (g.moved && g.last?.valid) onChange({ ...blocks, [g.id]: g.last.rect });
    setDraft(null);
  };

  const handleCancel = () => {
    gesture.current = null;
    setDraft(null);
  };

  const removeBlock = (id) => {
    const next = { ...blocks };
    delete next[id];
    onChange(next);
    setSelected(null);
  };

  const moveByKey = (entry) => (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeBlock(entry.id);
      return;
    }
    if (e.key === "Escape") {
      setSelected(null);
      return;
    }
    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[e.key];
    if (!delta) return;
    e.preventDefault();
    setSelected(entry.id);
    const b = blocks[entry.id];
    const rect = {
      ...b,
      x: clamp(b.x + delta[0], 0, GRID_COLS - b.w),
      y: clamp(b.y + delta[1], 0, GRID_ROWS - b.h),
    };
    if (!collides(blocks, entry.id, rect)) onChange({ ...blocks, [entry.id]: rect });
  };

  return (
    <div
      className="house-map editing"
      dir="ltr"
      ref={gridRef}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelected(null);
      }}
    >
      {entries.map((entry) => {
        const dragging = draft?.id === entry.id;
        const rect = dragging ? draft.rect : blocks[entry.id];
        const small = rect.w === 1 || rect.h === 1;
        const isSelected = selected === entry.id;
        const cls = [
          "map-block",
          `type-${entry.type || "general"}`,
          small ? "small" : "",
          isSelected ? "selected" : "",
          dragging ? "dragging" : "",
          dragging && !draft.valid ? "invalid" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div
            key={entry.id}
            role="button"
            tabIndex={0}
            aria-label={entry.name}
            className={cls}
            style={{ ...rectStyle(rect), touchAction: "none" }}
            onPointerDown={startGesture("move", entry.id)}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleCancel}
            onKeyDown={moveByKey(entry)}
          >
            <BlockContent emoji={entry.emoji} name={entry.name} priority={entry.priority} />
            {rect.door && <span className={`map-door door-${rect.door}`} aria-hidden="true" />}
            {isSelected && !dragging && (
              <button
                type="button"
                className="map-remove-chip"
                aria-label={entry.removeLabel}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeBlock(entry.id)}
              />
            )}
            {isSelected && (
              <span
                className="map-resize-handle"
                aria-hidden="true"
                style={{ touchAction: "none" }}
                onPointerDown={startGesture("resize", entry.id)}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleCancel}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
