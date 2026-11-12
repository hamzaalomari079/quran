import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Trash2, Quote, Brain, MessageSquare, Award, Scale, ShieldAlert, Copy, Check, BookOpen, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AIMemorizationGateway from "./AIMemorizationGateway";
import { generateLocalGuidance, isLegacyErrorText } from "../utils/quranAiEngine";

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface AIChatBotProps {
  prefilledVerse?: {
    text: string;
    verseNumber: number;
    surahName?: string;
  } | null;
  onClearPrefilledVerse: () => void;
  onOpenCompliance?: () => void;
}

export default function AIChatBot({ prefilledVerse, onClearPrefilledVerse, onOpenCompliance }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("quran_ai_chat_history");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (m: any) => m && typeof m.text === "string" && !isLegacyErrorText(m.text)
            );
            if (cleaned.length !== parsed.length) {
              localStorage.setItem("quran_ai_chat_history", JSON.stringify(cleaned));
            }
            return cleaned;
          }
        }
      } catch (e) {
        console.warn("Failed to read chat history", e);
      }
    }
    return [];
  });
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [subTab, setSubTab] = useState<"tafsir" | "memorization">("tafsir");

  // Save messages to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("quran_ai_chat_history", JSON.stringify(messages.slice(-30)));
      } catch (e) {
        console.warn("Failed to save chat history", e);
      }
    }
  }, [messages]);

  // Suggested prompt chips for users to click
  const promptSuggestions = [
    {
      title: "الطمأنينة والتخلص من القلق والتفكير",
      badge: "سكينة القلب",
      query: "أريد آيات قرآنية وتوجيهات إيمانية تساعدني على تخطي القلق المفرط والتفكير بالمستقبل، مع تدبرها العميق ودعاء للسكينة."
    },
    {
      title: "فضل الصبر واليقين بالفرج القريب",
      badge: "الأمل والفرج",
      query: "ما هو توجيه القرآن الكريم وتفسيره للصبر على الشدائد والابتلاءات؟ وكيف يتجلى لطف الله بعباده الصابرين؟"
    },
    {
      title: "التوبة الصادقة والبداية الجديدة",
      badge: "رحمة ومغفرة",
      query: "أبحث عن آيات الرجاء والرحمة والمغفرة لمن يريد الإقبال على الله والبدء بصفحة بيضاء جديدة مع خطوات عملية للثبات."
    },
    {
      title: "تدبر آية الكرسي وأسرارها العظيمة",
      badge: "تفسير وتدبر",
      query: "اشرح لي بالتفصيل معاني وأسرار آية الكرسي (اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ) ولماذا كانت أعظم آية في كتاب الله؟"
    },
    {
      title: "أدعية قرآنية جامعة لقضاء الحوائج",
      badge: "أدعية القرآن",
      query: "اذكر لي أجمل الأدعية القرآنية الجامعة لتفريج الكرب وتيسير الأمور وصلاح القلب مع شرح معانيها."
    },
    {
      title: "مفاتيح البركة وتيسير الرزق في القرآن",
      badge: "الرزق والبركة",
      query: "ما هي الأسباب والمفاتيح القرآنية لجلب البركة في الوقت والمال والرزق الطيب وتيسير الأمور؟"
    }
  ];

  const verseQuickPrompts = prefilledVerse
    ? [
        { label: "📖 التفسير الشامل للآية", query: `ما هو التفسير الشامل والميسر لهذه الآية الكريمة من سورة ${prefilledVerse.surahName || ""} (الآية ${prefilledVerse.verseNumber}): "${prefilledVerse.text}"؟` },
        { label: "📜 أسباب النزول والسياق", query: `ما هو سبب نزول وسياق هذه الآية الكريمة من سورة ${prefilledVerse.surahName || ""}: "${prefilledVerse.text}"؟` },
        { label: "💎 البلاغة ومعاني المفردات", query: `وضح لي معاني المفردات واللطائف البلاغية والبيانية في قوله تعالى: "${prefilledVerse.text}"` },
        { label: "🌱 التطبيق العملي والدعاء", query: `كيف أطبق هدايات هذه الآية الكريمة عملياً في حياتي اليومية مع دعاء مستوحى منها: "${prefilledVerse.text}"؟` }
      ]
    : [];

  useEffect(() => {
    if (prefilledVerse) {
      setSubTab("tafsir");
      setInputText(`ما هو تفسير هذه الآية وتوجيهها العملي في حياتي: "${prefilledVerse.text}"؟`);
    }
  }, [prefilledVerse]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleCopyMessage = (text: string, idx: number) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      console.warn("Clipboard copy failed", e);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText || loading) return;

    const nowTime = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = {
      sender: "user",
      text: cleanText,
      timestamp: nowTime
    };

    const activeVerseText = prefilledVerse?.text || "";
    const activeContextType = prefilledVerse ? "verse-tafsir" : "general-guidance";
    const recentHistory = [...messages.slice(-5), userMsg];

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    setError(null);

    if (prefilledVerse) {
      onClearPrefilledVerse();
    }

    try {
      const response = await fetch("/api/ai/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanText,
          verseText: activeVerseText,
          contextType: activeContextType,
          history: recentHistory
        })
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        // Fallback
      }

      const resultText =
        data && data.result && !isLegacyErrorText(data.result)
          ? data.result
          : generateLocalGuidance({
              prompt: cleanText,
              verseText: activeVerseText,
              contextType: activeContextType
            });

      const aiMsg: Message = {
        sender: "ai",
        text: resultText,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackText = generateLocalGuidance({
        prompt: cleanText,
        verseText: activeVerseText,
        contextType: activeContextType
      });
      const aiMsg: Message = {
        sender: "ai",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConfirmClear(false);
    onClearPrefilledVerse();
    try {
      localStorage.removeItem("quran_ai_chat_history");
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 animate-in fade-in duration-300">
      
      {/* Sub tabs selector */}
      <div className="flex items-center justify-center gap-1.5 bg-stone-900 border border-stone-850 p-1.5 rounded-2xl max-w-md mx-auto mb-6 shadow-md shadow-stone-950/20">
        <button
          onClick={() => setSubTab("tafsir")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === "tafsir"
              ? "bg-amber-600 text-stone-950 font-black shadow-md shadow-amber-600/10"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>مُساعد التدبر والإرشاد</span>
        </button>
        <button
          onClick={() => setSubTab("memorization")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === "memorization"
              ? "bg-amber-600 text-stone-950 font-black shadow-md shadow-amber-600/10"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>برنامج الحفظ والمتشابهات</span>
        </button>
      </div>

      {subTab === "memorization" ? (
        <AIMemorizationGateway currentLang="ar" />
      ) : (
        <>
          {/* Bot branding header */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 mb-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 text-right flex-row">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-stone-950 font-bold shrink-0 shadow-lg shadow-amber-600/15">
                <Brain className="w-6 h-6 text-stone-950" />
              </div>
              <div className="text-right">
                <h2 className="text-base md:text-lg font-extrabold text-stone-100 font-sans flex items-center gap-2 justify-start flex-wrap">
                  <span>مُساعد التدبر والإرشاد القرآني الذكي</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    متصل وجاهز فوراً
                  </span>
                </h2>
                <p className="text-xs text-stone-400 font-sans mt-1 leading-relaxed">
                  رفيقك التفاعلي لتدبر آيات القرآن الكريم، بيان معاني المفردات وأسباب النزول، وتقديم الإرشاد الإيماني من أمهات كتب التفسير المعتمدة.
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:bg-rose-950/30 border border-rose-500/20 px-3.5 py-2 rounded-xl transition cursor-pointer font-sans font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح المحادثة</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-2.5 py-1.5 rounded-xl">
                    <span className="text-[11px] text-rose-300 font-sans font-bold">تأكيد المسح؟</span>
                    <button
                      onClick={handleClearChat}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition"
                    >
                      نعم
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold rounded-lg cursor-pointer transition"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="bg-stone-900 border border-stone-800/80 rounded-3xl min-h-[500px] flex flex-col shadow-xl shadow-stone-950/40 overflow-hidden mb-4">
            
            {/* Compact Regulatory & Sharia Notice Bar */}
            <div className="bg-amber-600/5 border-b border-stone-850 px-4 py-2.5 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-right" dir="rtl">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[11px] text-stone-300 font-sans">
                  مخصص للتدبر والتعليم وتبسيط التفسير الميسر، وليس لإصدار الفتاوى الشرعية الملزمة.
                </p>
              </div>
              {onOpenCompliance && (
                <button
                  type="button"
                  onClick={onOpenCompliance}
                  className="px-2.5 py-1 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-amber-400 hover:text-amber-300 font-sans font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Scale className="w-3 h-3" />
                  <span>الضوابط والخصوصية</span>
                </button>
              )}
            </div>

            {/* Messages Pane */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[540px] flex flex-col gap-4">
              {messages.length === 0 ? (
                /* Intro State with Quick Suggestions */
                <div className="my-auto flex flex-col items-center max-w-2xl mx-auto text-center p-2 sm:p-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-3 text-amber-500 shadow-inner">
                    <Sparkles className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-extrabold text-stone-100 font-sans">
                    أهلاً بك في فضاء التدبر القرآني الذكي
                  </h3>
                  <p className="text-xs text-stone-400 font-sans mt-1.5 leading-relaxed max-w-lg">
                    اكتب أي سؤال يدور في ذهنك حول تفسير آية، أو ابحث عن آيات تلامس قلبك وتعينك في حياتك اليومية، أو اختر أحد المواضيع المقترحة للبدء فوراً:
                  </p>

                  {/* Sample Prompt suggestions grid */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-right" dir="rtl">
                    {promptSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s.query)}
                        className="p-3.5 border border-stone-800/90 bg-stone-950/50 rounded-2xl hover:border-amber-500/40 hover:bg-stone-850/90 transition-all text-right cursor-pointer group flex flex-col gap-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-bold font-sans px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {s.badge}
                          </span>
                          <MessageSquare className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-500 group-hover:scale-110 transition shrink-0" />
                        </div>
                        <span className="text-xs font-extrabold text-stone-200 group-hover:text-amber-400 transition font-sans mt-0.5">
                          {s.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Active message listing */
                messages.map((m, index) => (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[92%] sm:max-w-[85%] ${
                      m.sender === "user" ? "self-end items-end" : "self-start items-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-200`}
                  >
                    <div
                      className={`px-4 py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                        m.sender === "user"
                          ? "bg-amber-600 text-stone-950 rounded-br-none font-sans font-bold shadow-md shadow-amber-600/10"
                          : "bg-stone-950/80 border border-stone-800 text-stone-200 rounded-bl-none shadow-inner"
                      }`}
                    >
                      {m.sender === "user" ? (
                        <p className="whitespace-pre-wrap text-right" dir="rtl">{m.text}</p>
                      ) : (
                        <>
                          <div className="markdown-body pr-1 text-right select-text space-y-2" dir="rtl">
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                          </div>
                          <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2" dir="rtl">
                            <span className="text-[10px] text-amber-500/80 font-sans font-semibold flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>التدبر القرآني الميسر</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(m.text, index)}
                              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-[10px] font-sans font-bold text-stone-300 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>نسخ التدبر</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-500 font-sans mt-1 px-1.5">
                      {m.timestamp}
                    </span>
                  </div>
                ))
              )}

              {/* Assistant loading state */}
              {loading && (
                <div className="self-start flex flex-col items-start gap-1 max-w-[85%] animate-pulse">
                  <div className="bg-stone-950/90 border border-amber-500/20 p-4 rounded-2xl rounded-bl-none flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span className="text-xs text-amber-400 font-sans font-bold mr-1">
                      جاري تدبر الآيات واستخلاص المعاني من أمهات كتب التفسير...
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Chat Errors */}
              {error && (
                <div className="mx-auto bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl max-w-md text-center text-xs text-rose-400 font-sans font-semibold">
                  <p>{error}</p>
                  {messages.length > 0 && messages[messages.length - 1].sender === "user" && (
                    <button
                      onClick={() => handleSendMessage(messages[messages.length - 1].text)}
                      className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 cursor-pointer mx-auto flex items-center gap-1.5 font-sans font-bold text-[11px]"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>إعادة المحاولة</span>
                    </button>
                  )}
                </div>
              )}

              <div ref={chatEndRef}></div>
            </div>

            {/* Active pre-filled verse banner with 1-click quick actions */}
            {prefilledVerse && (
              <div className="mx-4 mb-3 border border-amber-500/30 bg-stone-950/90 rounded-2xl p-3.5 md:p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300 shadow-inner" dir="rtl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Quote className="w-4 h-4 text-amber-500 shrink-0 mt-1 select-none" />
                    <div className="text-right">
                      <span className="text-[10px] bg-amber-600/15 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-md font-sans font-bold">
                        آية محددة للتدبر: سورة {prefilledVerse.surahName || ""} • الآية {prefilledVerse.verseNumber}
                      </span>
                      <p className="text-sm text-stone-100 font-quran font-bold mt-1.5 leading-relaxed">
                        « {prefilledVerse.text} »
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClearPrefilledVerse}
                    className="text-[11px] text-stone-400 hover:text-amber-400 bg-stone-900 hover:bg-stone-850 px-2.5 py-1 rounded-lg transition shrink-0 font-sans font-bold cursor-pointer border border-stone-800"
                  >
                    إلغاء
                  </button>
                </div>

                {/* Quick 1-click actions for the prefilled verse */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-850">
                  {verseQuickPrompts.map((vp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(vp.query)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-[11px] font-sans font-bold transition cursor-pointer"
                    >
                      {vp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input control area */}
            <div className="border-t border-stone-850 p-3 md:p-4 bg-stone-950/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }}
                className="flex items-center gap-2 w-full"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    prefilledVerse
                      ? "اسأل عن تفسير هذه الآية، سبب نزولها، أو اضغط الإرسال مباشرة..."
                      : "اكتب سؤالك هنا (مثال: تفسير آية، علاج القلق بالقرآن، أسباب النزول)..."
                  }
                  className="w-full bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-sans placeholder-stone-500 outline-none focus:border-amber-500 shadow-inner disabled:opacity-50"
                  dir="rtl"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="w-12 h-12 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 flex items-center justify-center shadow-md disabled:bg-stone-800 disabled:text-stone-600 transition cursor-pointer shrink-0 active:scale-95"
                  title="إرسال السؤال"
                >
                  <Send className="w-5 h-5 text-stone-950 rotate-180" />
                </button>
              </form>
              
              <p className="text-[10px] text-stone-500 text-center font-sans mt-2.5 leading-relaxed max-w-2xl mx-auto">
                💡 يستند المساعد الذكي إلى أمهات كتب التفسير المعتمدة لتيسير التدبر والفهم. للفتاوى الشرعية يرجى دائماً مراجعة العلماء ودائرة الإفتاء العام المعتمدة.
              </p>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
