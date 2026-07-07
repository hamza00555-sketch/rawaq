import { useMemo, useState } from "react";
import { t } from "../i18n.js";
import { encodeWorkerLink } from "../share.js";
import { press } from "../press.js";
import BottomSheet from "./BottomSheet.jsx";
import QRCanvas from "./QRCanvas.jsx";

export default function ShareModal({ open, onClose, lang, today, owner }) {
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => {
    if (!open || !today) return "";
    return encodeWorkerLink({ date: today.date, mode: today.mode, owner, tasks: today.tasks });
  }, [open, today, owner]);

  const copy = async () => {
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

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank", "noopener");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t(lang, "shareTitle")}>
      <div className="stack center-text" style={{ alignItems: "center" }}>
        <p className="muted">{t(lang, "shareDesc")}</p>
        <QRCanvas value={link} />
        <button type="button" className="btn btn-soft btn-block" {...press(copy)}>
          {copied ? t(lang, "copied") : `🔗 ${t(lang, "copyLink")}`}
        </button>
        <button type="button" className="btn btn-primary btn-block" {...press(whatsapp)}>
          {t(lang, "whatsapp")}
        </button>
      </div>
    </BottomSheet>
  );
}
