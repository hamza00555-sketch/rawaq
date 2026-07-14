export const STORAGE_KEYS = {
  rooms: "rawaq_rooms",
  lang: "rawaq_lang",
  theme: "rawaq_theme",
  owner: "rawaq_owner",
  today: "rawaq_today",
  history: "rawaq_history",
  lastShare: "rawaq_last_share",
  taskLog: "rawaq_task_log",
  contract: "rawaq_contract",
  uiSize: "rawaq_uisize",
  houseMap: "rawaq_housemap",
  workerLang: "rawaq_worker_lang",
};

export const ROOM_TYPES = ["kitchen", "bathroom", "bedroom", "living", "general"];

export const EMOJI_PRESETS = [
  "🛋️", "🍳", "🛏️", "🚿", "🧺", "🪟", "🚪", "🌿",
  "🧸", "📚", "🍽️", "☕", "🖥️", "👕", "🚗", "🏡",
  "🕌", "🎮", "🧼", "🪴", "🐈", "👶", "💼", "✨",
];

// Task shape: {id, name:{ar,en,fil,id}, freq: weekly|monthly, depth: surface|deep}
// A fresh app seeds rooms with NO tasks — mom adds them (library or custom).
const lib = (ar, en, fil, id) => ({ ar, en, fil, id });

