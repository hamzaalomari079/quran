import React, { useState, useEffect } from "react";
import { Compass, Home, LogOut, Utensils, Plane, RotateCcw, Award, CheckCircle2, Moon, Sparkles, Heart, Shield, Book } from "lucide-react";

interface HisnDhikr {
  id: string;
  category: "home_entry" | "home_exit" | "food" | "travel" | "sleep_wake" | "mosque" | "prayer" | "distress" | "repentance";
  text: string;
  reference: string;
  targetCount: number;
  description?: string;
}

const hisnDatabase: HisnDhikr[] = [
  // 1. دخول المنزل
  {
    id: "entry_1",
    category: "home_entry",
    text: "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا.",
    reference: "رواه أبو داود (ثم يُسلّم على أهله)",
    targetCount: 1,
    description: "ينبغي للمسلم إذا دخل منزله أن يذكر الله تعالى، ويسلم، فهذا يطرد الشياطين ويزيد البركة."
  },
  {
    id: "entry_2",
    category: "home_entry",
    text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا.",
    reference: "سنن أبي داود",
    targetCount: 1,
    description: "دعاء طيب التماسًا لبركة الدخول والخروج من البيت."
  },
  // 2. الخروج من المنزل
  {
    id: "exit_1",
    category: "home_exit",
    text: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ.",
    reference: "رواه الترمذي وأبو داود • صححه الألباني",
    targetCount: 1,
    description: "من قال ذلك قيل له: هُدِيتَ، وكُفِيتَ، ووُقِيتَ، وتنحَّى عنه الشيطان."
  },
  {
    id: "exit_2",
    category: "home_exit",
    text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أَضِلَّ أَوْ أُضَلَّ، أَوْ أَزِلَّ أَوْ أُزَلَّ، أَوْ أَظْلِمَ أَوْ أُظْلَمَ، أَوْ أَجْهَلَ أَوْ يُجْهَلَ عَلَيَّ.",
    reference: "رواه الترمذي وأبو داود وصححه الألباني",
    targetCount: 1,
    description: "استعاذة كريمة من الوقوع في الضلال أو الزلل أو ظلم الآخرين أو الجهل."
  },
  // 3. الطعام والشراب
  {
    id: "food_1",
    category: "food",
    text: "بِسْمِ اللَّهِ.",
    reference: "رواه أبو داود والترمذي وصححه الألباني",
    targetCount: 1,
    description: "يقولها المسلم في بداية طعامه. وإذا نسي في أوله، فاليقل: بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ."
  },
  {
    id: "food_2",
    category: "food",
    text: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا الطَّعَامَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ.",
    reference: "أخرجه أصحاب السنن وحسنه الألباني",
    targetCount: 1,
    description: "من قال هذا عند فراغه من الطعام غُفِرَ له ما تقدَّم من ذنبه."
  },
  {
    id: "food_3",
    category: "food",
    text: "اللَّهُمَّ بَارِكْ لَنَا فِيهِ، وَأَطْعِمْنَا خَيْراً مِنْهُ.",
    reference: "رواه الترمذي وحسنه",
    targetCount: 1,
    description: "دعاء للبركة في الطعام وسؤال ما هو خير منه للرزق الواسع الطيب."
  },
  // 4. السفر
  {
    id: "travel_1",
    category: "travel",
    text: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ. اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الْأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمَنْظَرِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالْأَهْلِ.",
    reference: "رواه مسلم وحسنه الألباني",
    targetCount: 1,
    description: "دعاء السفر الأكبر والجامع للحماية وتسهيل المسيرة وتيسير الخطوات والعود الميمون."
  },
  {
    id: "travel_2",
    category: "travel",
    text: "أَسْتَوْدِعُكُمُ اللَّهَ الَّذِي لَا تَضِيعُ وَدَائِعُهُ.",
    reference: "رواه أحمد وأبن ماجه وصححه الألباني",
    targetCount: 1,
    description: "دعاء رصين يقوله المسافر لمن يودعهم ويتركهم خلفه في رعاية خالق الأكوان."
  },
  {
    id: "travel_3",
    category: "travel",
    text: "أَسْتَوْدِعُ اللَّهَ دِينَكَ، وَأَمَانَتَكَ، وَخَوَاتِيمَ عَمَلِكَ.",
    reference: "رواه أحمد والترمذي وصححه الألباني",
    targetCount: 1,
    description: "دعاء مقيم المسجد أو الأهل للشخص المسافر عند توديعه لسلامته وتثبيته."
  },
  // 5. النوم والاستيقاظ
  {
    id: "sleep_1",
    category: "sleep_wake",
    text: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ.",
    reference: "رواه البخاري",
    targetCount: 1,
    description: "يقال عند الاستيقاظ الشريف من النوم لحمد الخالق على نعمة وهب الحياة مجدداً."
  },
  {
    id: "sleep_2",
    category: "sleep_wake",
    text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.",
    reference: "رواه البخاري ومسلم",
    targetCount: 1,
    description: "يقال عند النوم التماسًا لحفظ المولى ورعايته وحصانته أثناء المنام الغائب."
  },
  {
    id: "sleep_3",
    category: "sleep_wake",
    text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.",
    reference: "رواه البخاري",
    targetCount: 1,
    description: "من سنن وعادات النوم العظيمة تسليم الروح والجسد لله سبحانه وتعالى في يقظتنا ورقادنا."
  },
  // 6. المسجد
  {
    id: "mosque_1",
    category: "mosque",
    text: "بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ.",
    reference: "رواه مسلم",
    targetCount: 1,
    description: "يقال عند الدخول طائعاً إلى مساجد الله طالباً رحمته وغفرانه الإلهي الدائم."
  },
  {
    id: "mosque_2",
    category: "mosque",
    text: "بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ.",
    reference: "رواه مسلم",
    targetCount: 1,
    description: "يقال عند الخروج من المسجد متكلاً على رزق الله وفضله ومساعي السعي."
  },
  // 7. بعد الصلاة
  {
    id: "prayer_1",
    category: "prayer",
    text: "أَسْتَغْفِرُ اللَّهَ (ثَلاثاً) اللَّهُمَّ أَنْتَ السَّلامُ وَمِنْكَ السَّلامُ، تَبَارَكْتَ يَا ذَا الْجَلالِ وَالعَمَلِ وَالإِكْرَامِ.",
    reference: "رواه مسلم",
    targetCount: 1,
    description: "الاستغفار ثلاثاً مباشرة بعد قيام الإمام والتسليم من المكتوبة لتعبئة القصور."
  },
  {
    id: "prayer_2",
    category: "prayer",
    text: "اللَّهُمَّ أَعِنِّى عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ.",
    reference: "رواه أبو داود وصححه الألباني",
    targetCount: 1,
    description: "وصية حبيبنا ونبينا لمعاذ بن جبل أن يقولها دبر كل صلاة مكتوبة لتثبت السكينة."
  },
  {
    id: "prayer_3",
    category: "prayer",
    text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ.",
    reference: "رواه مسلم",
    targetCount: 1,
    description: "من أعظم التهليلات الواردة دبر الصلوات المكتوبة لتأصيل عقيدة التوحيد والنعم."
  },
  // 8. الكرب والهم والغم
  {
    id: "distress_1",
    category: "distress",
    text: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ.",
    reference: "رواه البخاري ومسلم",
    targetCount: 1,
    description: "دعاء الكرب وتفريج الهم والشعور بالأزمات الكبرى يبعث الهدوء والرضوان التام."
  },
  {
    id: "distress_2",
    category: "distress",
    text: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لَا إِلَهَ إِلَّا أَنْتَ.",
    reference: "رواه أبو داود وحسنه الألباني",
    targetCount: 3,
    description: "سؤال الحفظ الإلهي المطلق وعدم الركون إلى القوى الذاتية للبشر الفانين."
  },
  {
    id: "distress_3",
    category: "distress",
    text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ.",
    reference: "رواه الترمذي وصححه الألباني",
    targetCount: 3,
    description: "الاستغاثة بوجاهة صفة الحي القيوم لإصلاح الأمور وتطهير الروح والجنان."
  },
  // 9. الاستغفار والتوبة
  {
    id: "repentance_1",
    category: "repentance",
    text: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ.",
    reference: "رواه أبو داود والترمذي وصححه الألباني",
    targetCount: 3,
    description: "أثر عظيم: من قالها غُفرت ذنوبه الكثيرة وإن كان فرّ من الزحف العريض."
  },
  {
    id: "repentance_2",
    category: "repentance",
    text: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الْغَفُورُ.",
    reference: "رواه الترمذي وأبو داود وصححه الألباني",
    targetCount: 100,
    description: "الاستغفار النبوي الدائم؛ كان يُعد للنبي الكريم في المجلس الفردي مئة مرة."
  }
];

