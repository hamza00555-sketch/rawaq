// House map: rooms laid out as blocks on a single-floor grid.
// Geometry only — priority is simply the order of the rooms array.
// Map shape: { cols, rows, blocks: { [id]: {x, y, w, h, edges?} } }
//   edges: [{side: n|e|s|w, at: cell-offset along that side, kind}]
//   kind: "door" (inner door) | "exit" (house exit) | "open" (no wall —
//         open-plan connection, e.g. a majlis flowing into the hallway)
// The map canvas is always rendered dir="ltr": a floor plan is spatial,
// not text, so it must not mirror between Arabic and English.

// Zoom-out sizes. All 3:4, so the canvas keeps one aspect ratio and
// zooming just makes cells smaller (more house fits).
export const GRID_SIZES = [
  { cols: 6, rows: 8 },
  { cols: 9, rows: 12 },
  { cols: 12, rows: 16 },
  { cols: 15, rows: 20 },
  { cols: 18, rows: 24 },
  { cols: 21, rows: 28 },
  { cols: 24, rows: 32 },
];
export const DEFAULT_COLS = 6;
export const DEFAULT_ROWS = 8;

// The editor works on one big open canvas — mom pans and pinch-zooms freely
// instead of stepping through fixed zoom levels. Rooms still snap to this
// integer grid; read-only views crop to the used area so the empty space
// around the drawing never shows.
export const OPEN_COLS = 24;
export const OPEN_ROWS = 32;

export const EMPTY_MAP = { cols: DEFAULT_COLS, rows: DEFAULT_ROWS, blocks: {} };

// Hallways are map-only blocks (no tasks, no priority). They live in the
// same blocks map as rooms, under a reserved id prefix, so collision and
// share plumbing work unchanged.
export const HALL_PREFIX = "hall-";
export const isHall = (id) => id.startsWith(HALL_PREFIX);
export const newHallId = () => `${HALL_PREFIX}${Date.now().toString(36)}`;

export const SIDES = ["n", "e", "s", "w"];
export const EDGE_KINDS = ["door", "exit", "open"];

export function mapDims(map) {
  const size =
    GRID_SIZES.find((s) => s.cols === map?.cols && s.rows === map?.rows) || GRID_SIZES[0];
  return size;
}

// Length (in cells) of a block's side.
export const sideLen = (rect, side) => (side === "n" || side === "s" ? rect.w : rect.h);

export function edgeKind(rect, side, at) {
  return rect.edges?.find((e) => e.side === side && e.at === at)?.kind || null;
}

// Tap a wall segment → none → door → exit → open → none.
export function cycleEdge(rect, side, at) {
  const current = edgeKind(rect, side, at);
  const next = EDGE_KINDS[EDGE_KINDS.indexOf(current) + 1] || null;
  const edges = (rect.edges || []).filter((e) => !(e.side === side && e.at === at));
  if (next) edges.push({ side, at, kind: next });
  const out = { ...rect };
  if (edges.length) out.edges = edges;
  else delete out.edges;
  return out;
}

export function clampRect(rect, cols = DEFAULT_COLS, rows = DEFAULT_ROWS) {
  const w = Math.max(1, Math.min(cols, Math.round(rect.w)));
  const h = Math.max(1, Math.min(rows, Math.round(rect.h)));
  const x = Math.max(0, Math.min(cols - w, Math.round(rect.x)));
  const y = Math.max(0, Math.min(rows - h, Math.round(rect.y)));
  return { x, y, w, h };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Does `rect` collide with any placed block other than roomId's own?
export function collides(blocks, roomId, rect) {
  return Object.entries(blocks).some(([id, b]) => id !== roomId && overlaps(rect, b));
}

// First free spot for a w×h block, scanning top→bottom then left→right.
export function findFreeSpot(blocks, w, h, cols = DEFAULT_COLS, rows = DEFAULT_ROWS) {
  for (let y = 0; y <= rows - h; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const rect = { x, y, w, h };
      if (!collides(blocks, null, rect)) return rect;
    }
  }
  return null;
}

// Normalize a block's wall openings: migrate the legacy single `door`
// field (was always mid-wall), clamp offsets into the side, dedupe.
// Exported for renderers fed by share docs (which mom never sanitized).
export function blockEdges(b) {
  return sanitizeEdges(b, b);
}