// Ready-made task suggestions per room type — ar/en/fil/id (Indonesian).
export const TASK_LIBRARY = {
  kitchen: [
    lib("غسيل الأطباق", "Wash dishes", "Hugasan ang mga pinggan", "Cuci piring"),
    lib("مسح الأسطح", "Wipe counters", "Punasan ang counter", "Lap meja dapur"),
    lib("كنس ومسح الأرضية", "Sweep & mop floor", "Walisin at lampasuhin ang sahig", "Sapu dan pel lantai"),
    lib("إخراج القمامة", "Take out trash", "Ilabas ang basura", "Buang sampah"),
    lib("تنظيف الموقد", "Clean the stove", "Linisin ang kalan", "Bersihkan kompor"),
    lib("تنظيف الميكرويف", "Clean the microwave", "Linisin ang microwave", "Bersihkan microwave"),
    lib("تنظيف الفرن", "Clean the oven", "Linisin ang oven", "Bersihkan oven"),
    lib("تنظيف الثلاجة", "Clean the fridge", "Linisin ang ref", "Bersihkan kulkas"),
    lib("ترتيب الدواليب", "Organize cabinets", "Ayusin ang mga kabinet", "Rapikan kabinet"),
    lib("تلميع الحوض", "Polish the sink", "Pakintabin ang lababo", "Kilapkan wastafel"),
    lib("ترتيب المؤن", "Organize the pantry", "Ayusin ang paminggalan", "Rapikan stok dapur"),
    lib("مسح واجهات الأجهزة", "Wipe appliance fronts", "Punasan ang mga appliances", "Lap permukaan alat dapur"),
    lib("تنظيف شفاط المطبخ", "Clean the range hood", "Linisin ang range hood", "Bersihkan penghisap asap"),
    lib("مسح الجدران والبلاط", "Wipe walls & tiles", "Punasan ang dingding at tiles", "Lap dinding dan ubin"),
    lib("تنظيف غسالة الصحون", "Clean the dishwasher", "Linisin ang dishwasher", "Bersihkan mesin cuci piring"),
  ],
  bathroom: [
    lib("تنظيف المرحاض", "Clean the toilet", "Linisin ang inidoro", "Bersihkan toilet"),
    lib("مسح المغسلة", "Wipe the sink", "Punasan ang lababo", "Lap wastafel"),
    lib("تغيير المناشف", "Change towels", "Palitan ang mga tuwalya", "Ganti handuk"),
    lib("مسح الأرضية", "Mop the floor", "Lampasuhin ang sahig", "Pel lantai"),
    lib("فرك الدش والبانيو", "Scrub shower & tub", "Kuskusin ang shower at bathtub", "Gosok shower dan bathtub"),
    lib("إزالة الترسبات", "Remove limescale", "Alisin ang limescale", "Hilangkan kerak air"),
    lib("تنظيف فواصل البلاط", "Clean tile grout", "Linisin ang grout", "Bersihkan nat ubin"),
    lib("تلميع المرايا", "Polish mirrors", "Pakintabin ang salamin", "Kilapkan cermin"),
    lib("تعبئة الصابون والشامبو", "Refill soap & shampoo", "Lagyan muli ng sabon at shampoo", "Isi ulang sabun dan sampo"),
    lib("غسل سجادة الحمام", "Wash the bath mat", "Labhan ang bath mat", "Cuci keset kamar mandi"),
    lib("تفريغ سلة المهملات", "Empty the trash bin", "Alisan ng laman ang basurahan", "Kosongkan tempat sampah"),
    lib("مسح مقابض الأبواب", "Wipe door handles", "Punasan ang mga hawakan ng pinto", "Lap gagang pintu"),
    lib("تنظيف فتحات التهوية", "Clean air vents", "Linisin ang bentilasyon", "Bersihkan ventilasi"),
    lib("غسل ستارة الحمام", "Wash shower curtain", "Labhan ang shower curtain", "Cuci tirai shower"),
    lib("ترتيب الأدراج", "Organize drawers", "Ayusin ang mga drawer", "Rapikan laci"),
  ],
  bedroom: [
    lib("ترتيب السرير", "Make the bed", "Ayusin ang kama", "Rapikan tempat tidur"),
    lib("تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok", "Bersihkan debu"),
    lib("كنس الأرضية", "Vacuum the floor", "I-vacuum ang sahig", "Vakum lantai"),
    lib("تغيير المفارش", "Change bed sheets", "Palitan ang kubrekama", "Ganti seprai"),
    lib("ترتيب الدولاب", "Organize the closet", "Ayusin ang aparador", "Rapikan lemari"),
    lib("مسح المرايا", "Clean mirrors", "Linisin ang salamin", "Bersihkan cermin"),
    lib("ترتيب الطاولة الجانبية", "Tidy the nightstand", "Ayusin ang bedside table", "Rapikan meja samping"),
    lib("تهوية الغرفة", "Air out the room", "Pahanginan ang kwarto", "Angin-anginkan kamar"),
    lib("تنفيض الوسائد", "Fluff the pillows", "Buhaghagin ang mga unan", "Gemburkan bantal"),
    lib("كنس تحت السرير", "Vacuum under the bed", "I-vacuum ang ilalim ng kama", "Vakum bawah tempat tidur"),
    lib("مسح النوافذ", "Clean the windows", "Linisin ang bintana", "Bersihkan jendela"),
    lib("تلميع الأثاث", "Polish the furniture", "Pakintabin ang muwebles", "Kilapkan furnitur"),
    lib("طي وترتيب الملابس", "Fold & organize clothes", "Itiklop at ayusin ang damit", "Lipat dan rapikan pakaian"),
    lib("تنظيف فلتر المكيف", "Clean the AC filter", "Linisin ang filter ng aircon", "Bersihkan filter AC"),
    lib("تنظيم الأدراج", "Organize drawers", "Ayusin ang mga drawer", "Rapikan laci"),
  ],
  living: [
    lib("تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok", "Bersihkan debu"),
    lib("ترتيب الوسائد", "Arrange cushions", "Ayusin ang mga unan", "Rapikan bantal sofa"),
    lib("كنس السجاد", "Vacuum carpet", "I-vacuum ang karpet", "Vakum karpet"),
    lib("مسح الطاولات", "Wipe tables", "Punasan ang mga mesa", "Lap meja"),
    lib("كنس ومسح الأرضية", "Sweep & mop floor", "Walisin at lampasuhin ang sahig", "Sapu dan pel lantai"),
    lib("غسيل الستائر", "Wash curtains", "Labhan ang mga kurtina", "Cuci gorden"),
    lib("تنظيف تحت الكنب", "Clean under sofas", "Linisin ang ilalim ng sofa", "Bersihkan bawah sofa"),
    lib("تنظيف النوافذ", "Clean windows", "Linisin ang mga bintana", "Bersihkan jendela"),
    lib("تلميع الأثاث", "Polish furniture", "Pakintabin ang muwebles", "Kilapkan furnitur"),
    lib("مسح شاشة التلفاز", "Wipe the TV screen", "Punasan ang TV screen", "Lap layar TV"),
    lib("ترتيب الرفوف", "Tidy the shelves", "Ayusin ang mga istante", "Rapikan rak"),
    lib("تنظيف الإضاءة والثريا", "Clean lights & chandelier", "Linisin ang mga ilaw", "Bersihkan lampu dan lampu gantung"),
    lib("مسح مقابض الأبواب", "Wipe door handles", "Punasan ang mga hawakan ng pinto", "Lap gagang pintu"),
    lib("تعطير المجلس", "Freshen up the room", "Pabanguhin ang sala", "Harumkan ruangan"),
    lib("ترتيب أحذية المدخل", "Tidy entryway shoes", "Ayusin ang sapatos sa pasukan", "Rapikan sepatu di pintu masuk"),
  ],
  general: [
    lib("تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok", "Bersihkan debu"),
    lib("كنس الأرضية", "Sweep the floor", "Walisin ang sahig", "Sapu lantai"),
    lib("مسح الأرضية", "Mop the floor", "Lampasuhin ang sahig", "Pel lantai"),
    lib("تنظيف النوافذ", "Clean windows", "Linisin ang mga bintana", "Bersihkan jendela"),
    lib("مسح الأبواب والمقابض", "Wipe doors & handles", "Punasan ang pinto at hawakan", "Lap pintu dan gagang"),
    lib("إخراج القمامة", "Take out trash", "Ilabas ang basura", "Buang sampah"),
    lib("ترتيب عام", "General tidying", "Pangkalahatang pag-aayos", "Beres-beres umum"),
    lib("تنظيف المرايا", "Clean mirrors", "Linisin ang salamin", "Bersihkan cermin"),
    lib("مسح الجدران", "Wipe the walls", "Punasan ang dingding", "Lap dinding"),
    lib("تنظيف فتحات التهوية", "Clean air vents", "Linisin ang bentilasyon", "Bersihkan ventilasi"),
    lib("تلميع الأثاث", "Polish furniture", "Pakintabin ang muwebles", "Kilapkan furnitur"),
    lib("غسل السجاد", "Wash the rugs", "Labhan ang mga alpombra", "Cuci karpet"),
    lib("تعطير المكان", "Freshen the space", "Pabanguhin ang lugar", "Harumkan ruangan"),
    lib("ترتيب الأدراج", "Organize drawers", "Ayusin ang mga drawer", "Rapikan laci"),
    lib("تنظيف الإضاءة", "Clean the lights", "Linisin ang mga ilaw", "Bersihkan lampu"),
  ],
  hall: [
    lib("كنس ومسح الأرضية", "Sweep & mop floor", "Walisin at lampasuhin ang sahig", "Sapu dan pel lantai"),
    lib("تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok", "Bersihkan debu"),
    lib("تنظيف الأبواب والمقابض", "Clean doors & handles", "Linisin ang pinto at hawakan", "Bersihkan pintu dan gagang"),
    lib("تلميع المرايا", "Polish mirrors", "Pakintabin ang salamin", "Kilapkan cermin"),
    lib("ترتيب خزانة الأحذية", "Tidy the shoe rack", "Ayusin ang lalagyan ng sapatos", "Rapikan rak sepatu"),
    lib("كنس السجاد الممتد", "Vacuum the runner rug", "I-vacuum ang mahabang karpet", "Vakum karpet lorong"),
    lib("مسح الجدران", "Wipe the walls", "Punasan ang dingding", "Lap dinding"),
    lib("تنظيف الإضاءة", "Clean the lights", "Linisin ang mga ilaw", "Bersihkan lampu"),
    lib("إزالة خيوط العنكبوت", "Remove cobwebs", "Alisin ang mga sapot", "Hilangkan sarang laba-laba"),
    lib("تنظيف الدرج", "Clean the stairs", "Linisin ang hagdan", "Bersihkan tangga"),
    lib("ترتيب طاولة المدخل", "Tidy the console table", "Ayusin ang console table", "Rapikan meja lorong"),
    lib("تنظيف مفاتيح الإضاءة", "Wipe light switches", "Punasan ang mga switch", "Lap sakelar lampu"),
  ],
};

