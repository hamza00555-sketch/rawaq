import { useEffect, useMemo, useState } from "react";
import { LANGS, t } from "./i18n.js";
import {
  DEFAULT_ROOMS,
  STORAGE_KEYS,
  addDays,
  buildToday,
  migrateRooms,
  nextVisitDate,
  taskFingerprint,
  todayStr,
} from "./data.js";
import { load, useStoredState } from "./storage.js";
import {
  ACTIVE_KEY,
  HOMES_KEY,
  ONBOARDED_KEY,
  homeKey,
  newHomeId,
  readHomeDef,
  removeHomeData,
  writeHomeDef,
} from "./homes.js";
import { fetchHouse, newHouseCode, pushHouse } from "./house.js";
import { decodeWorkerHash } from "./share.js";
import { parseShortHash } from "./shares.js";
import { useShareSync } from "./useShareSync.js";
import { useHouseSync } from "./useHouseSync.js";

import SplashScreen from "./screens/SplashScreen.jsx";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import TodayScreen from "./screens/TodayScreen.jsx";
import RoomsScreen from "./screens/RoomsScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import WorkerView from "./screens/WorkerView.jsx";
import BottomNav from "./components/NavIcons.jsx";
import ShareModal from "./components/ShareModal.jsx";
import ReshareBanner from "./components/ReshareBanner.jsx";

export default function App() {
  // A #w= (short) or legacy #worker= link renders the standalone worker view
  const shortId = useMemo(() => parseShortHash(window.location.hash), []);
  const workerPayload = useMemo(() => decodeWorkerHash(window.location.hash), []);
  if (shortId) return <WorkerView shortId={shortId} />;
  if (workerPayload) return <WorkerView payload={workerPayload} />;
  return <MainApp />;
}

// App-wide shell: global preferences, the home registry, splash and
// onboarding. Per-home data lives in <Household>, keyed by the active
// home so switching fully remounts it against the new namespace.
function MainApp() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) != null);

  const [lang, setLang] = useStoredState(STORAGE_KEYS.lang, "ar");
  const [theme, setTheme] = useStoredState(STORAGE_KEYS.theme, "light");
  const [uiSize, setUiSize] = useStoredState(STORAGE_KEYS.uiSize, "normal");
  const [homes, setHomes] = useStoredState(HOMES_KEY, [{ id: "default", name: "بيتي" }]);
  const [activeHome, setActiveHome] = useStoredState(ACTIVE_KEY, "default");

  const [splash, setSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashLeaving(true), 1600);
    const t2 = setTimeout(() => setSplash(false), 1950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dir = LANGS[lang]?.dir || "rtl";
    document.documentElement.lang = lang;
  }, [lang]);

  const shell = (children) => (
    <div className={`app rawaq-${theme}${uiSize === "large" ? " ui-large" : ""}`}>{children}</div>
  );

  if (splash) {
    return shell(
      <SplashScreen lang={lang} owner={load(homeKey(activeHome, "owner"), "")} leaving={splashLeaving} />
    );
  }

  if (!onboarded) {
    return shell(
      <WelcomeScreen
        lang={lang}
        onDone={(name) => {
          // seed the first home's owner directly, then let Household mount
          localStorage.setItem(homeKey(activeHome, "owner"), JSON.stringify(name.trim()));
          localStorage.setItem(ONBOARDED_KEY, "1");
          setOnboarded(true);
        }}
      />
    );
  }

  const activeEntry = homes.find((h) => h.id === activeHome);

  const switchHome = (id) => setActiveHome(id);

  const addHome = (name) => {
    const id = newHomeId();
    setHomes([...homes, { id, name: name.trim() || t(lang, "newHome") }]);
    setActiveHome(id);
  };

  const renameHome = (id, name) =>
    setHomes(homes.map((h) => (h.id === id ? { ...h, name: name.trim() || h.name } : h)));

  const deleteHome = (id) => {
    if (homes.length <= 1) return;
    const next = homes.filter((h) => h.id !== id);
    removeHomeData(id);
    setHomes(next);
    if (activeHome === id) setActiveHome(next[0].id);
  };

  // Link a home to the server: upload its current definition under a new
  // code, then mark the registry entry so it syncs live. Returns the code.
  const linkHome = async (id) => {
    const code = newHouseCode();
    await pushHouse(code, readHomeDef(id));
    setHomes(homes.map((h) => (h.id === id ? { ...h, houseId: code } : h)));
    return code;
  };

  // Join an existing house by code: pull its definition into a fresh local
  // home (named locally), linked for live sync. Throws "notfound" etc.
  const joinHome = async (code, name) => {
    const clean = code.trim().toLowerCase();
    const data = await fetchHouse(clean);
    if (!data) {
      const e = new Error("notfound");
      e.code = "notfound";
      throw e;
    }
    const id = newHomeId();
    writeHomeDef(id, data);
    setHomes([...homes, { id, name: name.trim() || t(lang, "newHome"), houseId: clean }]);
    setActiveHome(id);
  };

  // Stop syncing (data stays local; the server copy is untouched).
  const unlinkHome = (id) =>
    setHomes(homes.map((h) => (h.id === id ? { id: h.id, name: h.name } : h)));

  return shell(
    <Household
      key={activeHome}
      homeId={activeHome}
      houseId={activeEntry?.houseId || null}
      lang={lang}
      setLang={setLang}
      theme={theme}
      setTheme={setTheme}
      uiSize={uiSize}
      setUiSize={setUiSize}
      homes={homes}
      activeHome={activeHome}
      onSwitchHome={switchHome}
      onAddHome={addHome}
      onRenameHome={renameHome}
      onDeleteHome={deleteHome}
      onLinkHome={linkHome}
      onJoinHome={joinHome}
      onUnlinkHome={unlinkHome}
    />
  );
}

