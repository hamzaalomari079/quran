import React, { useEffect, useState, useRef } from "react";
import { BookOpen, Play, Pause, Bookmark, BookmarkCheck, Search, Sparkles, Type, Eye, EyeOff, LayoutGrid, ChevronLeft, ChevronRight, HelpCircle, Loader, X, Moon, Share2, Copy, Check, Maximize, Minimize, ChevronUp, ChevronDown, Download, Trash2, Wifi, WifiOff, Sliders, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Verse, SurahDetails, Bookmark as BookmarkType, GlobalSettings, Reciter } from "../types";
import { getTranslation, translations } from "../utils/translations";
import { surahList } from "../data/surahData";
import { hasStory, getStoryForVerse } from "../data/storiesData";

interface SurahReaderProps {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  onBackToIndex: () => void;
  onPlayVerse: (verseNum: number) => void;
  onStopPlay: () => void;
  isPlaying: boolean;
  currentPlayingVerse: {
    surahNumber: number;
    verseNumber: number;
  } | null;
  bookmarks: BookmarkType[];
  onToggleBookmark: (verseNumber: number, verseText: string) => void;
  onTriggerAIPonder: (verseText: string, verseNumber: number) => void;
  initialScrollToVerse?: number;
  settings: GlobalSettings;
  onUpdateSettings: (newSettings: Partial<GlobalSettings>) => void;
  onChangeSurah?: (surahNum: number) => void;
  isFocusReadingMode?: boolean;
  onToggleFocusReadingMode?: () => void;
  onNavigateToStory?: (storyId: string) => void;
  downloadedSurahs?: number[];
  downloadingStates?: Record<number, boolean>;
  onDownloadSurah?: (surahNumber: number, surahName: string) => Promise<void>;
  onRemoveDownloadedSurah?: (surahNumber: number, surahName: string) => void;
  activeReciter: Reciter;
}