// Hallways are rooms with type "hall": they have their own tasks, live in
// the rooms array (so today/share/sync plumbing is unchanged), but appear
// under a separate section in the app and carry a reserved id prefix.
export const HALL_EMOJI = "🚪";
export const HALL_NAME = { ar: "ممر", en: "Hallway", fil: "Pasilyo", id: "Lorong" };
export const makeHall = (id) => ({
  id,
  emoji: HALL_EMOJI,
  type: "hall",
  name: { ...HALL_NAME },
  photo: null,
  tasks: [],
});
export const isHallRoom = (room) => room?.type === "hall";

export const DEFAULT_ROOMS = [
  {
    id: "majlis",
    emoji: "🛋️",
    type: "living",
    name: { ar: "المجلس", en: "Majlis", fil: "Sala", id: "Ruang tamu" },
    photo: null,
    tasks: [],
  },
  {
    id: "kitchen",
    emoji: "🍳",
    type: "kitchen",
    name: { ar: "المطبخ", en: "Kitchen", fil: "Kusina", id: "Dapur" },
    photo: null,
    tasks: [],
  },
  {
    id: "bedroom",
    emoji: "🛏️",
    type: "bedroom",
    name: { ar: "غرفة النوم", en: "Bedroom", fil: "Kwarto", id: "Kamar tidur" },
    photo: null,
    tasks: [],
  },
  {
    id: "bathroom",
    emoji: "🚿",
    type: "bathroom",
    name: { ar: "الحمام", en: "Bathroom", fil: "Banyo", id: "Kamar mandi" },
    photo: null,
    tasks: [],
  },
];

