import React from "react";
import { X, Settings, Check, Eye, Volume2, Type, RefreshCw, HeartHandshake, Bell, Clock, Scale, Shield, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { GlobalSettings } from "../types";
import { translations, getTranslation } from "../utils/translations";
import { playSpiritualChime } from "../utils/sound";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  onUpdateSettings: (newSettings: Partial<GlobalSettings>) => void;
  onOpenCompliance?: () => void;
}

export default function UserSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenCompliance,
}: UserSettingsModalProps) {
  if (!isOpen) return null;

  const currentLang = settings.language || 'ar';
  const isAr = currentLang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const textAlignment = isAr ? 'text-right' : 'text-left';

  const t = (key: keyof typeof translations['ar']) => {
    return getTranslation(currentLang, key);
  };

  const safeSpeak = (text: string, lang: 'ar-SA' | 'en-US') => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    // Execute asynchronously to ensure state changes are instant and zero-blocking
    setTimeout(() => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onerror = (e) => {
          console.warn("SpeechSynthesis error:", e);
        };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("SpeechSynthesis failed:", err);
      }
    }, 0);
  };

  const handleReset = () => {
    onUpdateSettings({
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
      autoScrollSelected: false
    });
    
    const speechMsg = isAr ? "تم إعادة تعيين الإعدادات للافتراضيات بنجاح" : "Settings restored to defaults successfully";
    safeSpeak(speechMsg, isAr ? "ar-SA" : "en-US");
  };

  const toggleSetting = (key: keyof GlobalSettings) => {
    const newValue = !settings[key];
    onUpdateSettings({ [key]: newValue });

    const shouldSpeak = settings.voiceHints || (key === 'voiceHints' && newValue);
    if (shouldSpeak) {
      let label = "";
      if (isAr) {
        switch (key) {
          case 'simpleFont': label = newValue ? "تم تفعيل الخط الميسر البسيط" : "تم إلغاء تفعيل الخط الميسر البسيط"; break;
          case 'dyslexiaSpacing': label = newValue ? "تم تفعيل تباعد الأسطر المريح" : "تم إلغاء تباعد الأسطر المريح"; break;
          case 'reducedMotion': label = newValue ? "تم تفعيل وضع تقليل الحركة والوميض" : "تم إلغاء تقلي الحركة"; break;
          case 'highlightActive': label = newValue ? "تم تفعيل التظليل البارز للآية النشطة" : "تم إلغاء تفعيل التظليل البارز"; break;
          case 'trueNightMode': label = newValue ? "تم تفعيل الوضع الليلي الحقيقي لحماية العين" : "تم إلغاء تفعيل الوضع الليلي"; break;
          case 'voiceHints': label = newValue ? "تم تشغيل المساعد الصوتي الإرشادي" : "تم إيقاف المساعد الصوتي"; break;
          case 'autoPlayNextVerse': label = newValue ? "تم تشغيل التلاوة التلقائية المتتالية للآيات" : "تم إيقاف التلاوة المتتالية"; break;
          case 'autoShowTafsir': label = newValue ? "تم تشغيل العرض التلقائي للتفسير الميسر" : "تم إيقاف العرض التلقائي للتفسير"; break;
          case 'autoScrollSelected': label = newValue ? "تم تشغيل التمرير التلقائي الذكي عند القراءة" : "تم إيقاف التمرير التلقائي"; break;
        }
      } else {
        switch (key) {
          case 'simpleFont': label = newValue ? "Simplified font enabled" : "Simplified font disabled"; break;
          case 'dyslexiaSpacing': label = newValue ? "Generous spacing enabled" : "Generous spacing disabled"; break;
          case 'reducedMotion': label = newValue ? "Reduced motion enabled" : "Reduced motion disabled"; break;
          case 'highlightActive': label = newValue ? "Active highlight enabled" : "Active highlight disabled"; break;
          case 'trueNightMode': label = newValue ? "True night mode activated" : "True night mode deactivated"; break;
          case 'voiceHints': label = newValue ? "Speech assistance enabled" : "Speech assistance disabled"; break;
          case 'autoPlayNextVerse': label = newValue ? "Continuous autoplay recitation enabled" : "Continuous autoplay recitation disabled"; break;
          case 'autoShowTafsir': label = newValue ? "Instant Tafsir translation enabled" : "Instant Tafsir translation disabled"; break;
          case 'autoScrollSelected': label = newValue ? "Auto scroll centered mode enabled" : "Auto scroll centered mode disabled"; break;
        }
      }
      if (label) {
        safeSpeak(label, isAr ? "ar-SA" : "en-US");
      }
    }
  };

  const handleReminderToggle = (enabled: boolean) => {
    onUpdateSettings({ reminderEnabled: enabled });
    
    if (enabled && typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "default") {
          Notification.requestPermission().then(permission => {
            const speech = isAr 
              ? (permission === "granted" ? "تم تفعيل إشعارات الورد بنجاح" : "لم يتم منح إذن الإشعارات")
              : (permission === "granted" ? "Daily reminders enabled successfully" : "Notification permission was not granted");
            safeSpeak(speech, isAr ? "ar-SA" : "en-US");
          });
          return;
        }
      } catch (err) {
        console.warn("Could not request notification permission asynchronously:", err);
      }
    }

    const speech = isAr 
      ? (enabled ? "تم تشغيل تذكير الورد اليومي" : "تم تعطيل تذكير الورد اليومي")
      : (enabled ? "Daily reminders turned on" : "Daily reminders turned off");
    
    safeSpeak(speech, isAr ? "ar-SA" : "en-US");
  };

  const handleReminderTimeChange = (time: string) => {
    onUpdateSettings({ reminderTime: time });
    const speech = isAr 
      ? `تم تعديل موعد التذكير إلى الساعة ${time}`
      : `Reminder time updated to ${time}`;
    safeSpeak(speech, isAr ? "ar-SA" : "en-US");
  };

  const triggerTestNotification = async () => {
    if (typeof window === "undefined") return;

    // Play the spiritual sound chime first to guarantee audible feedback
    playSpiritualChime();

    if (!("Notification" in window)) {
      const speech = isAr ? "نأسف، إشعارات النظام غير مدعومة في جهازك" : "Sorry, system notifications are not supported on your device";
      safeSpeak(speech, isAr ? "ar-SA" : "en-US");
      alert(speech);
      return;
    }

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        const title = isAr ? "🔔 ورد التلاوة اليومي" : "🔔 Daily Recitation Reminder";
        const body = isAr 
          ? "تنبيه غالي: حان الآن موعد تلاوتكم اليومية لآيات التنزيل الحكيم." 
          : "Blessed reminder: It is time for your daily Al-Quran recitation portions.";
        
        const notif = new Notification(title, {
          body,
          icon: "/icon.png",
          tag: "quran-test-reminder"
        });
        notif.onclick = () => {
          window.focus();
        };

        const speech = isAr ? "تم إرسال إشعار تجريبي بنجاح" : "A sample notification has been sent successfully";
        safeSpeak(speech, isAr ? "ar-SA" : "en-US");
      } else {
        const speech = isAr 
          ? "تم رفض الإذن. يرجى تفعيل إشعارات الموقع من إعدادات المتصفح." 
          : "Permission denied. Please activate site notifications in browser settings.";
        safeSpeak(speech, isAr ? "ar-SA" : "en-US");
        alert(speech);
      }
    } catch (err) {
      console.warn("Test notification failed:", err);
      const speech = isAr ? "حدثت مشكلة أثناء محاولة إرسال إشعار" : "An error occurred while launching alert";
      safeSpeak(speech, isAr ? "ar-SA" : "en-US");
      alert(speech);
    }
  };

  const handleFontScaleChange = (scale: GlobalSettings['fontScale']) => {
    onUpdateSettings({ fontScale: scale });
    
    if (settings.voiceHints) {
      let label = "";
      if (isAr) {
        if (scale === 'normal') label = "تم ضبط مقياس خط التطبيق إلى الحجم الطبيعي";
        else if (scale === 'large') label = "تم تكبير الخطوط والرموز إلى الحجم الكبير";
        else if (scale === 'extra-large') label = "تم تكبير الخطوط بشكل كامل إلى المقياس الضخم لسهولة التعرف البصري";
      } else {
        label = `Font scale adjusted to ${scale}`;
      }

      if (label) {
        safeSpeak(label, isAr ? "ar-SA" : "en-US");
      }
    }
  };

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    onUpdateSettings({ language: lang });
    const label = lang === 'ar' ? "تم تحويل لغة واجهة التطبيق إلى اللغة العربية" : "Application interface switched to English successfully";
    safeSpeak(label, lang === 'ar' ? "ar-SA" : "en-US");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-stone-900 border border-stone-850 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        dir={dir}
      >
        {/* Modal Header */}
        <div className="border-b border-stone-850 px-5 py-4 bg-stone-920 flex items-center justify-between flex-row">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Settings className="w-4 h-4" />
            </div>
            <div className={textAlignment}>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-100 font-sans">{t('accessibilityModalHeader')}</h2>
              <p className="text-[10px] text-stone-400 font-sans">{t('accessibilityModalSub')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className={`p-5 sm:p-6 overflow-y-auto flex flex-col gap-6 ${textAlignment} select-none`}>
          
          {/* Welcome Assistive Badge */}
          <div className="bg-amber-600/5 border border-amber-500/15 p-3.5 rounded-2xl flex items-start gap-3 flex-row">
            <HeartHandshake className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className={textAlignment}>
              <h4 className="text-xs font-bold text-amber-500 font-sans">{t('accessibilityAssistiveBadgeTitle')}</h4>
              <p className="text-[11px] text-stone-300 font-sans mt-0.5 leading-relaxed">
                {t('accessibilityAssistiveBadgeBody')}
              </p>
            </div>
          </div>

          {/* Section 0: Application Language Support (EXCLUDING QURAN) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500 font-sans flex items-center gap-1.5 pb-2 border-b border-stone-800">
              <span>{t('accessibilityLangTitle')}</span>
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                {t('accessibilityLangDesc')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                {[
                  { id: 'ar', label: 'العربية (Arabic)', sub: 'واجهة باللغة العربية' },
                  { id: 'en', label: 'English', sub: 'Latin Interface Translation' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id as 'ar' | 'en')}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between items-start h-16 ${
                      settings.language === lang.id 
                        ? "bg-amber-600/10 border-amber-500/40 text-amber-400" 
                        : "bg-stone-920 border-stone-850 hover:bg-stone-800 text-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full flex-row">
                      <span className="text-[11px] font-bold font-sans">{lang.label}</span>
                      {settings.language === lang.id && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <span className="text-[9px] text-stone-500 font-sans mt-1">{lang.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Daily Quran Portion & Reminder Scheduler */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500 font-sans flex items-center gap-1.5 pb-2 border-b border-stone-800">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{t('accessibilitySectionReminder')}</span>
            </h3>

            <div className="flex flex-col gap-4 bg-stone-920/40 p-4 rounded-2xl border border-stone-850">
              {/* Toggler */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-[11px] sm:text-xs font-bold text-stone-200 font-sans">
                    {t('accessibilityReminderTitle')}
                  </h4>
                  <p className="text-[10px] text-stone-400 font-sans leading-relaxed mt-0.5 text-balance">
                    {t('accessibilityReminderDesc')}
                  </p>
                </div>
                <button
                  onClick={() => handleReminderToggle(!settings.reminderEnabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.reminderEnabled ? "bg-amber-500" : "bg-stone-700"
                  }`}
                  role="switch"
                  aria-checked={settings.reminderEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow ring-0 transition duration-200 ease-in-out ${
                      settings.reminderEnabled 
                        ? (isAr ? "-translate-x-5" : "translate-x-5") 
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {settings.reminderEnabled && (
                <div className="border-t border-stone-850 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-stone-300 font-sans">
                      {t('accessibilityReminderTimeLabel')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-row">
                    <input
                      type="time"
                      value={settings.reminderTime || "20:00"}
                      onChange={(e) => handleReminderTimeChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-850 text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500 w-28 text-center cursor-pointer"
                    />

                    <button
                      onClick={() => playSpiritualChime()}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-600/15 border border-amber-500/25 hover:bg-amber-600 hover:text-stone-950 text-amber-500 text-[10px] font-black font-sans transition cursor-pointer flex items-center gap-1 active:scale-95"
                      title={isAr ? "تشغيل صوت التنبيه الهادئ" : "Test spiritual chime sound"}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isAr ? "صوت التنبيه" : "Chime"}</span>
                    </button>

                    <button
                      onClick={triggerTestNotification}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-850 text-stone-300 text-[10px] font-bold font-sans transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>{t('accessibilityReminderBtnTest')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Support status badges */}
              <div className="flex flex-wrap items-center gap-2 border-t border-stone-850/65 pt-2.5 text-[9px] font-medium font-sans">
                <span className="text-stone-500">{t('accessibilityReminderNotifState')}</span>
                {typeof window !== "undefined" && "Notification" in window ? (
                  Notification.permission === "granted" ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
                      {t('accessibilityReminderPermGranted')}
                    </span>
                  ) : Notification.permission === "denied" ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/15" title={t('accessibilityReminderPermDenied')}>
                      {t('accessibilityReminderPermDenied')}
                    </span>
                  ) : (
                    <button
                      onClick={triggerTestNotification}
                      className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/15 hover:bg-amber-500/20 transition cursor-pointer"
                    >
                      {t('accessibilityReminderPermRequest')}
                    </button>
                  )
                ) : (
                  <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-500 border border-stone-850">
                    {t('accessibilityReminderUnsupported')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Font scaling & Readability tools */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500 font-sans flex items-center gap-1.5 pb-2 border-b border-stone-800">
              <Type className="w-4 h-4 text-amber-500" />
              <span>{t('accessibilitySectionFont')}</span>
            </h3>

            {/* General scale */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-stone-400 font-bold font-sans">{t('accessibilityFontScaleTitle')}</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {[
                  { id: 'normal', label: t('accessibilityScales').normal, desc: t('accessibilityScales').normalDesc },
                  { id: 'large', label: t('accessibilityScales').large, desc: t('accessibilityScales').largeDesc },
                  { id: 'extra-large', label: t('accessibilityScales')['extra-large'], desc: t('accessibilityScales').extraLargeDesc }
                ].map((scale) => (
                  <button
                    key={scale.id}
                    onClick={() => handleFontScaleChange(scale.id as GlobalSettings['fontScale'])}
                    className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between items-start h-16 ${
                      settings.fontScale === scale.id 
                        ? "bg-amber-600/10 border-amber-500/40 text-amber-400" 
                        : "bg-stone-920 border-stone-850 hover:bg-stone-800 text-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full flex-row">
                      <span className="text-[11px] font-bold font-sans text-ellipsis overflow-hidden whitespace-nowrap">{scale.label}</span>
                      {settings.fontScale === scale.id && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <span className="text-[9px] text-stone-500 font-sans mt-1 line-clamp-1 leading-none">{scale.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assisted toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              
              {/* Legible/Simple Font */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-2 h-auto justify-between">
                <div className="flex items-center justify-between w-full flex-row">
                  <div className={`flex flex-col ${textAlignment}`}>
                    <span className="text-xs font-bold text-stone-200 font-sans">{t('accessibilitySimpleFontTitle')}</span>
                    <span className="text-[9px] text-stone-500 font-sans leading-relaxed mt-1">
                      {t('accessibilitySimpleFontDesc')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('simpleFont')}
                  className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.simpleFont 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.simpleFont ? t('accessibilitySimpleFontBtnOn') : t('accessibilitySimpleFontBtnOff')}
                </button>
              </div>

              {/* Dyslexia Spacing spacing */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-2 h-auto justify-between">
                <div className="flex items-center justify-between w-full flex-row">
                  <div className={`flex flex-col ${textAlignment}`}>
                    <span className="text-xs font-bold text-stone-200 font-sans">{t('accessibilityDyslexiaSpacingTitle')}</span>
                    <span className="text-[9px] text-stone-500 font-sans leading-relaxed mt-1">
                      {t('accessibilityDyslexiaSpacingDesc')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('dyslexiaSpacing')}
                  className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.dyslexiaSpacing 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.dyslexiaSpacing ? t('accessibilityDyslexiaSpacingBtnOn') : t('accessibilityDyslexiaSpacingBtnOff')}
                </button>
              </div>

            </div>

          </div>

          {/* Section 3: Visual & Audio aids */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500 font-sans flex items-center gap-1.5 pb-2 border-b border-stone-800">
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>{t('accessibilitySectionSensory')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Highlight Active Verse */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">{t('accessibilityHighlightTitle')}</span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {t('accessibilityHighlightDesc')}
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting('highlightActive')}
                  className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.highlightActive 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.highlightActive ? t('accessibilityHighlightBtnOn') : t('accessibilityHighlightBtnOff')}
                </button>
              </div>

              {/* Reduced Visual Motion */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">{t('accessibilityReducedMotionTitle')}</span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {t('accessibilityReducedMotionDesc')}
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting('reducedMotion')}
                  className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.reducedMotion 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.reducedMotion ? t('accessibilityReducedMotionBtnOn') : t('accessibilityReducedMotionBtnOff')}
                </button>
              </div>

              {/* True Night Mode */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">{t('accessibilityTrueNightTitle')}</span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {t('accessibilityTrueNightDesc')}
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting('trueNightMode')}
                  className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.trueNightMode 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.trueNightMode ? t('accessibilityTrueNightBtnOn') : t('accessibilityTrueNightBtnOff')}
                </button>
              </div>

              {/* Interactive Audio Speech/Voice Hints for Blind/Visually impaired */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">{t('accessibilityVoiceHintsTitle')}</span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {t('accessibilityVoiceHintsDesc')}
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting('voiceHints')}
                  className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.voiceHints 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.voiceHints ? t('accessibilityVoiceHintsBtnOn') : t('accessibilityVoiceHintsBtnOff')}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3.5: Advanced Recitation & Reader Tools (الأدوات التفاعلية المفيدة) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500 font-sans flex items-center gap-1.5 pb-2 border-b border-stone-800">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isAr ? "الأدوات التفاعلية المفيدة" : "Useful Interactive Tools"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Autoplay Next Verse */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">
                    {isAr ? "التلاوة المتتالية التلقائية" : "Continuous Recitation Autoplay"}
                  </span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {isAr 
                      ? "تشغيل الآية التالية تلقائياً فور انتهاء تلاوة الآية الحالية للمتابعة دون انقطاع."
                      : "Automatically advance and play the next verse audio once the current one finishes."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('autoPlayNextVerse')}
                  className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.autoPlayNextVerse 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.autoPlayNextVerse 
                    ? (isAr ? "مفعّل ✓" : "Enabled ✓") 
                    : (isAr ? "معطّل" : "Disabled")}
                </button>
              </div>

              {/* Auto Scroll Centered */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">
                    {isAr ? "التمركز التمريري التلقائي" : "Centered Auto-Scroll Spy"}
                  </span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {isAr 
                      ? "تمرير وتوسيط الآية النشطة تلقائياً داخل لوحة القراءة لتسهل تتبع التلاوة على الأجهزة واللوحيات."
                      : "Automatically auto-scrolle and center the active reciting verse smoothly to assist reading hands-free."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('autoScrollSelected')}
                  className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.autoScrollSelected 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.autoScrollSelected 
                    ? (isAr ? "مفعّل ✓" : "Enabled ✓") 
                    : (isAr ? "معطّل" : "Disabled")}
                </button>
              </div>

              {/* Auto Show Tafsir */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">
                    {isAr ? "العرض التلقائي السريع للتفسير" : "Auto-Show Tafsir on Click"}
                  </span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {isAr 
                      ? "عرض تفسير الآية ونقاط التدبر تلقائياً فور اختيارك للآية في التصفح لتسهل التدبر الشامل ومطالعة معانيها."
                      : "Display the explanatory Tafsir immediately when a verse is tapped to increase reflection."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('autoShowTafsir')}
                  className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                    settings.autoShowTafsir 
                      ? "bg-amber-600/15 border-amber-500/35 text-amber-400" 
                      : "bg-stone-900 border-stone-800 hover:bg-stone-850 text-stone-400"
                  }`}
                >
                  {settings.autoShowTafsir 
                    ? (isAr ? "مفعّل ✓" : "Enabled ✓") 
                    : (isAr ? "معطّل" : "Disabled")}
                </button>
              </div>

              {/* Daily Target Pages Habit */}
              <div className="bg-stone-920 border border-stone-850 rounded-xl p-3 flex flex-col gap-1 h-auto justify-between">
                <div className={`flex flex-col ${textAlignment}`}>
                  <span className="text-xs font-bold text-stone-200 font-sans">
                    {isAr ? "الورد والهدف القرآني اليومي" : "Daily Quran Pages Target"}
                  </span>
                  <p className="text-[9px] text-stone-500 font-sans mt-1 leading-relaxed">
                    {isAr 
                      ? "حدد هدف عدد الصفحات التي تنوي تلاوتها يومياً لتشجيع الاستمرارية وبناء الورد اليومي."
                      : "Define your preferred daily pages targets to build a consistent habit streak easily."}
                  </p>
                </div>
                
                <div className="grid grid-cols-4 gap-1 mt-3">
                  {[1, 5, 10, 20].map((pages) => (
                    <button
                      key={pages}
                      type="button"
                      onClick={() => onUpdateSettings({ dailyTargetPages: pages })}
                      className={`py-1 rounded-lg text-[10px] font-bold font-sans border transition cursor-pointer ${
                        settings.dailyTargetPages === pages
                          ? "bg-amber-600/25 border-amber-500/50 text-amber-400"
                          : "bg-stone-900 border-stone-850 hover:bg-stone-800 text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      {pages} {isAr ? "صفحة" : "p."}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: Regulatory Legal Compliance & Privacy - SUPER RICH DISPLAY */}
          <div className="flex flex-col gap-3 mt-2 pr-0.5 text-right" dir={dir}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 font-sans flex items-center gap-1.5 pb-1.5 border-b border-stone-800">
              <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{isAr ? "الامتثال التنظيمي وقانون الخصوصية الأردني" : "Regulatory Compliance & Jordan Privacy Laws"}</span>
            </h3>

            <div className="bg-emerald-600/5 border border-emerald-500/15 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex items-start gap-2.5 flex-row">
                <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className={textAlignment}>
                  <h4 className="text-[11px] sm:text-xs font-extrabold text-stone-200 font-sans">
                    {isAr ? "ضمانات حماية البيانات والخصوصية الرقمية" : "Data Protection & Digital Trust Guarantees"}
                  </h4>
                  <p className="text-[10px] text-stone-400 font-sans leading-relaxed mt-1 text-balance">
                    {isAr 
                      ? "الموقع ممتثل بالكامل للمادة (4) والمادة (10) من قانون حماية البيانات الشخصية الأردني رقم 24 لسنة 2023. تتم معالجة بياناتك الصوتية محلياً وتخزين تفضيلاتك في ذاكرة جهازك الآمنة دون رفعها لخوادم خارجية."
                      : "The platform adheres thoroughly to Jordan's Personal Data Protection Law of 2023. Biometric voice data analysis is processed locally and discarded instantly."}
                  </p>
                </div>
              </div>

              {onOpenCompliance && (
                <button
                  type="button"
                  onClick={onOpenCompliance}
                  className="w-full py-2.5 px-4 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-stone-950 text-emerald-400 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-emerald-900/5"
                >
                  <Scale className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? "عرض شروط الخدمة وسياسة الخصوصية والاستخدام ⚖️" : "View Terms of Service & Privacy Policy ⚖️"}</span>
                  {isAr ? <ChevronLeft className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="border-t border-stone-850 p-4 bg-stone-920 flex flex-col sm:flex-row gap-3 justify-between items-center flex-row-reverse">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md font-sans transition cursor-pointer hover:scale-102 active:scale-98"
          >
            {t('accessibilitySaveBtn')}
          </button>
          
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition font-sans flex items-center justify-center gap-1.5 cursor-pointer"
            title="Restore Defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('accessibilityResetBtn')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
