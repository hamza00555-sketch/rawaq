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
};

export const ROOM_TYPES = ["kitchen", "bathroom", "bedroom", "living", "general"];

export const EMOJI_PRESETS = [
  "🛋️", "🍳", "🛏️", "🚿", "🧺", "🪟", "🚪", "🌿",
  "🧸", "📚", "🍽️", "☕", "🖥️", "👕", "🚗", "🏡",
  "🕌", "🎮", "🧼", "🪴", "🐈", "👶", "💼", "✨",
];

// freq: weekly (due each week) | monthly (due once a calendar month)
// depth: surface | deep — an informational tag, independent of freq
const task = (id, freq, depth, ar, en, fil) => ({ id, name: { ar, en, fil }, freq, depth });
const lib = (ar, en, fil) => ({ ar, en, fil });

// Ready-made task suggestions per room type, trilingual.
export const TASK_LIBRARY = {
  kitchen: [
    lib("غسيل الأطباق", "Wash dishes", "Hugasan ang mga pinggan"),
    lib("مسح الأسطح", "Wipe counters", "Punasan ang counter"),
    lib("كنس ومسح الأرضية", "Sweep & mop floor", "Walisin at lampasuhin ang sahig"),
    lib("إخراج القمامة", "Take out trash", "Ilabas ang basura"),
    lib("تنظيف الموقد", "Clean the stove", "Linisin ang kalan"),
    lib("تنظيف الميكرويف", "Clean the microwave", "Linisin ang microwave"),
    lib("تنظيف الفرن", "Clean the oven", "Linisin ang oven"),
    lib("تنظيف الثلاجة", "Clean the fridge", "Linisin ang ref"),
    lib("ترتيب الدواليب", "Organize cabinets", "Ayusin ang mga kabinet"),
    lib("تلميع الحوض", "Polish the sink", "Pakintabin ang lababo"),
    lib("ترتيب المؤن", "Organize the pantry", "Ayusin ang paminggalan"),
    lib("مسح واجهات الأجهزة", "Wipe appliance fronts", "Punasan ang mga appliances"),
    lib("تنظيف شفاط المطبخ", "Clean the range hood", "Linisin ang range hood"),
    lib("مسح الجدران والبلاط", "Wipe walls & tiles", "Punasan ang dingding at tiles"),
    lib("تنظيف غسالة الصحون", "Clean the dishwasher", "Linisin ang dishwasher"),
  ],
  bathroom: [
    lib("تنظيف المرحاض", "Clean the toilet", "Linisin ang inidoro"),
    lib("مسح المغسلة", "Wipe the sink", "Punasan ang lababo"),
    lib("تغيير المناشف", "Change towels", "Palitan ang mga tuwalya"),
    lib("مسح الأرضية", "Mop the floor", "Lampasuhin ang sahig"),
    lib("فرك الدش والبانيو", "Scrub shower & tub", "Kuskusin ang shower at bathtub"),
    lib("إزالة الترسبات", "Remove limescale", "Alisin ang limescale"),
    lib("تنظيف فواصل البلاط", "Clean tile grout", "Linisin ang grout"),
    lib("تلميع المرايا", "Polish mirrors", "Pakintabin ang salamin"),
    lib("تعبئة الصابون والشامبو", "Refill soap & shampoo", "Lagyan muli ng sabon at shampoo"),
    lib("غسل سجادة الحمام", "Wash the bath mat", "Labhan ang bath mat"),
    lib("تفريغ سلة المهملات", "Empty the trash bin", "Alisan ng laman ang basurahan"),
    lib("مسح مقابض الأبواب", "Wipe door handles", "Punasan ang mga hawakan ng pinto"),
    lib("تنظيف فتحات التهوية", "Clean air vents", "Linisin ang bentilasyon"),
    lib("غسل ستارة الحمام", "Wash shower curtain", "Labhan ang shower curtain"),
    lib("ترتيب الأدراج", "Organize drawers", "Ayusin ang mga drawer"),
  ],
  bedroom: [
    lib("ترتيب السرير", "Make the bed", "Ayusin ang kama"),
    lib("تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok"),
    lib("كنس الأرضية", "Vacuum the floor", "I-vacuum ang sahig"),
    lib("تغيير المفارش", "Change bed sheets", "Palitan ang kubrekama"),
    lib("ترتيب الدولاب", "Organize the closet", "Ayusin ang aparador"),
    lib("مسح المرايا", "Clean mirrors", "Linisin ang salamin"),
    lib("ترتيب الطاولة الجانبية", "Tidy the nightstand", "Ayusin ang bedside table"),
    lib("تهوية الغرفة", "Air out the room", "Pahanginan ang kwarto"),
    lib("تنفيض الوسائد", "Fluff the pillows", "Buhaghagin ang mga unan"),
    lib("كنس تحت السرير", "Vacuum under the bed", "I-vacuum ang ilalim ng kama"),
    lib("مسح النوافذ", "Clean the windows", "Linisin ang bintana"),
    lib("تلميع الأثاث", "Polish the furniture", "Pakintabin ang muwebles"),
    lib("طي وترتيب الملابس", "Fold & organize clothes", "Itiklop at ayusin ang damit"),
    lib("تنظيف فلتر المكيف", "Clean the AC filter", "Linisin ang filter ng aircon"),
    lib("تنظيم الأدراج", "Organize drawers", "Ayusin ang mga drawer"),
  ],
  living: [
    lib("تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok"),
    lib("ترتيب الوسائد", "Arrange cushions", "Ayusin ang mga unan"),
    lib("كنس السجاد", "Vacuum carpet", "I-vacuum ang karpet"),
    lib("مسح الطاولات", "Wipe tables", "Punasan ang mga mesa"),
    lib("كنس ومسح الأرضية", "Sweep & mop floor", "Walisin at lampasuhin ang sahig"),
    lib("غسيل الستائر", "Wash curtains", "Labhan ang mga kurtina"),
    lib("تنظيف تحت الكنب", "Clean under sofas", "Linisin ang ilalim ng sofa"),
    lib("تنظيف النوافذ", "Clean windows", "Linisin ang mga bintana"),
    lib("تلميع الأثاث", "Polish furniture", "Pakintabin ang muwebles"),
    lib("مسح شاشة التلفاز", "Wipe the TV screen", "Punasan ang TV screen"),
    lib("ترتيب الرفوف", "Tidy the shelves", "Ayusin ang mga istante"),
    lib("تنظيف الإضاءة والثريا", "Clean lights & chandelier", "Linisin ang mga ilaw"),
    lib("مسح مقابض الأبواب", "Wipe door handles", "Punasan ang mga hawakan ng pinto"),
    lib("تعطير المجلس", "Freshen up the room", "Pabanguhin ang sala"),
    lib("ترتيب أحذية المدخل", "Tidy entryway shoes", "Ayusin ang sapatos sa pasukan"),
  ],
  general: [
    lib("تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok"),
    lib("كنس الأرضية", "Sweep the floor", "Walisin ang sahig"),
    lib("مسح الأرضية", "Mop the floor", "Lampasuhin ang sahig"),
    lib("تنظيف النوافذ", "Clean windows", "Linisin ang mga bintana"),
    lib("مسح الأبواب والمقابض", "Wipe doors & handles", "Punasan ang pinto at hawakan"),
    lib("إخراج القمامة", "Take out trash", "Ilabas ang basura"),
    lib("ترتيب عام", "General tidying", "Pangkalahatang pag-aayos"),
    lib("تنظيف المرايا", "Clean mirrors", "Linisin ang salamin"),
    lib("مسح الجدران", "Wipe the walls", "Punasan ang dingding"),
    lib("تنظيف فتحات التهوية", "Clean air vents", "Linisin ang bentilasyon"),
    lib("تلميع الأثاث", "Polish furniture", "Pakintabin ang muwebles"),
    lib("غسل السجاد", "Wash the rugs", "Labhan ang mga alpombra"),
    lib("تعطير المكان", "Freshen the space", "Pabanguhin ang lugar"),
    lib("ترتيب الأدراج", "Organize drawers", "Ayusin ang mga drawer"),
    lib("تنظيف الإضاءة", "Clean the lights", "Linisin ang mga ilaw"),
  ],
};

