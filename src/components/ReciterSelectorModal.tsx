import React, { useState, useMemo, useEffect } from "react";
import { X, Search, Check, Mic2, Landmark, Sparkles, BookOpen, Volume2, Star } from "lucide-react";
import { Reciter, ReciterCategory, recitersList } from "../types";

interface ReciterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  currentLang?: "ar" | "en";
}

export default function ReciterSelectorModal({
  isOpen,
  onClose,
  activeReciter,
  onSelectReciter,
  currentLang = "ar"
}: ReciterSelectorModalProps) {
  const isAr = currentLang === "ar";
  const [selectedCategory, setSelectedCategory] = useState<ReciterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Categories definitions
  const categories: { id: ReciterCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "all", label: isAr ? "جميع القراء" : "All Reciters", icon: Volume2 },
    { id: "haramain", label: isAr ? "قراء الحرمين" : "Two Holy Mosques", icon: Landmark },
    { id: "tajweed", label: isAr ? "قراء التجويد" : "Tajweed (Mujawwad)", icon: Sparkles },
    { id: "riwayat", label: isAr ? "قراء الروايات" : "Riwayat (Warsh)", icon: BookOpen },
    { id: "murattal", label: isAr ? "قراء الترتيل" : "Murattal", icon: Mic2 },
  ];

  // Filtered reciters list
  const filteredReciters = useMemo(() => {
    return recitersList.filter((reciter) => {
      // Category filter
      if (selectedCategory !== "all" && reciter.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = reciter.name.toLowerCase().includes(query);
        const subtextMatch = reciter.subtext.toLowerCase().includes(query);
        const riwayahMatch = reciter.riwayah.toLowerCase().includes(query);
        const categoryMatch = 
          (reciter.category === "haramain" && (query.includes("حرم") || query.includes("مكة") || query.includes("مدينة"))) ||
          (reciter.category === "tajweed" && (query.includes("تجويد") || query.includes("مجود"))) ||
          (reciter.category === "riwayat" && (query.includes("رواية") || query.includes("ورش"))) ||
          (reciter.category === "murattal" && (query.includes("ترتيل") || query.includes("مرتل")));

        return nameMatch || subtextMatch || riwayahMatch || categoryMatch;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ReciterCategory, number> = {
      all: recitersList.length,
      haramain: 0,
      tajweed: 0,
      riwayat: 0,
      murattal: 0,
    };
    for (const r of recitersList) {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    }
    return counts;
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir={isAr ? "rtl" : "ltr"}
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 font-sans flex items-center gap-2">
                <span>{isAr ? "أصوات مشاهير القراء" : "Select Quran Reciter"}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-600/10 text-amber-400 border border-amber-500/20 font-sans">
                  {recitersList.length} {isAr ? "قارئ" : "reciters"}
                </span>
              </h2>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                {isAr
                  ? "تلاوات الحرمين، كبار أئمة التجويد، وروايات القرآن الكريم"
                  : "Haramain Imams, Masters of Tajweed, and Holy Quran Narrations"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:px-5 sm:pt-4 border-b border-stone-850/80 bg-stone-900">
          <div className="relative">
            <Search className={`w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 ${isAr ? "right-3.5" : "left-3.5"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "ابحث باسم القارئ، الرواية، أو نوع التلاوة (مثال: المعيقلي، ورش، مجود)..." : "Search reciter, narration (e.g. Sudais, Warsh, Mujawwad)..."}
              className={`w-full bg-stone-950 border border-stone-800 focus:border-amber-500/50 rounded-2xl py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 outline-none transition-all ${
                isAr ? "pr-10 pl-9" : "pl-10 pr-9"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-300 cursor-pointer ${
                  isAr ? "left-3" : "right-3"
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id];

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-600 text-stone-950 shadow-md shadow-amber-600/20 font-black"
                      : "bg-stone-950/80 text-stone-400 hover:text-stone-200 border border-stone-850 hover:border-stone-750"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans ${
                      isSelected
                        ? "bg-stone-950/20 text-stone-950 font-black"
                        : "bg-stone-850 text-stone-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reciters List Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 max-h-[55vh]">
          {filteredReciters.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-stone-850 flex items-center justify-center text-stone-500 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-300 font-sans">
                {isAr ? "لم يتم العثور على قارئ مطابق" : "No matching reciter found"}
              </p>
              <p className="text-xs text-stone-500 font-sans mt-1">
                {isAr ? "جرب البحث باسم آخر أو إزالة التصفية الحالية" : "Try searching with a different term or clear filters"}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-xs font-bold text-amber-400 font-sans transition-colors cursor-pointer"
              >
                {isAr ? "إعادة ضبط التصفية" : "Reset Filters"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredReciters.map((reciter) => {
                const isCurrent = activeReciter.id === reciter.id;

                // Category Badge label & color
                let categoryBadge = isAr ? "ترتيل" : "Murattal";
                let categoryBadgeColor = "bg-stone-850 text-stone-400 border-stone-800";
                if (reciter.category === "haramain") {
                  categoryBadge = isAr ? "قراء الحرمين" : "Haramain";
                  categoryBadgeColor = "bg-emerald-950/40 text-emerald-400 border-emerald-500/30";
                } else if (reciter.category === "tajweed") {
                  categoryBadge = isAr ? "تجويد" : "Tajweed";
                  categoryBadgeColor = "bg-amber-950/40 text-amber-400 border-amber-500/30";
                } else if (reciter.category === "riwayat") {
                  categoryBadge = isAr ? "رواية ورش" : "Warsh";
                  categoryBadgeColor = "bg-sky-950/40 text-sky-400 border-sky-500/30";
                }

                return (
                  <button
                    key={reciter.id}
                    onClick={() => {
                      onSelectReciter(reciter);
                      try {
                        localStorage.setItem("preferred_reciter_id", reciter.id);
                      } catch (err) {
                        console.warn("Storage error", err);
                      }
                      onClose();
                    }}
                    className={`w-full text-right p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 cursor-pointer relative text-right group ${
                      isCurrent
                        ? "bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/20"
                        : "bg-stone-950/50 hover:bg-stone-850/80 border-stone-850 hover:border-stone-750"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isCurrent
                            ? "bg-amber-600 text-stone-950"
                            : "bg-stone-850 text-stone-400 group-hover:bg-stone-800 group-hover:text-amber-400"
                        }`}
                      >
                        {isCurrent ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Volume2 className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            className={`text-xs sm:text-sm font-bold font-sans truncate ${
                              isCurrent ? "text-amber-400 font-black" : "text-stone-200 group-hover:text-stone-100"
                            }`}
                          >
                            {reciter.name}
                          </h3>
                          {reciter.isFamous && (
                            <span title={isAr ? "قارئ مشهور ومميز" : "Featured Reciter"}>
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>

                        <p className="text-[10.5px] text-stone-400 font-sans line-clamp-1 mt-0.5">
                          {reciter.subtext}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span
                            className={`text-[9.5px] font-sans px-2 py-0.5 rounded-md border font-semibold ${categoryBadgeColor}`}
                          >
                            {categoryBadge}
                          </span>
                          <span className="text-[9.5px] font-sans px-2 py-0.5 rounded-md border bg-stone-900 border-stone-800 text-stone-450">
                            {reciter.riwayah}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="shrink-0 self-center">
                        <span className="text-[10px] font-black font-sans px-2 py-1 rounded-xl bg-amber-500 text-stone-950 shadow-sm">
                          {isAr ? "محدد" : "Active"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 sm:px-5 border-t border-stone-800/80 bg-stone-950/70 flex items-center justify-between text-[11px] text-stone-400 font-sans">
          <span>
            {isAr ? `القارئ النشط: ` : `Active: `}
            <strong className="text-amber-400 font-bold">{activeReciter.name}</strong>
          </span>
          <span className="text-[10px] text-stone-500">
            {isAr ? "جودة نقية عالية (EveryAyah)" : "EveryAyah High Fidelity"}
          </span>
        </div>
      </div>
    </div>
  );
}
