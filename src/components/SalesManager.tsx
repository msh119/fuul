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
  Layers,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Calculator,
  User,
  Info,
  FileSpreadsheet
} from "lucide-react";
import { SaleItem, Dealer, DealerStatementItem } from "../types";
import { formatCurrency, formatWeight, getMillesimalKarat, calculateEquivalentWeight, downloadCSV } from "../utils";

interface SalesManagerProps {
  sales: SaleItem[];
  dealers: Dealer[];
  dealerStatements: DealerStatementItem[];
  isArabic: boolean;
  onAddSale: (sale: SaleItem) => void;
  onDeleteSale: (id: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showAlert: (message: string) => void;
}

export default function SalesManager({
  sales,
  dealers,
  dealerStatements,
  isArabic,
  onAddSale,
  onDeleteSale,
  showConfirm,
  showAlert,
}: SalesManagerProps) {
  // Model state variables
  const [selectedDealerId, setSelectedDealerId] = useState(dealers[0]?.id || "");
  const [weight, setWeight] = useState("");
  const [karatValue, setKaratValue] = useState("852"); // Default mockup state (852 Karat)
  const [price21, setPrice21] = useState("6170"); // Default matchup price (6170 EGP)

  // Sync selectedDealerId if the list of dealers changes or if the current choice is not valid
  React.useEffect(() => {
    if (dealers.length > 0) {
      const exists = dealers.some((d) => d.id === selectedDealerId);
      if (!exists) {
        setSelectedDealerId(dealers[0].id);
      }
    } else {
      setSelectedDealerId("");
    }
  }, [dealers, selectedDealerId]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  const t = {
    title: isArabic ? "بيع وتسوية ذهب مع التاجر (مقاصة)" : "Sell & Offset Gold to Dealer (Mokassa)",
    dealerLabel: isArabic ? "اختر التاجر المستلم *" : "Select Recipient Dealer *",
    weightLabel: isArabic ? "الوزن الفعلي المصدر (جرام) *" : "Actual Selling Weight (g) *",
    karatLabel: isArabic ? "العيار المنقول *" : "Transfer Karat / Fineness *",
    karatHint: isArabic ? "مثال: 21 أو 852" : "e.g., 21 or 852",
    price21Label: isArabic ? "سعر غرام عيار 21 المتفق عليه *" : "Agreed Price of Karat 21 / 875 *",
    financialOffset: isArabic ? "أثر تسوية ومقاصة السلفيات النقدية" : "Private Loan Offset & Settlings Tracker",
    liveSummary: isArabic ? "الحساب التلقائي لصافي المعلقات والتصفية" : "Automated Live Statement Balancings",
    equivWeight: isArabic ? "الوزن المعادل المستحق (عيار 21):" : "Equiv Weight Owed (21g):",
    totalGoldValue: isArabic ? "قيمة الذهب المتداول الإجمالية:" : "Total Gold Trade Value:",
    outstandingLoan: isArabic ? "ديون سلفيات التاجر قبل التصفية:" : "Outstanding cash loan of this dealer:",
    recalculatedLoan: isArabic ? "متبقي السلفية طرفنا بعد المقاصة:" : "Remaining cash loan after offset:",
    remainingDue: isArabic ? "المتبقي المستحق لنا طرف التاجر (كاش):" : "Reimbursement due from dealer (Cash):",
    submitButton: isArabic ? "تأكيد فوري لعملية البيع وتسوية المعلقات" : "Post Sale & Settle Outstanding Ledger",
    recentSales: isArabic ? "سجلات حركة مبيعات التجار والمقاصة" : "Dealers Trade and Offsets Archive",
    searchPlaceholder: isArabic ? "البحث بالتاجر أو عيار البيع..." : "Search sales catalog by dealer...",
    actualWeight: isArabic ? "الوزن الخام" : "Actual Weight",
    karatValCol: isArabic ? "العيار" : "Karat",
    equivWeightCol: isArabic ? "معادل ٢١" : "Equiv 21g",
    goldValCol: isArabic ? "قيمة الذهب" : "Gold Value",
    dealerNameAr: isArabic ? "التاجر" : "Dealer",
    date: isArabic ? "التاريخ" : "Date",
    delete: isArabic ? "حذف" : "Delete",
    settledFull: isArabic ? "تم تسوية السلفة بالكامل" : "Loan settled in full",
    remainingLoanLabel: isArabic ? "متبقي مديونية سلف" : "Remaining loan debt"
  };

  // 1. Math computation for current form input
  const numericWeight = Number(weight || 0);
  const numericKarat = Number(karatValue || 0);
  const numericPrice21 = Number(price21 || 0);

  const millesimalKarat = getMillesimalKarat(numericKarat);
  const calculatedEquivWeight21 = Number(((millesimalKarat / 875) * numericWeight).toFixed(3));
  const calculatedGoldValue = Math.round(calculatedEquivWeight21 * numericPrice21);

  const handleExportExcel = () => {
    const headers = [
      isArabic ? "رقم الفاتورة" : "Invoice ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "التاجر المسوق له" : "Dealer NAME",
      isArabic ? "الوزن الخام (جرام)" : "Actual Weight (g)",
      isArabic ? "العيار الفعلي" : "Detected Karat",
      isArabic ? "مكافئ عيار 21 (جرام)" : "Equivalent 21g",
      isArabic ? "سعر عيار 21 للتاجر (ج.م)" : "Price 21 (EGP)",
      isArabic ? "قيمة الذهب الإجمالية (ج.م)" : "Gold Value (EGP)"
    ];

    const rows = sales.map((s) => {
      const d = dealers.find((dl) => dl.id === s.dealerId);
      const dealerName = d ? (isArabic ? d.nameAr : d.nameEn) : (isArabic ? "تاجر غير معروف" : "Unknown Dealer");
      return [
        s.id,
        s.date,
        dealerName,
        s.actualWeight,
        s.detectedKarat,
        s.equivalentWeight21,
        s.price21,
        s.goldValue
      ];
    });

    downloadCSV(headers, rows, isArabic ? "مبيعات_الأهرام_للصاغة" : "pyramids_gold_sales");
    showAlert(isArabic ? "تم تحميل شيت مبيعات الصاغة بنجاح!" : "Sales list downloaded as Excel (CSV) successfully!");
  };

  // 2. Fetch selected dealer financial background
  const activeDealer = dealers.find((d) => d.id === selectedDealerId);
  
  // Calculate selected dealer's current unpaid cash loan before posting this transaction
  const activeDealerStatements = dealerStatements.filter(
    (item) => item.id.includes(`_${selectedDealerId}`) || (selectedDealerId === "d1" && item.id.startsWith("ds_"))
  );

  let totalLoansOfSelectedDealer = 0;
  let totalPaymentsOfSelectedDealer = 0;

  activeDealerStatements.forEach((item) => {
    if (item.type === "loan_received") {
      totalLoansOfSelectedDealer += item.cashAmount;
    } else if (item.type === "loan_paid_cash") {
      totalPaymentsOfSelectedDealer += Math.abs(item.cashAmount);
    }
  });

  const unpaidLoanBeforeSale = totalLoansOfSelectedDealer - totalPaymentsOfSelectedDealer;

  // Let's settle the loan against the new gold value:
  // After offset:
  const remainingLoanAfterSale = Math.max(0, unpaidLoanBeforeSale - calculatedGoldValue);
  const remainingReimbursementFromDealer = Math.max(0, calculatedGoldValue - unpaidLoanBeforeSale);

  const handleRegisterSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealerId || numericWeight <= 0 || numericKarat <= 0 || numericPrice21 <= 0) {
      showAlert(isArabic ? "برجاء توفير قيم سليمة وتحديد التاجر أولاً" : "Please select dealer and provide valid positive inputs.");
      return;
    }

    const newSale: SaleItem = {
      id: "s_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      dealerId: selectedDealerId,
      actualWeight: numericWeight,
      detectedKarat: numericKarat,
      equivalentWeight21: calculatedEquivWeight21,
      price21: numericPrice21,
      goldValue: calculatedGoldValue,
    };

    onAddSale(newSale);

    // Reset weights
    setWeight("");
    setKaratValue("852");
    setPrice21("6170");
  };