export default function HisnAlMuslim() {
  const [activeCategory, setActiveCategory] = useState<"all" | "home_entry" | "home_exit" | "food" | "travel" | "sleep_wake" | "mosque" | "prayer" | "distress" | "repentance">("all");
  
  // Track clicks / counters for each zikr
  const [userClicks, setUserClicks] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = localStorage.getItem("quran_app_hisn_clicks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track the absolute sum of all clicks for statistical joy
  const [totalClicks, setTotalClicks] = useState<number>(0);

  // Retrieve trueNightMode configuration to adapt visual elegance
  const [trueNightMode, setTrueNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("trueNightMode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Listen to potential changes in night mode
    const checkNight = () => {
      const current = localStorage.getItem("trueNightMode") === "true";
      if (current !== trueNightMode) {
        setTrueNightMode(current);
      }
    };
    const interval = setInterval(checkNight, 1500);
    return () => clearInterval(interval);
  }, [trueNightMode]);

  useEffect(() => {
    try {
      localStorage.setItem("quran_app_hisn_clicks", JSON.stringify(userClicks));
    } catch (e) {
      console.warn("Could not save Hisn clicks to localStorage:", e);
    }

    // Recalculate total sum
    const total = Object.values(userClicks).reduce((sum, val) => sum + val, 0);
    setTotalClicks(total);
  }, [userClicks]);

  const handleIncrementClick = (id: string) => {
    setUserClicks(prev => {
      const currentVal = prev[id] || 0;
      
      // Gentle vibration feedback on devices
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
      
      return {
        ...prev,
        [id]: currentVal + 1
      };
    });
  };

  const handleResetClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserClicks(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleResetAllCategory = () => {
    if (window.confirm("هل تريد تصفير جميع عدادات الفئة الحالية؟")) {
      setUserClicks(prev => {
        const updated = { ...prev };
        filteredDhikr.forEach(d => {
          delete updated[d.id];
        });
        return updated;
      });
    }
  };

  const filteredDhikr = hisnDatabase.filter(item => {
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  const categoriesMeta = {
    all: { label: "الكل", count: hisnDatabase.length, icon: Compass, color: "text-amber-500 bg-amber-500/10 border-amber-500/25" },
    home_entry: { label: "دخول المنزل", count: hisnDatabase.filter(d => d.category === "home_entry").length, icon: Home, color: "text-[#3b82f6] bg-blue-500/10 border-blue-500/25" },
    home_exit: { label: "الخروج من المنزل", count: hisnDatabase.filter(d => d.category === "home_exit").length, icon: LogOut, color: "text-[#10b981] bg-green-500/10 border-green-500/25" },
    food: { label: "الطعام والشراب", count: hisnDatabase.filter(d => d.category === "food").length, icon: Utensils, color: "text-[#f43f5e] bg-rose-500/10 border-rose-500/25" },
    travel: { label: "السفر والترحال", count: hisnDatabase.filter(d => d.category === "travel").length, icon: Plane, color: "text-amber-550 bg-amber-500/10 border-amber-500/25" },
    sleep_wake: { label: "النوم والنهوض", count: hisnDatabase.filter(d => d.category === "sleep_wake").length, icon: Moon, color: "text-[#818cf8] bg-indigo-500/10 border-indigo-500/25" },
    mosque: { label: "المسجد والقبلة", count: hisnDatabase.filter(d => d.category === "mosque").length, icon: Book, color: "text-[#2dd4bf] bg-teal-500/10 border-teal-500/25" },
    prayer: { label: "بعد الصلوات", count: hisnDatabase.filter(d => d.category === "prayer").length, icon: Shield, color: "text-[#34d399] bg-emerald-500/10 border-emerald-500/25" },
    distress: { label: "الكرب والهم", count: hisnDatabase.filter(d => d.category === "distress").length, icon: Heart, color: "text-[#f87171] bg-red-500/10 border-red-500/25" },
    repentance: { label: "الاستغفار والتوبة", count: hisnDatabase.filter(d => d.category === "repentance").length, icon: Sparkles, color: "text-[#fbbf24] bg-yellow-500/10 border-yellow-500/25" }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 md:py-6 animate-in fade-in duration-300 transition-all duration-500 ${trueNightMode ? "brightness-[0.82] contrast-[0.98]" : ""}`}>
      
      {/* Title Header */}
      <div className="text-right mb-6">
        <h2 className="text-lg font-extrabold text-amber-500 font-sans">سلسلة حصن المسلم الكاملة ۞</h2>
        <p className="text-xs text-stone-400 font-sans mt-0.5">أذكار وتوجيهات الحماية اليومية وتتبع القراءة بالعداد الرقمي التفاعلي بالنقرات</p>
      </div>

      {/* Aggregate Statistics banner */}
      <div className={`${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"} border rounded-3xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-right`}>
        <div className="flex items-center gap-3.5 flex-row-reverse">
          <div className="w-11 h-11 bg-amber-600/10 border border-amber-500/25 text-amber-500 rounded-2xl flex items-center justify-center font-bold">
            <Award className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-stone-450 font-sans">إجمالي الأوراد اليومية في حصن المسلم</span>
            <h4 className="text-sm font-extrabold text-stone-100 font-sans">مجموع الأذكار والأدعية وقراءاتها بالنقرات</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="bg-stone-950/40 px-4 py-2 border border-stone-850 rounded-2xl text-center min-w-[110px]">
            <span className="text-[10px] text-amber-500 font-sans font-bold">إجمالي النقرات</span>
            <p className="text-base font-black font-sans text-stone-250 mt-0.5">{totalClicks}</p>
          </div>

          <button
            onClick={handleResetAllCategory}
            className="p-2 border border-stone-800 rounded-xl hover:bg-stone-850 hover:text-rose-450 text-stone-450 transition cursor-pointer"
            title="تصفير عدادات الفئة النشطة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Categories Switcher Tab Row */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 mb-8 select-none flex-row-reverse">
        {Object.entries(categoriesMeta).map(([key, meta]) => {
          const IconComponent = meta.icon;
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key as any)}
              className={`px-3 py-2.5 rounded-2xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-600 border border-amber-550 text-stone-950 shadow-md font-sans"
                  : trueNightMode
                    ? "bg-black/40 border-stone-900 text-stone-400 hover:text-stone-250"
                    : "bg-stone-900 border-stone-850 text-stone-400 hover:text-stone-200"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{meta.label}</span>
              <span className="text-[10px] bg-stone-950/30 px-1.5 py-0.5 rounded-md font-sans">{meta.count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid List of Supplication Dhikr Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDhikr.map((dhikr) => {
          const count = userClicks[dhikr.id] || 0;
          const keyCategory = categoriesMeta[dhikr.category] || categoriesMeta.all;
          const isFinished = count >= dhikr.targetCount;

          return (
            <div
              key={dhikr.id}
              onClick={() => handleIncrementClick(dhikr.id)}
              className={`border rounded-3xl p-5 md:p-6 transition-all duration-300 relative select-none hover:shadow-lg hover:shadow-stone-950/30 cursor-pointer flex flex-col justify-between gap-4 text-right ${
                isFinished
                  ? "bg-amber-600/5 border-amber-500/25 shadow-inner"
                  : trueNightMode
                    ? "bg-black/95 border-stone-900"
                    : "bg-stone-900 border-stone-850 hover:border-amber-500/20"
              }`}
            >
              {/* Card Upper Header with Badge and Actions */}
              <div className="flex items-center justify-between border-b border-stone-850/60 pb-3 flex-row-reverse">
                <span className={`text-[10px] font-extrabold font-sans border px-2.5 py-1 rounded-full ${keyCategory.color}`}>
                  {keyCategory.label}
                </span>

                <div className="flex items-center gap-1.5">
                  {isFinished && (
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-[10px] select-none">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>قُرِئَت</span>
                    </div>
                  )}

                  {count > 0 && (
                    <button
                      onClick={(e) => handleResetClick(dhikr.id, e)}
                      className="p-1 rounded-lg bg-stone-950 hover:bg-[#ff0000]/10 text-stone-450 hover:text-rose-450 border border-stone-850 transition flex items-center justify-center cursor-pointer"
                      title="تصفير هذه العبارة"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Text Content */}
              <div className="flex flex-col gap-2 relative">
                <p className="text-stone-100 text-sm md:text-base font-medium leading-relaxed font-sans mt-1 pr-1" dir="rtl">
                  {dhikr.text}
                </p>
                
                <span className="text-[10px] text-[#c49a6c]/80 font-sans leading-normal block mt-1.5 select-text font-semibold">
                  ۞ {dhikr.reference}
                </span>
                
                {dhikr.description && (
                  <p className="text-[10px] text-stone-450 font-sans leading-relaxed mt-1 border-t border-stone-850/35 pt-1.5 select-text">
                    {dhikr.description}
                  </p>
                )}
              </div>

              {/* Count Tracker Footer click trigger section */}
              <div className="bg-stone-950/30 border border-stone-850/55 rounded-2xl p-2.5 px-3.5 flex items-center justify-between flex-row-reverse text-right relative mt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-stone-450 font-sans">عدد القراءات الحالي</span>
                  <p className="text-[#c49a6c] text-sm font-black font-sans leading-tight select-none">{count} قراءة</p>
                </div>
                
                <div className="flex items-center gap-1 bg-amber-600/10 border border-amber-500/20 text-xs font-black text-amber-500 px-3.5 py-1.5 rounded-xl select-none font-sans">
                  <span>انقر للتسجيل (+1)</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
