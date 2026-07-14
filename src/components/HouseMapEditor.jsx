import { useEffect, useRef, useState } from "react";
import { collides, cycleEdge, edgeKind, sideLen } from "../houseMap.js";
import { rectStyle, BlockContent, EdgeMarks } from "./HouseMap.jsx";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const MIN_CELL = 14;
const MAX_CELL = 84;

// Grid editor: drag a block to move it, drag the selected block's corner
// handle to resize, tap the ✕ chip to unplace. Selecting a block also
// reveals a dot on every wall segment — tapping a dot cycles that piece
// of wall: door → exit door → open (no wall) → plain wall. The grid is
// a no-scroll island (touch-action none), so dragging starts immediately
// — no long-press needed. Geometry is committed on pointerup only; an
// overlapping drop tints red and reverts. Selection is controlled by the
// parent, which shows a size toolbar for the selected block.
//
// The canvas is one big open grid. Navigate it freely: drag empty space to
// pan (JS-driven, same on touch and mouse) and pinch with two fingers to
// zoom — the cell size grows/shrinks, so the drawing stays crisp at any
// scale. A tap on empty space just deselects.
export default function HouseMapEditor({ entries, blocks, cols, rows, onChange, selected, setSelected }) {
  const [draft, setDraft] = useState(null); // {id, rect, valid}
  const [cell, setCell] = useState(34); // px per grid cell (pinch-zoom)
  const gesture = useRef(null);
  const gridRef = useRef(null);
  const viewportRef = useRef(null);
  const pan = useRef(null);
  const cellRef = useRef(cell);
  cellRef.current = cell;
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  // On open, pick a comfortable zoom for this screen and scroll to wherever
  // the rooms already are (or the top-left for an empty canvas).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const w = vp.clientWidth || 320;
    const initial = clamp(Math.round(w / 11), 24, 46);
    setCell(initial);
    requestAnimationFrame(() => {
      const rects = Object.values(blocks);
      if (!rects.length || !viewportRef.current) return;
      const minX = Math.min(...rects.map((b) => b.x));
      const minY = Math.min(...rects.map((b) => b.y));
      viewportRef.current.scrollLeft = Math.max(0, minX * initial - 20);
      viewportRef.current.scrollTop = Math.max(0, minY * initial - 20);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Two-finger pinch → zoom. Pointer tracking runs in the capture phase so
  // it sees every finger even when the first landed on a block (which stops
  // propagation). When a second finger arrives, any one-finger drag is
  // cancelled and we scale the cell size, anchoring on the pinch midpoint.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const pts = pointers.current;
    const spread = () => {
      const [a, b] = [...pts.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    };
    const down = (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        gesture.current = null; // abort a block move/resize in progress
        pan.current = null;
        setDraft(null);
        const s = spread();
        pinch.current = { d0: s.d || 1, cell0: cellRef.current };
      }
    };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!pinch.current || pts.size < 2) return;
      const s = spread();
      const next = clamp(Math.round(pinch.current.cell0 * (s.d / pinch.current.d0)), MIN_CELL, MAX_CELL);
      const prev = cellRef.current;
      if (next === prev) return;
      const rect = vp.getBoundingClientRect();
      // content coord (at current scale) under the pinch midpoint
      const cx = s.mx - rect.left + vp.scrollLeft;
      const cy = s.my - rect.top + vp.scrollTop;
      const ratio = next / prev;
      setCell(next);
      requestAnimationFrame(() => {
        vp.scrollLeft = cx * ratio - (s.mx - rect.left);
        vp.scrollTop = cy * ratio - (s.my - rect.top);
      });
    };
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch.current = null;
    };
    vp.addEventListener("pointerdown", down, { capture: true });
    vp.addEventListener("pointermove", move, { capture: true });
    vp.addEventListener("pointerup", up, { capture: true });
    vp.addEventListener("pointercancel", up, { capture: true });
    return () => {
      vp.removeEventListener("pointerdown", down, { capture: true });
      vp.removeEventListener("pointermove", move, { capture: true });
      vp.removeEventListener("pointerup", up, { capture: true });
      vp.removeEventListener("pointercancel", up, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag on empty grid → pan the viewport; a tap (no drag) → deselect.
  // Blocks stopPropagation on pointerdown, so grabbing a block never pans.
  const startPan = (e) => {
    if (e.target !== e.currentTarget || pinch.current || pointers.current.size >= 2) return;
    const vp = viewportRef.current;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // synthetic events (tests) have no active pointer
    }
    pan.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      left: vp?.scrollLeft || 0,
      top: vp?.scrollTop || 0,
      moved: false,
    };
  };

  const movePan = (e) => {
    const p = pan.current;
    if (!p || e.pointerId !== p.pointerId || pinch.current) return;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) p.moved = true;
    const vp = viewportRef.current;
    if (vp) {
      vp.scrollLeft = p.left - dx;
      vp.scrollTop = p.top - dy;
    }
  };

  const endPan = (e) => {
    const p = pan.current;
    if (!p || e.pointerId !== p.pointerId) return;
    pan.current = null;
    if (!p.moved) setSelected(null); // tap on empty space → deselect
  };

  const startGesture = (mode, id) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (pinch.current || pointers.current.size >= 2) return;
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
    if (!g || e.pointerId !== g.pointerId || pinch.current) return;
    const grid = gridRef.current?.getBoundingClientRect();
    if (!grid || !grid.width) return;
    // Rect-relative cell math — safe under the large-UI zoom.
    const dCol = Math.round((e.clientX - g.startX) / (grid.width / cols));
    const dRow = Math.round((e.clientY - g.startY) / (grid.height / rows));
    // spread orig first: keeps non-geometry fields (edges) through commits
    let rect;
    if (g.mode === "move") {
      rect = {
        ...g.orig,
        x: clamp(g.orig.x + dCol, 0, cols - g.orig.w),
        y: clamp(g.orig.y + dRow, 0, rows - g.orig.h),
      };
    } else {
      rect = {
        ...g.orig,
        w: clamp(g.orig.w + dCol, 1, cols - g.orig.x),
        h: clamp(g.orig.h + dRow, 1, rows - g.orig.y),
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
      x: clamp(b.x + delta[0], 0, cols - b.w),
      y: clamp(b.y + delta[1], 0, rows - b.h),
    };
    if (!collides(blocks, entry.id, rect)) onChange({ ...blocks, [entry.id]: rect });
  };

  // One tappable dot per wall segment of the selected block.
  const edgeDots = (id, rect) => {
    const dots = [];
    for (const side of ["n", "e", "s", "w"]) {
      const len = sideLen(rect, side);
      const horizontal = side === "n" || side === "s";
      for (let at = 0; at < len; at++) {
        const kind = edgeKind(rect, side, at);
        const along = `${((at + 0.5) / len) * 100}%`;
        const pos = horizontal
          ? { left: along, transform: "translateX(-50%)", [side === "n" ? "top" : "bottom"]: -15 }
          : { top: along, transform: "translateY(-50%)", [side === "e" ? "right" : "left"]: -15 };
        dots.push(
          <button
            key={`${side}:${at}`}
            type="button"
            className={`map-edge-dot ${kind ? `kind-${kind}` : ""}`}
            style={pos}
            aria-label={`${side}${at}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange({ ...blocks, [id]: cycleEdge(rect, side, at) })}
          />
        );
      }
    }
    return dots;
  };

  return (
    <div className="map-viewport" dir="ltr" ref={viewportRef}>
    <div
      className={`house-map editing${cols >= 15 ? " dense-3" : cols >= 12 ? " dense-2" : cols >= 9 ? " dense-1" : ""}`}
      dir="ltr"
      ref={gridRef}
      style={{ "--cols": cols, "--rows": rows, "--edit-cell": `${cell}px` }}
      onPointerDown={startPan}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
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
            style={{ ...rectStyle(rect, cols, rows), touchAction: "none" }}
            onPointerDown={startGesture("move", entry.id)}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleCancel}
            onKeyDown={moveByKey(entry)}
          >
            {entry.showLabel !== false && (
              <BlockContent emoji={entry.emoji} name={entry.name} priority={entry.priority} />
            )}
            <EdgeMarks rect={rect} />
            {isSelected && !dragging && (
              <>
                <button
                  type="button"
                  className="map-remove-chip"
                  aria-label={entry.removeLabel}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeBlock(entry.id)}
                />
                {edgeDots(entry.id, rect)}
              </>
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
    </div>
  );
}
