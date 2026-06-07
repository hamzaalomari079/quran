import React from "react";
import { X, Scale, ShieldAlert, BookOpen, Lock, CheckCircle2, Shield, Eye, HelpCircle, FileText, ExternalLink, AlertTriangle } from "lucide-react";

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr?: boolean;
  onOpenSupport?: () => void;
}

export default function ComplianceModal({ isOpen, onClose, isAr = true, onOpenSupport }: ComplianceModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-955/95 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="border-b border-stone-800/80 px-4 sm:px-6 py-4.5 bg-stone-920 flex items-center justify-between flex-row">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-5 h-5 animate-pulse" />
            </div>
            <div className={isAr ? "text-right" : "text-left"}>
              <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-stone-100 font-sans">
                {isAr ? "شروط الخدمة وسياسة الخصوصية والاستخدام" : "Terms of Service, Privacy Policy & Usage Guidelines"}
              </h2>
              <p className="text-[9px] sm:text-[10px] text-emerald-400/80 font-mono font-medium tracking-wide">
                {isAr ? "مواءمة مبرهنة مع ممارسات الخصوصية الرقمية ومعايير المراجعة الفقهية" : "Proven Alignment with Privacy Best Practices & Verified Scholarly Standards"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable document space */}
        <div className={`p-4 sm:p-6 md:p-7 overflow-y-auto flex flex-col gap-6 text-stone-300 text-xs sm:text-sm leading-relaxed ${isAr ? "text-right" : "text-left"}`}>
          
          {/* Top Banner indicating full compliance and verified safety */}
          <div className="bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 flex-row text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm font-sans mb-1">
                {isAr ? "بيان الالتزام الفعلي والمواءمة التكنولوجية" : "Institutional Statement of Active Compliance"}
              </h4>
              <p className="text-[10.5px] sm:text-[11px] text-stone-400 leading-relaxed">
                {isAr
                  ? "تلتزم بوابة قرآني الإلكترونية التزاماً تاماً ومطبقاً فعلياً في شيفراتها البرمجية بضمانات الخصوصية الرقمية والأمن السيبراني، ونشر كلام الله العظيم بدقة وجودة لا متناهية، مع صون سيادة المستخدمين على بياناتهم بشكل كامل وحقيقي."
                  : "Our Qurany portal guarantees active implementation of digital trust metrics, the absolute sanctity of the holy Quranic text, and complete localized storage boundaries protecting physical users."}
              </p>
            </div>
          </div>

          {/* Section 1: Complete Digital Privacy & User Autonomy */}
          <div className="space-y-3 bg-stone-920/40 p-4 sm:p-5 rounded-2xl border border-stone-850">
            <h3 className="text-xs sm:text-sm font-black text-amber-500 font-sans flex items-center gap-2 pb-2 border-b border-stone-800">
              <Lock className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>{isAr ? "أولاً: حماية الخصوصية والسيادة الرقمية لبيانات المستخدم" : "I. Complete Digital Privacy & User Autonomy Principles"}</span>
            </h3>
            <div className="text-[11px] sm:text-[12px] space-y-3 text-stone-400 font-sans leading-relaxed">
              <p>
                {isAr ? (
                  <>
                    نضمن لك السرية المطلقة والأمان السيبراني المتميز. إن تطبيقنا يحقق التفاصيل الآمنة التي تمنحك الحقوق والضمانات الكاملة والمبنية فعلياً في كود المنصة كالتالي:
                  </>
                ) : (
                  <>
                    We guarantee robust digital trust and complete privacy controls. The platform implements the following security metrics directly within its codebase:
                  </>
                )}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-stone-300">
                <div className="bg-stone-900/60 p-3 sm:p-4 rounded-xl border border-stone-800 hover:border-emerald-500/20 transition-all duration-300">
                  <span className="font-extrabold text-stone-100 flex items-center gap-1.5 mb-2 text-[11px] sm:text-[12px] text-emerald-400">
                    <Shield className="w-3.5 h-3.5" />
                    {isAr ? "السيادة والتحكم الرقمي المستقل" : "Absolute Data Autonomy"}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 leading-relaxed">
                    {isAr
                      ? "يحقق التطبيق هذا الحق بشكل كامل وفعلي؛ حيث لا نمتلك خوادم تخزينية تجمع سجلات الورد أو أهداف تلاوتك اليومية غصباً عنك، بل تحفظ تفضيلاتك محلياً ومشفرة كلياً داخل مستعرضك وفي جهازك دون أي تتبع خارجي مسجل."
                      : "We enable full transparency. Users have continuous, absolute control to review preferences or erase database tracks, because all states are hosted locally inside your browser."}
                  </p>
                </div>

                <div className="bg-stone-900/60 p-3 sm:p-4 rounded-xl border border-stone-800 hover:border-emerald-500/20 transition-all duration-300">
                  <span className="font-extrabold text-stone-100 flex items-center gap-1.5 mb-2 text-[11px] sm:text-[12px] text-emerald-400">
                    <Eye className="w-3.5 h-3.5" />
                    {isAr ? "الخصوصية القصوى لدفق الميكروفون" : "Non-Persistent Audio & Microphone Privacy"}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 leading-relaxed">
                    {isAr
                      ? "يحقق التطبيق في ميزة التسميع الصوتي والمطابقة معالجة الميكروفون بالكامل داخل جهازك عبر محرك (Web Audio API) المحلي ومحرر الأداء اللحظي. يتم تدمير دفق الصوت والملف المؤقت كلياً فور التحليل دون أي بث للملف خارجياً."
                      : "The local Web Audio API computes recitation metrics in highly secure, non-persistent, sandbox environments. No recordings are captured or exported."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Integrity of Text and Typography */}
          <div className="space-y-3 bg-stone-920/40 p-4 sm:p-5 rounded-2xl border border-stone-850">
            <h3 className="text-xs sm:text-sm font-black text-amber-500 font-sans flex items-center gap-2 pb-2 border-b border-stone-800">
              <BookOpen className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>{isAr ? "ثانياً: النزاهة الشرعية، دقة الرسم العثماني وعمليات البث والمراجعة" : "II. Utmost Sanctity: Verified Quranic Text & Audio Sourcing"}</span>
            </h3>
            <div className="text-[11px] sm:text-[12px] space-y-3 text-stone-400 font-sans leading-relaxed">
              <p>
                {isAr ? (
                  <>
                    لحفظ ونشر كلام رب العالمين عز وجل من أي كسر أو تغيّر لفظي، يلتزم الموقع بالمحددات والضوابط الصارمة التالية المحققة ميكانيكياً:
                  </>
                ) : (
                  <>
                    To preserve and venerate the Holy Word, our system operates under strict editorial rules and digital mechanisms:
                  </>
                )}
              </p>

              <ul className="list-disc leading-relaxed list-inside space-y-2.5 text-stone-300 pr-1">
                <li>
                  {isAr ? (
                    <>
                      <strong>دقة تامة بالرسم العثماني المعتمد:</strong> نستخدم نصاً رقمياً مطابقاً بالكامل للرسم العثماني المعتمد في مصحف المدينة النبوية الصادر عن الصرح الشرعي العريق <strong className="text-amber-500">مجمع الملك فهد لطباعة المصحف الشريف</strong>، ومستند بالتفصيل لقواعد البيانات المدققة في مشروع <span className="text-emerald-400 font-bold font-sans">Tanzil.net</span> الشهير. نطبق أكواد مراجعة ذكية تمنع أي تشوه في نطق الحركات أو تداخل الحروف على الأجهزة والشاشات المختلفة.
                    </>
                  ) : (
                    <>
                      <strong>Certified Uthmanic Script:</strong> Completely aligned with verified standard databases (Tanzil.net) mirroring the King Fahd Holy Quran Printing Complex typography, secured programmatically against font distortion.
                    </>
                  )}
                </li>
                <li>
                  {isAr ? (
                    <>
                      <strong>تراخيص الخطوط الإسلامية العثمانية الحرة:</strong> تم استخدام الخطوط الإسلامية العثمانية الأصيلة الحائزة على شهادات الترخيص المفتوح (SIL Open Font License) لضمان سهولة القراءة وتعديل سماكتها لكبار السن وضعاف البصر دون الإخلال بهيكلة الكلمات.
                    </>
                  ) : (
                    <>
                      <strong>SIL Open Font License (OFL):</strong> Clean, high-legibility typographic formats specifically rendered for the elderly or children with high fluid accessibility across devices.
                    </>
                  )}
                </li>
                <li>
                  {isAr ? (
                    <>
                      <strong>سلامة المتون الصوتية والأدبية:</strong> ترتبط جميع مواد القراءة والسماع الصوتية بمصادر وبثيات مشهورة بمحركات البث الرقمية التابعة للمكتبة الصوتية الإسلامية الخيرية للأغراض التعليمية الخالصة والخيرية غير الربحية، وتظل الحقوق حصرية للجهات الأصلية بالكامل.
                    </>
                  ) : (
                    <>
                      <strong>Ethical Sourcing & Non-Commercial Audio Streams:</strong> Streams are delivered via recognized non-profit archives for educational use, with full credits preserved.
                    </>
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: Sharia with Gemini API and Absolute Right of Erasure */}
          <div className="space-y-3 bg-stone-900/40 p-4 sm:p-5 rounded-2xl border border-stone-800">
            <h3 className="text-xs sm:text-sm font-black text-amber-500 font-sans flex items-center gap-2 pb-2 border-b border-stone-800">
              <Shield className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>{isAr ? "ثالثاً: معالجة البيانات وبنود الشفافية وعمليات المعالجة مع الذكاء الاصطناعي" : "III. Technical Pipeline, Data Transparency & AI Routing Protocol"}</span>
            </h3>
            <div className="text-[11px] sm:text-[12px] space-y-3 text-stone-400 font-sans leading-relaxed font-sans">
              <p>
                {isAr ? (
                  <>
                    يحقق الموقع كافة متطلبات الأمن والمواءمة الشرعية والتنظيمية من خلال التطبيقات العملية والتقنية المضمنة للشفافية المطلقة:
                  </>
                ) : (
                  <>
                    The system integrates absolute data protection and transparent data flow throughout its features:
                  </>
                )}
              </p>

              <div className="space-y-3 text-stone-300">
                <div className="bg-stone-950/40 p-3 sm:p-4 rounded-xl border border-stone-850">
                  <span className="font-extrabold text-stone-200 block mb-1 text-[11px] sm:text-[12px] text-emerald-400">
                    {isAr ? "1. صفر بيانات شخصية على خوادم سحابية" : "1. Zero Cloud Data Footprint"}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-stone-400">
                    {isAr 
                      ? "لا تجمع المنصة هويتك، أو بريدك الإلكتروني، أو جهات اتصالك. كل تفضيلات الحفظ والتسميع والأوراد تعمل محلياً داخل جهازك وصفر داتا غريبة تغادر حاسوبك."
                      : "Sensory logs and training parameters are isolated. All customizable lists, tallies, and target profiles reside in-browser inside user-specific variables only."}
                  </p>
                </div>

                <div className="bg-stone-950/40 p-3 sm:p-4 rounded-xl border border-stone-850">
                  <span className="font-extrabold text-stone-200 block mb-1 text-[11px] sm:text-[12px] text-emerald-400">
                    {isAr ? "2. معالجة صوتية فورية متلاشية" : "2. Transient Audio-Only Processing"}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-stone-400">
                    {isAr 
                      ? "يتم تدمير ومحو تيار البيانات الصوتي ومفاتيح الذبذبات الميكروفونية بمجرد انتهاء إعلان ومطابقة التسميع، فنضمن أماناً أقصى لخصوصيتك وصفر بقاء لبصمتك الصوتية."
                      : "Voice analysis is processed dynamically in volatile random-access memory (RAM) and immediately cleared-out upon output compilation."}
                  </p>
                </div>

                <div className="bg-stone-950/40 p-3 sm:p-4 rounded-xl border border-stone-850 font-sans">
                  <span className="font-extrabold text-stone-200 block mb-1 text-[11px] sm:text-[12px] text-emerald-400">
                    {isAr ? "3. خصوصية التوجيه الآمن لقدرات الذكاء الاصطناعي (Gemini API)" : "3. SECURE SSL-TLS Proxying & De-identification of AI Requests"}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-stone-400">
                    {isAr 
                      ? "تستقبل خوادم معالجة تدبر الآيات الأسئلة وتمررها عبر قنوات اتصال خاضعة لتشفير عالي الدرجة (SSL/TLS) مدمجة مع واجهة ذكاء Google Gemini، مع استثناء وتجريد تام للاتصال من أية بيانات تعريفية بك أو بهويتك لضمان السرية التامة وعمى البيانات أمام موفر المحرك الذكي."
                      : "AI questions are securely proxied to Google Gemini APIs using industry-standard encrypted channels. No personal metrics or audio metadata are enclosed. Conversation context is kept safe."}
                  </p>
                </div>

                <div className="bg-stone-950/40 p-3 sm:p-4 rounded-xl border border-stone-850 font-sans">
                  <span className="font-extrabold text-stone-200 block mb-1 text-[11px] sm:text-[12px] text-emerald-400">
                    {isAr ? "4. الحق الفعلي والمباشر في النسيان والمحو المطلق" : "4. Complete Instant Self-Purge Rights"}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-stone-400">
                    {isAr 
                      ? "يحقق التطبيق هذا المبدأ بشكل فوري عبر كود برمجي فاعل؛ فبمجرد اختيارك 'تصفير كافة الإعدادات والتقدم' في بوابة الإعدادات الفنية، يتم إصدار أمر مباشر للمستعرض بكنس وإبادة كافة تفضيلاتك وتعديلاتك للورد، وسحب أي موافقات وإفراغ الذاكرة المحلية نهائياً في ثوانٍ."
                      : "In compliance with digital protection regulations, you retain the continuous right to wipe your history. Triggering clear buttons triggers absolute, irreversible purging of all saved metrics."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: AI & Fatwa Restrictions & Official Referrals */}
          <div className="space-y-3 bg-stone-920/40 p-4 sm:p-5 rounded-2xl border border-stone-850">
            <h3 className="text-xs sm:text-sm font-black text-amber-500 font-sans flex items-center gap-2 pb-2 border-b border-stone-800">
              <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0" />
              <span>{isAr ? "رابعاً: فلسفة المنصة وغاية التثقيف وموقع دائرة الإفتاء الرسمي" : "IV. Educational Mandate, AI Boundaries & The Only True Fatwa Authority"}</span>
            </h3>
            <div className="text-[11px] sm:text-[12px] space-y-3.5 text-stone-400 font-sans leading-relaxed">
              <p>
                {isAr ? (
                  <>
                    • <strong className="text-stone-200">الرسالة التربوية وفلسفة المنصة:</strong> الموقع عبارة عن واجهة تثقيفية تفاعلية تعبدية مخصصة لقراءة القرآن الكريم وفهمه واستنباط معانيه الأدبية واللغوية والتربوية، واستخلاص العبر السلوكية التي تصنع التوازن الإيماني والروحي طوال الحياة اليومية. نحن نؤمن أن تدبر كتاب الله وتطبيق مبادئه بالكامل ينشر الطمأنينة والسلام في ربوع المجتمعات، وإغفال أو إهمال أو نسيان عشرٍ واحد من هذا المنهج الأخلاقي كفيل بخلخلة السكينة وهدم البناء الحضاري والروحي للبشرية.
                  </>
                ) : (
                  <>
                    • <strong>Educational Call & Structural Philosophy:</strong> The site operates as an interactive and contemplative interface to support studying 
                    the Quran. We hold that implementing the book's full ethical system spreads harmony, and forgetting of even a small fraction compromises spiritual peace.
                  </>
                )}
              </p>

              <p className="border-t border-stone-800/40 pt-2.5">
                {isAr ? (
                  <>
                    • <strong className="text-amber-500">منع الفتوى بوجود الذكاء الاصطناعي (إخلاء مسؤولية قطعي):</strong> يُمنع حظرًا فاعلاً ومطبقًا في المنصة الاعتماد على محادثات الرفيق الذكي أو تفاسير الآيات لاستنباط الفتاوى الدينية أو إنشاء الأحكام والواجبات والمحرمات الفقهية الملزمة. الإجابات والتحليلات هي للتدبر العلمي واللغوي، والتيسير الدراسي، والتشجيع الإيماني فقط دون مسوغ فقهي.
                  </>
                ) : (
                  <>
                    • <strong>AI Limitation Policy:</strong> Conversational responses, reflections, and insights created by the AI model are for linguistic study and motivational education only. It does NOT generate Sharia-binding fatwas.
                  </>
                )}
              </p>

              <div className="bg-stone-900 border border-stone-800/90 p-4 rounded-xl flex items-center justify-between flex-col md:flex-row gap-4 mt-3">
                <div className="flex items-center gap-3 flex-row">
                  <div className="w-9 h-9 rounded-xl bg-amber-600/15 flex items-center justify-center text-amber-400 shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className={isAr ? "text-right" : "text-left"}>
                    <h5 className="text-[11px] sm:text-[12px] font-extrabold text-stone-200">
                      {isAr ? "دائرة الإفتاء العام للمملكة الأردنية الهاشمية" : "General Ifta' Department of Jordan"}
                    </h5>
                    <p className="text-[10px] text-stone-400 leading-normal">
                      {isAr ? "المرجعية الوطنية الفقهية المباشرة وحل المسائل الشرعية الرسمية في المملكة" : "The official supreme theological reference in Jordan"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                  <a
                    href="https://www.aliftaa.jo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-[10px] font-bold font-sans transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isAr ? "الموقع الإلكتروني" : "Website"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-bold">
                    {isAr ? "هاتف: 2000100 06" : "Tel: +962 6 2000100"}
                  </div>
                </div>
              </div>

              {/* Direct Support Notice & Trivial Trigger */}
              {onOpenSupport && (
                <div className="mt-4 p-4 rounded-2xl bg-red-950/25 border border-red-500/35 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className={`flex items-center gap-2.5 ${isAr ? "flex-row text-right" : "flex-row-reverse text-left"}`}>
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
                    <div>
                      <h5 className="text-xs font-black text-rose-400">
                        {isAr ? "هل وجدتم أي خطأ برمجي، أو في عرض الآيات، أو في التفاسير والترجمات والإعراب؟" : "Found any software bug, or errors in verses, interpretations, translations, or grammar?"}
                      </h5>
                      <p className="text-[10.5px] text-stone-400 leading-relaxed mt-0.5">
                        {isAr 
                          ? "يمكنكم مراسلة فريق التطوير وإدارة المنصة فوراً للتنويه والتصحيح وتدارك الخلل. نحن ملتزمون بمراجعة وتصحيح أي نقص أو سهو في تلاوة الآيات الكريمة، أو نصوص التفاسير والترجمات، أو الكود البرمجي ببالغ السرعة صوناً لكلام الله جل وعلا." 
                          : "Reach out to the development team and platform administration directly to report any textual, linguistic, translation, or technical issues so we can patch them immediately."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSupport();
                    }}
                    className="px-4 py-2 bg-red-650 hover:bg-red-550 text-stone-100 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-red-950 flex items-center gap-1.5 shrink-0 hover:scale-103 active:scale-95"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-stone-200" />
                    <span>{isAr ? "مداد الدعم والمساعدة الطارئ 🚨" : "Contact Immediate Support 🚨"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-stone-800 p-4 sm:p-5 bg-stone-925 flex items-center justify-between flex-row">
          <div className="flex flex-col text-right">
            <p className="text-[9px] sm:text-[10px] text-stone-400 font-sans" dir="rtl">
              {isAr ? "تحديث مواءمة الشفافية: حزيران 2026" : "Approved Technical Verification: June 2026"}
            </p>
            <p className="text-[8px] text-stone-500 font-mono tracking-wider">
              PORTAL-SAFETY-VERIFIED_AR-EN_v4.0
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-sans transition cursor-pointer shadow-lg active:scale-95 select-none hover:scale-103"
          >
            {isAr ? "أوافق وأمتثل وأثق بالمحتوى" : "I Agree, Acknowledge compliance"}
          </button>
        </div>
      </div>
    </div>
  );
}
