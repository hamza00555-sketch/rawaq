import { useEffect, useRef, useState } from "react";
import { LANGS, WORKER_LANGS, t } from "../i18n.js";
import { contractEnd, formatDate, isContractExpired, nextVisitDate, remainingVisits, todayStr } from "../data.js";
import { press } from "../press.js";
import { applyHome, exportHome, parseHome } from "../transfer.js";
import BottomSheet from "../components/BottomSheet.jsx";
import Icon from "../components/Icons.jsx";

// 2023-01-01 was a Sunday — reference week for localized weekday names.
const weekdayName = (lang, day) => {
  const locale = lang === "ar" ? "ar" : lang === "fil" ? "fil" : "en";
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2023, 0, 1 + day));
  } catch {
    return String(day);
  }
};

// Full reset: flag it, then reload — main.jsx wipes every rawaq_* key
// before React mounts, so nothing can re-persist old state mid-reset.
const resetAllData = () => {
  sessionStorage.setItem("rawaq_reset", "1");
  window.location.replace(window.location.pathname);
};

export default function SettingsScreen({ lang, setLang, theme, setTheme, owner, setOwner, history, contract, setContract, uiSize, setUiSize, workerLang, setWorkerLang }) {
  const [nameDraft, setNameDraft] = useState(owner);
  const [savedMsg, setSavedMsg] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importErr, setImportErr] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const firstRender = useRef(true);

  // Copy needs real transient activation (clipboard) — native onClick.
  const copyHomeData = async () => {
    const code = await exportHome();
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const restore = async () => {
    let keys;
    try {
      keys = await parseHome(importCode);
    } catch {
      setImportErr(true);
      setConfirmRestore(false);
      return;
    }
    if (!confirmRestore) {
      setImportErr(false);
      setConfirmRestore(true);
      return;
    }
    applyHome(keys);
    window.location.replace(window.location.pathname);
  };

  // Auto-save the name (debounced) — no Save button.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setOwner(nameDraft.trim());
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 1500);
    }, 600);
    return () => clearTimeout(timer);
  }, [nameDraft, setOwner]);

  return (
    <div className="screen">
      <header className="appbar">
        <h1>{t(lang, "settings")}</h1>
      </header>

      <div className="card stack">
        <div className="setting-row">
          <span>{t(lang, "language")}</span>
          <div className="seg" style={{ flex: 1, maxWidth: 280 }}>
            {Object.entries(LANGS).map(([code, meta]) => (
              <button
                key={code}
                type="button"
                className={`seg-btn ${lang === code ? "active" : ""}`}
                aria-pressed={lang === code}
                aria-label={meta.label}
                {...press(() => setLang(code))}
              >
                {meta.flag}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <span>{t(lang, "theme")}</span>
          <div className="seg" style={{ flex: 1, maxWidth: 280 }}>
            <button
              type="button"
              className={`seg-btn ${theme === "light" ? "active" : ""}`}
              aria-pressed={theme === "light"}
              {...press(() => setTheme("light"))}
            >
              <Icon name="sun" size={18} /> {t(lang, "light")}
            </button>
            <button
              type="button"
              className={`seg-btn ${theme === "dark" ? "active" : ""}`}
              aria-pressed={theme === "dark"}
              {...press(() => setTheme("dark"))}
            >
              <Icon name="moon" size={18} /> {t(lang, "dark")}
            </button>
          </div>
        </div>
      </div>

      <h2 className="section-title">{t(lang, "workerLangTitle")}</h2>
      <div className="card stack">
        <div className="seg" style={{ width: "100%" }}>
          {Object.entries(WORKER_LANGS).map(([code, meta]) => (
            <button
              key={code}
              type="button"
              className={`seg-btn ${workerLang === code ? "active" : ""}`}
              aria-pressed={workerLang === code}
              aria-label={meta.label}
              {...press(() => setWorkerLang(code))}
            >
              {meta.flag}
            </button>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          {WORKER_LANGS[workerLang]?.label} · {t(lang, "workerLangHint")}
        </p>
      </div>

      <h2 className="section-title">{t(lang, "accessibility")}</h2>
      <div className="card">
        <div className="setting-row">
          <span>{t(lang, "displaySize")}</span>
          <div className="seg" style={{ flex: 1, maxWidth: 280 }}>
            <button
              type="button"
              className={`seg-btn ${uiSize !== "large" ? "active" : ""}`}
              aria-pressed={uiSize !== "large"}
              {...press(() => setUiSize("normal"))}
            >
              {t(lang, "sizeNormal")}
            </button>
            <button
              type="button"
              className={`seg-btn ${uiSize === "large" ? "active" : ""}`}
              aria-pressed={uiSize === "large"}
              {...press(() => setUiSize("large"))}
            >
              {t(lang, "sizeLarge")}
            </button>
          </div>
        </div>
      </div>

      <h2 className="section-title">{t(lang, "ownerName")}</h2>
      <div className="card">
        <input
          className="input"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder={t(lang, "ownerNamePlaceholder")}
          aria-label={t(lang, "ownerName")}
        />
        {savedMsg && (
          <p className="muted" role="status" style={{ marginTop: 8 }}>
            {t(lang, "saved")}
          </p>
        )}
      </div>

      <h2 className="section-title">{t(lang, "workerSchedule")}</h2>
      <div className="card stack">
        <span className="muted">{t(lang, "visitDays")}</span>
        <div className="chip-wrap">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const active = (contract?.visitDays || []).includes(day);
            return (
              <button
                key={day}
                type="button"
                className={`task-chip ${active ? "selected" : ""}`}
                aria-pressed={active}
                {...press(() => {
                  const days = contract?.visitDays || [];
                  setContract({
                    startDate: todayStr(),
                    months: 3,
                    ...contract,
                    visitDays: active ? days.filter((x) => x !== day) : [...days, day].sort(),
                  });
                })}
              >
                {weekdayName(lang, day)}
              </button>
            );
          })}
        </div>

        <div className="setting-row">
          <span>{t(lang, "contractStart")}</span>
          <input
            type="date"
            className="input"
            style={{ maxWidth: 180 }}
            value={contract?.startDate || ""}
            onChange={(e) =>
              setContract({ visitDays: [], months: 3, ...contract, startDate: e.target.value })
            }
            aria-label={t(lang, "contractStart")}
          />
        </div>

        <div className="setting-row">
          <span>{t(lang, "contractMonths")}</span>
          <select
            className="input"
            style={{ maxWidth: 120 }}
            value={contract?.months || 3}
            onChange={(e) =>
              setContract({ visitDays: [], startDate: todayStr(), ...contract, months: Number(e.target.value) })
            }
            aria-label={t(lang, "contractMonths")}
          >
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {contract?.visitDays?.length > 0 && contract?.startDate && (
          isContractExpired(contract) ? (
            <p className="muted" role="status" style={{ color: "var(--danger)" }}>
              {t(lang, "contractExpired")}
            </p>
          ) : (
            <div className="stack" style={{ gap: 6 }}>
              <div className="row spread">
                <span className="muted">{t(lang, "contractEndLabel")}</span>
                <strong>{formatDate(lang, contractEnd(contract))}</strong>
              </div>
              {nextVisitDate(contract) && (
                <div className="row spread">
                  <span className="muted">{t(lang, "nextVisit")}</span>
                  <strong>{formatDate(lang, nextVisitDate(contract))}</strong>
                </div>
              )}
              <div className="row spread">
                <span className="muted">{t(lang, "remainingVisitsLabel")}</span>
                <strong>{remainingVisits(contract)}</strong>
              </div>
            </div>
          )
        )}
      </div>

      <h2 className="section-title">{t(lang, "history")}</h2>
      {history.length === 0 ? (
        <div className="card center-text muted">{t(lang, "noHistory")}</div>
      ) : (
        <div className="stack">
          {[...history].reverse().map((visit) => (
            <div key={visit.id} className="history-item">
              <div className="row spread">
                <strong>{formatDate(lang, visit.date)}</strong>
                <span className="muted">
                  {visit.done} {t(lang, "outOf")} {visit.total} · {visit.percent}%
                </span>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${visit.percent}%` }} />
              </div>
              {visit.mode && (
                <span className="muted" style={{ fontSize: 14 }}>
                  {visit.mode === "surface" ? t(lang, "surfaceClean") : t(lang, "deepClean")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">{t(lang, "transferTitle")}</h2>
      <div className="card stack">
        <p className="muted" style={{ fontSize: 13 }}>{t(lang, "transferHint")}</p>
        <button type="button" className="btn btn-soft btn-block" onClick={copyHomeData}>
          {copied ? t(lang, "homeDataCopied") : (<><Icon name="link" size={20} /> {t(lang, "copyHomeData")}</>)}
        </button>
        <button
          type="button"
          className="btn btn-block"
          {...press(() => {
            setImportCode("");
            setImportErr(false);
            setConfirmRestore(false);
            setImportOpen(true);
          })}
        >
          <Icon name="refresh" size={20} /> {t(lang, "importHomeData")}
        </button>
        <p className="muted" style={{ fontSize: 12 }}>{t(lang, "transferNoPhotos")}</p>
      </div>

      <BottomSheet open={importOpen} onClose={() => setImportOpen(false)} title={t(lang, "importHomeData")}>
        <div className="stack">
          <textarea
            className="input"
            dir="ltr"
            rows={5}
            style={{ resize: "none", fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}
            value={importCode}
            onChange={(e) => {
              setImportCode(e.target.value);
              setImportErr(false);
              setConfirmRestore(false);
            }}
            placeholder={t(lang, "pasteCodeHere")}
          />
          {importErr && (
            <p role="alert" style={{ color: "var(--danger)", fontWeight: 600, fontSize: 14 }}>
              {t(lang, "invalidCode")}
            </p>
          )}
          <button
            type="button"
            className={`btn btn-block ${confirmRestore ? "btn-danger" : "btn-primary"}`}
            disabled={!importCode.trim()}
            style={!importCode.trim() ? { opacity: 0.5 } : undefined}
            {...press(restore)}
          >
            {confirmRestore ? t(lang, "restoreConfirm") : t(lang, "restore")}
          </button>
        </div>
      </BottomSheet>

      <h2 className="section-title" style={{ color: "var(--danger)" }}>{t(lang, "dangerZone")}</h2>
      <div className="card">
        <button
          type="button"
          className={`btn btn-block ${confirmReset ? "btn-danger" : ""}`}
          style={!confirmReset ? { color: "var(--danger)" } : undefined}
          {...press(() => {
            if (!confirmReset) {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 5000);
              return;
            }
            resetAllData();
          })}
        >
          <Icon name="trash" size={20} /> {confirmReset ? t(lang, "resetConfirm") : t(lang, "resetApp")}
        </button>
      </div>

      <p className="muted center-text" style={{ marginTop: 26, fontSize: 13 }}>
        {t(lang, "appName")} · {t(lang, "version")} 5.1
      </p>
    </div>
  );
}
