import React, { useState } from "react";
import { 
  Heart, 
  Lock, 
  Globe, 
  Sparkles, 
  Server, 
  Bell, 
  ExternalLink, 
  Info, 
  FileText, 
  Check, 
  Copy, 
  BookOpen, 
  Compass, 
  HelpCircle 
} from "lucide-react";

interface DonationSectionProps {
  currentLang: "ar" | "en";
}

export default function DonationSection({ currentLang }: DonationSectionProps) {
  const isAr = currentLang === "ar";
  const [copied, setCopied] = useState(false);
  const paypalEmail = "support@quranapp.org";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(paypalEmail);
    setCopied(true);
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  // Website features
  const features = [
    {
      icon: Lock,
      titleAr: "خالٍ تماماً من الإعلانات التجارية",
      titleEn: "100% Free of Commercial Ads",
      descAr: "احتراماً لقدسية ومقام كلام الله عز وجل، لا نعرض أي إعلانات تجارية ولا نوافذ منبثقة للربح المادي أبداً.",
      descEn: "Out of absolute reverence for the Holy Quran, we never show commercial ads, promotional banners, or popups.",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    },
    {
      icon: Globe,
      titleAr: "خصوصية مطلقة وأمان بنسبة 100%",
      titleEn: "Complete Privacy & Safety Guaranteed",
      descAr: "لا نقوم بتتبع تصفحك، ولا جمع بياناتك الشخصية، ولا بيع ملفات الأنشطة الإيمانية الخاصة بك لأي جهات.",
      descEn: "We do not track your reading habits, collect personal information, or monetize user data. Complete confidentiality.",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      icon: Sparkles,
      titleAr: "مساعد التدبر ورفيق التلاوة بالذكاء الاصطناعي",
      titleEn: "Smart Spiritual Companion with AI",
      descAr: "توفير أدوات ذكية معاصرة تدعمك بالتشابهات اللفظية، وبأسباب النزول، وتبسيط قراءة التفاسير بمستويات فائقة الدقة.",
      descEn: "Features a tailored AI Spiritual assistant to deliver deep contextual tafsir and link similar verses dynamically.",
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      icon: Server,
      titleAr: "سرعة سحابية فائقة مع دعم التصفح أوفلاين",
      titleEn: "Ultra-fast Speed & Full Offline Support",
      descAr: "تقنيات تم تحسينها لتقدم تلاوات صوتية فورية وقراءات مريحة وتصفحاً سحابياً لا ينقطع حتى في حال عدم توفر الإنترنت.",
      descEn: "Fully optimized architectures for low-latency server loads, comfortable offline storage, and quick reading anywhere.",
      color: "text-[#c49a6c] bg-[#c49a6c]/10 border-[#c49a6c]/20"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      
      {/* Decorative Top Logo & Header */}
      <div className="flex flex-col items-center text-center gap-3 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-[#c49a6c]/10 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-stone-950/20">
          <Compass className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-amber-500 font-sans tracking-tight pt-1">
          {isAr ? "نبذة عن الموقع" : "About the Platform"}
        </h2>
        <p className="text-xs text-stone-400 font-sans max-w-xl leading-relaxed text-balance">
          {isAr 
            ? "تعرف على الرؤية التي تقف خلف منصة قُرْآني، والأهداف التي نسعى لتحقيقها لخدمة كتاب الله الحكيم مجاناً وبلا إعلانات."
            : "Explore the core vision behind Qurany platform, and our goals in serving the Holy Quran completely free of ads."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        
        {/* Left Column: About & Why (نبذة ولماذا) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Section 1: Overview */}
          <div className="bg-stone-900/60 border border-stone-850 rounded-3xl p-6 relative overflow-hidden shadow-md">
            <div className={`flex items-center gap-2.5 mb-3 border-b border-stone-850 pb-3 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-stone-200 font-sans">
                {isAr ? "نبذة عن منصة قُرْآني" : "About Qurany"}
              </h3>
            </div>
            
            <p className={`text-xs text-stone-300 font-sans leading-relaxed ${isAr ? "text-right" : "text-left"}`}>
              {isAr 
                ? "منصة «قُرْآني» الإلكترونية هي معلم رقمي متكامل مُصمّم ليقربك من كلام الله جل وعجل، وتسهيل تلاوته وتدبر معانيه الرفيقة. تم بناء البوابة بأحدث المعايير البرمجية للسرعة الفائقة وحسن الخط والأداء، لتكون رفيقاً إيمانياً صافياً متاحاً في أي وقت."
                : "«Qurany» is a consolidated digital sanctuary crafted to connect readers closer to the Word of Allah, facilitating swift recitation and deep reflection (Tadabbur). Rigorously optimized for low latency and pure beautiful typography, it serves as your lightweight spiritual assistant on any device."}
            </p>
          </div>

          {/* Section 2: Why? */}
          <div className="bg-stone-900/60 border border-stone-850 rounded-3xl p-6 relative overflow-hidden shadow-md">
            <div className={`flex items-center gap-2.5 mb-3 border-b border-stone-850 pb-3 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-stone-200 font-sans">
                {isAr ? "لماذا قُرْآني وعلامَ نرتكز؟" : "Why Qurany & Our Core Focus"}
              </h3>
            </div>
            
            <p className={`text-xs text-stone-300 font-sans leading-relaxed ${isAr ? "text-right" : "text-left"}`}>
              {isAr 
                ? "لاحظنا كثرة الإعلانات واللافتات التجارية الموجهة للربح المادي في جل تطبيقات ومواقع القرآن بمختلف المتاجر، مما يشوش التركيز البصري والذهني أثناء التدبر. وجاء «قُرْآني» هبةً صالحةً مجاناً بنسبة 100٪ بدون ربح مالي ولا إعلانات، احتراماً وصوناً لهيبة المصحف الشريف وأمان الخلود الديني."
                : "We built Qurany to restore absolute focus. Most modern religious apps are heavily cluttered with commercial banners or revenue tracking that detracts from the spiritual sanctuary of the Quran. Qurany represents a clean alternative: entirely ad-free, respects your privacy, and runs efficiently with zero business motive."}
            </p>
          </div>

        </div>

        {/* Right Column: Platform Features (ميزات الموقع) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className={`flex items-center gap-2 mb-2 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <h3 className="text-xs font-black text-[#c49a6c] uppercase tracking-wider font-sans">
              {isAr ? "ميزات وخصائص التجربة الرقمية" : "Key Pillars Of Qurany"}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={idx} 
                  className={`bg-stone-900/40 border border-stone-850/80 rounded-2xl p-4 flex gap-4 transition-all duration-300 hover:border-amber-500/10 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${feat.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-stone-200 font-sans">
                      {isAr ? feat.titleAr : feat.titleEn}
                    </span>
                    <span className="text-[10.5px] text-stone-400 font-sans leading-relaxed">
                      {isAr ? feat.descAr : feat.descEn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer Donation Card Widget (قسم التبرع للموقع - غير تفاعلي بسيط) */}
      <div className="w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl shadow-stone-950/40">
        
        {/* Ambient glow decoration */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center max-w-xl mx-auto text-center gap-4">
          
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Heart className="w-5 h-5 fill-amber-500/10" />
          </div>

          <h3 className="text-lg font-black text-amber-500 font-sans">
            {isAr ? "تبرع واستمرارية الموقع" : "Support & Sustainability"}
          </h3>

          <p className="text-xs text-stone-300 font-sans leading-relaxed">
            {isAr 
              ? "هذا الموقع غير ربحي وخالٍ تماماً من الإعلانات حفاظاً على جلال كتاب الله. استمرار هذه الخدمة المباركة وتوفير خوادم الاستضافة وقواعد تدبر الآيات يعتمد على تيسير الله ثم مساهمة الأوفياء."
              : "This project is fully non-profit and ad-free to protect the reading sanitation of the Quran. Keeping servers online and continuing to power our AI database features relies entirely on kind contributions."}
          </p>

          {/* Simple Email Donation Block */}
          <div className="w-full bg-stone-950/70 border border-stone-850 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className={`flex flex-col gap-1 ${isAr ? "text-right" : "text-left"} w-full sm:w-auto`}>
              <span className="text-[10px] text-stone-500 font-bold font-sans uppercase tracking-wider">
                {isAr ? "بريد حساب بايبال للتبرع" : "PayPal Donation Receiver Email"}
              </span>
              <span className="text-xs font-mono text-stone-200 font-extrabold select-all">
                {paypalEmail}
              </span>
            </div>

            <button
              onClick={handleCopyEmail}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-550/20 text-stone-300 hover:text-amber-500 transition-all font-sans text-xs font-bold flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              title={isAr ? "نسخ بريد PayPal" : "Copy PayPal Email"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? "تم النسخ" : "Copied"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? "نسخ البريد الإلكتروني" : "Copy Email"}</span>
                </>
              )}
            </button>
          </div>

          {/* Direct Paypal Link Button */}
          <a
            href={`https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${encodeURIComponent(paypalEmail)}&currency_code=USD&item_name=Qurany%20Digital%20Platform%20Sponsorship`}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-450 active:scale-[0.99] text-stone-950 font-black text-xs md:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-500/10"
          >
            <span>{isAr ? "الانتقال السريع للدفع عبر PayPal الشامل" : "Go to PayPal to Send Funds Directly"}</span>
            <ExternalLink className="w-4 h-4 text-stone-950 shrink-0" />
          </a>

          <p className="text-[10px] text-stone-500 font-sans italic">
            {isAr
              ? "۞ تقبل الله منكم صالح الأعمال وكتبها لكم صدقة جارية مستمرة في ميزان حسناتكم."
              : "۞ May Allah accept your righteous actions and write it as a continuous charity in your balance."}
          </p>

        </div>

      </div>

    </div>
  );
}
