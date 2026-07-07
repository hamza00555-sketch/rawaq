import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";

// Create-task wizard: pick room → surface/deep → name(s). One scrollable form.
export default function CreateTaskSheet({ open, onClose, lang, rooms, setRooms, defaultMode }) {
  const [roomId, setRoomId] = useState(null);
  const [mode, setMode] = useState(defaultMode || "surface");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFil, setNameFil] = useState("");
  const [added, setAdded] = useState(false);

  const reset = () => {
    setRoomId(null);
    setMode(defaultMode || "surface");
    setNameAr("");
    setNameEn("");
    setNameFil("");
  };

  const canAdd = roomId && nameAr.trim();

  const addTask = () => {
    if (!canAdd) return;
    const task = {
      id: `${roomId}-${Date.now().toString(36)}`,
      name: {
        ar: nameAr.trim(),
        en: nameEn.trim() || nameAr.trim(),
        fil: nameFil.trim() || nameAr.trim(),
      },
      done: false,
    };
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? { ...room, tasks: { ...room.tasks, [mode]: [...room.tasks[mode], task] } }
          : room
      )
    );
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      reset();
      onClose();
    }, 900);
  };

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
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`room-chip ${roomId === room.id ? "selected" : ""}`}
              aria-pressed={roomId === room.id}
              {...press(() => setRoomId(room.id))}
            >
              <span style={{ fontSize: 26 }}>{room.emoji}</span>
              <span>{room.name[lang] || room.name.ar}</span>
            </button>
          ))}
        </div>

        <span className="muted">{t(lang, "cleaningType")}</span>
        <div className="seg" role="tablist" aria-label={t(lang, "cleaningType")}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "surface"}
            className={`seg-btn ${mode === "surface" ? "active" : ""}`}
            {...press(() => setMode("surface"))}
          >
            {t(lang, "surface")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "deep"}
            className={`seg-btn ${mode === "deep" ? "active" : ""}`}
            {...press(() => setMode("deep"))}
          >
            {t(lang, "deep")}
          </button>
        </div>

        <input
          className="input"
          dir="rtl"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder={t(lang, "taskNameAr")}
        />
        <input
          className="input"
          dir="ltr"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder={t(lang, "taskNameEn")}
        />
        <input
          className="input"
          dir="ltr"
          value={nameFil}
          onChange={(e) => setNameFil(e.target.value)}
          placeholder={t(lang, "taskNameFil")}
        />

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!canAdd}
          style={!canAdd ? { opacity: 0.5 } : undefined}
          {...press(addTask)}
        >
          {added ? t(lang, "taskAdded") : t(lang, "add")}
        </button>
      </div>
    </BottomSheet>
  );
}
