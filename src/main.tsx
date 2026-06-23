// Catch and suppress cross-origin / TradingView "Script error." errors that bubble up and trigger system-internal report logs.
(() => {
  const isIgnorableError = (msg: string, src: string) => {
    const message = String(msg || "").toLowerCase();
    const source = String(src || "").toLowerCase();
    return (
      message.includes("script error") ||
      message.includes("tradingview") ||
      message.includes("widget") ||
      source.includes("tradingview") ||
      source.includes("s3.tradingview.com") ||
      source.includes("s.tradingview.com")
    );
  };

  // Intercept via window.onerror
  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isIgnorableError(String(message), String(source))) {
      console.warn("Suppressed external / TradingView cross-origin script error:", message, source);
      return true; // Prevents the firing of the default event handler and stops bubbling/reporting
    }
    if (originalOnError) {
      return originalOnError.apply(this, arguments as any);
    }
    return false;
  };

  // Intercept via error event listener (capturing phase)
  window.addEventListener(
    "error",
    (event) => {
      const msg = event.message || "";
      const src = event.filename || "";
      if (isIgnorableError(msg, src)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.warn("Suppressed cross-origin error event:", msg, src);
      }
    },
    { capture: true }
  );

  // Intercept unhandled promise rejections (capturing phase)
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = String(event.reason?.message || event.reason || "");
      if (isIgnorableError(reason, "")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.warn("Suppressed unhandled promise rejection:", reason);
      }
    },
    { capture: true }
  );
})();

// Safe global shim to prevent third-party/platform script errors when querying or attaching listeners to iframes whose contentWindow is null or cross-origin.
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

