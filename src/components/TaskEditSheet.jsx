import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";
import FreqDepthPicker from "./FreqDepthPicker.jsx";
import Icon from "./Icons.jsx";
import TrilingualNameFields from "./TrilingualNameFields.jsx";

// Edit an existing room task: trilingual name + freq + depth + delete.
export default function TaskEditSheet({ open, onClose, lang, task, onSave, onDelete }) {
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFil, setNameFil] = useState("");
  const [freq, setFreq] = useState("weekly");
  const [depth, setDepth] = useState("surface");

  useEffect(() => {
    if (!open || !task) return;
    setNameAr(task.name.ar);
    setNameEn(task.name.en);
    setNameFil(task.name.fil);
    setFreq(task.freq || "weekly");
    setDepth(task.depth || "surface");
  }, [open, task]);

  if (!task) return null;

  const save = () => {
    if (!nameAr.trim()) return;
    onSave({
      ...task,
      name: {
        ar: nameAr.trim(),
        en: nameEn.trim() || nameAr.trim(),
        fil: nameFil.trim() || nameAr.trim(),
      },
      freq,
      depth,
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t(lang, "editTask")}>
      <div className="stack">
        <TrilingualNameFields
          key={`${open}-${task.id}`}
          lang={lang}
          ar={nameAr}
          en={nameEn}
          fil={nameFil}
          onAr={setNameAr}
          onEn={setNameEn}
          onFil={setNameFil}
          placeholders={{ ar: "taskNameAr", en: "taskNameEn", fil: "taskNameFil" }}
          initialAr={task.name.ar}
        />

        <FreqDepthPicker lang={lang} freq={freq} setFreq={setFreq} depth={depth} setDepth={setDepth} />

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!nameAr.trim()}
          style={!nameAr.trim() ? { opacity: 0.5 } : undefined}
          {...press(save)}
        >
          {t(lang, "taskSaved").replace(" ✓", "")}
        </button>
        <button
          type="button"
          className="btn btn-block"
          style={{ color: "var(--danger)" }}
          {...press(() => {
            onDelete(task);
            onClose();
          })}
        >
          <Icon name="trash" size={20} /> {t(lang, "deleteTask")}
        </button>
      </div>
    </BottomSheet>
  );
}
