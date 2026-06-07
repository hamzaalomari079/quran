import React, { useState, useEffect } from "react";
import { BookOpen, Sparkles, BookMarked, Smile, Activity, Search, Compass, Disc, ExternalLink, Heart, ArrowLeft, ArrowRight, BookOpenCheck, Settings, Bell, X, ChevronDown, Menu, Shield, Download, Trash2, Check, Smartphone, Chrome, AlertTriangle, Info } from "lucide-react";
import { surahList, SurahHeader } from "./data/surahData";
import { Bookmark, Reciter, recitersList, GlobalSettings } from "./types";
import SurahReader from "./components/SurahReader";
import AudioPlayer from "./components/AudioPlayer";
import AIChatBot from "./components/AIChatBot";
import AzkarDashboard from "./components/AzkarDashboard";
import HisnAlMuslim from "./components/HisnAlMuslim";
import StatsPanel from "./components/StatsPanel";
import DuasSection from "./components/DuasSection";
import UserSettingsModal from "./components/UserSettingsModal";
import ComplianceModal from "./components/ComplianceModal";
import DonationSection from "./components/DonationSection";
import FullQuranDownloader from "./components/FullQuranDownloader";
import AIMemorizationGateway from "./components/AIMemorizationGateway";
import QuranicStories from "./components/QuranicStories";
import ScrollToTop from "./components/ScrollToTop";
import { translations, getTranslation } from "./utils/translations";
import { playSpiritualChime } from "./utils/sound";
import { cacheSurahAudios, removeCachedSurahAudios } from "./utils/offlineAudio";
import PWAInstallGateway from "./components/PWAInstallGateway";
import SupportCenterModal from "./components/SupportCenterModal";