// Rooms stored before the `type` field existed get one by known id, and
// the old {surface, deep} task shape flattens to freq+depth per task.
const LEGACY_TYPE = { majlis: "living", kitchen: "kitchen", bedroom: "bedroom", bathroom: "bathroom" };
const flatTask = (x, depth) => ({
  id: x.id,
  name: x.name,
  freq: x.freq || (depth === "deep" ? "monthly" : "weekly"),
  depth: x.depth || depth,
});
export const migrateRooms = (rooms) =>
  (rooms || []).map((r) => {
    let room = r.type ? r : { ...r, type: LEGACY_TYPE[r.id] || "general" };
    // Rooms stored before Indonesian existed: default rooms get their id
    // name back-filled; custom names heal via the edit sheet / save path.
    if (!room.name.id) {
      const def = DEFAULT_ROOMS.find((d) => d.id === room.id && d.name.ar === room.name.ar);
      if (def) room = { ...room, name: { ...room.name, id: def.name.id } };
    }
    if (Array.isArray(room.tasks)) return room;
    return {
      ...room,
      tasks: [
        ...(room.tasks?.surface || []).map((x) => flatTask(x, "surface")),
        ...(room.tasks?.deep || []).map((x) => flatTask(x, "deep")),
      ],
    };
  });

export const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

// ---- local-time date helpers (consistent with todayStr/formatDate) ----
export const parseISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
// Saudi week starts on Sunday; getDay() is 0 on Sunday.
export const weekStart = (iso) => addDays(iso, -parseISO(iso).getDay());

// A task is due when it hasn't been completed in its current period.
export const isDue = (task, lastDone, date) => {
  if (!lastDone) return true;
  if (task.freq === "monthly") return lastDone.slice(0, 7) !== date.slice(0, 7);
  return lastDone < weekStart(date);
};

// ---- worker contract: {visitDays: [0=Sun..6=Sat], startDate, months} ----
export const contractEnd = (c) => {
  if (!c?.startDate || !c?.months) return null;
  const [y, m, d] = c.startDate.split("-").map(Number);
  const end = new Date(y, m - 1 + c.months, d);
  if (end.getDate() !== d) end.setDate(0); // clamp Jan 31 + 1mo → Feb 28
  end.setDate(end.getDate() - 1); // inclusive end
  return toISO(end);
};

export const nextVisitDate = (c, from = todayStr()) => {
  const end = contractEnd(c);
  if (!end || !c.visitDays?.length) return null;
  for (let d = from > c.startDate ? from : c.startDate; d <= end; d = addDays(d, 1)) {
    if (c.visitDays.includes(parseISO(d).getDay())) return d;
  }
  return null;
};

export const remainingVisits = (c, from = todayStr()) => {
  const end = contractEnd(c);
  if (!end || !c.visitDays?.length) return 0;
  let count = 0;
  for (let d = from > c.startDate ? from : c.startDate; d <= end; d = addDays(d, 1)) {
    if (c.visitDays.includes(parseISO(d).getDay())) count++;
  }
  return count;
};

export const isContractExpired = (c, from = todayStr()) => {
  const end = contractEnd(c);
  return !!end && end < from;
};

// «الثلاثاء ٧ يوليو» — Arabic needs an explicit Gregorian calendar (plain
// "ar" defaults to Umm al-Qura). Parse Y-M-D locally to avoid TZ shifts.
export const formatDate = (lang, iso) => {
  const [y, m, d] = (iso || todayStr()).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = lang === "ar" ? "ar-u-ca-gregory" : lang === "fil" ? "fil" : lang === "id" ? "id" : "en-GB";
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(date);
  } catch {
    return iso;
  }
};

// Builds today's list: tasks that are DUE (per freq + completion log),
// minus skipped ids, plus mom's ad-hoc extras. Done state and manual
// order carry over from prev.
export const buildToday = (rooms, taskLog, prev) => {
  const skipped = prev?.skipped || [];
  const extras = prev?.extras || [];
  const prevDone = new Map((prev?.tasks || []).map((x) => [x.id, x.done]));
  const skip = new Set(skipped);
  const date = todayStr();
  const log = taskLog || {};
  const tasks = rooms
    .flatMap((room) =>
      room.tasks
        .filter((x) => isDue(x, log[x.id], date))
        .map((x) => ({
          id: x.id,
          roomId: room.id,
          name: x.name,
          freq: x.freq,
          depth: x.depth,
          done: prevDone.get(x.id) || false,
        }))
    )
    .filter((x) => !skip.has(x.id));
  tasks.push(...extras.map((x) => ({ ...x, done: prevDone.get(x.id) || false })));
  if (prev?.tasks?.length) {
    const order = new Map(prev.tasks.map((x, i) => [x.id, i]));
    tasks.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }
  return { date, skipped, extras, tasks };
};

// Sorted so reordering alone doesn't count as a change (re-share nudge).
export const taskFingerprint = (tasks) =>
  tasks.map((t) => `${t.id}:${t.name.ar}`).sort().join("|");
