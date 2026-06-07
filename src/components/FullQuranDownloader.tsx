import React, { useState, useEffect, useRef } from "react";
import { 
  Download, 
  Pause, 
  Play, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  Music, 
  Database,
  Info,
  AlertTriangle,
  RefreshCw,
  Trash2
} from "lucide-react";
import { surahList } from "../data/surahData";
import { Reciter } from "../types";
import { cacheSurahAudios, removeCachedSurahAudios } from "../utils/offlineAudio";

interface FullQuranDownloaderProps {
  isAr: boolean;
  isOnline: boolean;
  activeReciter: Reciter;
  downloadedSurahs: number[];
  onDownloadComplete: (updatedList: number[]) => void;
  triggerToast: (msg: string) => void;
}

type DownloadStep = "idle" | "downloading" | "paused" | "completed" | "error";

export default function FullQuranDownloader({
  isAr,
  isOnline,
  activeReciter,
  downloadedSurahs,
  onDownloadComplete,
  triggerToast
}: FullQuranDownloaderProps) {
  const [step, setStep] = useState<DownloadStep>("idle");
  const [downloadWithAudio, setDownloadWithAudio] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [currentSurahNum, setCurrentSurahNum] = useState<number>(1);
  const [currentSurahName, setCurrentSurahName] = useState<string>("");
  const [subProgress, setSubProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Refs to share running state directly into async loop without stale closure issues
  const isRunningRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);
  const currentSurahIndexRef = useRef<number>(1);

  // Stats calculation
  const totalQuranSurahsCount = 114;
  const isFullyDownloaded = downloadedSurahs.length === totalQuranSurahsCount;

  // Sync state initially
  useEffect(() => {
    // If all 114 surahs are in the downloaded state, show completed
    if (downloadedSurahs.length === totalQuranSurahsCount && step === "idle") {
      setStep("completed");
    }
  }, [downloadedSurahs, step]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  const startDownloadWorkflow = (withAudioOption: boolean) => {
    if (!isOnline) {
      triggerToast(isAr ? "⚠️ يرجى الاتصال بالإنترنت أولاً للبدء لتتمكن من التنزيل." : "⚠️ Please connect to the internet first to download.");
      return;
    }
    setDownloadWithAudio(withAudioOption);
    setStep("downloading");
    setErrorMessage("");
    isCancelledRef.current = false;
    isRunningRef.current = true;
    
    // We start from the first surah not yet downloaded or from 1 if none.
    // However, to make it robust, we can just scan starting from 1 to 114.
    // If some surahs are already downloaded, we can safely overwrite or skip them (to resume where left off!).
    // Let's find the first undownloaded surah index as a starting point.
    let startFrom = 1;
    for (let i = 1; i <= 114; i++) {
      if (!downloadedSurahs.includes(i)) {
        startFrom = i;
        break;
      }
    }
    
    currentSurahIndexRef.current = startFrom;
    setCompletedCount(downloadedSurahs.length);
    runBatchDownloadLoop(startFrom, withAudioOption);
  };

  const runBatchDownloadLoop = async (startIndex: number, withAudio: boolean) => {
    let index = startIndex;
    currentSurahIndexRef.current = index;

    // Load initial list
    const savedDownloads = localStorage.getItem("downloaded_surah_list");
    let currentOfflineList: number[] = savedDownloads ? JSON.parse(savedDownloads) : [];

    while (index <= 114 && isRunningRef.current && !isCancelledRef.current) {
      const currentSurah = surahList.find(s => s.number === index);
      if (!currentSurah) {
        index++;
        continue;
      }

      setCurrentSurahNum(index);
      setCurrentSurahName(isAr ? currentSurah.name : currentSurah.englishName);
      setSubProgress(null);

      // Check if it's already downloaded.
      // If we downloaded it previously and it's local, we can skip downloading its text, saving bandwidth.
      const isAlreadyLocalText = localStorage.getItem(`offline_surah_${index}`) !== null;
      let surahData = null;

      try {
        if (isAlreadyLocalText) {
          // Parse local data to know how many verses it has so we can cache audios if missing
          const localStr = localStorage.getItem(`offline_surah_${index}`);
          if (localStr) {
            surahData = JSON.parse(localStr);
          }
        }

        if (!surahData) {
          // Fetch from Server API
          const response = await fetch(`/api/surah/${index}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch Surah ${index}`);
          }
          surahData = await response.json();
          if (surahData.error) {
            throw new Error(surahData.error);
          }
          
          // Save texts, translations, tafasir immediately
          localStorage.setItem(`offline_surah_${index}`, JSON.stringify(surahData));
        }

        // 2. Audio caching if requested
        if (withAudio && surahData) {
          setSubProgress({ current: 0, total: surahData.numberOfAyahs });
          const success = await cacheSurahAudios(
            index,
            surahData.numberOfAyahs,
            activeReciter.identifier,
            (curr, tot) => {
              // Ensure we don't update state after pause or cancel
              if (isRunningRef.current && !isCancelledRef.current) {
                setSubProgress({ current: curr, total: tot });
              }
            }
          );
          if (!success) {
            console.warn(`Audio caching partially failed or was interrupted for Surah ${index}`);
          }
        }

        // 3. Mark surah as downloaded in the system
        if (!currentOfflineList.includes(index)) {
          currentOfflineList.push(index);
          localStorage.setItem("downloaded_surah_list", JSON.stringify(currentOfflineList));
          onDownloadComplete([...currentOfflineList]);
        }

        setCompletedCount(currentOfflineList.length);

        // Move to next Surah
        index++;
        currentSurahIndexRef.current = index;

      } catch (err: any) {
        console.error(`Full Quran Download error on Surah ${index}:`, err);
        const isQuotaError = err.name === 'QuotaExceededError' || err.code === 22 || err.message?.includes('quota');
        
        if (isQuotaError) {
          isRunningRef.current = false;
          setStep("error");
          setErrorMessage(isAr 
            ? "⚠️ عذراً، لا توجد مساحة كافية على متصفحك أو جهازك لحفظ هذا الكم من التلاوات الصوتية للمصحف كاملاً. ننصحك بإلغاء الصوتيات وتنزيل النصوص والتفاسير فقط الخفيفة (~3 ميجابايت)."
            : "⚠️ Quota Exceeded: Your device storage is full. We strongly recommend downloading the text-only version of the Quran which takes only ~3MB.");
          return;
        }

        // If it's a general connection issue or other retryable bug, pause or ask to resume
        isRunningRef.current = false;
        setStep("paused");
        triggerToast(isAr ? `⚠️ توقف التنزيل عند سورة ${currentSurah.name}. يرجى التحقق من اتصال الإنترنت.` : `⚠️ Paused at Surah ${currentSurah.englishName}. Check your network.`);
        return;
      }
    }

    if (index > 114) {
      // Loop finished fully!
      setStep("completed");
      isRunningRef.current = false;
      triggerToast(isAr ? "🎉 مبارك! تم تنزيل المصحف الشريف كاملاً بنجاح الآن وتفعيله أوفلاين." : "🎉 Congratulations! The entire Holy Quran is downloaded completely for offline use.");
    }
  };

  const handlePause = () => {
    isRunningRef.current = false;
    setStep("paused");
    triggerToast(isAr ? "⏸️ تم إيقاف التنزيل مؤقتاً." : "⏸️ Download paused.");
  };

  const handleResume = () => {
    if (!isOnline) {
      triggerToast(isAr ? "⚠️ أنت لست متصلاً بالإنترنت حالياً لاستئناف التحميل." : "⚠️ You are offline. Cannot resume.");
      return;
    }
    isRunningRef.current = true;
    isCancelledRef.current = false;
    setStep("downloading");
    runBatchDownloadLoop(currentSurahIndexRef.current, downloadWithAudio);
  };

  const handleCancel = () => {
    isRunningRef.current = false;
    isCancelledRef.current = true;
    setStep("idle");
    setSubProgress(null);
    triggerToast(isAr ? "🛑 تم إلغاء تنزيل المصحف كاملاً." : "🛑 Download cancelled.");
  };

  const handleDeleteAllQuran = () => {
    const confirmDelete = window.confirm(
      isAr 
        ? "هل أنت متأكد من رغبتك في حذف جميع السور والملفات الصوتية المنزلة بالكامل من جهازك لتوفير المساحة؟" 
        : "Are you sure you want to delete all downloaded Surahs and audio resources from your device to free up space?"
    );
    if (!confirmDelete) return;

    try {
      // Delete 114 items
      for (let i = 1; i <= 114; i++) {
        localStorage.removeItem(`offline_surah_${i}`);
      }
      localStorage.removeItem("downloaded_surah_list");
      onDownloadComplete([]);
      setCompletedCount(0);
      setStep("idle");
      
      triggerToast(isAr ? "🗑️ تم حذف المصحف الشريف المنزَّل بالكامل ومحو الكاش." : "🗑️ All downloaded Quran resources cleared successfully.");
    } catch (e) {
      console.error(e);
    }
  };

  // UI rendering based on steps
  return (
    <div className="w-full bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden">
      
      {/* Decorative top gradient */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#c49a6c]/20 via-amber-500/20 to-[#c49a6c]/20" />

      {step === "idle" && (
        <div className="flex flex-col gap-5">
          <div className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${isAr ? "text-right md:flex-row-reverse" : "text-left"}`}>
            <div>
              <h3 className="text-sm font-black text-amber-500 font-sans flex items-center gap-2 justify-start">
                <Database className="w-4 h-4 text-amber-500" />
                <span>{isAr ? "تحميل المصحف الشريف كاملاً (114 سورة)" : "Download Complete Quran (114 Surahs)"}</span>
              </h3>
              <p className="text-[11px] text-stone-400 font-sans mt-1 max-w-xl leading-relaxed">
                {isAr 
                  ? "قم بحفظ المصحف كاملاً بنقرة واحدة لتستفيد من الميزات الإيمانية وأدوات التدبر والتلاوة للـ 114 سورة كاملة دون الحاجة لشبكة الإنترنت على الإطلاق."
                  : "Save all 114 Surahs on your browser cache storage instantly. Recite, search, and study holy verses offline, anytime, anywhere."}
              </p>
            </div>

            {completedCount > 0 && (
              <button
                onClick={handleDeleteAllQuran}
                className="px-3 py-1.5 rounded-xl border border-rose-500/10 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 text-[10.5px] font-sans font-extrabold flex items-center gap-1.5 cursor-pointer"
                title={isAr ? "حذف الكل" : "Delete All"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? "حذف المساحة والمحليات" : "Clear Local Storage"}</span>
              </button>
            )}
          </div>

          {/* Quick Stats Panel */}
          {completedCount > 0 && completedCount < totalQuranSurahsCount && (
            <div className={`p-3 rounded-2xl bg-stone-950/40 border border-stone-850 text-[11px] text-stone-400 font-sans flex items-center justify-between ${isAr ? "flex-row-reverse text-right" : "flex-row"}`}>
              <span>
                {isAr 
                  ? `أنت تمتلك سلفاً ${completedCount} من أصل 114 سورة منزلة محلياً.` 
                  : `You already have ${completedCount} out of 114 Surahs saved offline.`}
              </span>
              <button
                onClick={() => startDownloadWorkflow(downloadWithAudio)}
                className="text-amber-500 hover:text-amber-400 font-extrabold flex items-center gap-1 cursor-pointer transition"
              >
                <span>{isAr ? "متابعة التنزيل ◀" : "Resume Download ◀"}</span>
              </button>
            </div>
          )}

          {/* Core Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Text & Tafasir only (SUPER LIGHTWEIGHT, STRONGLY RECOMMENDED) */}
            <div className="bg-stone-950/40 border border-stone-850/80 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300 group">
              <div className={`flex flex-col gap-2 ${isAr ? "text-right" : "text-left"}`}>
                <div className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-stone-200 font-sans group-hover:text-amber-500 transition-colors">
                    {isAr ? "تنزيل خفيف وسريع جداً (نصوص وتفاسير وروايات)" : "Lightweight & Fast (Texts, Translations & Tafasir)"}
                  </span>
                </div>
                <p className="text-[10.5px] text-stone-400 leading-relaxed font-sans min-h-[50px]">
                  {isAr 
                    ? "يقوم بحفظ النصوص العثمانية الكاملة، والترجمات، وأسباب النزول والتفاسير لجميع الآيات. خفيف للغاية ومضمون بالكامل، يناسب كافة الهواتف والمتصفحات."
                    : "Saves raw high-contrast Uthmani text, translations, and complete Jalalayn tafsir for all 6236 verses. Extremely safe (~3MB total) and loads in seconds."}
                </p>
                <div className={`flex items-center gap-1.5 text-[9px] font-bold py-1 px-2.5 rounded bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 w-fit ${isAr ? "mr-auto" : "ml-auto"}`}>
                  <span>{isAr ? "الحجم الإجمالي: ~3 ميجابايت فقط" : "Total Size: ~3 MB Only"}</span>
                </div>
              </div>

              <button
                onClick={() => startDownloadWorkflow(false)}
                className="w-full mt-4 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-450 text-stone-950 font-black text-xs font-sans transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-stone-950" />
                <span>{isAr ? "تنزيل الآيات والتفاسير (موصى به)" : "Download Texts & Tafasir (Recommended)"}</span>
              </button>
            </div>

            {/* Card 2: Texts + ALL AUDIO (IMMEDIATE AUDIO PLAYBACK OFFLINE) */}
            <div className="bg-stone-950/40 border border-stone-850/80 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300 group">
              <div className={`flex flex-col gap-2 ${isAr ? "text-right" : "text-left"}`}>
                <div className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="p-1.5 rounded-lg bg-[#c49a6c]/10 border border-[#c49a6c]/20 text-[#c49a6c] font-bold">
                    <Music className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-stone-200 font-sans group-hover:text-[#c49a6c] transition-colors">
                    {isAr ? "تنزيل المصحف الصوتي الشامل (مع التلاوة)" : "Complete Vocal Quran (Texts + Recitations)"}
                  </span>
                </div>
                <p className="text-[10.5px] text-stone-400 leading-relaxed font-sans min-h-[50px]">
                  {isAr 
                    ? `يحفظ النصوص والتفاسير + تحميل تلاوة الآيات كاملة بصوت القارئ النشط (الشيخ ${activeReciter.name}). يتيح الاستماع والتنقل الخالي من الإنترنت بالكامل.`
                    : `Downloads all text and commentary, plus caching vocal audio mp3s for all 6,236 verses of ${activeReciter.name}. Ready for true offline audio listening.`}
                </p>
                <div className={`flex items-center gap-1.5 text-[9px] font-bold py-1 px-2.5 rounded bg-amber-500/5 text-amber-500 border border-amber-500/10 w-fit ${isAr ? "mr-auto" : "ml-auto"}`}>
                  <span>{isAr ? `القارئ: ${activeReciter.name}` : `Reciter: ${activeReciter.name}`}</span>
                </div>
              </div>

              <button
                onClick={() => startDownloadWorkflow(true)}
                className="w-full mt-4 py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 hover:text-[#c49a6c] hover:border-[#c49a6c]/30 font-black text-xs font-sans transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? "تنزيل المصحف كاملاً مع الصوتيات" : "Download Full Quran with Audio"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Downloading Workflow Interface state */}
      {step === "downloading" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className={`flex items-center justify-between ${isAr ? "flex-row-reverse text-right" : "flex-row"}`}>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 className="text-xs font-black text-stone-200 font-sans tracking-wide">
                {isAr ? "جاري تنزيل المصحف الشريف..." : "Downloading the Holy Quran..."}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePause}
                className="px-3 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-amber-500 text-[10.5px] font-sans font-extrabold flex items-center gap-1 cursor-pointer transition select-none"
              >
                <Pause className="w-3 h-3" />
                <span>{isAr ? "إيقاف مؤقت" : "Pause"}</span>
              </button>

              <button
                onClick={handleCancel}
                className="p-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-rose-400 border border-stone-800 hover:border-rose-500/10 cursor-pointer transition"
                title={isAr ? "إلغاء التنزيل" : "Cancel Download"}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-stone-950/50 border border-stone-850 rounded-2xl p-4 flex flex-col gap-3">
            {/* Major Progress Info */}
            <div className={`flex items-end justify-between ${isAr ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex flex-col gap-0.5 ${isAr ? "text-right" : "text-left"}`}>
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider font-sans">
                  {isAr ? `السورة الحالية (${currentSurahNum} / 114)` : `Current Surah (${currentSurahNum} / 114)`}
                </span>
                <span className="text-xs font-extrabold text-amber-500 font-sans">
                  {isAr ? `سورة ${currentSurahName}` : `Surah ${currentSurahName}`}
                </span>
              </div>

              <div className={`text-right flex flex-col items-end gap-0.5`}>
                <span className="text-[10px] text-stone-400 font-bold font-sans">
                  {Math.round((completedCount / totalQuranSurahsCount) * 100)}%
                </span>
                <span className="text-[9px] text-stone-500 font-sans">
                  {isAr ? `${completedCount} من 114 سورة` : `${completedCount} of 114 Surahs`}
                </span>
              </div>
            </div>

            {/* Glowing Progress Bar */}
            <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800">
              <div 
                className="bg-gradient-to-r from-amber-500 to-[#c49a6c] h-full rounded-full transition-all duration-300 shadow-md shadow-amber-500/20"
                style={{ width: `${(completedCount / totalQuranSurahsCount) * 100}%` }}
              />
            </div>

            {/* Minor Audio Progress (if applicable) */}
            {downloadWithAudio && subProgress && (
              <div className="p-3 bg-stone-900/30 border border-stone-850 rounded-xl mt-1 flex flex-col gap-2">
                <div className={`flex items-center justify-between text-[10px] font-sans ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                  <span className="text-stone-450 flex items-center gap-1">
                    <Music className="w-3 h-3 text-[#c49a6c]" />
                    <span>{isAr ? `جاري تنزيل ملفات الصوت لكافة الآيات بصوت ${activeReciter.name}` : `Caching recitation audio files of ${activeReciter.name}`}</span>
                  </span>
                  <span className="text-[10.5px] font-mono font-extrabold text-[#c49a6c]">
                    {subProgress.current} / {subProgress.total} {isAr ? "آية" : "Ayahs"}
                  </span>
                </div>
                <div className="w-full bg-stone-950 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-[#c49a6c] h-full rounded-full transition-all duration-200"
                    style={{ width: `${(subProgress.current / (subProgress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paused state */}
      {step === "paused" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className={`flex items-center justify-between ${isAr ? "flex-row-reverse" : "flex-row"}`}>
            <h3 className="text-xs font-black text-stone-300 font-sans flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-500" />
              <span>{isAr ? "تم إيقاف التنزيل مؤقتاً" : "Quran Download Paused"}</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResume}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-450 text-stone-950 text-xs font-sans font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-md"
              >
                <Play className="w-3.5 h-3.5 text-stone-950" />
                <span>{isAr ? "استئناف التنزيل" : "Resume"}</span>
              </button>

              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-300 border border-stone-800 text-xs font-sans font-bold cursor-pointer transition"
              >
                {isAr ? "إلغاء تماماً" : "Cancel"}
              </button>
            </div>
          </div>

          <div className="p-4 bg-stone-950/40 border border-stone-850 rounded-2xl">
            <div className={`flex items-center gap-3 text-[11px] text-stone-400 font-sans ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
              <span>
                {isAr 
                  ? `توقف التحميل عند السورة رقم ${currentSurahNum} (سورة ${currentSurahName}). من فضلك تأكد من استقرار شبكة الإنترنت ثم انقر على زر استئناف.` 
                  : `Progress paused at Surah #${currentSurahNum} (${currentSurahName}). Please verify your network and resume when ready.`}
              </span>
            </div>

            {/* State Bar Preview */}
            <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden mt-3.5">
              <div 
                className="bg-stone-600 h-full rounded-full"
                style={{ width: `${(completedCount / totalQuranSurahsCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Completed State */}
      {step === "completed" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${isAr ? "sm:flex-row-reverse text-right" : "text-left"}`}>
            <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-stone-100 font-sans">
                  {isAr ? "المصحف الشريف كامل منزَّل ومفعَّل أوفلاين ✓" : "Entire Holy Quran is preserved offline ✓"}
                </h4>
                <p className="text-[10.5px] text-stone-400 font-sans mt-0.5 leading-relaxed">
                  {isAr 
                    ? `مبارك! كافة الـ 114 سورة بنصوصها العثمانية، تفاسيرها مع جلال الدين ومرفقاتها الترجمية محفوظة بنجاح على هذا المتصفح.`
                    : `${totalQuranSurahsCount} out of ${totalQuranSurahsCount} Surahs texts and translations are stored fully in your local database.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("idle")}
                className="px-3.5 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 font-extrabold font-sans text-xs border border-stone-800 cursor-pointer transition select-none flex items-center gap-1.5"
                title={isAr ? "تحديث أو تعديل" : "Modify / Redownload Options"}
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isAr ? "تحديث أو تعديل" : "Modify / Refresh"}</span>
              </button>

              <button
                onClick={handleDeleteAllQuran}
                className="p-1.5 rounded-xl text-stone-500 hover:text-red-500 hover:bg-stone-850 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                title={isAr ? "حذف الكل" : "Delete All saved resources"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {step === "error" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-250">
          <div className={`p-4 bg-rose-950/20 border border-rose-500/35 rounded-2xl flex flex-col gap-3 ${isAr ? "text-right" : "text-left"}`}>
            <div className={`flex items-start gap-2.5 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-black text-rose-400 font-sans">
                  {isAr ? "حدث خطأ أثناء تنزيل المصحف كاملاً" : "Failed to Complete Quran Download"}
                </h4>
                <p className="text-[10.5px] text-stone-300 font-sans leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 mt-1 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
              <button
                onClick={() => setStep("idle")}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 font-black text-[10.5px] font-sans cursor-pointer transition select-none"
              >
                {isAr ? "الرجوع وتغيير الخيارات" : "Go Back to Options"}
              </button>
              
              <button
                onClick={handleResume}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-stone-950 font-black text-[10.5px] font-sans cursor-pointer transition select-none shadow-md shadow-rose-500/10"
              >
                {isAr ? "إعادة المحاولة والاستئناف" : "Retry & Resume"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
