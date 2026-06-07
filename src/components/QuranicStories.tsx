import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Sparkles, Search, MessageSquare, Send, ArrowRight, ArrowLeft, 
  HelpCircle, Lightbulb, Compass, Coins, Moon, Trees, Activity, Fish,
  EyeOff, Apple, ChevronLeft, ChevronRight, Check, Copy, Share2, Info, Loader
} from "lucide-react";
import { quranicStories, QuranicStory } from "../data/storiesData";
import ReactMarkdown from "react-markdown";

interface QuranicStoriesProps {
  isAr: boolean;
  trueNightMode: boolean;
  selectedStoryId: string | null;
  onClearSelectedStory: () => void;
  onNavigateToSurah: (surahNumber: number, verseNumber?: number) => void;
}

// Icon mapper helper
const getStoryIcon = (iconName: string) => {
  switch (iconName) {
    case "Apple": return <Apple className="w-5 h-5 text-amber-500" />;
    case "EyeOff": return <EyeOff className="w-5 h-5 text-teal-400" />;
    case "Fish": return <Fish className="w-5 h-5 text-rose-400" />;
    case "Compass": return <Compass className="w-5 h-5 text-emerald-400" />;
    case "Sparkles": return <Sparkles className="w-5 h-5 text-violet-400" />;
    case "Moon": return <Moon className="w-5 h-5 text-blue-400" />;
    case "Coins": return <Coins className="w-5 h-5 text-amber-500" />;
    case "ShieldAlert": return <BookOpen className="w-5 h-5 text-indigo-400" />;
    case "Trees": return <Trees className="w-5 h-5 text-cyan-400" />;
    case "Activity": return <Activity className="w-5 h-5 text-orange-400" />;
    case "Send": return <Send className="w-5 h-5 text-purple-400" />;
    default: return <BookOpen className="w-5 h-5 text-amber-500" />;
  }
};

