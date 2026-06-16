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

