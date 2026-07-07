import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { taskFingerprint, todayStr } from "../data.js";
import { createShare, shareIdFromLink } from "../shares.js";
import BottomSheet from "./BottomSheet.jsx";
import QRCanvas from "./QRCanvas.jsx";

export default function ShareModal({ open, onClose, lang, today, owner, rooms, lastShare, onShared }) {
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState({ status: "loading", link: "" });
  const openRef = useRef(open);
  openRef.current = open;

  // Short link via Firestore; unchanged tasks reuse the existing link so
  // mom's live listener and the worker stay on one doc. On failure: clear
  // error + retry — never the huge legacy hash link.
  const prepare = useCallback(() => {
    if (!today) return;
    setCopied(false);

    const fingerprint = taskFingerprint(today.tasks);
    if (lastShare?.link && lastShare.date === todayStr() && lastShare.fingerprint === fingerprint) {
      setState({ status: "short", link: lastShare.link });
      return;
    }

    setState({ status: "loading", link: "" });
    const roomsMeta = Object.fromEntries(rooms.map((r) => [r.id, { name: r.name, emoji: r.emoji }]));
    createShare({ date: today.date, owner, tasks: today.tasks, rooms: roomsMeta })
      .then((link) => {
        if (!openRef.current) return;
        setState({ status: "short", link });
        onShared({
          id: shareIdFromLink(link),
          link,
          date: today.date,
          fingerprint,
          sharedAt: Date.now(),
        });
      })
      .catch(() => {
        if (!openRef.current) return;
        setState({ status: "error", link: "" });
      });
  }, [today, owner, rooms, lastShare, onShared]);

  useEffect(() => {
    if (open) prepare();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = state.status === "short";
  const link = state.link;

  // Copy and WhatsApp need real transient activation (clipboard, popups,
  // navigator.share) — these two intentionally use onClick, not press().
  const copy = async () => {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const whatsapp = async () => {
    if (!ready) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: link });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank", "noopener");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t(lang, "shareTitle")}>
      <div className="stack center-text" style={{ alignItems: "center" }}>
        <p className="muted">{t(lang, "shareDesc")}</p>

        {state.status === "loading" && (
          <p className="muted" role="status" style={{ padding: "40px 0" }}>
            {t(lang, "preparingLink")}
          </p>
        )}

        {state.status === "error" && (
          <div className="stack center-text" style={{ alignItems: "center", padding: "24px 0" }}>
            <p role="alert" style={{ color: "var(--danger)", fontWeight: 600 }}>
              {t(lang, "shareError")}
            </p>
            <button type="button" className="btn btn-primary" onClick={prepare}>
              🔄 {t(lang, "retry")}
            </button>
          </div>
        )}

        {ready && (
          <>
            <QRCanvas value={link} label={t(lang, "shareTitle")} />
            <p className="muted" dir="ltr" style={{ fontSize: 13, wordBreak: "break-all", maxWidth: 320 }}>
              {link}
            </p>
          </>
        )}

        <button type="button" className="btn btn-soft btn-block" disabled={!ready} onClick={copy}>
          {copied ? t(lang, "copied") : `🔗 ${t(lang, "copyLink")}`}
        </button>
        <button type="button" className="btn btn-primary btn-block" disabled={!ready} onClick={whatsapp}>
          {t(lang, "whatsapp")}
        </button>
      </div>
    </BottomSheet>
  );
}
