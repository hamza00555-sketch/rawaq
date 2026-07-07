import { useEffect, useMemo, useState } from "react";
import { LANGS, t } from "./i18n.js";
import { DEFAULT_PIN, DEFAULT_ROOMS, STORAGE_KEYS, buildToday, todayStr } from "./data.js";
import { useStoredState } from "./storage.js";
import { decodeWorkerHash } from "./share.js";
import { parseShortHash } from "./shares.js";

import SplashScreen from "./screens/SplashScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import TodayScreen from "./screens/TodayScreen.jsx";
import RoomsScreen from "./screens/RoomsScreen.jsx";
import HistoryScreen from "./screens/HistoryScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import WorkerScreen from "./screens/WorkerScreen.jsx";
import WorkerView from "./screens/WorkerView.jsx";
import BottomNav from "./components/NavIcons.jsx";
import ShareModal from "./components/ShareModal.jsx";
import PinModal from "./components/PinModal.jsx";

export default function App() {
  // A #w= (short) or legacy #worker= link renders the standalone worker view
  const shortId = useMemo(() => parseShortHash(window.location.hash), []);
  const workerPayload = useMemo(() => decodeWorkerHash(window.location.hash), []);
  if (shortId) return <WorkerView shortId={shortId} />;
  if (workerPayload) return <WorkerView payload={workerPayload} />;
  return <MainApp />;
}

function MainApp() {
  const [lang, setLang] = useStoredState(STORAGE_KEYS.lang, "ar");
  const [theme, setTheme] = useStoredState(STORAGE_KEYS.theme, "light");
  const [rooms, setRooms] = useStoredState(STORAGE_KEYS.rooms, DEFAULT_ROOMS);
  const [pin, setPin] = useStoredState(STORAGE_KEYS.pin, DEFAULT_PIN);
  const [owner, setOwner] = useStoredState(STORAGE_KEYS.owner, "");
  const [today, setToday] = useStoredState(STORAGE_KEYS.today, null);
  const [history, setHistory] = useStoredState(STORAGE_KEYS.history, []);

  const [tab, setTab] = useState("home");
  const [splash, setSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [workerMode, setWorkerMode] = useState(false);
  const [workerAsk, setWorkerAsk] = useState(false);
  const [workerPinError, setWorkerPinError] = useState("");

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

  // Keep today's list in sync with the date, the selected mode and the rooms
  useEffect(() => {
    const mode = today?.mode || "surface";
    const fresh = buildToday(rooms, mode, today?.date === todayStr() ? today : null);
    const sameIds =
      today &&
      today.date === todayStr() &&
      today.tasks.length === fresh.tasks.length &&
      today.tasks.every((x, i) => x.id === fresh.tasks[i].id && x.done === fresh.tasks[i].done);
    if (!sameIds) setToday(fresh);
  }, [rooms, today, setToday]);

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

  const tryEnterWorker = (value) => {
    if (value === pin) {
      setWorkerAsk(false);
      setWorkerPinError("");
      setWorkerMode(true);
    } else {
      setWorkerPinError(t(lang, "wrongPin"));
    }
  };

  if (splash) {
    return (
      <div className={`app rawaq-${theme}`}>
        <SplashScreen lang={lang} owner={owner} leaving={splashLeaving} />
      </div>
    );
  }

  if (workerMode && today) {
    return <WorkerScreen today={today} setToday={setToday} pin={pin} onExit={() => setWorkerMode(false)} />;
  }

  const safeToday = today || { date: todayStr(), mode: "surface", tasks: [] };

  return (
    <div className={`app rawaq-${theme}`}>
      {tab === "home" && (
        <HomeScreen
          lang={lang}
          owner={owner}
          today={safeToday}
          rooms={rooms}
          setRooms={setRooms}
          onShare={() => setShareOpen(true)}
          onWorkerMode={() => {
            setWorkerPinError("");
            setWorkerAsk(true);
          }}
        />
      )}
      {tab === "today" && (
        <TodayScreen lang={lang} today={safeToday} setToday={setToday} onFinishVisit={finishVisit} />
      )}
      {tab === "rooms" && <RoomsScreen lang={lang} rooms={rooms} setRooms={setRooms} />}
      {tab === "history" && <HistoryScreen lang={lang} history={history} />}
      {tab === "settings" && (
        <SettingsScreen
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          owner={owner}
          setOwner={setOwner}
          pin={pin}
          setPin={setPin}
        />
      )}

      <BottomNav
        tab={tab}
        setTab={setTab}
        labels={{
          home: t(lang, "home"),
          today: t(lang, "today"),
          rooms: t(lang, "rooms"),
          history: t(lang, "history"),
          settings: t(lang, "settings"),
        }}
      />

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} lang={lang} today={safeToday} owner={owner} />

      {workerAsk && (
        <PinModal
          title={t(lang, "enterPin")}
          error={workerPinError}
          onSubmit={tryEnterWorker}
          onCancel={() => setWorkerAsk(false)}
          cancelLabel={t(lang, "cancel")}
        />
      )}
    </div>
  );
}