export default function QuranicStories({
  isAr,
  trueNightMode,
  selectedStoryId,
  onClearSelectedStory,
  onNavigateToSurah
}: QuranicStoriesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStory, setSelectedStory] = useState<QuranicStory | null>(null);
  
  // AI Interactive state
  const [isPondering, setIsPondering] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync internal selectedStory with parent selectedStoryId
  useEffect(() => {
    if (selectedStoryId) {
      const found = quranicStories.find(s => s.id === selectedStoryId);
      if (found) {
        setSelectedStory(found);
        // Clear chat history when switching stories
        setChatHistory([]);
        // Smooth scroll to top for mobile layout focus
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [selectedStoryId]);

  // Scroll chat bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isPondering]);

  // Filter stories based on query
  const filteredStories = quranicStories.filter(story => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      story.titleAr.includes(query) ||
      story.titleEn.toLowerCase().includes(query) ||
      story.surahNameAr.includes(query) ||
      story.surahNameEn.toLowerCase().includes(query) ||
      story.narrativeAr.includes(query) ||
      story.narrativeEn.toLowerCase().includes(query) ||
      story.topic.includes(query)
    );
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const handleTriggerAIPonder = async (customPrompt?: string) => {
    if (!selectedStory) return;
    
    setIsPondering(true);
    const activePrompt = customPrompt || "";
    
    // Setup immediate message in history if it's a custom Q&A
    if (activePrompt) {
      setChatHistory(prev => [...prev, { role: "user", text: activePrompt }]);
      setUserQuestion("");
    }

    try {
      const response = await fetch("/api/ai/story-ponder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyTitle: selectedStory.titleAr,
          storyNarrative: selectedStory.narrativeAr,
          prompt: activePrompt || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Failed to consult AI");
      }

      const data = await response.json();
      const answer = data.result || (isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred.");
      
      setChatHistory(prev => [...prev, { role: "model", text: answer }]);
    } catch (error) {
      console.error("Story Ponder error:", error);
      const fallbackMsg = isAr 
        ? "⚠️ تعذر الاتصال بمحرك الذكاء الاصطناعي حالياً. يرجى التحقق من اتصال الإنترنت." 
        : "⚠️ Could not connect to AI engine. Check internet connection.";
      setChatHistory(prev => [...prev, { role: "model", text: fallbackMsg }]);
    } finally {
      setIsPondering(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Tab Header Banner */}
      <div className="text-center mb-8 flex flex-col items-center justify-center">
        <div className="bg-amber-600/10 border border-amber-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold font-sans text-amber-500">
            {isAr ? "ميزة ذكية مدعومة بالذكاء الاصطناعي والتدبر القرآني" : "AI-Powered Historical Reflection"}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-105 tracking-tight font-sans">
          {isAr ? "صندوق القصص وعبر الآيات القرآنية" : "Quranic Stories & Reflections"}
        </h1>
        <p className="max-w-2xl text-stone-400 text-sm md:text-base mt-2 font-sans font-medium">
          {isAr
            ? "استكشف قصص ومواقف الأنبياء والأمم الواردة بالتنزيل الحكيم، مع ربطها المباشر بموضع السور وعبر الآيات لتنتقل بسلاسة بين القراءة والتعلم."
            : "Explore the historic stories and wisdom of nations mentioned in the Quran, with seamless double-linkage directly into the Surah & verses."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedStory ? (
          // GRID STORIES LISTING
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Search Input */}
            <div className={`relative max-w-lg mx-auto w-full ${trueNightMode ? "bg-black/40" : "bg-stone-900/50"} p-1 rounded-2xl border border-stone-800`}>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none pr-3">
                <Search className="h-4 w-4 text-stone-500" />
              </div>
              <input
                type="text"
                placeholder={isAr ? "ابحث عن قصة، موضوع، سورة..." : "Search for a story, topic, Surah..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-transparent border-0 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-0 text-sm font-sans"
              />
            </div>

            {/* Quick Helper Banner */}
            <div className="flex items-center gap-3 bg-amber-550/10 border border-amber-500/10 p-4 rounded-2xl max-w-2xl mx-auto text-xs text-amber-400 font-sans">
              <Info className="w-5 h-5 shrink-0 text-amber-500" />
              <p>
                {isAr
                  ? "💡 يظهر زر «قصة الآية» تلقائياً بجانب الآيات في وضع القراءة عندما تمر بآية لها قصة مخصصة مثل آية العسل في التحريم أو ابن أم مكتوم في عبس أو أصحاب السبت في الأعراف."
                  : "💡 A 'Verse Story' button is shown directly in the Reader next to specific verses like the dispute in At-Tahrim or the blind man in Abasa."}
              </p>
            </div>

            {/* Grid display */}
            {filteredStories.length === 0 ? (
              <div className="text-center py-12 text-stone-550 border border-dashed border-stone-800 rounded-3xl font-sans text-sm">
                {isAr ? "لا توجد قصص مطابقة لمعايير البحث." : "No stories match your search keyword."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {filteredStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => {
                      setSelectedStory(story);
                      setChatHistory([]);
                      // Smooth scroll to top for mobile layout focus
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`group relative overflow-hidden rounded-3xl border border-stone-850 bg-stone-900/60 p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-amber-550 hover:bg-stone-900/85 hover:shadow-xl hover:shadow-amber-500/[0.03]`}
                  >
                    {/* Hover Glow Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300 from-amber-500 to-amber-900"></div>
                    
                    <div>
                      {/* Badge / Metadata row */}
                      <div className="flex items-center justify-between mb-4 flex-row">
                        <div className="flex items-center gap-2 bg-stone-950/70 border border-stone-800 px-3 py-1 rounded-full text-xs font-sans text-amber-500 font-semibold shadow-inner">
                          {getStoryIcon(story.icon)}
                          <span>{isAr ? `سورة ${story.surahNameAr}` : `Surah ${story.surahNameEn}`}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-bold bg-stone-950/40 px-2.5 py-1 rounded-md font-sans border border-stone-800/60">
                          {isAr ? `الآية ${story.verseRange}` : `Ayah ${story.verseRange}`}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors font-sans leading-snug">
                        {isAr ? story.titleAr : story.titleEn}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-stone-400 mt-2.5 line-clamp-3 font-sans leading-relaxed">
                        {isAr ? story.narrativeAr : story.narrativeEn}
                      </p>
                    </div>

                    {/* Bottom row actions */}
                    <div className="mt-6 pt-4 border-t border-stone-800/50 flex items-center justify-between flex-row">
                      <span className="text-[11px] text-[#c49a6c] font-bold font-sans flex items-center gap-1.5 group-hover:underline">
                        {isAr ? "اقرأ القصة والتدبر" : "Read Story & Reflect"}
                        {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                      <span className="text-[10px] text-stone-500 font-sans flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500/70" />
                        {isAr ? "متاح بالذكاء" : "AI ponder available"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // DETAILED STORY VIEW + AI CHAT COMPANION
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col lg:flex-row gap-6 items-start"
          >
            {/* Left Column: Text narrative, Surah redirect links, and Key lessons */}
            <div className="w-full lg:w-7/12 flex flex-col gap-6">
              
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedStory(null);
                  setChatHistory([]);
                  onClearSelectedStory();
                }}
                className="px-4 py-2 self-start rounded-full bg-stone-900 border border-stone-850 text-xs text-stone-300 font-sans font-bold flex items-center gap-2 hover:bg-stone-800 transition-all cursor-pointer shadow-md"
              >
                {isAr ? <ArrowRight className="w-4 h-4 text-amber-500" /> : <ArrowLeft className="w-4 h-4 text-amber-500" />}
                <span>{isAr ? "الرجوع لكافة القصص" : "Back to All Stories"}</span>
              </button>

              {/* Central Information Panel */}
              <div className={`p-4 sm:p-6 md:p-8 rounded-3xl border border-stone-850 ${trueNightMode ? "bg-black/40" : "bg-stone-900/40"} shadow-xl relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-stone-850 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-600/10 border border-amber-510/30 flex items-center justify-center shadow-md">
                      {getStoryIcon(selectedStory.icon)}
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-stone-105 font-sans leading-tight">
                        {isAr ? selectedStory.titleAr : selectedStory.titleEn}
                      </h2>
                      <p className="text-[11px] text-stone-450 mt-1 font-sans font-semibold">
                        {isAr ? `موضع الآيات: ${selectedStory.verseRange}` : `Ayahs Location: ${selectedStory.verseRange}`}
                      </p>
                    </div>
                  </div>

                  {/* DOUBLE LINKAGE: Redirect to exact Quran verse! */}
                  <button
                    onClick={() => onNavigateToSurah(selectedStory.surahNumber, selectedStory.triggerVerse)}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-sans text-stone-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5 cursor-pointer justify-center"
                    title={isAr ? "الانتقال لقراءة هذه السورة وتصفح الآيات مباشرة" : "Read relevant Surah & Verses directly"}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isAr ? `تصفح سورة ${selectedStory.surahNameAr} 📖` : `Read Surah ${selectedStory.surahNameEn} 📖`}</span>
                  </button>
                </div>

                {/* Topic focus summary */}
                <div className="text-xs text-[#c49a6c] bg-[#c49a6c]/10 border border-[#c49a6c]/15 px-4 py-2.5 rounded-2xl font-sans font-bold leading-relaxed mb-6">
                  {isAr ? `🔍 محور القصة: ${selectedStory.topic}` : `🔍 Core Subject: ${selectedStory.topic}`}
                </div>

                {/* Narrative text */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-stone-300 font-sans mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? "تفصيل ومجرى القصة" : "The Detailed Narrative"}</span>
                  </h4>
                  <p className="text-stone-200 text-sm md:text-base font-sans font-medium leading-relaxed bg-stone-950/20 p-4 rounded-2xl border border-stone-850/60 select-text">
                    {isAr ? selectedStory.narrativeAr : selectedStory.narrativeEn}
                  </p>
                </div>

                {/* Key Lessons / Takeaways */}
                <div>
                  <h4 className="text-sm font-bold text-stone-300 font-sans mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? "أهم المواعظ والدروس المستخلصة" : "Key Lessons & Moral Takeaways"}</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {(isAr ? selectedStory.lessonsAr : selectedStory.lessonsEn).map((lesson, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/30 flex items-start gap-3 text-xs md:text-sm font-sans font-medium text-stone-300"
                      >
                        <span className="w-6 h-6 shrink-0 rounded-full bg-amber-600/15 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{lesson}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: Interactive Gemini AI Companion Q&A */}
            <div className="w-full lg:w-5/12 flex flex-col gap-4">
              
              <div className={`w-full p-4 sm:p-5 rounded-3xl border border-stone-850 ${trueNightMode ? "bg-black/60" : "bg-stone-950/40"} shadow-xl flex flex-col min-h-[380px] sm:min-h-[500px] max-h-[650px]`}>
                
                {/* AI Chat Header */}
                <div className="flex items-center justify-between border-b border-stone-850 pb-3 flex-row mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-stone-200 font-sans">
                        {isAr ? "مرافق التدبر التفاعلي" : "Interactive Ponder Companion"}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-sans">
                        {isAr ? "تدبر ونقاش بالذكاء الاصطناعي" : "Pondering powered by Gemini"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-600/10 border border-emerald-500/15 px-2 py-0.5 rounded-full font-sans">
                    {isAr ? "متاح للدردشة" : "Ready"}
                  </span>
                </div>

                {/* Chat Message Window */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col justify-start">
                  
                  {chatHistory.length === 0 ? (
                    // WELCOME PROMPT CHIPS SCREEN
                    <div className="text-center py-6 flex flex-col items-center justify-center gap-4 my-auto">
                      <HelpCircle className="w-12 h-12 text-stone-700 stroke-1" />
                      <div className="px-4">
                        <p className="text-xs text-stone-400 font-sans font-semibold leading-relaxed">
                          {isAr 
                            ? "انقر على زر البداية أو اختر تساؤلاً مخصصاً لتشغيل مستنبط الذكاء الاصطناعي حول سياق وعبر القصة المباركة:" 
                            : "Click start or pick an inquiries below to generate tailored AI reflections for this story:"}
                        </p>
                      </div>

                      {/* Main Sparkles Action Button */}
                      <button
                        onClick={() => handleTriggerAIPonder()}
                        disabled={isPondering}
                        className="mt-2 text-xs font-bold font-sans text-white bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all py-2.5 px-5 rounded-full shadow-lg shadow-violet-600/10 flex items-center gap-2 cursor-pointer"
                      >
                        {isPondering ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                        )}
                        <span>{isAr ? "اقرأ تدبّر الذكاء الاصطناعي الشامل ✨" : "Get Complete AI Reflection ✨"}</span>
                      </button>

                      {/* Example Prompt Chips */}
                      <div className="w-full flex flex-col gap-2 px-2 mt-4 text-right" dir="rtl">
                        <span className="text-[10px] text-stone-500 font-bold self-start mr-2 select-none">
                          {isAr ? "۞ أسئلة تدبرية شائعة للقصة:" : "۞ Suggested Reflections:"}
                        </span>
                        
                        {[
                          isAr ? "ما هي الدروس النفسية والتربوية وفوائد تكرار هذه القصة؟" : "What are the core emotional & psychological benefits here?",
                          isAr ? "كيف يمكن إسقاط هذه العبرة القرآنية على سلوك عائلتي ومجتمعي؟" : "How should we apply this lesson to modern family life?",
                          isAr ? "أريد وصية قرآنية عملية للثبات مقتبسة من أحداث القصة." : "Provide an actionable life advice based on these events."
                        ].map((promptText, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTriggerAIPonder(promptText)}
                            disabled={isPondering}
                            className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-850 hover:border-violet-500/30 text-right text-stone-400 hover:text-stone-200 text-[11px] font-sans font-medium transition-all cursor-pointer leading-snug"
                          >
                            ⭐ {promptText}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // RENDER CHAT DIALOGUE
                    <div className="space-y-4">
                      {chatHistory.map((msg, idx) => (
                        <div 
                          key={idx}
                          className={`flex flex-col max-w-[90%] gap-1 ${
                            msg.role === "user" 
                              ? "self-end items-end ml-auto" 
                              : "self-start items-start mr-auto"
                          }`}
                        >
                          {/* Sender Identity Badge */}
                          <div className="flex items-center gap-1.5 text-[9px] text-stone-500 font-bold font-sans">
                            {msg.role === "user" ? (
                              <span>{isAr ? "سؤالك" : "Your Question"}</span>
                            ) : (
                              <div className="flex items-center gap-1 text-violet-400">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{isAr ? "مستنبط التدبر" : "Ponder Engine"}</span>
                              </div>
                            )}
                          </div>

                          {/* Message Content Bubble */}
                          <div 
                            className={`p-3 md:p-4 rounded-2xl text-xs md:text-sm font-sans font-semibold leading-relaxed relative group ${
                              msg.role === "user"
                                ? "bg-stone-800 text-stone-105 rounded-br-none border border-stone-750"
                                : "bg-violet-950/20 text-[#eddfff] border border-violet-900/30 rounded-bl-none text-right"
                            }`}
                          >
                            {msg.role === "model" ? (
                              <div className="markdown-body select-text space-y-2">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                              </div>
                            ) : (
                              <span className="select-text whitespace-pre-wrap">{msg.text}</span>
                            )}

                            {/* Copy bubble content button */}
                            <button
                              onClick={() => handleCopyText(msg.text, `chat-${idx}`)}
                              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 p-1 rounded bg-stone-950/60 text-stone-400 hover:text-stone-100 transition-all shrink-0 cursor-pointer"
                              title="نسخ هذه الفقرة"
                            >
                              {copiedTextId === `chat-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Loading/Pondering state */}
                      {isPondering && (
                        <div className="flex flex-col gap-1 self-start items-start max-w-[85%] mr-auto">
                          <div className="flex items-center gap-1 text-[9px] text-stone-500 font-bold font-sans">
                            <Sparkles className="w-2.5 h-2.5 text-violet-400 animate-pulse" />
                            <span>{isAr ? "المرشد التفسيري الذكي يستحضر الهدي" : "AI is writing reflection"}</span>
                          </div>
                          <div className="p-3.5 bg-violet-950/10 border border-violet-900/20 text-stone-400 rounded-2xl rounded-bl-none flex items-center gap-2.5">
                            <svg className="animate-spin h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs font-sans text-stone-450 font-semibold animate-pulse">
                              {isAr ? "يتدبّر الآيات الكريمة ويكتب الاستجابة..." : "Contemplating the verses, writing message..."}
                            </span>
                          </div>
                        </div>
                      )}

                      <div ref={chatBottomRef}></div>
                    </div>
                  )}

                </div>

                {/* Interactive Q&A chat input box */}
                {chatHistory.length > 0 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!userQuestion.trim() || isPondering) return;
                      handleTriggerAIPonder(userQuestion);
                    }}
                    className={`relative flex items-center rounded-2xl border border-stone-800 ${trueNightMode ? "bg-black/50" : "bg-stone-900/50"} p-1.5`}
                  >
                    <input
                      type="text"
                      placeholder={isAr ? "اسأل مرشدك الذكي عن تفاصيل أو إرشاد بالقصة..." : "Ask AI details about this story lessons..."}
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      disabled={isPondering}
                      className="flex-1 bg-transparent border-0 py-2.5 px-3 hover:bg-transparent focus:outline-none text-xs md:text-sm text-stone-200 placeholder-stone-500"
                    />
                    <button
                      type="submit"
                      disabled={isPondering || !userQuestion.trim()}
                      className="p-2 rounded-xl bg-violet-600 text-stone-105 hover:bg-violet-500 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all cursor-pointer shadow-md"
                      title="إرسال سؤالك للذكاء الاصطناعي"
                    >
                      <Send className="w-3.5 h-3.5 text-stone-105" />
                    </button>
                  </form>
                )}

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
