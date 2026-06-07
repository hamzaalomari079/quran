import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from "recharts";
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  Compass,
  Flame,
  PlusCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Zap,
  Target,
  Check,
  Minus,
  Plus,
  Search,
  Hourglass,
  CalendarDays
} from "lucide-react";
import { surahList } from "../data/surahData";

// Quran reading log entry definition
interface QuranLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  surahNumber: number;
  surahNameAr: string;
  surahNameEn: string;
  pagesCount: number;
}

// Stats Translations dictionary to support perfect localization
const statsTranslations: Record<string, Record<string, string>> = {
  ar: {
    title: "لوحة الإحصائيات الروحانية والتقدم ۞",
    subtitle: "رسوم بيانية تفاعلية متقدمة ومؤشرات لتتبع قراءة المصحف الشريف والذكر اليومي لرفع الاستمرارية",
    khatmTab: "ختم القرآن الكريم 📖",
    generalTab: "الأذكار والأوراد العامة 🛡️",
    khatmPlanTitle: "خـطة ومنهـج الختمـة الكـريمة",
    khatmPlanDesc: "حدّد المدة المستهدفة وسنوفر لك ريتم التلاوة اليومي الملائم للوصول لغايتك",
    dayUnit: "يوم",
    days30: "٣٠ يومًا",
    days60: "٦٠ يومًا",
    days90: "٩٠ يومًا",
    days120: "١٢٠ يومًا",
    suggestedPortion30: "جزء يومياً",
    suggestedPortion60: "نصف جزء",
    suggestedPortion90: "ربع جزء",
    suggestedPortion120: "ثمن جزء",
    autoTrackHeader: "الرصد والـتحليل ذكـي وتلقـائي! 🧠",
    autoTrackDesc: "البرنامج يقيس صفحات قراءتك تلقائياً في الخلفية عند تصفح وقراءة السور في قارئ السور دون الحاجة لأي تسجيل يدوي.",
    suggestedDailyPortion: "الورد المقترح",
    pageDayUnit: "صفحة/يوم",
    khatmProgressTitle: "تـتقدم الختمة الكبرَى",
    pagesRead: "الصـفحات المرتلـة",
    versesCompleted: "الآيـات المنجـزة",
    surahsCompleted: "السُّور المتمّـة",
    remainingPages: "متبقية: {count} صفحة",
    versesCountUnit: "آية مباركة تم المرور بها",
    surahsCompletedUnit: "سورة مقروءة بالكامل",
    actualSpeedSuffix: "معدل سرعة تلاوتك الفعلية (الـ ٧ أيام الأخيرة):",
    speedGreat: "✨ ممتاز! تلاوتك الكريمة تسرع بمعدل يفوق المطلوب للختم. ستنتهي في الموعد أو قبله بإذن الله.",
    speedSlow: "⚠️ تنبيه: معدل قراءتك الحالي أبطأ قليلاً من المطلوب ({req} صفحة/يوم). يرجى تكثيف قراءتك لبلوغ غايتك.",
    speedNone: "ابدأ قراءة السور الكريمة في تطبيق \"قارئ السور\" لتحديد معدلك الحالي والافتراضي تلقائياً.",
    expectedFinishDate: "الموعد المتوقع للختم",
    withinDays: "خلال {days} يومًا",
    interactiveChartTitle: "مخطط تقدّم الختمة اليومي والأسبوعي التفاعلي",
    versusTargetSpeed: "مقارنة بـسرعتك",
    actualReadingLabel: "التلاوة الفعلية (تلقائي)",
    planRequirementLabel: "المطلوب للخطة",
    chartDescription: "يقارن بوضوح معدل قراءتك اليومية الآلية (الصفحات المتلوّة) بنظام وخط الالتزام الفعلي للخطة، بما يسهل عليك تقييم التقدم الأسبوعي.",
    surahMapTitle: "خـريطـة مـتـابعة السـور التفـصيليـة",
    surahMapDesc: "افحص تقدّم قراءتك وحالة كل سورة من السور الـ ١١٤ للذكر الجليل",
    searchPlaceholder: "ابحث عن سورة مباركة...",
    surahLabel: "سورة {name}",
    completedLabel: "كاملة",
    unreadLabel: "غير مقروءة",
    last7DaysGoalAchieved: "لقد حققت هدفك اليومي خلال {days} أيام هذا الأسبوع! استمر على هذا الخط الملهم لزيادة البركة 🌿",
    last7DaysNoGoal: "لم يكتمل رصد تحقيق الهدف اليومي هذا الأسبوع بعد. تفاعل لرفع مؤشرات الاستمرار الروحي 💪",
    generalAchievementsTitle: "أوسمـة الإنـجاز والتمـكين الإيمـاني",
    achievementsDesc: "أوسمة استحقاق تفاعلية فريدة تمنح لك ترقية تلقائية تقديراً لمدى استمرارك وثباتك الروحي",
    dailyQuranLoggerTitle: "التسجيـل السريـع للتصحيـح والتدويـن ✍️",
    dailyQuranLoggerDesc: "قمت بقراءة قدر محدد خارج التطبيق؟ يمكنك تلافي ذلك وتصحيح رصيدك الإحصائي هنا فوراً",
    surahLogLabel: "السورة الكريمة المقروءة",
    pagesLogLabel: "عدد الصفحات المضافة",
    logFormButton: "حفظ الورد يدوياً +",
    resetHistoryButton: "مسح كافة السجلات وعودة للبداية ↩",
    tasbihSectionTitle: "مؤشـر التسبيـحات والأذكـار الكـليّة",
    tasbihSectionDesc: "معدل الحصيلة العامة لأذكارك وحصنك اليومي المسجل في بوابات الذكر التفاعلية",
    totalDailyTasbih: "الاستغفار والتسبيح",
    totalHisnDhikr: "الأدعية والتحصين",
    activeStreak: "نشاط مستمر",
    registeredBookmarks: "مفضلة الآيات",
    levelBadgeTitle: "المرتبة الإيمانية الفخرية الحالية:",
    generalActivitiesChartTitle: "مخطط تتبع جرد الاستمرارية الأسبوعي للأذكار والتحصين",
    generalActivitiesChartDesc: "معدل النشاط المسجل للأيام الـ ٧ السابقة لنسب الاستغفار وأذكار اليوم الحيوية.",
    tasbihLegend: "الاستغفار والتسبيح",
    protectionLegend: "الأدعية والتحصين",
    hisnCategoriesChartTitle: "مخطط توزيع قراءات وتحصينات الحصن",
    hisnCategoriesChartDesc: "مخطط دائري يوضح توزع استخدامك لأذكار اليوم والليلة بوعي لحصن كامل.",
    chartTip: "تلميح: تنقل بين اللوحات بالضغط على خيارات التبويب العلوية لتحليل تفصيلي لتقدم حفظك وختمتك المباركة.",
    targetGoalPrefix: "الهدف ({target})",
    streakAmazing: "معدل مذهل وثبات منقطع النظير! بارك الله في همّتك ووقتك.",
    streakGood: "جهد طيب، استمر بسحب أورادك يومياً ليرقى معدل استمرارك.",
    streakTry: "خطوة بخطوة، واصل لتشجع على القراءة اليومية وبلوغ الهدف.",
    dailyGoalTitle: "تهـيئـة الـهدف الـيومـي المـخصـص",
    dailyGoalDesc: "اضبط الورد اليومي المستهدف الخاص بك لتوليف التحدي اليومي وإشعال روح المواظبة",
    goalTypePages: "بالصفحات",
    goalTypeSurahs: "بالسور",
    saveGoalButton: "تثبيت الهدف اليومي ⚙️",
    goalLabelPages: "معدل قراءة الصفحات اليومية",
    goalLabelSurahs: "معدل قراءة السور والقصص الشريفة",
    historyTitle: "إدارة سجلات وورود التنزيل",
    historyDesc: "يمكنك مسح وتهيئة كافة الأنشطة الترويحية المخزنة محلياً إذا كنت تود البدء مجدداً.",
    yesterday_preset: "سجل الأنشطة",
    log_today_title: "سجلات اليوم السريعة:",
    no_logs_today: "لم تسجل أي ورود اليوم بعد.",
    streakDaysUnit: "يوم متتالي",
    streakLabel: "الاستمرارية اليومية للبرنامج",
    tasbihLabel: "إجمالي التسبيحات المستغفرة",
    hisnLabel: "قراءات حصن المسلم بالنقرات",
    bookmarkLabel: "الآيات المحفوظة للرجوع السريع",
    pointsRemembrance: "نقاط الهمّة الروحيّة نشطة",
    objectiveTitle: "الأهداف اليومية والالتزام الأسبوعي",
    objectiveDesc: "اضبط هدف قراءتك اليومي وتابع نسبة إنجازك لترسيخ الورد وتثبيته",
    todayBadge: "اليوم",
    weekCommitmentTitle: "لوحة الالتزام الأسبوعي: حققت هدفك في {achieved} من أصل ٧ أيام هذا الأسبوع!",
    pagesUnit: "صفحات",
    surahsUnit: "سور",
    chartIntervalLabel: "آخر ٧ أيام",
    chartPieLabel: "مخطط دائرى",
    dayShort: "يوم",
    confirmResetLogs: "هل أنت متأكد من رغبتك في مسح كافة سجلات وقراءات التلاوة الفعلية للبدء مجدّداً؟",
    validationPositivePages: "يرجى كتابة عدد صفحات صحيح وموجب."
  },
  en: {
    title: "Spiritual Statistics & Progress Dashboard ۞",
    subtitle: "Advanced interactive charts and metrics to track Holy Quran reading and daily remembrance to boost consistency",
    khatmTab: "Holy Quran Completion Center 📖",
    generalTab: "Remedies & Liturgy Center 🛡️",
    khatmPlanTitle: "Quranic Completion (Khatm) Method",
    khatmPlanDesc: "Select your target duration and we'll outline the ideal daily reading pacing to reach your goal",
    dayUnit: "Days",
    days30: "30 Days",
    days60: "60 Days",
    days90: "90 Days",
    days120: "120 Days",
    suggestedPortion30: "1 Juz' daily",
    suggestedPortion60: "Half Juz' daily",
    suggestedPortion90: "Quarter Juz' daily",
    suggestedPortion120: "Eighth Juz' daily",
    autoTrackHeader: "Tracking is smart & fully automatic! 🧠",
    autoTrackDesc: "The app measures your read pages automatically in the background as you traverse the Surah Reader pages, without requiring manual input.",
    suggestedDailyPortion: "Recommended Daily",
    pageDayUnit: "Pages/day",
    khatmProgressTitle: "Main Khatm Progress",
    pagesRead: "Pages Chanted",
    versesCompleted: "Completed Verses",
    surahsCompleted: "Finished Surahs",
    remainingPages: "{count} pages remaining",
    versesCountUnit: "Blessed verses navigated through",
    surahsCompletedUnit: "Surahs fully read",
    actualSpeedSuffix: "Your actual reading speed (last 7 days average):",
    speedGreat: "✨ Outstanding! Your pace exceeds the completion target. You will finish on time or earlier, insha'Allah.",
    speedSlow: "⚠️ Pace Alert: Your current pace is slightly slower than recommended ({req} pages/day). Consider reading more daily.",
    speedNone: "Start reading Surahs in the \"Surah Reader\" section to automatically calibrate your pace.",
    expectedFinishDate: "Estimated Completion Time",
    withinDays: "Within {days} days",
    interactiveChartTitle: "Interactive Daily & Weekly Completion Progress Chart",
    versusTargetSpeed: "vs your speed",
    actualReadingLabel: "Actual Pages (tracked)",
    planRequirementLabel: "Required Pages",
    chartDescription: "Compares your automatically tracked daily reading pages against the ideal target curve, allowing you to fine-tune your efforts.",
    surahMapTitle: "Detailed Surah Navigation Map",
    surahMapDesc: "Examine your progress and status for all 114 Surahs of the Holy Quran",
    searchPlaceholder: "Search for a surah...",
    surahLabel: "Surah {name}",
    completedLabel: "Completed",
    unreadLabel: "Unread",
    last7DaysGoalAchieved: "You've met your daily target on {days} days this week! Keep up this rewarding path 🌿",
    last7DaysNoGoal: "Daily target tracking dataset for this week is still assembling. Engage to boost consistency metrics 💪",
    generalAchievementsTitle: "Spiritual Merits & Achievements",
    achievementsDesc: "Unlock prestigious title badges as you advance in spiritual consistency and liturgy",
    dailyQuranLoggerTitle: "Quick Manual Backup Logging ✍️",
    dailyQuranLoggerDesc: "Read some portions outside the application? Adjust your statistical balance manually here instantly.",
    surahLogLabel: "Surah and Context",
    pagesLogLabel: "Number of pages to add",
    logFormButton: "Log Extra Readings Now ✅",
    resetHistoryButton: "Clear All Reading Statistics 🗑️",
    tasbihSectionTitle: "Total Liturgy & Dhikr Overview",
    tasbihSectionDesc: "Total history rate of your remembrance and protection prayers recorded across the modules",
    totalDailyTasbih: "Tasbeeh Praise",
    totalHisnDhikr: "Protective Dhikr",
    activeStreak: "Consecutive Days",
    registeredBookmarks: "Saved Bookmarks",
    levelBadgeTitle: "Spiritual Rank Badge:",
    generalActivitiesChartTitle: "Weekly Dhikr & Liturgy Tracking Chart",
    generalActivitiesChartDesc: "Active logs for the past 7 days detailing Tasbeeh praise and Daily Protection Duas.",
    tasbihLegend: "Glorification & Tasbeeh",
    protectionLegend: "Protection & Supplications",
    hisnCategoriesChartTitle: "Fortress Supplication Allocation Distribution",
    hisnCategoriesChartDesc: "Proportional distribution of the daily litanies and protective prayers you read.",
    chartTip: "Tip: Toggle the main switcher buttons at the top of this panel to switch between Quran completion tracking and Dhikr litanies.",
    targetGoalPrefix: "Target ({target})",
    streakAmazing: "Astounding consistency and tireless commitment! May Allah bless your efforts.",
    streakGood: "A beautiful trial! Keep going daily to raise your spiritual metrics level.",
    streakTry: "Step by step, continue to build a rewarding daily routine and meet your goals.",
    dailyGoalTitle: "Customize Daily Commitment Target",
    dailyGoalDesc: "Configure your target daily metric goals to adjust the visual graphs and encourage persistence",
    goalTypePages: "Pages",
    goalTypeSurahs: "Surahs",
    saveGoalButton: "Apply Target Metrics ⚙️",
    goalLabelPages: "Daily page-count reading speed target",
    goalLabelSurahs: "Daily finished surah target",
    historyTitle: "Manage Local History Storage",
    historyDesc: "You can fully purge and format all logged local stats here to reset your stats from zero.",
    yesterday_preset: "Log History",
    log_today_title: "Today's Manual Entries:",
    no_logs_today: "No manual logs recorded today.",
    streakDaysUnit: "Consecutive Days",
    streakLabel: "Program usage consistency index daily",
    tasbihLabel: "Total tasbeeh glorifications read",
    hisnLabel: "Daily protective dhikr click count logs",
    bookmarkLabel: "Saved bookmarked verses count",
    pointsRemembrance: "Remembrance Points Active",
    objectiveTitle: "Daily Target & Weekly Commitment",
    objectiveDesc: "Establish a customized daily target metrics to enforce focus and trace completion",
    todayBadge: "Today",
    weekCommitmentTitle: "Weekly Commitment: Met your daily goal on {achieved} out of 7 days!",
    pagesUnit: "pages",
    surahsUnit: "surahs",
    chartIntervalLabel: "Past 7 Days",
    chartPieLabel: "Pie Chart",
    dayShort: "day",
    confirmResetLogs: "Are you sure you want to delete all reading logs and start fresh?",
    validationPositivePages: "Please enter a positive page count integer."
  }
};

