import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { EMOJI_PRESETS, ROOM_TYPES } from "../data.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";
import Icon from "./Icons.jsx";
import TrilingualNameFields from "./TrilingualNameFields.jsx";

const TYPE_KEY = {
  kitchen: "typeKitchen",
  bathroom: "typeBathroom",
  bedroom: "typeBedroom",
  living: "typeLiving",
  general: "typeGeneral",
};

// Add or edit a room: Arabic name required, emoji + type pickers,
// delete (edit mode) with an in-sheet confirm step.
export default function RoomEditorSheet({ open, onClose, lang, room, onSave, onDelete }) {
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFil, setNameFil] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [type, setType] = useState("general");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNameAr(room?.name.ar || "");
    setNameEn(room?.name.en || "");
    setNameFil(room?.name.fil || "");
    setEmoji(room?.emoji || EMOJI_PRESETS[0]);
    setType(room?.type || "general");
    setConfirmDelete(false);
  }, [open, room]);

  const canSave = nameAr.trim();

  const save = () => {
    if (!canSave) return;
    onSave({
      name: {
        ar: nameAr.trim(),
        en: nameEn.trim() || nameAr.trim(),
        fil: nameFil.trim() || nameAr.trim(),
      },
      emoji,
      type,
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={room ? t(lang, "editRoom") : t(lang, "addRoom")}>
      <div className="stack">
        <TrilingualNameFields
          key={`${open}-${room?.id || "new"}`}
          lang={lang}
          ar={nameAr}
          en={nameEn}
          fil={nameFil}
          onAr={setNameAr}
          onEn={setNameEn}
          onFil={setNameFil}
          placeholders={{ ar: "roomNameAr", en: "roomNameEn", fil: "roomNameFil" }}
          initialAr={room?.name.ar || ""}
        />

        <span className="muted">{t(lang, "roomType")}</span>
        <div className="chip-wrap">
          {ROOM_TYPES.map((rt) => (
            <button
              key={rt}
              type="button"
              className={`task-chip ${type === rt ? "selected" : ""}`}
              aria-pressed={type === rt}
              {...press(() => setType(rt))}
            >
              {t(lang, TYPE_KEY[rt])}
            </button>
          ))}
        </div>

        <span className="muted">{t(lang, "chooseEmoji")}</span>
        <div className="emoji-grid">
          {EMOJI_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              className={`emoji-btn ${emoji === e ? "selected" : ""}`}
              aria-pressed={emoji === e}
              aria-label={e}
              {...press(() => setEmoji(e))}
            >
              {e}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!canSave}
          style={!canSave ? { opacity: 0.5 } : undefined}
          {...press(save)}
        >
          {room ? t(lang, "roomSaved").replace(" ✓", "") : t(lang, "add")}
        </button>

        {room && onDelete && (
          <button
            type="button"
            className={`btn btn-block ${confirmDelete ? "btn-danger" : ""}`}
            style={!confirmDelete ? { color: "var(--danger)" } : undefined}
            {...press(() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              onDelete();
              onClose();
            })}
          >
            <Icon name="trash" size={20} /> {confirmDelete ? t(lang, "deleteRoomConfirm") : t(lang, "deleteRoom")}
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