// One household's screens. All per-home state is keyed off homeId, so
// remounting (via the key in MainApp) reloads a different home cleanly.
function Household({
  homeId,
  houseId,
  lang,
  setLang,
  theme,
  setTheme,
  uiSize,
  setUiSize,
  homes,
  activeHome,
  onSwitchHome,
  onAddHome,
  onRenameHome,
  onDeleteHome,
  onLinkHome,
  onJoinHome,
  onUnlinkHome,
}) {
  const [rooms, setRooms] = useStoredState(homeKey(homeId, "rooms"), DEFAULT_ROOMS, migrateRooms);
  const [owner, setOwner] = useStoredState(homeKey(homeId, "owner"), "");
  const [today, setToday] = useStoredState(homeKey(homeId, "today"), null);
  const [history, setHistory] = useStoredState(homeKey(homeId, "history"), []);
  const [lastShare, setLastShare] = useStoredState(homeKey(homeId, "lastShare"), null);
  const [taskLog, setTaskLog] = useStoredState(homeKey(homeId, "taskLog"), {});
  const [contract, setContract] = useStoredState(homeKey(homeId, "contract"), null);
  const [houseMap, setHouseMap] = useStoredState(homeKey(homeId, "houseMap"), { blocks: {} });
  const [workerLang, setWorkerLang] = useStoredState(homeKey(homeId, "workerLang"), "fil");

  const [tab, setTab] = useState("home");
  const [shareOpen, setShareOpen] = useState(false);

  // Keep today's list in sync with the date, the rooms and the completion
  // log (due engine). skipped ids and mom's extras carry over via buildToday.
  useEffect(() => {
    const fresh = buildToday(rooms, taskLog, today?.date === todayStr() ? today : null);
    const sameIds =
      today &&
      today.date === todayStr() &&
      Array.isArray(today.skipped) &&
      Array.isArray(today.extras) &&
      today.tasks.length === fresh.tasks.length &&
      today.tasks.every(
        (x, i) =>
          x.id === fresh.tasks[i].id &&
          x.done === fresh.tasks[i].done &&
          x.depth === fresh.tasks[i].depth
      );
    if (!sameIds) setToday(fresh);
  }, [rooms, taskLog, today, setToday]);

  // Live sync: worker's checkmarks flow into today via the share doc.
  useShareSync(lastShare, setToday);

  // Live sync: a linked home's definition mirrors across devices.
  useHouseSync({
    houseId,
    rooms,
    houseMap,
    contract,
    workerLang,
    owner,
    setRooms,
    setHouseMap,
    setContract,
    setWorkerLang,
    setOwner,
  });

  const finishVisit = () => {
    if (!today) return;
    const total = today.tasks.length;
    const doneTasks = today.tasks.filter((x) => x.done);
    setTaskLog({
      ...taskLog,
      ...Object.fromEntries(doneTasks.map((x) => [x.id, today.date])),
    });
    setHistory([
      ...history,
      {
        id: Date.now().toString(36),
        date: today.date,
        done: doneTasks.length,
        total,
        percent: total ? Math.round((doneTasks.length / total) * 100) : 0,
      },
    ]);
    setToday({ ...today, tasks: today.tasks.map((x) => ({ ...x, done: false })) });
  };

  const safeToday = today || { date: todayStr(), skipped: [], extras: [], tasks: [] };

  const needsReshare =
    lastShare?.date === todayStr() && taskFingerprint(safeToday.tasks) !== lastShare.fingerprint;

  const nextVisit = nextVisitDate(contract);
  const banner =
    nextVisit === todayStr() && lastShare?.date !== todayStr()
      ? { icon: "sparkles", message: t(lang, "visitTodayBanner") }
      : nextVisit === addDays(todayStr(), 1)
        ? { icon: "leaf", message: t(lang, "visitTomorrowBanner") }
        : needsReshare
          ? { icon: "refresh", message: t(lang, "tasksChanged") }
          : null;

  const showShareUi = tab === "home" || tab === "today";

  return (
    <>
      {tab === "home" && (
        <HomeScreen
          lang={lang}
          owner={owner}
          today={safeToday}
          rooms={rooms}
          setRooms={setRooms}
          houseMap={houseMap}
          history={history}
          onShare={() => setShareOpen(true)}
          onOpenMap={() => setTab("rooms")}
          nextVisit={nextVisit}
          homes={homes}
          activeHome={activeHome}
          onSwitchHome={onSwitchHome}
          onAddHome={onAddHome}
          onRenameHome={onRenameHome}
          onDeleteHome={onDeleteHome}
          onLinkHome={onLinkHome}
          onJoinHome={onJoinHome}
          onUnlinkHome={onUnlinkHome}
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
      {tab === "rooms" && (
        <RoomsScreen
          lang={lang}
          rooms={rooms}
          setRooms={setRooms}
          houseMap={houseMap}
          setHouseMap={setHouseMap}
        />
      )}
      {tab === "settings" && (
        <SettingsScreen
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          owner={owner}
          setOwner={setOwner}
          history={history}
          contract={contract}
          setContract={setContract}
          uiSize={uiSize}
          setUiSize={setUiSize}
          workerLang={workerLang}
          setWorkerLang={setWorkerLang}
        />
      )}

      {showShareUi && banner && (
        <ReshareBanner icon={banner.icon} message={banner.message} onShare={() => setShareOpen(true)} />
      )}

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
        houseMap={houseMap}
        workerLang={workerLang}
        lastShare={lastShare}
        onShared={setLastShare}
      />
    </>
  );
}
