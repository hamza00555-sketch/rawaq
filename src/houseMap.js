// House map: rooms laid out as blocks on a fixed single-floor grid.
// Geometry only — priority is simply the order of the rooms array.
// Map shape: { blocks: { [roomId]: { x, y, w, h } } }, integers, origin top-left.
// The map canvas is always rendered dir="ltr": a floor plan is spatial, not
// text, so it must not mirror between Arabic and English/Filipino.

export const GRID_COLS = 6;
export const GRID_ROWS = 8;

export const EMPTY_MAP = { blocks: {} };

// Hallways are map-only blocks (no tasks, no priority). They live in the
// same blocks map as rooms, under a reserved id prefix, so collision and
// share plumbing work unchanged.
export const HALL_PREFIX = "hall-";
export const isHall = (id) => id.startsWith(HALL_PREFIX);
export const newHallId = () => `${HALL_PREFIX}${Date.now().toString(36)}`;

// A door sits on one side of a block: n/e/s/w (map is always LTR).
export const DOOR_SIDES = ["n", "e", "s", "w"];

export function clampRect(rect) {
  const w = Math.max(1, Math.min(GRID_COLS, Math.round(rect.w)));
  const h = Math.max(1, Math.min(GRID_ROWS, Math.round(rect.h)));
  const x = Math.max(0, Math.min(GRID_COLS - w, Math.round(rect.x)));
  const y = Math.max(0, Math.min(GRID_ROWS - h, Math.round(rect.y)));
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
export function findFreeSpot(blocks, w, h) {
  for (let y = 0; y <= GRID_ROWS - h; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      const rect = { x, y, w, h };
      if (!collides(blocks, null, rect)) return rect;
    }
  }
  return null;
}

// Drop blocks for rooms that no longer exist (halls always stay), clamp
// stray geometry, and whitelist the door field. Pure + idempotent — safe
// to run on every read instead of migrating.
export function sanitizeMap(map, rooms) {
  const blocks = map?.blocks || {};
  const ids = new Set(rooms.map((r) => r.id));
  const clean = {};
  for (const [id, b] of Object.entries(blocks)) {
    if ((!ids.has(id) && !isHall(id)) || !b) continue;
    const rect = clampRect(b);
    if (DOOR_SIDES.includes(b.door)) rect.door = b.door;
    // A clamped block that now overlaps an earlier one is dropped rather
    // than shuffled — the room just returns to the unplaced tray.
    if (!collides(clean, id, rect)) clean[id] = rect;
  }
  return { blocks: clean };
}

export function hasPlacedRooms(map) {
  return Object.keys(map?.blocks || {}).length > 0;
}

// A room is "done" when it has tasks in this list and all are checked.
export function roomDone(tasks, roomId) {
  const mine = tasks.filter((t) => t.roomId === roomId);
  return mine.length > 0 && mine.every((t) => t.done);
}