export const DEFAULT_ROOMS = [
  {
    id: "majlis",
    emoji: "🛋️",
    type: "living",
    name: { ar: "المجلس", en: "Majlis", fil: "Sala" },
    photo: null,
    tasks: [
      task("mj-s1", "weekly", "surface", "تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok"),
      task("mj-s2", "weekly", "surface", "ترتيب الوسائد", "Arrange cushions", "Ayusin ang mga unan"),
      task("mj-s3", "weekly", "surface", "كنس السجاد", "Vacuum carpet", "I-vacuum ang karpet"),
      task("mj-s4", "weekly", "surface", "مسح الطاولات", "Wipe tables", "Punasan ang mga mesa"),
      task("mj-d1", "monthly", "deep", "غسيل الستائر", "Wash curtains", "Labhan ang mga kurtina"),
      task("mj-d2", "monthly", "deep", "تنظيف تحت الكنب", "Clean under sofas", "Linisin ang ilalim ng sofa"),
      task("mj-d3", "monthly", "deep", "تنظيف النوافذ", "Clean windows", "Linisin ang mga bintana"),
    ],
  },
  {
    id: "kitchen",
    emoji: "🍳",
    type: "kitchen",
    name: { ar: "المطبخ", en: "Kitchen", fil: "Kusina" },
    photo: null,
    tasks: [
      task("kt-s1", "weekly", "surface", "غسيل الأطباق", "Wash dishes", "Hugasan ang mga pinggan"),
      task("kt-s2", "weekly", "surface", "مسح الأسطح", "Wipe counters", "Punasan ang counter"),
      task("kt-s3", "weekly", "surface", "كنس ومسح الأرضية", "Sweep & mop floor", "Walisin at lampasuhin ang sahig"),
      task("kt-s4", "weekly", "surface", "إخراج القمامة", "Take out trash", "Ilabas ang basura"),
      task("kt-d1", "monthly", "deep", "تنظيف الفرن", "Clean the oven", "Linisin ang oven"),
      task("kt-d2", "monthly", "deep", "تنظيف الثلاجة", "Clean the fridge", "Linisin ang ref"),
      task("kt-d3", "monthly", "deep", "ترتيب الدواليب", "Organize cabinets", "Ayusin ang mga kabinet"),
    ],
  },
  {
    id: "bedroom",
    emoji: "🛏️",
    type: "bedroom",
    name: { ar: "غرفة النوم", en: "Bedroom", fil: "Kwarto" },
    photo: null,
    tasks: [
      task("bd-s1", "weekly", "surface", "ترتيب السرير", "Make the bed", "Ayusin ang kama"),
      task("bd-s2", "weekly", "surface", "تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok"),
      task("bd-s3", "weekly", "surface", "كنس الأرضية", "Vacuum the floor", "I-vacuum ang sahig"),
      task("bd-d1", "monthly", "deep", "تغيير المفارش", "Change bed sheets", "Palitan ang kubrekama"),
      task("bd-d2", "monthly", "deep", "ترتيب الدولاب", "Organize the closet", "Ayusin ang aparador"),
      task("bd-d3", "monthly", "deep", "مسح المرايا", "Clean mirrors", "Linisin ang mga salamin"),
    ],
  },
  {
    id: "bathroom",
    emoji: "🚿",
    type: "bathroom",
    name: { ar: "الحمام", en: "Bathroom", fil: "Banyo" },
    photo: null,
    tasks: [
      task("bt-s1", "weekly", "surface", "تنظيف المرحاض", "Clean the toilet", "Linisin ang inidoro"),
      task("bt-s2", "weekly", "surface", "مسح المغسلة", "Wipe the sink", "Punasan ang lababo"),
      task("bt-s3", "weekly", "surface", "تغيير المناشف", "Change towels", "Palitan ang mga tuwalya"),
      task("bt-s4", "weekly", "surface", "مسح الأرضية", "Mop the floor", "Lampasuhin ang sahig"),
      task("bt-d1", "monthly", "deep", "فرك الدش والبانيو", "Scrub shower & tub", "Kuskusin ang shower at bathtub"),
      task("bt-d2", "monthly", "deep", "إزالة الترسبات", "Remove limescale", "Alisin ang limescale"),
      task("bt-d3", "monthly", "deep", "تنظيف فواصل البلاط", "Clean tile grout", "Linisin ang grout ng tiles"),
    ],
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
    const room = r.type ? r : { ...r, type: LEGACY_TYPE[r.id] || "general" };
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
  const locale = lang === "ar" ? "ar-u-ca-gregory" : lang === "fil" ? "fil" : "en-GB";
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
