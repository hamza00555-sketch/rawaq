import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import PhotoUploader from "../components/PhotoUploader.jsx";
import BottomSheet from "../components/BottomSheet.jsx";
import DraggableTaskList from "../components/DraggableTaskList.jsx";
import TaskLibraryChips from "../components/TaskLibraryChips.jsx";
import RoomEditorSheet from "../components/RoomEditorSheet.jsx";
import Snackbar from "../components/Snackbar.jsx";

function RoomDetail({ lang, room, updateRoom, onEditRoom, onBack }) {
  const [tab, setTab] = useState("surface");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [snack, setSnack] = useState(null);

  const tasks = room.tasks[tab];
  const setTasks = (next) => updateRoom({ ...room, tasks: { ...room.tasks, [tab]: next } });

  const existingNames = new Set(
    [...room.tasks.surface, ...room.tasks.deep].map((x) => x.name.ar.trim())
  );

  const addTask = (name) => {
    const task = { id: `${room.id}-${Date.now().toString(36)}`, name, done: false };
    setTasks([...tasks, task]);
  };

  const deleteTask = (task) => {
    const index = tasks.findIndex((x) => x.id === task.id);
    setTasks(tasks.filter((x) => x.id !== task.id));
    setSnack({
      message: t(lang, "taskDeleted"),
      undoLabel: t(lang, "undo"),
      onUndo: () => {
        const current = room.tasks[tab].filter((x) => x.id !== task.id);
        setTasks([...current.slice(0, index), task, ...current.slice(index)]);
      },
    });
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
        <button type="button" className="icon-btn" aria-label={t(lang, "editRoom")} {...press(onEditRoom)}>
          ✎
        </button>
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
            onSwipeDelete={deleteTask}
          />
        )}
      </div>

      <button type="button" className="btn btn-soft btn-block" style={{ marginTop: 16 }} {...press(() => setSheetOpen(true))}>
        ＋ {t(lang, "addTask")}
      </button>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t(lang, "addTask")}>
        <TaskLibraryChips
          lang={lang}
          roomType={room.type}
          existingArNames={existingNames}
          onPick={addTask}
          onCustom={addTask}
        />
      </BottomSheet>

      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}

export default function RoomsScreen({ lang, rooms, setRooms }) {
  const [openRoomId, setOpenRoomId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorRoomId, setEditorRoomId] = useState(null); // null = add mode
  const [snack, setSnack] = useState(null);

  const openRoom = rooms.find((x) => x.id === openRoomId);
  const editorRoom = rooms.find((x) => x.id === editorRoomId);

  const saveRoom = (patch) => {
    if (editorRoom) {
      setRooms(rooms.map((r) => (r.id === editorRoom.id ? { ...r, ...patch } : r)));
    } else {
      setRooms([
        ...rooms,
        {
          id: `room-${Date.now().toString(36)}`,
          ...patch,
          photo: null,
          tasks: { surface: [], deep: [] },
        },
      ]);
    }
  };

  const deleteRoom = () => {
    if (!editorRoom) return;
    const index = rooms.findIndex((r) => r.id === editorRoom.id);
    const removed = editorRoom;
    setRooms(rooms.filter((r) => r.id !== removed.id));
    setOpenRoomId(null);
    setSnack({
      message: t(lang, "roomDeleted"),
      undoLabel: t(lang, "undo"),
      onUndo: () =>
        setRooms((prev) => {
          const next = prev.filter((r) => r.id !== removed.id);
          return [...next.slice(0, index), removed, ...next.slice(index)];
        }),
    });
  };

  if (openRoom) {
    return (
      <>
        <RoomDetail
          lang={lang}
          room={openRoom}
          updateRoom={(next) => setRooms(rooms.map((x) => (x.id === next.id ? next : x)))}
          onEditRoom={() => {
            setEditorRoomId(openRoom.id);
            setEditorOpen(true);
          }}
          onBack={() => setOpenRoomId(null)}
        />
        <RoomEditorSheet
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          lang={lang}
          room={editorRoom}
          onSave={saveRoom}
          onDelete={deleteRoom}
        />
        <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
      </>
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
        <button
          type="button"
          className="room-card add-room-card"
          {...press(() => {
            setEditorRoomId(null);
            setEditorOpen(true);
          })}
        >
          <span style={{ fontSize: 34 }} aria-hidden="true">＋</span>
          <span style={{ fontWeight: 600 }}>{t(lang, "addRoom")}</span>
        </button>
      </div>

      <RoomEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        lang={lang}
        room={editorRoom}
        onSave={saveRoom}
        onDelete={editorRoom ? deleteRoom : undefined}
      />
      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}
