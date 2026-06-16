import React from "react";
import { Coins, HelpCircle } from "lucide-react";

interface TradingViewGoldChartProps {
  isArabic: boolean;
}

export default function TradingViewGoldChart({ isArabic }: TradingViewGoldChartProps) {
  const locale = isArabic ? "ar_AE" : "en";
  // Dynamically constructed TradingView embed URL with custom locale based on language settings
  const srcUrl = `https://s.tradingview.com/goldprice/widgetembed/?hideideas=1&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=${locale}#%7B%22symbol%22%3A%22TVC%3AGOLD%22%2C%22frameElementId%22%3A%22tradingview_34a7b%22%2C%22interval%22%3A%22D%22%2C%22hide_side_toolbar%22%3A%220%22%2C%22allow_symbol_change%22%3A%221%22%2C%22save_image%22%3A%221%22%2C%22watchlist%22%3A%22TVC%3AGOLD%5Cu001fTVC%3ASILVER%5Cu001fTVC%3APLATINUM%5Cu001fTVC%3APALLADIUM%5Cu001fTVC%3AGOLDSILVER%5Cu001fTVC%3AUSOIL%5Cu001fOANDA%3AEURUSD%5Cu001fFX_IDC%3AUSDJPY%5Cu001fINDEX%3AHUI%5Cu001fINDEX%3AXAU%5Cu001fCOINBASE%3ABTCUSD%22%2C%22details%22%3A%221%22%2C%22studies%22%3A%22%5B%5D%22%2C%22theme%22%3A%22White%22%2C%22style%22%3A%221%22%2C%22timezone%22%3A%22America%2FNew_York%22%2C%22hideideasbutton%22%3A%221%22%2C%22withdateranges%22%3A%221%22%2C%22studies_overrides%22%3A%22%7B%7D%22%2C%22utm_source%22%3A%22goldprice.org%22%2C%22utm_medium%22%3A%22widget%22%2C%22utm_campaign%22%3A%22chart%22%2C%22utm_term%22%3A%22TVC%3AGOLD%22%2C%22page-uri%22%3A%22goldprice.org%22%7D`;

  return (
    <div 
      id="tradingview-spot-gold-card" 
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl mt-8 max-w-7xl mx-auto w-full"
    >
      {/* HEADER BAR */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20 shadow-inner">
            <Coins className="w-5 h-5 animate-pulse text-amber-500" />
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
              {isArabic ? "المؤشر المباشر لأسعار الذهب والفضة والمعادن العالمية" : "Live Spot Gold & Global Metals Feed"}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {isArabic ? "تغذية حية للأسواق والبورصات العالمية عبر TradingView" : "Official high-accuracy commodity data stream via TradingView"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-3 py-1 rounded bg-slate-900/60 border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
            {isArabic ? "البث حي ومباشر" : "Live Streaming"}
          </span>
        </div>
      </div>

      {/* CHART CONTENT */}
      <div className="p-1.5 bg-slate-950/40">
        <div className="w-full relative overflow-hidden rounded-lg bg-white border border-slate-950 h-[500px]">
          <iframe
            id="tradingview_34a7b"
            title="TradingView Gold & Precious Metals Index Chart"
            className="w-full h-full border-0 select-none bg-white"
            src={srcUrl}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>

      {/* DESCRIPTIVE FOOTNOTE */}
      <div className="p-3 text-[10px] text-slate-500 font-sans border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/20">
        <span className="flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {isArabic 
              ? "ملاحظة: يمكنك متابعة الفضة (Spot Silver)، البلاتينيوم والبلاديوم والموازين الأخرى من القائمة المجاورة بالجانب الأيمن للمخطط." 
              : "Note: Switch dynamic views for Silver, Platinum, or Palladium via the right-side watchlist widget."}
          </span>
        </span>
        <span className="font-mono text-[9px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 tracking-wider text-slate-400 select-none">
          TVC:GOLD FEED
        </span>
      </div>
    </div>
  );
}
