import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, CheckSquare, ChevronRight, HelpCircle, BookOpen, Clock, Loader2, Search, ArrowRight, Award, Compass, RefreshCw, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

      if (!response.ok) {
        throw new Error(data?.error || "HTTP error " + response.status);
      }

      setActiveTipsContent(data?.result || "عذراً، الخدمة تحت الضغط الآن.");
    } catch (err: any) {
      console.error(err);
      setActiveTipsContent(err.message || (isAr 
        ? "حدث خطأ أثناء الاتصال بمُعلم الحفظ الذكي. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
        : "Failed to communicate with your AI Tutor. Please check internet connection and try again."
      ));
    } finally {
      setLoadingTips(false);
    }
  };

  // Clear current saved plan
  const handleResetPlan = () => {
    if (window.confirm(isAr ? "هل أنت متأكد من رغبتك في إعادة تعيين وحذف الخطة الحالية؟" : "Are you sure you want to reset current plan?")) {
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

      if (!response.ok) {
        throw new Error(data?.error || "Failed to receive valid response");
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      if (!data || !data.originalVerse) {
        throw new Error(isAr ? "لم نتمكن من تحليل المتشابهات حالياً، يرجى المحاولة لاحقاً." : "Could not identify similarity matches. Please try again later.");
      }

      setSimilarityResult(data);
    } catch (err: any) {
      console.error(err);
      setSimilarityError(err.message || (isAr
        ? "تعذر استدعاء مكتشف المتشابهات الفوري. يرجى محاولة صياغة الآية بشكل أكثر وضوحًا أو كتابة عبارة قرآنية صحيحة."
        : "Failed to locate similar verses. Please check your spelling and try again."
      ));
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Planner Config & Main List (8 Cols) */}
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

          {/* AI Tips feedback box (If a day is selected) */}
          {selectedDayForTips && (
            <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 shadow-lg shadow-stone-950/20 space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
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
          )}

        </div>

        {/* Right Side: Mutashabihat Finder (5 Cols) */}
        <div className="lg:col-span-5">
          
          <div className="bg-stone-900 border border-[#2e2a24]/30 rounded-3xl p-5 md:p-6 shadow-md shadow-stone-950/20 space-y-4">
            
            <div className="flex items-center gap-2 border-b border-stone-850 pb-3">
              <Compass className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-black text-stone-100 font-sans tracking-wide">
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

      </div>

    </div>
  );
}
