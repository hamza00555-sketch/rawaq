import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";
import TaskLibraryChips from "./TaskLibraryChips.jsx";
import FreqDepthPicker from "./FreqDepthPicker.jsx";

// Create-task wizard: pick room → freq + depth → tap a suggested task
// (or write a custom one). Each pick adds immediately to the room.
export default function CreateTaskSheet({ open, onClose, lang, rooms, setRooms }) {
  const [roomId, setRoomId] = useState(null);
  const [freq, setFreq] = useState("weekly");
  const [depth, setDepth] = useState("surface");
  const [addedMsg, setAddedMsg] = useState(false);

  const room = rooms.find((x) => x.id === roomId);

  const reset = () => {
    setRoomId(null);
    setFreq("weekly");
    setDepth("surface");
  };

  const addTask = (name) => {
    if (!room) return;
    const task = { id: `${room.id}-${Date.now().toString(36)}`, name, freq, depth };
    setRooms(rooms.map((r) => (r.id === room.id ? { ...r, tasks: [...r.tasks, task] } : r)));
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 1400);
  };

  const existingNames = room ? new Set(room.tasks.map((x) => x.name.ar.trim())) : new Set();

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t(lang, "createTask")}
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
          <>
            <FreqDepthPicker lang={lang} freq={freq} setFreq={setFreq} depth={depth} setDepth={setDepth} />

            {addedMsg && (
              <p className="congrats" role="status" style={{ textAlign: "center" }}>
                {t(lang, "taskAdded")}
              </p>
            )}

            <TaskLibraryChips
              lang={lang}
              roomType={room.type}
              existingArNames={existingNames}
              onPick={addTask}
              onCustom={addTask}
            />
          </>
        )}
      </div>
    </BottomSheet>
  );
}
