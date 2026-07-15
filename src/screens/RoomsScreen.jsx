import { useState } from "react";
import { useBackClose } from "../backButton.js";
import { t } from "../i18n.js";
import { makeHall } from "../data.js";
import { newHallId, ownerOf } from "../houseMap.js";
import { press } from "../press.js";
import PhotoUploader from "../components/PhotoUploader.jsx";
import BottomSheet from "../components/BottomSheet.jsx";
import DraggableTaskList from "../components/DraggableTaskList.jsx";
import TaskLibraryChips from "../components/TaskLibraryChips.jsx";
import FreqDepthPicker from "../components/FreqDepthPicker.jsx";
import TaskEditSheet from "../components/TaskEditSheet.jsx";
import RoomEditorSheet from "../components/RoomEditorSheet.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Icon from "../components/Icons.jsx";
import HouseMapScreen from "./HouseMapScreen.jsx";

const badge = (lang, task) => (
  <>
    {task.name[lang] || task.name.ar}
    <span className={`task-badge ${task.freq === "monthly" ? "badge-monthly" : ""}`}>
      {t(lang, task.freq === "monthly" ? "monthly" : "weekly")}
    </span>
    {task.depth === "deep" && <span className="task-badge badge-deep">{t(lang, "deep")}</span>}
  </>
);

function RoomDetail({ lang, room, updateRoom, onEditRoom, onBack }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addFreq, setAddFreq] = useState("weekly");
  const [addDepth, setAddDepth] = useState("surface");
  const [editTask, setEditTask] = useState(null);
  const [snack, setSnack] = useState(null);

  const tasks = room.tasks;
  const setTasks = (next) => updateRoom({ ...room, tasks: next });

  const existingNames = new Set(tasks.map((x) => x.name.ar.trim()));

  const addTask = (name) => {
    setTasks([
      ...tasks,
      { id: `${room.id}-${Date.now().toString(36)}`, name, freq: addFreq, depth: addDepth },
    ]);
    setSnack({ message: t(lang, "taskAdded") });
  };

  const deleteTask = (task) => {
    const index = tasks.findIndex((x) => x.id === task.id);
    setTasks(tasks.filter((x) => x.id !== task.id));
    setSnack({
      message: t(lang, "taskDeleted"),
      undoLabel: t(lang, "undo"),
      onUndo: () => {
        const current = room.tasks.filter((x) => x.id !== task.id);
        setTasks([...current.slice(0, index), task, ...current.slice(index)]);
      },
    });
  };

  return (
    <div className="screen">
      <header className="appbar">
        <div className="row">
          <button type="button" className="icon-btn" aria-label={t(lang, "back")} {...press(onBack)}>
            <Icon name={lang === "ar" ? "chevron-right" : "chevron-left"} size={22} />
          </button>
          <h1>
            {room.emoji} {room.name[lang] || room.name.ar}
          </h1>
        </div>
        <button type="button" className="icon-btn" aria-label={t(lang, "editRoom")} {...press(onEditRoom)}>
          <Icon name="pencil" size={20} />
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

      <div style={{ marginTop: 18 }}>
        {tasks.length === 0 ? (
          <div className="card center-text muted">{t(lang, "noTasks")}</div>
        ) : (
          <DraggableTaskList
            tasks={tasks}
            renderName={(task) => badge(lang, task)}
            onToggle={(task) => setEditTask(task)}
            onReorder={setTasks}
            onSwipeDelete={deleteTask}
            rowRole="button"
            showCheck={false}
          />
        )}
      </div>

      <button type="button" className="btn btn-soft btn-block" style={{ marginTop: 16 }} {...press(() => setSheetOpen(true))}>
        <Icon name="plus" size={20} /> {t(lang, "addTask")}
      </button>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t(lang, "addTask")}>
        <div className="stack">
          <FreqDepthPicker lang={lang} freq={addFreq} setFreq={setAddFreq} depth={addDepth} setDepth={setAddDepth} />
          <TaskLibraryChips
            lang={lang}
            roomType={room.type}
            existingArNames={existingNames}
            onPick={addTask}
            onCustom={addTask}
          />
        </div>
      </BottomSheet>

      <TaskEditSheet
        open={!!editTask}
        onClose={() => setEditTask(null)}
        lang={lang}
        task={editTask}
        onSave={(next) => {
          setTasks(tasks.map((x) => (x.id === next.id ? next : x)));
          setSnack({ message: t(lang, "taskSaved") });
        }}
        onDelete={deleteTask}
      />

      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}

