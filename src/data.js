export const STORAGE_KEYS = {
  rooms: "rawaq_rooms",
  lang: "rawaq_lang",
  theme: "rawaq_theme",
  pin: "rawaq_pin",
  owner: "rawaq_owner",
  today: "rawaq_today",
  history: "rawaq_history",
};

export const DEFAULT_PIN = "1234";

const task = (id, ar, en, fil) => ({ id, name: { ar, en, fil }, done: false });

export const DEFAULT_ROOMS = [
  {
    id: "majlis",
    emoji: "🛋️",
    name: { ar: "المجلس", en: "Majlis", fil: "Sala" },
    photo: null,
    tasks: {
      surface: [
        task("mj-s1", "تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok"),
        task("mj-s2", "ترتيب الوسائد", "Arrange cushions", "Ayusin ang mga unan"),
        task("mj-s3", "كنس السجاد", "Vacuum carpet", "I-vacuum ang karpet"),
        task("mj-s4", "مسح الطاولات", "Wipe tables", "Punasan ang mga mesa"),
      ],
      deep: [
        task("mj-d1", "غسيل الستائر", "Wash curtains", "Labhan ang mga kurtina"),
        task("mj-d2", "تنظيف تحت الكنب", "Clean under sofas", "Linisin ang ilalim ng sofa"),
        task("mj-d3", "تنظيف النوافذ", "Clean windows", "Linisin ang mga bintana"),
      ],
    },
  },
  {
    id: "kitchen",
    emoji: "🍳",
    name: { ar: "المطبخ", en: "Kitchen", fil: "Kusina" },
    photo: null,
    tasks: {
      surface: [
        task("kt-s1", "غسيل الأطباق", "Wash dishes", "Hugasan ang mga pinggan"),
        task("kt-s2", "مسح الأسطح", "Wipe counters", "Punasan ang counter"),
        task("kt-s3", "كنس ومسح الأرضية", "Sweep & mop floor", "Walisin at lampasuhin ang sahig"),
        task("kt-s4", "إخراج القمامة", "Take out trash", "Ilabas ang basura"),
      ],
      deep: [
        task("kt-d1", "تنظيف الفرن", "Clean the oven", "Linisin ang oven"),
        task("kt-d2", "تنظيف الثلاجة", "Clean the fridge", "Linisin ang ref"),
        task("kt-d3", "ترتيب الدواليب", "Organize cabinets", "Ayusin ang mga kabinet"),
      ],
    },
  },
  {
    id: "bedroom",
    emoji: "🛏️",
    name: { ar: "غرفة النوم", en: "Bedroom", fil: "Kwarto" },
    photo: null,
    tasks: {
      surface: [
        task("bd-s1", "ترتيب السرير", "Make the bed", "Ayusin ang kama"),
        task("bd-s2", "تنفيض الغبار", "Dust surfaces", "Alisin ang alikabok"),
        task("bd-s3", "كنس الأرضية", "Vacuum the floor", "I-vacuum ang sahig"),
      ],
      deep: [
        task("bd-d1", "تغيير المفارش", "Change bed sheets", "Palitan ang kubrekama"),
        task("bd-d2", "ترتيب الدولاب", "Organize the closet", "Ayusin ang aparador"),
        task("bd-d3", "مسح المرايا", "Clean mirrors", "Linisin ang mga salamin"),
      ],
    },
  },
  {
    id: "bathroom",
    emoji: "🚿",
    name: { ar: "الحمام", en: "Bathroom", fil: "Banyo" },
    photo: null,
    tasks: {
      surface: [
        task("bt-s1", "تنظيف المرحاض", "Clean the toilet", "Linisin ang inidoro"),
        task("bt-s2", "مسح المغسلة", "Wipe the sink", "Punasan ang lababo"),
        task("bt-s3", "تغيير المناشف", "Change towels", "Palitan ang mga tuwalya"),
        task("bt-s4", "مسح الأرضية", "Mop the floor", "Lampasuhin ang sahig"),
      ],
      deep: [
        task("bt-d1", "فرك الدش والبانيو", "Scrub shower & tub", "Kuskusin ang shower at bathtub"),
        task("bt-d2", "إزالة الترسبات", "Remove limescale", "Alisin ang limescale"),
        task("bt-d3", "تنظيف فواصل البلاط", "Clean tile grout", "Linisin ang grout ng tiles"),
      ],
    },
  },
];

export const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

// Builds today's task list from rooms for the given mode, preserving done
// state of tasks that already exist in the previous list.
export const buildToday = (rooms, mode, prev) => {
  const prevDone = new Map((prev?.tasks || []).map((x) => [x.id, x.done]));
  const tasks = rooms.flatMap((room) =>
    room.tasks[mode].map((x) => ({
      id: x.id,
      roomId: room.id,
      name: x.name,
      done: prevDone.get(x.id) || false,
    }))
  );
  // Preserve manual ordering from prev where possible
  if (prev?.tasks?.length) {
    const order = new Map(prev.tasks.map((x, i) => [x.id, i]));
    tasks.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }
  return { date: todayStr(), mode, tasks };
};