  const filteredSales = sales.filter((s) => {
    const dealerName = dealers.find((d) => d.id === s.dealerId);
    const searchString = searchTerm.toLowerCase();
    const dealerMatch = dealerName
      ? (dealerName.nameAr.toLowerCase().includes(searchString) || dealerName.nameEn.toLowerCase().includes(searchString))
      : false;
    return dealerMatch || s.detectedKarat.toString().includes(searchString) || s.date.includes(searchString);
  });

  return (
    <div id="sales-manager-section" className="space-y-6 animate-fade-in text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* FORM AND STATS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INPUT INPUT-CONTAINER */}
        <div className="lg:col-span-8 bg-slate-900 border border-amber-500/20 rounded-xl p-5 shadow-lg">
          <h2 className="text-sm font-bold text-rose-450 mb-5 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-rose-400" />
            <span>{t.title}</span>
          </h2>

          <form onSubmit={handleRegisterSale} className="space-y-4 text-xs font-semibold text-slate-300">
            {/* Dealer selector dropdown & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">{t.dealerLabel}</label>
                <div className="relative">
                  <User className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-500" />
                  <select
                    value={selectedDealerId}
                    onChange={(e) => setSelectedDealerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 pr-9 pl-4 text-white outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {isArabic ? d.nameAr : d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "التاريخ التلقائي لليومية" : "Automated Today's Date"}</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 p-2 rounded text-slate-300">
                  <Calendar className="w-4 h-4 ml-1.5 mr-1 text-slate-500" />
                  <span>{new Date().toISOString().split("T")[0]}</span>
                </div>
              </div>
            </div>

            {/* WEIGHTS, SELLING KARATS & PRICES OF 21 */}
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
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 pr-9 pl-4 text-white text-left font-mono outline-none focus:ring-1 focus:ring-rose-500"
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
                  placeholder="21 or 852"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-rose-500"
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
                    placeholder="6170"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* AUTOMATIC LIVE LOAN SETTLEMENT CALCULATIONS */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-900">
                <Calculator className="w-4 h-4 text-amber-500" />
                <span>{t.liveSummary}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-300">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.equivWeight}</span>
                    <span className="font-mono text-amber-400 font-bold">{calculatedEquivWeight21.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.totalGoldValue}</span>
                    <span className="font-mono text-emerald-400 font-black">{formatCurrency(calculatedGoldValue, isArabic)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t sm:border-t-0 sm:border-r border-slate-800 pt-3 sm:pt-0 sm:pr-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.outstandingLoan}</span>
                    <span className="font-mono text-rose-450 font-bold">{formatCurrency(unpaidLoanBeforeSale, isArabic)}</span>
                  </div>
                  
                  {remainingLoanAfterSale > 0 ? (
                    <div className="flex justify-between text-yellow-500">
                      <span>{t.recalculatedLoan}</span>
                      <span className="font-mono font-black">{formatCurrency(remainingLoanAfterSale, isArabic)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>{isArabic ? "تسوية السلفية المتبقية:" : "Repaid Loan:"}</span>
                      <span>{t.settledFull} (0)</span>
                    </div>
                  )}

                  {remainingReimbursementFromDealer > 0 && (
                    <div className="flex justify-between text-emerald-400 font-black bg-emerald-500/10 p-1 rounded border border-emerald-500/20 mt-1">
                      <span>{t.remainingDue}</span>
                      <span className="font-mono">{formatCurrency(remainingReimbursementFromDealer, isArabic)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.submitButton}</span>
            </button>
          </form>
        </div>

        {/* EXPLAINER ON THE OFFSETS */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-rose-400 flex items-center gap-1.5 pb-2 border-b border-slate-800 mb-3">
              <Info className="w-4 h-4 text-rose-400" />
              <span>{t.financialOffset}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isArabic 
                ? "حسب معايير الصاغة الذهبية والمقاصة، عندما يستلم التاجر منّا غرامات ذهب، فإن قيمتها المقدرة بالعيار المكافئ ٢١ والأسهم والمقاصة تُسوى مباشرة لتسد السلفات النقدية والديون السابقة التي اقترضناها منه." 
                : "Gold trade receipts are directly offset against existing owner loans from the counterpart dealer to update real trading positions dynamically."}
            </p>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 mt-4 text-xs">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{isArabic ? "قيد الدفاتر الحية لتاجرنا النشط" : "Ledger Position Summary"}</span>
            <div className="flex justify-between">
              <span className="text-slate-400">{isArabic ? "اسم التاجر:" : "Counterparty:"}</span>
              <span className="font-bold text-slate-200">{isArabic ? activeDealer?.nameAr : activeDealer?.nameEn}</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-2">
              <span className="text-slate-455">{isArabic ? "سلفة نقدية باقية:" : "Cash loan balance:"}</span>
              <span className="font-mono font-bold text-rose-400">{formatCurrency(unpaidLoanBeforeSale, isArabic)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* TOTALS SUMMARY GRID */}
      {(() => {
        const totalActualWeight = filteredSales.reduce((sum, s) => sum + s.actualWeight, 0);
        const totalEquivWeight = filteredSales.reduce((sum, s) => sum + s.equivalentWeight21, 0);
        const totalGoldValue = filteredSales.reduce((sum, s) => sum + s.goldValue, 0);

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                {isArabic ? "عدد صفقات البيع" : "Sales Transactions Count"}
              </span>
              <span className="text-sm font-mono font-black text-rose-400 mt-1">
                {filteredSales.length}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                {isArabic ? "إجمالي الوزن الفعلي المبيع" : "Total Sold Raw Weight"}
              </span>
              <span className="text-sm font-mono font-black text-white mt-1">
                {totalActualWeight.toFixed(2)}g
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                {isArabic ? "إجمالي معادل 21" : "Total Sold Equiv 21g"}
              </span>
              <span className="text-sm font-mono font-black text-amber-500 mt-1">
                {totalEquivWeight.toFixed(3)}g
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                {isArabic ? "إجمالي قيمة مبيعات الذهب" : "Total Gold Sold Value"}
              </span>
              <span className="text-sm font-mono font-black text-emerald-400 mt-1">
                {formatCurrency(totalGoldValue, isArabic)}
              </span>
            </div>
          </div>
        );
      })()}

      {/* FILTER SEARCH AREA */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded py-2 pr-9 pl-4 text-white text-xs outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* RECENT SALES TABLE HISTORY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <span>{t.recentSales}</span>
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
            <span className="text-[10px] bg-slate-800 text-rose-400 px-2 py-0.5 rounded font-bold font-mono">
              {filteredSales.length} {isArabic ? "حركة بيع" : "sales"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredSales.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs text-center">
              {isArabic ? "لا توجد سجلات بيع للتجار مطابقة للبحث." : "No registered sales records found matching the search."}
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">{t.date}</th>
                  <th className="p-3 text-right">{t.dealerNameAr}</th>
                  <th className="p-3 text-center">{t.actualWeight}</th>
                  <th className="p-3 text-center">{t.karatValCol}</th>
                  <th className="p-3 text-center">{t.equivWeightCol}</th>
                  <th className="p-3 text-center">{isArabic ? "السعر المتفق عليه (عيار 21)" : "Price agreed 21"}</th>
                  <th className="p-3 text-center">{t.goldValCol}</th>
                  <th className="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-350">
                {filteredSales.map((s) => {
                  const dl = dealers.find((d) => d.id === s.dealerId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">{s.date}</td>
                      <td className="p-3 font-bold text-slate-100 whitespace-nowrap">{isArabic ? dl?.nameAr : dl?.nameEn}</td>
                      <td className="p-3 text-center font-mono font-bold">{s.actualWeight.toFixed(2)}g</td>
                      <td className="p-3 text-center font-mono text-slate-400">
                        <div>{s.detectedKarat}</div>
                      </td>
                      <td className="p-3 text-center font-mono text-amber-500 font-bold">{s.equivalentWeight21.toFixed(3)}g</td>
                      <td className="p-3 text-center font-mono text-slate-400">{formatCurrency(s.price21, isArabic)}</td>
                      <td className="p-3 text-center font-mono text-emerald-400 font-black">{formatCurrency(s.goldValue, isArabic)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            showConfirm(
                              isArabic ? "هل تريد حذف فاتورة مبيعات التاجر هذه تماماً وإعادة هيكلة مقاصة الدفتر؟" : "Permanently delete this sale record?",
                              () => {
                                onDeleteSale(s.id);
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
              {(() => {
                const totalActualWeight = filteredSales.reduce((sum, s) => sum + s.actualWeight, 0);
                const totalEquivWeight = filteredSales.reduce((sum, s) => sum + s.equivalentWeight21, 0);
                const totalGoldValue = filteredSales.reduce((sum, s) => sum + s.goldValue, 0);

                return (
                  <tfoot className="bg-slate-950 font-bold text-slate-200 border-t border-slate-800">
                    <tr>
                      <td className="p-3 font-sans">{isArabic ? "المجموع" : "Total"}</td>
                      <td className="p-3 font-sans">({filteredSales.length} {isArabic ? "عملية بيع" : "sales"})</td>
                      <td className="p-3 text-center font-mono">{totalActualWeight.toFixed(2)}g</td>
                      <td className="p-3 text-center font-mono"></td>
                      <td className="p-3 text-center font-mono text-amber-500">{totalEquivWeight.toFixed(3)}g</td>
                      <td className="p-3 text-center font-mono"></td>
                      <td className="p-3 text-center font-mono text-emerald-400">{formatCurrency(totalGoldValue, isArabic)}</td>
                      <td className="p-3 text-center"></td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
