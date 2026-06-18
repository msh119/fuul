import React, { useState } from "react";
import { 
  BookOpen, 
  Coins, 
  Scale, 
  TrendingUp, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Database, 
  UserCheck, 
  Building2, 
  Users, 
  HelpCircle, 
  Info,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Calculator
} from "lucide-react";

interface SystemManualProps {
  isArabic: boolean;
  netBusinessProfit: number;
  privateWalletBalance: number;
}

export default function SystemManual({ isArabic, netBusinessProfit, privateWalletBalance }: SystemManualProps) {
  const [selectedSection, setSelectedSection] = useState<string>("profit-explanation");

  // Helper function to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0
    }).format(val).replace("EGP", isArabic ? "ج.م" : "EGP");
  };

  const sections = [
    {
      id: "profit-explanation",
      titleAr: "📈 مفهوم الربح الصافي الجاري",
      titleEn: "📈 Working Net Business Profit Concept",
      icon: TrendingUp,
      color: "text-emerald-400"
    },
    {
      id: "purchases-sales",
      titleAr: "💰 عمليات البيع والشراء والمقاصة",
      titleEn: "💰 Invoicing, Sells & Clearing",
      icon: ArrowRightLeftIcon,
      color: "text-amber-500"
    },
    {
      id: "dealers-ledger",
      titleAr: "🤝 ذمم التجار والذهب العيني",
      titleEn: "🤝 Dealers Ledger & Physical Gold",
      icon: UserCheck,
      color: "text-blue-400"
    },
    {
      id: "safes-vaults",
      titleAr: "🔐 الخزائن الموحدة وحركات الكاش",
      titleEn: "🔐 Consolidated Safes & Cash Flows",
      icon: Database,
      color: "text-cyan-400"
    },
    {
      id: "workshops-foundries",
      titleAr: "🏢 الورش والتشغيل والمسابك",
      titleEn: "🏢 Workshops, Melting & Casting",
      icon: Building2,
      color: "text-yellow-500"
    },
    {
      id: "partners-pool",
      titleAr: "📊 رأس المال وتوزيعات الأرباح",
      titleEn: "📊 Capital Allocation & Dividends",
      icon: Users,
      color: "text-purple-400"
    }
  ];

  function ArrowRightLeftIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m16 3 4 4-4 4" />
        <path d="M20 7H4" />
        <path d="m8 21-4-4 4-4" />
        <path d="M4 17h16" />
      </svg>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <BookOpen className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <span>{isArabic ? "دليل النظام المالي للحقوق والعمليات المحاسبية" : "Comprehensive Financial & Operations Manual"}</span>
                <span className="text-[10px] bg-red-500/10 text-rose-400 font-extrabold px-2 py-0.5 rounded border border-rose-500/15">
                  {isArabic ? "صلاحيات المدير العام" : "GENERAL MANAGER PRIVILEGE"}
                </span>
              </h2>
              <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
                {isArabic 
                  ? "مرجع معتمد يستعرض الهيكل المحاسبي لمعادلات الذهب المكسور والطهيف العيني وأقفاص تصفية الأرباح."
                  : "An authenticated reference summarizing scrap gold math, physical clearing indices, and profit formulas."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-850">
            <div className="text-right">
              <span className="text-[9.5px] text-slate-500 block font-bold uppercase">{isArabic ? "رصيد الخزنة الفعلي" : "Consolidated Vault Cash"}</span>
              <span className="font-mono text-sm font-black text-amber-400">{formatCurrency(privateWalletBalance)}</span>
            </div>
            <div className="w-px h-8 bg-slate-850"></div>
            <div className="text-right">
              <span className="text-[9.5px] text-slate-500 block font-bold uppercase">{isArabic ? "الربح الصافي الجاري" : "Live Net Business Profit"}</span>
              <span className={`font-mono text-sm font-black ${netBusinessProfit >= 0 ? "text-emerald-450" : "text-rose-400"}`}>
                {formatCurrency(netBusinessProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE EXPLANATION SHEET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation panel */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-slate-950 p-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 border border-transparent">
            {isArabic ? "أبواب وفصول الدليل" : "Manual Directories"}
          </div>
          {sections.map((sec) => {
            const IconComponent = sec.icon;
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-black transition-all border text-right ${
                  isSelected 
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md" 
                    : "bg-slate-900 text-slate-300 border-slate-850 hover:border-slate-700 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? "text-slate-950" : sec.color}`} />
                  <span>{isArabic ? sec.titleAr : sec.titleEn}</span>
                </div>
                {isArabic ? <ChevronLeft className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              </button>
            )
          })}

          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-[11px] leading-relaxed text-slate-400 space-y-2">
            <span className="font-extrabold text-slate-205 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isArabic ? "ضمان الحوكمة المزدوجة" : "Governance Assured"}</span>
            </span>
            <p>
              {isArabic 
                ? "يتم ترحيل كافة القيود في النظام من خلال قيد مزدوج (Double-entry) يربط الكشوفات العينية والذمم مباشرة بحركة السيولة المادية في الخزنة لضمان عدم وجود عجز محاسبي."
                : "All operations are journaled using dual-entry records keeping physical vault cash strictly aligned with bullion balances."}
            </p>
          </div>
        </div>

        {/* Content viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md min-h-[460px]">
          {selectedSection === "profit-explanation" && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">{isArabic ? "الفصل الأول" : "Chapter I"}</span>
                <h3 className="text-base font-black text-slate-100 mt-1">{isArabic ? "معادلة ومفهوم الربح الصافي الجاري (Working Net Profit)" : "Concept & Mathematics of Working Net Profit"}</h3>
              </div>

              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-slate-200 uppercase flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500" />
                  <span>{isArabic ? "ماهو الربح الصافي الجاري للمؤسسة؟" : "What is Live Operational Profit?"}</span>
                </h4>
                <p className="text-[12px] text-slate-300 leading-relaxed" dir="auto">
                  {isArabic 
                    ? "الربح الصافي الجاري هو العائد المالي التشغيلي الصافى لشركة بيراميدز المتبقي من مجاميع الإيرادات بعد خصم كافة التكاليف والمصروفات. هو المعيار الذي يوضح ما إذا كانت الأنشطة الجارية تحقق نمواً حقيقياً أم تعاني من عجز مالي."
                    : "Working Net Business Profit is the net liquid yield generated by core shop activity after deducting all purchase values and overhead expenses from combined revenues. It represents the real physical growth rate."}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-200">{isArabic ? "📐 كيف يتم احتساب هذا الربح تلقائياً بالمليم؟" : "📐 How is it dynamically calculated?"}</h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-slate-300 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{isArabic ? "(+) إجمالي قيمة المبيعات للتجار" : "(+) Total Sells revenue"}</span>
                    <span className="text-emerald-450 font-bold">{isArabic ? "كاش ج.م" : "Cash EGP"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-450 border-b border-slate-900 pb-1.5">
                    <span>{isArabic ? "(+) رسم فحص الششنة المنفرد (المعمل)" : "(+) Independent Assay fees collected"}</span>
                    <span className="text-emerald-450 font-bold">{isArabic ? "كاش ج.م" : "Cash EGP"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-450 border-b border-slate-900 pb-1.5">
                    <span>{isArabic ? "(+) أرباح تشغيل مصنعية الورش والمسابك" : "(+) Workshop/Foundry casting margins"}</span>
                    <span className="text-emerald-450 font-bold">{isArabic ? "كاش ج.م" : "Cash EGP"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 md:pl-2">
                    <span>{isArabic ? "(−) إجمالي مدفوعات الشراء (من العملاء والورش)" : "(−) Total gold purchase payments"}</span>
                    <span className="text-rose-455 font-bold">{isArabic ? "خصم كاش" : "Dr. Outflow"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 md:pl-2">
                    <span>{isArabic ? "(−) إجمالي عمولات السماسرة ومصاريف التحليل" : "(−) Brokerage & assay test custom fees"}</span>
                    <span className="text-rose-455 font-bold">{isArabic ? "خصم كاش" : "Dr. Outflow"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 md:pl-2 border-b border-slate-850 pb-2">
                    <span>{isArabic ? "(−) إجمالي المصروفات والنثريات والبدلات" : "(−) General/operational expenses and overhead"}</span>
                    <span className="text-rose-455 font-bold">{isArabic ? "خصم كاش" : "Dr. Outflow"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-100 font-extrabold text-[13px] pt-1">
                    <span>{isArabic ? "(=) الربح الصافي الجاري للمؤسسة" : "(=) Working Net Business Profit"}</span>
                    <span className="text-amber-400">{formatCurrency(netBusinessProfit)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/5 text-amber-400 border border-amber-500/10 p-3.5 rounded-xl text-[11px] leading-relaxed">
                <span className="font-extrabold block mb-1">{isArabic ? "💡 الفرق بين الأرباح ورأس المال المودع:" : "💡 Difference Between Profit & Invested Capital:"}</span>
                {isArabic 
                  ? "لا تتداخل ودائع رأس مال الشركاء (Capital Injections) مع الأرباح الصافية. رأس المال هو التمويل المحفظي للمشروع، وعوائد التسييل (الربح الصافي الجاري) هي الناتجة عن الحركة التجارية الدورية. يتم تقسيم الأرباح مناصفة أو بحصص مئوية دون المساس بأصل رأس المال المودع."
                  : "Partner capital injections are long-term equity funding and do not impact Net Profit. Only operational business trade outcomes and diagnostic service yields formulate the Live profit pools."}
              </div>
            </div>
          )}

          {selectedSection === "purchases-sales" && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">{isArabic ? "الفصل الثاني" : "Chapter II"}</span>
                <h3 className="text-base font-black text-slate-100 mt-1">{isArabic ? "فواتير الذهب والشراء وتوزيع العمليات" : "Bullion Purchasing, Invoicing & Inflow Standardizations"}</h3>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed" dir="auto">
                {isArabic 
                  ? "يخدم قسم شراء ومبيعات الذهب تسجيل الفواتير كعقود حقيقية لتسييل عيار الذهب كسر وصافي الششنة:"
                  : "The buying section models dynamic custom gold metrics using real assay parameters:"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>{isArabic ? "شراء ذهب (وارد)" : "Buy Gold Outlets"}</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isArabic 
                      ? "يسجل وارد الذهب عيار ٢٤، ٢١، ١٨ بدقة شديدة بالوزن الفعلي وتطبيق الششنة (نسبة التحويل للصافي) وإدراج رسوم السماسرة المعمول بها في الساغة."
                      : "Logs gold pieces weight, assay gold content purity percentage (Shashna), broker fees, and automatically releases double entry pays in the cash box."}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[10px] font-black text-rose-400 uppercase flex items-center gap-1">
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>{isArabic ? "مبيعات التجار (صادر)" : "Sell Gold Outlets"}</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isArabic 
                      ? "عمليات الاستبدال أو البيع للتجار الكبار بوزن الصافي المعادل بالعيار. يتم ربط قيمة بيع الذهب نقداً وحساب فروقات القيمة لترحيلها لكشوف حسابات التصفية."
                      : "Tracks sales of finished gold to market merchants, with gold weights converted to pure net equivalent and financial residuals logged in live cash accounts."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedSection === "dealers-ledger" && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">{isArabic ? "الفصل الثالث" : "Chapter III"}</span>
                <h3 className="text-base font-black text-slate-100 mt-1">{isArabic ? "حسابات وذمم كبار التجار والذهب العيني" : "Dealer Clearing, bullions, and outstanding gold accounts"}</h3>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs leading-relaxed text-slate-300 space-y-2">
                <span className="font-extrabold text-slate-100 flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>{isArabic ? "مبدأ مقاصة الذهب العادية والعينية" : "Double Balancing Principle"}</span>
                </span>
                <p>
                  {isArabic 
                    ? "معاملات الذهب الكبيرة في مصر لا تتم بالكاش فقط، بل من خلال المقاصة المزدوجة (الكاش والذهب العيني). لذا، يمتلك كل تاجر كشفاً يحتوي على رصيدين منفصلين يعملان معاً:"
                    : "Large gold system accounts operate dual-ledger systems balancing both physical EGP Cash and physical bullion weights together:"}
                </p>
                <ul className="list-disc leading-loose pl-5 pr-5 text-[11.5px] text-slate-400 space-y-1">
                  <li>
                    <strong className="text-slate-300">{isArabic ? "١. ذمة الذهب العيني عيار ٢١:" : "1. Bullion Ounces (Karat 21 equivalent):"}</strong>{" "}
                    {isArabic ? "يقاس بالغرامات الصافية. قد يكون التاجر دائناً بالذهب عيار ٢١ أو مديناً بوزن ذهب عيني." : "Measured in pure Karat 21 gold equivalent weight."}
                  </li>
                  <li>
                    <strong className="text-slate-300">{isArabic ? "٢. ذمة الكاش (ج.م):" : "2. Financial Cash Balance (EGP):"}</strong>{" "}
                    {isArabic ? "الرصيد المالي المرتبط بالفواتير وفروقات الأسعار والعمولات والمصنعية." : "Associated monetary balances representing value gaps and casting services."}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {selectedSection === "safes-vaults" && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">{isArabic ? "الفصل الرابع" : "Chapter IV"}</span>
                <h3 className="text-base font-black text-slate-100 mt-1">{isArabic ? "مركز الخزائن الموحد وحركة الخزنة" : "Consolidated Safes & Cash Flow Integrity"}</h3>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed" dir="auto">
                {isArabic 
                  ? "كل عملية شراء، مبيعات، مصروفات، تحليل ششنة، أو سحب أرباح للشركاء؛ تسجل قيداً فورياً في صندوق الخزانة الرئيسية، بحيث لا يمكنك صرف مليم واحد دون وجود غطاء نقدي حقيقي مسجل مسبقاً."
                  : "All operational and organizational activities journal instantly to the unified private box cash logs. Checks balance against physical drawer assets."}
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="text-[10px] font-black text-cyan-400 block uppercase">{isArabic ? "موجز حظر الخلط المالي" : "Cash Overlaps Separation Rule"}</span>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  {isArabic 
                    ? "يقوم المحاسب الذكي بفصل تام بين الكاش المستلم الخاص بالذمة النقدية للشركاء للموازين، والذهب العيني للتسليم والتحويل، لضمان أعلى مستويات الأمان المالي وضد حدوث أي عجز مفاجئ."
                    : "Keeps financial ledger entries separated from client physical bullion storage to protect physical reserves."}
                </p>
              </div>
            </div>
          )}

          {selectedSection === "workshops-foundries" && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">{isArabic ? "الفصل الخامس" : "Chapter V"}</span>
                <h3 className="text-base font-black text-slate-100 mt-1">{isArabic ? "الورش لتشغيل الذهب وتصنيعه وصب السبائك" : "Workshop Operations, Casting & Foundry Control"}</h3>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed" dir="auto">
                {isArabic 
                  ? "المسابك والورش تجمع دورات كاملة لتحويل قطع الذهب الكسر والمستعمل إلى سبائك مصنعة عيار ٢٤ ومصوغات عيار ٢١ و١٨ مع حساب دقيق لمعدلات الفاقد (العجز الفني) واحتساب تكلفة مصنعية غرام التشكيل والتشغيل نقداً."
                  : "Workshops manage conversion of scrap into standard bars, logging technical gold losses (deficit) and calculating casting labor fees in EGP cash."}
              </p>
            </div>
          )}

          {selectedSection === "partners-pool" && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">{isArabic ? "الفصل السادس" : "Chapter VI"}</span>
                <h3 className="text-base font-black text-slate-100 mt-1">{isArabic ? "محفظة الشركاء والممولين وسحوبات Dividend" : "Capitalization Matrix & Stakeholder dividends"}</h3>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed" dir="auto">
                {isArabic 
                  ? "تنظم عقود الشركاء حقوق ملكية المحل ونسبة العائد وحصتهم من الربح الصافي الجاري للمؤسسة:"
                  : "Stakeholders section models overall capitalization and periodic dividends:"}
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-sans text-xs text-slate-300">
                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" />
                  <p className="leading-relaxed">
                    <strong>{isArabic ? "العائد على الاستثمار:" : "Return on Equity:"}</strong>{" "}
                    {isArabic ? "يحسب مباشرة بناء على نسبة الأرباح المحددة لكل شريك مطبقة على الربح الصافي الجاري للمؤسسة." : "Calculated cleanly against live Net Operating Profit."}
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1" />
                  <p className="leading-relaxed">
                    <strong>{isArabic ? "المسحوبات المحاسبية (Dividends Drawer):" : "Dividends withdrawals:"}</strong>{" "}
                    {isArabic ? "يقوم الشريك بسحب مبالغ كاش من رصيد أرباحه بالاتفاق، وبمجرد تسجيل الحركة يرحل قيد مالي فوري يخصم المبلغ من السيولة المتوفرة بالخزنة الموحدة تلقائياً." : "Deducts instantly both from individual stakeholder ledger history and physical shop vault reserves."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
