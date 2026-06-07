import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  currentLang?: string;
}

export default function ScrollToTop({ currentLang = "ar" }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrolled > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    // Support potential document-level scrolling overrides
    document.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      document.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  const isRtl = currentLang === "ar";

  return (
    <button
      id="scroll-to-top-button"
      onClick={scrollToTop}
      className={`fixed bottom-24 ${
        isRtl ? "left-4 md:left-6" : "right-4 md:right-6"
      } z-40 p-3 rounded-full bg-stone-900/95 hover:bg-stone-850 text-amber-500 border border-stone-800 shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-amber-500/10 cursor-pointer active:scale-95 transition-all flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-75 duration-200`}
      title={isRtl ? "العودة للأعلى" : "Scroll to top"}
    >
      <ArrowUp className="w-5 h-5 text-amber-500" />
    </button>
  );
}
