/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GoogleSyncCenter Component
 * A unified section for Google Synchronization across all divisions,
 * including local CSV extraction, individual sheets sync, and comprehensive cloud backup.
 */

import React, { useState } from "react";
import {
  Database,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  Link2,
  Lock,
  Compass,
  FileSpreadsheet,
  UserCheck,
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Scale,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";
import {
  Dealer,
  DealerStatementItem,
  PurchaseItem,
  SaleItem,
  PublicExpenseItem,
  PrivateWalletTransaction,
  AssayLogItem,
  Workshop,
  WorkshopTransaction
} from "../types";
import { downloadCSV, formatCurrency, formatWeight } from "../utils";

interface GoogleSyncCenterProps {
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
  
  // Google Auth & Sync
  googleUser: any;
  googleToken: string | null;
  spreadsheetsId: string | null;
  spreadsheetsUrl: string | null;
  isSyncingSheets: boolean;
  onSyncToGoogleSheets: () => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSheetsLogout: () => Promise<void>;
  showAlert: (message: string) => void;
}

export default function GoogleSyncCenter({
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
  googleUser,
  googleToken,
  spreadsheetsId,
  spreadsheetsUrl,
  isSyncingSheets,
  onSyncToGoogleSheets,
  onGoogleSignIn,
  onGoogleSheetsLogout,
  showAlert,
}: GoogleSyncCenterProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [syncSuccessLog, setSyncSuccessLog] = useState<string | null>(null);

  // Manual trigger wrapper to provide direct logs
  const handleTriggerSync = async () => {
    try {
      setSyncSuccessLog(null);
      await onSyncToGoogleSheets();
      const now = new Date().toLocaleTimeString();
      setSyncSuccessLog(isArabic ? `تمت المزامنة بنجاح في تمام الساعة ${now}` : `Successfully synchronized at ${now}`);
    } catch (e: any) {
      console.error(e);
      showAlert(isArabic ? "خطأ أثناء محاولة المزامنة، تأكد من تسجيل الدخول ومنح الصلاحية." : "Sync error: check connection and auth privileges.");
    }
  };

  // Direct CSV Downloads
  const handleDownloadSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "purchases": {
        const headers = [
          isArabic ? "كود الفاتورة" : "Invoice ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "العميل" : "Customer",
          isArabic ? "الوزن الفعلي (جرام)" : "Actual Weight (g)",
          isArabic ? "العيار" : "Detected Karat",
          isArabic ? "المعادل ٢١" : "21K Equiv Weight (g)",
          isArabic ? "السعر ٢١" : "Price 21 (EGP)",
          isArabic ? "القيمة الإجمالية" : "Gold Value (EGP)",
          isArabic ? "رسم الششنة" : "Assay Fee",
          isArabic ? "عمولة السمسار" : "Broker Fee"
        ];
        const rows = purchases.map((p) => [
          p.id, p.date, p.customerName, p.actualWeight, p.detectedKarat,
          p.equivalentWeight21, p.price21, p.goldValue, p.assayFee, p.brokerFee
        ]);
        downloadCSV(headers, rows, isArabic ? "مشتريات_الذهب_المحل" : "gold_purchases_report");
        break;
      }
      case "sales": {
        const headers = [
          isArabic ? "كود البيع" : "Sale ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "كود التاجر" : "Dealer ID",
          isArabic ? "الوزن الخام (جرام)" : "Actual Weight (g)",
          isArabic ? "العيار" : "Karat",
          isArabic ? "معادل عيار ٢١" : "21K Equiv Weight",
          isArabic ? "سعر عيار ٢١ المعتمد" : "Grams Price 21",
          isArabic ? "القيمة المالية الإجمالية" : "Total Cash Value (EGP)"
        ];
        const rows = sales.map((s) => [
          s.id, s.date, s.dealerId, s.actualWeight, s.detectedKarat, s.equivalentWeight21, s.price21, s.goldValue
        ]);
        downloadCSV(headers, rows, isArabic ? "مبيعات_الصاغة_المقاصة" : "merchant_sales_report");
        break;
      }
      case "dealers": {
        const headers = [
          isArabic ? "كود التاجر" : "Dealer ID",
          isArabic ? "الاسم بالعربية" : "Name (Ar)",
          isArabic ? "الاسم بالإنجليزية" : "Name (En)",
          isArabic ? "الرصيد المالي الكاش (EGP)" : "Cash Balance (EGP)",
          isArabic ? "رصيد الذهب المعادل ٢١ (جرام)" : "21K Equiv Weight Balance (g)"
        ];
        const rows = dealers.map((d) => {
          const dealerItems = dealerStatements.filter(
            (item) => item.id.includes(`_${d.id}`) || (d.id === "d1" && item.id.startsWith("ds_"))
          );
          let totalCashLoans = 0;
          let totalCashPaid = 0;
          let totalWeightDelivered = 0;
          let totalWeightReceived = 0;
          dealerItems.forEach((item) => {
            if (item.type === "loan_received") totalCashLoans += item.cashAmount;
            else if (item.type === "loan_paid_cash") totalCashPaid += Math.abs(item.cashAmount);
            else if (item.type === "gold_sold_to_dealer") totalWeightDelivered += Math.abs(item.equivalentWeight21);
            else if (item.type === "gold_received_from_dealer") totalWeightReceived += Math.abs(item.equivalentWeight21);
          });
          const cashBal = totalCashLoans - totalCashPaid;
          const goldBal = totalWeightDelivered - totalWeightReceived;
          return [d.id, d.nameAr, d.nameEn, cashBal, goldBal];
        });
        downloadCSV(headers, rows, isArabic ? "ملخص_أرصدة_التجار" : "dealers_balances_report");
        break;
      }
      case "expenses": {
        const headers = [
          isArabic ? "كود المصروف" : "Expense ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "المبلغ المالي" : "Amount (EGP)",
          isArabic ? "البيان بالعربية" : "Description (Ar)",
          isArabic ? "البيان بالإنجليزية" : "Description (En)"
        ];
        const rows = expenses.map((e) => [
          e.id, e.date, e.amount, e.titleAr, e.titleEn
        ]);
        downloadCSV(headers, rows, isArabic ? "المصروفات_العمومية_والتشغيلية" : "overhead_operating_expenses");
        break;
      }
      case "cashbox": {
        const headers = [
          isArabic ? "رقم القيد" : "Tx ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "النوع" : "Type",
          isArabic ? "البيان بالعربية" : "Description (Ar)",
          isArabic ? "البيان بالإنجليزية" : "Description (En)",
          isArabic ? "المقدار المالي (ج.م)" : "Amount (EGP)"
        ];
        const rows = walletTransactions.map((t) => [
          t.id, t.date, t.type, t.descriptionAr, t.descriptionEn, t.amount
        ]);
        downloadCSV(headers, rows, isArabic ? "دفتر_سيولة_الخزنة_الرئيسية" : "main_cashbox_ledger");
        break;
      }
      case "workshops": {
        const headers = [
          isArabic ? "كود الورشة" : "Workshop ID",
          isArabic ? "الاسم بالعربية" : "Name (Ar)",
          isArabic ? "الاسم بالإنجليزية" : "Name (En)",
          isArabic ? "المسؤول" : "Manager",
          isArabic ? "الهاتف" : "Phone",
          isArabic ? "الرصيد المالي المتاح" : "Cash Balance",
          isArabic ? "العهدة الذهبية الفعيلة (جرام)" : "Actual Weight Stock (g)",
          isArabic ? "عهدة عيار ٢١ المعادل (جرام)" : "21K Equiv Stock (g)"
        ];
        const rows = workshops.map((w) => {
          const wsItems = workshopTransactions.filter((tx) => tx.workshopId === w.id);
          const hashCashSafe = wsItems.reduce((acc, tx) => acc + tx.cashAmount, 0);
          const hashGoldActual = wsItems.reduce((acc, tx) => {
            if (tx.type === "purchase" || tx.type === "gold_deposit") return acc + tx.actualWeight;
            if (tx.type === "sale" || tx.type === "gold_withdrawal") return acc - tx.actualWeight;
            return acc;
          }, 0);
          const hashGoldEquiv = wsItems.reduce((acc, tx) => {
            if (tx.type === "purchase" || tx.type === "gold_deposit") return acc + tx.equivalentWeight21;
            if (tx.type === "sale" || tx.type === "gold_withdrawal") return acc - tx.equivalentWeight21;
            return acc;
          }, 0);
          return [
            w.id,
            w.nameAr,
            w.nameEn,
            w.managerAr || "",
            w.phone || "",
            hashCashSafe,
            hashGoldActual,
            hashGoldEquiv
          ];
        });
        downloadCSV(headers, rows, isArabic ? "ملخص_خزائن_المسابك_والورش" : "workshops_vault_balances");
        break;
      }
      case "assay_logs": {
        const headers = [
          isArabic ? "كود التقرير" : "Assay ID",
          isArabic ? "التاريخ" : "Date",
          isArabic ? "اسم العميل" : "Customer Name",
          isArabic ? "الوزن الفعلي (جرام)" : "Actual Weight (g)",
          isArabic ? "العيار المكتشف" : "Detected Karat",
          isArabic ? "رسم الششنة" : "Assay Fee (EGP)"
        ];
        const rows = assayLogs.map((l) => [
          l.id, l.date, l.customerName || l.clientName || "", l.actualWeight, l.detectedKarat, l.assayFee || 0
        ]);
        downloadCSV(headers, rows, isArabic ? "تقارير_المعمل_والششنة" : "assay_lab_diagnostics");
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* 1. MASTER TITLE & CLOUD HERO */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 px-2.5 text-[10px] bg-amber-500/15 text-amber-400 rounded-full font-black border border-amber-500/20">
                Google Sheets & Drive Integration
              </span>
            </div>
            <h2 className="text-xl font-black text-amber-400 flex items-center gap-2.5">
              <Database className="w-6 h-6 text-amber-500" />
              <span>{isArabic ? "قسم مزامنة Google وتصدير شيتات الأقسام" : "Consolidated Google Export & Realtime Cloud Sync"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {isArabic 
                ? "قفل الأمان ومزامن السحابة المعتمد. يمكنك هنا ربط منصتك بحساب جوجل درايف الخاص بك، وإنشاء ورقة عمل Excel شاملة ومزامنة بيانات المحل والتجار والورش والخزينة النقدية والذهب كلياً."
                : "Centralized workspace to connect your gold shop bookkeeping instantly to Google Drive. Keep folders synched with Microsoft Excel files with a single mouse click."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {!googleUser ? (
              <button
                onClick={onGoogleSignIn}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all"
              >
                <Database className="w-4.5 h-4.5 text-slate-950" />
                <span>{isArabic ? "تسجيل دخول بحساب Google" : "Connect with Google Workspace"}</span>
              </button>
            ) : (
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/20 text-xs space-y-3 min-w-[260px]">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="font-bold text-slate-200 leading-none">{googleUser.displayName || (isArabic ? "مستخدم جوجل" : "Google User")}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">{googleUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-2.5 flex items-center justify-between gap-2">
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncingSheets}
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-[11px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? "animate-spin text-slate-950" : ""}`} />
                    <span>{isArabic ? "مزامنة شاملة الآن" : "Sync All Sections"}</span>
                  </button>
                  
                  <button
                    onClick={onGoogleSheetsLogout}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-850 text-rose-450 hover:text-rose-400 border border-slate-800 text-[11px] rounded-lg transition-colors font-medium"
                  >
                    {isArabic ? "فصل" : "Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FEEDBACK & URL BANNER */}
        {syncSuccessLog && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5" />
            <span>{syncSuccessLog}</span>
          </div>
        )}

        {spreadsheetsId && (
          <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/5 text-amber-500 rounded-lg">
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  {isArabic ? "ملف Excel السحابي المرتبط حالياً" : "Linked Active Google Spreadsheet"}
                </p>
                <p className="text-slate-300 font-mono mt-1 font-semibold truncate max-w-xs md:max-w-md">
                  {spreadsheetsId}
                </p>
              </div>
            </div>

            <a
              href={spreadsheetsUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetsId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/20 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold"
            >
              <span>{isArabic ? "استعراض ملف جوجل إكسل" : "Open Google Sheet"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* 2. LIVE SECTIONS MATRIX & INDIVIDUAL EXPORTERS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4.5 h-4.5 text-amber-500" />
            <span>{isArabic ? "تحويل كشوفات وشيتات الأقسام المختلفة" : "Multi-Division Spreadsheet Hub"}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isArabic
              ? "استعرض إحصائيات كل قسم بشكل منفرد مع إمكانية استخراج شيت إكسل يدوي (ملف CSV) يعمل بدون إنترنت أو الرفع المباشر لجوجل شيت."
              : "Read division counters individually and download structured CSV books or check live sync values."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Shop Cash Box */}
          <div className="bg-slate-905 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 rounded-md font-extrabold inline-block mb-1 border border-emerald-500/10">
                  {isArabic ? "العمليات المالية" : "Financial Division"}
                </div>
                <h4 className="font-bold text-slate-100 text-sm">
                  {isArabic ? "صندوق الخزنة المالية الرئيسي" : "Main Physical Cash Box"}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {walletTransactions.length} {isArabic ? "قيود مقبوضات ومسحوبات" : "transactions logged"}
                </p>
              </div>
              <span className="p-2.5 bg-slate-950 text-emerald-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-900 flex items-center gap-2">
              <button
                onClick={() => handleDownloadSection("cashbox")}
                className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white rounded border border-slate-850 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "تحميل كملف CSV" : "Download Excel CSV"}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Gold Purchases */}
          <div className="bg-slate-905 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 rounded-md font-extrabold inline-block mb-1 border border-amber-500/10">
                  {isArabic ? "شراء الذهب بالتفصيل" : "Gold Buy division"}
                </div>
                <h4 className="font-bold text-slate-100 text-sm">
                  {isArabic ? "مشتريات الذهب (من العميل)" : "Gold Purchases Ledger"}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {purchases.length} {isArabic ? "فاتورة شراء نشطة" : "purchases recorded"}
                </p>
              </div>
              <span className="p-2.5 bg-slate-950 text-amber-500 rounded-xl">
                <ArrowDownCircle className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-900 flex items-center gap-2">
              <button
                onClick={() => handleDownloadSection("purchases")}
                className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white rounded border border-slate-850 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "تحميل كملف CSV" : "Download Excel CSV"}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Gold Sales */}
          <div className="bg-slate-905 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="px-1.5 py-0.5 text-[9px] bg-rose-500/10 text-rose-450 rounded-md font-extrabold inline-block mb-1 border border-rose-500/10">
                  {isArabic ? "مبيعات الصاغة بالتفصيل" : "Gold Sell division"}
                </div>
                <h4 className="font-bold text-slate-100 text-sm">
                  {isArabic ? "مبيعات التجار (المقاصة الفورية)" : "Merchant Sales & Offsets"}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {sales.length} {isArabic ? "عملية بيع مقيدة" : "sales details"}
                </p>
              </div>
              <span className="p-2.5 bg-slate-950 text-rose-400 rounded-xl">
                <ArrowUpCircle className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-900 flex items-center gap-2">
              <button
                onClick={() => handleDownloadSection("sales")}
                className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white rounded border border-slate-850 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "تحميل كملف CSV" : "Download Excel CSV"}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Dealers Safes */}
          <div className="bg-slate-905 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="px-1.5 py-0.5 text-[9px] bg-blue-500/10 text-blue-400 rounded-md font-extrabold inline-block mb-1 border border-blue-500/10">
                  {isArabic ? "ذمم الصاغة والتجار" : "Merchant Statements"}
                </div>
                <h4 className="font-bold text-slate-100 text-sm">
                  {isArabic ? "كشوفات ومقاصات أرصدة التجار الموحدة" : "Unified Dealers Balances"}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {dealers.length} {isArabic ? "تجار كبار مسجلين" : "dealers in system"}
                </p>
              </div>
              <span className="p-2.5 bg-slate-950 text-blue-400 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-900 flex items-center gap-2">
              <button
                onClick={() => handleDownloadSection("dealers")}
                className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white rounded border border-slate-850 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "تحميل كملف CSV" : "Download Excel CSV"}</span>
              </button>
            </div>
          </div>

          {/* Card 5: Workshops Safes */}
          <div className="bg-slate-905 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="px-1.5 py-0.5 text-[9px] bg-teal-500/10 text-teal-400 rounded-md font-extrabold inline-block mb-1 border border-teal-500/10">
                  {isArabic ? "الورش والمسابك" : "Workshops & Refineries"}
                </div>
                <h4 className="font-bold text-slate-100 text-sm">
                  {isArabic ? "أرصدة وعهد عينية للورش والمسابك" : "Contractor Workshop Vaults"}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {workshops.length} {isArabic ? "ورش وصاغة عهدة" : "workshops loaded"}
                </p>
              </div>
              <span className="p-2.5 bg-slate-950 text-teal-405 rounded-xl">
                <Building2 className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-900 flex items-center gap-2">
              <button
                onClick={() => handleDownloadSection("workshops")}
                className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white rounded border border-slate-850 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "تحميل كملف CSV" : "Download Excel CSV"}</span>
              </button>
            </div>
          </div>

          {/* Card 6: Operating Expenses */}
          <div className="bg-slate-905 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 rounded-md font-extrabold inline-block mb-1 border border-amber-500/10">
                  {isArabic ? "مصروفات التشغيل" : "Overhead Expenses"}
                </div>
                <h4 className="font-bold text-slate-100 text-sm">
                  {isArabic ? "جدول مصروفات وإيجارات العمل" : "Operating / General Expenses"}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {expenses.length} {isArabic ? "حركة صرف نثرية" : "records listed"}
                </p>
              </div>
              <span className="p-2.5 bg-slate-950 text-amber-405 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-900 flex items-center gap-2">
              <button
                onClick={() => handleDownloadSection("expenses")}
                className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white rounded border border-slate-850 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "تحميل كملف CSV" : "Download Excel CSV"}</span>
              </button>
            </div>
          </div>

          {/* Card 7: Lab Diagnostics Assays */}
          <div className="bg-slate-905 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="px-1.5 py-0.5 text-[9px] bg-slate-500/15 text-slate-300 rounded-md font-extrabold inline-block mb-1 border border-slate-800">
                  {isArabic ? "فحوصات المعمل الششنة" : "Lab Assay Diagnostics"}
                </div>
                <h4 className="font-bold text-slate-100 text-sm">
                  {isArabic ? "ششنة الذهب ونسب طهيف المعمل" : "Assay Logs & Diagnostics"}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {assayLogs.length} {isArabic ? "فحص مسجل في الششنة" : "assays logged"}
                </p>
              </div>
              <span className="p-2.5 bg-slate-950 text-slate-300 rounded-xl">
                <Scale className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-900 flex items-center gap-2">
              <button
                onClick={() => handleDownloadSection("assay_logs")}
                className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white rounded border border-slate-850 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "تحميل كملف CSV" : "Download Excel CSV"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. STEP BY STEP GOOGLE SHEETS SETUP DOCUMENTATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full p-5 flex justify-between items-center bg-slate-950 hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5.5 h-5.5 text-emerald-400" />
            <span className="text-xs font-black text-slate-150">
              {isArabic ? "دليل التهيئة والربط لخدمة Google Sheets بالتفصيل" : "Google Sheets Connection Blueprint Guide"}
            </span>
          </div>
          {showInstructions ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showInstructions && (
          <div className="p-6 border-t border-slate-850 text-xs text-slate-300 space-y-4 max-w-3xl leading-relaxed">
            <h4 className="font-extrabold text-amber-400">
              {isArabic ? "لماذا تحتاج للربط بخدمة المزامنة السحابية؟" : "Why should you connect your billing ledger?"}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isArabic
                ? "إن ربط النظام بحساب Google Drive الخاص بك يسمح للنظام بحفظ البيانات وعمل نسخة احتياطية مشفرة وسحابية بملف مستندات Google Sheets (جداول البيانات)، مميزات هذه الخدمة:"
                : "Synchronizing creates a mirror on Google Spreadsheets. You can access it anytime from any tablet, mobile device or PC instantly, completely configured as live Excel."}
            </p>

            <ul className="list-disc leading-relaxed ltr:pl-5 rtl:pr-5 space-y-2 text-[11px] text-slate-400">
              <li>
                <strong>{isArabic ? "الفصل التلقائي لأوراق العمل:" : "Separated sheets:"}</strong>{" "}
                {isArabic 
                  ? "يتم فصل حركة المحل والتجار والورش والمصروفات والششنة في تبويبات مستقلة تماماً داخل نفس ورقة العمل."
                  : "Each department automatically gets its own beautifully styled sheet inside your workbook."}
              </li>
              <li>
                <strong>{isArabic ? "المزامنة والدمج المباشر:" : "Double-Entry Mirroring:"}</strong>{" "}
                {isArabic 
                  ? "عند الضغط على مفتاح المزامنة الشاملة، يتم تنظيف البيانات السابقة السحابية ورفع البيانات الحية الحالية لضمان المطابقة المطلقة."
                  : "Any local updates overwrite the cloud safely to keep sheets always structured and fully balanced."}
              </li>
              <li>
                <strong>{isArabic ? "تصدير فوري لصيغة PDF وإكسل:" : "Ready to Print & Share:"}</strong>{" "}
                {isArabic 
                  ? "يمكنك من داخل ملف جوجل شيت تحميل ملف شامل بصيغة XLSX أو PDF ومشاركته بمرونة مع المحاسبين والملاك الصاغة."
                  : "You can download, mail, or share your live sheet directly with investors and accountants anywhere."}
              </li>
            </ul>

            <div className="p-3 bg-slate-950 border border-amber-500/15 text-amber-500/90 rounded-lg text-[10.5px]">
              {isArabic 
                ? "ملاحظة: بمجرد تسجيل الدخول بحساب Google، سيقوم النظام تلقائياً بالتحقق من وجود ملف سحابي باسم 'حسابات الأهرام ويب - Pyramids Gold' في حسابك وإن لم يجده سيقوم بإنشاء ملف جديد كلياً ليصبح جاهزاً للعمل والمزامنة."
                : "System automatically creates a safe spreadsheet named 'Pyramids Gold Ledger' in your Google Drive if not found."}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
