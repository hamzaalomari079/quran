import React, { useState, useEffect } from "react";
import { Smile, RefreshCw, Layers, CheckCircle2, ChevronLeft, ChevronRight, Volume2, Sparkles, Star, Plus } from "lucide-react";
import { azkar, tasbeehat, ZekrItem } from "../data/azkarData";

export default function AzkarDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<" صباح" | "مساء" | "سبحة">(" صباح");

  // Azkar counters states
  const [morningRecitations, setMorningRecitations] = useState<{ [key: number]: number }>({});
  const [eveningRecitations, setEveningRecitations] = useState<{ [key: number]: number }>({});

  // Subha states
  const [subhaSelectionIdx, setSubhaSelectionIdx] = useState(0);
  const [subhaCount, setSubhaCount] = useState<number>(0);
  const [cumulativeSubha, setCumulativeSubha] = useState<number>(0);

  // Initialize and load saved statistics
  useEffect(() => {
    // Load cumulative tasbeeh count
    const savedTotal = localStorage.getItem("quran_app_total_tasbeeh");
    if (savedTotal) {
      setCumulativeSubha(parseInt(savedTotal));
    }

    // Initialize counts for Morning (category "صباح")
    const morningList = azkar.filter(a => a.category === "صباح");
    const mCounts: { [key: number]: number } = {};
    morningList.forEach((a, idx) => {
      mCounts[idx] = a.count;
    });
    setMorningRecitations(mCounts);

    // Initialize counts for Evening (category "مساء")
    const eveningList = azkar.filter(a => a.category === "مساء");
    const eCounts: { [key: number]: number } = {};
    eveningList.forEach((a, idx) => {
      eCounts[idx] = a.count;
    });
    setEveningRecitations(eCounts);
  }, []);

  const handleDecrementAzkar = (category: "صباح" | "مساء", idx: number) => {
    if (category === "صباح") {
      setMorningRecitations(prev => {
        const curr = prev[idx];
        if (curr === undefined || curr <= 0) return prev;
        
        // Soft click feedback if supported
        if (navigator.vibrate) {
          navigator.vibrate(12);
        }
        
        return { ...prev, [idx]: curr - 1 };
      });
    } else {
      setEveningRecitations(prev => {
        const curr = prev[idx];
        if (curr === undefined || curr <= 0) return prev;
        
        if (navigator.vibrate) {
          navigator.vibrate(12);
        }
        
        return { ...prev, [idx]: curr - 1 };
      });
    }
  };

  const handleResetAzkar = (category: "صباح" | "مساء") => {
    if (category === "صباح") {
      const morningList = azkar.filter(a => a.category === "صباح");
      const mCounts: { [key: number]: number } = {};
      morningList.forEach((a, idx) => {
        mCounts[idx] = a.count;
      });
      setMorningRecitations(mCounts);
    } else {
      const eveningList = azkar.filter(a => a.category === "مساء");
      const eCounts: { [key: number]: number } = {};
      eveningList.forEach((a, idx) => {
        eCounts[idx] = a.count;
      });
      setEveningRecitations(eCounts);
    }
  };

  // Subha count increment handler with animation + persistence
  const handleIncrementSubha = () => {
    const nextCount = subhaCount + 1;
    setSubhaCount(nextCount);
    
    const nextTotal = cumulativeSubha + 1;
    setCumulativeSubha(nextTotal);
    localStorage.setItem("quran_app_total_tasbeeh", String(nextTotal));

    // Nice click scale effect and subtle tactile vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleResetSubha = () => {
    if (window.confirm("هل تريد تصفير عداد السبحة الحالي؟")) {
      setSubhaCount(0);
    }
  };

  const activeAzkarList = azkar.filter(a => a.category === (activeSubTab === " صباح" ? "صباح" : "مساء"));
  const currentRecitationMap = activeSubTab === " صباح" ? morningRecitations : eveningRecitations;

  // Calculate completion percentage
  const totalTargetCounts = activeAzkarList.reduce((acc, curr) => acc + curr.count, 0);
  const currentRemainingCounts = activeAzkarList.reduce((acc, curr, idx) => acc + (currentRecitationMap[idx] || 0), 0);
  const completionsPercentage = totalTargetCounts > 0 
    ? Math.round(((totalTargetCounts - currentRemainingCounts) / totalTargetCounts) * 100)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 md:py-6 animate-in fade-in duration-300">
      
      {/* Tab select menu */}
      <div className="flex bg-stone-900 p-1 rounded-2xl border border-stone-850 shadow-inner max-w-sm mx-auto mb-8 flex-row-reverse">
        <button
          onClick={() => setActiveSubTab(" صباح")}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === " صباح" ? "bg-amber-600 text-stone-950 font-extrabold shadow-md shadow-amber-600/10 font-sans" : "text-stone-400 hover:text-stone-250"
          }`}
        >
          أذكار الصباح
        </button>
        <button
          onClick={() => setActiveSubTab("مساء")}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "مساء" ? "bg-amber-600 text-stone-950 font-extrabold shadow-md shadow-amber-600/10 font-sans" : "text-stone-400 hover:text-stone-250"
          }`}
        >
          أذكار المساء
        </button>
        <button
          onClick={() => setActiveSubTab("سبحة")}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "سبحة" ? "bg-amber-600 text-stone-950 font-extrabold shadow-md shadow-amber-600/10 font-sans" : "text-stone-400 hover:text-stone-250"
          }`}
        >
          السبحة الإلكترونية
        </button>
      </div>

      {activeSubTab !== "سبحة" ? (
        
        /* AZKAR MODE */
        <div className="flex flex-col gap-6">
          
          {/* Progress dashboard summary */}
          <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right flex items-center gap-3">
              <div className="w-12 h-12 bg-stone-850 border border-stone-805 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                <Smile className="w-6 h-6 text-[#c49a6c]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100 font-sans">
                  نسبة الإنجاز للأوراد والأذكار
                </h3>
                <p className="text-xs text-stone-400 mt-0.5 font-sans">
                  {completionsPercentage === 100 ? "أحسنت! أتممت قراءة الأذكار بنجاح." : `تبقى لك قراءة ${currentRemainingCounts} ورد مكرر لتتم الورد بالكامل.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial w-full sm:w-28 bg-stone-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(217,119,6,0.3)]"
                  style={{ width: `${completionsPercentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-stone-305 font-sans w-8 text-center">{completionsPercentage}%</span>

              <button
                onClick={() => handleResetAzkar(activeSubTab === " صباح" ? "صباح" : "مساء")}
                className="p-2 border border-stone-800 rounded-xl hover:bg-stone-850 hover:text-amber-550 text-stone-400 transition-all cursor-pointer"
                title="إعادة تصفير العداد"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Azkar Individual Items list */}
          <div className="flex flex-col gap-4">
            {activeAzkarList.map((zekr, idx) => {
              const countLeft = currentRecitationMap[idx] ?? zekr.count;
              const isCompleted = countLeft === 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleDecrementAzkar(activeSubTab === " صباح" ? "صباح" : "مساء", idx)}
                  className={`border rounded-2xl p-5 md:p-6 transition-all duration-300 cursor-pointer relative overflow-hidden group select-none flex flex-col gap-3.5 text-right ${
                    isCompleted 
                      ? "bg-amber-600/5 border-amber-500/25 shadow-inner" 
                      : "bg-stone-900 border-stone-850 hover:border-amber-500/30 hover:shadow-lg hover:shadow-stone-950/20"
                  }`}
                >
                  {/* Circle background number */}
                  <span className="absolute top-1 right-2 text-8xl font-black text-stone-950/20 group-hover:text-stone-950/30 select-none pointer-events-none transition-colors">
                    {idx + 1}
                  </span>

                  <div className="relative z-10 flex flex-col gap-3">
                    {/* Upper detail badge block */}
                    <div className="flex items-center justify-between flex-row-reverse pb-1.5 border-b border-stone-850">
                      <span className="text-[10px] text-stone-450 font-sans tracking-wide">
                        {zekr.reward ? "ثواب الذكر" : "حصن المسلم"}
                      </span>
                      
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs select-none">
                          <CheckCircle2 className="w-4 h-4 text-amber-500 fill-amber-600/10" />
                          <span>تم الأداء</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-600/10 border border-amber-500/20 text-xs font-bold text-amber-500 px-3 py-1 rounded-full font-sans select-none">
                          <span>تبقى: {countLeft} من {zekr.count}</span>
                        </div>
                      )}
                    </div>

                    {/* Dhikr main reading text */}
                    <p className="text-stone-100 text-sm md:text-base font-sans font-medium leading-relaxed mb-1" dir="rtl">
                      {zekr.text}
                    </p>

                    {/* Reward description */}
                    {zekr.reward && (
                      <div className="bg-stone-950/40 border border-stone-850/50 p-2.5 rounded-xl">
                        <p className="text-[11px] text-stone-400 font-sans leading-relaxed text-right">
                          <span className="font-bold text-amber-500">الأثر:</span> {zekr.reward}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        
        /* SUBHA MODE (Electronic Counter) */
        <div className="max-w-md mx-auto bg-stone-900 border border-stone-850 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center select-none text-center">
          
          <div className="flex items-center justify-between w-full border-b border-stone-850 pb-4 mb-6 flex-row-reverse select-none">
            <span className="text-xs font-bold text-amber-500 bg-amber-600/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              الذِكر النشط
            </span>
            <button
              onClick={handleResetSubha}
              className="text-xs text-rose-450 hover:bg-rose-950/20 px-2.5 py-1.5 border border-rose-900/35 rounded-xl transition cursor-pointer"
            >
              تصفير العداد
            </button>
          </div>

          {/* Active tasbeeh selector chips carousel */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 w-full mb-8">
            {tasbeehat.map((t, index) => (
              <button
                key={index}
                onClick={() => {
                  setSubhaSelectionIdx(index);
                  setSubhaCount(0); // auto reset sub tab current count when switching dhikr
                }}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                  subhaSelectionIdx === index 
                    ? "bg-amber-600 border border-amber-550 text-stone-950 shadow-md shadow-amber-600/10 font-sans font-bold" 
                    : "bg-stone-850 border border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-stone-100 hover:border-stone-700"
                }`}
              >
                {t.text}
              </button>
            ))}
          </div>

          {/* Active rendering block */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-extrabold text-[#c49a6c] font-sans">
              {tasbeehat[subhaSelectionIdx].text}
            </h1>
            <p className="text-[10px] text-stone-450 font-sans mt-0.5 tracking-wider uppercase">
              {tasbeehat[subhaSelectionIdx].englishTranslit}
            </p>
          </div>

          {/* Majestic giant tactile count button counter button */}
          <button
            onClick={handleIncrementSubha}
            className="w-56 h-56 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 p-1 shadow-[0_15px_40px_rgba(217,119,6,0.15)] hover:shadow-[0_20px_50px_rgba(217,119,6,0.25)] hover:scale-102 active:scale-95 transition-all text-stone-950 flex flex-col items-center justify-center relative cursor-pointer outline-none border-none group"
          >
            {/* Soft inner glow ring */}
            <div className="absolute inset-2 ring-1 ring-white/10 rounded-full select-none pointer-events-none"></div>

            <span className="text-[10px] text-amber-100/70 select-none font-bold uppercase tracking-widest font-sans">عدد التسبيحات</span>
            <span className="text-6xl md:text-7xl font-sans font-black text-stone-950 mt-1 select-none font-mono">
              {subhaCount}
            </span>
            <span className="text-[10px] bg-stone-950/20 px-3 py-0.5 rounded-full mt-2 font-bold font-sans">أنقر للتسبيح</span>
          </button>

          {/* Statistics summary below */}
          <div className="w-full mt-10 p-4 border border-stone-850 rounded-2xl bg-stone-950/60 flex items-center justify-between flex-row-reverse select-none">
            <div className="text-right">
              <span className="text-[9px] text-amber-500 uppercase font-bold tracking-wider font-sans">المجموع التراكمي</span>
              <p className="text-sm font-bold text-stone-200 font-sans mt-0.5 select-all">
                {cumulativeSubha} تسبيحة
              </p>
            </div>
            
            <div className="text-left">
              <span className="text-[9px] text-[#c49a6c] uppercase font-bold tracking-wider font-sans">الدورات المكتملة (٣٣)</span>
              <p className="text-sm font-bold text-stone-200 font-sans mt-0.5">
                {Math.floor(subhaCount / 33)} دورة
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
