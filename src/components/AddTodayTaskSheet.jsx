import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";
import TaskLibraryChips from "./TaskLibraryChips.jsx";

// Add an ad-hoc task to today's list only (an "extra"): pick room →
// library chips for its type → or write a custom one.
export default function AddTodayTaskSheet({ open, onClose, lang, rooms, today, onAdd }) {
  const [roomId, setRoomId] = useState(null);
  const room = rooms.find((x) => x.id === roomId);

  const existingNames = new Set(today.tasks.map((x) => x.name.ar));

  const add = (name) => {
    onAdd({ id: `x-${Date.now().toString(36)}`, roomId: roomId || null, name });
    setRoomId(null);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setRoomId(null);
        onClose();
      }}
      title={t(lang, "addTodayTask")}
    >
      <div className="stack">
        <span className="muted">{t(lang, "chooseRoom")}</span>
        <div className="rooms-grid">
          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`room-chip ${roomId === r.id ? "selected" : ""}`}
              aria-pressed={roomId === r.id}
              {...press(() => setRoomId(r.id))}
            >
              <span style={{ fontSize: 26 }}>{r.emoji}</span>
              <span>{r.name[lang] || r.name.ar}</span>
            </button>
          ))}
        </div>

        {room && (
          <TaskLibraryChips
            lang={lang}
            roomType={room.type}
            existingArNames={existingNames}
            onPick={add}
            onCustom={add}
          />
        )}
      </div>
    </BottomSheet>
  );
}
