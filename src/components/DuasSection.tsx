import React, { useState, useEffect } from "react";
import { Heart, Plus, Trash2, Edit2, Copy, Check, MessageSquare, Search, Award, Sparkles, AlertCircle, Save, BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Dua {
  id: string;
  titleAr: string;
  titleEn: string;
  textAr: string;
  textEn: string;
  sourceAr: string;
  sourceEn: string;
  category: "quranic" | "prophetic" | "general" | "custom";
  isFavorite?: boolean;
}

const PREDEFINED_DUAS: Dua[] = [
  {
    id: "p1",
    titleAr: "دعاء تفريج الهم والحزن",
    titleEn: "Supplication for Relief from Worry & Sadness",
    textAr: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ.",
    textEn: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.",
    sourceAr: "صحيح البخاري",
    sourceEn: "Sahih Al-Bukhari",
    category: "prophetic"
  },
  {
    id: "p2",
    titleAr: "دعاء الهداية وسعة الرزق والتقى",
    titleEn: "Prayer for Guidance, Piety, & Sufficiency",
    textAr: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى.",
    textEn: "O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.",
    sourceAr: "صحيح مسلم",
    sourceEn: "Sahih Muslim",
    category: "prophetic"
  },
  {
    id: "p3",
    titleAr: "سيد الاستغفار",
    titleEn: "The Master of Forgiveness (Sayyid al-Istighfar)",
    textAr: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
    textEn: "O Allah, You are my Lord, there is none worthy of worship but You. You created me and I am Your slave, and I am faithful to Your covenant and Your promise as much as I can. I seek refuge in You from all the evil I have done. I acknowledge before You all the blessings You have bestowed upon me, and I confess to You all my sins. So grant me forgiveness, for indeed none can forgive sins but You.",
    sourceAr: "صحيح البخاري",
    sourceEn: "Sahih Al-Bukhari",
    category: "prophetic"
  },
  {
    id: "p4",
    titleAr: "دعاء طلب الرحمة والغفران",
    titleEn: "Qur'anic Prayer for Mercy & Forgiveness",
    textAr: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ.",
    textEn: "Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.",
    sourceAr: "سورة آل عمران - الآية 8",
    sourceEn: "Surah Ali 'Imran - Verse 8",
    category: "quranic"
  },
  {
    id: "p5",
    titleAr: "دعاء تيسير العسير وشرح الصدر",
    titleEn: "Prayer for Ease & Relief of the Heart",
    textAr: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْهَمُوا قَوْلِي.",
    textEn: "My Lord, expand for me my breast [with assurance] and ease for me my task and untie the knot from my tongue that they may understand my speech.",
    sourceAr: "سورة طه - الآيات 25-28",
    sourceEn: "Surah Taha - Verses 25-28",
    category: "quranic"
  },
  {
    id: "p6",
    titleAr: "دعاء ذو النون لكشف الكرب",
    titleEn: "The Supplication of Yunus in distress",
    textAr: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ.",
    textEn: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
    sourceAr: "سورة الأنبياء - الآية 87",
    sourceEn: "Surah Al-Anbya - Verse 87",
    category: "quranic"
  },
  {
    id: "p7",
    titleAr: "دعاء طلب العافية الشاملة",
    titleEn: "Prayer for Complete Well-being & Grace",
    textAr: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي.",
    textEn: "O Allah, I ask You for forgiveness and well-being in this world and the Hereafter. O Allah, I ask You for forgiveness and well-being in my religion, my worldly affairs, my family and my wealth.",
    sourceAr: "سنن أبي داود",
    sourceEn: "Sunan Abi Dawud",
    category: "prophetic"
  },
  {
    id: "p8",
    titleAr: "دعاء حماية الأبناء والذرية",
    titleEn: "Prayer for the Righteousness of Children",
    textAr: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ.",
    textEn: "My Lord, make me an establisher of prayer, and [many] from my descendants. Our Lord, and accept my supplication.",
    sourceAr: "سورة إبراهيم - الآية 40",
    sourceEn: "Surah Ibrahim - Verse 40",
    category: "quranic"
  },
  {
    id: "p9",
    titleAr: "دعاء دفع الكرب وتيسير الأمور",
    titleEn: "Prophetic Prayer for Ease & Relief of Distress",
    textAr: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لَا إِلَهَ إِلَّا أَنْتَ.",
    textEn: "O Allah, I hope for Your mercy. Do not leave me to myself even for the blinking of an eye, and correct all of my affairs for me. There is no deity except You.",
    sourceAr: "سنن أبي داود (حديث حسن)",
    sourceEn: "Sunan Abi Dawud (Good Hadith)",
    category: "prophetic"
  },
  {
    id: "p10",
    titleAr: "دعاء الصبر والثبات واليقين",
    titleEn: "Qur'anic Supplication for Patience & Steadfastness",
    textAr: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَثَبِّتْ أَقْدَامَنَا وَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ.",
    textEn: "Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.",
    sourceAr: "سورة البقرة - الآية 250",
    sourceEn: "Surah Al-Baqarah - Verse 250",
    category: "quranic"
  },
  {
    id: "p11",
    titleAr: "دعاء الثبات على الحق والهدى",
    titleEn: "Prophetic Prayer for Steadfastness of Heart",
    textAr: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ.",
    textEn: "O Director of hearts, keep my heart steadfast on Your religion.",
    sourceAr: "سنن الترمذي (حديث صحيح)",
    sourceEn: "Sunan At-Tirmidhi (Sahih Hadith)",
    category: "prophetic"
  },
  {
    id: "p12",
    titleAr: "دعاء طلب العلم والهدى والبصيرة",
    titleEn: "Qur'anic Prayer for Wisdom & Knowledge",
    textAr: "رَبِّ زِدْنِي عِلْمًا وَأَلْحِقْنِي بِالصَّالِحِينَ.",
    textEn: "My Lord, increase me in knowledge and join me with the righteous.",
    sourceAr: "سورة طه - الآية 114 وسورة الشعراء - الآية 83",
    sourceEn: "Surah Taha - Verse 114 & Surah Ash-Shu'ara - Verse 83",
    category: "quranic"
  }
];

export default function DuasSection() {
  const [trueNightMode, setTrueNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("trueNightMode") === "true";
    } catch {
      return false;
    }
  });

  const [isAr, setIsAr] = useState<boolean>(() => {
    try {
      const savedSettings = localStorage.getItem("quran_app_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.language !== "en";
      }
    } catch {}
    return true;
  });

  // Track night mode and language updates reactively
  useEffect(() => {
    const checkSettings = () => {
      const currentNight = localStorage.getItem("trueNightMode") === "true";
      if (currentNight !== trueNightMode) {
        setTrueNightMode(currentNight);
      }
      try {
        const savedSettings = localStorage.getItem("quran_app_settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          const currentAr = parsed.language !== "en";
          if (currentAr !== isAr) {
            setIsAr(currentAr);
          }
        }
      } catch {}
    };
    const interval = setInterval(checkSettings, 1200);
    return () => clearInterval(interval);
  }, [trueNightMode, isAr]);

  // Duas state
  const [customDuas, setCustomDuas] = useState<Dua[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Tab control
  const [activeSubTab, setActiveSubTab] = useState<"all" | "favorites" | "custom">("all");
  
  // Form control
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formCategory, setFormCategory] = useState<"general" | "custom">("custom");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status notifications
  const [alertText, setAlertText] = useState<string | null>(null);

  // Load custom duas and favorites from LocalStorage
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem("quran_app_custom_duas");
      if (savedCustom) {
        setCustomDuas(JSON.parse(savedCustom));
      }
      
      const savedFavs = localStorage.getItem("quran_app_favorite_duas");
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.error("Error loading Duas:", e);
    }
  }, []);

  // Save custom duas and favorites to LocalStorage
  const saveCustomDuasToStorage = (duas: Dua[]) => {
    setCustomDuas(duas);
    localStorage.setItem("quran_app_custom_duas", JSON.stringify(duas));
  };

  const saveFavoritesToStorage = (favList: string[]) => {
    setFavorites(favList);
    localStorage.setItem("quran_app_favorite_duas", JSON.stringify(favList));
  };

  const speakDuaVib = () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const toggleFavorite = (duaId: string) => {
    speakDuaVib();
    let updated;
    if (favorites.includes(duaId)) {
      updated = favorites.filter(id => id !== duaId);
      triggerToast(isAr ? "تمت إزالة الدعاء من المفضلة ❤️" : "Removed supplication from favorites ❤️");
    } else {
      updated = [...favorites, duaId];
      triggerToast(isAr ? "تم حفظ الدعاء في المفضلة لذكر عاطر ❤️" : "Saved supplication in favorites list ❤️");
    }
    saveFavoritesToStorage(updated);
  };

  const triggerToast = (msg: string) => {
    setAlertText(msg);
    setTimeout(() => {
      setAlertText(null);
    }, 3000);
  };

  // Combine predefined and custom duas with isFavorite flag computed dynamically
  const allDuas = [...PREDEFINED_DUAS, ...customDuas].map(dua => ({
    ...dua,
    isFavorite: favorites.includes(dua.id)
  }));

  const handleCopy = (text: string, id: string) => {
    speakDuaVib();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast(isAr ? "تم نسخ نص الدعاء إلى الذاكرة بنجاح 📋" : "Supplication text copied to clipboard 📋");
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formText.trim()) {
      alert(isAr ? "يرجى كتابة عنوان وتفاصيل نص الدعاء أولاً." : "Please provide a title and text details.");
      return;
    }

    if (formMode === "create") {
      const newDua: Dua = {
        id: "dua_" + Date.now(),
        titleAr: formTitle,
        titleEn: formTitle,
        textAr: formText,
        textEn: formText,
        sourceAr: formSource || (isAr ? "مضاف شخصياً" : "Custom Add"),
        sourceEn: formSource || (isAr ? "مضاف شخصياً" : "Custom Add"),
        category: "custom"
      };
      const updated = [newDua, ...customDuas];
      saveCustomDuasToStorage(updated);
      triggerToast(isAr ? "تم إضافة دعائك الخاص بنجاح 🤲" : "Custom supplication added successfully 🤲");
    } else if (formMode === "edit" && editingId) {
      const updated = customDuas.map(dua => {
        if (dua.id === editingId) {
          return {
            ...dua,
            titleAr: formTitle,
            titleEn: formTitle,
            textAr: formText,
            textEn: formText,
            sourceAr: formSource || (isAr ? "مضاف شخصياً" : "Custom Add"),
            sourceEn: formSource || (isAr ? "مضاف شخصياً" : "Custom Add")
          };
        }
        return dua;
      });
      saveCustomDuasToStorage(updated);
      triggerToast(isAr ? "تم تحديث وحفظ نص الدعاء بنجاح ✅" : "Supplication details updated successfully ✅");
    }

    // Reset Form
    setIsFormOpen(false);
    setFormTitle("");
    setFormText("");
    setFormSource("");
    setEditingId(null);
  };

  const handleEditInit = (dua: Dua) => {
    setFormMode("edit");
    setEditingId(dua.id);
    setFormTitle(dua.titleAr);
    setFormText(dua.textAr);
    setFormSource(dua.sourceAr !== "مضاف شخصياً" && dua.sourceAr !== "Custom Add" ? dua.sourceAr : "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(isAr ? "هل أنت متأكد من رغبتك في حذف هذا الدعاء الخاص نهائياً؟" : "Are you sure you want to delete this custom supplication permanently?")) {
      const updated = customDuas.filter(dua => dua.id !== id);
      saveCustomDuasToStorage(updated);
      
      // Also remove from favorites if favorited
      if (favorites.includes(id)) {
        saveFavoritesToStorage(favorites.filter(favId => favId !== id));
      }
      
      triggerToast(isAr ? "تم حذف الدعاء بنجاح 🗑️" : "Supplication removed successfully 🗑️");
    }
  };

  // Filter and Search Logic
  const filteredDuas = allDuas.filter(dua => {
    // Sub-tab filter
    if (activeSubTab === "favorites" && !dua.isFavorite) return false;
    if (activeSubTab === "custom" && dua.category !== "custom") return false;

    // Search query filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      dua.titleAr.toLowerCase().includes(query) ||
      dua.titleEn.toLowerCase().includes(query) ||
      dua.textAr.toLowerCase().includes(query) ||
      dua.textEn.toLowerCase().includes(query) ||
      dua.sourceAr.toLowerCase().includes(query) ||
      dua.sourceEn.toLowerCase().includes(query)
    );
  });

  return (
    <div id="duas-section-container" className={`w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 md:py-6 animate-in fade-in duration-300 transition-all ${trueNightMode ? "brightness-[0.82] contrast-[0.98]" : ""}`}>
      
      {/* Toast alert overlay */}
      <AnimatePresence>
        {alertText && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-55 bg-indigo-950/95 border border-indigo-500/40 text-stone-200 text-xs font-sans font-bold px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-[90vw]"
            dir={isAr ? "rtl" : "ltr"}
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span>{alertText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${isAr ? "text-right" : "text-left"}`}>
        <div>
          <h2 className="text-lg font-black text-amber-500 font-sans flex items-center gap-2 justify-start">
            <MessageSquare className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
            <span>{isAr ? "بوابة الأذكار والأدعية المفضلة 🤲" : "Uplifting Prayers & Personal Supplications 🤲"}</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            {isAr 
              ? "تضرّع إلى الرحيم، تصفح الأدعية المختارة، أضف أدعيتك وتضرعاتك الخاصة بنقرة واحدة لتحصين نفسك كل صباح ومساء"
              : "Read comfort-giving Quranic and Sunnah prayers, and save/write your own custom supplications with full privacy."}
          </p>
        </div>

        {/* Add custom supplication button */}
        <button
          onClick={() => {
            speakDuaVib();
            setFormMode("create");
            setFormTitle("");
            setFormText("");
            setFormSource("");
            setIsFormOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs font-sans rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto hover:shadow-amber-500/10"
        >
          <Plus className="w-4 h-4 text-stone-950 stroke-[3]" />
          <span>{isAr ? "أضف دعاءً خاصاً 🤲" : "Add Custom Dua 🤲"}</span>
        </button>
      </div>

      {/* Controller tabs & searching */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 border border-stone-850 p-3 rounded-3xl mb-6 ${isAr ? "flex-row-reverse" : ""}`}>
        
        {/* Toggle subtabs */}
        <div className="flex bg-stone-950 p-1.5 rounded-2xl border border-stone-800 w-full sm:w-auto" dir={isAr ? "rtl" : "ltr"}>
          <button
            onClick={() => { speakDuaVib(); setActiveSubTab("all"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${
              activeSubTab === "all" ? "bg-amber-600 text-stone-950 font-black" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {isAr ? "كل الأدعية" : "All Duas"}
          </button>
          <button
            onClick={() => { speakDuaVib(); setActiveSubTab("favorites"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center flex items-center justify-center gap-1.5 ${
              activeSubTab === "favorites" ? "bg-amber-600 text-stone-950 font-black" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeSubTab === "favorites" ? "fill-stone-950" : "text-rose-500"}`} />
            <span>{isAr ? "المفضلة" : "Favorites"}</span>
          </button>
          <button
            onClick={() => { speakDuaVib(); setActiveSubTab("custom"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${
              activeSubTab === "custom" ? "bg-amber-600 text-stone-950 font-black" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {isAr ? "أدعيتي الخاصة" : "My Customs"}
          </button>
        </div>

        {/* Search input field */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? "ابحث عن دعاء..." : "Search supplications..."}
            className="w-full bg-stone-950/80 border border-stone-800 text-xs font-sans text-stone-200 rounded-2xl py-2.5 pl-8 pr-3.5 focus:border-amber-500 focus:outline-none transition-all text-right"
            dir={isAr ? "rtl" : "ltr"}
          />
          <Search className={`absolute top-3 w-4 h-4 text-stone-500 pointer-events-none ${isAr ? "left-3" : "right-3"}`} />
        </div>
      </div>

      {/* Editor dialog overlay modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 p-5 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200" dir={isAr ? "rtl" : "ltr"}>
            <button
              onClick={() => { speakDuaVib(); setIsFormOpen(false); }}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-black text-amber-500 font-sans mb-1 flex items-center gap-1.5 justify-start">
              <Plus className="w-4 h-4" />
              <span>{formMode === "create" ? (isAr ? "إضافة دعاء جديد" : "Write Custom Supplication") : (isAr ? "تعديل الدعاء الخاص" : "Edit Private Supplication")}</span>
            </h3>
            <p className="text-[10px] text-stone-450 font-sans mb-4">
              {isAr ? "سيتم تخزين هذا الدعاء كلياً في جهازك بخصوصية كاملة وغير تواصلية." : "This data is securely persisted inside your local device cache only."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-stone-300 font-bold font-sans">{isAr ? "عنوان الدعاء:" : "Title:"}</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={isAr ? "مثال: دعاء التوفيق ودفع العُسر" : "E.g., Prayer for exams and focus"}
                  className="w-full bg-stone-950 border border-stone-850 text-xs font-sans text-stone-200 rounded-xl py-2 px-3 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-stone-300 font-bold font-sans">{isAr ? "نص وتفاصيل الدعاء الخاشع:" : "Dua Text:"}</label>
                <textarea
                  required
                  rows={4}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder={isAr ? "اكتب هنا الكلمات التي ترجوها متضرعاً لله تبارك وتعالى..." : "Write your comforting prayer here..."}
                  className="w-full bg-stone-950 border border-stone-850 text-xs font-sans text-stone-200 rounded-xl py-2 px-3 focus:border-amber-500 outline-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-stone-300 font-bold font-sans">{isAr ? "المصدر أو فضل الدعاء (اختياري):" : "Source/Context (Optional):"}</label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder={isAr ? "مثال: مأثور ذو أثر ملموس في تسهيل أمور حياتي" : "E.g., Custom/prophetic context"}
                  className="w-full bg-stone-950 border border-stone-850 text-xs font-sans text-stone-200 rounded-xl py-2 px-3 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-stone-800 bg-stone-950/60 hover:bg-stone-850 rounded-xl text-stone-400 font-bold text-xs font-sans transition cursor-pointer"
                >
                  {isAr ? "إلغاء الأمر" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 hover:opacity-90 bg-amber-600 hover:bg-amber-550 text-stone-950 font-black text-xs font-sans rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-stone-950" />
                  <span>{isAr ? "حفظ وتثبيت الدعاء" : "Save Supplication"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duas list cards panel */}
      {filteredDuas.length === 0 ? (
        <div className="p-16 text-center bg-stone-900 border border-stone-850 rounded-3xl text-stone-300 text-xs font-sans flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 border border-stone-750">
            <MessageSquare className="w-5 h-5 text-stone-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-200 leading-normal">
              {isAr ? "لا توجد أدعية مطابقة لبحثك في هذا القسم" : "No supplications match your search query."}
            </p>
            <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto leading-normal">
              {isAr 
                ? "ابدأ بإضافة أدعيتك الخاصة أو اختيار أدعيتك المفضلة من التصنيفات لتظهر لك هنا بشكل دائم."
                : "Add custom supplications or click the heart icon on any predefined prayer to list it here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDuas.map((dua) => {
            const isCustom = dua.category === "custom";
            return (
              <div
                key={dua.id}
                className="bg-stone-900 border border-stone-800/80 rounded-3xl p-4.5 hover:border-indigo-500/35 transition-all duration-300 flex flex-col justify-between group h-full relative"
                dir={isAr ? "rtl" : "ltr"}
              >
                <div>
                  {/* Title and Category header */}
                  <div className="flex items-start justify-between gap-2.5 mb-3 select-all">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-stone-100 font-sans tracking-tight">
                        {isAr ? dua.titleAr : dua.titleEn}
                      </h4>
                      <p className="text-[9px] text-stone-450 font-mono mt-0.5 select-none">
                        {isAr ? dua.sourceAr : dua.sourceEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Heart option */}
                      <button
                        onClick={() => toggleFavorite(dua.id)}
                        className={`p-1.5 rounded-xl border transition-all ${
                          dua.isFavorite 
                            ? "bg-rose-500/10 border-rose-500/25 text-rose-500" 
                            : "bg-stone-950 border-stone-800 text-stone-500 hover:text-rose-400 hover:scale-105"
                        } cursor-pointer`}
                        title={dua.isFavorite ? (isAr ? "إزالة من المفضلة" : "Remove from favorites") : (isAr ? "حفظ في المفضلة" : "Store in favorites")}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Custom specific actions */}
                      {isCustom && (
                        <>
                          <button
                            onClick={() => { speakDuaVib(); handleEditInit(dua); }}
                            className="p-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-500 hover:text-amber-500 transition cursor-pointer"
                            title={isAr ? "تعديل الدعاء" : "Edit Supplication"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(dua.id)}
                            className="p-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-500 hover:text-red-500 transition cursor-pointer"
                            title={isAr ? "حذف الدعاء الخاص" : "Delete Supplication"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Core Supplication Text */}
                  <div className="bg-stone-950/40 border border-stone-850/50 p-4 rounded-2xl mb-4 text-stone-150 leading-relaxed text-right font-sans text-xs sm:text-[13px] tracking-wide font-medium relative select-all">
                    <p className="text-center font-semibold text-balance" dir="rtl">
                      {dua.textAr}
                    </p>
                    {/* If language is English, display translation */}
                    {!isAr && (
                      <p className="text-left text-[11px] text-stone-400 border-t border-stone-850 pt-2 px-1 block mt-2.5 leading-normal" dir="ltr">
                        {dua.textEn}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer with share & copy button controls */}
                <div className={`flex items-center justify-between border-t border-stone-850/50 pt-3 mt-1 text-[10px] text-stone-450 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="font-sans text-[9px] text-indigo-400 capitalize bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 select-none">
                    {dua.category === "quranic" ? (isAr ? "طلب من القرآن الكريم ۞" : "Quranic Supplication") :
                     dua.category === "prophetic" ? (isAr ? "من السنة النبوية ﷺ" : "Prophetic Sunnah Prayer") :
                     dua.category === "custom" ? (isAr ? "أدعيتي الخاصة ✍️" : "My Custom Prayer") : 
                     (isAr ? "عامة مأثورة" : "General Supplication")}
                  </span>

                  <button
                    onClick={() => handleCopy(dua.textAr, dua.id)}
                    className="px-2.5 py-1 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-amber-500 border border-stone-800 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    {copiedId === dua.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === dua.id ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الدعاء" : "Copy Translation")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
