import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";
import Icon from "./Icons.jsx";

// Pick / add / rename / delete households, and link them across devices
// via a house code. Each device names its own copy; only the data syncs.
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
  onJoin,
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(null); // "join" while joining
  const [copied, setCopied] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinErr, setJoinErr] = useState("");

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

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  };

  const submitJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinErr("");
    setBusy("join");
    try {
      await onJoin(joinCode, joinName);
      setJoining(false);
      setJoinCode("");
      setJoinName("");
      onClose();
    } catch (e) {
      setJoinErr(e?.code === "notfound" ? t(lang, "houseNotFound") : t(lang, "houseSyncError"));
    }
    setBusy(null);
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

            {/* The house code sits next to the name, ready to copy & share */}
            {editId !== home.id && (
              <div className="home-link-row">
                <span className="muted" style={{ fontSize: 12 }}>{t(lang, "houseCodeLabel")}</span>
                <button
                  type="button"
                  className="house-code"
                  aria-label={t(lang, "copyCode")}
                  onClick={() => home.houseId && copyCode(home.houseId)}
                >
                  <code>{home.houseId || "…"}</code>
                  <Icon name={copied === home.houseId ? "check" : "link"} size={15} />
                  <span className="muted">{copied === home.houseId ? t(lang, "copied") : t(lang, "copyCode")}</span>
                </button>
              </div>
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
            <button type="button" className="icon-btn" aria-label={t(lang, "add")} disabled={!newName.trim()} {...press(submitAdd)}>
              <Icon name="check" size={20} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-soft btn-block" {...press(() => setAdding(true))}>
            <Icon name="plus" size={20} /> {t(lang, "addHome")}
          </button>
        )}

        {/* Join an existing house by code */}
        {joining ? (
          <div className="stack" style={{ gap: 8 }}>
            <input
              className="input"
              dir="ltr"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setJoinErr(""); }}
              placeholder={t(lang, "houseCodePlaceholder")}
              autoFocus
            />
            <input
              className="input"
              dir="rtl"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder={t(lang, "homeNamePlaceholder")}
            />
            {joinErr && <p role="alert" style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{joinErr}</p>}
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={!joinCode.trim() || busy === "join"}
              style={!joinCode.trim() || busy === "join" ? { opacity: 0.5 } : undefined}
              {...press(submitJoin)}
            >
              {busy === "join" ? t(lang, "joining") : t(lang, "joinHouse")}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-block" {...press(() => setJoining(true))}>
            <Icon name="link" size={18} /> {t(lang, "joinByCode")}
          </button>
        )}

        <p className="muted" style={{ fontSize: 12 }}>{t(lang, "linkHint")}</p>
      </div>
    </BottomSheet>
  );
}
