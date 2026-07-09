import { useState } from "react";
import { t } from "../i18n.js";
import { TASK_LIBRARY } from "../data.js";
import { press } from "../press.js";
import Icon from "./Icons.jsx";
import TrilingualNameFields from "./TrilingualNameFields.jsx";

// Suggested tasks for a room type: one tap adds. Already-added names are
// hidden. A "write custom task" row expands the trilingual inputs.
export default function TaskLibraryChips({ lang, roomType, existingArNames, onPick, onCustom }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFil, setNameFil] = useState("");

  const taken = new Set([...existingArNames].map((x) => x.trim()));
  const suggestions = (TASK_LIBRARY[roomType] || TASK_LIBRARY.general).filter(
    (x) => !taken.has(x.ar)
  );

  const submitCustom = () => {
    if (!nameAr.trim()) return;
    onCustom({
      ar: nameAr.trim(),
      en: nameEn.trim() || nameAr.trim(),
      fil: nameFil.trim() || nameAr.trim(),
    });
    setNameAr("");
    setNameEn("");
    setNameFil("");
    setCustomOpen(false);
  };

  return (
    <div className="stack">
      {suggestions.length > 0 && (
        <>
          <span className="muted">{t(lang, "suggestedTasks")}</span>
          <div className="chip-wrap">
            {suggestions.map((item) => (
              <button
                key={item.ar}
                type="button"
                className="task-chip"
                {...press(() => onPick(item))}
              >
                <Icon name="plus" size={16} /> {item[lang] || item.ar}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        className="btn btn-soft btn-block"
        aria-expanded={customOpen}
        {...press(() => setCustomOpen(!customOpen))}
      >
        {t(lang, "writeCustomTask")}
      </button>

      {customOpen && (
        <div className="stack">
          <TrilingualNameFields
            lang={lang}
            ar={nameAr}
            en={nameEn}
            fil={nameFil}
            onAr={setNameAr}
            onEn={setNameEn}
            onFil={setNameFil}
            placeholders={{ ar: "taskNameAr", en: "taskNameEn", fil: "taskNameFil" }}
          />
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!nameAr.trim()}
            style={!nameAr.trim() ? { opacity: 0.5 } : undefined}
            {...press(submitCustom)}
          >
            {t(lang, "add")}
          </button>
        </div>
      )}
    </div>
  );
}
