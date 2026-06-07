import React, { useState } from "react";
import { Download, X, Sparkles, Chrome, CheckCircle, Share, QrCode, Smartphone, Plus, Menu, ArrowUpFromLine, Layers } from "lucide-react";

interface PWAInstallGatewayProps {
  isAr: boolean;
  deferredPrompt: any;
  isIOS: boolean;
  onInstallSuccess?: () => void;
  showAsModalOnly?: boolean;
  onClose?: () => void;
}

export default function PWAInstallGateway({
  isAr,
  deferredPrompt,
  isIOS,
  onInstallSuccess,
  showAsModalOnly = false,
  onClose,
}: PWAInstallGatewayProps) {
  const [isOpen, setIsOpen] = useState(showAsModalOnly);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"install" | "qr">("install");

  const appUrl = window.location.origin;
  // Live QR Code utilizing QR Server API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}&color=d97706&bgcolor=1c1917&margin=15`;
  const printableQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(appUrl)}`;

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleTriggerPWAInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      if (outcome === "accepted") {
        if (onInstallSuccess) {
          onInstallSuccess();
        }
        handleClose();
      }
    } catch (err) {
      console.error("Installation call encountered an error:", err);
    }
  };

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.href = printableQrImageUrl;
    link.target = "_blank";
    link.download = "qurany-app-qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAppUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      {/* 1. Main inline teaser card (Not rendered if showAsModalOnly is active) */}
      {!showAsModalOnly && (
        <div className="bg-gradient-to-br from-amber-950/20 to-stone-900/90 border border-amber-500/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden group shadow-lg shadow-amber-950/10 hover:border-amber-500/35 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          
          <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 ${isAr ? "md:flex-row-reverse" : ""}`}>
            <div className={`flex items-start gap-4 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
              {/* Responsive App icon placeholder */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 flex items-center justify-center shrink-0 shadow-lg select-none hover:scale-105 transition-transform duration-300">
                <img 
                  src="/icon.png" 
                  alt="Qurany Icon" 
                  className="w-full h-full object-cover rounded-[10px]"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div>
                <div className={`flex items-center gap-1.5 flex-wrap ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase font-sans font-bold px-1.5 py-0.5 rounded">
                    {isAr ? "تطبيق الهاتف والويب" : "Web App / PWA"}
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-stone-100 font-sans">
                    {isAr ? "تثبيت مصحف قرآني كأيقونة تطبيق 📲" : "Install Qurany Web App Icon 📲"}
                  </h4>
                </div>
                <p className="text-[10px] sm:text-xs text-stone-400 font-sans mt-1 leading-relaxed max-w-xl">
                  {isAr 
                    ? "قم بإضافة التطبيق على شاشتك الرئيسية للتصفح السريع للأوراد، الأذكار، والاستماع لقراءات القرآن في وضع الأوفلاين السريع."
                    : "Add Qurany directly to your device home screen for ultra-fast launches, full offline access, and an immersive native experience."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs font-sans transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-600/10 shrink-0 hover:scale-[1.02] flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isAr ? "تثبيت التطبيق الآن 📱" : "Install Web App 📱"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Beautiful Detailed Installation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200" dir={isAr ? "rtl" : "ltr"}>
          {/* Main Backdrop click closure */}
          <div className="absolute inset-0 cursor-default" onClick={handleClose} />
          
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            {/* Elegant Header */}
            <div className="border-b border-stone-850 p-4 sm:p-5 flex items-center justify-between bg-stone-920">
              <div className={`flex items-center gap-2.5 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-stone-100 font-sans">
                    {isAr ? "تثبيت تطبيق قرآني" : "Install Qurany App"}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-sans font-medium">
                    {isAr ? "تنزيل وإضافة أيقونة التطبيق على شاشة الهاتف" : "Save shortcut on your home screen or devices"}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleClose}
                className="p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 cursor-pointer transition-all active:scale-95 border border-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Navigation tabs */}
            <div className="px-4 pt-3 flex gap-1 border-b border-stone-850 bg-stone-900">
              <button
                onClick={() => setActiveTab("install")}
                className={`flex-1 py-2.5 text-xs font-black font-sans border-b-2 transition-all relative ${
                  activeTab === "install"
                    ? "border-amber-500 text-amber-500 bg-amber-950/10"
                    : "border-transparent text-stone-400 hover:text-stone-300"
                }`}
              >
                {isAr ? "تثبيت التطبيق 📲" : "Install App"}
              </button>
              <button
                onClick={() => setActiveTab("qr")}
                className={`flex-1 py-2.5 text-xs font-black font-sans border-b-2 transition-all relative ${
                  activeTab === "qr"
                    ? "border-amber-500 text-amber-500 bg-amber-950/10"
                    : "border-transparent text-stone-400 hover:text-stone-300"
                }`}
              >
                {isAr ? "مسح الـ QR ومشاركة 📱" : "Scan QR & Share"}
              </button>
            </div>

            {/* Modal Content container */}
            <div className="p-5 overflow-y-auto max-h-[64vh] flex flex-col gap-4">
              
              {/* Tab 1: Installation Guide and Interaction */}
              {activeTab === "install" && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-250">
                  
                  {/* Icon Card representation */}
                  <div className="bg-stone-950/40 rounded-2xl p-4 border border-stone-850 flex items-center justify-between gap-4">
                    <div className={`flex items-center gap-3.5 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 flex items-center justify-center shrink-0 shadow-lg select-none">
                        <img 
                          src="/icon.png" 
                          alt="Qurany high-res app icon" 
                          className="w-full h-full object-cover rounded-[10px]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-stone-100 font-sans">
                          {isAr ? "قرآني - مصحف أونلاين وأوفلاين" : "Qurany - Online & Offline Quran"}
                        </h4>
                        <p className="text-[10.5px] text-stone-400 font-sans mt-0.5">
                          {isAr ? "النسخة الخفيفة الرسمية والمباشرة" : "Official stable web application representation"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Action Trigger based on browser capabilities */}
                  {deferredPrompt ? (
                    <div className="bg-amber-950/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                      <p className="text-xs text-stone-300 font-sans mb-3 leading-relaxed">
                        {isAr
                          ? "متصفحك يدعم التثبيت التلقائي والمباشر لقرآني على جهازك! اضغط على الزر أدناه لإضافته فوراً."
                          : "Your browser supports direct installation! Click the button below to add Qurany to your device instantly."}
                      </p>
                      <button
                        onClick={handleTriggerPWAInstall}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs font-sans transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2 shadow-amber-500/15"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>{isAr ? "تثبيت بنقرة واحدة الآن 👇" : "Click to Install Instantly 👇"}</span>
                      </button>
                    </div>
                  ) : isIOS ? (
                    /* iOS instructions */
                    <div className="flex flex-col gap-3">
                      <div className="bg-stone-950/60 rounded-2xl p-4 border border-stone-850 flex flex-col gap-3.5">
                        <div className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-stone-200">
                            {isAr ? "خطوات التثبيت على سيفاري (iOS/Safari):" : "Safari iOS Installation Instructions:"}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-3 text-xs text-stone-300 font-sans">
                          <div className={`flex gap-3 items-center ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                            <div className="w-6 h-6 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                              <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {isAr 
                                ? "انقر على زر مشاركة (Share) في شريط المتصفح بالأسفل." 
                                : "Tap the 'Share' icon in the Safari bottom toolbar."}
                            </p>
                          </div>

                          <div className={`flex gap-3 items-center ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                            <div className="w-6 h-6 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                              <Plus className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {isAr 
                                ? "اختر 'إضافة إلى الصفحة الرئيسية' (Add to Home Screen) من الخيارات." 
                                : "Scroll down and select 'Add to Home Screen'."}
                            </p>
                          </div>

                          <div className={`flex gap-3 items-center ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                            <div className="w-6 h-6 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {isAr 
                                ? "اضغط على زر إضافة (Add) في الزاوية العلوية لتثبيت التطبيق."
                                : "Tap 'Add' in the top right to complete installation."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Other browser/fallback instructions */
                    <div className="flex flex-col gap-3">
                      <div className="bg-stone-950/60 rounded-2xl p-4 border border-stone-850 flex flex-col gap-3.5">
                        <div className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-stone-200">
                            {isAr ? "تثبيت يدوي سريع برمز المتصفح:" : "Easy Manual Install Steps:"}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-3 text-xs text-stone-300 font-sans">
                          <div className={`flex gap-3 items-center ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                            <div className="w-6 h-6 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                              <Menu className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {isAr 
                                ? "انقر على النقاط الثلاث (أيقونة القائمة) في أعلى أو أسفل المتصفح." 
                                : "Tap the three-dots (menu icon) in your browser’s bar."}
                            </p>
                          </div>

                          <div className={`flex gap-3 items-center ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                            <div className="w-6 h-6 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                              <Plus className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {isAr 
                                ? "اختر 'تثبيت التطبيق' أو 'أثبت على الشاشة الرئيسية' (Add to Home Screen)." 
                                : "Select 'Install App' or 'Add to Home screen'."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Share as fallback */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className={`text-[10px] font-bold text-stone-550 uppercase font-sans ${isAr ? "text-right" : "text-left"}`}>
                      {isAr ? "مشاركة أو نسخ رابط المنصة المباشر" : "Direct Link Sharing"}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={appUrl}
                        className="flex-grow bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-amber-500 font-mono select-all focus:outline-none"
                      />
                      <button
                        onClick={copyAppUrl}
                        className={`px-4 py-2 rounded-xl border font-sans font-black text-xs transition-all active:scale-95 cursor-pointer ${
                          copiedLink 
                            ? "bg-emerald-900/20 border-emerald-500/40 text-emerald-400" 
                            : "bg-stone-800 border-stone-750 hover:bg-stone-750 text-stone-200"
                        }`}
                      >
                        {copiedLink ? (isAr ? "تم ✓" : "Copied! ✓") : (isAr ? "نسخ" : "Copy")}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 2: Sharing QR Code */}
              {activeTab === "qr" && (
                <div className="flex flex-col items-center gap-4 text-center animate-in fade-in duration-250">
                  <div className="bg-stone-950 p-4 rounded-3xl border border-amber-500/15 shadow-2xl relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 animate-pulse" />
                    
                    {/* Visual QR container */}
                    <div className="w-44 h-44 sm:w-52 sm:h-52 bg-stone-950 flex items-center justify-center rounded-2xl border border-stone-850 p-2 overflow-hidden">
                      <img 
                        src={qrCodeImageUrl} 
                        alt="Qurany Live App QR Code for sharing" 
                        className="w-full h-full object-contain rounded-xl select-none"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://chart.googleapis.com/chart?chs=350x350&cht=qr&chl=${encodeURIComponent(appUrl)}&choe=UTF-8`;
                        }}
                      />
                    </div>
                  </div>

                  <div className="max-w-xs">
                    <h4 className="text-xs sm:text-sm font-black text-stone-100 font-sans">
                      {isAr ? "امسح رمز الـ QR بالهاتف الآخر 📸" : "Scan tool for other devices 📸"}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-stone-400 font-sans mt-1 leading-relaxed">
                      {isAr 
                        ? "وجه الكاميرا أو قارئ رمز الاستجابة السريعة نحو الشاشة لفتح رابط مصحف قرآني وتثبيته فوراً على أي جهاز آخر."
                        : "Direct any phone's camera back here to open, scan, and launch the platform on additional devices securely."}
                    </p>
                  </div>

                  {/* Options to share or download the custom QR */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-1">
                    <button
                      onClick={handleDownloadQr}
                      className="py-2.5 rounded-xl border border-stone-800 bg-stone-950/45 hover:bg-stone-850 text-stone-300 font-black text-[10px] sm:text-xs font-sans transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isAr ? "حفظ الـ QR كصورة" : "Download QR Code"}</span>
                    </button>
                    
                    <button
                      onClick={copyAppUrl}
                      className={`py-2.5 rounded-xl border font-sans font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                        copiedLink 
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400" 
                          : "bg-amber-600 hover:bg-amber-500 text-stone-950 border-transparent shadow shadow-amber-600/10"
                      }`}
                    >
                      <Share className="w-3.5 h-3.5" />
                      <span>{copiedLink ? (isAr ? "تم النسخ ✓" : "Copied! ✓") : (isAr ? "نسخ رابط المنصة" : "Copy Link")}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic app link status label */}
              <div className="text-center font-mono text-[9px] text-stone-500 p-1 bg-stone-950/30 rounded-lg">
                Link: {appUrl}
              </div>

            </div>

            {/* Modal Footer decorative advice */}
            <div className="border-t border-stone-850 p-4 bg-stone-920 text-center flex items-center justify-between text-[10px] text-stone-500 font-sans leading-relaxed">
              <span className="font-mono">PWA Integration: online</span>
              <span className="font-sans">{isAr ? "قرآني © ٢٠٢٦" : "Qurany © 2026"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
