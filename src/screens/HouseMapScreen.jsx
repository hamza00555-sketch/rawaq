import { useMemo, useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import { makeHall } from "../data.js";
import {
  OPEN_COLS,
  OPEN_ROWS,
  collides,
  findFreeSpot,
  mergeConnectedHalls,
  newHallId,
  sanitizeMap,
} from "../houseMap.js";
import HouseMapEditor from "../components/HouseMapEditor.jsx";
import DraggableTaskList from "../components/DraggableTaskList.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Icon from "../components/Icons.jsx";

// Stepper toolbar for the selected block, plus the wall legend: size
// buttons grow toward the bottom-right and disable instead of colliding;
// wall segments are edited by tapping the dots on the block itself.
function BlockToolbar({ lang, id, blocks, cols, rows, onChange }) {
  const b = blocks[id];

  const apply = (rect) => onChange({ ...blocks, [id]: rect });
  const fits = (rect) =>
    rect.w >= 1 &&
    rect.h >= 1 &&
    rect.x + rect.w <= cols &&
    rect.y + rect.h <= rows &&
    !collides(blocks, id, rect);

  const stepper = (labelKey, dim) => (
    <div className="map-toolbar-row">
      <span className="map-toolbar-label">{t(lang, labelKey)}</span>
      <div className="stepper" dir="ltr">
        <button
          type="button"
          className="stepper-btn"
          aria-label={`${t(lang, labelKey)} −`}
          disabled={!fits({ ...b, [dim]: b[dim] - 1 })}
          {...press(() => fits({ ...b, [dim]: b[dim] - 1 }) && apply({ ...b, [dim]: b[dim] - 1 }))}
        >
          −
        </button>
        <span className="stepper-value">{b[dim]}</span>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`${t(lang, labelKey)} +`}
          disabled={!fits({ ...b, [dim]: b[dim] + 1 })}
          {...press(() => fits({ ...b, [dim]: b[dim] + 1 }) && apply({ ...b, [dim]: b[dim] + 1 }))}
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="card map-toolbar">
      {stepper("blockWidth", "w")}
      {stepper("blockHeight", "h")}
      <p className="muted" style={{ fontSize: 13 }}>{t(lang, "edgeHint")}</p>
      <div className="edge-legend" dir="ltr">
        <span><i className="map-edge edge-door legend-swatch" /> {t(lang, "doorInner")}</span>
        <span><i className="map-edge edge-exit legend-swatch" /> {t(lang, "doorExit")}</span>
        <span><i className="map-edge edge-open legend-swatch" /> {t(lang, "openWall")}</span>
      </div>
    </div>
  );
}

