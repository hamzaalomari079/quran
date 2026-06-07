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

// Register PWA Service Worker (only if not loaded over file:// protocol)
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('ServiceWorker registered successfully with scope: ', reg.scope))
      .catch((err) => console.error('ServiceWorker registration failed: ', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