export default function RoomsScreen({ lang, rooms, setRooms, houseMap, setHouseMap }) {
  const [openRoomId, setOpenRoomId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorRoomId, setEditorRoomId] = useState(null); // null = add mode
  const [addingHall, setAddingHall] = useState(false); // add-mode: hall vs room
  const [mapOpen, setMapOpen] = useState(false);
  const [snack, setSnack] = useState(null);

  // Android back button steps back through the full-screen sub-views (map,
  // room detail) instead of exiting the app. Sheets handle their own back.
  useBackClose(mapOpen, () => setMapOpen(false));
  useBackClose(!!openRoomId && !mapOpen, () => setOpenRoomId(null));

  const openRoom = rooms.find((x) => x.id === openRoomId);
  const editorRoom = rooms.find((x) => x.id === editorRoomId);
  const editorIsHall = addingHall || editorRoom?.type === "hall";

  const realRooms = rooms.filter((r) => r.type !== "hall");
  const halls = rooms.filter((r) => r.type === "hall");

  const saveRoom = (patch) => {
    if (editorRoom) {
      setRooms(rooms.map((r) => (r.id === editorRoom.id ? { ...r, ...patch } : r)));
    } else if (addingHall) {
      setRooms([...rooms, { ...makeHall(newHallId()), ...patch, type: "hall" }]);
    } else {
      setRooms([
        ...rooms,
        { id: `room-${Date.now().toString(36)}`, ...patch, photo: null, tasks: [] },
      ]);
    }
  };

  const openAdd = (hall) => {
    setAddingHall(hall);
    setEditorRoomId(null);
    setEditorOpen(true);
  };

  const deleteRoom = () => {
    if (!editorRoom) return;
    const index = rooms.findIndex((r) => r.id === editorRoom.id);
    const removed = editorRoom;
    setRooms(rooms.filter((r) => r.id !== removed.id));
    // drop the room's map blocks too (a hall may own several segments)
    const blocks = houseMap?.blocks || {};
    if (Object.keys(blocks).some((id) => ownerOf(id, blocks[id]) === removed.id)) {
      setHouseMap({
        ...houseMap,
        blocks: Object.fromEntries(
          Object.entries(blocks).filter(([id, b]) => ownerOf(id, b) !== removed.id)
        ),
      });
    }
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

  if (mapOpen) {
    return (
      <HouseMapScreen
        lang={lang}
        rooms={rooms}
        setRooms={setRooms}
        houseMap={houseMap}
        setHouseMap={setHouseMap}
        onBack={() => setMapOpen(false)}
      />
    );
  }

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
          isHall={editorIsHall}
          onSave={saveRoom}
          onDelete={deleteRoom}
        />
        <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
      </>
    );
  }

  const roomCard = (room) => (
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
          {room.tasks.length} {t(lang, "tasks")}
        </p>
      </div>
    </button>
  );

  return (
    <div className="screen">
      <header className="appbar">
        <h1>{t(lang, "rooms")}</h1>
        <button type="button" className="icon-btn" aria-label={t(lang, "houseMap")} {...press(() => setMapOpen(true))}>
          <Icon name="map" size={22} />
        </button>
      </header>
      <div className="rooms-grid">
        {realRooms.map(roomCard)}
        <button
          type="button"
          className="room-card add-room-card"
          {...press(() => openAdd(false))}
        >
          <Icon name="plus" size={32} />
          <span style={{ fontWeight: 600 }}>{t(lang, "addRoom")}</span>
        </button>
      </div>

      <h2 className="section-title" style={{ marginTop: 24 }}>{t(lang, "hallways")}</h2>
      <div className="rooms-grid">
        {halls.map(roomCard)}
        <button
          type="button"
          className="room-card add-room-card"
          {...press(() => openAdd(true))}
        >
          <Icon name="plus" size={32} />
          <span style={{ fontWeight: 600 }}>{t(lang, "addHall")}</span>
        </button>
      </div>

      <RoomEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        lang={lang}
        room={editorRoom}
        isHall={editorIsHall}
        onSave={saveRoom}
        onDelete={editorRoom ? deleteRoom : undefined}
      />
      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}
