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

export interface Reciter {
  id: string;
  name: string;
  subtext: string;
  identifier: string;
}

export const recitersList: Reciter[] = [
  { id: "alafasy", name: "مشاري راشد العفاسي", subtext: "عذب، نقي ومرتل", identifier: "alafasy-64" },
  { id: "abdulbasit", name: "عبد الباسط عبد الصمد", subtext: "صاحب الحنجرة الذهبية", identifier: "Abdul_Basit_Mujawwad_128kbps" },
  { id: "almuaiqly", name: "ماهر المعيقلي", subtext: "إمام الحرم المكي", identifier: "Maher_AlMuaiqly_64kbps" },
  { id: "shuraim", name: "سعود الشريم", subtext: "تلاوة سريعة باثقة", identifier: "Saood_shuraym_64kbps" },
  { id: "minshawi", name: "محمد صديق المنشاوي", subtext: "الصوت الباكي الخاشع", identifier: "Minshawy_Mujawwad_64kbps" }
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

