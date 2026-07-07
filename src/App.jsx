import { useEffect, useMemo, useState } from "react";
import { LANGS, t } from "./i18n.js";
import {
  DEFAULT_ROOMS,
  STORAGE_KEYS,
  buildToday,
  migrateRooms,
  taskFingerprint,
  todayStr,
} from "./data.js";
import { useStoredState } from "./storage.js";
import { decodeWorkerHash } from "./share.js";
import { parseShortHash } from "./shares.js";
import { useShareSync } from "./useShareSync.js";

import SplashScreen from "./screens/SplashScreen.jsx";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import TodayScreen from "./screens/TodayScreen.jsx";
import RoomsScreen from "./screens/RoomsScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import WorkerView from "./screens/WorkerView.jsx";
import BottomNav from "./components/NavIcons.jsx";
import ShareModal from "./components/ShareModal.jsx";
import ShareFab from "./components/ShareFab.jsx";
import ReshareBanner from "./components/ReshareBanner.jsx";

export default function App() {
  // A #w= (short) or legacy #worker= link renders the standalone worker view
  const shortId = useMemo(() => parseShortHash(window.location.hash), []);
  const workerPayload = useMemo(() => decodeWorkerHash(window.location.hash), []);
  if (shortId) return <WorkerView shortId={shortId} />;
  if (workerPayload) return <WorkerView payload={workerPayload} />;
  return <MainApp />;
}

function MainApp() {
  // Captured before useStoredState writes the key on first render.
  const [firstRun, setFirstRun] = useState(
    () => localStorage.getItem(STORAGE_KEYS.owner) == null
  );

  const [lang, setLang] = useStoredState(STORAGE_KEYS.lang, "ar");
  const [theme, setTheme] = useStoredState(STORAGE_KEYS.theme, "light");
  const [rooms, setRooms] = useStoredState(STORAGE_KEYS.rooms, DEFAULT_ROOMS, migrateRooms);
  const [owner, setOwner] = useStoredState(STORAGE_KEYS.owner, "");
  const [today, setToday] = useStoredState(STORAGE_KEYS.today, null);
  const [history, setHistory] = useStoredState(STORAGE_KEYS.history, []);
  const [lastShare, setLastShare] = useStoredState(STORAGE_KEYS.lastShare, null);

  const [tab, setTab] = useState("home");
  const [splash, setSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Splash: ~1.6s then fade out
  useEffect(() => {
    const t1 = setTimeout(() => setSplashLeaving(true), 1600);
    const t2 = setTimeout(() => setSplash(false), 1950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // RTL/LTR + lang attribute follow the selected language
  useEffect(() => {
    document.documentElement.dir = LANGS[lang]?.dir || "rtl";
    document.documentElement.lang = lang;
  }, [lang]);

  // Keep today's list in sync with the date, mode and rooms (skipped ids
  // and mom's extras carry over via buildToday).
  useEffect(() => {
    const mode = today?.mode || "surface";
    const fresh = buildToday(rooms, mode, today?.date === todayStr() ? today : null);
    const sameIds =
      today &&
      today.date === todayStr() &&
      Array.isArray(today.skipped) &&
      Array.isArray(today.extras) &&
      today.tasks.length === fresh.tasks.length &&
      today.tasks.every((x, i) => x.id === fresh.tasks[i].id && x.done === fresh.tasks[i].done);
    if (!sameIds) setToday(fresh);
  }, [rooms, today, setToday]);

  // Live sync: worker's checkmarks flow into today via the share doc.
  useShareSync(lastShare, setToday);

  const finishVisit = () => {
    if (!today) return;
    const total = today.tasks.length;
    const done = today.tasks.filter((x) => x.done).length;
    setHistory([
      ...history,
      {
        id: Date.now().toString(36),
        date: today.date,
        mode: today.mode,
        done,
        total,
        percent: total ? Math.round((done / total) * 100) : 0,
      },
    ]);
    setToday({ ...today, tasks: today.tasks.map((x) => ({ ...x, done: false })) });
  };

  if (splash) {
    return (
      <div className={`app rawaq-${theme}`}>
        <SplashScreen lang={lang} owner={owner} leaving={splashLeaving} />
      </div>
    );
  }

  if (firstRun) {
    return (
      <div className={`app rawaq-${theme}`}>
        <WelcomeScreen
          lang={lang}
          onDone={(name) => {
            setOwner(name);
            setFirstRun(false);
          }}
        />
      </div>
    );
  }

  const safeToday = today || { date: todayStr(), mode: "surface", skipped: [], extras: [], tasks: [] };

  const needsReshare =
    lastShare?.date === todayStr() &&
    lastShare.mode === safeToday.mode &&
    taskFingerprint(safeToday.tasks) !== lastShare.fingerprint;

  const showShareUi = tab === "home" || tab === "today";

  return (
    <div className={`app rawaq-${theme}`}>
      {tab === "home" && (
        <HomeScreen
          lang={lang}
          owner={owner}
          today={safeToday}
          rooms={rooms}
          setRooms={setRooms}
          history={history}
        />
      )}
      {tab === "today" && (
        <TodayScreen
          lang={lang}
          today={safeToday}
          setToday={setToday}
          rooms={rooms}
          onFinishVisit={finishVisit}
        />
      )}
      {tab === "rooms" && <RoomsScreen lang={lang} rooms={rooms} setRooms={setRooms} />}
      {tab === "settings" && (
        <SettingsScreen
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          owner={owner}
          setOwner={setOwner}
          history={history}
        />
      )}

      {showShareUi && needsReshare && (
        <ReshareBanner lang={lang} onShare={() => setShareOpen(true)} />
      )}
      {showShareUi && <ShareFab lang={lang} onShare={() => setShareOpen(true)} />}

      <BottomNav
        tab={tab}
        setTab={setTab}
        labels={{
          home: t(lang, "home"),
          today: t(lang, "today"),
          rooms: t(lang, "rooms"),
          settings: t(lang, "settings"),
        }}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        lang={lang}
        today={safeToday}
        owner={owner}
        rooms={rooms}
        lastShare={lastShare}
        onShared={setLastShare}
      />
    </div>
  );
}
