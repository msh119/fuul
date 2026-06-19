/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  PlusCircle,
  Search,
  Scale,
  Trash2,
  Calendar,
  User,
  Activity,
  Calculator,
  Info,
  DollarSign,
  Award,
  FileSpreadsheet,
  Lock,
  ShieldAlert
} from "lucide-react";
import { PurchaseItem } from "../types";
import { formatCurrency, formatWeight, getMillesimalKarat, calculateEquivalentWeight, downloadCSV } from "../utils";

interface PurchasesManagerProps {
  purchases: PurchaseItem[];
  isArabic: boolean;
  onAddPurchase: (purchase: PurchaseItem) => void;
  onDeletePurchase: (id: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showAlert: (message: string) => void;
  isAdminMode: boolean;
  onRequestAdminUnlock?: () => void;
}

export default function PurchasesManager({
  purchases,
  isArabic,
  onAddPurchase,
  onDeletePurchase,
  showConfirm,
  showAlert,
  isAdminMode,
  onRequestAdminUnlock,
}: PurchasesManagerProps) {
  // Model state variables
  const [customerName, setCustomerName] = useState("");
  const [weight, setWeight] = useState("");
  const [karatValue, setKaratValue] = useState("842"); // Default initial state to match mockup (842 Karat)
  const [price21, setPrice21] = useState("6150"); // Default initial price (6150 EGP)
  const [assayFee, setAssayFee] = useState("200"); // Default assay fee (200 EGP)
  const [brokerFee, setBrokerFee] = useState("300"); // Default broker fee (300 EGP)

  // Last submitted breakdown report for visual feedback
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const t = {
    title: isArabic ? "شراء ذهب جديد من العميل" : "New Gold Purchase From Customer",
    customerLabel: isArabic ? "اسم العميل المورد *" : "Customer / Broker Name *",
    customerPlaceholder: isArabic ? "سجل اسم العميل بالكامل" : "Enter customer's full name",
    weightLabel: isArabic ? "الوزن الفعلي الحالي (جرام) *" : "Actual Gold Weight (g) *",
    karatLabel: isArabic ? "العيار الفعلي الداخلي *" : "Detected Karat / Fineness *",
    karatHint: isArabic ? "مثال: 21 أو 842 بالتيزاب" : "e.g., 21 or 842",
    price21Label: isArabic ? "سعر غرام عيار 21 اليومي المتفق عليه *" : "Agreed Price of Karat 21 / 875 *",
    assayFeeLabel: isArabic ? "رسم التحليل والششنة كاش (ج.م)" : "Assay Fee Received (EGP)",
    brokerFeeLabel: isArabic ? "عمولة السمسار المضافة كـ مصروف حركة" : "Transaction Broker Fee (Outflow)",
    calcTitle: isArabic ? "ملخص معطيات الفاتورة الجارية" : "Live Computation Breakdown",
    equivWeight: isArabic ? "الوزن المعادل (عيار 21):" : "Equiv Weight (Karat 21):",
    goldVal: isArabic ? "قيمة الذهب الإجمالية المستحقة:" : "Total Gold Value (Payout):",
    payoutHint: isArabic ? "(يتم خصمها من صندوق الخزنة الخاصة)" : "(Debited from Private Wallet)",
    receiptLabel: isArabic ? "تأكيد وقيد المشتريات بالدفتر" : "Register Purchase Invoice",
    recentBuys: isArabic ? "دفتر حركة توريد الشراء من العملاء" : "Gold Purchase Ledgers Feed",
    searchPlaceholder: isArabic ? "البحث برقم الحركة أو اسم العميل..." : "Search purchases by customer...",
    actualWeight: isArabic ? "الوزن الخام" : "Actual Weight",
    karatValCol: isArabic ? "العيار المقاس" : "Karat/Fineness",
    equivalentWeight21Col: isArabic ? "مكافئ عيار 21" : "Equiv 21g",
    goldValueCol: isArabic ? "قيمة الذهب" : "Gold Value",
    assayFeeCol: isArabic ? "رسم الششنة" : "Assay Fee",
    brokerFeeCol: isArabic ? "عمولة السمسار" : "Broker Fee",
    date: isArabic ? "التاريخ" : "Date",
    delete: isArabic ? "حذف" : "Delete",
    formulaHeading: isArabic ? "الأوزان والششنة المحلية (الطهيف)" : "Tahyeef local golden equations",
    formulaBody: isArabic ? "الوزن المكافئ = (العيار المقاس ÷ 875) × الوزن الخام" : "Equivalent Weight = (Current Karat / 875) * Actual Weight",
    reportTitle: isArabic ? "تقرير تفاصيل الفاتورة المقيدة حالياً" : "Active Posted Invoice Breakdown Report",
    grossGoldValue: isArabic ? "قيمة الذهب الإجمالية:" : "Total Gold Value:",
    deductedAssay: isArabic ? "خصم رسم الششنة:" : "Deduct Assay Fee:",
    netPayout: isArabic ? "الصافي المدفوع للعميل:" : "Net Paid to Client:",
  };

  // Live Auto Calculations
  const numericWeight = Number(weight || 0);
  const numericKarat = Number(karatValue || 0);
  const numericPrice21 = Number(price21 || 0);
  const numericAssay = Number(assayFee || 0);
  const numericBroker = Number(brokerFee || 0);

  const millesimalKarat = getMillesimalKarat(numericKarat);
  // Equivalent Weight (عيار 21 المرجعي الصاغة): Equivalent Weight = (Current Karat / 875) * Actual Weight
  const calculatedEquivWeight21 = Number(((millesimalKarat / 875) * numericWeight).toFixed(3));
  // Total Gold Value = Equivalent Weight * Gram Price of Karat 21
  const calculatedGoldValue = Math.round(calculatedEquivWeight21 * numericPrice21);

  const handleExportExcel = () => {
    const headers = [
      isArabic ? "رقم الفاتورة" : "Invoice ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "العميل / السمسار" : "Customer / Broker",
      isArabic ? "الوزن الخام (جرام)" : "Actual Weight (g)",
      isArabic ? "العيار الداخلي" : "Karat / Fineness",
      isArabic ? "مكافئ عيار 21 (جرام)" : "Equivalent 21g",
      isArabic ? "سعر عيار 21 اليومي (ج.م)" : "Price 21 (EGP)",
      isArabic ? "قيمة الذهب الإجمالية (ج.م)" : "Gold Value (EGP)",
      isArabic ? "خصم رسم الششنة (ج.م)" : "Assay Fee (EGP)",
      isArabic ? "عمولة السمسار (ج.م)" : "Broker Fee (EGP)",
      isArabic ? "الصافي المدفوع (ج.م)" : "Net Paid (EGP)"
    ];

    const rows = purchases.map((p) => [
      p.id,
      p.date,
      p.customerName,
      p.actualWeight,
      p.detectedKarat,
      p.equivalentWeight21,
      p.price21,
      p.goldValue,
      p.assayFee,
      p.brokerFee,
      p.goldValue - p.assayFee
    ]);

    downloadCSV(headers, rows, isArabic ? "مشتريات_الأهرام_للذهب" : "pyramids_gold_purchases");
    showAlert(isArabic ? "تم تحميل شيت المشتريات بصيغة Excel (CSV) بنجاح!" : "Purchases list downloaded as Excel (CSV) successfully!");
  };

  const handleRegisterPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || numericWeight <= 0 || numericKarat <= 0 || numericPrice21 <= 0) {
      showAlert(isArabic ? "برجاء التأكد من تعبئة كافة المدخلات بنسب صحيحة" : "Please fill in all fields with valid numbers.");
      return;
    }

