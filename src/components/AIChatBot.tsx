import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Trash2, Quote, Brain, MessageSquare, Award, Scale, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AIMemorizationGateway from "./AIMemorizationGateway";

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [subTab, setSubTab] = useState<"tafsir" | "memorization">("tafsir");
  const [isComplianceAccepted, setIsComplianceAccepted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_compliance_accepted") === "true";
    }
    return false;
  });

  // Suggested prompt chips for users to click
  const promptSuggestions = [
    { title: "التعامل مع القلق والتفكير المستمر", query: "أريد آيات قرآنية وتلاوات تساعدني على تخطي القلق المفرط ووساوس التفكير بالمستقبل، مع تدبرها." },
    { title: "فضل الصبر والرضا بالقضاء", query: "ما هو توجيه القرآن وتفسيره للصبر على الشدائد ومكاره الحياة؟ وكيف يتجلى اسم الله اللطيف؟" },
    { title: "الطمأنينة والتخلص من التوتر", query: "أشعر بضيق وتوتر مفرط في العمل والحياة، أريد تدبر آيات حقيقة ومبشرة تعيد اليّ الطمأنينة." },
    { title: "التوبة والبداية الجديدة", query: "أبحث عن آيات الأمل والرحمة والمغفرة لمن يريد الرجوع لله والبدء بصفحة بيضاء جديدة." }
  ];

  useEffect(() => {
    // If a verse is passed for active pondering, prefill the text fields
    if (prefilledVerse) {
      setInputText(`ما هو تفسير هذه الآية وتوجيهها العملي في حياتي: "${prefilledVerse.text}"؟`);
    }
  }, [prefilledVerse]);

  useEffect(() => {
    // Scroll chats to bottom
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    setError(null);

    // If we had a prefilled verse, clear it after submitting
    if (prefilledVerse) {
      onClearPrefilledVerse();
    }

    try {
      const response = await fetch("/api/ai/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          verseText: prefilledVerse?.text || "",
          contextType: prefilledVerse ? "verse-tafsir" : "general-guidance"
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Fallback
      }

      if (!response.ok) {
        throw new Error(data?.error || "حدث خطأ أثناء الاتصال بخادم الذكاء الاصطناعي.");
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      const aiMsg: Message = {
        sender: "ai",
        text: data.result,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء توليد الشرح والتفسير.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف سجل المحادثة؟")) {
      setMessages([]);
      onClearPrefilledVerse();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 animate-in fade-in duration-300">
      
      {/* Sub tabs selector - keeps buttons clean and compact */}
      <div className="flex items-center justify-center gap-1.5 bg-stone-900 border border-stone-850 p-1.5 rounded-2xl max-w-md mx-auto mb-6 shadow-md shadow-stone-950/20">
        <button
          onClick={() => setSubTab("tafsir")}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 text-right flex-row">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-stone-950 font-bold shrink-0 shadow-lg shadow-amber-600/10">
                <Brain className="w-6 h-6 text-stone-950" />
              </div>
              <div className="text-right">
                <h2 className="text-base font-extrabold text-stone-100 font-sans flex items-center gap-1.5 justify-start">
                  <span>مُساعد التدبر والإرشاد الإيماني</span>
                  <span className="text-[10px] bg-amber-600/15 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">ذكي</span>
                </h2>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  اطرح أسئلة عن شرح الآيات، تفسيرها، أو اطلب توجيهات قرآنية لتدبر معاني الكتاب الأعظم وتثبيت السكينة في القلب.
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:bg-rose-950/20 px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف السجل</span>
              </button>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="bg-stone-900 border border-[#2e2a24]/40 rounded-3xl min-h-[480px] flex flex-col shadow-md shadow-stone-950/30 overflow-hidden mb-4">
            
            {/* Regulatory & Safety Disclaimer Banner - Persistent at top of chat area */}
            <div className="bg-amber-600/5 border-b border-stone-850 p-4 shrink-0">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3 text-right" dir="rtl">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-black text-amber-400 font-sans flex items-center gap-1.5 justify-start">
                      <span>إخلاء مسؤولية تنظيمي وتنبيه للخصوصية والضوابط القانونية</span>
                      <span className="text-[9px] bg-red-400/15 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-md font-bold">هام</span>
                    </h4>
                    <p className="text-[11px] text-stone-300 font-sans leading-relaxed mt-1 text-balance">
                      قبل استخدام المساعد الذكي، يُرجى العلم أن هذا الموقع مخصص للتدبر والتعليم وليس لإصدار فتاوى أو أحكام شرعية ملزمة. تفضل بالاطلاع على التزامات الموقع وسياسة حماية البيانات.
                    </p>
                  </div>
                </div>
                {onOpenCompliance && (
                  <button
                    type="button"
                    onClick={onOpenCompliance}
                    className="w-full md:w-auto px-3.5 py-2 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 hover:text-stone-100 font-sans font-extrabold text-[11px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 shadow-md"
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-500" />
                    <span>شروط الخدمة وسياسة الخصوصية والاستخدام ⚖️</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Pane & Consent Gate */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[500px] flex flex-col gap-4">
              
              {!isComplianceAccepted ? (
                /* Regulatory & Sharia Compliance Consent Gate Block */
                <div className="my-auto flex flex-col items-center max-w-lg mx-auto text-center p-5 bg-stone-900 border border-amber-600/10 rounded-3xl shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-amber-600/10 border border-amber-500/25 flex items-center justify-center mb-4 text-amber-500 shadow-md">
                    <Scale className="w-7 h-7 text-amber-500 animate-pulse" />
                  </div>
                  <h3 className="text-base font-black text-stone-100 font-sans tracking-tight">بوابة مراجعة شروط الخدمة وسياسة الخصوصية والاستخدام</h3>
                  
                  <div className="text-right space-y-3 mt-4 text-[11px] leading-relaxed text-stone-300 font-sans" dir="rtl">
                    <p className="text-center font-bold text-amber-400 text-xs text-balance">
                      ⚠️ يرجى تأكيد قراءة البنود والالتزام التام بضوابطها الشرعية والتعليمية قبل تفعيل المساعد الذكي:
                    </p>
                    
                    <div className="border-l-2 border-emerald-500/50 pl-3 pr-1 py-1.5 bg-emerald-500/5 rounded-r-lg">
                      • <strong>رسالة إيمانية وتربوية:</strong> نؤكد بحسم أن هذا الموقع هو بؤرة تعليمية تفاعلية أُسست بالكامل لخدمة غرس معاني الكتاب الأعظم (القرآن الكريم)، وتعميق تدبُّر آياته والعمل العملي بأخلاقه الرفيعة التي لو فهمها الناس وطبقوها بوعي ويقين لتغير وجه العالم بأسره نحو النور والصلاح؛ إلا أن إغفال أو تضييع عُشْرٍ واحدٍ من هذا الميثاق الخُلُقي العظيم والمنهج الرباني القويم كفيل بتشتيت أمان النفوس وهدم أركان التماسك والسلم البشري.
                    </div>
                    
                    <div className="border-l-2 border-amber-500/50 pl-3 pr-1 py-1.5 bg-amber-500/5 rounded-r-lg">
                      • <strong>ليست منصة فتوى أو تشريع شرعي:</strong> ردود وأبحاث المساعد الذكي هي لتبسيط المعاني والتمكين اللغوي والتوجيه النفسي، وليست بحالٍ مصدراً لإصدار تبيينات شرعية أو أحكام دينية فقهية ملزمة. للفتوى المعتمدة يُرجى مراجعة وتفحص موقع ودائرة الإفتاء العام الأردنية الموثوقة.
                    </div>
                    
                    <div className="border-l-2 border-indigo-500/50 pl-3 pr-1 py-1.5 bg-indigo-500/5 rounded-r-lg">
                      • <strong>الملكية التامة للبيانات وحذفها:</strong> لا نقوم بتسجيل أو تجميع أي من ملفاتك الصوتية المستلمة، أو سجلات محادثاتك السرية في الخوادم السحابية، ونهيئ لك في المتجر البرمجي تصفير ومحو سجل التصفح بالكامل لحظياً لحماية هويتك.
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-6">
                    {onOpenCompliance && (
                      <button
                        type="button"
                        onClick={onOpenCompliance}
                        className="flex-1 px-4 py-3 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 hover:text-stone-100 font-sans font-extrabold text-[11px] rounded-xl transition cursor-pointer active:scale-97 select-none flex items-center justify-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-500" />
                        <span>قراءة شروط الخدمة وسياسة الخصوصية والاستخدام</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("ai_compliance_accepted", "true");
                          setIsComplianceAccepted(true);
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-stone-950 font-sans font-black text-xs rounded-xl shadow-md transition cursor-pointer active:scale-97 select-none"
                    >
                      أوافق، وأمتثل وأريد تفعيل المساعد 👍
                    </button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                /* Intro State */
                <div className="my-auto flex flex-col items-center max-w-lg mx-auto text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-stone-850 border border-stone-800 flex items-center justify-center mb-4 text-amber-500 shadow-inner">
                    <Sparkles className="w-8 h-8 text-[#c49a6c]" />
                  </div>
                  <h3 className="text-base font-bold text-stone-100 font-sans">أهلاً بك في فضاء التدبر القرآني الفوري</h3>
                  <p className="text-xs text-stone-400 font-sans mt-2 leading-relaxed">
                    هذا المساعد الذكي يستند بالكامل إلى آيات القرآن الكريم لتقديم تفسير عميق وتوجيهات عملية متطابقة مع المبادئ الإنسانية والأخلاقية السامية. جرب طرح سؤال أو اختيار أحد النماذج أدناه:
                  </p>

                  {/* Sample Prompt suggestions */}
                  <div className="mt-6 grid grid-cols-1 gap-2 w-full text-right" dir="rtl">
                    {promptSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s.query)}
                        className="p-3 border border-stone-800 bg-stone-850/60 rounded-2xl hover:border-amber-500/30 hover:bg-stone-800 hover:text-amber-500 transition text-xs font-semibold text-stone-300 font-sans flex items-center gap-2 justify-start cursor-pointer group w-full"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Active message listing */
                messages.map((m, index) => (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[85%] ${
                      m.sender === "user" ? "self-end items-end" : "self-start items-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-200`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        m.sender === "user"
                          ? "bg-amber-600 text-stone-950 rounded-br-none font-sans font-bold shadow-md shadow-amber-600/10"
                          : "bg-stone-850/70 border border-stone-800 text-stone-200 rounded-bl-none shadow-inner"
                      }`}
                    >
                      {m.sender === "user" ? (
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      ) : (
                        <div className="markdown-body pr-1 text-right select-all" dir="rtl">
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-500 font-sans mt-1 px-1.5">
                      {m.timestamp.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}

              {/* Assistant compiling state */}
              {loading && (
                <div className="self-start flex flex-col items-start gap-1 max-w-[80%] animate-pulse">
                  <div className="bg-stone-850/70 border border-stone-800 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span className="text-xs text-stone-400 font-sans font-medium mr-2">جاري تدبر الآيات واستخلاص الحكمة من مرشدك الإيماني...</span>
                  </div>
                </div>
              )}

              {/* Quick Chat Errors */}
              {error && (
                <div className="mx-auto bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl max-w-sm text-center text-xs text-rose-450 font-sans font-semibold">
                  <p>{error}</p>
                  <button
                    onClick={() => setInputText("أعد المحاولة")}
                    className="mt-2.5 underline text-amber-500 hover:text-amber-450 cursor-pointer text-center mx-auto block font-sans"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              <div ref={chatEndRef}></div>
            </div>

            {/* Floating active pre-filled verse banner */}
            {isComplianceAccepted && prefilledVerse && (
              <div className="mx-4 mb-3 border border-stone-800 bg-stone-950/60 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-300 shadow-inner">
                <div className="flex items-center gap-2.5 flex-row">
                  <Quote className="w-4 h-4 text-amber-500 rotate-180 shrink-0 select-none" />
                  <div className="text-right">
                    <span className="text-[10px] bg-amber-600/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md font-sans font-bold">
                       تدبر ذكي نشط: سورة {prefilledVerse.surahName || ""} - الآية {prefilledVerse.verseNumber} 
                     </span>
                     <p className="text-xs text-stone-200 font-quran font-semibold mt-1 leading-relaxed select-none font-sans">
                      {prefilledVerse.text}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClearPrefilledVerse}
                  className="text-xs text-amber-500 hover:text-amber-450 hover:bg-stone-850 p-1.5 rounded-lg transition shrink-0 font-sans font-extrabold cursor-pointer"
                  title="إلغاء تدبر هذه الآية المحددة"
                >
                  إلغاء لتدبر آية أخرى
                </button>
              </div>
            )}

            {/* Search input control area */}
            <div className="border-t border-stone-850 p-3 md:p-4 bg-stone-950/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isComplianceAccepted) return;
                  handleSendMessage(inputText);
                }}
                className="flex items-center gap-2 w-full"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    !isComplianceAccepted
                      ? "يرجى الموافقة على شروط الخدمة وسياسة الخصوصية والاستخدام لتفعيل الإدخال..."
                      : prefilledVerse 
                        ? "سجل تساؤلك أو طلب تدبرك الخاص بهذه الآية هنا..." 
                        : "اكتب تساؤلك أو اطلب آيات تريح الضيق أو الحزن والتوتر..."
                  }
                  className="w-full bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl py-3 px-4 text-xs font-sans placeholder-stone-550 outline-none focus:border-amber-500 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !isComplianceAccepted}
                />
                <button
                  type="submit"
                  disabled={loading || !inputText.trim() || !isComplianceAccepted}
                  className="w-12 h-12 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 flex items-center justify-center shadow-md disabled:bg-stone-800 disabled:text-stone-600 disabled:grayscale transition cursor-pointer shrink-0"
                >
                  <Send className="w-5 h-5 text-stone-950 rotate-180" />
                </button>
              </form>
              
              {/* Disclaimer warning indicating that AI models may make errors */}
              <p className="text-[10px] text-stone-500 text-center font-sans mt-2.5 leading-relaxed max-w-2xl mx-auto">
                ⚠️ تنبيه إيماني: يستند هذا النظام إلى تقنيات الذكاء الاصطناعي التوليدي، وقد يصدر معلومات فقهية، تفسيرية، أو إملائية خاطئة أو غير دقيقة أحياناً. نوصي دائماً بمراجعة مصادر التفسير والعلماء المعتمدين بـ <strong>دائرة الإفتاء العام الأردنية</strong> 💡 للتحقق من صحة الأحكام والمسائل الشرعية. {onOpenCompliance && <button type="button" onClick={onOpenCompliance} className="text-amber-500/80 hover:text-amber-500 underline font-semibold focus:outline-none cursor-pointer">اقرأ شروط الخدمة وسياسة الخصوصية والاستخدام ⚖️</button>}
              </p>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
