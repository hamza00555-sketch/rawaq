import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import PhotoUploader from "../components/PhotoUploader.jsx";
import BottomSheet from "../components/BottomSheet.jsx";
import DraggableTaskList from "../components/DraggableTaskList.jsx";

function RoomDetail({ lang, room, updateRoom, onBack }) {
  const [tab, setTab] = useState("surface");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFil, setNameFil] = useState("");

  const tasks = room.tasks[tab];

  const setTasks = (next) =>
    updateRoom({ ...room, tasks: { ...room.tasks, [tab]: next } });

  const addTask = () => {
    if (!nameAr.trim()) return;
    const id = `${room.id}-${Date.now().toString(36)}`;
    setTasks([
      ...tasks,
      {
        id,
        name: { ar: nameAr.trim(), en: nameEn.trim() || nameAr.trim(), fil: nameFil.trim() || nameAr.trim() },
        done: false,
      },
    ]);
    setNameAr("");
    setNameEn("");
    setNameFil("");
    setSheetOpen(false);
  };

  return (
    <div className="screen">
      <header className="appbar">
        <div className="row">
          <button type="button" className="icon-btn" aria-label={t(lang, "back")} {...press(onBack)}>
            {lang === "ar" ? "→" : "←"}
          </button>
          <h1>
            {room.emoji} {room.name[lang] || room.name.ar}
          </h1>
        </div>
      </header>

      {room.photo ? (
        <img src={room.photo} alt={room.name[lang] || room.name.ar} className="room-photo" style={{ height: 160, borderRadius: "var(--radius)" }} />
      ) : (
        <div className="room-photo-placeholder" style={{ height: 120, borderRadius: "var(--radius)" }} aria-hidden="true">
          {room.emoji}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <PhotoUploader
          label={room.photo ? t(lang, "changePhoto") : t(lang, "addPhoto")}
          onPhoto={(photo) => updateRoom({ ...room, photo })}
        />
      </div>

      <div className="seg" style={{ marginTop: 18 }} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "surface"}
          className={`seg-btn ${tab === "surface" ? "active" : ""}`}
          {...press(() => setTab("surface"))}
        >
          {t(lang, "surface")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "deep"}
          className={`seg-btn ${tab === "deep" ? "active" : ""}`}
          {...press(() => setTab("deep"))}
        >
          {t(lang, "deep")}
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        {tasks.length === 0 ? (
          <div className="card center-text muted">{t(lang, "noTasks")}</div>
        ) : (
          <DraggableTaskList
            tasks={tasks}
            renderName={(task) => task.name[lang] || task.name.ar}
            onToggle={(task) =>
              setTasks(tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)))
            }
            onReorder={setTasks}
            onDelete={(task) => setTasks(tasks.filter((x) => x.id !== task.id))}
          />
        )}
      </div>

      <button type="button" className="btn btn-soft btn-block" style={{ marginTop: 16 }} {...press(() => setSheetOpen(true))}>
        ＋ {t(lang, "addTask")}
      </button>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t(lang, "addTask")}>
        <div className="stack">
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
          <button type="button" className="btn btn-primary btn-block" {...press(addTask)}>
            {t(lang, "add")}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function RoomsScreen({ lang, rooms, setRooms }) {
  const [openRoomId, setOpenRoomId] = useState(null);
  const openRoom = rooms.find((x) => x.id === openRoomId);

  if (openRoom) {
    return (
      <RoomDetail
        lang={lang}
        room={openRoom}
        updateRoom={(next) => setRooms(rooms.map((x) => (x.id === next.id ? next : x)))}
        onBack={() => setOpenRoomId(null)}
      />
    );
  }

  return (
    <div className="screen">
      <header className="appbar">
        <h1>{t(lang, "rooms")}</h1>
      </header>
      <div className="rooms-grid">
        {rooms.map((room) => (
          <button key={room.id} type="button" className="room-card" {...press(() => setOpenRoomId(room.id))}>
            {room.photo ? (
              <img src={room.photo} alt="" className="room-photo" />
            ) : (
              <div className="room-photo-placeholder" aria-hidden="true">
                {room.emoji}
              </div>
            )}
            <div className="room-card-body">
              <h3>{room.name[lang] || room.name.ar}</h3>
              <p className="muted" style={{ fontSize: 14 }}>
                {room.tasks.surface.length + room.tasks.deep.length} {t(lang, "tasks")}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
