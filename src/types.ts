export interface Verse {
  numberInSurah: number;
  text: string;
  translation: string;
  tafsir: string;
  juz: number;
  page: number;
  audio: string;
}

export interface SurahDetails {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  verses: Verse[];
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  verseText: string;
  addedAt: string;
  note?: string;
}

export type ReciterCategory = 'all' | 'haramain' | 'tajweed' | 'riwayat' | 'murattal';

export interface Reciter {
  id: string;
  name: string;
  subtext: string;
  identifier: string;
  category: 'haramain' | 'tajweed' | 'riwayat' | 'murattal';
  riwayah: string;
  isFamous?: boolean;
}

export const recitersList: Reciter[] = [
  // 1. قراء الحرمين الشريفين (Haramain)
  {
    id: "almuaiqly",
    name: "ماهر المعيقلي",
    subtext: "إمام وخطيب المسجد الحرام بمكة المكرمة",
    identifier: "Maher_AlMuaiqly_64kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "sudais",
    name: "عبد الرحمن السديس",
    subtext: "إمام وخطيب المسجد الحرام ورئيس الشؤون الدينية",
    identifier: "Abdurrahmaan_As-Sudais_192kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "dussary",
    name: "ياسر الدوسري",
    subtext: "إمام وخطيب المسجد الحرام، نبرة شجية مؤثرة",
    identifier: "Yasser_Ad-Dussary_128kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "shuraim",
    name: "سعود الشريم",
    subtext: "إمام المسجد الحرام الأسبق، تلاوة ناصعة سريعة",
    identifier: "Saood_ash-Shuraym_64kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "aljuhany",
    name: "عبد الله عواد الجهني",
    subtext: "إمام المسجد الحرام، صوت عذب متدفق وخاشع",
    identifier: "Abdullaah_3awwaad_Al-Juhaynee_128kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "alijaber",
    name: "علي جابر",
    subtext: "إمام المسجد الحرام الأسبق رحمه الله، ترتيل تاريخي فريد",
    identifier: "Ali_Jaber_64kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "ayyoub",
    name: "محمد أيوب",
    subtext: "إمام المسجد النبوي الشريف بالمدينة المنورة رحمه الله",
    identifier: "Muhammad_Ayyoub_128kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "hudhaify",
    name: "علي بن عبد الرحمن الحذيفي",
    subtext: "شيخ عموم مقارئ المدينة المنورة وإمام المسجد النبوي",
    identifier: "Hudhaify_64kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "budair",
    name: "صلاح البدير",
    subtext: "إمام وخطيب المسجد النبوي الشريف",
    identifier: "Salah_Al_Budair_128kbps",
    category: "haramain",
    riwayah: "حفص عن عاصم"
  },

  // 2. قراء التجويد والمجود (Tajweed)
  {
    id: "abdulbasit",
    name: "عبد الباسط عبد الصمد (مجود)",
    subtext: "صوت مكة، قمة الإتقان والأداء الخالد",
    identifier: "Abdul_Basit_Mujawwad_128kbps",
    category: "tajweed",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "minshawi",
    name: "محمد صديق المنشاوي (مجود)",
    subtext: "الصوت الباكي الخاشع، رائد مدرسة التجويد والتدبر",
    identifier: "Minshawy_Mujawwad_64kbps",
    category: "tajweed",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "husary_mujawwad",
    name: "محمود خليل الحصري (مجود)",
    subtext: "شيخ المقارئ المصرية، مرجع الأحكام ومخارج الحروف",
    identifier: "Husary_Mujawwad_64kbps",
    category: "tajweed",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "mustafa_ismail",
    name: "مصطفى إسماعيل (مجود)",
    subtext: "عبقري التلاوة والوقف، هندسة صوتية قرآنية مذهلة",
    identifier: "Mustafa_Ismail_48kbps",
    category: "tajweed",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "tablaway",
    name: "محمد محمود الطبلاوي (مجود)",
    subtext: "نقيب القراء، نبرة رصينة وأداء مصري أصيل",
    identifier: "Mohammad_al_Tablaway_64kbps",
    category: "tajweed",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "neana",
    name: "أحمد نعينع (مجود)",
    subtext: "تلميذ مدرسة مصطفى إسماعيل، إتقان المقامات والأحكام",
    identifier: "Ahmed_Neana_128kbps",
    category: "tajweed",
    riwayah: "حفص عن عاصم"
  },

  // 3. قراء الروايات (Riwayat)
  {
    id: "abdulbasit_warsh",
    name: "عبد الباسط عبد الصمد (ورش)",
    subtext: "رواية ورش عن نافع من طريق الأزرق، أداء شاهق",
    identifier: "warsh/warsh_Abdul_Basit_128kbps",
    category: "riwayat",
    riwayah: "ورش عن نافع",
    isFamous: true
  },
  {
    id: "yassin_jazaery_warsh",
    name: "ياسين الجزائري (ورش)",
    subtext: "رواية ورش عن نافع، تلاوة مغاربية ناصعة ومحكمة",
    identifier: "warsh/warsh_yassin_al_jazaery_64kbps",
    category: "riwayat",
    riwayah: "ورش عن نافع",
    isFamous: true
  },
  {
    id: "ibrahim_dosary_warsh",
    name: "إبراهيم الدوسري (ورش)",
    subtext: "رواية ورش عن نافع، ضبط تام وإيقاع ترتيلي متزن",
    identifier: "warsh/warsh_ibrahim_aldosary_128kbps",
    category: "riwayat",
    riwayah: "ورش عن نافع"
  },

  // 4. قراء الترتيل والترتيل الخاشع (Murattal)
  {
    id: "alafasy",
    name: "مشاري راشد العفاسي",
    subtext: "ترتيل عذب ونقي، صوت الملايين حول العالم",
    identifier: "Alafasy_64kbps",
    category: "murattal",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "ghamadi",
    name: "سعد الغامدي",
    subtext: "تلاوة هادئة خاشعة، سكينة ووقار",
    identifier: "Ghamadi_40kbps",
    category: "murattal",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "shaatree",
    name: "أبو بكر الشاطري",
    subtext: "ترتيل شجي دافئ بنبرة حجازية أصيلة",
    identifier: "Abu_Bakr_Ash-Shaatree_128kbps",
    category: "murattal",
    riwayah: "حفص عن عاصم",
    isFamous: true
  },
  {
    id: "rifai",
    name: "هاني الرفاعي",
    subtext: "تلاوة باثقة تخشع لها القلوب وتفيض بالأحاسيس",
    identifier: "Hani_Rifai_192kbps",
    category: "murattal",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "qatami",
    name: "ناصر القطامي",
    subtext: "ترتيل ندي يجمع بين الخشوع والجمال",
    identifier: "Nasser_Alqatami_128kbps",
    category: "murattal",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "abbad",
    name: "فارس عباد",
    subtext: "نبرة يمنية ندية، طمأنينة وراحة نفسية",
    identifier: "Fares_Abbad_64kbps",
    category: "murattal",
    riwayah: "حفص عن عاصم"
  },
  {
    id: "jibreel",
    name: "محمد جبريل",
    subtext: "ترتيل متقن ووقور، مدرسة التراويح بجامع عمرو بن العاص",
    identifier: "Muhammad_Jibreel_64kbps",
    category: "murattal",
    riwayah: "حفص عن عاصم"
  }
];

export interface TasbeehState {
  totalCount: number;
  todayCount: number;
  currentCycle: number;
  selectedTasbeehIndex: number;
}

export interface GlobalSettings {
  fontScale: 'normal' | 'large' | 'extra-large';
  simpleFont: boolean;
  dyslexiaSpacing: boolean;
  reducedMotion: boolean;
  highlightActive: boolean;
  voiceHints: boolean;
  trueNightMode: boolean;
  language: 'ar' | 'en';
  reminderEnabled: boolean;
  reminderTime: string;
  autoPlayNextVerse: boolean;
  autoShowTafsir: boolean;
  dailyTargetPages: number;
  autoScrollSelected: boolean;
  lockNavigationDuringReading?: boolean;
}

