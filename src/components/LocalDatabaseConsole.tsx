/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LocalDatabaseConsole Component
 * Provides direct admin-only access to local database records in the project (indexed from localStorage state).
 * 
 * Access Passcode: 202620
 * Action authorization code (Export / Delete): Xula9611
 */

import React, { useState } from "react";
import {
  Database,
  Lock,
  Unlock,
  Eye,
  Search,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  RefreshCw,
  FolderSync,
  HelpCircle,
  Clock,
  UserCheck
} from "lucide-react";
import {
  PurchaseItem,
  SaleItem,
  PublicExpenseItem,
  PrivateWalletTransaction,
  DealerStatementItem,
  Dealer,
  Workshop,
  WorkshopTransaction,
  AssayLogItem
} from "../types";
import { formatCurrency, formatWeight, downloadCSV } from "../utils";

interface LocalDatabaseConsoleProps {
  purchases: PurchaseItem[];
  sales: SaleItem[];
  expenses: PublicExpenseItem[];
  walletTransactions: PrivateWalletTransaction[];
  dealerStatements: DealerStatementItem[];
  dealers: Dealer[];
  workshops: Workshop[];
  workshopTransactions: WorkshopTransaction[];
  assayLogs: AssayLogItem[];
  isArabic: boolean;

  // Deletion callbacks
  onDeletePurchase: (id: string) => void;
  onDeleteSale: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteWalletTransaction: (id: string) => void;
  onDeleteWorkshopTransaction: (id: string) => void;
  onDeleteAssayLog: (id: string) => void;
  
  showAlert: (message: string) => void;
}

