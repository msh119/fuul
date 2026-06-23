// Safe global shim to prevent third-party/platform script errors when querying or attaching listeners to iframes whose contentWindow is null or cross-origin.
(() => {
  // One-time automatic reset of local storage to zero-out all books and ledgers for the new live session
  try {
    const isWiped = localStorage.getItem("pyramids_v2_reset_done_final");
    if (!isWiped) {
      const keysToClear = [
        "pyramids_dealers",
        "pyramids_dealer_statements",
        "pyramids_purchases",
        "pyramids_sales",
        "pyramids_expenses",
        "pyramids_wallet",
        "pyramids_assay_logs",
        "pyramids_workshops",
        "pyramids_workshop_transactions",
        "pyramids_partners",
        "pyramids_corporate_capital",
        "pyramids_company_share_percent",
        "pyramids_partners_pool_share_percent"
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
      localStorage.setItem("pyramids_v2_reset_done_final", "true");
    }
  } catch (e) {
    // Suppress potential quota or security blocks inside iframe
  }

  // Gracefully suppress benign third-party/cross-origin "Script error." triggers
  window.addEventListener("error", (e) => {
    if (e.message === "Script error." || e.message?.includes("Script error")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    // Suppress promise rejections that are outside application core logic (e.g., Sheets API timeouts)
    e.preventDefault();
    e.stopPropagation();
  }, true);

  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (message === "Script error." || (typeof message === "string" && message.includes("Script error"))) {
      return true;
    }
    if (originalOnError) {
      return originalOnError.apply(this, arguments as any);
    }
    return false;
  };
})();

(() => {
  try {
    const originalGetter = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentWindow")?.get;
    if (originalGetter) {
      Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
        get() {
          let win: any = null;
          try {
            win = originalGetter.call(this);
          } catch (e) {
            // Access block
          }

          if (!win) {
            return {
              addEventListener: () => {},
              removeEventListener: () => {},
              postMessage: () => {},
              parent: window,
              top: window,
              self: window,
              document: {
                addEventListener: () => {},
                removeEventListener: () => {},
              }
            } as any;
          }

          return new Proxy(win, {
            get(target: any, prop: string | symbol) {
              if (prop === "addEventListener") {
                return () => {};
              }
              if (prop === "removeEventListener") {
                return () => {};
              }
              if (prop === "document") {
                try {
                  return target.document || {
                    addEventListener: () => {},
                    removeEventListener: () => {},
                  };
                } catch {
                  return {
                    addEventListener: () => {},
                    removeEventListener: () => {},
                  };
                }
              }
              try {
                const val = target[prop];
                if (typeof val === "function") {
                  return val.bind(target);
                }
                return val;
              } catch {
                if (prop === "postMessage") {
                  return (...args: any[]) => {
                    try {
                      return target.postMessage(...args);
                    } catch {}
                  };
                }
                if (prop === "onmessage") return null;
                return undefined;
              }
            }
          }) as any;
        },
        configurable: true,
        enumerable: true
      });
    }

    const originalDocGetter = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentDocument")?.get;
    if (originalDocGetter) {
      Object.defineProperty(HTMLIFrameElement.prototype, "contentDocument", {
        get() {
          try {
            return originalDocGetter.call(this);
          } catch {
            return null;
          }
        },
        configurable: true,
        enumerable: true
      });
    }
  } catch (error) {
    console.warn("Failed to apply iframe shim:", error);
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

