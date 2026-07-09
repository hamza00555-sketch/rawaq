import { useMemo, useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import {
  DOOR_SIDES,
  GRID_COLS,
  GRID_ROWS,
  collides,
  findFreeSpot,
  isHall,
  newHallId,
  sanitizeMap,
} from "../houseMap.js";
import HouseMapEditor from "../components/HouseMapEditor.jsx";
import DraggableTaskList from "../components/DraggableTaskList.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Icon from "../components/Icons.jsx";

// Stepper + door toolbar for the selected block. Size buttons grow toward
// the bottom-right and disable instead of colliding; the door picker puts
// a marker on one side (rooms only — hallways don't get doors).
function BlockToolbar({ lang, id, blocks, onChange }) {
  const b = blocks[id];

  const apply = (rect) => onChange({ ...blocks, [id]: rect });
  const fits = (rect) =>
    rect.w >= 1 &&
    rect.h >= 1 &&
    rect.x + rect.w <= GRID_COLS &&
    rect.y + rect.h <= GRID_ROWS &&
    !collides(blocks, id, rect);

  const sizeStep = (dim, delta) => {
    const rect = { ...b, [dim]: b[dim] + delta };
    if (fits(rect)) apply(rect);
  };

  const stepper = (labelKey, dim) => (
    <div className="map-toolbar-row">
      <span className="map-toolbar-label">{t(lang, labelKey)}</span>
      <div className="stepper" dir="ltr">
        <button
          type="button"
          className="stepper-btn"
          aria-label={`${t(lang, labelKey)} −`}
          disabled={!fits({ ...b, [dim]: b[dim] - 1 })}
          {...press(() => sizeStep(dim, -1))}
        >
          −
        </button>
        <span className="stepper-value">{b[dim]}</span>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`${t(lang, labelKey)} +`}
          disabled={!fits({ ...b, [dim]: b[dim] + 1 })}
          {...press(() => sizeStep(dim, 1))}
        >
          +
        </button>
      </div>
    </div>
  );

  const doorGlyph = { n: "⬆", e: "➡", s: "⬇", w: "⬅" };

  return (
    <div className="card map-toolbar">
      {stepper("blockWidth", "w")}
      {stepper("blockHeight", "h")}
      {!isHall(id) && (
        <div className="map-toolbar-row">
          <span className="map-toolbar-label">{t(lang, "door")}</span>
          {/* dir=ltr so the side arrows stay spatial, matching the map */}
          <div className="seg door-seg" dir="ltr" role="radiogroup" aria-label={t(lang, "door")}>
            <button
              type="button"
              className={`seg-btn ${!b.door ? "active" : ""}`}
              role="radio"
              aria-checked={!b.door}
              {...press(() => {
                const rect = { ...b };
                delete rect.door;
                apply(rect);
              })}
            >
              {t(lang, "doorNone")}
            </button>
            {DOOR_SIDES.map((side) => (
              <button
                key={side}
                type="button"
                className={`seg-btn ${b.door === side ? "active" : ""}`}
                role="radio"
                aria-checked={b.door === side}
                aria-label={`${t(lang, "door")} ${side}`}
                {...press(() => apply({ ...b, door: side }))}
              >
                {doorGlyph[side]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mom's map editor: the grid on top, a toolbar for the selected block,
// unplaced-room chips + add-hallway under it, then the priority list.
// Reordering the list renumbers the badges on the map live — priority IS
// the rooms array order, no separate field.
export default function HouseMapScreen({ lang, rooms, setRooms, houseMap, setHouseMap, onBack }) {
  const [snack, setSnack] = useState(null);
  const [selected, setSelected] = useState(null);

  const map = useMemo(() => sanitizeMap(houseMap, rooms), [houseMap, rooms]);
  const blocks = map.blocks;

  const roomName = (room) => room.name[lang] || room.name.ar;

  const entries = [
    ...rooms
      .filter((room) => blocks[room.id])
      .map((room) => ({
        id: room.id,
        emoji: room.emoji,
        name: roomName(room),
        type: room.type,
        priority: rooms.indexOf(room) + 1,
        removeLabel: t(lang, "removeFromMap"),
      })),
    ...Object.keys(blocks)
      .filter(isHall)
      .map((id) => ({
        id,
        emoji: "",
        name: t(lang, "hall"),
        type: "hall",
        priority: null,
        removeLabel: t(lang, "removeFromMap"),
      })),
  ];

  const unplaced = rooms.filter((room) => !blocks[room.id]);

  const commit = (nextBlocks) => setHouseMap({ blocks: nextBlocks });

  const placeRoom = (room) => {
    const spot = findFreeSpot(blocks, 2, 2) || findFreeSpot(blocks, 1, 1);
    if (!spot) {
      setSnack({ message: t(lang, "mapFull") });
      return;
    }
    commit({ ...blocks, [room.id]: spot });
    setSelected(room.id);
  };

  // Hallways are elongated by nature — try both orientations first.
  const addHall = () => {
    const spot =
      findFreeSpot(blocks, 1, 3) ||
      findFreeSpot(blocks, 3, 1) ||
      findFreeSpot(blocks, 1, 2) ||
      findFreeSpot(blocks, 2, 1) ||
      findFreeSpot(blocks, 1, 1);
    if (!spot) {
      setSnack({ message: t(lang, "mapFull") });
      return;
    }
    const id = newHallId();
    commit({ ...blocks, [id]: spot });
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
        onChange={commit}
        selected={selectedExists ? selected : null}
        setSelected={setSelected}
      />

      {selectedExists && <BlockToolbar lang={lang} id={selected} blocks={blocks} onChange={commit} />}

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
