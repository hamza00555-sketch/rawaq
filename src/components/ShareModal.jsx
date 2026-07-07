import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { encodeWorkerLink } from "../share.js";
import { createShare } from "../shares.js";
import BottomSheet from "./BottomSheet.jsx";
import QRCanvas from "./QRCanvas.jsx";

export default function ShareModal({ open, onClose, lang, today, owner }) {
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState({ status: "loading", link: "" });

  // Short link via Firestore; any failure falls back to the legacy long hash.
  useEffect(() => {
    if (!open || !today) return;
    let cancelled = false;
    setState({ status: "loading", link: "" });
    setCopied(false);
    const payload = { date: today.date, mode: today.mode, owner, tasks: today.tasks };
    createShare(payload)
      .then((link) => !cancelled && setState({ status: "short", link }))
      .catch(() => !cancelled && setState({ status: "fallback", link: encodeWorkerLink(payload) }));
    return () => {
      cancelled = true;
    };
  }, [open, today, owner]);

  const ready = state.status !== "loading";
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
        {ready ? (
          <>
            <QRCanvas value={link} label={t(lang, "shareTitle")} />
            <p className="muted" dir="ltr" style={{ fontSize: 13, wordBreak: "break-all", maxWidth: 320 }}>
              {state.status === "short" ? link : ""}
            </p>
          </>
        ) : (
          <p className="muted" role="status" style={{ padding: "40px 0" }}>
            {t(lang, "preparingLink")}
          </p>
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
