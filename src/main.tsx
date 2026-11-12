// Safe LocalStorage Wrapper for Sandboxed/Iframe Compatibility
(function() {
  try {
    const testKey = "__ls_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch (e) {
    console.warn("localStorage is blocked or inaccessible. Injecting safe memory-based fallback.", e);
    const storage: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string): string | null => {
        return key in storage ? storage[key] : null;
      },
      setItem: (key: string, value: string): void => {
        storage[key] = String(value);
      },
      removeItem: (key: string): void => {
        delete storage[key];
      },
      clear: (): void => {
        for (const key in storage) {
          delete storage[key];
        }
      },
      key: (index: number): string | null => {
        const keys = Object.keys(storage);
        return keys[index] || null;
      },
      get length(): number {
        return Object.keys(storage).length;
      }
    };
    
    try {
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true
      });
    } catch (err) {
      console.error("Failed to redefine window.localStorage", err);
    }
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isLegacyErrorText } from './utils/quranAiEngine';

// Automatically scrub any legacy API key error messages from localStorage on app boot
try {
  const historyRaw = window.localStorage.getItem('quran_ai_chat_history');
  if (historyRaw) {
    const parsed = JSON.parse(historyRaw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(
        (m: any) => m && typeof m.text === 'string' && !isLegacyErrorText(m.text)
      );
      if (cleaned.length !== parsed.length) {
        window.localStorage.setItem('quran_ai_chat_history', JSON.stringify(cleaned));
      }
    }
  }
} catch {
  // Ignore storage parsing errors
}

// Register PWA Service Worker from root scope and trigger immediate update
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((err) => console.error('ServiceWorker registration failed: ', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
