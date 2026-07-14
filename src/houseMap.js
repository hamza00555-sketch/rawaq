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

// Drop blocks whose owning room no longer exists, clamp stray geometry,
// normalize wall edges, preserve the `room` grouping field. A legacy orphan
// hall block (its own id is a hall, no `room` field) is kept so the mount
// reconcile can promote it. Pure + idempotent — safe to run on every read.
export function sanitizeMap(map, rooms) {
  const { cols, rows } = mapDims(map);
  const blocks = map?.blocks || {};
  const ids = new Set(rooms.map((r) => r.id));
  const clean = {};
  for (const [id, b] of Object.entries(blocks)) {
    if (!b) continue;
    const owner = ownerOf(id, b);
    if (!ids.has(owner) && !(isHall(id) && !b.room)) continue;
    const rect = clampRect(b, cols, rows);
    const edges = sanitizeEdges(b, rect);
    if (edges.length) rect.edges = edges;
    if (b.room) rect.room = b.room;
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

// A hall can be more than one rectangle: extra segments are ordinary blocks
// carrying a `room` field pointing at the owning hall. Everything else keys
// a block by its room id, so ownerOf() is the single source of truth for
// "which room does this block belong to".
export const ownerOf = (id, b) => (b && b.room) || id;

// All [id, block] pairs owned by a room, and whether the room has any block.
export function roomBlocks(blocks, roomId) {
  return Object.entries(blocks).filter(([id, b]) => ownerOf(id, b) === roomId);
}
export function roomHasBlock(blocks, roomId) {
  return Object.keys(blocks).some((id) => ownerOf(id, blocks[id]) === roomId);
}

// Flatten placed blocks into one render entry per block, each tagged with its
// owning room and whether it's that room's label-bearing segment (the block
// keyed by the room id, else the first one). Views map these to their shapes.
export function placedEntries(rooms, blocks) {
  const known = new Set(rooms.map((r) => r.id));
  const primary = new Map();
  for (const [id, b] of Object.entries(blocks)) {
    const owner = ownerOf(id, b);
    if (!known.has(owner)) continue;
    if (id === owner || !primary.has(owner)) primary.set(owner, id);
  }
  const out = [];
  for (const [id, b] of Object.entries(blocks)) {
    const owner = ownerOf(id, b);
    if (!known.has(owner)) continue;
    out.push({ blockId: id, roomId: owner, rect: b, primary: primary.get(owner) === id });
  }
  return out;
}

// Two hall segments are linked when they share a cell-edge with no wall marking
// on it (a door/exit/opening on the shared boundary keeps them apart — that's
// mom's intent). Corner-only touching (no shared edge) does not link.
export function hallLink(a, b) {
  if (a.x + a.w === b.x || b.x + b.w === a.x) {
    const [left, right] = a.x + a.w === b.x ? [a, b] : [b, a];
    const y0 = Math.max(a.y, b.y);
    const y1 = Math.min(a.y + a.h, b.y + b.h);
    for (let y = y0; y < y1; y++) {
      const ld = (left.edges || []).some((e) => e.side === "e" && left.y + e.at === y);
      const rd = (right.edges || []).some((e) => e.side === "w" && right.y + e.at === y);
      if (!ld && !rd) return true;
    }
    return false;
  }
  if (a.y + a.h === b.y || b.y + b.h === a.y) {
    const [top, bot] = a.y + a.h === b.y ? [a, b] : [b, a];
    const x0 = Math.max(a.x, b.x);
    const x1 = Math.min(a.x + a.w, b.x + b.w);
    for (let x = x0; x < x1; x++) {
      const td = (top.edges || []).some((e) => e.side === "s" && top.x + e.at === x);
      const bd = (bot.edges || []).some((e) => e.side === "n" && bot.x + e.at === x);
      if (!td && !bd) return true;
    }
    return false;
  }
  return false;
}

// Tidy a hall's geometry: collapse door-free segments that line up into one
// rectangle (a straight run becomes a single block), leaving corners as their
// own blocks. Segments carrying wall markings are left alone so their doors
// survive. Keeps the block whose id is the room id (the label-bearing one).
function simplifyHallBlocks(blocks) {
  let map = blocks;
  for (;;) {
    const entries = Object.entries(map);
    let merged = false;
    for (let i = 0; i < entries.length && !merged; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [idA, a] = entries[i];
        const [idB, b] = entries[j];
        const owner = ownerOf(idA, a);
        if (owner !== ownerOf(idB, b) || !isHall(owner)) continue;
        if ((a.edges && a.edges.length) || (b.edges && b.edges.length)) continue;
        const u = hallMergeRect(a, b);
        if (!u) continue;
        const keepId = idB === owner ? idB : idA;
        const dropId = keepId === idA ? idB : idA;
        const next = { ...map, [keepId]: keepId === owner ? u : { ...u, room: owner } };
        delete next[dropId];
        map = next;
        merged = true;
        break;
      }
    }
    if (!merged) return map;
  }
}

// Auto-merge connected hallways into ONE hall of any shape (L, U, …) — as long
// as nothing (door/opening) sits between them. Halls whose segments touch on a
// clear edge are grouped under the earliest one (by rooms order): the others'
// segment blocks are re-owned to it and their tasks absorbed, the extra hall
// rooms dropped. Straight door-free runs are then collapsed for a clean look.
// Only halls are affected. Pure: same references back when nothing changed.
export function mergeConnectedHalls(rooms, blocks) {
  const hallIds = rooms.filter((r) => isHall(r.id)).map((r) => r.id);
  const segs = new Map(hallIds.map((h) => [h, roomBlocks(blocks, h).map(([, b]) => b)]));
  const parent = new Map(hallIds.map((h) => [h, h]));
  const find = (x) => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  };
  for (let i = 0; i < hallIds.length; i++) {
    for (let j = i + 1; j < hallIds.length; j++) {
      const A = segs.get(hallIds[i]);
      const B = segs.get(hallIds[j]);
      if (A.some((a) => B.some((b) => hallLink(a, b)))) {
        parent.set(find(hallIds[i]), find(hallIds[j]));
      }
    }
  }
  const order = new Map(rooms.map((r, i) => [r.id, i]));
  const comps = new Map();
  for (const h of hallIds) {
    const root = find(h);
    if (!comps.has(root)) comps.set(root, []);
    comps.get(root).push(h);
  }

  let curRooms = rooms;
  let curBlocks = blocks;
  let changed = false;
  for (const members of comps.values()) {
    if (members.length < 2) continue;
    changed = true;
    members.sort((a, b) => order.get(a) - order.get(b));
    const primary = members[0];
    const absorbed = new Set(members.slice(1));
    curBlocks = Object.fromEntries(
      Object.entries(curBlocks).map(([id, b]) =>
        absorbed.has(ownerOf(id, b)) ? [id, { ...b, room: primary }] : [id, b]
      )
    );
    const have = new Set();
    const extra = [];
    for (const r of curRooms) {
      if (r.id === primary) r.tasks.forEach((t) => have.add(t.name.ar.trim()));
    }
    for (const r of curRooms) {
      if (!absorbed.has(r.id)) continue;
      for (const task of r.tasks) {
        const k = task.name.ar.trim();
        if (!have.has(k)) { have.add(k); extra.push(task); }
      }
    }
    curRooms = curRooms
      .map((r) => (r.id === primary && extra.length ? { ...r, tasks: [...r.tasks, ...extra] } : r))
      .filter((r) => !absorbed.has(r.id));
  }

  const simplified = simplifyHallBlocks(curBlocks);
  if (simplified !== curBlocks) {
    curBlocks = simplified;
    changed = true;
  }
  return changed ? { rooms: curRooms, blocks: curBlocks } : { rooms, blocks };
}