    const newPurchase: PurchaseItem = {
      id: "p_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      customerName,
      actualWeight: numericWeight,
      detectedKarat: numericKarat,
      equivalentWeight21: calculatedEquivWeight21,
      price21: numericPrice21,
      goldValue: calculatedGoldValue,
      assayFee: numericAssay,
      brokerFee: numericBroker,
    };

    onAddPurchase(newPurchase);

    // Save report breakdown for display
    setSubmittedReport({
      id: newPurchase.id,
      customerName,
      actualWeight: numericWeight,
      detectedKarat: numericKarat,
      millesimalKarat,
      equivWeight: calculatedEquivWeight21,
      price21: numericPrice21,
      goldValue: calculatedGoldValue,
      assayFee: numericAssay,
      brokerFee: numericBroker,
    });

    // Reset inputs
    setCustomerName("");
    setWeight("");
    setKaratValue("842");
    setPrice21("6150");
    setAssayFee("200");
    setBrokerFee("300");
  };

  const filteredPurchases = purchases.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.customerName.toLowerCase().includes(term) ||
      p.detectedKarat.toString().includes(term) ||
      p.date.includes(term)
    );
  });

  return (
    <div id="purchases-manager-section" className="space-y-6 animate-fade-in" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* GRID INPUT & REPORTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INPUT FORM: Left/Right depending on RTL */}
        <div className="lg:col-span-7 bg-slate-900 border border-amber-500/20 rounded-xl p-5 shadow-lg">
          <h2 className="text-sm font-bold text-amber-400 mb-5 flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>{t.title}</span>
          </h2>

          <form onSubmit={handleRegisterPurchase} className="space-y-4 text-xs font-semibold text-slate-300">
            {/* Auto date & Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "تاريخ اليوم (تلقائي)" : "Date (Automated)"}</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 p-2 rounded text-slate-200">
                  <Calendar className="w-4 h-4 ml-1.5 mr-1 text-slate-500" />
                  <span>{new Date().toISOString().split("T")[0]}</span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{t.customerLabel}</label>
                <div className="relative">
                  <User className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.customerPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 pr-9 pl-4 text-white font-medium outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* WEIGHT & KARAT VALUE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">{t.weightLabel}</label>
                <div className="relative">
                  <Scale className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.000"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 pr-9 pl-4 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-400 flex justify-between">
                  <span>{t.karatLabel}</span>
                  <span className="text-[10px] text-slate-500">({t.karatHint})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max="1000"
                  required
                  value={karatValue}
                  onChange={(e) => setKaratValue(e.target.value)}
                  placeholder="21 or 842"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{t.price21Label}</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-[9px] text-slate-500 font-bold">EGP</span>
                  <input
                    type="number"
                    required
                    min="100"
                    value={price21}
                    onChange={(e) => setPrice21(e.target.value)}
                    placeholder="6150"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* ASSAY FEE & BROKER FEE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">{t.assayFeeLabel}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={assayFee}
                  onChange={(e) => setAssayFee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{t.brokerFeeLabel}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={brokerFee}
                  onChange={(e) => setBrokerFee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* AUTO SUMMARY BREAKDOWN ON FORM */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-850">
                <Calculator className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.calcTitle}</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">{t.equivWeight}</span>
                  <p className="font-mono text-amber-400 font-bold">{formatWeight(calculatedEquivWeight21, isArabic)}</p>
                </div>
                <div>
                  <span className="text-slate-500">{t.grossGoldValue}</span>
                  <p className="font-mono text-slate-300 font-bold">
                    {formatCurrency(calculatedGoldValue, isArabic)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2.5 border-t border-slate-850">
                <div>
                  <span className="text-rose-400 font-bold">{t.deductedAssay}</span>
                  <p className="font-mono text-rose-400 font-bold">
                    -{formatCurrency(numericAssay, isArabic)}
                  </p>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">{t.netPayout}</span>
                  <p className="font-mono text-emerald-400 font-black text-sm">
                    {formatCurrency(calculatedGoldValue - numericAssay, isArabic)}
                  </p>
                  <span className="text-[10px] text-slate-500 italic mt-0.5 block">{t.payoutHint}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.receiptLabel}</span>
            </button>
          </form>
        </div>

        {/* SUBMITTED REPORT & LOCAL FORMULA HELPER */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Submitted Report Breakdown Card */}
          {submittedReport && (
            <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-xl p-4 shadow-lg animate-fade-in">
              <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-slate-800 mb-3">
                <Award className="w-4 h-4" />
                <span>{t.reportTitle}</span>
              </h3>
              
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "رقم الفاتورة:" : "Purchase ID:"}</span>
                  <span className="font-mono text-slate-400">{submittedReport.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "العميل:" : "Customer Name:"}</span>
                  <span className="font-bold text-slate-100">{submittedReport.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "الوزن الخام الحالي:" : "Actual Weight Raw:"}</span>
                  <span className="font-mono text-slate-300">{submittedReport.actualWeight.toFixed(2)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "العيار المقاس بالتيزاب:" : "Detected Assay Karat:"}</span>
                  <span className="font-mono text-slate-300">{submittedReport.detectedKarat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "النقاوة الألفية السائحة:" : "Millesimal fineness decimal:"}</span>
                  <span className="font-mono text-amber-400">{submittedReport.millesimalKarat / 1000}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-slate-800 flex justify-between">
                  <span className="text-slate-500">{t.equivWeight}</span>
                  <span className="font-mono font-bold text-amber-500">{submittedReport.equivWeight.toFixed(3)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "سعر غرام 21 المتفق عليه:" : "Karat 21 Gram Price:"}</span>
                  <span className="font-mono text-slate-300">{formatCurrency(submittedReport.price21, isArabic)}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "إجمالي قيمة الذهب:" : "Total Gross Gold Value:"}</span>
                  <span className="font-mono text-slate-300">{formatCurrency(submittedReport.goldValue, isArabic)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400 font-bold">{isArabic ? "خصم رسم الششنة:" : "Less Assay Fee:"}</span>
                  <span className="font-mono font-bold text-rose-400">-{formatCurrency(submittedReport.assayFee, isArabic)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isArabic ? "مصروف عمولة السمسار:" : "Deducted Broker Fee:"}</span>
                  <span className="font-mono text-rose-500">-{formatCurrency(submittedReport.brokerFee, isArabic)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between">
                  <span className="text-slate-200 font-black">{isArabic ? "الصافي المدفوع للعميل فعلياً:" : "Actual Net Paid to Customer:"}</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">{formatCurrency(submittedReport.goldValue - submittedReport.assayFee, isArabic)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Golden Standards Infobox */}
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl text-xs space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-805 pb-2">
              <Info className="w-4 h-4 text-amber-500" />
              <span>{t.formulaHeading}</span>
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {isArabic 
                ? "يتم تسوية وتديرج ميزان الذهب المقاس في الصاغة إلى عيار 21 المرجعي (875 ملم) لتثبيت الحسابات ومنع التلاعب." 
                : "Balances are unified into the reference standard Karat 21 / 875 millesimal fineness system."}
            </p>
            <div className="bg-slate-950 p-2.5 rounded font-mono text-[10px] border border-slate-850 text-amber-400">
              {t.formulaBody}
            </div>
          </div>
        </div>

      </div>

      {/* SEARCH FILTER BOX & TABLE DATA LIST (RESTRICTED TO ADMIN) */}
      {isAdminMode ? (
        <>
          {/* SEARCH FILTER BOX */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded py-2 pr-9 pl-4 text-white text-xs outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* TABLE DATA LIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-500" />
                <span>{t.recentBuys}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-slate-700 rounded flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-all"
                  title={isArabic ? "تحميل عينة إكسل منفصل لهذا القسم" : "Download separate Excel sheet for this division"}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isArabic ? "تحميل إكسل" : "Download Excel"}</span>
                </button>
                <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-bold font-mono">
                  {filteredPurchases.length} {isArabic ? "فاتورة" : "items"}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredPurchases.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-xs">
                  {isArabic ? "لا توجد أي فواتير مطابقة للبحث حالياً." : "No registered purchase records matched search criteria."}
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">{t.date}</th>
                      <th className="p-3 text-right">{isArabic ? "العميل المورّد" : "Customer / Broker"}</th>
                      <th className="p-3 text-center">{t.actualWeight}</th>
                      <th className="p-3 text-center">{t.karatValCol}</th>
                      <th className="p-3 text-center">{t.equivalentWeight21Col}</th>
                      <th className="p-3 text-center">{isArabic ? "سعر عيار 21" : "Price of 21"}</th>
                      <th className="p-3 text-center">{t.goldValueCol}</th>
                      <th className="p-3 text-center">{t.assayFeeCol}</th>
                      <th className="p-3 text-center">{t.brokerFeeCol}</th>
                      <th className="p-3 text-center">{isArabic ? "الصافي المدفوع" : "Net Paid"}</th>
                      <th className="p-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredPurchases.map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-mono text-[10px] whitespace-nowrap text-slate-400">{p.date}</td>
                          <td className="p-3 font-bold text-slate-100 whitespace-nowrap">{p.customerName}</td>
                          <td className="p-3 text-center font-mono font-bold">{p.actualWeight.toFixed(2)}g</td>
                          <td className="p-3 text-center font-mono text-slate-400">{p.detectedKarat}</td>
                          <td className="p-3 text-center font-mono text-amber-400 font-bold">{p.equivalentWeight21.toFixed(3)}g</td>
                          <td className="p-3 text-center font-mono text-slate-400">{formatCurrency(p.price21, isArabic)}</td>
                          <td className="p-3 text-center font-mono text-amber-500 font-black">{formatCurrency(p.goldValue, isArabic)}</td>
                          <td className="p-3 text-center font-mono text-emerald-400 font-bold">+{formatCurrency(p.assayFee, isArabic)}</td>
                          <td className="p-3 text-center font-mono text-rose-500">-{formatCurrency(p.brokerFee, isArabic)}</td>
                          <td className="p-3 text-center font-mono text-emerald-400 font-black">{formatCurrency(p.goldValue - p.assayFee, isArabic)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                showConfirm(
                                  isArabic ? "هل تريد حذف فاتورة الشراء هذه تماماً؟ سيلغي تأثيرها المحاسبي بالصندوق." : "Delete this purchase ledger entry permanently?",
                                  () => {
                                    onDeletePurchase(p.id);
                                  }
                                );
                              }}
                              className="text-slate-500 hover:text-rose-500 p-0.5 transition-colors"
                              title={t.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
}
