import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";
import Icon from "./Icons.jsx";

// Pick / add / rename / delete households. Opened from the Home appbar.
export default function HomeSwitcher({
  open,
  onClose,
  lang,
  homes,
  activeHome,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const submitAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName);
    setNewName("");
    setAdding(false);
    onClose();
  };

  const submitRename = () => {
    if (editId) onRename(editId, editName);
    setEditId(null);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t(lang, "myHomes")}>
      <div className="stack">
        {homes.map((home) => (
          <div key={home.id} className="home-row">
            {editId === home.id ? (
              <>
                <input
                  className="input"
                  dir="rtl"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <button type="button" className="icon-btn" aria-label={t(lang, "saved")} {...press(submitRename)}>
                  <Icon name="check" size={20} strokeWidth={3} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`home-pick ${home.id === activeHome ? "active" : ""}`}
                  aria-pressed={home.id === activeHome}
                  {...press(() => {
                    if (home.id !== activeHome) onSwitch(home.id);
                    onClose();
                  })}
                >
                  <Icon name={home.id === activeHome ? "check-circle" : "home"} size={20} />
                  <span>{home.name}</span>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t(lang, "renameHome")}
                  {...press(() => {
                    setEditId(home.id);
                    setEditName(home.name);
                  })}
                >
                  <Icon name="pencil" size={18} />
                </button>
                {homes.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t(lang, "deleteHome")}
                    style={{ color: "var(--danger)" }}
                    {...press(() => setConfirmDel(confirmDel === home.id ? null : home.id))}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                )}
              </>
            )}
            {confirmDel === home.id && (
              <button
                type="button"
                className="btn btn-danger btn-block"
                style={{ marginTop: 6 }}
                {...press(() => {
                  onDelete(home.id);
                  setConfirmDel(null);
                })}
              >
                {t(lang, "deleteHomeConfirm")}
              </button>
            )}
          </div>
        ))}

        {adding ? (
          <div className="home-row">
            <input
              className="input"
              dir="rtl"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t(lang, "homeNamePlaceholder")}
              autoFocus
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={t(lang, "add")}
              disabled={!newName.trim()}
              {...press(submitAdd)}
            >
              <Icon name="check" size={20} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-soft btn-block" {...press(() => setAdding(true))}>
            <Icon name="plus" size={20} /> {t(lang, "addHome")}
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
