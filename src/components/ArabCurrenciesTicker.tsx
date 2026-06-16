import React, { useEffect, useRef } from "react";

interface ArabCurrenciesTickerProps {
  isArabic: boolean;
}

export default function ArabCurrenciesTicker({ isArabic }: ArabCurrenciesTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Flush out previous render/elements
    containerRef.current.innerHTML = "";

    // Build the container div structure required by the TradingView Widget
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.width = "100%";
    widgetContainer.style.height = "100%";

    const widgetInnerContainer = document.createElement("div");
    widgetInnerContainer.className = "tradingview-widget-container__widget";
    widgetInnerContainer.style.width = "100%";
    widgetInnerContainer.style.height = "100%";
    widgetContainer.appendChild(widgetInnerContainer);

    // Dynamic configuration loading the exact requested Arab currency exchange rates relative to USD from tradingview.com
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FX_IDC:USDSAR", title: isArabic ? "الدولار / ريال سعودي (USD/SAR)" : "USD / Saudi Riyal" },
        { proName: "FX_IDC:USDAED", title: isArabic ? "الدولار / درهم إماراتي (USD/AED)" : "USD / UAE Dirham" },
        { proName: "FX_IDC:USDEGP", title: isArabic ? "الدولار / جنيه مصري (USD/EGP)" : "USD / Egyptian Pound" },
        { proName: "FX_IDC:USDKWD", title: isArabic ? "الدولار / دينار كويتي (USD/KWD)" : "USD / Kuwaiti Dinar" },
        { proName: "FX_IDC:USDQAR", title: isArabic ? "الدولار / ريال قطري (USD/QAR)" : "USD / Qatari Riyal" },
        { proName: "FX_IDC:USDJOD", title: isArabic ? "الدولار / دينار أردني (USD/JOD)" : "USD / Jordanian Dinar" },
        { proName: "FX_IDC:USDOMR", title: isArabic ? "الدولار / ريال عماني (USD/OMR)" : "USD / Omani Rial" },
        { proName: "FX_IDC:USDBHD", title: isArabic ? "الدولار / دينار بحريني (USD/BHD)" : "USD / Bahraini Dinar" },
        { proName: "FX_IDC:USDMAD", title: isArabic ? "الدولار / درهم مغربي (USD/MAD)" : "USD / Moroccan Dirham" },
        { proName: "FX_IDC:USDTND", title: isArabic ? "الدولار / دينار تونسي (USD/TND)" : "USD / Tunisian Dinar" },
        { proName: "FX_IDC:USDLYD", title: isArabic ? "الدولار / دينار ليبي (USD/LYD)" : "USD / Libyan Dinar" },
        { proName: "FX_IDC:USDIQD", title: isArabic ? "الدولار / دينار عراقي (USD/IQD)" : "USD / Iraqi Dinar" }
      ],
      showSymbolLogo: true,
      colorTheme: "dark",
      isTransparent: false,
      displayMode: "adaptive",
      locale: isArabic ? "ar" : "en"
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [isArabic]);

  return (
    <div 
      id="arab-currencies-ticker-tape" 
      className="fixed bottom-0 left-0 right-0 z-[100] h-[46px] bg-[#0c1626] border-t-2 border-amber-500 shadow-[0_-8px_30px_rgb(0,0,0,0.5)] flex items-center overflow-hidden"
    >
      {/* Live economic ticker headline label mirroring premium broadcast feeds */}
      <div className="bg-amber-500 text-slate-950 text-[11px] font-black h-full flex items-center gap-2 px-3 sm:px-4 shrink-0 shadow-[4px_0_15px_rgba(0,0,0,0.4)] z-15 select-none relative">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-700"></span>
        </span>
        <span className="tracking-wide uppercase whitespace-nowrap">
          {isArabic ? "مباشر" : "LIVE"}
        </span>
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-500 to-transparent translate-x-full pointer-events-none" />
      </div>

      {/* Embedded widget */}
      <div className="w-full h-full relative" ref={containerRef} />
    </div>
  );
}