export default function LocalDatabaseConsole({
  purchases,
  sales,
  expenses,
  walletTransactions,
  dealerStatements,
  dealers,
  workshops,
  workshopTransactions,
  assayLogs,
  isArabic,
  onDeletePurchase,
  onDeleteSale,
  onDeleteExpense,
  onDeleteWalletTransaction,
  onDeleteWorkshopTransaction,
  onDeleteAssayLog,
  showAlert,
}: LocalDatabaseConsoleProps) {
  // Passcode gatekeep states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sub-tabs in console
  const [activeSubTab, setActiveSubTab] = useState<
    "purchases" | "sales" | "wallet" | "workshops" | "expenses" | "assays"
  >("purchases");

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Security Override Overlay Modal (for Export / Delete actions)
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    type: "download" | "delete";
    recordId: string;
    section: string;
    itemData: any;
  } | null>(null);
  
  const [overrideCode, setOverrideCode] = useState("");
  const [overrideError, setOverrideError] = useState("");

  const handleUnlockConsole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (accessCode === "202620") {
      setIsUnlocked(true);
      setErrorMessage("");
      setAccessCode("");
    } else {
      setErrorMessage(
        isArabic
          ? "الرمز السري غير صحيح. يرجى إدخال رمز الأدمن الصالح للاستعراض."
          : "Invalid access code. Please input correct admin passcode."
      );
    }
  };

  const handleCloseOverlay = () => {
    setOverrideModal(null);
    setOverrideCode("");
    setOverrideError("");
  };

  // Triggers secondary verification code `Xula9611` for export or deletion
  const triggerOverrideGuard = (
    type: "download" | "delete",
    section: string,
    recordId: string,
    itemData: any
  ) => {
    setOverrideModal({
      isOpen: true,
      type,
      recordId,
      section,
      itemData
    });
    setOverrideCode("");
    setOverrideError("");
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (overrideCode === "Xula9611") {
      if (!overrideModal) return;

      const { type, section, recordId, itemData } = overrideModal;

      if (type === "download") {
        // Individual single CSV export
        executeIndividualDownload(section, itemData);
        showAlert(
          isArabic
            ? "تم ترخيص وتحميل شيت المعاملة الفردية بنجاح."
            : "Authorized and downloaded individual ledger item successfully."
        );
      } else if (type === "delete") {
        // execute delete callback
        executeIndividualDelete(section, recordId);
        showAlert(
          isArabic
            ? "تم التحقق وحذف المعاملة المقيدة بنجاح من قاعدة البيانات المحلية."
            : "Verified and deleted ledger transaction from local databases successfully."
        );
      }

      handleCloseOverlay();
    } else {
      setOverrideError(
        isArabic
          ? "الرمز السري الإضافي غير صحيح (تحتاج إلى رمز الترخيص Xula9611)!"
          : "Declined! Invalid authorization key Xula9611!"
      );
    }
  };

  const executeIndividualDownload = (section: string, item: any) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `pyramids_db_${section}_${item.id || "export"}`;

    switch (section) {
      case "purchases":
        headers = [
          isArabic ? "كود الفاتورة" : "Invoice ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "العميل" : "Customer",
          isArabic ? "الوزن الفعلي" : "Actual Weight",
          isArabic ? "العيار" : "Karat",
          isArabic ? "المعادل ٢١" : "21K Equiv",
          isArabic ? "السعر ٢١" : "Price 21",
          isArabic ? "القيمة الإجمالية" : "Value",
          isArabic ? "رسم الششنة" : "Assay Fee",
          isArabic ? "عمولة السمسار" : "Broker Fee"
        ];
        rows = [[
          item.id, item.date, item.customerName, item.actualWeight, item.detectedKarat,
          item.equivalentWeight21, item.price21, item.goldValue, item.assayFee, item.brokerFee
        ]];
        break;
      case "sales":
        headers = [
          isArabic ? "كود البيع" : "Sale ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "رقم حساب التاجر" : "Dealer ID",
          isArabic ? "الوزن الخام" : "Actual Weight",
          isArabic ? "العيار" : "Karat",
          isArabic ? "معادل ٢١" : "21K Equiv",
          isArabic ? "سعر غرام ٢١" : "Gram Price 21",
          isArabic ? "القيمة الكاش" : "Total Cash (EGP)"
        ];
        rows = [[
          item.id, item.date, item.dealerId, item.actualWeight, item.detectedKarat,
          item.equivalentWeight21, item.price21, item.goldValue
        ]];
        break;
      case "wallet":
        headers = [
          isArabic ? "رقم القيد" : "Tx ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "النوع" : "Type",
          isArabic ? "البيان بالعربية" : "Description (Ar)",
          isArabic ? "البيان بالإنجليزية" : "Description (En)",
          isArabic ? "المبلغ المالي" : "Amount"
        ];
        rows = [[
          item.id, item.date, item.type, item.descriptionAr, item.descriptionEn, item.amount
        ]];
        break;
      case "workshops":
        headers = [
          isArabic ? "رقم القيد" : "Tx ID",
          isArabic ? "الورشة" : "Workshop ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "النوع" : "Type",
          isArabic ? "الوزن الفعلي" : "Actual Weight",
          isArabic ? "المعادل ٢١" : "21K Equiv",
          isArabic ? "المبلغ المالي" : "Cash Amount",
          isArabic ? "البيان" : "Notes"
        ];
        rows = [[
          item.id, item.workshopId, item.date, item.type, item.actualWeight,
          item.equivalentWeight21, item.cashAmount, item.notes || ""
        ]];
        break;
      case "expenses":
        headers = [
          isArabic ? "كود المصروف" : "Expense ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "المبلغ" : "Amount",
          isArabic ? "البيان بالعربية" : "Title Ar",
          isArabic ? "البيان بالإنجليزية" : "Title En"
        ];
        rows = [[
          item.id, item.date, item.amount, item.titleAr, item.titleEn
        ]];
        break;
      case "assays":
        headers = [
          isArabic ? "كود التقرير" : "Assay ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "اسم العميل" : "Customer",
          isArabic ? "الوزن الفعلي" : "Actual Weight",
          isArabic ? "العيار المكتشف" : "Karat",
          isArabic ? "رسم الفحص" : "Fee"
        ];
        rows = [[
          item.id, item.date, item.customerName || item.clientName || "", item.actualWeight, item.detectedKarat, item.assayFee
        ]];
        break;
      default:
        break;
    }

    downloadCSV(headers, rows, filename);
  };

  const executeIndividualDelete = (section: string, id: string) => {
    switch (section) {
      case "purchases":
        onDeletePurchase(id);
        break;
      case "sales":
        onDeleteSale(id);
        break;
      case "wallet":
        onDeleteWalletTransaction(id);
        break;
      case "workshops":
        onDeleteWorkshopTransaction(id);
        break;
      case "expenses":
        onDeleteExpense(id);
        break;
      case "assays":
        onDeleteAssayLog(id);
        break;
      default:
        break;
    }
  };

  // Dynamic filter helpers
  const getFilteredPurchases = () => {
    return purchases.filter(
      (p) =>
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.date.includes(searchTerm)
    );
  };

  const getFilteredSales = () => {
    return sales.filter(
      (s) =>
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dealerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.date.includes(searchTerm)
    );
  };

  const getFilteredWallet = () => {
    return walletTransactions.filter(
      (t) =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.descriptionAr.includes(searchTerm) ||
        t.descriptionEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.date.includes(searchTerm)
    );
  };

  const getFilteredWorkshops = () => {
    return workshopTransactions.filter(
      (w) =>
        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.workshopId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.descriptionAr && w.descriptionAr.includes(searchTerm)) ||
        (w.descriptionEn && w.descriptionEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        w.date.includes(searchTerm)
    );
  };

  const getFilteredExpenses = () => {
    return expenses.filter(
      (e) =>
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.titleAr.includes(searchTerm) ||
        e.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.date.includes(searchTerm)
    );
  };

  const getFilteredAssays = () => {
    return assayLogs.filter(
      (a) =>
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.customerName && a.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        a.date.includes(searchTerm)
    );
  };

  const totalUnbackedItems =
    purchases.length +
    sales.length +
    expenses.length +
    walletTransactions.length +
    workshopTransactions.length +
    assayLogs.length;

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg mt-6" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* ACCESS CODE GATEWAY CARD */}
      {!isUnlocked ? (
        <div className="py-8 px-4 max-w-md mx-auto text-center space-y-5">
          <div className="inline-flex p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full mb-1">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-black text-slate-100 text-sm">
              {isArabic ? "قاعدة البيانات المحلية - خاضعة للأدمن فقط" : "Admin Database Access Center (Gatekeep)"}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              {isArabic
                ? "هذا الخيار محمي لسرية بيانات العملاء والمحل. لوحة التحكم هذه تمكنك من جرد ومطابقة وحذف العمليات الفردية محلياً. يرجى إدخال الرمز السري الصالح للأدمن للولوج."
                : "This section is cryptographically partitioned for administrative security and bookkeeping audit routines."}
            </p>
          </div>

          <form onSubmit={handleUnlockConsole} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-center text-white font-mono tracking-[0.55em] text-lg focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {errorMessage && (
              <p className="text-rose-400 text-[10.5px] font-bold animate-pulse">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isArabic ? "ولوج آمن" : "Unlock Secure Console"}
            </button>
          </form>
        </div>
      ) : (
        /* DATABASE VIEW */
        <div className="space-y-6 animate-fade-in">
          
          {/* HEADER ROW WITH LIVE KEY INFO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-855 pb-5">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-xl">
                <Database className="w-5.5 h-5.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-200 text-sm">
                    {isArabic ? "لوحة تفتيش وفلترة قاعدة البيانات الفردية" : "Local SQL-Simulated Registry Desk"}
                  </h4>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    {isArabic ? "مسؤول" : "ADMIN SYSTEM"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isArabic
                    ? `إجمالي الحركات المقيدة حالياً: ${totalUnbackedItems} عملية نشطة. لا تملك صلاحية حذف القاعدة بشكل كلي، ويمكن تصفية كل قيد بشكل منفصل.`
                    : `Active indices: ${totalUnbackedItems} rows in localStorage database. Protected tables.`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsUnlocked(false)}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 font-semibold rounded text-[11px] flex items-center justify-center gap-1 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>{isArabic ? "قفل الجلسة" : "Lock Console Session"}</span>
            </button>
          </div>

          {/* DATABASE METRIC COUNTERS OVERVIEW */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{isArabic ? "المشتريات" : "Purchases"}</p>
              <p className="text-base font-black text-amber-400 font-mono mt-1">{purchases.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{isArabic ? "المبيعات" : "Sales"}</p>
              <p className="text-base font-black text-rose-405 font-mono mt-1">{sales.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{isArabic ? "الخزنة" : "Cashbox"}</p>
              <p className="text-base font-black text-emerald-400 font-mono mt-1">{walletTransactions.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{isArabic ? "الورش" : "Workshops"}</p>
              <p className="text-base font-black text-blue-400 font-mono mt-1">{workshopTransactions.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{isArabic ? "المصروفات" : "Expenses"}</p>
              <p className="text-base font-black text-amber-400 font-mono mt-1">{expenses.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{isArabic ? "المعمل" : "Assays"}</p>
              <p className="text-base font-black text-slate-300 font-mono mt-1">{assayLogs.length}</p>
            </div>
          </div>

          {/* INNER TABS & SEARCH BAR CRADLE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-855">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setActiveSubTab("purchases"); setSearchTerm(""); }}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeSubTab === "purchases"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {isArabic ? "المشتريات" : "Purchases"}
              </button>
              <button
                onClick={() => { setActiveSubTab("sales"); setSearchTerm(""); }}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeSubTab === "sales"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {isArabic ? "المبيعات" : "Sales"}
              </button>
              <button
                onClick={() => { setActiveSubTab("wallet"); setSearchTerm(""); }}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeSubTab === "wallet"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {isArabic ? "الخزنة" : "Cashbox"}
              </button>
              <button
                onClick={() => { setActiveSubTab("workshops"); setSearchTerm(""); }}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeSubTab === "workshops"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {isArabic ? "عهد الورش" : "Workshops"}
              </button>
              <button
                onClick={() => { setActiveSubTab("expenses"); setSearchTerm(""); }}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeSubTab === "expenses"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {isArabic ? "المصروفات" : "Expenses"}
              </button>
              <button
                onClick={() => { setActiveSubTab("assays"); setSearchTerm(""); }}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeSubTab === "assays"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {isArabic ? "الششنة" : "Assay Lab"}
              </button>
            </div>

            <div className="relative">
              <Search className="absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isArabic ? "بحث في جدول السجلات..." : "Filter registries..."}
                className="bg-slate-900 border border-slate-800 rounded px-2 text-[11px] text-white w-full sm:w-48 ltr:pl-8 rtl:pr-8 py-1.5 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* DYNAMIC REGISTRY TABLES CORE */}
          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/45">
            
            {/* 1. PURCHASES SUB-VIEW */}
            {activeSubTab === "purchases" && (
              <table className="w-full text-xs text-slate-300 text-left rtl:text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[11px] font-black uppercase select-none">
                  <tr>
                    <th className="p-3.5">{isArabic ? "الفاتورة" : "Invoice"}</th>
                    <th className="p-3.5">{isArabic ? "التاريخ" : "Date"}</th>
                    <th className="p-3.5">{isArabic ? "العميل" : "Client"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "الوزن الفعلي" : "Act. Weight"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "العيار" : "Karat"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "المعادل ٢١" : "21K Equiv"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "القيمة" : "Total Cash"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "التحكم" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855 font-semibold">
                  {getFilteredPurchases().length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 text-[11px]">
                        {isArabic ? "لا توجد معاملات شراء مطابقة لمدخلات البحث." : "No purchases index detected."}
                      </td>
                    </tr>
                  ) : (
                    getFilteredPurchases().map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-mono text-[10px] text-amber-500">{p.id}</td>
                        <td className="p-3.5 text-[10.5px] text-slate-400">{p.date}</td>
                        <td className="p-3.5 font-bold text-slate-200">{p.customerName}</td>
                        <td className="p-3.5 text-right font-mono">{formatWeight(p.actualWeight, isArabic)}</td>
                        <td className="p-3.5 text-center font-bold text-amber-500 font-mono">{p.detectedKarat}</td>
                        <td className="p-3.5 text-right font-mono text-slate-300 font-bold">{formatWeight(p.equivalentWeight21, isArabic)}</td>
                        <td className="p-3.5 text-right font-mono text-emerald-400">{formatCurrency(p.goldValue, isArabic)}</td>
                        <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => triggerOverrideGuard("download", "purchases", p.id, p)}
                            title={isArabic ? "تحميل نسخة مستند" : "Download document"}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 hover:text-amber-400 rounded cursor-pointer border border-slate-800 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerOverrideGuard("delete", "purchases", p.id, p)}
                            title={isArabic ? "حذف الفاتورة" : "Delete record"}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-rose-455 hover:text-rose-400 rounded cursor-pointer border border-slate-800 hover:border-rose-500/20 transition-all font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 2. SALES SUB-VIEW */}
            {activeSubTab === "sales" && (
              <table className="w-full text-xs text-slate-300 text-left rtl:text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[11px] font-black uppercase select-none">
                  <tr>
                    <th className="p-3.5">{isArabic ? "الرقم" : "Sale ID"}</th>
                    <th className="p-3.5">{isArabic ? "التاريخ" : "Date"}</th>
                    <th className="p-3.5">{isArabic ? "كود التاجر" : "Dealer ID"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "الوزن" : "Weight"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "العيار" : "Karat"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "معادل ٢١" : "21K Equiv"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "سعر ٢١" : "Rate 21"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "القيمة المالية" : "Cash Amount"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "التحكم" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855 font-semibold">
                  {getFilteredSales().length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 text-[11px]">
                        {isArabic ? "لا توجد معاملات بيع مطابقة حالياً." : "No sales items found."}
                      </td>
                    </tr>
                  ) : (
                    getFilteredSales().map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-mono text-[10px] text-amber-500">{s.id}</td>
                        <td className="p-3.5 text-[10.5px] text-slate-400">{s.date}</td>
                        <td className="p-3.5 font-bold text-slate-200">{s.dealerId}</td>
                        <td className="p-3.5 text-right font-mono">{formatWeight(s.actualWeight, isArabic)}</td>
                        <td className="p-3.5 text-center font-bold text-amber-500 font-mono">{s.detectedKarat}</td>
                        <td className="p-3.5 text-right font-mono text-slate-300 font-bold">{formatWeight(s.equivalentWeight21, isArabic)}</td>
                        <td className="p-3.5 text-right font-mono text-slate-450">{formatCurrency(s.price21, isArabic)}</td>
                        <td className="p-3.5 text-right font-mono text-emerald-400">{formatCurrency(s.goldValue, isArabic)}</td>
                        <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => triggerOverrideGuard("download", "sales", s.id, s)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded border border-slate-800 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerOverrideGuard("delete", "sales", s.id, s)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-rose-455 rounded border border-slate-800 hover:border-rose-500/20 transition-all font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 3. CASH BOX / WALLET SUB-VIEW */}
            {activeSubTab === "wallet" && (
              <table className="w-full text-xs text-slate-300 text-left rtl:text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[11px] font-black uppercase select-none">
                  <tr>
                    <th className="p-3.5">{isArabic ? "رقم القيد" : "Tx ID"}</th>
                    <th className="p-3.5">{isArabic ? "التاريخ" : "Date"}</th>
                    <th className="p-3.5">{isArabic ? "النوع" : "Type"}</th>
                    <th className="p-3.5">{isArabic ? "البيان بالعربية" : "Description"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "المبلغ المالي" : "Amount (EGP)"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "التحكم" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855 font-semibold">
                  {getFilteredWallet().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-[11px]">
                        {isArabic ? "لا توجد حركات نقدية مقيدة مطابقة." : "No cash box ledger found."}
                      </td>
                    </tr>
                  ) : (
                    getFilteredWallet().map((t) => {
                      const isDeposit = t.amount > 0 || t.type === "deposit";
                      return (
                        <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3.5 font-mono text-[10px] text-amber-500">{t.id}</td>
                          <td className="p-3.5 text-[10.5px] text-slate-400">{t.date}</td>
                          <td className="p-3.5 text-[10px]">
                            <span className={`px-2 py-0.5 rounded font-black ${
                              isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {isArabic 
                                ? (isDeposit ? "إيداع / قبض" : "صرف / دفع")
                                : (isDeposit ? "DEPOSIT" : "WITHDRAWAL")}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-200">
                            {isArabic ? t.descriptionAr : t.descriptionEn}
                          </td>
                          <td className={`p-3.5 text-right font-mono text-sm font-bold ${
                            isDeposit ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {formatCurrency(t.amount, isArabic)}
                          </td>
                          <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => triggerOverrideGuard("download", "wallet", t.id, t)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded border border-slate-800 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => triggerOverrideGuard("delete", "wallet", t.id, t)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-rose-455 rounded border border-slate-800 hover:border-rose-500/20 transition-all font-bold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* 4. WORKSHOPS SUB-VIEW */}
            {activeSubTab === "workshops" && (
              <table className="w-full text-xs text-slate-300 text-left rtl:text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[11px] font-black uppercase select-none">
                  <tr>
                    <th className="p-3.5">{isArabic ? "رقم القيد" : "Tx ID"}</th>
                    <th className="p-3.5">{isArabic ? "الورشة" : "Workshop"}</th>
                    <th className="p-3.5">{isArabic ? "التاريخ" : "Date"}</th>
                    <th className="p-3.5">{isArabic ? "النوع" : "Type"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "الوزن الفعلي" : "Act. Weight"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "المعادل ٢١" : "21K Equiv"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "السيولة الكاش" : "Cash Amount"}</th>
                    <th className="p-3.5">{isArabic ? "ملاحظات" : "Notes"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "التحكم" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855 font-semibold">
                  {getFilteredWorkshops().length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 text-[11px]">
                        {isArabic ? "لا توجد حركات تداول للورش أو المسابك." : "No refinery records found."}
                      </td>
                    </tr>
                  ) : (
                    getFilteredWorkshops().map((w) => (
                      <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-mono text-[10px] text-amber-500">{w.id}</td>
                        <td className="p-3.5 font-bold text-slate-200">{w.workshopId}</td>
                        <td className="p-3.5 text-[10.5px] text-slate-400">{w.date}</td>
                        <td className="p-3.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded font-black uppercase ${
                            w.type === "purchase" || w.type === "gold_deposit"
                              ? "bg-slate-900 text-teal-400 border border-teal-500/10"
                              : "bg-slate-900 text-amber-400 border border-amber-500/10"
                          }`}>
                            {isArabic
                              ? (w.type === "purchase" ? "شراء مسبك" : w.type === "sale" ? "تسليم صاير" : w.type === "gold_deposit" ? "إيداع عهدة" : "سحب عهدة")
                              : w.type}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono">{formatWeight(w.actualWeight, isArabic)}</td>
                        <td className="p-3.5 text-right font-mono text-slate-300 font-bold">{formatWeight(w.equivalentWeight21, isArabic)}</td>
                        <td className="p-3.5 text-right font-mono text-emerald-400">{formatCurrency(w.cashAmount, isArabic)}</td>
                        <td className="p-3.5 text-slate-400 max-w-[140px] truncate">{isArabic ? w.descriptionAr : w.descriptionEn}</td>
                        <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => triggerOverrideGuard("download", "workshops", w.id, w)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded border border-slate-800 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerOverrideGuard("delete", "workshops", w.id, w)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-rose-455 rounded border border-slate-800 hover:border-rose-500/20 transition-all font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 5. EXPENSES SUB-VIEW */}
            {activeSubTab === "expenses" && (
              <table className="w-full text-xs text-slate-300 text-left rtl:text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[11px] font-black uppercase select-none">
                  <tr>
                    <th className="p-3.5">{isArabic ? "كود المصروف" : "Expense ID"}</th>
                    <th className="p-3.5">{isArabic ? "التاريخ" : "Date"}</th>
                    <th className="p-3.5">{isArabic ? "البيان" : "Description"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "المقدار النثري" : "Overhead Cost"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "التحكم" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855 font-semibold">
                  {getFilteredExpenses().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 text-[11px]">
                        {isArabic ? "لا توجد نفقات جارية مقيدة." : "No overhead record indexed."}
                      </td>
                    </tr>
                  ) : (
                    getFilteredExpenses().map((e) => (
                      <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-mono text-[10px] text-amber-500">{e.id}</td>
                        <td className="p-3.5 text-[10.5px] text-slate-400">{e.date}</td>
                        <td className="p-3.5 font-bold text-slate-200">
                          {isArabic ? e.titleAr : e.titleEn}
                        </td>
                        <td className="p-3.5 text-right font-mono text-rose-400">{formatCurrency(e.amount, isArabic)}</td>
                        <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => triggerOverrideGuard("download", "expenses", e.id, e)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded border border-slate-800 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerOverrideGuard("delete", "expenses", e.id, e)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-rose-455 rounded border border-slate-800 hover:border-rose-500/20 transition-all font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 6. LAB ASSAYS SUB-VIEW */}
            {activeSubTab === "assays" && (
              <table className="w-full text-xs text-slate-300 text-left rtl:text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[11px] font-black uppercase select-none">
                  <tr>
                    <th className="p-3.5">{isArabic ? "كود الفحص" : "Assay ID"}</th>
                    <th className="p-3.5">{isArabic ? "التاريخ" : "Date"}</th>
                    <th className="p-3.5">{isArabic ? "اسم العميل" : "Customer / Client"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "الوزن الفعلي" : "Act. Weight"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "العيار المكتشف" : "Karat"}</th>
                    <th className="p-3.5 text-right">{isArabic ? "رسم الششنة" : "Assay Fee"}</th>
                    <th className="p-3.5 text-center">{isArabic ? "التحكم" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855 font-semibold">
                  {getFilteredAssays().length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-[11px]">
                        {isArabic ? "لم يجرِ فحص ششنة بالمعمل حتى الآن." : "No laboratory assays diagnostic items registered."}
                      </td>
                    </tr>
                  ) : (
                    getFilteredAssays().map((a) => (
                      <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-mono text-[10px] text-amber-500">{a.id}</td>
                        <td className="p-3.5 text-[10.5px] text-slate-400">{a.date}</td>
                        <td className="p-3.5 font-bold text-slate-200">{a.customerName || a.clientName || (isArabic ? "عميل عابر" : "General Guest")}</td>
                        <td className="p-3.5 text-right font-mono">{formatWeight(a.actualWeight, isArabic)}</td>
                        <td className="p-3.5 text-center font-bold text-amber-505 font-mono">{a.detectedKarat}</td>
                        <td className="p-3.5 text-right font-mono text-emerald-400">{formatCurrency(a.assayFee || 0, isArabic)}</td>
                        <td className="p-3.5 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => triggerOverrideGuard("download", "assays", a.id, a)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded border border-slate-800 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerOverrideGuard("delete", "assays", a.id, a)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-rose-455 rounded border border-slate-800 hover:border-rose-500/20 transition-all font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

          </div>

        </div>
      )}

      {/* OVERRIDE OVERLAY DIALOG MODAL (Xula9611 AUTHORIZATION FRAME) */}
      {overrideModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden" dir={isArabic ? "rtl" : "ltr"}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
            
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h5 className="font-extrabold text-slate-100 text-sm">
                  {isArabic ? "حماية وتفويض المستندات والعمليات" : "Authorization Key Challenge Required"}
                </h5>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                  {overrideModal.type === "download" 
                    ? (isArabic ? "ترخيص تنزيل نسخة المعاملة الفردية" : "Secured data export protocol")
                    : (isArabic ? "ترخيص إتلاف المعاملة الفردية" : "Transactional deletion protocol")}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-855 mb-4">
              {isArabic 
                ? `لقد طلبت إجراء ترخيص خاص بـ [${overrideModal.type === "download" ? "تحميل مستند" : "حذف قيد"}] للعملية رقم (${overrideModal.recordId}). يرجى تأكيد الكود الأمني الإضافي التابع للملاك لإمضاء التوجيه وإتمام الأمر.`
                : `Security challenge to confirm manual operation on ledger. Enter administrative bypass token to finalize action.`}
            </p>

            <form onSubmit={handleConfirmOverride} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                  {isArabic ? "رمز التفويض الإضافي (Mating Code)" : "Authorization PIN Code"}
                </label>
                <input
                  type="password"
                  value={overrideCode}
                  onChange={(e) => {
                    setOverrideCode(e.target.value);
                    setOverrideError("");
                  }}
                  autoFocus
                  placeholder={isArabic ? "أدخل الرمز الخاص بالتحميل والحذف" : "Enter override token"}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-center text-white font-mono tracking-widest text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              {overrideError && (
                <p className="text-rose-400 text-[10.5px] font-bold leading-normal">
                  {overrideError}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCloseOverlay}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  {isArabic ? "إلغاء الأمر" : "Dismiss"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{isArabic ? "تأكيد وصرف الترخيص" : "Validate & Commit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