export default function SurahReader({
  surahNumber,
  surahName,
  totalAyahs,
  onBackToIndex,
  onPlayVerse,
  onStopPlay,
  isPlaying,
  currentPlayingVerse,
  bookmarks,
  onToggleBookmark,
  onTriggerAIPonder,
  initialScrollToVerse,
  settings,
  onUpdateSettings,
  onChangeSurah,
  isFocusReadingMode = false,
  onToggleFocusReadingMode,
  onNavigateToStory,
  downloadedSurahs = [],
  downloadingStates = {},
  onDownloadSurah,
  onRemoveDownloadedSurah,
  activeReciter,
}: SurahReaderProps) {
  const currentLang = settings.language || 'ar';
  const isAr = currentLang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const t = (key: keyof typeof translations['ar']) => {
    return getTranslation(currentLang, key);
  };

  const [surah, setSurah] = useState<SurahDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Offline tracking states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [cachedVerseNumbers, setCachedVerseNumbers] = useState<Set<number>>(new Set());

  const checkIfVerseAudioIsCached = async (verseNum: number) => {
    if (typeof window === 'undefined' || !('caches' in window)) return false;
    const padSurah = String(surahNumber).padStart(3, "0");
    const padAyah = String(verseNum).padStart(3, "0");
    const url = `https://www.everyayah.com/data/${activeReciter.identifier}/${padSurah}${padAyah}.mp3`;
    try {
      const cache = await caches.open("quran_audio_cache");
      const matched = await cache.match(url);
      return !!matched;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    const checkAllCache = async () => {
      if (typeof window === 'undefined' || !('caches' in window)) return;
      try {
        const cache = await caches.open("quran_audio_cache");
        const cachedSet = new Set<number>();
        const padSurah = String(surahNumber).padStart(3, "0");
        
        for (let i = 1; i <= totalAyahs; i++) {
          const padAyah = String(i).padStart(3, "0");
          const url = `https://www.everyayah.com/data/${activeReciter.identifier}/${padSurah}${padAyah}.mp3`;
          const matched = await cache.match(url);
          if (matched) {
            cachedSet.add(i);
          }
        }
        if (active) {
          setCachedVerseNumbers(cachedSet);
        }
      } catch (err) {
        console.warn("Failed to check cached verses:", err);
      }
    };

    checkAllCache();
    return () => {
      active = false;
    };
  }, [surahNumber, activeReciter, downloadingStates, totalAyahs]);

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

  // State for active clicked verse Tafsir Modal
  const [selectedVerseForTafsir, setSelectedVerseForTafsir] = useState<Verse | null>(null);

  // Active verse state for quick navigation highlights
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);
  const lastScrolledVerseRef = useRef<{ surahNumber: number; verseNumber: number } | null>(null);

  // States to retrieve Ayah Context (Abab Al-Nuzul & Story)
  const [verseStory, setVerseStory] = useState<string | null>(null);
  const [loadingStory, setLoadingStory] = useState<boolean>(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  // State to auto load the story/asbab
  const [shouldAutoFetchStory, setShouldAutoFetchStory] = useState<boolean>(false);

  // Reset the loaded story context when opening another verse popup
  useEffect(() => {
    setVerseStory(null);
    setStoryError(null);
    setLoadingStory(false);
    if (selectedVerseForTafsir) {
      setActiveVerse(selectedVerseForTafsir.numberInSurah);
      if (shouldAutoFetchStory) {
        fetchVerseStory(selectedVerseForTafsir);
        setShouldAutoFetchStory(false);
      }
    } else {
      setShouldAutoFetchStory(false);
    }
  }, [selectedVerseForTafsir, shouldAutoFetchStory]);

  const fetchVerseStory = async (verse: Verse) => {
    setLoadingStory(true);
    setStoryError(null);

    if (!isOnline) {
      setStoryError(
        isAr 
          ? "⚠️ عذراً، ميزة أسباب النزول والقصص المتقدمة تتطلب اتصالاً بالإنترنت للاتصال بمرشدك الإيماني الذكي. ولكن يمكنك دائماً قراءة تفسير الجلالين المتوفر أوفلاين كاملاً بأسفل الآية الكريمة دون اتصال!" 
          : "⚠️ Advanced Asbab Al-Nuzul requires an active internet connection. You can still read Tafsir Al-Jalalayn below completely offline!"
      );
      setLoadingStory(false);
      return;
    }

    try {
      const response = await fetch("/api/ai/verse-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surahName,
          surahNumber,
          verseNumber: verse.numberInSurah,
          verseText: verse.text
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        // Fallback if not JSON
      }

      if (!response.ok) {
        throw new Error(data?.error || (isAr ? "فشل الاتصال بالخادم لجلب تفاصيل الآية." : "Server error bringing verse story details."));
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      setVerseStory(data.result);
    } catch (err: any) {
      setStoryError(err.message || (isAr ? "نأسف، تعذر الاتصال بمساعد التفسير والنزول حالياً." : "Failed to load verse context."));
    } finally {
      setLoadingStory(false);
    }
  };

  const handleOpenAsbabAlNuzul = (verse: Verse) => {
    setShouldAutoFetchStory(true);
    setSelectedVerseForTafsir(verse);
  };

  // Fullscreen tracking state and handler for Focus Reading Mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Could not request fullscreen natively:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Could not exit fullscreen natively:", err);
      });
    }
  };

  const handleToggleImmersiveFocusMode = () => {
    const nextMode = !isFocusReadingMode;
    
    // Toggle focus reading mode state
    if (onToggleFocusReadingMode) {
      onToggleFocusReadingMode();
    }
    
    // Enter / Exit Fullscreen natively (Do not override night mode automatically)
    if (nextMode) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Could not request fullscreen natively:", err);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn("Could not exit fullscreen natively:", err);
        });
      }
    }
  };

  // Helper to find next Surah name
  const getNextSurahName = () => {
    const nextS = surahList.find(s => s.number === surahNumber + 1);
    return nextS ? nextS.name : "";
  };

  // Automatically scroll horizontal mobile quick-jump buttons into center view without shifting the whole page
  // and dynamically track user reading progress, saving last read verse and logging page-reads for accurate statistics.
  useEffect(() => {
    if (activeVerse) {
      // Normal mobile quick-jump
      const parent = document.getElementById("mobile-quickjump-container");
      const btn = document.getElementById(`mobile-quickjump-btn-${activeVerse}`);
      if (parent && btn) {
        const btnOffsetLeft = btn.offsetLeft;
        const btnWidth = btn.offsetWidth;
        const parentWidth = parent.offsetWidth;
        const targetScrollLeft = btnOffsetLeft - (parentWidth / 2) + (btnWidth / 2);
        parent.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth"
        });
      }

      // Focus Mode quick-jump
      const parentFocus = document.getElementById("focus-quickjump-container");
      const btnFocus = document.getElementById(`focus-quickjump-btn-${activeVerse}`);
      if (parentFocus && btnFocus) {
        const btnOffsetLeft = btnFocus.offsetLeft;
        const btnWidth = btnFocus.offsetWidth;
        const parentWidth = parentFocus.offsetWidth;
        const targetScrollLeft = btnOffsetLeft - (parentWidth / 2) + (btnWidth / 2);
        parentFocus.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth"
        });
      }

      // --- NEW: Track reading progress & last read verse & dynamic credible stats logging ---
      try {
        // Save globally as last read verse
        localStorage.setItem("quran_app_last_read", JSON.stringify({
          surahNumber,
          surahName,
          verseNumber: activeVerse,
          timestamp: Date.now()
        }));

        // Track highest verse read in this surah for progress calculating
        const savedProgress = localStorage.getItem("quran_app_surah_progress") || "{}";
        const parsed = JSON.parse(savedProgress);
        const currentMax = parsed[surahNumber] || 0;
        if (activeVerse > currentMax) {
          parsed[surahNumber] = activeVerse;
          localStorage.setItem("quran_app_surah_progress", JSON.stringify(parsed));
        }

        // Dynamically log page-reads for actual credible stats
        if (surah && surah.verses && surah.verses[activeVerse - 1]) {
          const activeVerseObj = surah.verses[activeVerse - 1];
          if (activeVerseObj && activeVerseObj.page) {
            const pageNum = activeVerseObj.page;
            const todayStr = new Date().toISOString().split("T")[0];
            const readPagesKey = `quran_app_pages_read_${todayStr}`;
            const readPages = JSON.parse(localStorage.getItem(readPagesKey) || "[]") as string[];
            const pageId = `${surahNumber}_${pageNum}`;
            
            if (!readPages.includes(pageId)) {
              readPages.push(pageId);
              localStorage.setItem(readPagesKey, JSON.stringify(readPages));
              
              const savedLogsStr = localStorage.getItem("quran_app_reading_logs");
              let logs = savedLogsStr ? JSON.parse(savedLogsStr) : [];
              
              const existingIdx = logs.findIndex((log: any) => log.date === todayStr && log.surahNumber === surahNumber);
              if (existingIdx > -1) {
                logs[existingIdx].pagesCount = (logs[existingIdx].pagesCount || 0) + 1;
              } else {
                const newLog = {
                  id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                  date: todayStr,
                  surahNumber: surahNumber,
                  surahName: surahName,
                  pagesCount: 1
                };
                logs.unshift(newLog);
              }
              localStorage.setItem("quran_app_reading_logs", JSON.stringify(logs));
            }
          }
        }
      } catch (err) {
        console.error("Error in reading tracking:", err);
      }
    }
  }, [activeVerse, surah, surahNumber, surahName]);

  // Custom visual configurations
  const [fontSize, setFontSize] = useState<number>(28); // customizable Arabic text size
  const [viewMode, setViewMode] = useState<"continuous" | "page">("continuous");
  const [showTranslations, setShowTranslations] = useState<boolean>(true);
  const [showTafsir, setShowTafsir] = useState<boolean>(settings.autoShowTafsir || false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedVerseId, setCopiedVerseId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);
  const [activeAyahMoreMenu, setActiveAyahMoreMenu] = useState<number | null>(null);

  // Sync autoShowTafsir setting dynamically when updated
  useEffect(() => {
    setShowTafsir(settings.autoShowTafsir);
  }, [settings.autoShowTafsir]);

  const triggerToast = (msg: string) => {
    setToast({ message: msg, show: true });
  };

  useEffect(() => {
    if (toast && toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, show: false } : null));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Clean Bismillah function
  const cleanFirstVerseText = (text: string, verseNum: number) => {
    if (surahNumber === 1 || surahNumber === 9) return text;
    if (verseNum !== 1) return text;

    const bismillahPatterns = [
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
      "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
      "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ",
      "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ"
    ];

    let cleaned = text;
    for (const pattern of bismillahPatterns) {
      if (cleaned.startsWith(pattern)) {
        cleaned = cleaned.substring(pattern.length).trim();
        return cleaned;
      }
    }

    // Secondary robust cleaning for variations of Tashkeel key terms
    if (cleaned.startsWith("بِسْمِ") && (cleaned.includes("الرَّحِيمِ") || cleaned.includes("الرَّحِيمِ") || cleaned.includes("ٱلرَّحِيمِ"))) {
      const tokens = ["الرَّحِيمِ", "الرَّحِيمِ", "ٱلرَّحِيمِ", "الرحيم"];
      for (const t of tokens) {
        const idx = cleaned.indexOf(t);
        if (idx !== -1 && idx < 45) {
          cleaned = cleaned.substring(idx + t.length).trim();
          return cleaned;
        }
      }
    }

    return cleaned;
  };

  const handleCopyVerse = (verse: Verse) => {
    const cleanText = cleanFirstVerseText(verse.text, verse.numberInSurah);
    const contentToCopy = `« ${cleanText} » [سورة ${surahName} - آية ${verse.numberInSurah}]`;

    try {
      navigator.clipboard.writeText(contentToCopy);
      setCopiedVerseId(verse.numberInSurah);
      setTimeout(() => setCopiedVerseId(null), 2000);
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
      triggerToast(isAr ? "تم نسخ نص الآية الكريمة بنجاح" : "Verse text successfully copied to clipboard");
    } catch (err) {
      console.error("Failed to copy verse:", err);
      triggerToast(isAr ? "عذراً، فشل نسخ الآية" : "Sorry, failed to copy verse text");
    }
  };

  const handleShareVerse = async (verse: Verse) => {
    const cleanText = cleanFirstVerseText(verse.text, verse.numberInSurah);
    const shareText = `۞ الآية الكريمة من سورة ${surahName}:\n« ${cleanText} » [الآية ${verse.numberInSurah}]\n\n*التفسير والتدبر (تفسير الجلالين):\n${verse.tafsir}\n\n- المصحف الإلكتروني الرقمي المتكامل`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `مشاركة آية من سورة ${surahName}`,
          text: shareText,
        });
        triggerToast(isAr ? "تمت المشاركة بنجاح" : "Shared successfully");
        return;
      } catch (err) {
        console.log("Web Share API canceled or unsupported", err);
      }
    }

    // Fallback to Copy
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedVerseId(verse.numberInSurah);
      setTimeout(() => setCopiedVerseId(null), 2000);
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
      triggerToast(isAr 
        ? "نسخ النص والتفسير للحافظة! يمكنك الآن لصقه ومشاركته مباشرة" 
        : "Visual translation and text copied for sharing"
      );
    } catch (err) {
      console.error("Fallback copy failed", err);
      triggerToast(isAr ? "عذراً، فشلت عملية النسخ والمشاركة" : "Sorry, copy & share operation failed");
    }
  };


  const handleDownloadVerseImage = (verse: Verse) => {
    try {
      const cleanText = cleanFirstVerseText(verse.text, verse.numberInSurah);
      
      // Create high-res canvas (1200 x 900) for a crisp social media card
      const width = 1200;
      const height = 900;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background slate/wood-grain spiritual dark gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#1c1917"); // stone-900
      gradient.addColorStop(0.5, "#0c0a09"); // stone-950 shadow density
      gradient.addColorStop(1, "#1c1917"); // stone-900
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw majestic background watermark logo of the site (Rub el Hizb + Book + Rays)
      const drawBackgroundLogoMark = (cx: number, cy: number, r: number) => {
        ctx.save();
        
        ctx.strokeStyle = "rgba(196, 154, 108, 0.045)";
        ctx.lineWidth = 3;
        
        // Outer square 1
        ctx.beginPath();
        ctx.rect(cx - r, cy - r, r * 2, r * 2);
        ctx.stroke();
        
        // Outer square 2 (rotated 45 deg)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-r, -r, r * 2, r * 2);
        ctx.stroke();
        ctx.restore();

        // Overlapping inner square 1
        const r2 = r * 0.75;
        ctx.strokeStyle = "rgba(196, 154, 108, 0.035)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.rect(cx - r2, cy - r2, r2 * 2, r2 * 2);
        ctx.stroke();

        // Overlapping inner square 2 (rotated 45 deg)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-r2, -r2, r2 * 2, r2 * 2);
        ctx.stroke();
        ctx.restore();

        // Connect the 8 points and center with ray lines (Girih lattice effect)
        ctx.strokeStyle = "rgba(196, 154, 108, 0.02)";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        // Horizontal & Vertical
        ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
        
        // Diagonals
        const diagDist = r * Math.SQRT1_2;
        ctx.moveTo(cx - diagDist, cy - diagDist); ctx.lineTo(cx + diagDist, cy + diagDist);
        ctx.moveTo(cx - diagDist, cy + diagDist); ctx.lineTo(cx + diagDist, cy - diagDist);
        ctx.stroke();

        // Centered beautiful 8-pointed star centerpiece (Rub el Hizb element)
        const innerStarR = r * 0.35;
        ctx.save();
        ctx.fillStyle = "rgba(196, 154, 108, 0.04)";
        ctx.strokeStyle = "rgba(196, 154, 108, 0.05)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.translate(cx, cy);
        
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const nextAngle = ((i + 1) * Math.PI) / 4;
          const midAngle = angle + Math.PI / 8;
          
          const x1 = Math.cos(angle) * innerStarR;
          const y1 = Math.sin(angle) * innerStarR;
          
          const xm = Math.cos(midAngle) * (innerStarR * 0.65);
          const ym = Math.sin(midAngle) * (innerStarR * 0.65);
          
          if (i === 0) ctx.moveTo(x1, y1);
          ctx.lineTo(xm, ym);
          
          const x2 = Math.cos(nextAngle) * innerStarR;
          const y2 = Math.sin(nextAngle) * innerStarR;
          ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Beautiful Open book representation in the absolute center
        ctx.save();
        ctx.strokeStyle = "rgba(196, 154, 108, 0.065)";
        ctx.lineWidth = 3.5;
        ctx.translate(cx, cy);
        // Scale appropriately
        ctx.scale(3.2, 3.2);
        
        // Drawing an open book Quran shape
        ctx.beginPath();
        // Left page curves
        ctx.moveTo(0, 15);
        ctx.bezierCurveTo(-6, 9, -18, 9, -24, 11);
        ctx.lineTo(-24, -13);
        ctx.bezierCurveTo(-18, -15, -6, -15, 0, -9);
        
        // Right page curves
        ctx.bezierCurveTo(6, -15, 18, -15, 24, -13);
        ctx.lineTo(24, 11);
        ctx.bezierCurveTo(18, 9, 6, 9, 0, 15);
        ctx.stroke();

        // Main center book spine
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(0, 15);
        ctx.stroke();
        
        // Subtle page-leaf lines for authentic look
        ctx.strokeStyle = "rgba(196, 154, 108, 0.035)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, -11);
        ctx.bezierCurveTo(-10, -11, -18, -11, -22, -10);
        ctx.moveTo(4, -11);
        ctx.bezierCurveTo(10, -11, 18, -11, 22, -10);
        ctx.stroke();

        ctx.restore();
      };

      // Render the watermark prominently in the center of the card
      drawBackgroundLogoMark(width / 2, height / 2, 210);

      // Draw decorative elegant copper/gold double borders
      ctx.strokeStyle = "#c49a6c"; // Cooper/gold color
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      ctx.strokeStyle = "rgba(196, 154, 108, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(42, 42, width - 84, height - 84);

      // Draw geometric corner stars
      const drawCornerStar = (cx: number, cy: number) => {
        ctx.fillStyle = "#c49a6c";
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? 12 : 5;
          ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
      };
      drawCornerStar(55, 55);
      drawCornerStar(width - 55, 55);
      drawCornerStar(55, height - 55);
      drawCornerStar(width - 55, height - 55);

      // Header Text: "۞ تدبر آيات الكتاب الأعظم ۞"
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#c49a6c";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("۞ تدبُّر آيات الكِتاب الأعْظم ۞", width / 2, 80);

      // Surah and Ayah reference: "سورة البقرة - الآية 255"
      ctx.fillStyle = "#e7e5e4"; // stone-200
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`سورة ${surahName} - الآية ${verse.numberInSurah}`, width / 2, 130);

      // Draw a subtle golden line below the header
      ctx.strokeStyle = "rgba(196, 154, 108, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 250, 185);
      ctx.lineTo(width / 2 + 250, 185);
      ctx.stroke();

      // Arabic Verse Text formatting & rendering
      ctx.fillStyle = "#f5f5f4"; // stone-100/pure bone color
      // Traditional Arabic Naskh styling fallback
      ctx.font = "bold 44px 'Amiri', 'Traditional Arabic', serif";
      ctx.direction = "rtl";

      // Wrapping Arabic Verse text
      const wrapTextAr = (text: string, maxWidth: number) => {
        const words = text.split(" ");
        const lines = [];
        let currentLine = "";
        for (let word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const widthTest = ctx.measureText(testLine).width;
          if (widthTest > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      const verseLines = wrapTextAr(cleanText, 1050);
      let nextY = 240;
      const arabicLineHeight = 65;

      for (let line of verseLines) {
        ctx.fillText(`« ${line} »`, width / 2, nextY);
        nextY += arabicLineHeight;
      }

      // Draw division line
      ctx.strokeStyle = "rgba(196, 154, 108, 0.15)";
      ctx.beginPath();
      ctx.moveTo(width / 2 - 350, nextY + 15);
      ctx.lineTo(width / 2 + 350, nextY + 15);
      ctx.stroke();

      nextY += 45;

      // Tafsir/Meaning section
      ctx.direction = "rtl";
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#a8a29e"; // stone-400
      ctx.fillText("تفسير وتدبّر الآية (تفسير الجلالين المعتمد):", width / 2, nextY);
      nextY += 40;

      ctx.fillStyle = "#d6d3d1"; // stone-300
      ctx.font = "25px sans-serif";

      // Wrap Tafsir
      const tafsirLines = wrapTextAr(verse.tafsir, 1000);
      const tafsirLineHeight = 35;
      for (let line of tafsirLines) {
        ctx.fillText(line, width / 2, nextY);
        nextY += tafsirLineHeight;
      }

      // Footer signature at the bottom center
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.fillStyle = "#c49a6c"; // Ornate copper / gold signature color
      ctx.font = "bold 21px sans-serif";
      ctx.fillText("تطبيق قرآني (Qurany) | المنصة الإيمانية التفاعلية لتدبر آيات القرآن العظيم وتفسيره وحفظه ۞", width / 2, height - 90);

      // Save / Trigger Download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Aya_${surahName}_${verse.numberInSurah}.png`;
      link.href = dataUrl;
      link.click();
      
      triggerToast(isAr ? "📸 تم تحميل بطاقة التفكر أوفلاين بنجاح فائق الدقة!" : "📸 Verse reflection card downloaded successfully!");
    } catch (err) {
      console.error("Failed to generate image:", err);
      triggerToast(isAr ? "⚠️ فشلت عملية تنزيل الآية كصورة" : "⚠️ Failed to download verse image representation");
    }
  };


  // True Night Mode read from global settings
  const trueNightMode = settings.trueNightMode;
  
  // Quick navigation reference
  const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleScrollToVerse = (verseNumber: number) => {
    const el = verseRefs.current[verseNumber];
    if (el) {
      isProgrammaticScroll.current = true;
      setActiveVerse(verseNumber);
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchSurah = async () => {
      setLoading(true);
      setError(null);

      // Check offline local caching first
      try {
        const cached = localStorage.getItem(`offline_surah_${surahNumber}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.verses && parsed.verses.length > 0) {
            if (active) {
              setSurah(parsed);
              setLoading(false);
              return;
            }
          }
        }
      } catch (cacheErr) {
        console.error("Failed to read from offline partition:", cacheErr);
      }

      try {
        if (!isOnline) {
          throw new Error("offline");
        }
        const response = await fetch(`/api/surah/${surahNumber}`);
        if (!response.ok) {
          throw new Error("فشل الاتصال بالخادم لتحميل السورة.");
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        if (active) {
          setSurah(data);
        }
      } catch (err: any) {
        if (active) {
          if (err.message === "offline") {
            setError("⚠️ عذراً، أنت تتصفح التطبيق بدون إنترنت حالياً وبطاقة السورة غير محفوظة محلياً. يرجى تفعيل شبكة الإنترنت أو تنزيلها لاحقاً.");
          } else {
            setError(err.message || "حدث خطأ غير متوقع أثناء تحميل السورة.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSurah();

    return () => {
      active = false;
    };
  }, [surahNumber, isOnline]);

  useEffect(() => {
    if (!loading && surah && initialScrollToVerse) {
      const timer = setTimeout(() => {
        handleScrollToVerse(initialScrollToVerse);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, surah, initialScrollToVerse]);

  // Automatically scroll and center current playing verse in reading pane only when the verse actually changes
  useEffect(() => {
    if (
      currentPlayingVerse &&
      currentPlayingVerse.surahNumber === surahNumber &&
      settings.autoScrollSelected
    ) {
      const vNum = currentPlayingVerse.verseNumber;
      
      // Prevent snapping/refocusing if we are already zoomed/focused on this exact verse
      const alreadyScrolled = 
        lastScrolledVerseRef.current &&
        lastScrolledVerseRef.current.surahNumber === surahNumber &&
        lastScrolledVerseRef.current.verseNumber === vNum;

      if (!alreadyScrolled) {
        lastScrolledVerseRef.current = { surahNumber, verseNumber: vNum };
        setActiveVerse(vNum);
        
        const el = verseRefs.current[vNum];
        if (el) {
          isProgrammaticScroll.current = true;
          el.scrollIntoView({ behavior: "smooth", block: "center" });

          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
            isProgrammaticScroll.current = false;
          }, 1200);
        }
      }
    }
  }, [currentPlayingVerse, surahNumber]);

  // Enhanced, robust scroll spy logic to determine the current viewed verse during scroll
  useEffect(() => {
    if (!surah || loading) return;

    const handleScrollDetect = () => {
      if (isProgrammaticScroll.current) return;

      const viewportCenter = window.innerHeight / 2.5; // Focus on the upper-middle region
      let closestVerseIndex: number | null = null;
      let smallestDistance = Infinity;

      Object.keys(verseRefs.current).forEach((key) => {
        const index = parseInt(key, 10);
        const el = verseRefs.current[index];
        if (el) {
          const rect = el.getBoundingClientRect();
          const elCenter = (rect.top + rect.bottom) / 2;
          const distance = Math.abs(elCenter - viewportCenter);

          // Check if element is active within view limits
          if (rect.bottom > 80 && rect.top < window.innerHeight - 80) {
            if (distance < smallestDistance) {
              smallestDistance = distance;
              closestVerseIndex = index;
            }
          }
        }
      });

      if (closestVerseIndex !== null && closestVerseIndex !== activeVerse) {
        setActiveVerse(closestVerseIndex);
      }
    };

    window.addEventListener("scroll", handleScrollDetect, { passive: true });
    window.addEventListener("resize", handleScrollDetect, { passive: true });
    
    // Warm up trigger
    handleScrollDetect();

    return () => {
      window.removeEventListener("scroll", handleScrollDetect);
      window.removeEventListener("resize", handleScrollDetect);
    };
  }, [surah, viewMode, loading, activeVerse]);

  const isVerseBookmarked = (num: number) => {
    return bookmarks.some(b => b.surahNumber === surahNumber && b.verseNumber === num);
  };

  const normalizeArabic = (str: string) => {
    return str
      .replace(/[\u064B-\u0652\u0670]/g, "") // remove tashkeel/diacritics
      .replace(/[أإآا]/g, "ا")
      .replace(/[ىي]/g, "ي")
      .replace(/[ةه]/g, "ه")
      .trim()
      .toLowerCase();
  };

  const filteredVerses = surah?.verses.filter(v => {
    if (!searchQuery) return true;
    const normalizedQuery = normalizeArabic(searchQuery);
    const normalizedVerseText = normalizeArabic(v.text);
    const normalizedTafsir = normalizeArabic(v.tafsir);
    const normalizedTranslation = v.translation.toLowerCase();

    return (
      normalizedVerseText.includes(normalizedQuery) ||
      normalizedTafsir.includes(normalizedQuery) ||
      normalizedTranslation.includes(normalizedQuery)
    );
  }) || [];

  return (
    <div className={`w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 md:py-6 animate-in fade-in duration-300 transition-all duration-500 ${trueNightMode ? "brightness-[0.82] contrast-[0.98]" : ""} ${isFocusReadingMode ? "pt-24 pb-12" : ""}`} dir={dir}>
      
      {/* Immersive Focus Reading Mode Fixed Header (Displays ONLY primary settings) */}
      {isFocusReadingMode && (
        <div className="fixed top-4 left-4 right-4 z-50 flex flex-col p-3 md:p-3.5 bg-stone-900/95 backdrop-blur-md border border-stone-850 rounded-2xl shadow-2xl animate-in slide-in-from-top-6 duration-300 gap-2.5 max-h-[40vh] md:max-h-none overflow-y-auto" dir={dir}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
            <div className={`flex items-center gap-2 pr-1 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <h3 className="text-xs sm:text-sm font-extrabold text-[#c49a6c] font-sans">
                سورة {surahName} • وضع القراءة الخاشعة (تركيز كامل) 🌸
              </h3>
            </div>
            
            <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
              {/* Font scaling controls */}
              <div className={`flex items-center border border-stone-800 rounded-xl p-1 bg-stone-950 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                <button
                  onClick={() => setFontSize(Math.max(20, fontSize - 4))}
                  className="px-2 py-0.5 text-xs font-bold text-stone-400 hover:bg-stone-800 rounded cursor-pointer animate-none"
                  title={isAr ? "تصغير الخط" : "Decrease Font"}
                >
                  -
                </button>
                <span className="px-1.5 text-[11px] font-semibold text-stone-400 select-none flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  <span>{fontSize}px</span>
                </span>
                <button
                  onClick={() => setFontSize(Math.min(48, fontSize + 4))}
                  className="px-2 py-0.5 text-xs font-bold text-stone-405 hover:bg-stone-800 rounded cursor-pointer animate-none"
                  title={isAr ? "تكبير الخط" : "Increase Font"}
                >
                  +
                </button>
              </div>

              {/* True Night Mode toggle */}
              <button
                onClick={() => onUpdateSettings({ trueNightMode: !settings.trueNightMode })}
                className={`p-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                  trueNightMode 
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400 font-extrabold" 
                    : "border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                }`}
                title={isAr ? "تعديل الوضع الليلي للعين" : "Toggle Eye Protection Night Mode"}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>

              {/* Native Fullscreen Toggle Button */}
              <button
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-850 text-stone-300 hover:text-amber-500 transition cursor-pointer flex items-center gap-1.5 text-[11px] font-sans font-bold"
                title={isFullscreen ? "الخروج من ملء الشاشة" : "عرض وضع ملء الشاشة"}
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-amber-500" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFullscreen ? "تصغير" : "ملء الشاشة"}</span>
              </button>

              {/* Close/Exit focus mode button */}
              <button
                onClick={handleToggleImmersiveFocusMode}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-[11px] font-sans cursor-pointer transition active:scale-95"
              >
                الخروج
              </button>
            </div>
          </div>

          {/* New Focus Quick-Jump Strip */}
          <div className="w-full border-t border-stone-800/80 pt-2 mt-1 flex flex-col gap-1.5 text-right">
            <div className="flex items-center justify-between flex-row">
              <span className="text-[10px] font-bold text-amber-500/85">الانتقال السريع للآية (الوضع الخاشع) ۞:</span>
              <span className="text-[9px] text-stone-500 font-sans">عدد الآيات: {surah.numberOfAyahs}</span>
            </div>
            
            <div 
              id="focus-quickjump-container" 
              className="flex flex-row gap-1.5 overflow-x-auto py-1 pr-0.5 pl-0.5" 
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {Array.from({ length: surah.numberOfAyahs }).map((_, i) => {
                const isCurrent = activeVerse === i + 1;
                return (
                  <button
                    key={i}
                    id={`focus-quickjump-btn-${i + 1}`}
                    onClick={() => handleScrollToVerse(i + 1)}
                    className={`min-w-8 h-8 flex items-center justify-center text-[11px] border rounded-lg transition-all cursor-pointer shrink-0 ${
                      isCurrent
                        ? "bg-amber-500/15 border-amber-500 text-amber-500 font-extrabold scale-[1.03]"
                        : "bg-stone-920 border-stone-850 text-stone-450 hover:text-amber-500"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}

              {/* Full Surah Download Offline Button */}
              {downloadedSurahs.includes(surahNumber) ? (
                <button
                  onClick={() => onRemoveDownloadedSurah && onRemoveDownloadedSurah(surahNumber, surahName)}
                  className="p-2 rounded-xl border border-emerald-500/35 bg-emerald-600/10 text-emerald-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
                  title={isAr ? "محفوظة أوفلاين بالكامل - انقر لحذف الملف" : "Saved Offline - Click to delete"}
                >
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">{t('downloadedBtn')} ⚡</span>
                </button>
              ) : downloadingStates[surahNumber] ? (
                <button
                  disabled
                  className="p-2 rounded-xl border border-stone-800 bg-stone-900 text-amber-500 transition-all flex items-center gap-1.5 text-xs cursor-wait"
                >
                  <span className="block w-3.5 h-3.5 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shrink-0" />
                  <span className="hidden sm:inline">{t('downloadingBtn')}</span>
                </button>
              ) : (
                isOnline && onDownloadSurah && (
                  <button
                    onClick={() => onDownloadSurah(surahNumber, surahName)}
                    className="p-2 rounded-xl border border-stone-800 text-stone-400 hover:text-amber-500 hover:bg-stone-900 hover:border-amber-500/30 transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
                    title={t('downloadBtn')}
                  >
                    <Download className="w-4 h-4 text-stone-400 animate-pulse shrink-0" />
                    <span className="hidden sm:inline">{t('downloadBtn')}</span>
                  </button>
                )
              )}

              {/* Universal Customizer toggle */}
              <button
                onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 ${
                  isCustomizerOpen 
                    ? "border-amber-500 bg-amber-600/10 text-amber-500" 
                    : "border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-900"
                }`}
                title={isAr ? "تخصيص العرض والترجمة وتكبير حجم الخط" : "Configuration Options for Reading View"}
              >
                <Sliders className={`w-4 h-4 text-amber-500 transition-transform ${isCustomizerOpen ? "rotate-90 scale-103" : ""}`} />
                <span>{isAr ? "تخصيص القراءة ⚙️" : "Page Settings ⚙️"}</span>
              </button>
            </div>
          </div>

          {/* Collapsible customizer configuration card */}
          {isCustomizerOpen && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4.5 shadow-xl animate-in slide-in-from-top-2 duration-300 relative w-full">
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${isAr ? "text-right" : "text-left"}`}>
                
                {/* 1. Layout option */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "تنسيق العرض" : "Layout Representation"}
                  </span>
                  <button
                    onClick={() => setViewMode(viewMode === "continuous" ? "page" : "continuous")}
                    className="w-full p-2 rounded-xl border border-stone-850 hover:border-stone-800 bg-stone-950/40 text-stone-300 hover:text-amber-500 transition-all flex items-center justify-between text-xs cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-sans font-bold">{isAr ? "شكل الصفحة" : "Page View System"}</span>
                    </div>
                    <span className="text-[10px] bg-amber-600/15 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-sans">
                      {viewMode === "continuous" ? (isAr ? "عرض مفصّل" : "Detailed List") : (isAr ? "وضع المصحف" : "Holy Layout")}
                    </span>
                  </button>
                </div>

                {/* 2. English translation and Tafsir */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "الترجمة والتفسير" : "Interpretation Layers"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTranslations(!showTranslations)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-sans font-bold cursor-pointer transition-all ${
                        showTranslations
                          ? "border-amber-500/30 bg-amber-600/10 text-amber-500 font-extrabold"
                          : "border-stone-850 bg-stone-950/40 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      {isAr ? "ترجمة إنجليزية" : "English text"}
                    </button>
                    <button
                      onClick={() => setShowTafsir(!showTafsir)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-sans font-bold cursor-pointer transition-all ${
                        showTafsir
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-500 font-extrabold"
                          : "border-stone-850 bg-stone-950/40 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      {isAr ? "تفسير الجلالين" : "Arabic Tafsir"}
                    </button>
                  </div>
                </div>

                {/* 3. Deep Night mode */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "إضاءة وتعميم" : "Theme & Brightness"}
                  </span>
                  <button
                    onClick={() => onUpdateSettings({ trueNightMode: !settings.trueNightMode })}
                    className={`w-full p-2 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      trueNightMode
                        ? "border-amber-500/45 bg-amber-600/15 text-amber-400 font-bold"
                        : "border-stone-850 bg-stone-950/40 text-stone-400 hover:text-stone-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Moon className={`w-3.5 h-3.5 ${trueNightMode ? "text-amber-400 fill-amber-400/25" : "text-stone-400"}`} />
                      <span className="font-sans font-medium">{isAr ? "ليلي حقيقي غامق" : "Deep Darkness Theme"}</span>
                    </div>
                    <span className="text-[10px] uppercase font-sans">
                      {trueNightMode ? (isAr ? "نشط" : "ON") : (isAr ? "معطل" : "OFF")}
                    </span>
                  </button>
                </div>

                {/* 4. Font Sizing scale */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "مقياس الخط للآيات" : "Arabic Font Scale Size"}
                  </span>
                  <div className="flex items-center justify-between border border-stone-850 rounded-xl p-1 bg-stone-950/50 w-full font-sans">
                    <button
                      onClick={() => setFontSize(Math.max(20, fontSize - 4))}
                      className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-500 font-sans font-bold flex items-center justify-center cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs text-stone-300 font-bold select-none flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-stone-500" />
                      <span>{fontSize}px</span>
                    </span>
                    <button
                      onClick={() => setFontSize(Math.min(48, fontSize + 4))}
                      className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-500 font-sans font-bold flex items-center justify-center cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 5. Navigation safety lock when reading */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "حماية وتثبيت القراءة" : "Navigation Lock"}
                  </span>
                  <button
                    onClick={() => onUpdateSettings({ lockNavigationDuringReading: !settings.lockNavigationDuringReading })}
                    className={`w-full p-2 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      settings.lockNavigationDuringReading
                        ? "border-amber-500/45 bg-amber-600/15 text-amber-400 font-bold font-extrabold scale-[1.01]"
                        : "border-stone-850 bg-stone-950/40 text-stone-400 hover:text-stone-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className={`w-3.5 h-3.5 ${settings.lockNavigationDuringReading ? "text-amber-400 fill-amber-400/10" : "text-stone-400"}`} />
                      <span className="font-sans font-medium">{isAr ? "منع الخروج العرضي" : "Lock Prevents Exit"}</span>
                    </div>
                    <span className="text-[10px] uppercase font-sans font-bold">
                      {settings.lockNavigationDuringReading ? (isAr ? "نشط 🔒" : "ACTIVE 🔒") : (isAr ? "معطل" : "DISABLED")}
                    </span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Wifi/Offline Indicator Banner */}
          {!isOnline && (
            <div className="w-full animate-in slide-in-from-top-2 duration-300">
              <div className="p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right text-xs font-sans bg-amber-600/10 border border-amber-500/20 text-amber-500">
                <div className="flex items-center gap-2 flex-row text-right">
                  <WifiOff className="w-4 h-4 animate-bounce" />
                  <span>
                    {isAr 
                      ? "أنت تقرأ حالياً بوضع الأوفلاين (بدون إنترنت). تم ملاءمة خيارات التشغيل وميزات الذكاء الاصطناعي مؤقتاً لعدم وجود شبكة." 
                      : "You are currently reading offline. Online recitation streaming & AI context features are optimized for offline view."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard (Non-Focus) Top Action Navigation Header */}
      {!isFocusReadingMode && (
        <div className="flex flex-col gap-4 mb-6">
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-3xl border ${trueNightMode ? "bg-black/95 border-stone-900 shadow-inner" : "bg-stone-900 border-stone-850 shadow-md"}`} dir={dir}>
            {/* Back to index & Surah Title */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onBackToIndex}
                className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  trueNightMode 
                    ? "bg-stone-950 hover:bg-stone-900 text-stone-300 border border-stone-900" 
                    : "bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-800"
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-amber-500" />
                <span>{isAr ? "فهرس السور" : "Surah Catalog"}</span>
              </button>
              
              <div className="h-6 w-px bg-stone-800" />
              
              <h2 className="text-sm font-extrabold text-[#c49a6c] font-sans">
                سورة {surahName}
              </h2>
            </div>

            {/* Action buttons list */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Download Button */}
              {downloadedSurahs.includes(surahNumber) ? (
                <button
                  onClick={() => onRemoveDownloadedSurah && onRemoveDownloadedSurah(surahNumber, surahName)}
                  className="px-3.5 py-2 rounded-xl border border-emerald-500/35 bg-emerald-600/10 text-emerald-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
                  title={isAr ? "محفوظة أوفلاين بالكامل - انقر لحذف الملف" : "Saved Offline - Click to delete"}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{isAr ? "منزلة ⚡" : "Downloaded ⚡"}</span>
                </button>
              ) : downloadingStates[surahNumber] ? (
                <button
                  disabled
                  className="px-3.5 py-2 rounded-xl border border-stone-800 bg-stone-900 text-amber-500 transition-all flex items-center gap-1.5 text-xs cursor-wait"
                >
                  <span className="block w-3 h-3 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shrink-0" />
                  <span>{isAr ? "جاري التنزيل..." : "Downloading..."}</span>
                </button>
              ) : (
                isOnline && onDownloadSurah && (
                  <button
                    onClick={() => onDownloadSurah(surahNumber, surahName)}
                    className="px-3.5 py-2 rounded-xl border border-stone-800 text-stone-400 hover:text-amber-500 hover:bg-stone-950 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
                    title={t('downloadBtn')}
                  >
                    <Download className="w-3.5 h-3.5 text-stone-400 shrink-0 animate-pulse" />
                    <span>{isAr ? "تنزيل السورة أوفلاين" : "Download Surah"}</span>
                  </button>
                )
              )}

              {/* Customizer Settings toggle button */}
              <button
                onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
                className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 ${
                  isCustomizerOpen 
                    ? "border-amber-500 bg-amber-600/10 text-amber-500" 
                    : "border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-850"
                }`}
                title={isAr ? "تعديل مظهر القراءة والترجمة والخط" : "Reading Customizer Options"}
              >
                <Sliders className={`w-3.5 h-3.5 text-amber-500 transition-transform ${isCustomizerOpen ? "rotate-90" : ""}`} />
                <span>{isAr ? "تخصيص القراءة ⚙️" : "Page Settings ⚙️"}</span>
              </button>

              {/* Immersive Focus Reading Mode Button */}
              <button
                onClick={handleToggleImmersiveFocusMode}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs font-sans cursor-pointer transition flex items-center gap-1.5 active:scale-95 shadow-md hover:shadow-amber-500/10"
                title={isAr ? "تبديل إلى مظهر التفكير الكامل بدون مشتتات" : "Toggle distraction-free focus mode"}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? "الوضع الخاشع (تركيز) 🌸" : "Focus Mode"}</span>
              </button>
            </div>
          </div>

          {/* NEW: Reading progress tracker card */}
          <div className={`p-4 rounded-3xl border flex flex-col gap-2.5 shadow-sm ${trueNightMode ? "bg-black/95 border-stone-900 shadow-inner" : "bg-stone-900 border-stone-850 shadow-sm"}`} dir={dir}>
            <div className={`flex items-center justify-between text-xs font-sans text-stone-450 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
              <span className="font-extrabold text-amber-500/90 flex items-center gap-1.5 justify-start">
                <BookOpen className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{isAr ? "مؤشر تقدم قراءة السورة الكريمة" : "Surah Reading Progress Tracking"}</span>
              </span>
              <span className="font-bold select-none text-[10px] bg-stone-950 font-mono py-0.5 px-2 rounded-lg text-amber-400/90 border border-stone-800">
                {isAr 
                  ? `الآية ${activeVerse} من أصل ${totalAyahs} (${Math.min(100, Math.round((activeVerse / totalAyahs) * 100))}%)` 
                  : `Ayah ${activeVerse} of ${totalAyahs} (${Math.min(100, Math.round((activeVerse / totalAyahs) * 100))}%)`}
              </span>
            </div>
            
            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800/60 p-0.5 relative">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300 shadow-lg shadow-amber-500/20" 
                style={{ width: `${Math.min(100, Math.round((activeVerse / totalAyahs) * 100))}%` }}
              />
            </div>
          </div>

          {/* Collapsible customizer configuration card */}
          {isCustomizerOpen && (
            <div className={`p-4 rounded-3xl border animate-in slide-in-from-top-2 duration-300 ${trueNightMode ? "bg-black/95 border-stone-900 shadow-inner" : "bg-stone-900 border-stone-850 shadow-lg"}`} dir={dir}>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${isAr ? "text-right" : "text-left"}`}>
                
                {/* 1. Layout option */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "تنسيق العرض" : "Layout Representation"}
                  </span>
                  <button
                    onClick={() => setViewMode(viewMode === "continuous" ? "page" : "continuous")}
                    className="w-full p-2 text-stone-300 hover:text-amber-500 rounded-xl border border-stone-850 hover:border-stone-800 bg-stone-950/40 transition-all flex items-center justify-between text-xs cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                       <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                       <span className="font-sans font-bold">{isAr ? "شكل الصفحة" : "Page View System"}</span>
                    </div>
                    <span className="text-[10px] bg-amber-600/15 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-sans">
                      {viewMode === "continuous" ? (isAr ? "عرض مفصّل" : "Detailed List") : (isAr ? "وضع المصحف" : "Holy Layout")}
                    </span>
                  </button>
                </div>

                {/* 2. English translation and Tafsir */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "الترجمة والتفسير" : "Interpretation Layers"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTranslations(!showTranslations)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-sans font-bold cursor-pointer transition-all ${
                        showTranslations
                          ? "border-amber-500/30 bg-amber-600/10 text-amber-500 font-extrabold"
                          : "border-stone-850 bg-stone-950/40 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      {isAr ? "ترجمة إنجليزية" : "English text"}
                    </button>
                    <button
                      onClick={() => setShowTafsir(!showTafsir)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-sans font-bold cursor-pointer transition-all ${
                        showTafsir
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-500 font-extrabold"
                          : "border-stone-850 bg-stone-950/40 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      {isAr ? "تفسير الجلالين" : "Arabic Tafsir"}
                    </button>
                  </div>
                </div>

                {/* 3. Deep Night mode */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "إضاءة وتعميم" : "Theme & Brightness"}
                  </span>
                  <button
                    onClick={() => onUpdateSettings({ trueNightMode: !settings.trueNightMode })}
                    className={`w-full p-2 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      trueNightMode
                        ? "border-amber-500/45 bg-amber-600/15 text-amber-400 font-bold"
                        : "border-stone-850 bg-stone-950/40 text-stone-400 hover:text-stone-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Moon className={`w-3.5 h-3.5 ${trueNightMode ? "text-amber-400 fill-amber-400/25" : "text-stone-400"}`} />
                      <span className="font-sans font-medium">{isAr ? "ليلي حقيقي غامق" : "Deep Darkness Theme"}</span>
                    </div>
                    <span className="text-[10px] uppercase font-sans">
                      {trueNightMode ? (isAr ? "نشط" : "ON") : (isAr ? "معطل" : "OFF")}
                    </span>
                  </button>
                </div>

                {/* 4. Font Sizing scale */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold font-sans">
                    {isAr ? "مقياس الخط للآيات" : "Arabic Font Scale Size"}
                  </span>
                  <div className="flex items-center justify-between border border-stone-850 rounded-xl p-1 bg-stone-950/50 w-full font-sans">
                    <button
                      onClick={() => setFontSize(Math.max(20, fontSize - 4))}
                      className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-500 font-sans font-bold flex items-center justify-center cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs text-stone-300 font-bold select-none flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-stone-500" />
                      <span>{fontSize}px</span>
                    </span>
                    <button
                      onClick={() => setFontSize(Math.min(48, fontSize + 4))}
                      className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-500 font-sans font-bold flex items-center justify-center cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Wifi/Offline Indicator Banner */}
          {!isOnline && (
            <div className="w-full animate-in slide-in-from-top-2 duration-300">
              <div className="p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right text-xs font-sans bg-amber-600/10 border border-amber-500/20 text-amber-500">
                <div className="flex items-center gap-2 flex-row text-right">
                  <WifiOff className="w-4 h-4 animate-bounce" />
                  <span>
                    {isAr 
                      ? "أنت تقرأ حالياً بوضع الأوفلاين (بدون إنترنت). تم ملاءمة خيارات التشغيل وميزات الذكاء الاصطناعي مؤقتاً لعدم وجود شبكة." 
                      : "You are currently reading offline. Online recitation streaming & AI context features are optimized for offline view."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-stone-900 rounded-3xl border border-stone-850">
          <Loader className="w-10 h-10 text-amber-500 animate-spin" />
          <h3 className="text-base font-semibold text-stone-200 font-sans mt-4">جاري تحميل السورة الكريمة...</h3>
          <p className="text-xs text-stone-400 mt-1 font-sans">يتم توفير التفسير، الترجمة وملفات الصوت</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-stone-900 rounded-3xl border border-stone-850 shadow-md max-w-lg mx-auto text-center font-sans">
          <HelpCircle className="w-12 h-12 text-amber-600 mb-3" />
          <h3 className="text-base font-bold text-stone-100 font-sans">فشل في تحميل السورة</h3>
          <p className="text-sm text-stone-400 mt-2 font-sans">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-4 py-2 rounded-xl bg-amber-600 text-stone-950 font-bold text-sm hover:bg-amber-500 transition cursor-pointer"
          >
            إعادة محاولة الاتصال
          </button>
        </div>
      )}

      {/* Main Content Pane */}
      {surah && !loading && (
        <div className={`grid grid-cols-1 ${isFocusReadingMode ? "max-w-3xl mx-auto w-full" : "lg:grid-cols-12"} gap-6 items-start`}>
          
          {/* Quick jump sidebar */}
          {!isFocusReadingMode && (
            <div className={`lg:col-span-2 ${trueNightMode ? "bg-black/90 border-stone-900 shadow-inner" : "bg-stone-900 border-stone-850"} border rounded-2xl p-3 max-h-[450px] overflow-y-auto sticky top-24 hidden lg:block`}>
              <h4 className="text-xs font-extrabold text-amber-500 tracking-wide border-b border-stone-800 pb-2 mb-2 font-sans text-center">
                الانتقال السريع للآية
              </h4>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: surah.numberOfAyahs }).map((_, i) => {
                  const isCurrent = activeVerse === i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => handleScrollToVerse(i + 1)}
                      className={`py-1.5 text-xs text-center border rounded-lg transition cursor-pointer ${
                        isCurrent
                          ? "bg-amber-500/15 border-amber-500 text-amber-500 shadow-amber-500/10 shadow-sm font-bold scale-[1.03]"
                          : "border-stone-850 text-stone-400 hover:bg-amber-600/10 hover:border-amber-500/20 hover:text-amber-500"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`${isFocusReadingMode ? "w-full" : "lg:col-span-10"} flex flex-col gap-6`}>

            {/* Horizontally scrollable quick-jump bar for MOBILE and TABLETS */}
            {!isFocusReadingMode && (
              <div className="lg:hidden bg-stone-900/60 border border-stone-850 rounded-2xl p-3 mb-1">
                <h4 className="text-[10px] font-extrabold text-amber-500 tracking-wide mb-1.5 font-sans pr-1 text-right">
                  الانتقال السريع للآية:
                </h4>
                <div id="mobile-quickjump-container" className="flex flex-row gap-1.5 overflow-x-auto py-1 pr-1 pl-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                  {Array.from({ length: surah.numberOfAyahs }).map((_, i) => {
                    const isCurrent = activeVerse === i + 1;
                    return (
                      <button
                        key={i}
                        id={`mobile-quickjump-btn-${i + 1}`}
                        onClick={() => handleScrollToVerse(i + 1)}
                        className={`min-w-10 h-10 flex items-center justify-center text-xs border rounded-xl transition-all cursor-pointer shrink-0 ${
                          isCurrent
                            ? "bg-amber-500/15 border-amber-500 text-amber-500 shadow-amber-500/10 shadow-sm font-bold scale-[1.03]"
                            : "bg-stone-900 border-stone-850 text-stone-450 hover:text-amber-500"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Surah Banner */}
            {!isFocusReadingMode && (
              <div className={`bg-gradient-to-r ${trueNightMode ? "from-black to-stone-950 border-stone-900 text-stone-300" : "from-stone-900 to-stone-950 border-stone-850 text-stone-100"} border rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-md`}>
                {/* Islamic geometric pattern backdrop */}
                <div className="absolute inset-0 opacity-5 mix-blend-overlay flex items-center justify-center pointer-events-none">
                  <span className="text-8xl select-none">۞</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-xs text-amber-500 bg-amber-600/10 border border-amber-500/25 px-3 py-1 rounded-full font-sans tracking-wide">
                    سورة {surah.revelationType === "Meccan" ? "مكية" : "مدنية"} • {surah.numberOfAyahs} آية
                  </span>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-stone-50 mt-3 select-all tracking-wide font-quran glow-accent">
                     {surah.name} 
                  </h1>
                  <p className="text-xs uppercase text-stone-400 tracking-widest mt-1.5 font-sans font-medium">
                    {surah.englishName} ({surah.englishNameTranslation})
                  </p>

                  {/* Bismillah calligraphy except Surah At-Tawbah (9) */}
                  {surah.number !== 9 && (
                    <div className="text-xl md:text-3xl font-quran text-amber-500/90 font-medium mt-6 border-t border-stone-800/85 pt-5 tracking-wide max-w-sm mx-auto select-none">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bismillah calligraphy for Focus Mode */}
            {isFocusReadingMode && surah.number !== 9 && (
              <div className="text-2xl md:text-4xl font-quran text-amber-500/90 font-medium text-center py-6 select-none animate-in fade-in duration-500 select-none">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}

            {/* Search Input bar */}
            {!isFocusReadingMode && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث في آيات هذه السورة أو الترجمة أو التفسير..."
                  className={`w-full ${trueNightMode ? "bg-black border-stone-900 text-stone-350" : "bg-stone-900 border-stone-800 text-stone-100"} border rounded-2xl py-3.5 pr-11 pl-4 text-xs font-sans placeholder-stone-500 outline-none focus:border-amber-500/60 shadow-sm transition-colors`}
                />
                <Search className="w-4 h-4 text-stone-500 absolute right-4 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-sans font-bold text-stone-400 hover:text-stone-200 transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            )}

            {/* Friendly guide tip */}
            {!isFocusReadingMode && (
              <div className={`${trueNightMode ? "bg-black/30 border-stone-900/60" : "bg-stone-900/40 border-stone-850/75"} border p-3 px-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between text-right gap-3`}>
                <span className="text-xs text-stone-350 font-sans">
                  💡 <strong>تلميح التفسير:</strong> انقر مباشرة على <strong>أي آية قرآنية كريمة</strong> (سواء هنا أو في وضع الصفحة) أو اضغط على زر <strong>«التفسير والترجمة»</strong> لفتح نافذة التفسير الوجيز والترجمة والتحكم بالآية كاملة.
                </span>
                <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full font-bold font-sans shrink-0 hidden sm:inline">
                  عرض تفسير مباشر
                </span>
              </div>
            )}

            {/* Reading View Rendering */}
            {viewMode === "continuous" ? (
              
              /* Continuous detail list view */
              <div className="flex flex-col gap-4">
                {filteredVerses.length === 0 ? (
                  <div className="p-12 text-center bg-stone-900 rounded-2xl border border-stone-850 text-stone-450 text-xs font-sans">
                    لا توجد آيات مطابقة لبحثك في هذه السورة.
                  </div>
                ) : (
                  filteredVerses.map((verse) => {
                    const isPlayed = currentPlayingVerse?.surahNumber === surahNumber && currentPlayingVerse?.verseNumber === verse.numberInSurah;
                    const isBookmarked = isVerseBookmarked(verse.numberInSurah);
                    const isCurrentHighlight = activeVerse === verse.numberInSurah || isPlayed;

                    return (
                      <div
                        key={verse.numberInSurah}
                        ref={(el) => { verseRefs.current[verse.numberInSurah] = el; }}
                        className={`${trueNightMode ? "bg-black/95 border-stone-900 shadow-inner" : "bg-stone-900 border-stone-850/90"} border rounded-2xl p-5 md:p-6 transition-all duration-300 relative group flex flex-col gap-4 ${
                          isCurrentHighlight 
                            ? "border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40 bg-amber-600/[0.02]" 
                            : "hover:border-amber-500/30 hover:shadow-lg hover:shadow-stone-950/20"
                        }`}
                      >
                        {/* Audio & Bookmark verse floating header */}
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2 flex-row-reverse mb-1">
                          
                          {/* Ayah designation badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-500 font-semibold bg-amber-600/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-sans">
                              الآية {verse.numberInSurah}
                            </span>
                            <span className="text-[10px] text-stone-450 font-sans hidden sm:inline">
                              الجزء {verse.juz} • الصفحة {verse.page}
                            </span>
                          </div>

                          {/* Trigger utilities */}
                          <div className="flex items-center gap-1.5">
                            
                            {/* Listening play/pause button */}
                            <button
                              onClick={async () => {
                                const isCached = cachedVerseNumbers.has(verse.numberInSurah);
                                if (!isOnline && !isCached) {
                                  triggerToast(isAr 
                                    ? "⚠️ تشغيل التلاوة الصوتية يتطلب اتصالاً بالإنترنت أو أن تكون السورة منزلة كاملة مع الصوتيات مسبقاً." 
                                    : "⚠️ Audio recitation requires an active internet connection or a full download with audio."
                                  );
                                  return;
                                }
                                isPlayed && isPlaying ? onStopPlay() : onPlayVerse(verse.numberInSurah);
                              }}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isPlayed && isPlaying 
                                  ? "bg-rose-950/40 text-rose-400 border border-rose-900/30 font-semibold" 
                                  : !isOnline && !cachedVerseNumbers.has(verse.numberInSurah)
                                    ? "text-stone-500 bg-stone-900 border border-stone-850 opacity-40 hover:opacity-100"
                                    : "text-amber-500 bg-stone-800 border border-stone-700 hover:bg-stone-750 hover:scale-105 active:scale-95"
                              }`}
                              title={
                                isPlayed && isPlaying 
                                  ? "إيقاف الاستماع" 
                                  : !isOnline && !cachedVerseNumbers.has(verse.numberInSurah)
                                    ? (isAr ? "تحتاج اتصال إنترنت لتنزيل الصوت" : "Requires internet to stream recitation")
                                    : "استماع لهذه الآية"
                              }
                            >
                              {isPlayed && isPlaying ? (
                                <Pause className="w-4 h-4 text-rose-400 fill-rose-400" />
                              ) : !isOnline && !cachedVerseNumbers.has(verse.numberInSurah) ? (
                                <WifiOff className="w-4 h-4 text-stone-500" />
                              ) : (
                                <Play className="w-4 h-4 text-amber-500 fill-amber-500" />
                              )}
                            </button>

                            {/* Bookmark toggler */}
                            <button
                              onClick={() => onToggleBookmark(verse.numberInSurah, verse.text)}
                              className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
                                isBookmarked 
                                  ? "bg-amber-600/20 text-amber-500 border-amber-500/30" 
                                  : "text-stone-400 hover:text-amber-500 hover:bg-stone-800 border-transparent"
                              }`}
                              title={isBookmarked ? "إلغاء حفظ الآية" : "حفظ الآية في المرجعية"}
                            >
                              {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
                            </button>

                            {/* Asbab Al-Nuzul button from authoritative sources */}
                            <button
                              onClick={() => handleOpenAsbabAlNuzul(verse)}
                              className="p-1.5 rounded-lg text-emerald-400 bg-stone-850 hover:bg-stone-800 hover:scale-105 active:scale-95 transition-all border border-stone-700 flex items-center gap-1 text-[11px] font-sans font-bold cursor-pointer"
                              title="أسباب النزول والقصص من مراجع أهل التفسير والسير المعتمدة (السيوطي، الواحدي، ابن كثير)"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">أسباب النزول</span>
                            </button>

                            {/* Compressed More Options Dropdown Popover */}
                            <div className="relative">
                              <button
                                onClick={() => setActiveAyahMoreMenu(activeAyahMoreMenu === verse.numberInSurah ? null : verse.numberInSurah)}
                                className={`p-1.5 rounded-lg transition-all border cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 text-[11px] font-sans font-bold ${
                                  activeAyahMoreMenu === verse.numberInSurah
                                    ? "bg-amber-600/25 text-amber-450 border-amber-500/35"
                                    : "bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-amber-500 hover:border-amber-500/20"
                                }`}
                                title="عرض خيارات الآية الإضافية"
                              >
                                <span>المزيد</span>
                                <span className="text-[10px] text-amber-500">۞</span>
                              </button>

                              {activeAyahMoreMenu === verse.numberInSurah && (
                                <>
                                  {/* Transparent backdrop overlay to dismiss popover */}
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                                    onClick={() => setActiveAyahMoreMenu(null)} 
                                  />
                                  <div className="absolute right-0 top-full mt-2 z-50 w-44 bg-stone-900 border border-stone-800 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 text-right animate-in fade-in slide-in-from-top-1.5 duration-150">
                                    <div className="px-2 py-1 text-[9px] font-extrabold text-[#c49a6c] border-b border-stone-850 mb-1 select-none font-sans">خيارات إضافية</div>
                                    
                                    {/* Copy Verse */}
                                    <button
                                      onClick={() => {
                                        handleCopyVerse(verse);
                                        setActiveAyahMoreMenu(null);
                                      }}
                                      className="w-full text-right px-2.5 py-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-500 rounded-lg text-[11px] font-bold flex flex-row-reverse items-center justify-between gap-1.5 cursor-pointer"
                                    >
                                      {copiedVerseId === verse.numberInSurah ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                                      )}
                                      <span className="truncate">نسخ الآية الفردية</span>
                                    </button>

                                    {/* Share Verse */}
                                    <button
                                      onClick={() => {
                                        handleShareVerse(verse);
                                        setActiveAyahMoreMenu(null);
                                      }}
                                      className="w-full text-right px-2.5 py-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-500 rounded-lg text-[11px] font-bold flex flex-row-reverse items-center justify-between gap-1.5 cursor-pointer"
                                    >
                                      <Share2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                                      <span className="truncate">مشاركة الآية مع التفسير</span>
                                    </button>

                                    {/* Download card */}
                                    <button
                                      onClick={() => {
                                        handleDownloadVerseImage(verse);
                                        setActiveAyahMoreMenu(null);
                                      }}
                                      className="w-full text-right px-2.5 py-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-500 rounded-lg text-[11px] font-bold flex flex-row-reverse items-center justify-between gap-1.5 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                                      <span className="truncate">تنزيل بطاقة التلاوة 📸</span>
                                    </button>

                                    {/* Trigger AI Ponder */}
                                    {isOnline && (
                                      <button
                                        onClick={() => {
                                          onTriggerAIPonder(verse.text, verse.numberInSurah);
                                          setActiveAyahMoreMenu(null);
                                        }}
                                        className="w-full text-right px-2.5 py-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-400 rounded-lg text-[11px] font-bold flex flex-row-reverse items-center justify-between gap-1.5 cursor-pointer border-t border-stone-800/50 pt-2 mt-1"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                                        <span className="truncate">تدبر ذكي بالذكاء الاصطناعي</span>
                                      </button>
                                    )}

                                    {/* Verse Story Link */}
                                    {hasStory(surahNumber, verse.numberInSurah) && (
                                      <button
                                        onClick={() => {
                                          const story = getStoryForVerse(surahNumber, verse.numberInSurah);
                                          if (story && onNavigateToStory) {
                                            onNavigateToStory(story.id);
                                          }
                                          setActiveAyahMoreMenu(null);
                                        }}
                                        className="w-full text-right px-2.5 py-1.5 hover:bg-stone-800 text-amber-500 rounded-lg text-[11px] font-bold flex flex-row-reverse items-center justify-between gap-1.5 cursor-pointer border-t border-stone-800/50 pt-2"
                                      >
                                        <BookOpen className="w-3.5 h-3.5 animate-pulse text-amber-450 shrink-0" />
                                        <span className="truncate">قصة الآية وعِبرها 📖</span>
                                      </button>
                                    )}

                                  </div>
                                </>
                              )}
                            </div>
                            
                          </div>
                        </div>

                        {/* Arabic text with custom styling */}
                        <div 
                          className={`w-full text-right leading-relaxed quran-text select-all cursor-pointer ${trueNightMode ? "hover:text-amber-500 hover:bg-stone-900/40 text-stone-300" : "hover:text-amber-400 hover:bg-stone-950/40 text-stone-50"} p-4 rounded-2xl transition-all border border-transparent hover:border-amber-500/20 active:scale-[0.99]`} 
                          style={{ fontSize: `${fontSize}px` }}
                          dir="rtl"
                          onClick={() => setSelectedVerseForTafsir(verse)}
                          title="انقر لقراءة التفسير والترجمة والتحكم بالآية الكريمة"
                        >
                          <span className={`${trueNightMode ? "text-stone-300" : "text-stone-50"} font-medium`}>
                            {cleanFirstVerseText(verse.text, verse.numberInSurah)}
                          </span>
                          <div className="text-[10px] text-amber-500/60 font-sans mt-2.5 flex items-center justify-end gap-1 font-semibold select-none">
                            <span>انقر لعرض التفسير والتحكم 🖚</span>
                          </div>
                        </div>

                        {/* Traditional translations section */}
                        {showTranslations && (
                          <div className={`border-t ${trueNightMode ? "border-stone-900" : "border-stone-850"} pt-3 flex flex-col gap-1.5`}>
                            <span className="text-[10px] font-bold text-stone-450 tracking-wide uppercase font-sans">Translation (English Sahih)</span>
                            <p className={`${trueNightMode ? "text-stone-400" : "text-stone-300"} text-sm font-sans leading-relaxed text-left`} dir="ltr">
                              {verse.translation}
                            </p>
                          </div>
                        )}

                        {/* Beautiful Arabic Al-Jalalayn Tafsir section inline */}
                        {showTafsir && (
                          <div className={`border ${trueNightMode ? "border-stone-900 bg-black/60" : "border-stone-800 bg-stone-900/50"} rounded-xl p-3 md:p-4 mt-1 flex flex-col gap-1.5`}>
                            <span className="text-[10px] font-extrabold text-[#c49a6c] tracking-wide border-b border-stone-850 pb-1 font-sans">تفسير الجلالين للآية الكريمة</span>
                            <p className={`${trueNightMode ? "text-stone-400" : "text-stone-300"} text-xs leading-relaxed font-sans text-right`}>
                              {verse.tafsir}
                            </p>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              
              /* Concentrated full-page book layout */
              <div className={`${trueNightMode ? "bg-black border-stone-900 shadow-inner" : "radial-dark-bg border border-stone-800"} rounded-3xl p-6 md:p-10 shadow-inner relative select-all leading-loose text-justify text-right`}>
                
                {/* Decorative golden geometric frames */}
                <div className={`absolute inset-4 border ${trueNightMode ? "border-stone-900/40" : "border-stone-800/40"} pointer-events-none rounded-2xl`}></div>
                
                <div className="relative z-10 select-all" style={{ fontSize: `${fontSize}px` }} dir="rtl">
                  
                  {surah.verses.map((verse) => {
                    const isPlayed = currentPlayingVerse?.surahNumber === surahNumber && currentPlayingVerse?.verseNumber === verse.numberInSurah;
                    const isCurrentHighlight = activeVerse === verse.numberInSurah || isPlayed;
                    
                    return (
                      <span 
                        key={verse.numberInSurah}
                        ref={(el) => { verseRefs.current[verse.numberInSurah] = el as any; }}
                        className={`inline cursor-pointer quran-text transition-all duration-300 py-1 px-1.5 rounded-xl hover:bg-amber-600/15 hover:text-amber-400 ${
                          isCurrentHighlight 
                            ? "bg-amber-500/20 text-amber-300 font-bold ring-2 ring-amber-500/50 px-2.5 mx-0.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse" 
                            : trueNightMode ? "text-stone-300" : "text-stone-100"
                        }`}
                        onClick={() => setSelectedVerseForTafsir(verse)}
                        title={`الآية ${verse.numberInSurah} • انقر لعرض التفسير والترجمة والتلاوة`}
                      >
                        {/* Trim bismillah calligraphy if needed for page mode formatting */}
                        {cleanFirstVerseText(verse.text, verse.numberInSurah) + " "}
                        
                        {/* Golden Ayah circle separator */}
                        <span className={`inline-flex items-center justify-center text-center text-sm md:text-base font-bold text-amber-500 select-none mx-2 font-sans ${trueNightMode ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-600/10 border-amber-500/20"} w-8 h-8 rounded-full`}>
                          {verse.numberInSurah}
                        </span>
                      </span>
                    );
                  })}
                </div>

                <div className="mt-8 pt-4 border-t border-stone-850 text-center text-xs text-stone-500 font-sans">
                  وضع الصفحة المترابطة المستكشفة • انقر على أي آية للاستماع المباشر إليها بصوت المقرئ
                </div>
              </div>
            )}

            {/* End-of-Surah navigation card (only if not searching) */}
            {!searchQuery && (
              <div className={`mt-8 border ${trueNightMode ? "bg-black/40 border-stone-900" : "bg-stone-900/40 border-stone-800"} rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-5 shadow-lg`}>
                <div className="w-12 h-12 rounded-full bg-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-500 select-none animate-bounce">
                  <span className="text-xl font-bold font-quran">۩</span>
                </div>
                
                <div className="flex flex-col gap-1.5 max-w-md">
                  <h4 className="text-sm sm:text-base font-extrabold text-[#c49a6c] font-sans">
                    تمت تلاوة سورة {surahName} بحمد الله وفضله 🌸
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-400 font-sans leading-relaxed">
                    تقبل الله منا ومنكم صالح الأعمال وجعل القرآن ربيع قلوبنا جميعاً ونور طريقنا. يمكنك الانتقال إلى السورة التالية أو العودة لفهرس السور.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm mt-1 sm:mt-2">
                  {surahNumber < 114 ? (
                    <button
                      onClick={() => onChangeSurah && onChangeSurah(surahNumber + 1)}
                      className="w-full px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs sm:text-sm font-extrabold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                    >
                      <span>السورة التالية: {getNextSurahName()}</span>
                      <ChevronLeft className="w-4 h-4 shrink-0" />
                    </button>
                  ) : (
                    <div className="text-xs text-amber-500 font-bold font-sans">
                      لقد بلغت نهاية سور القرآن الكريم (سورة الناس) 🎉
                    </div>
                  )}

                  <button
                    onClick={onBackToIndex}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-850 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/25 text-stone-300 hover:text-amber-500 text-xs sm:text-sm font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <LayoutGrid className="w-4 h-4 shrink-0" />
                    <span>العودة لفهرس الآيات</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Tafsir Modal for the selected verse */}
      {selectedVerseForTafsir && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedVerseForTafsir(null);
            }
          }}
        >
          <div 
            className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="border-b border-stone-850 px-5 py-4 flex items-center justify-between bg-stone-920 flex-row">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#c49a6c] font-sans">
                  سورة {surahName} • الآية {selectedVerseForTafsir.numberInSurah}
                </span>
              </div>
              <button 
                onClick={() => setSelectedVerseForTafsir(null)}
                className="p-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                title="إغلاق التفسير"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with scrollable canvas */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5 text-right">
              
              {/* Verse Text Area */}
              <div className="p-4 bg-stone-950/40 rounded-2xl border border-stone-850 flex flex-col gap-2 relative">
                <div className="absolute top-2 right-2 text-[10px] text-stone-500 font-sans tracking-wide select-none">۞ الآية {selectedVerseForTafsir.numberInSurah}</div>
                <div className="text-2xl md:text-3xl font-quran text-amber-100 text-center leading-relaxed quran-text select-all mt-4 py-2" dir="rtl">
                  {cleanFirstVerseText(selectedVerseForTafsir.text, selectedVerseForTafsir.numberInSurah)}
                </div>
                
                {/* Embedded Copy & Share for Modal Verse */}
                <div className="flex items-center justify-end gap-2 border-t border-stone-850/60 pt-2.5 mt-1.5">
                  <button
                    onClick={() => handleCopyVerse(selectedVerseForTafsir)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-sans font-bold bg-stone-900 border border-stone-850 hover:bg-stone-800 hover:text-emerald-400 transition-all flex items-center gap-1.5 text-stone-400 cursor-pointer"
                    title="نسخ الآية الكريمة"
                  >
                    {copiedVerseId === selectedVerseForTafsir.numberInSurah ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50 duration-200" />
                        <span className="text-emerald-400">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الآية</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleShareVerse(selectedVerseForTafsir)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-sans font-bold bg-stone-900 border border-stone-850 hover:bg-stone-800 hover:text-teal-400 transition-all flex items-center gap-1.5 text-stone-400 cursor-pointer"
                    title="مشاركة الآية وتفسيرها"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة</span>
                  </button>
                  <button
                    onClick={() => handleDownloadVerseImage(selectedVerseForTafsir)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-sans font-bold bg-stone-900 border border-stone-850 hover:bg-stone-800 hover:text-amber-400 transition-all flex items-center gap-1.5 text-stone-400 cursor-pointer"
                    title="تنزيل الآية وتفسيرها كبطاقة تفكر أوفلاين"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>تنزيل بطاقة الآية 📸</span>
                  </button>
                </div>
              </div>

              {/* Tafsir (Reliable Source) Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-start gap-2 bg-[#c49a6c]/5 border border-[#c49a6c]/15 p-2 rounded-xl">
                  <span className="text-[10px] font-extrabold text-[#c49a6c] bg-amber-600/10 border border-amber-500/20 px-2.5 py-1 rounded-md font-sans">
                     تفسير الجلالين (مصدر معتمد وموثوق)
                  </span>
                </div>
                <div className="bg-stone-950/25 border border-stone-850 p-4 rounded-xl">
                  <p className="text-stone-200 text-xs md:text-sm leading-relaxed font-sans text-right select-all">
                    {selectedVerseForTafsir.tafsir}
                  </p>
                </div>
              </div>

              {/* AI-Powered Revelation Context and Stories */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-start gap-2 bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl">
                  <span className="text-[10px] font-extrabold text-amber-500 bg-amber-600/10 border border-amber-500/25 px-2.5 py-1 rounded-md font-sans flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 fill-amber-500/30 text-amber-500 animate-pulse" />
                    أسباب النزول والقصص (مساعد ذكي)
                  </span>
                </div>

                {verseStory ? (
                  <div className="bg-amber-950/5 border border-amber-600/20 p-4 rounded-xl animate-in fade-in duration-200">
                    <div className="text-stone-200 text-xs leading-relaxed font-sans text-right select-all whitespace-pre-wrap prose prose-invert max-w-none">
                      <ReactMarkdown>{verseStory}</ReactMarkdown>
                    </div>
                  </div>
                ) : loadingStory ? (
                  <div className="bg-stone-950/20 border border-stone-850 p-6 rounded-xl flex flex-col items-center justify-center gap-3 text-center animate-pulse">
                    <Loader className="w-5 h-5 text-amber-500 animate-spin" />
                    <div className="text-center w-full">
                      <p className="text-xs font-bold text-stone-300 font-sans">جاري تدبر كتب السير وتواريخ النزول...</p>
                      <p className="text-[10px] text-stone-500 font-sans mt-0.5">استخراج أسباب النزول والعبر والقصص الصحيحة للآية الكريمة</p>
                    </div>
                  </div>
                ) : storyError ? (
                  <div className="bg-stone-950/20 border border-rose-950/30 p-4 rounded-xl flex flex-col gap-2">
                    <p className="text-xs text-rose-400 font-sans font-medium text-right">{storyError}</p>
                    <button
                      onClick={() => fetchVerseStory(selectedVerseForTafsir)}
                      className="text-xs font-bold text-amber-500 hover:text-amber-400 underline font-sans self-end cursor-pointer"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : !isOnline ? (
                  <div className="bg-stone-950/20 border border-[#c49a6c]/20 p-4 rounded-xl flex flex-col items-center text-center gap-2">
                    <p className="text-xs text-amber-500 font-sans font-medium">⚠️ ميزة أسباب النزول وسياق الآية تتطلب إنترنت</p>
                    <p className="text-[10px] text-stone-450 font-sans">تتطلب ميزات الاستكشاف والتدبر بالذكاء الاصطناعي اتصالاً نشطاً بالشبكة. يمكنك الاستعاضة عنها بقراءة تفسير الجلالين بالأعلى بالكامل بدون إنترنت!</p>
                  </div>
                ) : (
                  <div className="bg-stone-950/20 border border-stone-850 p-4 rounded-xl flex flex-col items-center text-center gap-3">
                    <div className="text-right w-full">
                      <p className="text-[11px] text-stone-400 font-sans leading-relaxed">
                        هل ترغب في معرفة سبب نزول الآية الكريمة وسياقها التاريخي مع قصة مبسطة ولطيفة تلخص العبرة الكامنة فيها؟
                      </p>
                    </div>
                    <button
                      onClick={() => fetchVerseStory(selectedVerseForTafsir)}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-[11px] font-sans flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/10 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
                      <span>استكشاف سبب النزول والقصة بالذكاء الاصطناعي</span>
                    </button>
                  </div>
                )}
              </div>

              {/* English Translation Section */}
              <div className="flex flex-col gap-2 text-left">
                <div className="flex items-center justify-start gap-2">
                  <span className="text-[10px] font-bold text-stone-450 tracking-widest uppercase font-sans border border-stone-800 px-2 py-0.5 rounded bg-stone-900">
                    Sahih International Translation
                  </span>
                </div>
                <div className="bg-stone-950/15 border border-stone-850 p-3.5 rounded-xl">
                  <p className="text-stone-300 text-xs font-sans leading-relaxed text-left" dir="ltr">
                    {selectedVerseForTafsir.translation}
                  </p>
                </div>
              </div>

              {/* Verses detail metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-sans text-stone-450 border-t border-stone-850/60 pt-4">
                <div className="bg-stone-920/40 p-2 rounded-lg border border-stone-850/50 text-center">
                  <span className="text-stone-500">الجزء: </span>
                  <span className="text-stone-300 font-semibold">{selectedVerseForTafsir.juz}</span>
                </div>
                <div className="bg-stone-920/40 p-2 rounded-lg border border-stone-850/50 text-center">
                  <span className="text-stone-500">الصفحة: </span>
                  <span className="text-stone-300 font-semibold">{selectedVerseForTafsir.page}</span>
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-stone-850 p-4 bg-stone-920 flex flex-col md:flex-row gap-3 justify-between items-center">
              
              {/* Quick Audio action */}
              <button
                onClick={async () => {
                  const isCached = cachedVerseNumbers.has(selectedVerseForTafsir.numberInSurah);
                  if (!isOnline && !isCached) {
                    triggerToast(isAr 
                      ? "⚠️ تشغيل التلاوة الصوتية يتطلب اتصالاً بالإنترنت أو أن تكون السورة منزلة كاملة مع الصوتيات مسبقاً." 
                      : "⚠️ Audio recitation requires an active internet connection or a full download with audio."
                    );
                    return;
                  }
                  const isPlayed = currentPlayingVerse?.surahNumber === surahNumber && currentPlayingVerse?.verseNumber === selectedVerseForTafsir.numberInSurah;
                  if (isPlayed && isPlaying) {
                    onStopPlay();
                  } else {
                    onPlayVerse(selectedVerseForTafsir.numberInSurah);
                  }
                }}
                className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  currentPlayingVerse?.surahNumber === surahNumber && currentPlayingVerse?.verseNumber === selectedVerseForTafsir.numberInSurah && isPlaying
                    ? "bg-rose-600 hover:bg-rose-500 text-stone-950 shadow-md"
                    : !isOnline && !cachedVerseNumbers.has(selectedVerseForTafsir.numberInSurah)
                      ? "bg-stone-850 text-stone-500 border border-stone-800 opacity-55 hover:opacity-100 cursor-not-allowed"
                      : "bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md animate-pulse"
                }`}
              >
                {currentPlayingVerse?.surahNumber === surahNumber && currentPlayingVerse?.verseNumber === selectedVerseForTafsir.numberInSurah && isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-stone-950 animate-bounce" />
                    <span>إيقاف الاستماع</span>
                  </>
                ) : !isOnline && !cachedVerseNumbers.has(selectedVerseForTafsir.numberInSurah) ? (
                  <>
                    <WifiOff className="w-4 h-4 text-stone-500" />
                    <span>{isAr ? "غير متوفر أوفلاين" : "Requires Online"}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-stone-950" />
                    <span>استماع لهذه الآية</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {/* Save bookmark */}
                <button
                  onClick={() => onToggleBookmark(selectedVerseForTafsir.numberInSurah, selectedVerseForTafsir.text)}
                  className={`flex-1 md:flex-none px-3 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                    isVerseBookmarked(selectedVerseForTafsir.numberInSurah)
                      ? "bg-amber-600/10 text-amber-500 border-amber-500/30"
                      : "bg-stone-850 hover:bg-stone-800 text-stone-300 border-stone-800"
                  }`}
                  title="حفظ الآية"
                >
                  {isVerseBookmarked(selectedVerseForTafsir.numberInSurah) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-amber-500 animate-in spin-in-12 duration-300" />
                      <span>محفوظة</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>حفظ</span>
                    </>
                  )}
                </button>

                {/* AI Guidance bot trigger */}
                <button
                  onClick={() => {
                    if (!isOnline) {
                      triggerToast(isAr 
                        ? "⚠️ مساعد التدبر بالذكاء الاصطناعي متوقف حالياً لعدم وجود اتصال بالإنترنت." 
                        : "⚠️ AI guidance bot requires an active internet connection."
                      );
                      return;
                    }
                    onTriggerAIPonder(selectedVerseForTafsir.text, selectedVerseForTafsir.numberInSurah);
                    setSelectedVerseForTafsir(null);
                  }}
                  className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-600/15 border border-amber-600/30 text-[#c49a6c] hover:bg-amber-600/25 transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>تدبر ذكي (ذكاء اصطناعي)</span>
                </button>

                {/* Go to Verse Story trigger if exists */}
                {hasStory(surahNumber, selectedVerseForTafsir.numberInSurah) && (
                  <button
                    onClick={() => {
                      const story = getStoryForVerse(surahNumber, selectedVerseForTafsir.numberInSurah);
                      if (story && onNavigateToStory) {
                        onNavigateToStory(story.id);
                        setSelectedVerseForTafsir(null);
                      }
                    }}
                    className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition flex items-center justify-center gap-1.5 cursor-pointer font-sans animate-bounce"
                  >
                    <BookOpen className="w-4 h-4 text-stone-950 fill-stone-950/15" />
                    <span>قصة الآية 📖</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Floating share/copy status Toast notification */}
      {toast && toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className="bg-stone-900 border border-amber-500/30 text-amber-400 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-sans text-xs sm:text-sm font-bold select-none backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span className="leading-none text-stone-200">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
