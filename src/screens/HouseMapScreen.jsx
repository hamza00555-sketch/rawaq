import { useMemo, useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import { findFreeSpot, sanitizeMap } from "../houseMap.js";
import HouseMapEditor from "../components/HouseMapEditor.jsx";
import DraggableTaskList from "../components/DraggableTaskList.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Icon from "../components/Icons.jsx";

// Mom's map editor: the grid on top, unplaced-room chips under it, then
// the priority list. Reordering the list renumbers the badges on the map
// live — priority IS the rooms array order, no separate field.
export default function HouseMapScreen({ lang, rooms, setRooms, houseMap, setHouseMap, onBack }) {
  const [snack, setSnack] = useState(null);

  const map = useMemo(() => sanitizeMap(houseMap, rooms), [houseMap, rooms]);
  const blocks = map.blocks;

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

  const placeRoom = (room) => {
    const spot = findFreeSpot(blocks, 2, 2) || findFreeSpot(blocks, 1, 1);
    if (!spot) {
      setSnack({ message: t(lang, "mapFull") });
      return;
    }
    setHouseMap({ blocks: { ...blocks, [room.id]: spot } });
  };

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
        onChange={(next) => setHouseMap({ blocks: next })}
      />

      {unplaced.length > 0 && (
        <>
          <h2 className="section-title">{t(lang, "unplacedRooms")}</h2>
          <div className="map-chip-tray">
            {unplaced.map((room) => (
              <button key={room.id} type="button" className="map-chip" {...press(() => placeRoom(room))}>
                <span aria-hidden="true">{room.emoji}</span> {roomName(room)}
                <Icon name="plus" size={16} />
              </button>
            ))}
          </div>
        </>
      )}

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