function sanitizeEdges(b, rect) {
  const raw = Array.isArray(b.edges) ? b.edges : [];
  if (SIDES.includes(b.door)) {
    const len = sideLen(rect, b.door);
    raw.push({ side: b.door, at: Math.floor((len - 1) / 2), kind: "door" });
  }
  const seen = new Set();
  const edges = [];
  for (const e of raw) {
    if (!SIDES.includes(e?.side) || !EDGE_KINDS.includes(e?.kind)) continue;
    const at = Math.max(0, Math.min(sideLen(rect, e.side) - 1, Math.round(e.at) || 0));
    const key = `${e.side}:${at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ side: e.side, at, kind: e.kind });
  }
  return edges;
}

// Drop blocks for rooms that no longer exist (halls always stay), clamp
// stray geometry, normalize wall edges. Pure + idempotent — safe to run
// on every read instead of migrating.
export function sanitizeMap(map, rooms) {
  const { cols, rows } = mapDims(map);
  const blocks = map?.blocks || {};
  const ids = new Set(rooms.map((r) => r.id));
  const clean = {};
  for (const [id, b] of Object.entries(blocks)) {
    if ((!ids.has(id) && !isHall(id)) || !b) continue;
    const rect = clampRect(b, cols, rows);
    const edges = sanitizeEdges(b, rect);
    if (edges.length) rect.edges = edges;
    // A clamped block that now overlaps an earlier one is dropped rather
    // than shuffled — the room just returns to the unplaced tray.
    if (!collides(clean, id, rect)) clean[id] = rect;
  }
  return { cols, rows, blocks: clean };
}

export function hasPlacedRooms(map) {
  return Object.keys(map?.blocks || {}).length > 0;
}

// Can every placed block fit inside a cols×rows grid as-is?
export function blocksFit(blocks, cols, rows) {
  return Object.values(blocks).every((b) => b.x + b.w <= cols && b.y + b.h <= rows);
}

// A room is "done" when it has tasks in this list and all are checked.
export function roomDone(tasks, roomId) {
  const mine = tasks.filter((t) => t.roomId === roomId);
  return mine.length > 0 && mine.every((t) => t.done);
}

// The facing boundary counts as "sealed" when either block marks that wall —
// a door, exit, or opening — meaning mom put something between the two halls
// on purpose, so they must stay separate rather than fuse.
function sealedBetween(a, b, aSide, bSide) {
  return (
    (a.edges || []).some((e) => e.side === aSide) ||
    (b.edges || []).some((e) => e.side === bSide)
  );
}

// Two edge-touching rectangles that line up (same height on the same row, or
// same width in the same column) fuse into their union rectangle. Returns the
// merged rect (edges dropped — the shared wall is gone) or null when they
// don't form a clean rectangle (an L-shape can't be a single block) OR when
// the shared boundary carries a door/opening (kept separate on purpose).
export function hallMergeRect(a, b) {
  if (a.h === b.h && a.y === b.y) {
    if (a.x + a.w === b.x && !sealedBetween(a, b, "e", "w")) {
      return { x: a.x, y: a.y, w: a.w + b.w, h: a.h };
    }
    if (b.x + b.w === a.x && !sealedBetween(a, b, "w", "e")) {
      return { x: b.x, y: a.y, w: a.w + b.w, h: a.h };
    }
  }
  if (a.w === b.w && a.x === b.x) {
    if (a.y + a.h === b.y && !sealedBetween(a, b, "s", "n")) {
      return { x: a.x, y: a.y, w: a.w, h: a.h + b.h };
    }
    if (b.y + b.h === a.y && !sealedBetween(a, b, "n", "s")) {
      return { x: a.x, y: b.y, w: a.w, h: a.h + b.h };
    }
  }
  return null;
}

// Auto-merge hallways drawn next to each other. Whenever two hall blocks form
// a clean rectangle, fuse them into one hall: the earlier one (by rooms order)
// keeps its id/name/emoji and absorbs the other's tasks; the other hall room
// and its block are dropped. Repeats until nothing else merges (so a chain of
// segments collapses fully). Only halls merge — real rooms are never touched.
// Pure: returns the same rooms/blocks references when nothing changed.
export function mergeConnectedHalls(rooms, blocks) {
  let curRooms = rooms;
  let curBlocks = blocks;
  for (;;) {
    const hallIds = Object.keys(curBlocks).filter(isHall);
    let didMerge = false;
    for (let i = 0; i < hallIds.length && !didMerge; i++) {
      for (let j = i + 1; j < hallIds.length; j++) {
        const idA = hallIds[i];
        const idB = hallIds[j];
        const union = hallMergeRect(curBlocks[idA], curBlocks[idB]);
        if (!union) continue;
        const iA = curRooms.findIndex((r) => r.id === idA);
        const iB = curRooms.findIndex((r) => r.id === idB);
        // the earlier room wins; unknown ids (not yet in rooms) never win
        const aFirst = iA !== -1 && (iB === -1 || iA <= iB);
        const primary = aFirst ? idA : idB;
        const absorbed = aFirst ? idB : idA;
        const nextBlocks = { ...curBlocks, [primary]: union };
        delete nextBlocks[absorbed];
        const absorbedRoom = curRooms.find((r) => r.id === absorbed);
        curRooms = curRooms
          .map((r) => {
            if (r.id !== primary) return r;
            const have = new Set(r.tasks.map((t) => t.name.ar.trim()));
            const extra = (absorbedRoom?.tasks || []).filter((t) => !have.has(t.name.ar.trim()));
            return extra.length ? { ...r, tasks: [...r.tasks, ...extra] } : r;
          })
          .filter((r) => r.id !== absorbed);
        curBlocks = nextBlocks;
        didMerge = true;
        break;
      }
    }
    if (!didMerge) break;
  }
  return { rooms: curRooms, blocks: curBlocks };
}
