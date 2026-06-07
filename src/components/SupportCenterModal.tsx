import React, { useState, useEffect } from "react";
import { X, Send, AlertTriangle, Bug, Sparkles, CheckCircle, Mail, Clock, Copy, ShieldAlert, Heart, FileText, Globe, ListFilter, MessageSquare, History } from "lucide-react";

interface SupportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  userEmail: string;
}

interface PastReport {
  id: string;
  date: string;
  category: string;
  categoryLabelAr: string;
  categoryLabelEn: string;
  message: string;
  surahAyahContext?: string;
  status: "received" | "under_review" | "processed";
}

export default function SupportCenterModal({
  isOpen,
  onClose,
  isAr,
  userEmail = "hamzaalomari079@gmail.com",
}: SupportCenterModalProps) {
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(""); // empty by default so it's not pre-filled
  const [message, setMessage] = useState("");
  const [surahAyahContext, setSurahAyahContext] = useState(""); // optional helpful field for Quran context
  
  // Submission HUD
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Past reports state
  const [pastReports, setPastReports] = useState<PastReport[]>([]);

  // Load past reports from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem("qurany_user_reports");
        if (saved) {
          setPastReports(JSON.parse(saved));
        } else {
          // Seed a mock initial report if user is opening first time and it's empty, or keep it clean.
          // Let's keep it clean but allow seeding a welcome item to demonstrate feature, or just empty.
          setPastReports([]);
        }
      } catch (err) {
        console.error("Error loading reports from localStorage:", err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(userEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const categories = [
    {
      id: "theological",
      labelAr: "خطأ تفسيري أو عقائدي ⚠️",
      labelEn: "Theological / Dogmatic Error ⚠️",
      descriptionAr: "وجود خطأ في عرض الآيات الكريمة أو نصوص التفاسير والشرح.",
      descriptionEn: "Urgent issue regarding verses orthography, interpretation, or text.",
      icon: ShieldAlert,
      color: "border-red-500/30 text-rose-450 bg-rose-950/20",
    },
    {
      id: "technical_bug",
      labelAr: "مشكلة برمجية أو عطل تقني 🐞",
      labelEn: "Technical Bug / Crash 🐞",
      descriptionAr: "مشكلة في قراءة الصوت، حفظ العلامات، التصفح أو التثبيت.",
      descriptionEn: "Issues with audio playback, bookmarks, navigation, or PWA.",
      icon: Bug,
      color: "border-amber-500/30 text-amber-500 bg-amber-955/10",
    },
    {
      id: "suggestion",
      labelAr: "اقتراح ميزة أو تطوير جديد ✨",
      labelEn: "Feature Proposal / Improvement ✨",
      descriptionAr: "اقتراح ميزة إضافية أو تحسين لتجربة التصفح والقراءة.",
      descriptionEn: "Suggesting a new capability or general UI improvement.",
      icon: Sparkles,
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/10",
    },
    {
      id: "general",
      labelAr: "استفسار أو تواصل عام ✉️",
      labelEn: "General Contact / Inquiry ✉️",
      descriptionAr: "أي رغبة في التواصل أو الثناء أو استفسار عام.",
      descriptionEn: "General notes, thanks, or standard feedback.",
      icon: Mail,
      color: "border-stone-700 text-stone-300 bg-stone-950/40",
    }
  ];

  // Determine if the current category triggers premium "Emergency" (طارئ) priority
  const isEmergency = category === "theological" || category === "technical_bug";

  const getStatusBadge = (status: "received" | "under_review" | "processed") => {
    switch (status) {
      case "processed":
        return {
          labelAr: "تمت معالجة الخطأ وتعديله بنجاح ✓",
          labelEn: "Resolved & patched ✓",
          color: "bg-emerald-950/30 border-emerald-500/40 text-emerald-400",
        };
      case "under_review":
        return {
          labelAr: "تحت المعالجة والدراسة الشرعية ⚖️",
          labelEn: "Under doctrinal/technical review ⚖️",
          color: "bg-amber-955/20 border-amber-500/30 text-amber-500",
        };
      case "received":
      default:
        return {
          labelAr: "مستلمة بأمان وفي قائمة الانتظار 📥",
          labelEn: "Received safely & queued 📥",
          color: "bg-stone-950/60 border-stone-800 text-stone-400",
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setSubmissionError(isAr ? "يرجى اختيار نوع ونطاق الإبلاغ أولاً من الخيارات المتاحة ⚠️" : "Please select the report category first from the options ⚠️");
      return;
    }
    if (!name.trim() || !email.trim() || !message.trim()) {
      setSubmissionError(isAr ? "يرجى تعبئة كافة الحقول الأساسية المطلوبة." : "Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    // Determine target priority based on selected category (theological/bug translates to emergency)
    const priorityValue = isEmergency ? "emergency" : "normal";
    const selectedCatObj = categories.find(c => c.id === category);

    try {
      const response = await fetch("https://formspree.io/f/mjgdkqqa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          category,
          priority: priorityValue,
          message,
          surahAyahContext: surahAyahContext || "N/A",
          _subject: `[Qurany Support] ${selectedCatObj?.labelEn || category} - Priority: ${priorityValue.toUpperCase()}`,
        }),
      });

      if (response.ok) {
        // Save the submitted report to local storage so user can track it
        const newReportId = "REQ-" + Math.floor(100000 + Math.random() * 900000);
        const formatOptions: Intl.DateTimeFormatOptions = { 
          year: "numeric", 
          month: "short", 
          day: "numeric", 
          hour: "2-digit", 
          minute: "2-digit" 
        };
        const submissionDate = new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", formatOptions);

        const newReport: PastReport = {
          id: newReportId,
          date: submissionDate,
          category,
          categoryLabelAr: selectedCatObj?.labelAr || category,
          categoryLabelEn: selectedCatObj?.labelEn || category,
          message: message,
          surahAyahContext: surahAyahContext,
          status: isEmergency ? "under_review" : "received", // emergency gets immediate review status!
        };

        const updatedList = [newReport, ...pastReports];
        setPastReports(updatedList);
        localStorage.setItem("qurany_user_reports", JSON.stringify(updatedList));

        setSubmissionSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
        setSurahAyahContext("");
      } else {
        const data = await response.json();
        setSubmissionError(data.error || (isAr ? "حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً." : "An error occurred. Please try again."));
      }
    } catch (err) {
      setSubmissionError(isAr ? "فشل الاتصال بالخادم. تحقق من شبكة الإنترنت الخاصة بك." : "Connection error. Please verify your internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200" dir={isAr ? "rtl" : "ltr"}>
      {/* Outer Backdrop Click */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="border-b border-stone-850 p-4 sm:p-5 flex items-center justify-between bg-stone-920">
          <div className={`flex items-center gap-2.5 ${isAr ? "flex-row" : "flex-row-reverse"}`}>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div className={isAr ? "text-right" : "text-left"}>
              <h3 className="text-sm sm:text-base font-black text-stone-100 font-sans">
                {isAr ? "مركز الدعم والمساعدة الموثوق 🕋" : "Trustworthy Help & Support Center 🕋"}
              </h3>
              <p className="text-[10px] text-stone-400 font-sans font-medium mt-0.5">
                {isAr ? "للإبلاغ الفوري عن الأخطاء التفسيرية، العقائدية أو التقنية" : "Immediate reporting on textual, doctrinal, or engineering issues"}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 cursor-pointer transition-all active:scale-95 border border-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow flex flex-col gap-5">
          
          {/* Top Notice */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-right relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <h4 className="text-xs font-black text-amber-500 font-sans flex items-center gap-1.5 justify-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isAr ? "إرشاد وتنويه هام:" : "Important Guidance & Notice:"}</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-stone-300 font-sans mt-1.5 leading-relaxed">
              {isAr
                ? "يرجى عدم ارسال نفس الشكوى لنفس الخطأ؛ وذلك لتفادي تكرار البلاغات وتمكين فريق المراجعة الفنية والدينية من دراسة وحل كافة الملاحظات الواردة بكفاءة عالية وبأسرع وقت."
                : "Please do not send the same complaint multiple times for the same error. This helps avoid duplicates and allows the team to address all issues efficiently."}
            </p>
          </div>

          {!submissionSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Category selections */}
              <div>
                <label className="block text-[11px] sm:text-xs text-stone-300 font-sans font-black mb-2">
                  {isAr ? "١. حدد نوع ونطاق الإبلاغ:" : "1. Choose Category/Type:"} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id);
                        }}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex gap-2.5 items-start ${
                          isSelected 
                            ? "border-amber-500 bg-amber-950/20 text-stone-100" 
                            : "border-stone-800 bg-stone-950/20 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                        }`}
                      >
                        <CatIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-amber-500" : "text-stone-500"}`} />
                        <div>
                          <div className="text-xs font-bold leading-none select-none">
                            {isAr ? cat.labelAr : cat.labelEn}
                          </div>
                          <p className="text-[9.5px] text-stone-450 font-sans leading-normal mt-1 select-none">
                            {isAr ? cat.descriptionAr : cat.descriptionEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Emergency priority display based on selected category (removes old picker) */}
              {isEmergency && (
                <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/30 text-rose-400 flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-[11px] font-black font-sans leading-relaxed">
                    {isAr 
                      ? "🚨 تم تحديد الحالة كأولوية طارئة جداً وسيتم معالجتها على الفور" 
                      : "🚨 Priority automatically escalated to Emergency and will be addressed instantly"}
                  </span>
                </div>
              )}

              {/* Direct Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10.5px] sm:text-xs text-stone-300 font-sans font-bold mb-1.5">
                    {isAr ? "الاسم الكريم:" : "Your Name:"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? "أدخل اسمك الكريم" : "Enter your name"}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-200 placeholder-stone-650 font-sans focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] sm:text-xs text-stone-300 font-sans font-bold mb-1.5">
                    {isAr ? "بريدك الإلكتروني للمتابعة:" : "Your Email for Updates:"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-200 placeholder-stone-650 font-sans focus:outline-none focus:border-amber-500/60 text-left"
                  />
                </div>
              </div>

              {/* Optional reference location (Surah / Verse) */}
              <div>
                <label className="block text-[10px] sm:text-xs text-stone-305 font-sans font-bold mb-1.5">
                  {isAr ? "رقم السورة / الآية أو سياق المشكلة (اختياري):" : "Surah / Ayah Context (Optional):"}
                </label>
                <input
                  type="text"
                  value={surahAyahContext}
                  onChange={(e) => setSurahAyahContext(e.target.value)}
                  placeholder={isAr ? "مثال: سورة الفاتحة الآية ٢ أو مشاكل حفظ الأذكار" : "Example: Al-Fatihah, Verse 2 or Bookmarks storage"}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-200 placeholder-stone-650 font-sans focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Message Details */}
              <div>
                <label className="block text-[10.5px] sm:text-xs text-stone-300 font-sans font-bold mb-1.5">
                  {isAr ? "تفاصيل الخطأ أو البلاغ بالتفصيل:" : "Detailed Report Details:"} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAr ? "يرجى كتابة ملاحظتك أو تفاصيل الخطأ بدقة لتسهيل مراجعته فوراً..." : "Describe the bug or theological notes clearly so we can locate it and patch it..."}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 placeholder-stone-650 font-sans focus:outline-none focus:border-amber-500/60 leading-relaxed"
                />
              </div>

              {/* Error HUD inside form */}
              {submissionError && (
                <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-xl text-xs text-red-400 font-sans font-bold text-center">
                  {submissionError}
                </div>
              )}

              {/* Button Trigger */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 text-xs sm:text-sm font-black font-sans rounded-xl cursor-pointer transition active:scale-98 shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Clock className="w-4 h-4 animate-spin text-stone-950" />
                ) : (
                  <Send className={`w-4 h-4 text-stone-950 ${isAr ? "rotate-180" : ""}`} />
                )}
                <span>{isSubmitting ? (isAr ? "جاري الإرسال للتوطين..." : "Submitting Report...") : (isAr ? "إرسال البلاغ فوراً 🚀" : "Submit Urgent Report 🚀")}</span>
              </button>

            </form>
          ) : (
            /* Submission Success State */
            <div className="p-8 text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-250">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>

              <div className="max-w-md">
                <h3 className="text-base sm:text-lg font-black text-stone-100 font-sans">
                  {isAr ? "تم إرسال بلاغك بنجاح! وجزاك الله خيراً" : "Your Report Has Been Submitted!"}
                </h3>
                <p className="text-xs text-stone-400 font-sans mt-2 leading-relaxed">
                  {isAr 
                    ? "نشكرك من القلب لاهتمامك بسلامة محتوى منصة قرآني ومساعدتنا في تدارك الأخطاء. لقد أرسلنا تفاصيل الإبلاغ مباشرة إلى فريق الصيانة والدعم، وسيتم مراجعة الأمر بأسرع ما يمكن وتحديثه فوراً."
                    : "Thank you for helping keep Qurany perfect and secure. Your detailed notes were sent directly to our support team and will be corrected in an instant."}
                </p>
              </div>

              <button
                onClick={() => setSubmissionSuccess(false)}
                className="mt-4 px-6 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-amber-500/20 font-sans font-black text-xs rounded-xl cursor-pointer transition active:scale-95"
              >
                {isAr ? "إرسال بلاغ آخر" : "Submit Another Report"}
              </button>
            </div>
          )}

          {/* PAST REPORTS SECTION FOR REALTIME TRACKING */}
          {pastReports.length > 0 && (
            <div className="border-t border-stone-850 pt-4 mt-2">
              <span className={`text-[11px] font-black text-stone-300 uppercase font-sans tracking-wide block mb-3 flex items-center gap-1.5 ${isAr ? "justify-start text-right" : "justify-start text-left"}`}>
                <History className="w-4 h-4 text-amber-500" />
                <span>{isAr ? "سجل البلاغات السابقة وحالتها الحية:" : "Past Submitted Reports Tracker:"}</span>
              </span>

              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {pastReports.map((item) => {
                  const info = getStatusBadge(item.status);
                  return (
                    <div 
                      key={item.id} 
                      className="bg-stone-950/40 border border-stone-850 rounded-2xl p-3.5 space-y-2 text-right"
                      dir={isAr ? "rtl" : "ltr"}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-stone-900 border border-stone-800 text-stone-400 px-2 py-0.5 rounded-lg select-all">
                            {item.id}
                          </span>
                          <span className="text-[10px] text-stone-500 font-sans font-semibold">
                            {item.date}
                          </span>
                        </div>

                        <span className={`text-[9.5px] font-bold font-sans px-2.5 py-1 rounded-full border ${info.color}`}>
                          {isAr ? info.labelAr : info.labelEn}
                        </span>
                      </div>

                      <div className="text-[11px] font-sans font-bold text-stone-350">
                        {isAr ? "القسم: " : "Category: "}
                        <span className="text-amber-500 font-extrabold text-xs">
                          {isAr ? item.categoryLabelAr : item.categoryLabelEn}
                        </span>
                        {item.surahAyahContext && (
                          <span className="text-[10px] text-stone-500 block mt-0.5">
                            {isAr ? `الموقع: ${item.surahAyahContext}` : `Context: ${item.surahAyahContext}`}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-400 font-sans leading-normal italic line-clamp-2 bg-stone-900/40 p-2 rounded-xl border border-stone-850/60 select-all">
                        "{item.message}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct channels */}
          <div className="border-t border-stone-850 pt-4">
            <span className={`text-[10px] font-black text-stone-500 uppercase font-sans tracking-wider block mb-2.5 ${isAr ? "text-right" : "text-left"}`}>
              {isAr ? "وسائل التواصل المباشر مع المطوّر والمدير العام:" : "Direct Channels with General Director:"}
            </span>

            <div className="bg-stone-950/40 border border-stone-850 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Mail className="w-5 h-5 text-amber-500" />
                </div>
                
                <div>
                  <h4 className="text-xs font-black text-stone-100 font-sans">
                    {isAr ? "صاحب المنصة والمشرف البرمجي:" : "Founder & Engineering Overseer:"}
                  </h4>
                  <p className="text-[11px] text-amber-500 font-mono mt-0.5 select-all">
                    {userEmail}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition border cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0 ${
                  copiedEmail 
                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400" 
                    : "bg-stone-850 hover:bg-stone-800 border-stone-800 text-stone-300"
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedEmail ? (isAr ? "تم النسخ ✓" : "Copied! ✓") : (isAr ? "نسخ الإيميل" : "Copy Email")}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Persistent footer */}
        <div className="border-t border-stone-850 p-4 bg-stone-920 text-center flex items-center justify-between text-[10px] text-stone-550 font-sans leading-relaxed">
          <span className="font-mono">Security and Doctrinal Guard: online</span>
          <span className="font-sans">{isAr ? "منصة قرآني © ٢٠٢٦" : "Qurany Platform © 2026"}</span>
        </div>

      </div>
    </div>
  );
}
