import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Calendar, CheckSquare, ChevronRight, HelpCircle, BookOpen, Clock, Loader2, Search, ArrowRight, ArrowLeft, Award, Compass, RefreshCw, Zap, Play, Pause, RotateCcw, Volume2, Info, Trash2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { surahList } from "../data/surahData";
import { recitersList } from "../types";
import { generateLocalMemorizationTips, generateLocalSimilarity, isLegacyErrorText } from "../utils/quranAiEngine";

interface PlanDay {
  dayNumber: number;
  title: string;
  targetVerses: string;
  notesAr: string;
  notesEn: string;
}

interface SimilarVerseMatch {
  text: string;
  surahName: string;
  ayahNumber: number;
  differenceDetails: string;
  connectionTip: string;
}

interface SimilarityResponse {
  originalVerse: string;
  similarVerses: SimilarVerseMatch[];
}

export default function AIMemorizationGateway({ currentLang = "ar" }: { currentLang: string }) {
  const isAr = currentLang === "ar";

  const [activeSubTab, setActiveSubTab] = useState<"plan" | "tutor" | "similarity">("plan");

  // --- New "Tutoring & Repetition (التعليم)" Feature State ---
  const [tutorSurahNum, setTutorSurahNum] = useState<number>(1);
  const [tutorStartAyah, setTutorStartAyah] = useState<number>(1);
  const [tutorEndAyah, setTutorEndAyah] = useState<number>(7);
  const [tutorReciterId, setTutorReciterId] = useState<string>("alafasy");
  const [tutorAyahRepeats, setTutorAyahRepeats] = useState<number>(3); // 1, 2, 3, 5, 10
  const [tutorRangeRepeats, setTutorRangeRepeats] = useState<number>(1); // 1, 2, 3, 5, 10, 999 (loop)
  const [tutorDelaySec, setTutorDelaySec] = useState<number>(2); // 0, 1, 2, 3, 5, 10
  
  const [tutorVerses, setTutorVerses] = useState<any[]>([]);
  const [tutorLoading, setTutorLoading] = useState<boolean>(false);
  const [tutorError, setTutorError] = useState<string | null>(null);

  // Playback control state
  const [tutorIsPlaying, setTutorIsPlaying] = useState<boolean>(false);
  const [tutorCurrentIndex, setTutorCurrentIndex] = useState<number>(-1); // Index in the selected verses subset
  const [tutorCurrentAyahPlayCount, setTutorCurrentAyahPlayCount] = useState<number>(0);
  const [tutorCurrentRangePlayCount, setTutorCurrentRangePlayCount] = useState<number>(0);
  const [tutorShowTafsir, setTutorShowTafsir] = useState<Record<number, boolean>>({});
  
  const tutorAudioRef = useRef<HTMLAudioElement | null>(null);
  const tutorTimeoutRef = useRef<any>(null);

  // Clean Bismillah function
  const cleanFirstVerseText = (text: string, verseNum: number) => {
    if (tutorSurahNum === 1 || tutorSurahNum === 9) return text;
    if (verseNum !== 1) return text;

    const bismillahPatterns = [
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
      "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
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

  // Load Surah verses for the tutor
  useEffect(() => {
    let active = true;
    const fetchTutorSurah = async () => {
      setTutorLoading(true);
      setTutorError(null);
      // Stop playback when Surah changes
      stopTutorPlayback();

      try {
        // Try local storage cache first if it exists
        const cached = localStorage.getItem(`offline_surah_${tutorSurahNum}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.verses && parsed.verses.length > 0) {
            if (active) {
              setTutorVerses(parsed.verses);
              setTutorStartAyah(1);
              setTutorEndAyah(parsed.verses.length);
              setTutorLoading(false);
              return;
            }
          }
        }

        let versesResult: any[] | null = null;

        try {
          const response = await fetch(`/api/surah/${tutorSurahNum}`);
          const contentType = response.headers.get("content-type") || "";
          if (response.ok && contentType.includes("application/json")) {
            const data = await response.json();
            if (data && data.verses && data.verses.length > 0 && !data.error) {
              versesResult = data.verses;
            }
          }
        } catch (serverErr) {
          console.warn("Primary tutor /api/surah failed, trying cloud fallback:", serverErr);
        }

        if (!versesResult) {
          try {
            const cloudRes = await fetch(
              `https://api.alquran.cloud/v1/surah/${tutorSurahNum}/editions/quran-uthmani,en.sahih,ar.jalalayn`
            );
            if (cloudRes.ok) {
              const cloudJson = await cloudRes.json();
              if (cloudJson.code === 200 && cloudJson.data && cloudJson.data.length >= 3) {
                const uthmaniData = cloudJson.data[0];
                const translationData = cloudJson.data[1];
                const tafsirData = cloudJson.data[2];

                versesResult = uthmaniData.ayahs.map((ayah: any, index: number) => ({
                  numberInSurah: ayah.numberInSurah,
                  text: ayah.text,
                  translation: translationData.ayahs[index]?.text || "",
                  tafsir: tafsirData.ayahs[index]?.text || "",
                  juz: ayah.juz,
                  page: ayah.page,
                  audio: `https://cdn.aladhan.com/sound/quran/alafasy-64/${ayah.number}.mp3`
                }));
              }
            }
          } catch (cloudErr) {
            console.warn("Direct cloud fallback failed:", cloudErr);
          }
        }

        if (!versesResult || versesResult.length === 0) {
          throw new Error(isAr ? "فشل تحميل بيانات السورة من الخادم." : "Failed to load Surah from server.");
        }

        if (active) {
          setTutorVerses(versesResult);
          setTutorStartAyah(1);
          setTutorEndAyah(versesResult.length);
        }
      } catch (err: any) {
        if (active) {
          setTutorError(err.message || (isAr ? "حدث خطأ أثناء تحميل السورة." : "An error occurred."));
        }
      } finally {
        if (active) {
          setTutorLoading(false);
        }
      }
    };

    fetchTutorSurah();
    return () => {
      active = false;
    };
  }, [tutorSurahNum]);

  // Stop playback when parameters change to avoid out of sync audio
  useEffect(() => {
    stopTutorPlayback();
  }, [tutorStartAyah, tutorEndAyah, tutorReciterId]);

  // Stop playback on unmount or tab change
  useEffect(() => {
    return () => {
      stopTutorPlayback();
    };
  }, [activeSubTab]);

  useEffect(() => {
    return () => {
      if (tutorTimeoutRef.current) clearTimeout(tutorTimeoutRef.current);
      if (tutorAudioRef.current) {
        tutorAudioRef.current.pause();
        tutorAudioRef.current.onended = null;
      }
    };
  }, []);

  const playTutorVerse = (index: number, ayahPlayCount: number, rangePlayCount: number) => {
    if (tutorTimeoutRef.current) {
      clearTimeout(tutorTimeoutRef.current);
    }

    if (tutorAudioRef.current) {
      tutorAudioRef.current.pause();
      tutorAudioRef.current.onended = null;
    }

    const activeVerses = tutorVerses.slice(tutorStartAyah - 1, tutorEndAyah);
    if (activeVerses.length === 0 || index < 0 || index >= activeVerses.length) {
      stopTutorPlayback();
      return;
    }

    const verse = activeVerses[index];
    setTutorCurrentIndex(index);
    setTutorCurrentAyahPlayCount(ayahPlayCount);
    setTutorCurrentRangePlayCount(rangePlayCount);

    const padSurah = String(tutorSurahNum).padStart(3, "0");
    const padAyah = String(verse.numberInSurah).padStart(3, "0");
    const reciter = recitersList.find(r => r.id === tutorReciterId) || recitersList[0];
    const url = `https://www.everyayah.com/data/${reciter.identifier}/${padSurah}${padAyah}.mp3`;

    const audio = new Audio(url);
    tutorAudioRef.current = audio;
    audio.play().catch(e => {
      console.error("Audio playback failed", e);
      handleAudioEnded(index, ayahPlayCount, rangePlayCount);
    });

    audio.onended = () => {
      handleAudioEnded(index, ayahPlayCount, rangePlayCount);
    };
  };

  const handleAudioEnded = (index: number, ayahPlayCount: number, rangePlayCount: number) => {
    const activeVerses = tutorVerses.slice(tutorStartAyah - 1, tutorEndAyah);
    
    if (ayahPlayCount < tutorAyahRepeats) {
      tutorTimeoutRef.current = setTimeout(() => {
        playTutorVerse(index, ayahPlayCount + 1, rangePlayCount);
      }, tutorDelaySec * 1000);
    } else {
      if (index + 1 < activeVerses.length) {
        tutorTimeoutRef.current = setTimeout(() => {
          playTutorVerse(index + 1, 1, rangePlayCount);
        }, tutorDelaySec * 1000);
      } else {
        if (rangePlayCount < tutorRangeRepeats || tutorRangeRepeats === 999) {
          tutorTimeoutRef.current = setTimeout(() => {
            playTutorVerse(0, 1, rangePlayCount === 999 ? 999 : rangePlayCount + 1);
          }, tutorDelaySec * 1000);
        } else {
          stopTutorPlayback();
        }
      }
    }
  };

  const startTutorPlayback = () => {
    if (tutorVerses.length === 0) return;
    setTutorIsPlaying(true);
    const startIndex = tutorCurrentIndex >= 0 ? tutorCurrentIndex : 0;
    const startAyahCount = tutorCurrentAyahPlayCount > 0 ? tutorCurrentAyahPlayCount : 1;
    const startRangeCount = tutorCurrentRangePlayCount > 0 ? tutorCurrentRangePlayCount : 1;
    playTutorVerse(startIndex, startAyahCount, startRangeCount);
  };

  const stopTutorPlayback = () => {
    setTutorIsPlaying(false);
    if (tutorTimeoutRef.current) {
      clearTimeout(tutorTimeoutRef.current);
    }
    if (tutorAudioRef.current) {
      tutorAudioRef.current.pause();
      tutorAudioRef.current.onended = null;
    }
  };

  const resetTutorPlayback = () => {
    stopTutorPlayback();
    setTutorCurrentIndex(-1);
    setTutorCurrentAyahPlayCount(0);
    setTutorCurrentRangePlayCount(0);
  };

  const playNextAyah = () => {
    const activeVerses = tutorVerses.slice(tutorStartAyah - 1, tutorEndAyah);
    if (tutorCurrentIndex + 1 < activeVerses.length) {
      playTutorVerse(tutorCurrentIndex + 1, 1, tutorCurrentRangePlayCount);
    }
  };

  const playPrevAyah = () => {
    if (tutorCurrentIndex > 0) {
      playTutorVerse(tutorCurrentIndex - 1, 1, tutorCurrentRangePlayCount);
    }
  };

  // State for Plan generation
  const [selectedTarget, setSelectedTarget] = useState<string>("juz-amma");
  const [selectedDuration, setSelectedDuration] = useState<string>("7-days");
  const [customTarget, setCustomTarget] = useState<string>("");
  const [activePlan, setActivePlan] = useState<PlanDay[]>([]);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [selectedDayForTips, setSelectedDayForTips] = useState<PlanDay | null>(null);
  
  // AI Tips loading states
  const [loadingTips, setLoadingTips] = useState<boolean>(false);
  const [activeTipsContent, setActiveTipsContent] = useState<string>("");

  // Mutashabihat state
  const [similarityInput, setSimilarityInput] = useState<string>("");
  const [loadingSimilarity, setLoadingSimilarity] = useState<boolean>(false);
  const [similarityResult, setSimilarityResult] = useState<SimilarityResponse | null>(null);
  const [similarityError, setSimilarityError] = useState<string | null>(null);

  // Load existing plan progress from local state on mount
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem("quran_memo_plan");
      const savedCompleted = localStorage.getItem("quran_memo_completed");
      const savedTarget = localStorage.getItem("quran_memo_target");
      const savedDuration = localStorage.getItem("quran_memo_duration");

      if (savedPlan) setActivePlan(JSON.parse(savedPlan));
      if (savedCompleted) setCompletedDays(JSON.parse(savedCompleted));
      if (savedTarget) setSelectedTarget(savedTarget);
      if (savedDuration) setSelectedDuration(savedDuration);
    } catch (e) {
      console.error("Failed to load memo plan from localStorage", e);
    }
  }, []);

  // Targets presets descriptions
  const targetPresets = [
    { id: "juz-amma", nameAr: "جزء عمّ (الجزء الثلاثون كاملًا)", nameEn: "Juz Amma (Chapter 30 Complete)", surahCount: 37 },
    { id: "juz-tabarak", nameAr: "جزء تبارك (الجزء التاسع والعشرون)", nameEn: "Juz Tabarak (Chapter 29 Complete)", surahCount: 11 },
    { id: "surah-alkahf", nameAr: "سورة الكهف كاملة", nameEn: "Surah Al-Kahf Complete", surahCount: 1 },
    { id: "surah-alkhaf-10", nameAr: "أول 10 آيات من سورة الكهف (الحفظ والحفظ العاصم)", nameEn: "First 10 Ayahs of Surah Al-Kahf", surahCount: 1 },
    { id: "surah-almulk", nameAr: "سورة الملك (المنجية من عذاب القبر)", nameEn: "Surah Al-Mulk (The Protector)", surahCount: 1 },
    { id: "surah-yaseen", nameAr: "سورة يس (قلب القرآن الطيب)", nameEn: "Surah Yaseen (Heart of Quran)", surahCount: 1 },
  ];

  // Duration presets
  const durationPresets = [
    { id: "3-days", nameAr: "3 أيام (تنفيذ مكثف وعالي الاستجابة)", nameEn: "3 Days (Intensive Speedrun)" },
    { id: "7-days", nameAr: "أسبوع واحد (متناسق ومنظم)", nameEn: "1 Week (Structured Balanced)" },
    { id: "14-days", nameAr: "أسبوعين كاملين (تدرج مريح)", nameEn: "14 Days (Leisure Gradual)" },
    { id: "30-days", nameAr: "شهر كامل (برنامج تمكيني منهجي)", nameEn: "30 Days (Comprehensive Retention)" },
  ];

  // Logic to generate local program outline before AI details enrichment
  const handleGeneratePlan = () => {
    let daysCount = 7;
    if (selectedDuration === "3-days") daysCount = 3;
    if (selectedDuration === "14-days") daysCount = 14;
    if (selectedDuration === "30-days") daysCount = 30;

    let targetName = "";
    if (selectedTarget === "custom") {
      targetName = customTarget || "ورد مخصص";
    } else {
      const p = targetPresets.find(x => x.id === selectedTarget);
      targetName = isAr ? p?.nameAr || "" : p?.nameEn || "";
    }

    // Generate balanced outline distribution
    const generated: PlanDay[] = [];
    for (let i = 1; i <= daysCount; i++) {
      generated.push({
        dayNumber: i,
        title: isAr ? `برنامج اليوم ${i} لـ ${targetName}` : `Day ${i} guide for ${targetName}`,
        targetVerses: isAr 
          ? `المقرر: الحفظ والتسجيل المنهجي للجزء رقم ${i} من المستهدف`
          : `Assigned portion: Recitation & memorizing partition #${i} of your target`,
        notesAr: `ركز هذا اليوم على القراءة المسموعة الصحيحة، التكرار المتباعد 5 مرات، وربط نهايات الآيات ببعضها إيمانيًا.`,
        notesEn: `Prioritize listening to correct vocal recitation, 5x spaced repetitions, and meditating on the deep thematic flow of the verses.`
      });
    }

    setActivePlan(generated);
    setCompletedDays([]);
    setSelectedDayForTips(null);
    setActiveTipsContent("");

    // Save defaults
    try {
      localStorage.setItem("quran_memo_plan", JSON.stringify(generated));
      localStorage.setItem("quran_memo_completed", JSON.stringify([]));
      localStorage.setItem("quran_memo_target", selectedTarget);
      localStorage.setItem("quran_memo_duration", selectedDuration);
    } catch (e) {
      console.warn("Storage write failed", e);
    }
  };

  // Toggle completion of a day
  const handleToggleDay = (dayNum: number) => {
    let updated: number[];
    if (completedDays.includes(dayNum)) {
      updated = completedDays.filter(d => d !== dayNum);
    } else {
      updated = [...completedDays, dayNum];
    }
    setCompletedDays(updated);
    try {
      localStorage.setItem("quran_memo_completed", JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Fetch AI memorization tips for the selected day
  const fetchDayTips = async (day: PlanDay) => {
    setSelectedDayForTips(day);
    setLoadingTips(true);
    setActiveTipsContent("");

    try {
      const response = await fetch("/api/ai/memorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tips",
          dayDetails: {
            dayNumber: day.dayNumber,
            targetPreset: selectedTarget,
            duration: selectedDuration,
            customPrompt: customTarget,
            assignedPortion: day.targetVerses
          }
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Fallback
      }

      const dayDetailsPayload = {
        dayNumber: day.dayNumber,
        targetPreset: selectedTarget,
        duration: selectedDuration,
        customPrompt: customTarget,
        assignedPortion: day.targetVerses
      };
      if (data?.result && !isLegacyErrorText(data.result)) {
        setActiveTipsContent(data.result);
      } else {
        setActiveTipsContent(generateLocalMemorizationTips(dayDetailsPayload));
      }
    } catch (err: any) {
      setActiveTipsContent(
        generateLocalMemorizationTips({
          dayNumber: day.dayNumber,
          targetPreset: selectedTarget,
          duration: selectedDuration,
          customPrompt: customTarget,
          assignedPortion: day.targetVerses
        })
      );
    } finally {
      setLoadingTips(false);
    }
  };

  // Clear current saved plan
  const handleResetPlan = () => {
    setActivePlan([]);
    setCompletedDays([]);
    setSelectedDayForTips(null);
    setActiveTipsContent("");
    try {
      localStorage.removeItem("quran_memo_plan");
      localStorage.removeItem("quran_memo_completed");
    } catch (err) {
      console.warn(err);
    }
  };

  // Find Mutashabihat (Similarity) via server Gemini API
  const handleFindSimilarity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!similarityInput.trim()) return;

    setLoadingSimilarity(true);
    setSimilarityResult(null);
    setSimilarityError(null);

    try {
      const response = await fetch("/api/ai/memorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "similarity",
          query: similarityInput
        })
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        // Fallback
      }

      if (data && data.originalVerse && Array.isArray(data.similarVerses)) {
        setSimilarityResult(data);
      } else {
        setSimilarityResult(generateLocalSimilarity(similarityInput));
      }
    } catch (err: any) {
      setSimilarityResult(generateLocalSimilarity(similarityInput));
    } finally {
      setLoadingSimilarity(false);
    }
  };

  // Progress Calculations
  const totalDays = activePlan.length;
  const progressPercent = totalDays > 0 ? Math.round((completedDays.length / totalDays) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 py-2 animate-in fade-in duration-300">
      
      {/* Visual Header Banner */}
      <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 md:p-6 mb-6 flex flex-col lg:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 text-right flex-row z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-[#d97706] flex items-center justify-center text-stone-950 font-bold shrink-0 shadow-lg shadow-amber-600/10">
            <Award className="w-6 h-6 text-stone-950" />
          </div>
          <div className="text-right">
            <h2 className="text-base md:text-lg font-black text-stone-100 font-sans flex items-center gap-1.5 justify-start">
              <span>{isAr ? "المُرافق الفوري لتحفيظ ومراجعة القرآن الكريم" : "AI Quran Memorization Companion"}</span>
              <span className="text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest font-sans">
                {isAr ? "مبتكر" : "New"}
              </span>
            </h2>
            <p className="text-xs text-stone-400 font-sans mt-0.5 leading-relaxed max-w-xl">
              {isAr 
                ? "اصنع خطة حفظ مخصصة لورد اليوم وسرّع من ثباتك بفضل تكنولوجيا المساعدة الذكية في اكتشاف المتشابهات اللفظية والضبط بالروابط العقلية الفائقة."
                : "Create a fully personalized daily revision structure and retain verses with cognitive-linked mnemonic guidelines."}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-stone-850 mb-6 font-sans overflow-x-auto gap-1 sm:gap-2 pb-px scrollbar-none select-none" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} dir={isAr ? "rtl" : "ltr"}>
        <button
          onClick={() => setActiveSubTab("plan")}
          className={`py-3 px-4 text-xs font-bold transition-all relative flex items-center justify-center gap-2 shrink-0 cursor-pointer rounded-t-xl ${
            activeSubTab === "plan"
              ? "text-amber-500 font-extrabold border-b-2 border-amber-500 bg-amber-500/[0.03]"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/30"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isAr ? "منهج الحفظ المنهجي" : "Timeline Plan"}</span>
        </button>
        <button
          onClick={() => setActiveSubTab("tutor")}
          className={`py-3 px-4 text-xs font-bold transition-all relative flex items-center justify-center gap-2 shrink-0 cursor-pointer rounded-t-xl ${
            activeSubTab === "tutor"
              ? "text-amber-500 font-extrabold border-b-2 border-amber-500 bg-amber-500/[0.03]"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/30"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isAr ? "جهاز التكرار والتسميع" : "Interactive Repeater"}</span>
        </button>
        <button
          onClick={() => setActiveSubTab("similarity")}
          className={`py-3 px-4 text-xs font-bold transition-all relative flex items-center justify-center gap-2 shrink-0 cursor-pointer rounded-t-xl ${
            activeSubTab === "similarity"
              ? "text-amber-500 font-extrabold border-b-2 border-amber-500 bg-amber-500/[0.03]"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/30"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isAr ? "مكتشف المتشابهات اللفظية" : "Mnemonic Matcher"}</span>
        </button>
      </div>

      {activeSubTab === "plan" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
          
          {/* Left Column: Planner Config & Main List (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Plan generator panel (If no active plan) */}
            {activePlan.length === 0 ? (
              <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 md:p-6 shadow-md shadow-stone-950/20">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-extrabold text-stone-200 font-sans">
                    {isAr ? "بناء خطة التحفيظ الذاتية" : "Establish Custom Daily Timeline"}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 font-sans mb-2 text-right" dir="rtl">
                      {isAr ? "1. اختر الجزء أو العبادة المستهدفة للحفظ والمراجعة:" : "1. Select target Surah or Chapter limit:"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
                      {targetPresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedTarget(preset.id)}
                          className={`p-3 rounded-2xl border text-xs font-semibold font-sans text-right transition cursor-pointer flex flex-col gap-1 ${
                            selectedTarget === preset.id
                              ? "bg-amber-600/15 border-amber-500 text-amber-400"
                              : "bg-stone-950/45 border-stone-850 text-stone-300 hover:border-amber-500/20"
                          }`}
                        >
                          <span className="font-extrabold">{isAr ? preset.nameAr : preset.nameEn}</span>
                          {preset.surahCount > 0 && (
                            <span className="text-[10px] text-stone-500">
                              {isAr ? `تضم ما يقارب: ${preset.surahCount} سورة` : `Contains approximately: ${preset.surahCount} portion(s)`}
                            </span>
                          )}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedTarget("custom")}
                        className={`p-3 rounded-2xl border text-xs font-semibold font-sans text-right transition cursor-pointer flex flex-col gap-1 ${
                          selectedTarget === "custom"
                            ? "bg-amber-600/15 border-amber-500 text-amber-400"
                            : "bg-stone-950/45 border-stone-850 text-stone-300 hover:border-amber-500/20"
                        }`}
                      >
                        <span className="font-extrabold">{isAr ? "مستهدف مخصّص إضافي (تكتبه بنفسك)" : "Custom Targeted Verse / Concept"}</span>
                        <span className="text-[10px] text-stone-500">{isAr ? "مثل: سورة البقرة صفحة 10" : "E.g., Al-Baqarah Ayahs 1 to 20"}</span>
                      </button>
                    </div>
                  </div>

                  {selectedTarget === "custom" && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                      <input
                        type="text"
                        value={customTarget}
                        onChange={(e) => setCustomTarget(e.target.value)}
                        placeholder={isAr ? "اكتب السورة، الآيات أو الأجزاء المراد جدولتها لمراجعتها هنا..." : "Type custom surah, pages, or chapters..."}
                        className="w-full bg-stone-950 border border-stone-850 rounded-2xl px-4 py-3 text-xs md:text-sm text-stone-200 placeholder-stone-600 font-sans text-right"
                        dir="rtl"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-400 font-sans mb-2 text-right" dir="rtl">
                      {isAr ? "2. حدد الفترة الزمنية المتاحة للتنفيذ والتمكين:" : "2. Select target completion period:"}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-right">
                      {durationPresets.map((dur) => (
                        <button
                          key={dur.id}
                          type="button"
                          onClick={() => setSelectedDuration(dur.id)}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold font-sans text-center transition cursor-pointer ${
                            selectedDuration === dur.id
                              ? "bg-amber-600/15 border-amber-500 text-amber-400"
                              : "bg-stone-950/45 border-stone-850 text-stone-400 hover:border-amber-500/20"
                          }`}
                        >
                          {isAr ? dur.nameAr : dur.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGeneratePlan}
                    className="w-full bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-stone-950 font-black text-xs md:text-sm py-3.5 px-4 rounded-2xl transition shadow-lg shadow-amber-600/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-stone-950" />
                    <span>{isAr ? "توليد الخطة الذكية ومتابعة الإنجاز" : "Generate Dynamic Plan Outline"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active plan list and progress widget */
              <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 md:p-6 shadow-md shadow-stone-950/10 relative overflow-hidden">
                
                {/* Progress Summary */}
                <div className={`flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-850 pb-5 mb-5 ${isAr ? "md:flex-row-reverse" : ""}`}>
                  <div className="text-right">
                    <h4 className="text-xs font-extrabold text-stone-400 font-sans">
                      {isAr ? "مستوى إنجاز الورد الحالي" : "Portion Achievement Completion"}
                    </h4>
                    <div className={`flex items-baseline gap-2 mt-1 justify-end ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="text-2xl font-black text-amber-500 font-sans">{progressPercent}%</span>
                      <span className="text-xs text-stone-500 font-sans">
                        ({completedDays.length} {isAr ? "من أصل" : "of"} {totalDays} {isAr ? "أيام منجز كليًا" : "days"})
                      </span>
                    </div>
                  </div>

                  <div className="w-32 bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-850">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300 rounded-full" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={handleResetPlan}
                    className="text-[10px] font-bold text-rose-400 bg-rose-955/10 border border-rose-900/20 hover:bg-rose-950/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    {isAr ? "إعادة تعيين وبدء خطة أخرى" : "Reset & Create New Plan"}
                  </button>
                </div>

                {/* Day-by-Day scrollable listing */}
                <h4 className="text-xs font-black text-stone-300 font-sans tracking-wide mb-3 text-right">
                  {isAr ? "جدول الأيام التدريسي:" : "Portion Schedule Map:"}
                </h4>
                
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {activePlan.map((day) => {
                    const isCompleted = completedDays.includes(day.dayNumber);
                    const isViewing = selectedDayForTips?.dayNumber === day.dayNumber;
                    
                    return (
                      <div 
                        key={day.dayNumber}
                        className={`p-3 rounded-2xl border transition duration-200 flex items-center justify-between gap-3 ${
                          isCompleted 
                            ? "bg-amber-600/5 border-amber-600/30 text-stone-300" 
                            : isViewing
                              ? "bg-stone-850/90 border-amber-500/40 text-stone-100"
                              : "bg-stone-950/40 hover:bg-stone-950/80 border-stone-850 text-stone-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchDayTips(day)}
                            className={`text-[10px] font-black px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 font-sans ${
                              isViewing
                                ? "bg-amber-600 text-stone-950"
                                : "bg-stone-900 hover:bg-stone-800 text-amber-500 border border-stone-800"
                            }`}
                          >
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{isAr ? "توجيهات الحفظ" : "Tutor Advice"}</span>
                          </button>
                        </div>

                        {/* Info and Checkbox */}
                        <div className="flex items-center gap-3 text-right flex-row-reverse flex-1">
                          <button
                            onClick={() => handleToggleDay(day.dayNumber)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition border cursor-pointer ${
                              isCompleted 
                                ? "bg-amber-500 border-amber-600 text-stone-950" 
                                : "border-stone-700 bg-stone-900 text-transparent hover:border-amber-400"
                            }`}
                          >
                            {isCompleted && <span className="text-[12px] font-black">✓</span>}
                          </button>
                          
                          <div className="text-right cursor-pointer" onClick={() => fetchDayTips(day)}>
                            <span className={`text-[11px] font-extrabold font-sans ${isCompleted ? "text-stone-500 line-through" : "text-stone-200"}`}>
                              {isAr ? `اليوم رقم ${day.dayNumber}` : `Day ${day.dayNumber}`}
                            </span>
                            <p className={`text-[10px] font-quran leading-relaxed mt-0.5 ${isCompleted ? "text-stone-600" : "text-amber-500"}`}>
                              {day.targetVerses}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Celebration */}
                {progressPercent === 100 && (
                  <div className="mt-5 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col items-center text-center animate-bounce">
                    <span className="text-xl">🎉</span>
                    <h4 className="text-xs font-black text-emerald-400 font-sans mt-1">
                      {isAr ? "مبارك الإنجاز بالكامل والتمكين المتقن!" : "Congratulations! You have achieved 100% completion!"}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-sans mt-0.5">
                      {isAr ? "تثبيت ومراجعة مستمرة ستضمن بقاء هذه الآيات في وجدانك للأبد." : "A consistent routine ensures these verses remain in your soul forever."}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: AI Advice (5 Cols) */}
          <div className="lg:col-span-5">
            {/* AI Tips feedback box (If a day is selected) */}
            {selectedDayForTips ? (
              <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 shadow-lg shadow-stone-950/20 space-y-3.5 animate-in slide-in-from-right-2 duration-300">
                <div className="flex items-center justify-between border-b border-stone-850 pb-3">
                  <div className="flex items-center gap-1.5 text-right flex-row-reverse">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black text-amber-500 font-sans">
                      {isAr ? `توجيهات الحفظ الذكية - اليوم ${selectedDayForTips.dayNumber}` : `Cognitive Retention Advice - Day ${selectedDayForTips.dayNumber}`}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedDayForTips(null)}
                    className="text-[10px] text-stone-500 hover:text-stone-300 transition"
                  >
                    {isAr ? "إغلاق" : "Close"}
                  </button>
                </div>

                {loadingTips ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <span className="text-xs text-stone-400 font-sans">
                      {isAr ? "يقوم مرشد الحفظ بدراسة سياق السورة والآيات لاستخلاص طرق الحفظ المثالية..." : "Generating custom retrieval mnemonics..."}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4 text-right" dir="rtl">
                    {/* Assigned summary */}
                    <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-850">
                      <span className="text-[10px] text-stone-400 font-sans block mb-1">
                        {isAr ? "الورد المتابع:" : "Portion:"}
                      </span>
                      <p className="text-xs font-quran text-amber-400">
                        {selectedDayForTips.targetVerses}
                      </p>
                      <p className="text-[10px] text-stone-400 leading-relaxed font-sans mt-2">
                        {isAr ? selectedDayForTips.notesAr : selectedDayForTips.notesEn}
                      </p>
                    </div>

                    {/* AI Generated Output markdown */}
                    <div className="text-stone-200 text-xs md:text-sm leading-relaxed p-1 select-all font-sans bg-stone-900/40 rounded-2xl">
                      <div className="markdown-body text-right">
                        <ReactMarkdown>{activeTipsContent}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-stone-900/40 border border-stone-850 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Sparkles className="w-8 h-8 text-stone-600 mb-3 animate-pulse" />
                <h4 className="text-xs font-bold text-stone-400 font-sans">
                  {isAr ? "توجيهات الحفظ والروابط المنهجية" : "AI Cognitive Guidelines"}
                </h4>
                <p className="text-[10px] text-stone-500 font-sans max-w-xs mt-1.5 leading-relaxed">
                  {isAr 
                    ? "اختر يوماً من جدول الأيام المنجزة أو المتبقية، وسيقوم مرشد الحفظ بدراسة سياق السورة ليرسم لك روابط ذهنية ميسرة." 
                    : "Select a day from the active plan schedule, and the AI Tutor will analyze Surah contexts to retrieve mnemonics."}
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- New Tab: Interactive Verse Repeater (التعليم) --- */}
      {activeSubTab === "tutor" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Controls & Setup Selector */}
          <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 md:p-6 shadow-md shadow-stone-950/20">
            <div className="flex items-center gap-2 border-b border-stone-850 pb-4 mb-5 flex-row-reverse">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-extrabold text-stone-200 font-sans w-full text-right">
                {isAr ? "تخصيص لوحة التعليم والتكرار التلقائي" : "Configure Audio Repetition Tutor"}
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-right" dir="rtl">
              
              {/* Surah Selector */}
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-stone-400 font-sans">
                  {isAr ? "اختر السورة الكريمة:" : "Select Surah:"}
                </label>
                <select
                  value={tutorSurahNum}
                  onChange={(e) => setTutorSurahNum(parseInt(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-sans font-bold focus:border-amber-500/50 outline-none cursor-pointer"
                >
                  {surahList.map((s) => (
                    <option key={s.number} value={s.number} className="bg-stone-950 text-stone-200">
                      {s.number}. {s.name} ({s.numberOfAyahs} آية)
                    </option>
                  ))}
                </select>
              </div>

              {/* Reciter Selector */}
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-stone-400 font-sans">
                  {isAr ? "اختر القارئ المفضّل:" : "Select Reciter:"}
                </label>
                <select
                  value={tutorReciterId}
                  onChange={(e) => setTutorReciterId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-sans font-bold focus:border-amber-500/50 outline-none cursor-pointer"
                >
                  <optgroup label={isAr ? "🕌 قراء الحرمين الشريفين" : "Two Holy Mosques Imams"}>
                    {recitersList.filter(r => r.category === 'haramain').map((r) => (
                      <option key={r.id} value={r.id} className="bg-stone-950 text-stone-200">
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={isAr ? "✨ قراء التجويد والمجود" : "Masters of Tajweed"}>
                    {recitersList.filter(r => r.category === 'tajweed').map((r) => (
                      <option key={r.id} value={r.id} className="bg-stone-950 text-stone-200">
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={isAr ? "📖 قراء الروايات (ورش عن نافع)" : "Narrations (Warsh)"}>
                    {recitersList.filter(r => r.category === 'riwayat').map((r) => (
                      <option key={r.id} value={r.id} className="bg-stone-950 text-stone-200">
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={isAr ? "🎙️ قراء الترتيل الخاشع" : "Murattal Reciters"}>
                    {recitersList.filter(r => r.category === 'murattal').map((r) => (
                      <option key={r.id} value={r.id} className="bg-stone-950 text-stone-200">
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Start Ayah Selector */}
              <div className="flex flex-col gap-1.5 col-span-1">
                <label className="text-[11px] font-bold text-stone-400 font-sans">
                  {isAr ? "من الآية:" : "From Ayah:"}
                </label>
                <select
                  value={tutorStartAyah}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setTutorStartAyah(val);
                    if (val > tutorEndAyah) setTutorEndAyah(val);
                  }}
                  className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-sans font-bold focus:border-amber-500/50 outline-none cursor-pointer"
                >
                  {Array.from({ length: tutorVerses.length || 7 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1} className="bg-stone-950 text-stone-200">
                      {idx + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Ayah Selector */}
              <div className="flex flex-col gap-1.5 col-span-1">
                <label className="text-[11px] font-bold text-stone-400 font-sans">
                  {isAr ? "إلى الآية:" : "To Ayah:"}
                </label>
                <select
                  value={tutorEndAyah}
                  onChange={(e) => setTutorEndAyah(parseInt(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-sans font-bold focus:border-amber-500/50 outline-none cursor-pointer"
                >
                  {Array.from({ length: (tutorVerses.length || 7) - tutorStartAyah + 1 }).map((_, idx) => {
                    const val = tutorStartAyah + idx;
                    return (
                      <option key={val} value={val} className="bg-stone-950 text-stone-200">
                        {val}
                      </option>
                    );
                  })}
                </select>
              </div>

            </div>

            <hr className="border-stone-850 my-5" />

            {/* Loop and repeat configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-right" dir="rtl">
              
              {/* Ayah repeats count */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-stone-400 font-sans flex items-center gap-1 justify-start">
                  <span>{isAr ? "تكرار كل آية منفردة:" : "Repeat each ayah:"}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.2 rounded font-extrabold">{tutorAyahRepeats} {isAr ? "مرات" : "times"}</span>
                </label>
                <div className="grid grid-cols-5 gap-1 w-full">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTutorAyahRepeats(num)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        tutorAyahRepeats === num
                          ? "bg-amber-600/15 border-amber-500 text-amber-400 font-black"
                          : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      {num}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Range repeats count */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-stone-400 font-sans flex items-center gap-1 justify-start">
                  <span>{isAr ? "تكرار المجموعة كاملة:" : "Repeat the whole group:"}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.2 rounded font-extrabold">
                    {tutorRangeRepeats === 999 ? (isAr ? "بلا نهاية" : "Loop") : `${tutorRangeRepeats} ${isAr ? "مرة" : "times"}`}
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1 w-full">
                  {[1, 2, 3, 5, 999].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTutorRangeRepeats(num)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        tutorRangeRepeats === num
                          ? "bg-amber-600/15 border-amber-500 text-amber-400 font-black"
                          : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      {num === 999 ? "∞" : `${num}x`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delay between ayahs */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-stone-400 font-sans flex items-center gap-1 justify-start">
                  <span>{isAr ? "فترة التوقف المضافة بين الآيات:" : "Delay between ayahs:"}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.2 rounded font-extrabold">{tutorDelaySec}s</span>
                </label>
                <div className="grid grid-cols-5 gap-1 w-full">
                  {[0, 1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTutorDelaySec(num)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        tutorDelaySec === num
                          ? "bg-amber-600/15 border-amber-500 text-amber-400 font-black"
                          : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      {num === 0 ? (isAr ? "بدون" : "None") : `${num}ث`}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Interactive Playback Control Panel */}
          <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-850 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Playback details */}
            <div className="flex flex-col sm:flex-row-reverse items-center text-center sm:text-right gap-3.5 w-full md:w-auto" dir="rtl">
              <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-stone-850 flex items-center justify-center text-amber-500 shrink-0">
                <Volume2 className={`w-5 h-5 ${tutorIsPlaying ? "animate-pulse" : ""}`} />
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
                <h4 className="text-xs font-black text-stone-200 font-sans">
                  {tutorIsPlaying 
                    ? (isAr ? "حلقة القراءة والتحفيظ متصلة..." : "Interactive Playback Active...") 
                    : (isAr ? "جهاز التكرار والتعليم جاهز للتشغيل" : "Tutor Paused")}
                </h4>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 text-[10px] text-stone-500 mt-1 font-sans">
                  <span>
                    {isAr ? "الآيات المستهدفة:" : "Target ayahs:"} ({tutorStartAyah} - {tutorEndAyah})
                  </span>
                  <span>•</span>
                  <span>
                    {isAr ? "آية" : "Ayah"} {tutorCurrentIndex >= 0 ? tutorStartAyah + tutorCurrentIndex : tutorStartAyah}
                  </span>
                  {tutorIsPlaying && (
                    <>
                      <span>•</span>
                      <span className="text-amber-500 font-bold">
                        {isAr ? "تكرار الآية الحالية:" : "Ayah Repeat:"} {tutorCurrentAyahPlayCount}/{tutorAyahRepeats}
                      </span>
                      <span>•</span>
                      <span className="text-amber-500 font-bold">
                        {isAr ? "دورة المجموعة:" : "Group cycle:"} {tutorCurrentRangePlayCount}/{tutorRangeRepeats === 999 ? "∞" : tutorRangeRepeats}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Core Buttons */}
            <div className="flex items-center gap-3">
              
              {/* Reset button */}
              <button
                onClick={resetTutorPlayback}
                title={isAr ? "إعادة ضبط وتصفير التكرار" : "Reset loop settings"}
                className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-850 hover:bg-stone-900 text-stone-400 hover:text-stone-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Prev button */}
              <button
                onClick={playPrevAyah}
                disabled={tutorCurrentIndex <= 0}
                title={isAr ? "الآية السابقة" : "Previous Ayah"}
                className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-850 hover:bg-stone-900 disabled:opacity-30 text-stone-300 hover:text-amber-500 flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </button>

              {/* Main Play/Pause Button */}
              <button
                onClick={tutorIsPlaying ? stopTutorPlayback : startTutorPlayback}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-[#d97706] hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-600/20 flex items-center justify-center transition-all hover:scale-[1.05] active:scale-[0.97] cursor-pointer"
              >
                {tutorIsPlaying ? (
                  <Pause className="w-6 h-6 fill-stone-950 stroke-stone-950" />
                ) : (
                  <Play className="w-6 h-6 fill-stone-950 stroke-stone-950" />
                )}
              </button>

              {/* Next button */}
              <button
                onClick={playNextAyah}
                disabled={tutorCurrentIndex < 0 || tutorCurrentIndex >= tutorEndAyah - tutorStartAyah}
                title={isAr ? "الآية التالية" : "Next Ayah"}
                className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-850 hover:bg-stone-900 disabled:opacity-30 text-stone-300 hover:text-amber-500 flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

            </div>

          </div>

          {/* Loader or Error or Verses List */}
          {tutorLoading ? (
            <div className="py-20 flex flex-col items-center justify-center bg-stone-900 border border-stone-850 rounded-3xl text-center gap-3">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              <p className="text-xs text-stone-400 font-sans">
                {isAr ? "جاري تحميل وتنسيق آيات السورة الكريمة للتعليم..." : "Downloading and formatting verses for memorization..."}
              </p>
            </div>
          ) : tutorError ? (
            <div className="p-6 bg-stone-900 border border-rose-900/30 rounded-3xl text-center text-rose-400 text-xs font-sans">
              {tutorError}
            </div>
          ) : (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between px-1.5 flex-row-reverse" dir="rtl">
                <span className="text-[10px] text-stone-500 uppercase font-sans tracking-wider font-extrabold">
                  {isAr 
                    ? `عرض الآيات من ${tutorStartAyah} إلى ${tutorEndAyah} (${tutorEndAyah - tutorStartAyah + 1} آية)` 
                    : `Showing verses ${tutorStartAyah} to ${tutorEndAyah} (${tutorEndAyah - tutorStartAyah + 1} verses)`}
                </span>
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/5 px-2.5 py-0.5 rounded-full border border-amber-500/10 font-sans">
                  {isAr ? "انقر على أي آية لبدء التكرار الفردي والمجمل منها" : "Click any verse to start repeating from it"}
                </span>
              </div>

              {/* Verses Scroll list */}
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {tutorSurahNum !== 9 && tutorStartAyah === 1 && (
                  <div className="w-full flex flex-col items-center justify-center py-6 mb-2 select-none animate-in fade-in duration-300" id="basmala-header-tutor" dir="rtl">
                    <div className="flex items-center gap-4 w-full max-w-lg justify-center">
                      <div className="h-px bg-gradient-to-r from-transparent to-amber-500/40 flex-1" />
                      <span className="text-amber-500/60 text-xs">۞</span>
                      <div className="text-2xl md:text-3.5xl font-quran text-amber-500 font-medium tracking-wider text-center drop-shadow-[0_2px_10px_rgba(245,158,11,0.15)] glow-accent font-sans">
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </div>
                      <span className="text-amber-500/60 text-xs">۞</span>
                      <div className="h-px bg-gradient-to-l from-transparent to-amber-500/40 flex-1" />
                    </div>
                  </div>
                )}
                {tutorVerses.slice(tutorStartAyah - 1, tutorEndAyah).map((verse, index) => {
                  const isCurrent = index === tutorCurrentIndex;
                  const showTaf = tutorShowTafsir[verse.numberInSurah] || false;

                  return (
                    <div
                      key={verse.numberInSurah}
                      className={`p-4 rounded-3xl border transition duration-300 text-right ${
                        isCurrent
                          ? "bg-amber-600/10 border-amber-500/60 shadow-lg shadow-amber-600/5"
                          : "bg-stone-900/50 hover:bg-stone-900 border-stone-850 hover:border-amber-500/20"
                      }`}
                    >
                      
                      {/* Top Action Ribbon for Verse */}
                      <div className="flex items-center justify-between gap-2 border-b border-stone-850/50 pb-2.5 mb-3 flex-row-reverse">
                        
                        {/* Right: Ayah Number Indicator Badge */}
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <button
                            onClick={() => playTutorVerse(index, 1, tutorCurrentRangePlayCount || 1)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border cursor-pointer ${
                              isCurrent
                                ? "bg-amber-500 border-amber-600 text-stone-950 scale-105"
                                : "bg-stone-950 border-stone-850 text-amber-500 hover:border-amber-500"
                            }`}
                          >
                            {verse.numberInSurah}
                          </button>
                          
                          {isCurrent && (
                            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/10 font-bold font-sans animate-pulse">
                              {isAr ? "جاري الاستماع" : "Playing"} • {tutorCurrentAyahPlayCount}/{tutorAyahRepeats}
                            </span>
                          )}
                        </div>

                        {/* Left: Action Utilities */}
                        <div className="flex items-center gap-1.5">
                          {/* Tafsir button */}
                          <button
                            onClick={() => {
                              setTutorShowTafsir(prev => ({
                                ...prev,
                                [verse.numberInSurah]: !showTaf
                              }));
                            }}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                              showTaf
                                ? "bg-amber-600/15 border-amber-500 text-amber-400"
                                : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-300"
                            }`}
                          >
                            {isAr ? "التفسير الميسّر" : "Tafsir"}
                          </button>

                          {/* Quick single play trigger */}
                          <button
                            onClick={() => playTutorVerse(index, 1, 1)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-stone-950 border-stone-850 text-stone-450 hover:text-amber-500 transition cursor-pointer flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span>{isAr ? "تلاوة" : "Play"}</span>
                          </button>
                        </div>

                      </div>

                      {/* Verse Text Display */}
                      <p className={`${tutorSurahNum === 1 && verse.numberInSurah === 1 ? "text-center text-amber-500 font-bold" : "text-right text-stone-100"} text-2xl md:text-3xl leading-loose tracking-wide font-quran select-all my-3 ${
                        isCurrent ? "text-amber-300 font-black" : ""
                      }`} dir="rtl">
                        {cleanFirstVerseText(verse.text, verse.numberInSurah)}
                      </p>

                      {/* Translation display */}
                      <p className="text-right text-xs md:text-sm text-stone-400 font-sans leading-relaxed my-2" dir="rtl">
                        {verse.translation}
                      </p>

                      {/* Inline Tafsir drawer panel */}
                      {showTaf && (
                        <div className="mt-3 p-3.5 bg-stone-950 border border-amber-500/15 rounded-2xl text-right animate-in slide-in-from-top-1 duration-200" dir="rtl">
                          <span className="text-[9px] text-amber-500 font-black font-sans block mb-1">
                            💡 {isAr ? "التفسير الميسر (تفسير الجلالين):" : "Simplified Tafsir (Al-Jalalayn):"}
                          </span>
                          <p className="text-[11px] text-stone-350 leading-relaxed font-sans">
                            {verse.tafsir}
                          </p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      )}

      {/* --- Tab: Mnemonic Matcher (المتشابهات) --- */}
      {activeSubTab === "similarity" && (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
          <div className="bg-stone-900 border border-[#2e2a24]/30 rounded-3xl p-5 md:p-6 shadow-md shadow-stone-950/20 space-y-4">
            
            <div className="flex items-center gap-2 border-b border-stone-850 pb-3 flex-row-reverse">
              <Compass className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-stone-100 font-sans tracking-wide w-full text-right">
                {isAr ? "مكتشف فوري للمتشابهات اللفظية واللبس" : "Mnemonic Mutashabihat Matcher"}
              </h3>
            </div>

            <p className="text-[11px] text-stone-400 font-sans leading-relaxed text-right" dir="rtl">
              {isAr 
                ? "هل تختلط عليك آية أثناء الحفظ بآية أخرى في سورة ثانية؟ اكتب أي جملة أو آيات، وسيريك الذكاء الاصطناعي أين تتشابه وكيف تفرق بينها برابط ذكي."
                : "Enter any partial verse query to inspect exact word endings & identical structures elsewhere in the Quran with cognitive mnemonic distinction rules."}
            </p>

            <form onSubmit={handleFindSimilarity} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={similarityInput}
                  onChange={(e) => setSimilarityInput(e.target.value)}
                  placeholder={isAr ? "أدخل الآية، مثل: 'إن الله غفور رحيم' أو 'على كل شيء قدير'..." : "Type phrase like 'Inna Allah ghafoor'..."}
                  className="w-full bg-stone-950 border border-stone-850 rounded-2xl pl-10 pr-4 py-3 text-xs text-stone-200 placeholder-stone-600 font-sans text-right focus:border-amber-500/50"
                  dir="rtl"
                />
                <div className="absolute left-3 top-3.5 text-stone-400">
                  <Search className="w-4 h-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingSimilarity || !similarityInput.trim()}
                className="w-full bg-stone-950 border border-stone-850 hover:bg-stone-800 disabled:opacity-40 hover:border-amber-500/20 text-xs font-extrabold text-amber-500 py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {loadingSimilarity ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? "جاري مطابقة سور القرآن الحكيم والفرز الروحي..." : "Inspecting Quranic indexes..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? "تحليل ومقارنة المتشابهات الفورية بذكاء" : "Find Deep Similarities Now"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Error alerts */}
            {similarityError && (
              <div className="p-3 border border-rose-900/30 bg-rose-950/10 rounded-2xl text-[11px] text-rose-400 font-sans text-right leading-relaxed" dir="rtl">
                {similarityError}
              </div>
            )}

            {/* Similarity outputs pane */}
            {similarityResult && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Result header recognized */}
                <div className="p-3 bg-stone-950/90 rounded-2xl border border-stone-900 text-right" dir="rtl">
                  <span className="text-[9px] text-stone-500 font-sans block mb-1">
                    {isAr ? "الآية المحللة المقصودة:" : "Parsed query source verse:"}
                  </span>
                  <p className="text-xs font-quran text-stone-300 leading-relaxed leading-loose select-all font-semibold">
                    « {similarityResult.originalVerse} »
                  </p>
                </div>

                {/* Listing matches */}
                {similarityResult.similarVerses && similarityResult.similarVerses.length > 0 ? (
                  <div className="space-y-3.5">
                    <span className="text-[10px] text-stone-500 font-sans tracking-tight block text-right" dir="rtl">
                      {isAr 
                        ? `تم العثور على ${similarityResult.similarVerses.length} متشابهات محتملة:` 
                        : `Identified ${similarityResult.similarVerses.length} identical/similar structures:`}
                    </span>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-0.5">
                      {similarityResult.similarVerses.map((m, i) => (
                        <div 
                          key={i} 
                          className="bg-stone-950/50 hover:bg-stone-950 border border-stone-900 hover:border-amber-500/25 rounded-2xl p-4 transition-all space-y-2.5 text-right relative overflow-hidden"
                          dir="rtl"
                        >
                          {/* Quran translation font */}
                          <p className="text-sm font-quran text-stone-100 leading-relaxed font-semibold pr-1.5 select-all" dir="rtl">
                            « {m.text} »
                          </p>

                          {/* Header metadata label */}
                          <div className="w-full flex items-center justify-between text-[10px] border-b border-stone-900 pb-2">
                            <span className="bg-amber-600/10 text-amber-500 border border-amber-500/15 px-2 py-0.5 rounded-md font-bold font-sans">
                              {isAr ? `${m.surahName} - آية ${m.ayahNumber}` : `${m.surahName} - Ayah ${m.ayahNumber}`}
                            </span>
                          </div>

                          {/* Exact difference */}
                          <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
                            <span className="text-[9px] text-amber-500 font-black font-sans block">
                              {isAr ? "موقع وملمح الاختلاف الدقيق:" : "Portion/character variation difference:"}
                            </span>
                            <p className="text-[11px] text-stone-300 leading-relaxed font-sans">
                              {m.differenceDetails}
                            </p>
                          </div>

                          {/* Rule hook */}
                          <div className="p-2.5 bg-stone-900/60 rounded-xl space-y-1">
                            <span className="text-[9px] text-amber-400 font-black font-sans block">
                              💡 {isAr ? "القاعدة والضابط في الحفظ لمنع الخلط:" : "Mnemonic Retention Association Tip:"}
                            </span>
                            <p className="text-[11px] text-amber-100/90 leading-relaxed font-sans font-medium">
                              {m.connectionTip}
                            </p>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-stone-950 rounded-2xl border border-stone-900 text-center text-xs text-stone-500 font-sans">
                    {isAr 
                      ? "لم نجد متشابهات لفظية مباشرة أخرى لهذه العبارة المحددة. تبدو آية وحيدة بتركيبها الحالي في المصحف الشريف."
                      : "No adjacent similar verses found. This appears to be a completely unique wording structure across Al-Mushaf."}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