// Randomized list of beautiful uplifting daily verses for the main home screen
const dailyVersesTranslations: Record<'ar' | 'en', Array<{ text: string; reference: string; meaning: string }>> = {
  ar: [
    { text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", reference: "سورة البقرة: الآية ٢٥٥", meaning: "الله لا معبود بحق إلا هو، الحي القيوم القائم على كل شيء." },
    { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا", reference: "سورة الشرح: الآيات ٥-٦", meaning: "إن مع الضيق والشدة سهولة وييسراً واسعاً." },
    { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", reference: "سورة الرعد: الآية ٢٨", meaning: "ألا بذكر الله الحكيم تطمئن قلوب المؤمنين الموحدين وتسكن." },
    { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا * وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", reference: "سورة الطلاق: الآيات ٢-٣", meaning: "ومن يخف الله يجعل له مخرجاً من كل ضيق ويرزقه من جهات لا تخطر بباله." },
    { text: "ادْعُونِي أَسْتَجِبْ لَكُمْ", reference: "سورة غافر: الآية ٦٠", meaning: "اعبدوني وأخلصوا لي الطاعة أجب دعاءكم وأعفُ عنكم." },
    { text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا", reference: "سورة الزمر: الآية ٥٣", meaning: "قل للذين تجاوزوا الحد في المعاصي لا تيأسوا من مغفرته الواسعة." }
  ],
  en: [
    { text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", reference: "Surah Al-Baqarah: Ayah 255", meaning: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence." },
    { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا", reference: "Surah Ash-Sharh: Ayahs 5-6", meaning: "For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease." },
    { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", reference: "Surah Ar-Ra'd: Ayah 28", meaning: "Unquestionably, by the remembrance of Allah hearts are assured." },
    { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا * وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", reference: "Surah At-Talaq: Ayahs 2-3", meaning: "And whoever fears Allah - He will make for him a way out and will provide for him from where he does not expect." },
    { text: "ادْعُونِي أَسْتَجِبْ لَكُمْ", reference: "Surah Ghafir: Ayah 60", meaning: "Call upon Me; I will respond to you." },
    { text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا", reference: "Surah Az-Zumar: Ayah 53", meaning: "Say, 'O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins.'" }
  ]
};

interface RelatedVerse {
  text: string;
  surahNumber: number;
  verseNumber: number;
  surahNameAr: string;
  surahNameEn: string;
}

const relatedVersesMap: Record<number, RelatedVerse[]> = {
  0: [
    {
      text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
      surahNumber: 3,
      verseNumber: 2,
      surahNameAr: "آل عمران",
      surahNameEn: "Al-Imran"
    },
    {
      text: "ذَٰلِكُمُ اللَّهُ رَبُّكُمْ ۖ لَا إِلَٰهَ إِلَّا هُوَ ۖ خَالِقُ كُلِّ شَيْءٍ فَاعْبُدُوهُ",
      surahNumber: 6,
      verseNumber: 102,
      surahNameAr: "الأنعام",
      surahNameEn: "Al-An'am"
    },
    {
      text: "هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ ۖ الْمَلِكُ الْقُدُّوسُ السَّلَامُ",
      surahNumber: 59,
      verseNumber: 23,
      surahNameAr: "الحشر",
      surahNameEn: "Al-Hashr"
    }
  ],
  1: [
    {
      text: "سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا",
      surahNumber: 65,
      verseNumber: 7,
      surahNameAr: "الطلاق",
      surahNameEn: "At-Talaq"
    },
    {
      text: "يُرِيدُ اللَّهُ بِكُمُ الْيُسْرَ وَلَا يُرِيدُ بِكُمُ الْعُسْرَ",
      surahNumber: 2,
      verseNumber: 185,
      surahNameAr: "البقرة",
      surahNameEn: "Al-Baqarah"
    },
    {
      text: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ۖ وَعَسَىٰ أَن تُحِبُّوا شَيْئًا وَهُوَ شَرٌّ لَّكُمْ",
      surahNumber: 2,
      verseNumber: 216,
      surahNameAr: "البقرة",
      surahNameEn: "Al-Baqarah"
    }
  ],
  2: [
    {
      text: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ",
      surahNumber: 13,
      verseNumber: 28,
      surahNameAr: "الرعد",
      surahNameEn: "Ar-Ra'd"
    },
    {
      text: "إِنَّمَا الْمُؤْمِنُونَ الَّذِينَ إِذَا ذُكِرَ اللَّهُ وَجِلَتْ قُلُوبُهُمْ",
      surahNumber: 8,
      verseNumber: 2,
      surahNameAr: "الأنفال",
      surahNameEn: "Al-Anfal"
    },
    {
      text: "تَقْشَعِرُّ مِنْهُ جُلُودُ الَّذِينَ يَخْشَوْنَ رَبَّهُمْ ثُمَّ تَلِينُ جُلُودُهُمْ وَقُلُوبُهُمْ إِلَىٰ ذِكْرِ اللَّهِ",
      surahNumber: 39,
      verseNumber: 23,
      surahNameAr: "الزمر",
      surahNameEn: "Az-Zumar"
    }
  ],
  3: [
    {
      text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ",
      surahNumber: 65,
      verseNumber: 3,
      surahNameAr: "الطلاق",
      surahNameEn: "At-Talaq"
    },
    {
      text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مِنْ أَمْرِهِ يُسْرًا",
      surahNumber: 65,
      verseNumber: 4,
      surahNameAr: "الطلاق",
      surahNameEn: "At-Talaq"
    },
    {
      text: "إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوا وَّالَّذِينَ هُم مُّحْسِنُونَ",
      surahNumber: 16,
      verseNumber: 128,
      surahNameAr: "النحل",
      surahNameEn: "Al-Nahl"
    }
  ],
  4: [
    {
      text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
      surahNumber: 2,
      verseNumber: 186,
      surahNameAr: "البقرة",
      surahNameEn: "Al-Baqarah"
    },
    {
      text: "أَمَّن يُجِيبُ الْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ السُّوءَ وَيَجْعَلُكُمْ خُلَفَاءَ الْأَرْضِ",
      surahNumber: 27,
      verseNumber: 62,
      surahNameAr: "النمل",
      surahNameEn: "Al-Naml"
    },
    {
      text: "وَلَقَدْ نَادَانَا نُوحٌ فَلَنِعْمَ الْمُجِيبُونَ",
      surahNumber: 37,
      verseNumber: 75,
      surahNameAr: "الصافات",
      surahNameEn: "As-Saffat"
    }
  ],
  5: [
    {
      text: "وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ ۚ فَأَكْتُبُهَا لِلَّذِينَ يَتَّقُونَ",
      surahNumber: 7,
      verseNumber: 156,
      surahNameAr: "الأعراف",
      surahNameEn: "Al-A'raf"
    },
    {
      text: "وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا",
      surahNumber: 4,
      verseNumber: 110,
      surahNameAr: "النساء",
      surahNameEn: "Al-Nisa"
    },
    {
      text: "وَاللَّهُ يُرِيدُ أَن يَتُوبَ عَلَيْكُمْ وَيُرِيدُ الَّذِينَ يَتَّبِعُونَ الشَّهَوَاتِ",
      surahNumber: 4,
      verseNumber: 27,
      surahNameAr: "النساء",
      surahNameEn: "Al-Nisa"
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"index" | "ai" | "azkar" | "bookmarks" | "hisn" | "stats" | "donation" | "memo" | "stories" | "downloads" | "duas">("index");
  const [lastRead, setLastRead] = useState<{
    surahNumber: number;
    surahName: string;
    verseNumber: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (activeTab === "index") {
      try {
        const saved = localStorage.getItem("quran_app_last_read");
        if (saved) {
          setLastRead(JSON.parse(saved));
        } else {
          setLastRead(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeTab]);

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isReflectionExpanded, setIsReflectionExpanded] = useState<boolean>(false);
  
  // Offline & Networking Tracking
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);
  const [downloadingStates, setDownloadingStates] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);

  // Audio Download Options and Progress Tracking States
  const [downloadModalData, setDownloadModalData] = useState<{
    surahNumber: number;
    surahNameStr: string;
    numberOfAyahs: number;
  } | null>(null);
  const [isCurrentlyDownloading, setIsCurrentlyDownloading] = useState(false);
  const [downloadWithAudio, setDownloadWithAudio] = useState(false);
  const [downloadAudioProgress, setDownloadAudioProgress] = useState({ current: 0, total: 1 });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToast({ message: msg, show: true });
  };

  const handleNavigateTab = (tabName: "index" | "ai" | "azkar" | "bookmarks" | "hisn" | "stats" | "donation" | "memo" | "stories" | "downloads" | "duas", andCloseDrawer = false) => {
    if (selectedSurah && settings.lockNavigationDuringReading) {
      triggerToast(isAr 
        ? "⚠️ أزرار التنقل مقفلة حالياً لحماية خشوع وتركيز قراءتك. يمكنك الغاء القفل من 'تخصيص القراءة' بالسور." 
        : "⚠️ Navigation buttons are locked to safeguard your reading focus. Disable the lock inside 'Page Settings' to navigate."
      );
      if (andCloseDrawer) setIsMobileMenuOpen(false);
      return;
    }
    
    setSelectedSurah(null);
    setSelectedStoryId(null);
    setActiveTab(tabName);
    if (andCloseDrawer) setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeReading = (surahNum: number, verseNum: number) => {
    const found = surahList.find(s => s.number === surahNum);
    if (found) {
      setInitialScrollToVerse(verseNum);
      setSelectedSurah(found);
    }
  };

  useEffect(() => {
    if (toast && toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => prev ? { ...prev, show: false } : null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // PWA & Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Surah reading states
  const [selectedSurah, setSelectedSurah] = useState<SurahHeader | null>(null);
  const [isFocusReadingMode, setIsFocusReadingMode] = useState<boolean>(false);

  // User accessibility and visual configurations
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSupportCenterOpen, setIsSupportCenterOpen] = useState<boolean>(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem("quran_app_global_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          fontScale: 'normal',
          simpleFont: false,
          dyslexiaSpacing: false,
          reducedMotion: false,
          highlightActive: true,
          voiceHints: false,
          trueNightMode: false,
          language: 'ar',
          reminderEnabled: false,
          reminderTime: "20:00",
          autoPlayNextVerse: true,
          autoShowTafsir: false,
          dailyTargetPages: 5,
          autoScrollSelected: false,
          lockNavigationDuringReading: false,
          ...parsed,
        };
      }
    } catch (e) {
      console.warn("Failed to load settings from storage", e);
    }
    return {
      fontScale: 'normal',
      simpleFont: false,
      dyslexiaSpacing: false,
      reducedMotion: false,
      highlightActive: true,
      voiceHints: false,
      trueNightMode: false,
      language: 'ar',
      reminderEnabled: false,
      reminderTime: "20:00",
      autoPlayNextVerse: true,
      autoShowTafsir: false,
      dailyTargetPages: 5,
      autoScrollSelected: false,
      lockNavigationDuringReading: false
    };
  });

  const currentLang = settings.language || 'ar';
  const isAr = currentLang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const t = (key: keyof typeof translations['ar']) => {
    return getTranslation(currentLang, key);
  };

  const handleUpdateSettings = (newSettings: Partial<GlobalSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("quran_app_global_settings", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save settings", e);
      }
      return updated;
    });
  };
  
  // Search state for Surahs
  const [searchQuery, setSearchQuery] = useState("");

  // Comprehensive Quran Verse Search Engine states
  const [searchType, setSearchType] = useState<"surah" | "verse">("surah");
  const [verseSearchQuery, setVerseSearchQuery] = useState("");
  const [verseSearchResults, setVerseSearchResults] = useState<any[]>([]);
  const [verseSearchLoading, setVerseSearchLoading] = useState(false);
  const [verseSearchError, setVerseSearchError] = useState<string | null>(null);
  const [verseSearchCache, setVerseSearchCache] = useState<{[key: string]: any}>({});
  const [initialScrollToVerse, setInitialScrollToVerse] = useState<number | undefined>(undefined);

  // Randomized Daily Quranic statement
  const [dailyVerseIndex, setDailyVerseIndex] = useState<number>(0);

  // Persistent bookmarks set
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // AI Chat Prefill state
  const [aiPrefilledVerse, setAIPrefilledVerse] = useState<{
    text: string;
    verseNumber: number;
    surahName?: string;
  } | null>(null);

  // In-App floating toast invitation to read Quran portion
  const [inAppReminder, setInAppReminder] = useState<{
    show: boolean;
    title: string;
    body: string;
  } | null>(null);

  // Background active check for daily Quranic portion alert
  useEffect(() => {
    const checkReminder = () => {
      if (!settings.reminderEnabled) return;

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${hours}:${minutes}`;

      if (currentTimeString === settings.reminderTime) {
        const todayStr = now.toDateString();
        const lastNotified = localStorage.getItem("quran_app_last_notified_date");

        if (lastNotified !== todayStr) {
          localStorage.setItem("quran_app_last_notified_date", todayStr);

          // Play spiritual gentle double chime alert
          playSpiritualChime();

          const title = isAr ? "۞ الورد القرآني والتدبر اليومي" : "۞ Daily Quranic Reading Portion";
          const body = isAr 
            ? "تذكير مبارك: حان الآن وقت وردك اليومي لتلاوة الذكر الحكيم وتدبر آياته العطرة." 
            : "Blessed reminder: It is time for your daily Quran portion. Open the app to recite and reflect.";

          // System notification via HTML5 Notification API if permission is granted
          if (typeof window !== "undefined" && "Notification" in window) {
            try {
              if (Notification.permission === "granted") {
                const notif = new Notification(title, {
                  body,
                  icon: "/icon.png",
                  tag: "quran-reminder"
                });
                notif.onclick = () => {
                  window.focus();
                  const dailyEl = document.getElementById("daily-verse-banner");
                  if (dailyEl) {
                    dailyEl.scrollIntoView({ behavior: "smooth" });
                  }
                };
              }
            } catch (err) {
              console.warn("System Notification failed to prompt:", err);
            }
          }

          setInAppReminder({
            show: true,
            title,
            body
          });
        }
      }
    };

    const interval = setInterval(checkReminder, 20000);
    checkReminder();

    return () => clearInterval(interval);
  }, [settings.reminderEnabled, settings.reminderTime, isAr]);

  // Global Audio Recitation States
  const [activeReciter, setActiveReciter] = useState<Reciter>(recitersList[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<{
    surahNumber: number;
    verseNumber: number;
    surahName: string;
    totalAyahs: number;
  } | null>(null);

  const dailyVersesList = dailyVersesTranslations[currentLang] || dailyVersesTranslations['ar'];
  const dailyVerse = dailyVersesList[dailyVerseIndex] || dailyVersesList[0];

  useEffect(() => {
    // Check if loaded inside standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const localInstalled = localStorage.getItem('pwa_installed') === 'true';
    setIsAppInstalled(isStandalone || localInstalled);
    
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (!isStandalone) {
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handler);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleExecuteVerseSearch = async () => {
    const q = verseSearchQuery.trim();
    if (!q) return;

    // Fast-track repeat searches by loading from client-side search cache instantly
    const normalizedQ = q.toLowerCase();
    if (verseSearchCache[normalizedQ]) {
      setVerseSearchResults(verseSearchCache[normalizedQ]);
      setVerseSearchError(null);
      return;
    }

    setVerseSearchLoading(true);
    setVerseSearchError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء الاتصال بالخادم.");
      }
      const data = await response.json();
      
      if (data.unrecognized === true) {
        setVerseSearchResults([]);
        setVerseSearchError(
          isAr 
            ? "لم نتمكن من تحديد الآية المقصودة (عدم المعرفة - Unrecognized). يرجى التأكد من كتابة الكلمات بشكل صحيح أو المواضيع المتداولة (مثل كتابة 'أية الكرسي' أو 'آية الصيام')." 
            : "We were unable to identify the intended verse (Unrecognized). Please make sure of the spelling or try typing common topic names (like 'Ayat Al-Kursi' or 'Verse of Fasting')."
        );
      } else {
        const results = data.results || [];
        setVerseSearchResults(results);
        if (results.length > 0) {
          // Store in client-side memory cache for zero-latency future hits
          setVerseSearchCache(prev => ({
            ...prev,
            [normalizedQ]: results
          }));
        } else {
          setVerseSearchError(
            isAr 
              ? "لم نعثر على مطابقات للكلمات أو الآيات المدخلة. يرجى تجربة صياغة كتابية مختلفة." 
              : "No matches found for the words or verses entered. Please try a different phrasing."
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setVerseSearchError(
        isAr 
          ? "حدثت مشكلة أثناء استدعاء محرك البحث الذكي للآيات. يرجى التحقق من الاتصال والمحاولة لاحقاً." 
          : "An error occurred while calling the search engine. Please check connection and try again."
      );
    } finally {
      setVerseSearchLoading(false);
    }
  };

  const handleJumpToSearchResults = (surahNumber: number, verseNumber: number) => {
    const foundHeader = surahList.find(s => s.number === surahNumber);
    if (foundHeader) {
      setInitialScrollToVerse(verseNumber);
      setSelectedSurah(foundHeader);
      setActiveTab("index");
    }
  };

  useEffect(() => {
    // Select random daily verse based on calendar date
    const day = new Date().getDate();
    const index = day % 6; // size of daily list is 6
    setDailyVerseIndex(index);

    // Load bookmarks
    const saved = localStorage.getItem("quran_app_bookmarks");
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }

    // Load downloaded surahs list
    try {
      const savedDownloads = localStorage.getItem("downloaded_surah_list");
      if (savedDownloads) {
        setDownloadedSurahs(JSON.parse(savedDownloads));
      }
    } catch (e) {
      console.warn("Failed to load downloaded surah list", e);
    }

    // Parse URL query parameters to support search engine indexing deep links (s or surah)
    try {
      const params = new URLSearchParams(window.location.search);
      const sQuery = params.get("s") || params.get("surah");
      const vQuery = params.get("v") || params.get("verse");
      
      if (sQuery) {
        const sNum = parseInt(sQuery);
        if (!isNaN(sNum) && sNum >= 1 && sNum <= 114) {
          const foundSurah = surahList.find(s => s.number === sNum);
          if (foundSurah) {
            setSelectedSurah(foundSurah);
            setActiveTab("index");
            
            if (vQuery) {
              const vNum = parseInt(vQuery);
              if (!isNaN(vNum) && vNum >= 1) {
                setInitialScrollToVerse(vNum);
              }
            }
          }
        }
      }
    } catch (urlErr) {
      console.warn("Failed to parse URL query parameters for dynamic indexing", urlErr);
    }
  }, []);

  // Saved Bookmarks toggler (adding / deleting)
  const handleToggleBookmark = (verseNumber: number, verseText: string) => {
    if (!selectedSurah) return;

    const isExisting = bookmarks.some(b => b.surahNumber === selectedSurah.number && b.verseNumber === verseNumber);
    let updated: Bookmark[] = [];

    if (isExisting) {
      updated = bookmarks.filter(b => !(b.surahNumber === selectedSurah.number && b.verseNumber === verseNumber));
    } else {
      const newBookmark: Bookmark = {
        id: `${selectedSurah.number}_${verseNumber}`,
        surahNumber: selectedSurah.number,
        surahName: selectedSurah.name,
        verseNumber: verseNumber,
        verseText: verseText,
        addedAt: new Date().toLocaleDateString("ar-EG")
      };
      updated = [newBookmark, ...bookmarks];
    }

    setBookmarks(updated);
    localStorage.setItem("quran_app_bookmarks", JSON.stringify(updated));
  };

  const handleDeleteBookmarkDirectly = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("quran_app_bookmarks", JSON.stringify(updated));
  };

  // Offline Full Surah downloads cache engine and managers
  const handleDownloadSurah = async (surahNum: number, surahNameStr: string) => {
    if (downloadingStates[surahNum] || isCurrentlyDownloading) return;

    const surahHeader = surahList.find(s => s.number === surahNum);
    const totalAyahs = surahHeader ? surahHeader.numberOfAyahs : 7;
    
    // Instead of downloading immediately, open the interactive choice modal
    setDownloadModalData({
      surahNumber: surahNum,
      surahNameStr: surahNameStr,
      numberOfAyahs: totalAyahs
    });
  };

  const executeActualDownload = async (surahNum: number, surahNameStr: string, withAudio: boolean) => {
    setIsCurrentlyDownloading(true);
    setDownloadWithAudio(withAudio);
    setDownloadAudioProgress({ current: 0, total: downloadModalData?.numberOfAyahs || 1 });
    
    setDownloadingStates(prev => ({ ...prev, [surahNum]: true }));
    try {
      // 1. Fetch Surah Data (text & translations)
      const response = await fetch(`/api/surah/${surahNum}`);
      if (!response.ok) {
        throw new Error("api_fail");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Store in localStorage
      localStorage.setItem(`offline_surah_${surahNum}`, JSON.stringify(data));

      // 2. Fetch Audio files if chosen
      if (withAudio) {
        setDownloadAudioProgress({ current: 0, total: data.numberOfAyahs });
        const successAudio = await cacheSurahAudios(
          surahNum,
          data.numberOfAyahs,
          activeReciter.identifier,
          (current, total) => {
            setDownloadAudioProgress({ current, total });
          }
        );
        if (!successAudio) {
          console.warn("Some audio files failed to download or caching was unsupported.");
        }
      }

      // Update the downloaded list
      const savedDownloads = localStorage.getItem("downloaded_surah_list");
      const listOfDownloaded: number[] = savedDownloads ? JSON.parse(savedDownloads) : [];
      if (!listOfDownloaded.includes(surahNum)) {
        listOfDownloaded.push(surahNum);
        localStorage.setItem("downloaded_surah_list", JSON.stringify(listOfDownloaded));
        setDownloadedSurahs(listOfDownloaded);
      }

      triggerToast(
        isAr 
          ? `✅ تم تنزيل سورة ${surahNameStr} بالكامل ${withAudio ? `مع صوتيات الشيخ ${activeReciter.name}` : "للقراءة التفسيرية"} وحفظها أوفلاين بنجاح.` 
          : `✅ Surah ${data.englishName || surahNameStr} downloaded fully ${withAudio ? `with audio of ${activeReciter.name}` : "for offline reading"} successfully.`
      );
    } catch (err: any) {
      console.error("Download offline error:", err);
      const isQuotaError = err.name === 'QuotaExceededError' || err.code === 22 || err.message?.includes('quota');
      if (isQuotaError) {
        triggerToast(
          isAr
            ? "⚠️ فشل التنزيل: عذراً، لقد تجاوزت السعة التخزينية المخصصة لمتصفحك. يرجى حذف بعض السور لتنزيل هذه السورة."
            : "⚠️ Fail: Browser storage quota exceeded. Please remove some Surahs to download this one."
        );
      } else {
        triggerToast(
          isAr
            ? `⚠️ فشل تنزيل سورة ${surahNameStr}. تأكد من اتصال جهازك بالإنترنت.`
            : `⚠️ Failed to download Surah ${surahNameStr}. Please check your connection.`
        );
      }
    } finally {
      setDownloadingStates(prev => ({ ...prev, [surahNum]: false }));
      setIsCurrentlyDownloading(false);
      setDownloadModalData(null);
    }
  };

  const handleRemoveDownloadedSurah = async (surahNum: number, surahNameStr: string) => {
    try {
      localStorage.removeItem(`offline_surah_${surahNum}`);
      const savedDownloads = localStorage.getItem("downloaded_surah_list");
      const listOfDownloaded: number[] = savedDownloads ? JSON.parse(savedDownloads) : [];
      const updatedList = listOfDownloaded.filter(n => n !== surahNum);
      localStorage.setItem("downloaded_surah_list", JSON.stringify(updatedList));
      setDownloadedSurahs(updatedList);

      // Also clean up any cached audio for ALL reciters of this surah
      const surahHeader = surahList.find(s => s.number === surahNum);
      const totalAyahs = surahHeader ? surahHeader.numberOfAyahs : 7;
      for (const reciter of recitersList) {
        await removeCachedSurahAudios(surahNum, totalAyahs, reciter.identifier);
      }

      triggerToast(
        isAr
          ? `🗑️ تم إزالة سورة ${surahNameStr} بالكامل بجميع نصوصها وملفاتها الصوتية من جهازك لتوفير المساحة.`
          : `🗑️ Surah ${surahNameStr} and its audio resources have been deleted from your local storage.`
      );
    } catch (err) {
      console.error("Delete from offline partition error:", err);
    }
  };

  // Jump straight to verse from bookmarks pane
  const handleJumpToBookmarkedVerse = (bookmark: Bookmark) => {
    const foundHeader = surahList.find(s => s.number === bookmark.surahNumber);
    if (foundHeader) {
      setSelectedSurah(foundHeader);
      setActiveTab("index"); // view reading mode
      
      // Give small timeout for SurahReader component to render, then highlight & scroll
      setTimeout(() => {
        const el = document.getElementById("audio-player-container"); // verification anchor
        const verseEl = document.querySelector(`[ref]`) ?? document.body; // fallback
        // We will trigger a smooth scroll inside reader once fully loaded
        const target = document.querySelector(`[key="${bookmark.verseNumber}"]`) || document.body;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 800);
    }
  };

  const handleChangeSurah = (surahNum: number) => {
    const foundHeader = surahList.find(s => s.number === surahNum);
    if (foundHeader) {
      setInitialScrollToVerse(1);
      setSelectedSurah(foundHeader);
      window.scrollTo(0, 0);
    }
  };

  // Global Audio Continuous Recitation Controller Callbacks
  const handlePlayVerse = (verseNum: number) => {
    if (!selectedSurah) return;
    setCurrentPlayingVerse({
      surahNumber: selectedSurah.number,
      verseNumber: verseNum,
      surahName: selectedSurah.name,
      totalAyahs: selectedSurah.numberOfAyahs
    });
    setIsPlaying(true);
  };

  const handleStopPlay = () => {
    setIsPlaying(false);
  };

  const handleNextVerse = () => {
    if (!currentPlayingVerse) return;
    
    const nextVerseNum = currentPlayingVerse.verseNumber + 1;
    if (nextVerseNum <= currentPlayingVerse.totalAyahs) {
      setCurrentPlayingVerse({
        ...currentPlayingVerse,
        verseNumber: nextVerseNum
      });
      setIsPlaying(true);
    } else {
      // Loop or proceed to next Surah in index
      const nextSurahNum = currentPlayingVerse.surahNumber + 1;
      if (nextSurahNum <= 114) {
        const nextSurahHeader = surahList.find(s => s.number === nextSurahNum);
        if (nextSurahHeader) {
          if (selectedSurah && selectedSurah.number === currentPlayingVerse.surahNumber) {
            setSelectedSurah(nextSurahHeader);
          }
          setCurrentPlayingVerse({
            surahNumber: nextSurahHeader.number,
            verseNumber: 1,
            surahName: nextSurahHeader.name,
            totalAyahs: nextSurahHeader.numberOfAyahs
          });
          setIsPlaying(true);
        }
      } else {
        // Wrap up at end of Quran
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
      }
    }
  };

  const handlePrevVerse = () => {
    if (!currentPlayingVerse) return;

    const prevVerseNum = currentPlayingVerse.verseNumber - 1;
    if (prevVerseNum >= 1) {
      setCurrentPlayingVerse({
        ...currentPlayingVerse,
        verseNumber: prevVerseNum
      });
      setIsPlaying(true);
    } else {
      // Go to previous Surah
      const prevSurahNum = currentPlayingVerse.surahNumber - 1;
      if (prevSurahNum >= 1) {
        const prevSurahHeader = surahList.find(s => s.number === prevSurahNum);
        if (prevSurahHeader) {
          if (selectedSurah && selectedSurah.number === currentPlayingVerse.surahNumber) {
            setSelectedSurah(prevSurahHeader);
          }
          setCurrentPlayingVerse({
            surahNumber: prevSurahHeader.number,
            verseNumber: prevSurahHeader.numberOfAyahs,
            surahName: prevSurahHeader.name,
            totalAyahs: prevSurahHeader.numberOfAyahs
          });
          setIsPlaying(true);
        }
      }
    }
  };

  // AI Assistant trigger with prepopulated verse
  const handleTriggerAIPonder = (verseText: string, verseNumber: number) => {
    if (!selectedSurah) return;
    setAIPrefilledVerse({
      text: verseText,
      verseNumber: verseNumber,
      surahName: selectedSurah.name
    });
    setActiveTab("ai");
  };

  // Normalization helper for local Surah list searching (Highly optimized for SEO and Surah search intent)
  const normalizeLocalArabic = (str: string) => {
    let text = str
      .replace(/[\u064B-\u0652\u0670]/g, "") // remove diacritics
      .replace(/[أإآا]/g, "ا")
      .replace(/[ىي]/g, "ي")
      .replace(/[ةه]/g, "ه")
      .toLowerCase()
      .trim();
    
    // Strip common prefixes like "سورة " / "سوره " / "سورة" / "سوره" / "surah " / "sura " to allow direct name lookup
    text = text
      .replace(/^(سورة|سوره|سورت|surah|sura|surat)\s+/g, "")
      .replace(/^(سورة|سوره|سورت|surah|sura|surat)/g, "")
      .replace(/^(ال)\s+/g, "ال") // Handle "ال " with trailing space
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ""); // strip punctuation for high compatibility
      
    return text.trim();
  };

  // Filter surahs list (Highly optimized internal Surah Finder with smart substring match and prefix tolerance)
  const filteredSurahs = surahList.filter(s => {
    if (!searchQuery) return true;
    const normalizedQuery = normalizeLocalArabic(searchQuery);
    if (!normalizedQuery) return true; // fallback if stripping emptied it
    
    const normalizedName = normalizeLocalArabic(s.name);
    // Also remove "ال" if user didn't type it (e.g. searching "كهف" should find "الكهف")
    const nameWithoutAlefLam = normalizedName.startsWith("ال") ? normalizedName.substring(2) : normalizedName;

    const normalizedEnglishName = s.englishName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const englishNameWithoutAl = normalizedEnglishName.startsWith("al") ? normalizedEnglishName.substring(2) : normalizedEnglishName;

    const normalizedTranslation = s.englishNameTranslation.toLowerCase().replace(/[^a-z0-9]/g, "");

    return (
      normalizedName.includes(normalizedQuery) ||
      nameWithoutAlefLam.includes(normalizedQuery) ||
      normalizedEnglishName.includes(normalizedQuery) ||
      englishNameWithoutAl.includes(normalizedQuery) ||
      normalizedTranslation.includes(normalizedQuery) ||
      normalizeLocalArabic(s.arabicType).includes(normalizedQuery) ||
      String(s.number) === searchQuery.trim()
    );
  });

  const settingsClasses = [
    settings.fontScale === "large" ? "accessibility-large-text" : "",
    settings.fontScale === "extra-large" ? "accessibility-extra-large-text" : "",
    settings.simpleFont ? "accessibility-simple-font" : "",
    settings.dyslexiaSpacing ? "accessibility-dyslexia-spacing" : "",
    settings.reducedMotion ? "accessibility-reduced-motion" : "",
    settings.trueNightMode ? "brightness-[0.80] contrast-[0.98]" : ""
  ].filter(Boolean).join(" ");

  return (
    <>
      <div className={`min-h-screen bg-stone-950 text-stone-200 flex flex-col ${currentPlayingVerse ? "pb-36 lg:pb-48" : "pb-16"} ${settingsClasses}`} dir={dir}>
      
      {/* Top beautiful geometric Header bar */}
      {!isFocusReadingMode && (
        <header className="bg-stone-900 border-b border-stone-800 relative lg:sticky lg:top-0 z-40 shadow-md px-3 md:px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between py-3 lg:py-4 gap-3 lg:gap-4">
          
          <div className="flex items-center justify-between w-full lg:w-auto flex-row pr-1 pl-1">
            <div className="flex items-center gap-2 lg:gap-2.5 flex-row">
              <div className="w-8.5 h-8.5 lg:w-11 lg:h-11 rounded-xl bg-stone-900 border border-amber-500/35 flex items-center justify-center text-amber-500 select-none shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-stone-950 opacity-40 group-hover:scale-105 transition-all"></div>
                <svg className="w-6.5 h-6.5 lg:w-8.5 lg:h-8.5 text-amber-500 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                  {/* Outer Primary Square */}
                  <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" stroke="currentColor" />
                  {/* Outer Rotated Square (45 degrees) */}
                  <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" stroke="currentColor" transform="rotate(45 12 12)" />
                  
                  {/* Inner Nested Primary Square */}
                  <rect x="6.8" y="6.8" width="10.4" height="10.4" rx="0.8" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.85" />
                  {/* Inner Nested Rotated Square */}
                  <rect x="6.8" y="6.8" width="10.4" height="10.4" rx="0.8" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.85" transform="rotate(45 12 12)" />

                  {/* Symmetrical Intersection Ray lines creating the luxury Girih pattern */}
                  <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                  <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                  <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                  <line x1="4.9" y1="19.1" x2="19.1" y2="4.9" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />

                  {/* Golden Centerpiece 8-pointed star */}
                  <path d="M12 9.5 L12.8 11.2 L14.5 12 L12.8 12.8 L12 14.5 L11.2 12.8 L9.5 12 L11.2 11.2 Z" fill="currentColor" fillOpacity="0.9" stroke="currentColor" strokeWidth="0.4" />
                </svg>
              </div>
              <div className={isAr ? "text-right" : "text-left"}>
                <h1 className="text-[13px] lg:text-base font-extrabold text-amber-500 font-sans tracking-wide">{t('appName')}</h1>
                <p className="text-[9px] lg:text-[10px] text-stone-400 font-sans font-semibold mt-0.5" dir={dir}>{t('appSubtitle')}</p>
              </div>
            </div>

            {/* Actions for mobile (Settings + Hamburger Drawer toggler) */}
            <div className="flex items-center gap-1.5 lg:hidden">
              {/* Mobile Web App PWA Install Button */}
              {!isAppInstalled && (
                <button
                  onClick={() => setIsInstallModalOpen(true)}
                  className="p-2 sm:p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/25 text-amber-500 hover:text-amber-400 transition-all flex items-center gap-1.5 text-xs font-bold font-sans cursor-pointer active:scale-95 shadow-md shadow-amber-600/5"
                  title={isAr ? "تثبيت تطبيق قرآني" : "Install Qurany Web App"}
                >
                  <Smartphone className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="hidden xs:inline text-[10px]">{isAr ? "تثبيت" : "Install"}</span>
                </button>
              )}

              {/* Accessibility Settings Toggler Button next to Title - MOBILE ONLY */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 transition-all flex items-center gap-1.5 text-xs font-bold font-sans cursor-pointer active:scale-95 shadow-md shadow-amber-600/5"
                title={t('settingsTitle')}
              >
                <Settings className="w-4 h-4 animate-spin-slow text-amber-500" />
                <span className="hidden xs:inline text-[10px]">{t('settingsButton')}</span>
              </button>

              {/* Hamburger Menu Toggler Button - MOBILE ONLY */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 transition-all flex items-center gap-1.5 text-xs font-bold font-sans cursor-pointer active:scale-95 shadow-md shadow-amber-600/5"
                title={isAr ? "القائمة الرئيسية" : "Main Menu"}
              >
                <Menu className="w-4 h-4 text-amber-500" />
                <span className="hidden xs:inline text-[10px]">{isAr ? "القائمة ☰" : "Menu ☰"}</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {/* Direct Web App PWA Install Button next to Settings */}
            {!isAppInstalled && (
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="p-2.5 px-3.5 rounded-2xl bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/25 text-amber-500 hover:text-amber-400 transition-all flex items-center gap-2 text-xs font-bold font-sans cursor-pointer active:scale-95 shadow-lg shadow-amber-600/5 hover:scale-103"
                title={isAr ? "تثبيت تطبيق قرآني على الشاشة الرئيسية" : "Install Qurany Web App on Desktop"}
              >
                <Smartphone className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>{isAr ? "تثبيت التطبيق 📲" : "Install App 📲"}</span>
              </button>
            )}

            {/* Accessibility Settings Toggler Button for Desktop */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 px-3.5 rounded-2xl bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 transition-all flex items-center gap-2 text-xs font-bold font-sans cursor-pointer active:scale-95 shadow-lg shadow-amber-600/5 hover:scale-103"
              title={t('settingsTitle')}
            >
              <Settings className="w-4 h-4 text-amber-500 animate-spin-slow" />
              <span>{t('settingsTitle')}</span>
            </button>
          </div>

          {/* Desktop Core navigation links */}
          <nav className={`hidden lg:flex items-center gap-1 bg-stone-950 p-1 rounded-2xl border border-stone-800 text-sm font-sans relative ${isAr ? "flex-row-reverse" : "flex-row"}`}>
            <button
              onClick={() => { handleNavigateTab("index"); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer text-center ${
                activeTab === "index" 
                  ? "bg-amber-600 text-stone-950 shadow-sm font-bold" 
                  : "text-stone-400 hover:text-amber-500 hover:bg-stone-900/80"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('navReader')}</span>
            </button>

            <button
              onClick={() => { handleNavigateTab("ai"); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer text-center ${
                activeTab === "ai" 
                  ? "bg-amber-600 text-stone-950 shadow-sm font-bold" 
                  : "text-stone-400 hover:text-amber-500 hover:bg-stone-900/80"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('navAi')}</span>
            </button>

            <button
              onClick={() => { handleNavigateTab("azkar"); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer text-center ${
                activeTab === "azkar" 
                  ? "bg-amber-600 text-stone-950 shadow-sm font-bold" 
                  : "text-stone-400 hover:text-amber-500 hover:bg-stone-900/80"
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>{t('navAzkar')}</span>
            </button>

            <button
              onClick={() => { handleNavigateTab("bookmarks"); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer text-center relative ${
                activeTab === "bookmarks" 
                  ? "bg-amber-600 text-stone-950 shadow-sm font-bold" 
                  : "text-stone-400 hover:text-amber-500 hover:bg-stone-900/80"
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>{t('navBookmarks')}</span>
              {bookmarks.length > 0 && (
                <span className="bg-amber-500 text-stone-950 text-[9px] font-extrabold px-1 py-0.5 rounded-full ml-1">
                  {bookmarks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { handleNavigateTab("downloads"); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer text-center relative ${
                activeTab === "downloads" 
                  ? "bg-amber-600 text-stone-950 shadow-sm font-bold" 
                  : "text-stone-400 hover:text-amber-500 hover:bg-stone-900/80"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('navDownloads')}</span>
              {downloadedSurahs.length > 0 && (
                <span className="bg-amber-500 text-stone-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                  {downloadedSurahs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { handleNavigateTab("stories"); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer text-center relative ${
                activeTab === "stories" 
                  ? "bg-amber-600 text-stone-950 shadow-sm font-bold" 
                  : "text-stone-400 hover:text-amber-500 hover:bg-stone-900/80"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('navStories')}</span>
              <span className="bg-amber-500 text-stone-950 text-[8px] font-extrabold px-1 py-0.2 rounded-full ml-1 animate-pulse">NEW</span>
            </button>

            {/* Scalable "More Dropdown" to prevent clutter from future feature additions */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer text-center ${
                  ["hisn", "stats", "donation", "memo", "duas"].includes(activeTab)
                    ? "bg-amber-600 text-stone-950 shadow-sm font-bold" 
                    : "text-stone-400 hover:text-amber-500 hover:bg-stone-900/80"
                }`}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? "rotate-180" : ""}`} />
                <span>{t('navMore')}</span>
              </button>

              {isMoreMenuOpen && (
                <>
                  {/* Overlay backdrop to dismiss dropdown on outer click */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                    onClick={() => setIsMoreMenuOpen(false)} 
                  />
                  
                  {/* Dropdown container */}
                  <div className={`absolute top-full mt-2 z-50 w-44 bg-stone-900 border border-stone-800 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 text-right animate-in fade-in slide-in-from-top-2 duration-150 ${isAr ? "left-0 sm:left-auto sm:right-0" : "right-0 sm:right-auto sm:left-0"}`}>
                    
                    <button
                      onClick={() => {
                        handleNavigateTab("memo");
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer ${
                        activeTab === "memo"
                          ? "bg-amber-600 text-stone-950 font-black"
                          : "text-stone-300 hover:text-amber-500 hover:bg-stone-850"
                      } ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      <BookOpenCheck className="w-3.5 h-3.5" />
                      <span>{t('navMemo')}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavigateTab("hisn");
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "hisn"
                          ? "bg-amber-600 text-stone-950 font-black"
                          : "text-stone-300 hover:text-amber-500 hover:bg-stone-850"
                      } ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{t('navHisn')}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavigateTab("duas");
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "duas"
                          ? "bg-amber-600 text-stone-950 font-black"
                          : "text-stone-300 hover:text-amber-500 hover:bg-stone-850"
                      } ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      <Heart className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isAr ? "بوابة الأدعية 🤲" : "My Supplications 🤲"}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavigateTab("stats");
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer ${
                        activeTab === "stats"
                          ? "bg-amber-600 text-stone-950 font-black"
                          : "text-stone-300 hover:text-amber-500 hover:bg-stone-850"
                      } ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{t('navStats')}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavigateTab("donation");
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer ${
                        activeTab === "donation"
                          ? "bg-amber-600 text-stone-950 font-black"
                          : "text-amber-500 hover:text-amber-400 hover:bg-stone-850"
                      } ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>{t('navDonation')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsSupportCenterOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border border-red-500/30 bg-red-950/20 hover:bg-red-950/35 text-red-400 hover:text-red-300 relative mt-1 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      <div className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      </div>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{isAr ? "مركز الدعم والمساعدة 🚨" : "Help & Support Center 🚨"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsComplianceOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-stone-300 hover:text-amber-500 hover:bg-stone-850/60 transition-all flex items-center gap-2 cursor-pointer border-t border-stone-800/50 pt-2 mt-1 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{isAr ? "شروط الخدمة وسياسة الخصوصية ⚖️" : "Terms & Privacy Policy ⚖️"}</span>
                    </button>

                  </div>
                </>
              )}
            </div>
          </nav>

        </div>
      </header>
      )}

      {/* Mobile Side Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop blur overlay with fade-in-out */}
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-md transition-opacity duration-350"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Body sliding in */}
          <div 
            className={`relative w-80 max-w-[85vw] h-full bg-stone-900 duration-300 ease-out transition-all p-5 flex flex-col gap-4 shadow-2xl overflow-y-auto ${
              isAr 
                ? "border-r border-stone-800 translate-x-0" 
                : "border-l border-stone-800 translate-x-0"
            }`}
            style={{ direction: isAr ? "rtl" : "ltr" }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-xl font-quran text-amber-500">۞</span>
                <span className="text-sm font-bold text-amber-500 font-sans tracking-wide">
                  {t('appName')}
                </span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of beautifully designed items */}
            <div className="flex flex-col gap-2 py-1">
              
              {/* Reader / Fihrist */}
              <button
                onClick={() => {
                  handleNavigateTab("index", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "index"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">{t('navReader')}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "تصفح المصحف، التفسير، والتلاوة الصوتية" : "Read Quran, view tafsir, and listen to recitations"}
                  </div>
                </div>
              </button>

              {/* AI Assistant */}
              <button
                onClick={() => {
                  handleNavigateTab("ai", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "ai"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">{t('navAi')}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "اطرح تساؤلات وتلق وعياً وتدبراً ذكياً" : "Ask questions and receive deep, smart reflection"}
                  </div>
                </div>
              </button>

              {/* AI Memorization */}
              <button
                onClick={() => {
                  handleNavigateTab("memo", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "memo"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <BookOpenCheck className="w-4 h-4 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">{t('navMemo')}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "تسميع تفاعلي وتصحيح ذكي بالأصوات" : "Interactive vocal recitation & memorization check"}
                  </div>
                </div>
              </button>

              {/* Wisdom Stories */}
              <button
                onClick={() => {
                  handleNavigateTab("stories", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border relative ${
                  activeTab === "stories"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <div className="text-right">
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    <span>{t('navStories')}</span>
                    <span className="bg-amber-500 text-stone-950 text-[7px] font-black px-1 py-0.2 rounded-full animate-pulse">NEW</span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "اقرأ العِبر والمواعظ التاريخية الكريمة" : "Read ancient chronicles, history and morals"}
                  </div>
                </div>
              </button>

              {/* Bookmarks */}
              <button
                onClick={() => {
                  handleNavigateTab("bookmarks", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "bookmarks"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <BookMarked className="w-4 h-4 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    <span>{t('navBookmarks')}</span>
                    {bookmarks.length > 0 && (
                      <span className="bg-amber-500 text-stone-950 text-[8px] font-black px-1 py-0.2 rounded-full">
                        {bookmarks.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "الآيات المحفوظة لسرعة الرجوع إليها" : "Saved verses for quick future navigation"}
                  </div>
                </div>
              </button>

              {/* My Downloads Offline */}
              <button
                onClick={() => {
                  handleNavigateTab("downloads", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "downloads"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <Download className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <div className="text-right">
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    <span>{t('navDownloads')}</span>
                    {downloadedSurahs.length > 0 && (
                      <span className="bg-amber-500 text-stone-950 text-[8px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                        {downloadedSurahs.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "سور القرآن العظيم المحفوظة بالكامل دون إنترنت" : "Fully saved Quran Surahs for complete offline reading"}
                  </div>
                </div>
              </button>

              {/* Hisn Al-Muslim */}
              <button
                onClick={() => {
                  handleNavigateTab("hisn", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "hisn"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <Compass className="w-4 h-4 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">حصن المسلم</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "الأدعية والأوراد المأثورة والتحصينات" : "Uplifting daily sunnah protection prayers"}
                  </div>
                </div>
              </button>

              {/* Personal Duas/Supplications section */}
              <button
                onClick={() => {
                  handleNavigateTab("duas", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "duas"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <Heart className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">{isAr ? "قسم الأدعية والأوراد 🤲" : "Personal Supplications 🤲"}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "بوابة الأذكار والأدعية وكتابة تضرعاتك الخاصة" : "Review pre-loaded & write custom holy prayers"}
                  </div>
                </div>
              </button>

              {/* Azkar & Supplications */}
              <button
                onClick={() => {
                  handleNavigateTab("azkar", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "azkar"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <Smile className="w-4 h-4 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">{t('navAzkar')}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "أذكار الصباح والمساء والتسابيح والعداد" : "Morning and evening daily pure supplications"}
                  </div>
                </div>
              </button>

              {/* Stats & Progress */}
              <button
                onClick={() => {
                  handleNavigateTab("stats", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "stats"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-800 text-stone-300 hover:text-amber-500"
                }`}
              >
                <Activity className="w-4 h-4 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">{t('navStats')}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "متابعة أوراد القراءة ومعدل حفظ القرآن" : "View your reading statistics and daily goals"}
                  </div>
                </div>
              </button>

              {/* Support Us / Donation */}
              <button
                onClick={() => {
                  handleNavigateTab("donation", true);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border ${
                  activeTab === "donation"
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-500"
                    : "bg-stone-950/40 border-stone-850 hover:border-stone-850 text-stone-300 hover:text-amber-400"
                }`}
              >
                <Info className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <div className="text-right">
                  <div className="text-xs font-extrabold">{t('navDonation')}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {isAr ? "تعرف على أهداف ومميزات هذه البوابة المباركة" : "Learn about the mission and features of our platform"}
                  </div>
                </div>
              </button>

              {/* Emergency Support and Help Center inside mobile Drawer */}
              <button
                onClick={() => {
                  setIsSupportCenterOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border bg-red-950/20 border-red-500/30 hover:border-red-500/55 text-stone-200 hover:text-red-400"
              >
                <div className="relative">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-black">{isAr ? "مركز الدعم والمساعدة 🚨" : "Urgent Support Center 🚨"}</div>
                  <div className="text-[10px] text-stone-500 font-bold leading-normal">
                    {isAr ? "الإبلاغ عن أخطاء تفسيرية وعقائدية أو تقنية في الفترات المفصلية" : "Immediate reporting on textual, doctrinal, or technical issues"}
                  </div>
                </div>
              </button>

              {/* PWA installation trigger inside the drawer - ONLY if not installed yet */}
              {!isAppInstalled && (
                <button
                  onClick={() => {
                    setIsInstallModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 mt-1 rounded-xl flex items-center gap-3 transition-all text-right cursor-pointer border bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/30 hover:border-amber-500/55 text-amber-500 hover:text-amber-400"
                >
                  <Smartphone className="w-4 h-4 flex-shrink-0 text-amber-500 animate-pulse" />
                  <div className="text-right">
                    <div className="text-xs font-black">{isAr ? "تثبيت التطبيق على الشاشه 📲" : "Install Web App on Home Screen 📲"}</div>
                    <div className="text-[10px] text-stone-400 font-medium font-sans">
                      {isAr ? "تصفح الأوراد والأذكار أوفلاين بسرعة فائقة" : "Download the web app shortcut for fast load speeds"}
                    </div>
                  </div>
                </button>
              )}

            </div>

            {/* Footer of the Drawer */}
            <div className="mt-auto pt-4 border-t border-stone-800 text-center text-[10px] text-stone-500 font-sans">
              منصة المساعد القرآني الذكي
              <div className="mt-1 text-[9px] text-stone-600">v1.2.5 • 2026</div>
            </div>
          </div>
        </div>
      )}

      {/* Main body canvas */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-8">
        


        {/* Conditional state routing layout triggers */}
        {selectedSurah ? (
          
          /* Active Surah reader session */
          <SurahReader
            surahNumber={selectedSurah.number}
            surahName={selectedSurah.name}
            totalAyahs={selectedSurah.numberOfAyahs}
            onBackToIndex={() => { setSelectedSurah(null); setInitialScrollToVerse(undefined); setIsFocusReadingMode(false); }}
            onPlayVerse={handlePlayVerse}
            onStopPlay={handleStopPlay}
            isPlaying={isPlaying}
            currentPlayingVerse={currentPlayingVerse}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onTriggerAIPonder={handleTriggerAIPonder}
            initialScrollToVerse={initialScrollToVerse}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onChangeSurah={handleChangeSurah}
            isFocusReadingMode={isFocusReadingMode}
            onToggleFocusReadingMode={() => setIsFocusReadingMode(!isFocusReadingMode)}
            onNavigateToStory={(storyId) => {
              setSelectedStoryId(storyId);
              setActiveTab("stories");
            }}
            downloadedSurahs={downloadedSurahs}
            downloadingStates={downloadingStates}
            onDownloadSurah={handleDownloadSurah}
            onRemoveDownloadedSurah={handleRemoveDownloadedSurah}
            activeReciter={activeReciter}
          />

        ) : activeTab === "index" ? (
          
          /* HOME LANDING: Surah Grid Index */
          <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-300">
            
            {/* Random Daily Verse Card */}
            <div id="daily-verse-banner" className={`bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5 ${isAr ? "text-right border-r-4 border-r-amber-500" : "text-left border-l-4 border-l-amber-500"}`}>
              <div className="flex-1 w-full text-right" dir="rtl">
                <span className={`text-[10px] bg-amber-600/10 border border-amber-600/30 text-amber-500 px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1 w-fit ${isAr ? "ml-auto" : "mr-auto"}`}>
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t('homeDailyVerseTitle')}</span>
                </span>
                
                <h3 className="text-xl md:text-2xl font-quran font-bold text-stone-100 mt-3.5 leading-relaxed text-right" dir="rtl">
                  « {dailyVerse.text} »
                </h3>
                <p className="text-xs text-amber-550 font-sans font-semibold mt-1 text-right">
                  ـ {dailyVerse.reference}
                </p>
                <p className="text-xs text-[#a0a0a0] font-sans mt-2 italic leading-relaxed text-right">
                  {isAr ? `معناها الميسَّر: ${dailyVerse.meaning}` : `English Translation: ${dailyVerse.meaning}`}
                </p>
              </div>

              <div className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setInputTextFromVerse(); // triggers AI chatbot with this verse prefilled
                  }}
                  className="w-full md:w-auto px-4 py-3 md:py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs font-sans flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                  <span>{t('homeDailyVersePonderBtn')}</span>
                </button>
              </div>
            </div>

            {/* AI Recommended Related Verses horizontal panel */}
            <div className="w-full bg-stone-900/60 border border-stone-800/75 rounded-3xl p-4 md:p-5 -mt-3 md:-mt-4">
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-1.5 mb-1 md:mb-3.5 ${isAr ? "text-right md:flex-row-reverse" : "text-left md:flex-row"}`}>
                <div className={`flex items-center justify-between w-full md:w-auto gap-2 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex items-center gap-1.5 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <h4 className="text-xs font-black text-amber-500 font-sans tracking-wide">
                      {t('homeDailyRelatedVerses')}
                    </h4>
                  </div>
                  
                  {/* Collar toggle for mobile/desktop to save vertical space */}
                  <button
                    onClick={() => setIsReflectionExpanded(!isReflectionExpanded)}
                    className="md:hidden px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-[10px] font-bold text-amber-500 transition-all border border-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isReflectionExpanded ? (isAr ? "إخفاء التفاصيل" : "Hide") : (isAr ? "عرض المقترحات 💡" : "Show suggestions 💡")}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isReflectionExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
                
                <span className="hidden md:inline text-[10px] text-[#a0a0a0] font-sans leading-relaxed">
                  {t('homeDailyRelatedTip')}
                </span>
              </div>

              {/* Render either always on desktop, or under expanded state on mobile */}
              <div className={`transition-all duration-300 md:block ${isReflectionExpanded ? "block mt-3" : "hidden md:mt-0"}`}>
                {/* Horizontal Scroll Bar of items */}
                <div className="flex items-stretch gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                  {relatedVersesMap[dailyVerseIndex]?.map((val, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleJumpToSearchResults(val.surahNumber, val.verseNumber)}
                      className="flex-1 min-w-[260px] md:min-w-[300px] bg-stone-950/45 hover:bg-stone-950/80 border border-stone-850/60 hover:border-amber-500/30 rounded-2xl p-4 text-right flex flex-col justify-between gap-4 text-right hover:shadow-lg transition-all group cursor-pointer duration-200"
                    >
                      <p className="text-xs md:text-sm font-quran text-stone-200 group-hover:text-amber-500 leading-relaxed text-right line-clamp-2 w-full" dir="rtl">
                        « {val.text} »
                      </p>
                      <div className={`w-full flex items-center justify-between gap-2 text-[10px] border-t border-stone-900/80 pt-2.5 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="font-extrabold text-amber-500/80 font-sans">
                          {isAr ? `${val.surahNameAr}: ${val.verseNumber}` : `${val.surahNameEn}: Ayah ${val.verseNumber}`}
                        </span>
                        <span className="text-stone-400 group-hover:text-amber-500 flex items-center gap-1 font-sans font-bold">
                          <span>{isAr ? "تلاوة وتفسير" : "Recite & Ponder"}</span>
                          <ArrowLeft className={`w-3 h-3 group-hover:-translate-x-1 transition-transform ${isAr ? "" : "rotate-180"}`} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* NEW: last read resume banner */}
            {lastRead && (
              <div 
                id="resume-reading-container"
                onClick={() => handleResumeReading(lastRead.surahNumber, lastRead.verseNumber)}
                className={`bg-stone-900 hover:bg-stone-900/90 border border-amber-600/25 hover:border-amber-500/40 p-4 sm:p-5 rounded-3xl cursor-pointer shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 group ${
                  isAr ? "text-right border-r-4 border-r-amber-500" : "text-left border-l-4 border-l-amber-500"
                }`}
              >
                {/* Visual accent circles */}
                <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-amber-500/5 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-amber-500/5 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

                <div className={`flex items-center gap-3.5 w-full sm:w-auto ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>
                  
                  <div className={isAr ? "text-right" : "text-left"}>
                    <span className="text-[10px] bg-amber-600/15 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold font-sans">
                      {isAr ? "آخر ما قرأت 📖" : "Last Read Position 📖"}
                    </span>
                    <h3 className="text-sm font-extrabold text-stone-100 mt-2 font-sans tracking-tight">
                      {isAr 
                        ? `سورة ${lastRead.surahName} (الآية رقم ${lastRead.verseNumber})` 
                        : `Surah ${lastRead.surahName} (Verse #${lastRead.verseNumber})`}
                    </h3>
                    <p className="text-[10px] text-stone-450 mt-1 font-sans font-medium">
                      {isAr 
                        ? `انقر هنا للعودة فوراً وتكملة قراءتك المباركة` 
                        : `Click to resume reading and stay continuous`}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center gap-2 justify-end self-end sm:self-auto">
                    <span className="text-[11px] font-sans font-extrabold text-[#c49a6c] flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                      <span>{isAr ? "استكمال التلاوة" : "Resume Recitation"}</span>
                      <ArrowLeft className={`w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform ${isAr ? "" : "rotate-180"}`} />
                    </span>
                </div>
              </div>
            )}

            {/* Search Tab Switchers Selector */}
            <div className={`flex items-center justify-center md:justify-end gap-2 border-b border-stone-850 pb-4 select-none ${isAr ? "flex-row-reverse" : "flex-row"}`}>
              <button
                onClick={() => setSearchType("surah")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                  searchType === "surah"
                    ? "bg-amber-600 border border-amber-550 text-stone-950 font-bold"
                    : "bg-stone-900 border-stone-850 text-stone-450 hover:text-stone-300"
                }`}
              >
                ۞ {t('homeSearchTabSurah')}
              </button>
              <button
                onClick={() => setSearchType("verse")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                  searchType === "verse"
                    ? "bg-amber-600 border border-amber-550 text-stone-950 font-bold"
                    : "bg-stone-900 border-stone-850 text-stone-450 hover:text-stone-300"
                }`}
              >
                🔎 {t('homeSearchTabVerse')}
              </button>
            </div>

            {searchType === "surah" ? (
              <>
                {/* Indexes header and Search Input */}
                <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-800 pb-5 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={isAr ? "text-right" : "text-left"}>
                    <h2 className="text-lg font-extrabold text-amber-500 font-sans">{t('homeSurahsHeader')}</h2>
                    <p className="text-xs text-stone-400 font-sans mt-0.5">{t('homeSurahsSub')}</p>
                  </div>

                  {/* Instant Search Bar */}
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('homeSearchPlaceholder')}
                      className={`w-full bg-stone-900 border border-stone-800 rounded-2xl py-2.5 text-xs font-sans text-stone-100 placeholder-stone-500 outline-none focus:border-amber-500 shadow-sm transition-colors ${
                        isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                      }`}
                      dir={dir}
                    />
                    <Search className={`w-4 h-4 text-stone-550 absolute top-1/2 -translate-y-1/2 ${isAr ? "right-3.5" : "left-3.5"}`} />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-stone-450 font-sans font-bold hover:text-stone-250 cursor-pointer ${isAr ? "left-3" : "right-3"}`}
                      >
                        {t('homeClearBtn')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Surah cards Grid container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredSurahs.map((surah) => (
                    <div
                      key={surah.number}
                      onClick={() => setSelectedSurah(surah)}
                      className={`bg-stone-900 border border-stone-800/80 rounded-2xl p-4 hover:border-amber-500/40 hover:shadow-xl shadow-sm hover:shadow-stone-950/20 transition-all duration-300 cursor-pointer flex items-center justify-between group select-none relative overflow-hidden ${
                        isAr ? "flex-row-reverse text-right" : "flex-row text-left"
                      }`}
                    >
                      {/* Subtle hover gradient index glow backdrop */}
                      <div className="absolute inset-0 bg-gradient-to-l from-amber-600/0 to-stone-800/0 group-hover:from-amber-600/5 group-hover:to-stone-800/10 pointer-events-none transition-all duration-300"></div>

                      <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Golden decorative Islamic octagon with Surah Number inside */}
                        <div className="w-10 h-10 rounded-xl bg-stone-850 group-hover:bg-amber-600/10 text-stone-450 group-hover:text-amber-500 font-bold font-sans text-xs flex items-center justify-center shrink-0 border border-stone-800 transition">
                          {surah.number}
                        </div>

                        <div className={isAr ? "text-right" : "text-left"}>
                          <h4 className="text-sm font-extrabold text-stone-100 font-sans group-hover:text-amber-500 transition">
                            {isAr ? `سورة ${surah.name}` : `${surah.englishName} (Surah)`}
                          </h4>
                          <p className="text-[10px] uppercase text-stone-450 font-sans tracking-tight mt-0.5">
                            {surah.englishName}
                          </p>
                        </div>
                      </div>

                      <div className={`font-sans shrink-0 ${isAr ? "text-left flex flex-col items-end gap-1.5" : "text-right flex flex-col items-end gap-1.5"}`}>
                        <span className="text-[9px] bg-amber-600/10 text-amber-500 font-bold px-2 py-0.5 rounded-md border border-amber-500/20">
                          {isAr ? surah.arabicType : (surah.arabicType === 'مكية' ? 'Meccan' : 'Medinan')}
                        </span>
                        
                        {/* Dynamic Offline Download Action on Card */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {downloadedSurahs.includes(surah.number) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDownloadedSurah(surah.number, surah.name);
                              }}
                              className="p-1 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                              title={isAr ? "محفوظة أوفلاين - انقر لحذف الملف" : "Saved Offline - Click to delete"}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          ) : downloadingStates[surah.number] ? (
                            <div className="p-1 rounded-lg bg-stone-850 border border-stone-800 text-amber-500">
                              <span className="block w-3 h-3 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            isOnline && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadSurah(surah.number, surah.name);
                                }}
                                className="p-1 rounded-lg bg-stone-850 hover:bg-amber-600 hover:text-stone-950 text-stone-400 border border-stone-800 hover:border-amber-550/25 transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                                title={t('downloadBtn')}
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )
                          )}
                          <span className="text-[10px] text-stone-400 font-sans font-medium">
                            {surah.numberOfAyahs} {t('ayahWord')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredSurahs.length === 0 && (
                  <div className="p-16 text-center bg-stone-900 border border-stone-800 rounded-3xl text-stone-400 text-xs font-sans">
                    {t('homeNoSurahsFound')}
                  </div>
                )}
              </>
            ) : (
              /* COMPREHENSIVE ADVANCED QURANIC VERSE SEARCH ENGINE PANELS */
              <div className={`flex flex-col gap-6 animate-in fade-in duration-300 ${isAr ? "text-right" : "text-left"}`}>
                
                <div className={isAr ? "text-right" : "text-left"}>
                  <h2 className="text-lg font-extrabold text-amber-500 font-sans">{t('searchHeader')}</h2>
                  <p className="text-xs text-stone-400 font-sans mt-0.5">{t('searchSubtitle')}</p>
                </div>

                {/* Double dynamic search submission form wrapper */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteVerseSearch();
                  }}
                  className={`flex flex-col sm:flex-row gap-2.5 w-full ${isAr ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={verseSearchQuery}
                      onChange={(e) => setVerseSearchQuery(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className={`w-full bg-stone-900 border border-stone-800 rounded-2xl py-3 text-xs font-sans text-stone-100 placeholder-stone-500 outline-none focus:border-amber-500 shadow-inner transition-colors ${
                        isAr ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                      }`}
                      dir={dir}
                    />
                    <Search className={`w-4 h-4 text-stone-550 absolute top-1/2 -translate-y-1/2 ${isAr ? "right-4" : "left-4"}`} />
                    {verseSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setVerseSearchQuery("");
                          setVerseSearchResults([]);
                          setVerseSearchError(null);
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-amber-500 font-sans font-bold cursor-pointer hover:text-amber-400 ${isAr ? "left-3.5" : "right-3.5"}`}
                      >
                        {t('searchClear')}
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={verseSearchLoading}
                    className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-505 disabled:opacity-55 text-stone-950 font-black text-xs font-sans transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>{verseSearchLoading ? t('searchSearching') : t('searchButton')}</span>
                  </button>
                </form>

                {/* Spinning loading indicator */}
                {verseSearchLoading && (
                  <div className="p-16 flex flex-col items-center justify-center bg-stone-900 border border-stone-850 rounded-3xl">
                    <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-xs text-stone-450 font-sans mt-3.5">{t('searchLoadingText')}</p>
                  </div>
                )}

                {/* Custom verseSearchResults Error fallback banner */}
                {verseSearchError && !verseSearchLoading && (
                  <div className="p-8 text-center bg-amber-600/5 border border-amber-500/10 rounded-2xl text-stone-300 text-xs font-sans">
                    {verseSearchError}
                  </div>
                )}

                {/* Mapping results */}
                {verseSearchResults.length > 0 && !verseSearchLoading && (
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] text-stone-400 font-sans">
                      ۞ {t('searchResultsCount').replace("{count}", String(verseSearchResults.length))}
                    </span>
                    
                    <div className="flex flex-col gap-3.5">
                      {verseSearchResults.map((res: any, index: number) => {
                        return (
                          <div
                            key={index}
                            className={`bg-stone-900 border border-stone-850 rounded-3xl p-5 md:p-6 transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${isAr ? "text-right" : "text-left"}`}
                          >
                            <div className={`flex items-center justify-between border-b border-stone-850/60 pb-3 block sm:flex ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                              <div className={`flex flex-wrap items-center gap-1.5 ${isAr ? "justify-end" : "justify-start"}`}>
                                <span className="text-[10px] font-extrabold font-sans bg-amber-600/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full">
                                  {t('searchResultSurah')} {isAr ? res.surah.name : res.surah.englishName}
                                </span>
                                <span className="text-[10px] font-extrabold font-sans bg-stone-950 border border-stone-850 text-stone-400 px-2.5 py-1 rounded-full">
                                  {t('searchResultAyah')} {res.numberInSurah}
                                </span>
                              </div>
                              <span className="text-[9px] text-[#c49a6c] font-sans font-bold leading-normal block mt-1 sm:mt-0">
                                {t('searchResultRef')} {res.surah.englishName} ({res.surah.number}:{res.numberInSurah})
                              </span>
                            </div>

                            <div className="py-2">
                              {res.predictionExplanation && (
                                <div className={`mb-3.5 flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-stone-300 text-[10px] font-medium font-sans ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                                  <span className="leading-relaxed">
                                    {isAr ? `توقع ذكي ومطابقة موضوعية: ${res.predictionExplanation}` : `Smart prediction & match-making: ${res.predictionExplanation}`}
                                  </span>
                                </div>
                              )}
                              <p className="text-stone-100 text-base md:text-lg font-quran leading-relaxed text-right font-medium leading-loose" dir="rtl">
                                « {res.text} »
                              </p>
                            </div>

                            <div className={`flex flex-col sm:flex-row items-center gap-2 mt-2 w-full justify-start ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                              <button
                                onClick={() => handleJumpToSearchResults(res.surah.number, res.numberInSurah)}
                                className="px-5 py-2.5 rounded-xl border border-amber-500/35 hover:bg-amber-600 hover:text-stone-950 text-amber-500 text-xs font-black font-sans transition-all active:scale-95 w-full sm:w-auto text-center cursor-pointer"
                              >
                                {t('searchResultReadBtn')}
                              </button>
                              
                              <button
                                onClick={() => {
                                  // Pre-fill prompt to ask Gemini about this specific verse
                                  setAIPrefilledVerse({
                                    text: res.text,
                                    verseNumber: res.numberInSurah,
                                    surahName: res.surah.name
                                  });
                                  setActiveTab("ai");
                                }}
                                className="px-5 py-2.5 rounded-xl bg-stone-950 border border-stone-850 hover:bg-stone-850 text-stone-200 text-xs font-extrabold font-sans transition-all active:scale-95 w-full sm:w-auto text-center cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                <span>{t('searchResultInterpretBtn')}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
              </div>
            )}

          </div>

        ) : activeTab === "ai" ? (
          
          /* AI SPIRITUAL BOT ASSISTANT */
          <AIChatBot
            prefilledVerse={aiPrefilledVerse}
            onClearPrefilledVerse={() => setAIPrefilledVerse(null)}
            onOpenCompliance={() => setIsComplianceOpen(true)}
          />

        ) : activeTab === "azkar" ? (
          
          /* REMEMBRANCE & SUBHA DASHBOARD */
          <AzkarDashboard />

        ) : activeTab === "hisn" ? (

          /* HISN AL MUSLIM */
          <HisnAlMuslim />

        ) : activeTab === "stats" ? (

          /* SPIRITUAL STATISTICS PANEL */
          <StatsPanel />

        ) : activeTab === "memo" ? (

          /* AI MEMORIZATION COMPANION & GUIDE */
          <AIMemorizationGateway currentLang={currentLang} />

        ) : activeTab === "duas" ? (

          /* MY CUSTOM & FAVORED DUAS AND PRAYERS */
          <DuasSection />

        ) : activeTab === "donation" ? (

          /* SPONSORSHIP & DONATION DEDICATED VIEW */
          <DonationSection currentLang={currentLang} />

        ) : activeTab === "stories" ? (

          /* HISTORICAL QURANIC STORIES WORKSPACE */
          <QuranicStories
            isAr={isAr}
            trueNightMode={settings.trueNightMode}
            selectedStoryId={selectedStoryId}
            onClearSelectedStory={() => setSelectedStoryId(null)}
            onNavigateToSurah={handleJumpToSearchResults}
          />

        ) : activeTab === "downloads" ? (
          
          /* OFFLINE DOWNLOADS MANAGER PANEL */
          <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 animate-in fade-in duration-300 flex flex-col gap-6">
            <div className={`${isAr ? "text-right" : "text-left"} border-b border-stone-800 pb-5`}>
              <h2 className="text-lg font-extrabold text-amber-500 font-sans flex items-center gap-2.5 justify-start">
                <Download className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>{t('downloadsHeader')}</span>
              </h2>
              <p className="text-xs text-stone-350 font-sans mt-0.5">{t('downloadsSubtitle')}</p>
              
              {/* Online indicator context inside tab */}
              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-sans font-bold ${
                isOnline 
                  ? "bg-emerald-600/10 border border-emerald-500/25 text-emerald-400" 
                  : "bg-amber-600/10 border border-amber-500/25 text-amber-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"}`} />
                <span>
                  {isOnline 
                    ? (isAr ? "متصل بالشبكة: يمكنك تنزيل المزيد من السور" : "Online: You can download more Surahs") 
                    : (isAr ? "وضع الأوفلاين نشط: تتصفح سورك من جهازك بالكامل" : "Offline mode active: browsing local downloaded Surahs")
                  }
                </span>
              </div>
            </div>

            {/* PWA App Icon Install Container */}
            <PWAInstallGateway
              isAr={isAr}
              deferredPrompt={deferredPrompt}
              isIOS={isIOS}
              onInstallSuccess={() => setIsAppInstalled(true)}
            />

            {/* Complete 114 Surahs offline installer block */}
            <FullQuranDownloader
              isAr={isAr}
              isOnline={isOnline}
              activeReciter={activeReciter}
              downloadedSurahs={downloadedSurahs}
              onDownloadComplete={(newList) => setDownloadedSurahs(newList)}
              triggerToast={triggerToast}
            />

            {downloadedSurahs.length === 0 ? (
              <div className="p-16 text-center bg-stone-900 border border-stone-850 rounded-3xl text-stone-400 text-xs font-sans flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 border border-stone-750">
                  <Download className="w-5 h-5 text-stone-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-300 leading-normal">{t('downloadNoItems')}</p>
                  <p className="text-[11px] text-stone-550 mt-1">
                    {isAr 
                      ? "اذهب إلى شاشة المصحف، انقر على السورة التي تريدها ثم استخدم زر التنزيل السريع لحفظها كاملة لمطالعتها في أي لحظة." 
                      : "Navigate to any Surah from the index catalog, and hit the download button to preserve it forever."
                    }
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("index")}
                  className="px-4 py-2 mt-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs rounded-xl font-sans transition-all active:scale-95 cursor-pointer"
                >
                  {isAr ? "الانتقال إلى فهرس السور ۞" : "Go to Surah Index ۞"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {surahList
                  .filter((s) => downloadedSurahs.includes(s.number))
                  .map((surah) => (
                    <div
                      key={surah.number}
                      className="bg-stone-900 border border-stone-800/80 rounded-2xl p-4 hover:border-amber-500/35 transition-all duration-300 flex items-center justify-between group select-none relative overflow-hidden"
                    >
                      <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"} w-full`}>
                        {/* Num */}
                        <div 
                          onClick={() => setSelectedSurah(surah)}
                          className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-500 font-bold font-sans text-xs flex items-center justify-center shrink-0 border border-amber-500/20 transition cursor-pointer"
                        >
                          {surah.number}
                        </div>

                        <div className={`flex-grow ${isAr ? "text-right" : "text-left"}`}>
                          <h4 
                            onClick={() => setSelectedSurah(surah)}
                            className="text-sm font-extrabold text-stone-100 font-sans group-hover:text-amber-500 transition cursor-pointer"
                          >
                            {isAr ? `سورة ${surah.name}` : `${surah.englishName} (Surah)`}
                          </h4>
                          <div className={`flex items-center gap-2 mt-1.5 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                            <span className="text-[9px] bg-amber-600/10 text-amber-500 font-bold px-1.5 py-0.2 rounded border border-amber-500/10">
                              {isAr ? surah.arabicType : (surah.arabicType === 'مكية' ? 'Meccan' : 'Medinan')}
                            </span>
                            <span className="text-[10px] text-stone-400 font-sans font-medium">
                              {surah.numberOfAyahs} {t('ayahWord')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                          <button
                            onClick={() => setSelectedSurah(surah)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-[11px] font-sans transition-all active:scale-95 cursor-pointer shadow-md select-none"
                          >
                            {isAr ? "قراءة 📖" : "Read 📖"}
                          </button>
                          
                          <button
                            onClick={() => handleRemoveDownloadedSurah(surah.number, surah.name)}
                            className="p-1.5 rounded-xl text-stone-500 hover:text-red-500 hover:bg-stone-850 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            title={t('downloadRemove')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

        ) : (
          
          /* SAVED VERSE BOOKMARKS PANELS */
          <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 animate-in fade-in duration-300">
            <div className={`${isAr ? "text-right" : "text-left"} mb-6`}>
              <h2 className="text-lg font-extrabold text-amber-500 font-sans">{t('bookmarksHeader')}</h2>
              <p className="text-xs text-stone-400 font-sans mt-0.5">{t('bookmarksSubtitle')}</p>
            </div>

            {bookmarks.length === 0 ? (
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-16 text-center shadow-md max-w-md mx-auto">
                <BookBookmarkedFallback currentLang={currentLang} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className={`bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group flex flex-col gap-3.5 ${isAr ? "text-right" : "text-left"}`}
                  >
                    <div className={`flex items-center justify-between border-b border-stone-800 pb-2.5 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-500 bg-amber-600/10 border border-amber-500/20 px-2 py-0.5 rounded-lg font-sans">
                          {isAr ? `سورة ${bm.surahName}` : bm.surahName} • {isAr ? `الآية ${bm.verseNumber}` : `Ayah ${bm.verseNumber}`}
                        </span>
                        <span className="text-[9px] text-stone-450 font-sans">
                          {t('bookmarksSubInfo')} {bm.addedAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleJumpToBookmarkedVerse(bm)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-amber-600 hover:bg-amber-700 text-stone-950 font-extrabold font-sans flex items-center gap-1 transition cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>{t('bookmarksBrowseBtn')}</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteBookmarkDirectly(bm.id)}
                          className="p-1.5 rounded-lg border border-transparent hover:border-rose-900/60 text-stone-400 hover:text-rose-400 hover:bg-rose-950/25 transition cursor-pointer"
                          title={t('bookmarksDeleteTitle')}
                        >
                          <Trash2Icon />
                        </button>
                      </div>
                    </div>

                    <p className="text-stone-100 font-bold font-quran text-lg leading-relaxed pr-1 text-right" dir="rtl">
                      « {bm.verseText} »
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        )}
      </main>

      {/* Floating Audio Playback Controls bar docked at bottom */}
      <AudioPlayer
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentPlayingVerse={currentPlayingVerse}
        onNextVerse={handleNextVerse}
        onPrevVerse={handlePrevVerse}
        activeReciter={activeReciter}
        setActiveReciter={setActiveReciter}
        isFocusReadingMode={isFocusReadingMode}
        onClose={() => {
          setIsPlaying(false);
          setCurrentPlayingVerse(null);
        }}
      />

      {/* Download Options and Progress Overlay Modal */}
      {downloadModalData && (
        <div id="download-workflow-modal" className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl relative overflow-hidden text-right leading-relaxed" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-4 mb-4 flex-row-reverse">
              <h3 className="text-base font-extrabold text-amber-500 font-sans flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-500" />
                <span>خيارات الحفظ الاحتياطي أوفلاين</span>
              </h3>
              <button 
                onClick={() => {
                  if (!isCurrentlyDownloading) {
                    setDownloadModalData(null);
                  }
                }}
                className={`p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-all ${isCurrentlyDownloading ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={isCurrentlyDownloading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {!isCurrentlyDownloading ? (
              <>
                <div className="mb-4 text-xs text-stone-300">
                  <p>أنت على وشك تنزيل سورة <span className="font-extrabold text-amber-500">{downloadModalData.surahNameStr}</span> ({downloadModalData.numberOfAyahs} آية) على هاتف أو متصفحك مباشرة.</p>
                  <p className="mt-2 text-stone-400 text-[11px]">الرجاء اختيار نوع وحجم التنزيل المناسب لك للتمتع بتجربة قراءة مريحة أوفلاين دون إنترنت:</p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Option 1: Text & Tafsir only */}
                  <button
                    onClick={() => executeActualDownload(downloadModalData.surahNumber, downloadModalData.surahNameStr, false)}
                    className="w-full text-right p-3.5 rounded-2xl border border-stone-850 hover:border-amber-500/30 bg-stone-950/45 hover:bg-amber-600/5 transition-all group flex items-start gap-3.5 cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-stone-100 group-hover:text-amber-500 transition-colors">قراءة وتفسير وتراجم فقط</h4>
                      <p className="text-[10px] text-stone-400 mt-1 leading-normal">تنزيل آيات السورة، التفسير بالكامل والتراجم الإنجليزية بالرسم العثماني. حجم تنزيل صغير جداً (أقل من 200 كيلوبايت) ويتم بلحظة واحدة.</p>
                    </div>
                  </button>

                  {/* Option 2: Full download (Text + Audio) */}
                  <button
                    onClick={() => executeActualDownload(downloadModalData.surahNumber, downloadModalData.surahNameStr, true)}
                    className="w-full text-right p-3.5 rounded-2xl border border-stone-850 hover:border-emerald-500/30 bg-stone-950/45 hover:bg-emerald-600/5 transition-all group flex items-start gap-3.5 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-stone-100 group-hover:text-emerald-400 transition-colors">كاملة مع الاستماع الصوتي والمشايخ</h4>
                      <p className="text-[10px] text-stone-400 mt-1 leading-normal">تشمل النصوص والتفسير + تلاوة صوتية خاشعة لجميع آيات السورة بصوت <span className="text-emerald-400 font-bold">{activeReciter.name}</span>. الحجم ملائم بالكامل (~{Math.round(downloadModalData.numberOfAyahs * 0.05)} - {Math.round(downloadModalData.numberOfAyahs * 0.09)} ميجابايت).</p>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-amber-600/20 border-t-amber-500 rounded-full animate-spin"></div>
                  <Download className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
                
                <h4 className="text-sm font-extrabold text-stone-200">جاري تنزيل السورة وحفظها أوفلاين...</h4>
                
                {downloadWithAudio && (
                  <div className="w-full mt-4 bg-stone-950 p-3.5 rounded-2xl border border-stone-850">
                    <div className="flex justify-between text-[11px] text-stone-400 font-sans font-bold flex-row-reverse mb-1.5">
                      <span>القارئ: {activeReciter.name}</span>
                      <span>{downloadAudioProgress.current} / {downloadAudioProgress.total} آية</span>
                    </div>
                    {/* Progress bar container */}
                    <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(downloadAudioProgress.current / (downloadAudioProgress.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-[10.5px] text-stone-500 mt-2">يرجى عدم إغلاق هذه الشاشة ريثما يتم جلب الملفات الصوتية بأمان إلى ذاكرة التخزين المحلية للمتصفح.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating share/copy/download dynamic Toast notification */}
      {toast && toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none w-max max-w-[90vw]">
          <div className="bg-stone-900 border border-amber-500/30 text-amber-400 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-sans text-xs sm:text-sm font-bold select-none backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span className="leading-normal text-stone-200 text-center">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Floating Scroll To Top Button */}
      <ScrollToTop currentLang={currentLang} />

      {/* Interactive Floating Quranic Devotion In-App Notification Toast */}
      {inAppReminder && inAppReminder.show && (
        <div className="fixed top-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-top-6 duration-300 pointer-events-auto">
          <div className="bg-amber-500 text-stone-950 p-4 rounded-3xl shadow-2xl border border-amber-400 font-sans flex flex-col gap-3">
            <div className="flex items-start justify-between flex-row">
              <div className="flex items-center gap-2 flex-row">
                <Bell className="w-5 h-5 shrink-0 animate-bounce" />
                <span className="font-extrabold text-xs sm:text-sm tracking-wide leading-none">{inAppReminder.title}</span>
              </div>
              <button
                onClick={() => setInAppReminder(null)}
                className="p-1 rounded-lg hover:bg-stone-950/10 text-stone-950 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed opacity-95">
              {inAppReminder.body}
            </p>
            <div className="flex items-center gap-2 mt-1 self-end flex-row">
              <button
                onClick={() => {
                  setInAppReminder(null);
                  setActiveTab("index");
                  setTimeout(() => {
                    const element = document.getElementById("daily-verse-banner");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 150);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-stone-950 text-amber-500 font-bold text-[10px] sm:text-xs transition hover:bg-stone-900 active:scale-95 cursor-pointer shadow-md"
              >
                {isAr ? "اقرأ ورد اليوم ۞" : "Read Today's Portion ۞"}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* User Settings and Accessibility Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenCompliance={() => {
          setIsSettingsOpen(false);
          setIsComplianceOpen(true);
        }}
      />

      {/* Support Center and Urgent Reporting Modal */}
      <SupportCenterModal
        isOpen={isSupportCenterOpen}
        onClose={() => setIsSupportCenterOpen(false)}
        isAr={isAr}
        userEmail="hamzaalomari079@gmail.com"
      />


      {/* Compliance and Sharia Legal Modal */}
      <ComplianceModal
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
        isAr={isAr}
        onOpenSupport={() => setIsSupportCenterOpen(true)}
      />

      {/* 3. Detailed PWA Installer instruction modal overlay */}
      {isInstallModalOpen && (
        <PWAInstallGateway
          isAr={isAr}
          deferredPrompt={deferredPrompt}
          isIOS={isIOS}
          showAsModalOnly={true}
          onClose={() => setIsInstallModalOpen(false)}
          onInstallSuccess={() => {
            setIsAppInstalled(true);
            setIsInstallModalOpen(false);
          }}
        />
      )}

      {/* Floating native Mobile Bottom Tab Navigation Bar for decluttering */}
      {!isFocusReadingMode && (
        <div id="mobile-bottom-tabs" className="md:hidden fixed bottom-1.5 left-2 right-2 sm:left-4 sm:right-4 z-40 bg-[#161412]/95 backdrop-blur-lg border border-stone-800/80 p-2 rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] flex items-center justify-around gap-0.5 select-none animate-in slide-in-from-bottom-3 duration-300">
          <button
            onClick={() => {
              handleNavigateTab("index");
            }}
            className={`flex-1 flex flex-col items-center gap-1.5 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "index" ? "text-amber-500 font-bold scale-102 animate-pulse" : "text-stone-450 hover:text-stone-300"
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span className="text-[9px] font-sans font-semibold tracking-wide">{isAr ? "المصحف" : "Quran"}</span>
          </button>

          <button
            onClick={() => {
              handleNavigateTab("memo");
            }}
            className={`flex-1 flex flex-col items-center gap-1.5 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "memo" ? "text-amber-500 font-bold scale-102" : "text-stone-450 hover:text-stone-300"
            }`}
          >
            <BookOpenCheck className="w-4.5 h-4.5" />
            <span className="text-[9px] font-sans font-semibold tracking-wide">{isAr ? "التسميع" : "Memo"}</span>
          </button>

          <button
            onClick={() => {
              handleNavigateTab("ai");
            }}
            className={`flex-1 flex flex-col items-center gap-1.5 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "ai" ? "text-amber-500 font-bold scale-102" : "text-stone-450 hover:text-stone-300"
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[9px] font-sans font-semibold tracking-wide">{isAr ? "المساعد" : "AI Helper"}</span>
          </button>

          <button
            onClick={() => {
              handleNavigateTab("bookmarks");
            }}
            className={`flex-1 flex flex-col items-center gap-1.5 py-1 px-1.5 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "bookmarks" ? "text-amber-500 font-bold scale-102" : "text-stone-450 hover:text-stone-300"
            }`}
          >
            <div className="relative">
              <BookMarked className="w-4.5 h-4.5" />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-stone-950 text-[8px] font-bold px-1 py-0.2 rounded-full leading-none flex items-center justify-center min-w-3.5 h-3.5 shadow-md">
                  {bookmarks.length}
                </span>
              )}
            </div>
            <span className="text-[9px] font-sans font-semibold tracking-wide">{isAr ? "المحفوظات" : "Saved"}</span>
          </button>

          <button
            onClick={() => {
              handleNavigateTab("downloads");
            }}
            className={`flex-1 flex flex-col items-center gap-1.5 py-1 px-1.5 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "downloads" ? "text-amber-500 font-bold scale-102" : "text-stone-450 hover:text-stone-300"
            }`}
          >
            <div className="relative">
              <Download className="w-4.5 h-4.5" />
              {downloadedSurahs.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-stone-950 text-[8px] font-bold px-1 py-0.2 rounded-full leading-none flex items-center justify-center min-w-3.5 h-3.5 shadow-md">
                  {downloadedSurahs.length}
                </span>
              )}
            </div>
            <span className="text-[9px] font-sans font-semibold tracking-wide">{isAr ? "التنزيلات" : "Offline"}</span>
          </button>
        </div>
      )}

    </div>
    </>
  );

  // Helper inside click handlers
  function setInputTextFromVerse() {
    setAIPrefilledVerse({
      text: dailyVerse.text,
      verseNumber: 255, // approximate or exact depending on verse refer
      surahName: "البقرة"
    });
    setActiveTab("ai");
  }
}

// Fallback visual icons
function BookBookmarkedFallback({ currentLang }: { currentLang: string }) {
  const isAr = currentLang === 'ar';
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 bg-stone-850 border border-stone-800 rounded-full flex items-center justify-center mb-4 text-stone-500">
        <BookMarked className="w-6 h-6 text-stone-500" />
      </div>
      <h4 className="text-sm font-bold text-stone-200 font-sans">
        {isAr ? "المحفوظات فارغة" : "No Bookmarks Saved"}
      </h4>
      <p className="text-xs text-stone-450 font-sans leading-relaxed mt-2.5 max-w-xs mx-auto text-balance">
        {isAr 
          ? "أثناء قراءة السور، انقر على أيقونة العلامة المرجعية بجانب الآية لحفظها في هذه الصفحة للرجوع والتدبر السريع لاحقاً."
          : "While reading the Quran, click the bookmark icon next to any verse to save it here for quick reference."}
      </p>
    </div>
  );
}

function Trash2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  );
}