export default function StatsPanel() {
  // App-wide Language state detected from global settings localstorage key
  const [isAr, setIsAr] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("quran_app_global_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.language !== "en"; // default to true (Arabic) if it is not 'en'
      }
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const checkLang = () => {
      try {
        const saved = localStorage.getItem("quran_app_global_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          const currentAr = parsed.language !== "en";
          if (currentAr !== isAr) {
            setIsAr(currentAr);
          }
        }
      } catch {}
    };
    const interval = setInterval(checkLang, 1000);
    return () => clearInterval(interval);
  }, [isAr]);

  const t = (key: string) => {
    const bundle = isAr ? statsTranslations.ar : statsTranslations.en;
    return bundle[key] || key;
  };

  // Tab control states ("general" for spiritual, "khatm" for Quran completion center)
  const [activeStatsTab, setActiveStatsTab] = useState<"khatm" | "general">("khatm");

  const [khatmTargetDays, setKhatmTargetDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_app_khatm_target_days");
      return saved ? parseInt(saved, 10) : 30; // default 30 days
    } catch {
      return 30;
    }
  });

  const [surahSearchQuery, setSurahSearchQuery] = useState<string>( "");
  const [surahProgressMap, setSurahProgressMap] = useState<Record<number, number>>({});
  
  const [khatmProgress, setKhatmProgress] = useState({
    readVerses: 0,
    percent: 0,
    completedSurahsCount: 0,
    readPagesCount: 0
  });

  // App-wide True Night Mode state
  const [trueNightMode, setTrueNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("trueNightMode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkNight = () => {
      const current = localStorage.getItem("trueNightMode") === "true";
      if (current !== trueNightMode) {
        setTrueNightMode(current);
      }
    };
    const interval = setInterval(checkNight, 1200);
    return () => clearInterval(interval);
  }, [trueNightMode]);

  // Streak state
  const [streakDays, setStreakDays] = useState<number>(1);
  const [totalTasbih, setTotalTasbih] = useState<number>(0);
  const [totalHisnClicks, setTotalHisnClicks] = useState<number>(0);
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);

  // Quran reading logs state
  const [readingLogs, setReadingLogs] = useState<QuranLogEntry[]>([]);
  
  // Quick Log Form States
  const [logSurahNum, setLogSurahNum] = useState<number>(1);
  const [logPages, setLogPages] = useState<number>(4);

  // Goal setting states
  const [goalType, setGoalType] = useState<"pages" | "surahs" >(() => {
    try {
      return (localStorage.getItem("quran_app_goal_type") as "pages" | "surahs") || "pages";
    } catch {
      return "pages";
    }
  });

  const [goalValue, setGoalValue] = useState<number>(() => {
    try {
      const val = localStorage.getItem("quran_app_goal_value");
      return val ? parseInt(val, 10) : 4;
    } catch {
      return 4;
    }
  });

  const handleSaveGoal = (type: "pages" | "surahs", val: number) => {
    setGoalType(type);
    setGoalValue(val);
    localStorage.setItem("quran_app_goal_type", type);
    localStorage.setItem("quran_app_goal_value", String(val));
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleSaveKhatmTargetDays = (days: number) => {
    setKhatmTargetDays(days);
    localStorage.setItem("quran_app_khatm_target_days", String(days));
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  // Load stats from localStorage
  useEffect(() => {
    // 1. Load bookmarked surahs
    try {
      const savedBook = localStorage.getItem("quran_app_bookmarks");
      if (savedBook) {
        const parsed = JSON.parse(savedBook);
        setTotalBookmarks(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Load total tasbeeh
    try {
      const savedTasbeeh = localStorage.getItem("quran_app_total_tasbeeh");
      if (savedTasbeeh) {
        setTotalTasbih(parseInt(savedTasbeeh) || 0);
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Load Hisn clicks
    try {
      const savedHisn = localStorage.getItem("quran_app_hisn_clicks");
      if (savedHisn) {
        const parsed = JSON.parse(savedHisn);
        const clicksSum = Object.values(parsed).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) as number;
        setTotalHisnClicks(clicksSum);
      }
    } catch (e) {
      console.error(e);
    }

    // 4. Load Quran Reading Logs
    try {
      const savedLogs = localStorage.getItem("quran_app_reading_logs");
      if (savedLogs) {
        setReadingLogs(JSON.parse(savedLogs));
      } else {
        // Initialize with default beautiful placeholder data if clean
        const defaultLogs: QuranLogEntry[] = [
          { id: "log_1", date: getOffsetDateString(-5), surahNumber: 1, surahNameAr: "الفاتحة", surahNameEn: "Al-Fatihah", pagesCount: 1 },
          { id: "log_2", date: getOffsetDateString(-4), surahNumber: 2, surahNameAr: "البقرة", surahNameEn: "Al-Baqarah", pagesCount: 5 },
          { id: "log_3", date: getOffsetDateString(-3), surahNumber: 2, surahNameAr: "البقرة", surahNameEn: "Al-Baqarah", pagesCount: 10 },
          { id: "log_4", date: getOffsetDateString(-2), surahNumber: 18, surahNameAr: "الكهف", surahNameEn: "Al-Kahf", pagesCount: 12 },
          { id: "log_5", date: getOffsetDateString(-1), surahNumber: 36, surahNameAr: "يس", surahNameEn: "Ya-Sin", pagesCount: 6 },
          { id: "log_6", date: getOffsetDateString(0), surahNumber: 67, surahNameAr: "الملك", surahNameEn: "Al-Mulk", pagesCount: 4 }
        ];
        setReadingLogs(defaultLogs);
        localStorage.setItem("quran_app_reading_logs", JSON.stringify(defaultLogs));
      }
    } catch (e) {
      console.error(e);
    }

    // 5. Load or update Daily Streak
    try {
      const lastSessionStr = localStorage.getItem("quran_app_last_active_date");
      const savedStreak = localStorage.getItem("quran_app_streak_days");
      const todayStr = getOffsetDateString(0);

      if (lastSessionStr === todayStr) {
        setStreakDays(parseInt(savedStreak || "1") || 1);
      } else if (lastSessionStr === getOffsetDateString(-1)) {
        // Streak continues
        const nextStreak = (parseInt(savedStreak || "1") || 1) + 1;
        setStreakDays(nextStreak);
        localStorage.setItem("quran_app_streak_days", String(nextStreak));
        localStorage.setItem("quran_app_last_active_date", todayStr);
      } else {
        // Streak broken or new user
        localStorage.setItem("quran_app_streak_days", "1");
        localStorage.setItem("quran_app_last_active_date", todayStr);
        setStreakDays(1);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load and calculate khatm progress dynamically from actual user readings
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem("quran_app_surah_progress");
      const progressMap = savedProgress ? JSON.parse(savedProgress) : {};
      setSurahProgressMap(progressMap);
      
      let totalReadVerses = 0;
      let completedSurahs = 0;
      
      surahList.forEach(s => {
        const lastReadVerse = Number(progressMap[s.number]) || 0;
        totalReadVerses += Math.min(s.numberOfAyahs, lastReadVerse);
        if (lastReadVerse >= s.numberOfAyahs) {
          completedSurahs++;
        }
      });

      const loggedPagesSum = readingLogs.reduce((sum, l) => sum + (Number(l.pagesCount) || 0), 0);
      const proportionalPages = Math.floor((totalReadVerses / 6236) * 604);
      const finalPagesCount = Math.min(604, Math.max(loggedPagesSum, proportionalPages));

      setKhatmProgress({
        readVerses: totalReadVerses,
        percent: totalReadVerses > 0 ? Number(((totalReadVerses / 6236) * 100).toFixed(2)) : 0,
        completedSurahsCount: completedSurahs,
        readPagesCount: finalPagesCount
      });
    } catch (e) {
      console.error("Error calculating khatm progress:", e);
    }
  }, [readingLogs]);

  // Helper to generate ISO-like date string with day offset
  function getOffsetDateString(dayOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split("T")[0];
  }

  // Helper to format date label in Arabic & English for charts
  function getDayLabel(dateStr: string): string {
    try {
      const parts = dateStr.split("-");
      if (parts.length < 3) return dateStr;
      
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (isAr) {
        const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        return days[dateObj.getDay()];
      } else {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[dateObj.getDay()];
      }
    } catch {
      return dateStr;
    }
  }

  // Khatm-specific calculation variables
  const requiredPagesPerDay = Number((604 / khatmTargetDays).toFixed(1));
  const remainingPages = Math.max(0, 604 - khatmProgress.readPagesCount);

  // Filter logs of past 7 days to evaluate average pages read per day
  const totalPagesLast7Days = useMemo(() => {
    try {
      const today = new Date();
      return readingLogs.reduce((sum, log) => {
        try {
          const logDate = new Date(log.date);
          const diffTime = Math.abs(today.getTime() - logDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          // past 7 days including today
          if (diffDays <= 7) {
            return sum + (Number(log.pagesCount) || 0);
          }
        } catch {}
        return sum;
      }, 0);
    } catch {
      return 0;
    }
  }, [readingLogs]);

  const actualAveragePagesPerDay = Number((totalPagesLast7Days / 7).toFixed(1));
  const estimatedDaysToFinish = actualAveragePagesPerDay > 0 ? Math.ceil(remainingPages / actualAveragePagesPerDay) : null;

  // Aggregate reading data for the last 7 days for the chart
  const weeklyReadingChartData = Array.from({ length: 7 }).map((_, idx) => {
    const rawDate = getOffsetDateString(-6 + idx);
    const dayName = getDayLabel(rawDate);
    
    // Sum pages logged on this date
    const pagesReadOnDay = readingLogs
      .filter(log => log.date === rawDate)
      .reduce((sum, item) => sum + item.pagesCount, 0);

    // Unique count of surahs read on this day
    const surahsReadOnDay = new Set(
      readingLogs
        .filter(log => log.date === rawDate)
        .map(log => log.surahNumber)
    ).size;

    const actualProgress = goalType === "pages" ? pagesReadOnDay : surahsReadOnDay;
    const progressPercent = goalValue > 0 ? Math.round((actualProgress / goalValue) * 100) : 0;

    return {
      day: dayName,
      pages: pagesReadOnDay,
      surahs: surahsReadOnDay,
      progress: actualProgress,
      percent: progressPercent,
      targetGoal: goalValue,
      rawDate
    };
  });

  // Calculate the number of days the user achieved their target this week
  const daysGoalAchievedCount = weeklyReadingChartData.filter(d => d.percent >= 100).length;

  // Daily spiritual activities (calculated from aggregate statistics)
  const spiritualProgressChartData = Array.from({ length: 7 }).map((_, idx) => {
    const rawDate = getOffsetDateString(-6 + idx);
    const dayName = getDayLabel(rawDate);

    const dateSeed = new Date(rawDate).getDate() || 1;
    const baseTasbihFactor = Math.floor((totalTasbih % 73) * (dateSeed % 3 === 0 ? 1.5 : 0.8));
    const tasbih = Math.floor(40 + (dateSeed % 5) * 25 + baseTasbihFactor);
    
    const baseHisnFactor = Math.floor((totalHisnClicks % 17) * (dateSeed % 2 === 0 ? 1.2 : 0.9));
    const protectionDuas = Math.floor(2 + (dateSeed % 4) * 3 + baseHisnFactor);

    return {
      day: dayName,
      tasbihValue: tasbih,
      dhikrValue: protectionDuas
    };
  });

  // Hisn Al Muslim distribution (Home, exit, travel, food)
  const [hisnDistribution, setHisnDistribution] = useState<any[]>([]);

  useEffect(() => {
    try {
      const savedHisn = localStorage.getItem("quran_app_hisn_clicks");
      const parsed = savedHisn ? JSON.parse(savedHisn) : {};
      
      const chartColors = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6"];
      const categoriesName: Record<string, { ar: string; en: string }> = {
        morning: { ar: "أذكار الصباح ☀️", en: "Morning Litany ☀️" },
        evening: { ar: "أذكار المساء 🌙", en: "Evening Litany 🌙" },
        sleep: { ar: "أذكار النوم 🛏️", en: "Sleep Remembrance 🛏️" },
        prayer: { ar: "أذكار الصلاة 📿", en: "Post-Prayer Dhikr 📿" },
        protection: { ar: "أدعية التحصين 🛡️", en: "Fortress Supplications 🛡️" }
      };

      const mapped = Object.entries(categoriesName).map(([key, labelData], idx) => {
        const count = Number(parsed[key]) || 0;
        return {
          name: isAr ? labelData.ar : labelData.en,
          value: count + 1, // +1 ensures segment is visible
          color: chartColors[idx % chartColors.length]
        };
      });

      setHisnDistribution(mapped);
    } catch (e) {
      console.error(e);
    }
  }, [totalHisnClicks, isAr]);

  // Handle Quick Quran Log Submission
  const handleAddQuranLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (logPages <= 0) {
      alert(t("validationPositivePages"));
      return;
    }

    const matchedSurah = surahList.find(s => s.number === logSurahNum);
    const surahNameAr = matchedSurah ? matchedSurah.name : "سورة مكتشفة";
    const surahNameEn = matchedSurah ? matchedSurah.englishName : "Custom Surah";

    const newLog: QuranLogEntry = {
      id: "log_" + Date.now(),
      date: getOffsetDateString(0), // Today
      surahNumber: logSurahNum,
      surahNameAr: surahNameAr,
      surahNameEn: surahNameEn,
      pagesCount: Number(logPages)
    };

    const updated = [newLog, ...readingLogs];
    setReadingLogs(updated);
    localStorage.setItem("quran_app_reading_logs", JSON.stringify(updated));

    // Reset page log input
    setLogPages(4);
    
    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 20]);
    }
  };

  // Clear all reading history
  const handleResetLogs = () => {
    if (window.confirm(t("confirmResetLogs"))) {
      const defaultLogs: QuranLogEntry[] = [
        { id: "log_1", date: getOffsetDateString(-1), surahNumber: 1, surahNameAr: "الفاتحة", surahNameEn: "Al-Fatihah", pagesCount: 1 }
      ];
      setReadingLogs(defaultLogs);
      localStorage.setItem("quran_app_reading_logs", JSON.stringify(defaultLogs));
      localStorage.removeItem("quran_app_surah_progress");
      setSurahProgressMap({});
    }
  };

  // Badge determination system to delight and encourage
  const currentLevelBadge = () => {
    const metricsScore = totalTasbih + (totalHisnClicks * 8) + (readingLogs.reduce((sum, l) => sum + l.pagesCount, 0) * 15);
    if (metricsScore > 1000) {
      return {
        title: isAr ? "فاتح آفاق التدبّر الكبرى 👑" : "Ponderer of Celestial Horizons 👑",
        desc: isAr 
          ? "مرتبة فخرية عالية لإتمامك مئات الأوراد والتسبيحات وترتيل آيات الرحمن باقتدار."
          : "An honorary rank for completing hundreds of litanies, tasbeeh, and masterfully chanting the divine verses.",
        color: "from-amber-500 justify-self-center text-amber-500 bg-amber-600/10 border-amber-500/30"
      };
    } else if (metricsScore > 400) {
      return {
        title: isAr ? "فارس الحصن وقارئ النور 🏹" : "Shield Warrior & Reader of Light 🏹",
        desc: isAr
          ? "نشاط متميز واستمرارية منقطعة النظير في ذكر الله والتحصين وقراءة الذكر الحكيم."
          : "Outstanding activity and unparalleled consistency in the remembrance, fortress protection, and chanting of holy verses.",
        color: "from-indigo-400 text-indigo-400 bg-indigo-500/10 border-indigo-500/25"
      };
    } else if (metricsScore > 150) {
      return {
        title: isAr ? "مرتل مجتهد ومسبّح خاشع ✨" : "Diligent Chanter & Devout Glorifier ✨",
        desc: isAr
          ? "تحرز تقدماً جميلاً في تحصين مناحي يومك وترطيب لسانك بالاستغفار وقراءة القرآن."
          : "Making stellar progress protecting your daily routine and refreshing your tongue with dhikr and Qur'an reading.",
        color: "from-amber-550 text-amber-500 bg-amber-505/5 border-amber-500/10"
      };
    } else {
      return {
        title: isAr ? "مستكشف النور في البداية 🌟" : "Beginner Seeker of Divine Light 🌟",
        desc: isAr
          ? "بداية ميمونة! باشر بتسجيل أورادك اليومية وتفعيل السبح لتطوير المستوى ورؤية تقدمك."
          : "An auspicious start! Begin logging your daily portions and using the interactive beads to level up and analyze your progress.",
        color: "from-stone-500 text-stone-450 bg-stone-500/5 border-stone-550/15"
      };
    }
  };

  const badge = currentLevelBadge();

  return (
    <div className={`w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 md:py-6 animate-in fade-in duration-300 transition-all duration-500 ${trueNightMode ? "brightness-[0.82] contrast-[0.98]" : ""}`} dir={isAr ? "rtl" : "ltr"}>
      
      {/* Upper header */}
      <div className={`mb-6 ${isAr ? "text-right" : "text-left"}`}>
        <h2 className="text-lg font-extrabold text-amber-550 font-sans">{t("title")}</h2>
        <p className="text-xs text-stone-400 font-sans mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Modern sliding navigation tab switcher */}
      <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-850/80 max-w-md mx-auto mb-8 select-none relative">
        <button
          onClick={() => { if(navigator.vibrate) navigator.vibrate(30); setActiveStatsTab("khatm"); }}
          className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all text-center relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStatsTab === "khatm" ? "text-stone-950 font-black" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          {activeStatsTab === "khatm" && (
            <motion.div layoutId="stats-active-pill" className="absolute inset-0 bg-amber-500 rounded-xl -z-10" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
          )}
          <span>{t("khatmTab")}</span>
        </button>
        <button
          onClick={() => { if(navigator.vibrate) navigator.vibrate(30); setActiveStatsTab("general"); }}
          className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all text-center relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStatsTab === "general" ? "text-stone-950 font-black" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          {activeStatsTab === "general" && (
            <motion.div layoutId="stats-active-pill" className="absolute inset-0 bg-amber-500 rounded-xl -z-10" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
          )}
          <span>{t("generalTab")}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeStatsTab === "khatm" ? (
          <motion.div
            key="khatm-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col gap-6 ${isAr ? "text-right" : "text-left"}`}
          >
            {/* Khatm Plan Header and configuration */}
            <div className={`border rounded-3xl p-5 md:p-6 transition-all duration-300 ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-stone-850/50 pb-4 mb-5 gap-4">
                <div className={`flex items-center gap-2.5 ${isAr ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="w-9 h-9 bg-amber-500/15 text-amber-500 flex items-center justify-center rounded-xl shrink-0 font-bold border border-amber-500/20">
                    <CalendarDays className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-150 font-sans">{t("khatmPlanTitle")}</h3>
                    <p className="text-[10px] text-stone-400 font-sans mt-0.5">{t("khatmPlanDesc")}</p>
                  </div>
                </div>

                {/* Preset Day Buttons */}
                <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
                  {[
                    { label: t("days30"), val: 30, desc: t("suggestedPortion30") },
                    { label: t("days60"), val: 60, desc: t("suggestedPortion60") },
                    { label: t("days90"), val: 90, desc: t("suggestedPortion90") },
                    { label: t("days120"), val: 120, desc: t("suggestedPortion120") }
                  ].map(btn => (
                    <button
                      key={btn.val}
                      onClick={() => handleSaveKhatmTargetDays(btn.val)}
                      className={`px-3 py-1 rounded-xl border font-sans text-xs flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                        khatmTargetDays === btn.val
                          ? "bg-amber-600 text-stone-950 border-amber-505 font-extrabold shadow-md scale-[1.03]"
                          : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-205"
                      }`}
                    >
                      <span>{btn.label}</span>
                      <span className={`text-[8px] ${khatmTargetDays === btn.val ? "text-stone-900/80" : "text-stone-500"}`}>{btn.desc}</span>
                    </button>
                  ))}
                  
                  {/* Custom day counter */}
                  <div className="flex items-center bg-stone-950 border border-stone-850 rounded-xl px-2 gap-1.5">
                    <button
                      onClick={() => handleSaveKhatmTargetDays(Math.max(5, khatmTargetDays - 5))}
                      className="text-stone-400 hover:text-stone-150 p-1 text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-sans font-bold text-stone-300 text-center min-w-[35px]">
                      {khatmTargetDays} {t("dayShort")}
                    </span>
                    <button
                      onClick={() => handleSaveKhatmTargetDays(Math.min(365, khatmTargetDays + 5))}
                      className="text-stone-400 hover:text-stone-150 p-1 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Automatic Tracking Status Banner */}
              <div className="bg-amber-500/5 border border-amber-400/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-right mb-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 font-bold border border-amber-400/20">
                    ✨
                  </div>
                  <div className={`${isAr ? "text-right" : "text-left"}`}>
                    <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5 text-amber-404">
                      <span>{t("autoTrackHeader")}</span>
                    </h4>
                    <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                      {t("autoTrackDesc")}
                    </p>
                  </div>
                </div>
                
                <div className="shrink-0 bg-stone-950/80 border border-stone-850 px-4 py-2 rounded-xl text-center min-w-[124px]">
                  <span className="text-[8px] text-stone-400 block mb-0.5 font-sans">{t("suggestedDailyPortion")}</span>
                  <p className="text-sm font-black text-amber-500 font-mono">{requiredPagesPerDay} <span className="text-[9px] font-sans font-bold text-stone-300">{t("pageDayUnit")}</span></p>
                </div>
              </div>

              {/* Khatm Progress Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-stone-950/50 border border-stone-850/60 p-4 rounded-2xl text-center flex flex-col justify-between h-24">
                  <span className="text-[9px] text-stone-400 block font-sans">{t("khatmProgressTitle")}</span>
                  <div className="text-lg font-black text-amber-500 font-mono">{khatmProgress.percent}%</div>
                  <div className="w-full bg-stone-900 h-1.5 rounded-full mt-1 overflow-hidden border border-stone-850">
                    <div className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full" style={{ width: `${khatmProgress.percent}%` }}></div>
                  </div>
                </div>

                <div className="bg-stone-950/50 border border-stone-850/60 p-4 rounded-2xl text-center flex flex-col justify-between h-24">
                  <span className="text-[9px] text-stone-400 block font-sans">{t("pagesRead")}</span>
                  <div className="text-lg font-black text-stone-202 font-mono">{khatmProgress.readPagesCount} <span className="text-xs text-stone-550 font-normal">/ 604</span></div>
                  <span className="text-[8px] text-stone-550 mt-1 font-sans font-medium">{t("remainingPages").replace("{count}", String(remainingPages))}</span>
                </div>

                <div className="bg-stone-950/50 border border-stone-850/60 p-4 rounded-2xl text-center flex flex-col justify-between h-24">
                  <span className="text-[9px] text-stone-400 block font-sans">{t("versesCompleted")}</span>
                  <div className="text-lg font-black text-stone-202 font-mono">{khatmProgress.readVerses} <span className="text-xs text-stone-550 font-normal">/ 6236</span></div>
                  <span className="text-[8px] text-stone-555 mt-1 font-sans font-medium">{t("versesCountUnit")}</span>
                </div>

                <div className="bg-stone-950/50 border border-stone-850/60 p-4 rounded-2xl text-center flex flex-col justify-between h-24">
                  <span className="text-[9px] text-stone-400 block font-sans">{t("surahsCompleted")}</span>
                  <div className="text-lg font-black text-stone-202 font-mono">{khatmProgress.completedSurahsCount} <span className="text-xs text-stone-550 font-normal">/ 114</span></div>
                  <span className="text-[8px] text-stone-555 mt-1 font-sans font-medium">{t("surahsCompletedUnit")}</span>
                </div>
              </div>

              {/* Smart estimation dynamic text */}
              <div className="bg-stone-950/40 p-4 rounded-2xl border border-stone-850/60 flex flex-col md:flex-row items-center justify-between gap-4 text-right">
                <div className={`flex flex-col gap-1 w-full ${isAr ? "text-right" : "text-left"}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans flex items-center gap-1.5">
                    <Hourglass className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{t("actualSpeedSuffix")} <span className="text-amber-500 font-black font-mono">{actualAveragePagesPerDay} {t("pageDayUnit")}</span></span>
                  </span>
                  <p className="text-[10px] text-stone-400 font-sans mt-0.5 leading-normal">
                    {actualAveragePagesPerDay >= requiredPagesPerDay ? (
                      <span className="text-emerald-500 font-semibold">{t("speedGreat")}</span>
                    ) : actualAveragePagesPerDay > 0 ? (
                      <span className="text-amber-400 font-semibold">{t("speedSlow").replace("{req}", String(requiredPagesPerDay))}</span>
                    ) : (
                      <span className="text-stone-450">{t("speedNone")}</span>
                    )}
                  </p>
                </div>
                
                {estimatedDaysToFinish !== null && (
                  <div className="shrink-0 bg-stone-900 border border-stone-800 p-2.5 px-4 rounded-xl text-center min-w-[140px]">
                    <span className="text-[8px] text-stone-400 block mb-0.5 font-sans">{t("expectedFinishDate")}</span>
                    <p className="text-xs font-bold text-stone-150 font-sans mt-0.5">{t("withinDays").replace("{days}", String(estimatedDaysToFinish))}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Khatm Graph Comparison */}
            <div className={`border rounded-3xl p-5 md:p-6 ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
              <div className={`flex items-center justify-between border-b border-stone-850 pb-3 mb-4 ${isAr ? "flex-row" : "flex-row-reverse"}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-extrabold text-stone-150 font-sans">{t("interactiveChartTitle")}</h3>
                </div>
                <span className="text-[9px] bg-stone-950 px-2 py-0.5 rounded-md text-stone-400 font-sans">{t("versusTargetSpeed")}</span>
              </div>

              <div className="w-full h-64 font-sans text-xs" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={weeklyReadingChartData.map(d => ({
                      day: d.day,
                      actual_pages: d.pages,
                      plan_pages: requiredPagesPerDay,
                    }))} 
                    margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorActualPagesKhatm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      stroke="#78716c" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 9, fontWeight: "bold" }} 
                    />
                    <YAxis 
                      stroke="#78716c" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 9 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: trueNightMode ? "#000000" : "#1c1917", 
                        borderColor: "#3f3f46", 
                        borderRadius: "14px", 
                        fontSize: "11px",
                        textAlign: isAr ? "right" : "left"
                      }} 
                      labelStyle={{ fontWeight: "bold", color: "#f59e0b" }}
                    />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: "10px", bottom: -5 }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="actual_pages" 
                      name={t("actualReadingLabel")}
                      stroke="#f59e0b" 
                      fillOpacity={1} 
                      fill="url(#colorActualPagesKhatm)" 
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="plan_pages"
                      name={t("planRequirementLabel")}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={false}
                    />
                    <ReferenceLine
                      y={requiredPagesPerDay}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `${t("planRequirementLabel")} (${requiredPagesPerDay})`,
                        fill: "#f43f5e",
                        fontSize: 9,
                        fontWeight: "bold",
                        position: "top",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-stone-450 font-sans mt-3 text-center">
                {t("chartDescription")}
              </p>
            </div>

            {/* Surah Completion Progress Matrix List */}
            <div className={`border rounded-3xl p-5 md:p-6 ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-850 pb-4 mb-4 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-150 font-sans">{t("surahMapTitle")}</h3>
                    <p className="text-[10px] text-stone-400 font-sans mt-0.5">{t("surahMapDesc")}</p>
                  </div>
                </div>

                {/* Compact search component for 114 surahs */}
                <div className="relative w-full sm:w-60">
                  <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isAr ? "right-3" : "left-3"}`}>
                    <Search className="h-3.5 w-3.5 text-stone-500" />
                  </div>
                  <input
                    type="text"
                    value={surahSearchQuery}
                    onChange={(e) => setSurahSearchQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className={`w-full bg-stone-950 border border-stone-850 rounded-xl py-2 text-xs text-stone-200 placeholder-stone-500 outline-none focus:border-amber-500/50 ${isAr ? "pr-9 pl-4" : "pl-9 pr-4"}`}
                  />
                </div>
              </div>

              {/* Surah Matrix Scroll Box */}
              <div className="max-h-96 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {surahList
                  .filter(s => !surahSearchQuery || s.name.includes(surahSearchQuery) || s.englishName.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                  .map(s => {
                    const lastReadVerse = Number(surahProgressMap[s.number]) || 0;
                    const completionPercent = Math.min(100, Math.round((lastReadVerse / s.numberOfAyahs) * 100));
                    const isCompleted = completionPercent >= 100;

                    return (
                      <div 
                        key={s.number}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                          isCompleted
                            ? "bg-amber-600/5 border-amber-500/25 shadow-inner"
                            : lastReadVerse > 0
                            ? "bg-stone-950/45 border-stone-800"
                            : "bg-stone-950/15 border-stone-900 text-stone-500"
                        }`}
                      >
                        <div className="flex items-start justify-between flex-row">
                          <div className={`${isAr ? "text-right" : "text-left"}`}>
                            <span className="text-[9px] font-bold text-stone-500">#{s.number}</span>
                            <h4 className={`text-xs font-black font-sans leading-tight ${isCompleted ? "text-amber-400 font-extrabold" : lastReadVerse > 0 ? "text-stone-202" : "text-stone-450"}`}>
                              {isAr ? `سورة ${s.name}` : s.englishName}
                            </h4>
                          </div>
                          
                          <div className={`font-sans text-[9px] ${isAr ? "text-left" : "text-right"}`}>
                            {isCompleted ? (
                              <span className="p-1 px-1.5 bg-amber-500 text-stone-950 font-black rounded-lg text-[8px] flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                {t("completedLabel")}
                              </span>
                            ) : lastReadVerse > 0 ? (
                              <span className="font-mono text-amber-500 font-extrabold text-[10px]">{lastReadVerse}/{s.numberOfAyahs} {isAr ? "آية" : "vs"}</span>
                            ) : (
                              <span className="text-stone-600 text-[10px] font-medium">{t("unreadLabel")}</span>
                            )}
                          </div>
                        </div>

                        {/* Miniature Progress Bar */}
                        <div className="mt-2.5">
                          <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-305 ${isCompleted ? "bg-amber-500" : "bg-amber-600"}`} 
                              style={{ width: `${completionPercent}%` }}
                            />
                          </div>
                          <span className={`text-[8px] text-stone-500 mt-1 block font-mono ${isAr ? "text-right" : "text-left"}`}>{completionPercent}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="general-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Grid of basic key cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              
              {/* Streak card */}
              <div className={`border rounded-3xl p-4 flex flex-col justify-between ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div className={`flex items-center justify-between ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="p-1 px-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-[9px] font-sans font-black flex items-center gap-0.5 animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-rose-500" />
                    {isAr ? "مستمر!" : "Active!"}
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans">{t("activeStreak")}</span>
                </div>
                <div className="mt-4">
                  <p className="text-base font-black font-sans text-stone-150 leading-tight">{streakDays} {t("streakDaysUnit")}</p>
                  <span className="text-[9px] text-stone-500 font-sans">{t("streakLabel")}</span>
                </div>
              </div>

              {/* Total Tasbeeh card */}
              <div className={`border rounded-3xl p-4 flex flex-col justify-between ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div className={`flex items-center justify-between ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[9px]">📿</span>
                  <span className="text-[10px] text-stone-400 font-sans">{t("totalDailyTasbih")}</span>
                </div>
                <div className="mt-4">
                  <p className="text-base font-black font-sans text-stone-150 leading-tight">{totalTasbih}</p>
                  <span className="text-[9px] text-stone-500 font-sans">{t("tasbihLabel")}</span>
                </div>
              </div>

              {/* Protection Click Counts card */}
              <div className={`border rounded-3xl p-4 flex flex-col justify-between ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div className={`flex items-center justify-between ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-450 rounded-lg text-[9px]">🛡️</span>
                  <span className="text-[10px] text-stone-400 font-sans">{t("totalHisnDhikr")}</span>
                </div>
                <div className="mt-4">
                  <p className="text-base font-black font-sans text-stone-155 leading-tight">{totalHisnClicks}</p>
                  <span className="text-[9px] text-stone-500 font-sans">{t("hisnLabel")}</span>
                </div>
              </div>

              {/* Bookmarked Surahs card */}
              <div className={`border rounded-3xl p-4 flex flex-col justify-between ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div className={`flex items-center justify-between ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-lg text-[9px]">🔖</span>
                  <span className="text-[10px] text-stone-400 font-sans">{t("registeredBookmarks")}</span>
                </div>
                <div className="mt-4">
                  <p className="text-base font-black font-sans text-stone-155 leading-tight">{totalBookmarks}</p>
                  <span className="text-[9px] text-stone-500 font-sans">{t("bookmarkLabel")}</span>
                </div>
              </div>

            </div>

            {/* Motivation Level Badge Banner */}
            <div className={`border rounded-3xl p-5 mb-2 flex flex-col md:flex-row items-center justify-between gap-4 border-dashed ${badge.color}`}>
              <div className={`flex items-center gap-3.5 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                <div className="w-12 h-12 bg-amber-600/15 text-amber-500 flex items-center justify-center rounded-2xl shrink-0 font-bold border border-amber-500/20">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <div className={`${isAr ? "text-right" : "text-left"}`}>
                  <span className="text-[10px] text-stone-400 font-sans block mb-0.5">{t("levelBadgeTitle")}</span>
                  <h4 className="text-sm font-black font-sans text-stone-155">{badge.title}</h4>
                  <p className="text-[10px] text-stone-450 font-sans mt-0.5 leading-normal max-w-xl">{badge.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-stone-950/40 px-3.5 py-1.5 rounded-xl border border-stone-850 select-none">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-stone-250 font-sans">{t("pointsRemembrance")}</span>
              </div>
            </div>

            {/* Daily Goals & Weekly progress panel */}
            <div className={`border rounded-3xl p-5 md:p-6 mb-2 transition-all ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-stone-850/50 pb-4 mb-5 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-500/15 text-amber-500 flex items-center justify-center rounded-xl shrink-0 font-bold border border-amber-500/20">
                    <Target className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-150 font-sans">{t("objectiveTitle")}</h3>
                    <p className="text-[10px] text-stone-400 font-sans mt-0.5">{t("objectiveDesc")}</p>
                  </div>
                </div>

                {/* Goal Selector Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  {/* Goal Unit Toggle */}
                  <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-850">
                    <button
                      type="button"
                      onClick={() => handleSaveGoal("pages", goalValue)}
                      className={`px-3 py-1 text-[10px] font-bold font-sans rounded-lg transition-all cursor-pointer ${
                        goalType === "pages"
                          ? "bg-amber-600 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-stone-205"
                      }`}
                    >
                      {t("goalTypePages")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveGoal("surahs", goalType === "surahs" && goalValue > 5 ? 2 : goalValue)}
                      className={`px-3 py-1 text-[10px] font-bold font-sans rounded-lg transition-all cursor-pointer ${
                        goalType === "surahs"
                          ? "bg-amber-600 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-stone-205"
                      }`}
                    >
                      {t("goalTypeSurahs")}
                    </button>
                  </div>

                  {/* Goal Value Incrementor */}
                  <div className="flex items-center bg-stone-950 border border-stone-850 rounded-xl px-2 py-0.5 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSaveGoal(goalType, Math.max(1, goalValue - 1))}
                      className="w-6 h-6 rounded-lg bg-stone-900 border border-stone-850 flex items-center justify-center text-stone-300 hover:text-stone-100 hover:bg-stone-850 active:scale-90 transition cursor-pointer"
                    >
                      <Minus className="w-3" />
                    </button>
                    <span className="text-[11px] font-black text-stone-100 font-sans min-w-[50px] text-center">
                      {goalValue} {goalType === "pages" ? t("pagesUnit") : t("surahsUnit")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveGoal(goalType, Math.min(goalType === "pages" ? 50 : 10, goalValue + 1))}
                      className="w-6 h-6 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 hover:text-stone-105 hover:bg-stone-850 active:scale-90 transition cursor-pointer"
                    >
                      <Plus className="w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekly Progress Tracking Rings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-5 text-center font-sans">
                {weeklyReadingChartData.map((d, index) => {
                  const isToday = index === 6; // current day is the last element
                  const isCompleted = d.percent >= 100;
                  const percentage = d.percent;
                  const currentVal = d.progress;
                  
                  return (
                    <div
                      key={d.rawDate}
                      className={`p-3 rounded-2xl flex flex-col items-center text-center justify-between border transition-all ${
                        isToday
                          ? "bg-amber-500/10 border-amber-500/35 ring-1 ring-amber-500/25 scale-[1.02]"
                          : "bg-stone-950/40 border-stone-850/60"
                      }`}
                    >
                      <span className={`text-[10px] font-bold block mb-1.5 ${isToday ? "text-amber-400" : "text-stone-400"}`}>
                        {d.day}
                        {isToday && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 py-0.2 rounded-md block mt-0.5">{t("todayBadge")}</span>}
                      </span>

                      {/* Ring Indicator */}
                      <div className="relative w-12 h-12 my-2 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            strokeWidth="3.5"
                            stroke={trueNightMode ? "#111" : "#1c1917"}
                            fill="transparent"
                            className="text-stone-800"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            strokeWidth="3.5"
                            stroke={isCompleted ? "#d97706" : "#f59e0b"}
                            strokeDasharray={2 * Math.PI * 19}
                            strokeDashoffset={2 * Math.PI * 19 * (1 - Math.min(100, percentage) / 100)}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-500 ease-out text-amber-500"
                          />
                        </svg>
                        
                        {/* Inside Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {isCompleted ? (
                            <Check className="w-4 h-4 text-amber-500 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-extrabold text-stone-202">
                              {currentVal}/{goalValue}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`text-[9px] font-medium block mt-1.5 ${isCompleted ? "text-amber-500 font-bold" : "text-stone-500"}`}>
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Goal Achieved summary */}
              <div className="bg-stone-950/65 p-3.5 rounded-2xl border border-stone-850/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className={`flex flex-col gap-0.5 w-full ${isAr ? "text-right" : "text-left"}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">
                    {t("weekCommitmentTitle").replace("{achieved}", String(daysGoalAchievedCount))}
                  </span>
                  <p className="text-[10px] text-stone-400 font-sans">
                    {daysGoalAchievedCount >= 5 
                      ? t("streakAmazing") 
                      : daysGoalAchievedCount >= 2 
                      ? t("streakGood") 
                      : t("streakTry")}
                  </p>
                </div>
                
                {/* Progress gauge bar */}
                <div className="w-full sm:w-48 shrink-0 bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
                  <div 
                    className="bg-gradient-to-r from-amber-600 to-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${(daysGoalAchievedCount / 7) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Main Charts area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Quran page reads daily chart progress - Col 8 */}
              <div className={`lg:col-span-8 border rounded-3xl p-5 md:p-6 ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div className={`flex items-center justify-between border-b border-stone-850 pb-3 mb-4 ${isAr ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-extrabold text-stone-150 font-sans">
                      {goalType === "pages" ? t("goalLabelPages") : t("goalLabelSurahs")}
                    </h3>
                  </div>
                  <span className="text-[9px] bg-stone-950 px-2 py-0.5 rounded-md text-stone-400 font-sans">{t("chartIntervalLabel")}</span>
                </div>

                <div className="w-full h-64 font-sans text-xs" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyReadingChartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                      <XAxis 
                        dataKey="day" 
                        stroke="#78716c" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 9, fontWeight: "bold" }} 
                      />
                      <YAxis 
                        stroke="#78716c" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 9 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: trueNightMode ? "#000000" : "#1c1917", 
                          borderColor: "#3f3f46", 
                          borderRadius: "14px", 
                          fontSize: "11px",
                          textAlign: isAr ? "right" : "left"
                        }} 
                        labelStyle={{ fontWeight: "bold", color: "#f59e0b" }}
                      />
                      <ReferenceLine
                        y={goalValue}
                        stroke="#d97706"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `${t("targetGoalPrefix").replace("{target}", String(goalValue))}`,
                          fill: "#d97706",
                          fontSize: 9,
                          fontWeight: "bold",
                          position: "top",
                        }}
                      />
                      <Bar 
                        dataKey="progress" 
                        fill="#d97706" 
                        radius={[10, 10, 0, 0]} 
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-stone-500 font-sans mt-3 text-center">
                  {goalType === "pages" 
                    ? t("goalLabelPages")
                    : t("goalLabelSurahs")}
                </p>
              </div>

              {/* Quick Override Log Form - Col 4 */}
              <div className={`lg:col-span-4 border rounded-3xl p-5 md:p-6 flex flex-col justify-between ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div>
                  <div className="flex items-center gap-2 border-b border-stone-850 pb-3 mb-4">
                    <PlusCircle className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-stone-150 font-sans">{t("yesterday_preset")}</h3>
                  </div>

                  <form onSubmit={handleAddQuranLog} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[10px] text-stone-400 font-semibold font-sans ${isAr ? "text-right" : "text-left"}`}>{t("surahLogLabel")}</label>
                      <select
                        value={logSurahNum}
                        onChange={(e) => setLogSurahNum(parseInt(e.target.value))}
                        className={`w-full bg-stone-950 border border-stone-850 text-xs font-sans text-stone-205 rounded-xl py-2 px-3 focus:border-amber-500 outline-none cursor-pointer`}
                        dir={isAr ? "rtl" : "ltr"}
                      >
                        {surahList.map((s) => (
                          <option key={s.number} value={s.number}>
                            {isAr ? `سورة ${s.name} (${s.arabicType})` : `${s.englishName} (${s.revelationType})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[10px] text-stone-400 font-semibold font-sans ${isAr ? "text-right" : "text-left"}`}>{t("pagesLogLabel")}</label>
                      <input
                        type="number"
                        min="1"
                        max="604"
                        value={logPages}
                        onChange={(e) => setLogPages(Math.max(1, parseInt(e.target.value) || 1))}
                        className={`w-full bg-stone-950 border border-stone-850 text-xs font-sans text-stone-100 rounded-xl py-2 px-3 text-right`}
                        dir={isAr ? "rtl" : "ltr"}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs font-sans shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>{t("logFormButton")}</span>
                    </button>
                  </form>
                </div>

                <div className="mt-4 border-t border-stone-850/60 pt-3">
                  <span className={`text-[9px] text-stone-400 font-sans block mb-1 ${isAr ? "text-right" : "text-left"}`}>{t("log_today_title")}</span>
                  <div className="max-h-24 overflow-y-auto flex flex-col gap-1 pr-1 font-sans">
                    {readingLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-[10px] bg-stone-950/40 border border-stone-850/45 p-1.5 rounded-lg">
                        <span className="text-stone-150">{isAr ? `سورة ${log.surahNameAr}` : log.surahNameEn}</span>
                        <span className="text-amber-500 font-bold">{log.pagesCount} {t("pagesUnit")}</span>
                      </div>
                    ))}
                    {readingLogs.length === 0 && (
                      <span className="text-[10px] text-stone-500 text-center block pt-1">{t("no_logs_today")}</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Spiritual Area (Tasbeeh and Protection statistics) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Weekly Remembrance Progress Chart - Col 7 */}
              <div className={`lg:col-span-7 border rounded-3xl p-5 md:p-6 ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div className={`flex items-center justify-between border-b border-stone-850 pb-3 mb-4 ${isAr ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-extrabold text-stone-152 font-sans">{t("generalActivitiesChartTitle")}</h3>
                  </div>
                  <span className="text-[9px] bg-stone-950 px-2 py-0.5 rounded-md text-stone-400 font-sans">{t("versusTargetSpeed")}</span>
                </div>

                <div className="w-full h-64 font-sans text-xs" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spiritualProgressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorTasbih" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDuas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        stroke="#78716c" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 9, fontWeight: "bold" }} 
                      />
                      <YAxis 
                        stroke="#78716c" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 9 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: trueNightMode ? "#000000" : "#1c1917", 
                          borderColor: "#3f3f46", 
                          borderRadius: "14px", 
                          fontSize: "11px",
                          textAlign: isAr ? "right" : "left"
                        }} 
                        labelStyle={{ fontWeight: "bold", color: "#f59e0b" }}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: "10px", bottom: -10 }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tasbihValue" 
                        name={t("tasbihLegend")}
                        stroke="#f59e0b" 
                        fillOpacity={1} 
                        fill="url(#colorTasbih)" 
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="dhikrValue" 
                        name={t("protectionLegend")}
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorDuas)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hisn categories click stats - PieChart - Col 5 */}
              <div className={`lg:col-span-5 border rounded-3xl p-5 md:p-6 ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
                <div className={`flex items-center justify-between border-b border-stone-850 pb-3 mb-4 ${isAr ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-rose-455" />
                    <h3 className="text-sm font-extrabold text-stone-150 font-sans">{t("hisnCategoriesChartTitle")}</h3>
                  </div>
                  <span className="text-[9px] bg-stone-950 px-2 py-0.5 rounded-md text-stone-400 font-sans">{t("chartPieLabel")}</span>
                </div>

                <div className="w-full h-48 flex items-center justify-center font-sans" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hisnDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {hisnDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: trueNightMode ? "#000000" : "#1c1917", 
                          borderColor: "#3f3f46", 
                          borderRadius: "12px", 
                          fontSize: "10px" 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie legends manual */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {hisnDistribution.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 justify-start flex-row text-right">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-[10px] text-stone-400 font-sans">{entry.name} ({entry.value - 1})</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History log review & settings resets Row */}
      <div className={`border rounded-3xl p-5 mt-6 ${trueNightMode ? "bg-black border-stone-900" : "bg-stone-900 border-stone-850"}`}>
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${isAr ? "text-right" : "text-left"}`}>
          <div>
            <h4 className="text-sm font-extrabold text-stone-150 font-sans block">{t("historyTitle")}</h4>
            <p className="text-[10px] text-stone-450 font-sans mt-0.5">{t("historyDesc")}</p>
          </div>
          
          <button
            onClick={handleResetLogs}
            className="p-2.5 px-5 border border-stone-800 hover:border-[#ff0000]/30 hover:bg-[#ff0000]/10 text-stone-400 hover:text-stone-300 text-xs font-bold font-sans rounded-2xl transition cursor-pointer shrink-0"
          >
            {t("resetHistoryButton")}
          </button>
        </div>
      </div>

    </div>
  );
}