// Mom's map editor: zoom row + grid on top, a toolbar for the selected
// block, unplaced-room chips + add-hallway under it, then the priority
// list. Reordering the list renumbers the badges on the map live —
// priority IS the rooms array order, no separate field.
export default function HouseMapScreen({ lang, rooms, setRooms, houseMap, setHouseMap, onBack }) {
  const [snack, setSnack] = useState(null);
  const [selected, setSelected] = useState(null);

  // The editor always works on the big open canvas: normalize whatever was
  // stored (older, smaller grids included) onto it, keeping every block.
  const map = useMemo(
    () => sanitizeMap({ cols: OPEN_COLS, rows: OPEN_ROWS, blocks: houseMap?.blocks || {} }, rooms),
    [houseMap, rooms]
  );
  const { cols, rows, blocks } = map;

  const roomName = (room) => room.name[lang] || room.name.ar;

  const entries = rooms
    .filter((room) => blocks[room.id])
    .map((room) => ({
      id: room.id,
      emoji: room.emoji,
      name: roomName(room),
      type: room.type,
      priority: rooms.indexOf(room) + 1,
      removeLabel: t(lang, "removeFromMap"),
    }));

  const unplaced = rooms.filter((room) => !blocks[room.id]);

  // Committing geometry also auto-merges any hallways that now form a clean
  // rectangle (drawn/dragged next to each other) — fused into one hall with
  // one task list. Rooms only change when a merge actually happened.
  const commit = (nextBlocks) => {
    const merged = mergeConnectedHalls(rooms, nextBlocks);
    setHouseMap({ cols, rows, blocks: merged.blocks });
    if (merged.rooms !== rooms) setRooms(merged.rooms);
  };

  // Raw block write with no merge pass — used when adding a hall, whose new
  // room isn't in `rooms` yet (merging here would drop it).
  const setBlocks = (nextBlocks) => setHouseMap({ cols, rows, blocks: nextBlocks });

  const placeRoom = (room) => {
    const spot = findFreeSpot(blocks, 2, 2, cols, rows) || findFreeSpot(blocks, 1, 1, cols, rows);
    if (!spot) {
      setSnack({ message: t(lang, "mapFull") });
      return;
    }
    commit({ ...blocks, [room.id]: spot });
    setSelected(room.id);
  };

  // Hallways are elongated by nature — try both orientations first. A hall
  // is a first-class room (its own tasks + section), so add it to rooms too.
  const addHall = () => {
    const spot =
      findFreeSpot(blocks, 1, 3, cols, rows) ||
      findFreeSpot(blocks, 3, 1, cols, rows) ||
      findFreeSpot(blocks, 1, 2, cols, rows) ||
      findFreeSpot(blocks, 2, 1, cols, rows) ||
      findFreeSpot(blocks, 1, 1, cols, rows);
    if (!spot) {
      setSnack({ message: t(lang, "mapFull") });
      return;
    }
    const id = newHallId();
    setRooms([...rooms, makeHall(id)]);
    setBlocks({ ...blocks, [id]: spot });
    setSelected(id);
  };

  const selectedExists = selected && blocks[selected];

  return (
    <div className="screen">
      <header className="appbar">
        <div className="row">
          <button type="button" className="icon-btn" aria-label={t(lang, "back")} {...press(onBack)}>
            <Icon name={lang === "ar" ? "chevron-right" : "chevron-left"} size={22} />
          </button>
          <h1>{t(lang, "houseMap")}</h1>
        </div>
      </header>

      <p className="muted" style={{ marginBottom: 10 }}>
        {t(lang, entries.length === 0 ? "mapEmptyHint" : "mapHint")}
      </p>

      <HouseMapEditor
        entries={entries}
        blocks={blocks}
        cols={cols}
        rows={rows}
        onChange={commit}
        selected={selectedExists ? selected : null}
        setSelected={setSelected}
      />

      {selectedExists && (
        <BlockToolbar lang={lang} id={selected} blocks={blocks} cols={cols} rows={rows} onChange={commit} />
      )}

      {unplaced.length > 0 && <h2 className="section-title">{t(lang, "unplacedRooms")}</h2>}
      <div className="map-chip-tray" style={{ marginTop: unplaced.length ? 0 : 14 }}>
        {unplaced.map((room) => (
          <button key={room.id} type="button" className="map-chip" {...press(() => placeRoom(room))}>
            <span aria-hidden="true">{room.emoji}</span> {roomName(room)}
            <Icon name="plus" size={16} />
          </button>
        ))}
        <button type="button" className="map-chip" {...press(addHall)}>
          {t(lang, "addHall")} <Icon name="plus" size={16} />
        </button>
      </div>

      <h2 className="section-title">{t(lang, "priorityOrder")}</h2>
      <p className="muted" style={{ marginBottom: 8 }}>{t(lang, "priorityHint")}</p>
      <DraggableTaskList
        tasks={rooms}
        renderName={(room) => (
          <>
            <span className="priority-row-num">{rooms.findIndex((r) => r.id === room.id) + 1}</span>{" "}
            {room.emoji} {roomName(room)}
          </>
        )}
        onToggle={() => {}}
        onReorder={setRooms}
        rowRole="button"
        showCheck={false}
      />

      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}
