import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { taskFingerprint, todayStr } from "../data.js";
import { ownerOf, sanitizeMap } from "../houseMap.js";
import { compressImage } from "../image.js";
import { createShare, shareIdFromLink } from "../shares.js";
import BottomSheet from "./BottomSheet.jsx";
import QRCanvas from "./QRCanvas.jsx";
import Icon from "./Icons.jsx";

export default function ShareModal({ open, onClose, lang, today, owner, rooms, houseMap, workerLang, lastShare, onShared }) {
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState({ status: "loading", link: "" });
  const openRef = useRef(open);
  openRef.current = open;

  // Short link via Firestore; unchanged tasks reuse the existing link so
  // mom's live listener and the worker stay on one doc. On failure: clear
  // error + retry — never the huge legacy hash link.
  const prepare = useCallback(async () => {
    if (!today) return;
    setCopied(false);

    const fingerprint = taskFingerprint(today.tasks);
    const wl = workerLang || "fil";
    if (
      lastShare?.link &&
      lastShare.date === todayStr() &&
      lastShare.fingerprint === fingerprint &&
      (lastShare.workerLang || "fil") === wl
    ) {
      setState({ status: "short", link: lastShare.link });
      return;
    }

    setState({ status: "loading", link: "" });
    // Map layout + priority ride inside the rooms meta values: the published
    // Firestore rules only whitelist top-level doc keys, so this needs no
    // rules change. Worker updates still touch only {tasks, updatedAt}.
    const { cols, rows, blocks } = sanitizeMap(houseMap, rooms);
    // Ride room photos to the worker, but only for placed rooms (tappable
    // on the map). Each is re-compressed to a small thumbnail at share
    // time — this works for older uncompressed photos too — and a byte
    // budget keeps the whole doc under Firestore's 1MB limit (oldest-
    // priority rooms win).
    let photoBudget = 720_000;
    const placed = rooms.filter((r) => r.photo && blocks[r.id]);
    const thumbs = await Promise.all(
      placed.map((r) => compressImage(r.photo, { maxDim: 640, targetBytes: 60_000 }).catch(() => null))
    );
    const photoById = {};
    placed.forEach((r, i) => {
      const thumb = thumbs[i];
      if (thumb && thumb.length <= photoBudget) {
        photoById[r.id] = thumb;
        photoBudget -= thumb.length;
      }
    });
    if (!openRef.current) return;

    const roomsMeta = Object.fromEntries([
      // grid dimensions ride as a pseudo-entry (no layout → renderers skip it)
      ["__grid", { cols, rows }],
      // worker preferences (chosen display language) — also layout-less
      ["__prefs", { lang: workerLang || "fil" }],
      // Rooms and hallways alike (halls are rooms with type "hall"): each
      // carries its layout, priority, photo and its tasks flow via today.tasks.
      // A hall may span several blocks — `layouts` holds them all; `layout`
      // stays the primary rect for older worker builds / hasMap detection.
      ...rooms.map((r, i) => {
        const rects = Object.entries(blocks)
          .filter(([id, b]) => ownerOf(id, b) === r.id)
          .map(([, b]) => b);
        return [
          r.id,
          {
            name: r.name,
            emoji: r.emoji,
            type: r.type || "general",
            layout: blocks[r.id] || rects[0] || null,
            layouts: rects.length ? rects : null,
            priority: i + 1,
            photo: photoById[r.id] || null,
          },
        ];
      }),
    ]);
    createShare({ date: today.date, owner, tasks: today.tasks, rooms: roomsMeta })
      .then((link) => {
        if (!openRef.current) return;
        setState({ status: "short", link });
        onShared({
          id: shareIdFromLink(link),
          link,
          date: today.date,
          fingerprint,
          workerLang: wl,
          sharedAt: Date.now(),
        });
      })
      .catch((err) => {
        if (!openRef.current) return;
        setState({ status: "error", link: "", reason: err?.code === "rules" ? "rules" : "network" });
      });
  }, [today, owner, rooms, houseMap, workerLang, lastShare, onShared]);

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
              {t(lang, state.reason === "rules" ? "shareErrorRules" : "shareError")}
            </p>
            <button type="button" className="btn btn-primary" onClick={prepare}>
              <Icon name="refresh" size={20} /> {t(lang, "retry")}
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
          {copied ? (
            t(lang, "copied")
          ) : (
            <>
              <Icon name="link" size={20} /> {t(lang, "copyLink")}
            </>
          )}
        </button>
        <button type="button" className="btn btn-primary btn-block" disabled={!ready} onClick={whatsapp}>
          {t(lang, "whatsapp")}
        </button>
      </div>
    </BottomSheet>
  );
}
