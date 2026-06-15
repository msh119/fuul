/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Search,
  Calendar,
  Layers,
  Trash2,
  FileSpreadsheet,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  User,
  Activity,
  Award,
  ShieldAlert,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import {
  PurchaseItem,
  SaleItem,
  PublicExpenseItem,
  AssayLogItem,
  DealerStatementItem,
  PrivateWalletTransaction,
  Dealer
} from "../types";
import { formatCurrency, downloadCSV } from "../utils";

interface MasterLedgerProps {
  purchases: PurchaseItem[];
  sales: SaleItem[];
  expenses: PublicExpenseItem[];
  assayLogs: AssayLogItem[];
  dealerStatements: DealerStatementItem[];
  walletTransactions: PrivateWalletTransaction[];
  dealers: Dealer[];
  isArabic: boolean;
  onDeletePurchase: (id: string) => void;
  onDeleteSale: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteAssayLog: (id: string) => void;
  onDeleteStatementItem: (id: string) => void;
  onDeleteWalletTransaction: (id: string) => void;
  onClearLedger: () => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

export interface UnifiedTransaction {
  id: string; // Composite ID
  realId: string; // The backend list real ID
  date: string;
  source: "purchase" | "sale" | "expense" | "assay_standalone" | "dealer_statement" | "wallet_manual";
  typeAr: string;
  typeEn: string;
  partyAr: string;
  partyEn: string;
  descriptionAr: string;
  descriptionEn: string;
  weightInfo?: string;
  cashAmount: number; // positive or negative
}

export default function MasterLedger({
  purchases,
  sales,
  expenses,
  assayLogs,
  dealerStatements,
  walletTransactions,
  dealers,
  isArabic,
  onDeletePurchase,
  onDeleteSale,
  onDeleteExpense,
  onDeleteAssayLog,
  onDeleteStatementItem,
  onDeleteWalletTransaction,
  onClearLedger,
  showConfirm,
}: MasterLedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");

  // Aggregate and memoize unified movements list
  const getUnifiedTransactions = (): UnifiedTransaction[] => {
    const list: UnifiedTransaction[] = [];

    // 1. Gold Purchases
    purchases.forEach((p) => {
      list.push({
        id: `purchase_${p.id}`,
        realId: p.id,
        date: p.date,
        source: "purchase",
        typeAr: "شراء ذهب كاش (من عميل)",
        typeEn: "Gold Purchase (Buy)",
        partyAr: p.customerName,
        partyEn: p.customerName,
        descriptionAr: `شراء ذهب ${p.detectedKarat}K بوزن ${p.actualWeight}ج (مكافئ ٢١: ${p.equivalentWeight21.toFixed(3)} جرام) ششنة ${p.assayFee} ج.م`,
        descriptionEn: `Bought ${p.detectedKarat}k gold, weight ${p.actualWeight}g (21 equiv: ${p.equivalentWeight21.toFixed(3)}g) toll assay: ${p.assayFee} EGP`,
        weightInfo: `${p.actualWeight}g (${p.detectedKarat}K)`,
        cashAmount: -(p.goldValue - p.assayFee), // net paid physical cash
      });
    });

    // 2. Gold Sales to Dealers
    sales.forEach((s) => {
      const parentDealer = dealers.find((d) => d.id === s.dealerId);
      const dNameAr = parentDealer ? parentDealer.nameAr : "تاجر";
      const dNameEn = parentDealer ? parentDealer.nameEn : "Dealer";
      list.push({
        id: `sale_${s.id}`,
        realId: s.id,
        date: s.date,
        source: "sale",
        typeAr: "مبيع ذهب للتاجر (قيد مقاصة عينية)",
        typeEn: "Dealer Gold Sale (Barter)",
        partyAr: dNameAr,
        partyEn: dNameEn,
        descriptionAr: `تسليم ذهب ${s.detectedKarat}K بوزن ${s.actualWeight} جرام (مكافئ ٢١: ${s.equivalentWeight21.toFixed(3)} جرام) لتسوية الذمم`,
        descriptionEn: `Delivered ${s.detectedKarat}k gold, weight ${s.actualWeight}g (21 equiv: ${s.equivalentWeight21.toFixed(3)}g) for barter settlement`,
        weightInfo: `${s.actualWeight}g (${s.detectedKarat}K)`,
        cashAmount: 0, // clearing account offset
      });
    });

    // 3. Operating Expenses
    expenses.forEach((e) => {
      list.push({
        id: `expense_${e.id}`,
        realId: e.id,
        date: e.date,
        source: "expense",
        typeAr: `مصروفات تشغيل (${isArabic ? "مصروف عام" : "Overhead"})`,
        typeEn: "Operating Expense",
        partyAr: "صندوق المصروفات",
        partyEn: "Expenses Fund",
        descriptionAr: `${e.titleAr} ${e.notes ? `(${e.notes})` : ""}`,
        descriptionEn: `${e.titleEn}`,
        cashAmount: -e.amount,
      });
    });

    // 4. Standalone laboratory assay testing commissions (not linked to purchases)
    assayLogs.forEach((al) => {
      const isLinkedToPurchase = purchases.some((p) => p.id === al.id.replace("al_", ""));
      if (!isLinkedToPurchase) {
        const pName = al.customerName || al.clientName || (isArabic ? "عميل فحص" : "Assay Client");
        list.push({
          id: `assay_${al.id}`,
          realId: al.id,
          date: al.date,
          source: "assay_standalone",
          typeAr: "رسوم اختبار ششنة وفحص منفرد عيني",
          typeEn: "Standalone Assay Test Comm.",
          partyAr: pName,
          partyEn: pName,
          descriptionAr: `تحري عيار الفحص المقدر بقيمة ${al.detectedKarat}K لوزن عينة ${al.actualWeight} جرام`,
          descriptionEn: `Assay test fee for ${al.detectedKarat}K, samples weight ${al.actualWeight}g`,
          weightInfo: `${al.actualWeight}g (${al.detectedKarat}K)`,
          cashAmount: al.assayFee ?? al.assayFeeCollected ?? 0,
        });
      }
    });

    // 5. Dealer Account Movements directly on Statements
    dealerStatements.forEach((ds) => {
      if (!ds.id.startsWith("ds_sale_")) {
        const parts = ds.id.split("_");
        const dealerId = parts[2] || "";
        const parentDealer = dealers.find((d) => d.id === dealerId);
        const dNameAr = parentDealer ? parentDealer.nameAr : "تاجر";
        const dNameEn = parentDealer ? parentDealer.nameEn : "Dealer";

        list.push({
          id: `dealer_statement_${ds.id}`,
          realId: ds.id,
          date: ds.date,
          source: "dealer_statement",
          typeAr: ds.type === "loan_received" ? "سلفة مالية جارية مستلمة من التاجر" :
                 ds.type === "loan_paid_cash" ? "سداد دفعة نقدية كاش للتاجر" :
                 ds.type === "gold_sold_to_dealer" ? "تسليم ذهب تصفية" : "استلام سبيكة ذهب كسر",
          typeEn: ds.type === "loan_received" ? "Sovereign Loan from Dealer" :
                 ds.type === "loan_paid_cash" ? "Repaid Cash Loan back" :
                 ds.type === "gold_sold_to_dealer" ? "Gold Delivery" : "Gold Inflow from Dealer",
          partyAr: dNameAr,
          partyEn: dNameEn,
          descriptionAr: ds.descriptionAr,
          descriptionEn: ds.descriptionEn,
          weightInfo: ds.actualWeight !== 0 ? `${Math.abs(ds.actualWeight)}g (${ds.karatValue}K)` : undefined,
          cashAmount: ds.cashAmount,
        });
      }
    });

    // 6. Direct Vault / Wallet adjustments
    walletTransactions.forEach((w) => {
      if (w.id.startsWith("w_manual_")) {
        list.push({
          id: `wallet_manual_${w.id}`,
          realId: w.id,
          date: w.date,
          source: "wallet_manual",
          typeAr: w.type === "deposit" ? "تمويل إيداع رأسمالي مباشر بالخزائن" : "سحب المالك لصافي الأرباح",
          typeEn: w.type === "deposit" ? "Direct Capital Influx" : "Owner Divs Withdrawal",
          partyAr: "الخزنة الخاصة للمالك",
          partyEn: "Private Owner Vault",
          descriptionAr: w.descriptionAr,
          descriptionEn: w.descriptionEn,
          cashAmount: w.amount,
        });
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  };

  const allTransactions = getUnifiedTransactions();

  const handleExportConsolidatedExcel = () => {
    const headers = [
      isArabic ? "المعرف الفريد" : "UID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "السجل المصدر" : "Source",
      isArabic ? "نوع الحركة" : "Type",
      isArabic ? "الطرف المعني" : "Party Name",
      isArabic ? "البيان وتفاصيل الأوزان" : "Description Details",
      isArabic ? "مقياس الوزن الكلي" : "Weight Info",
      isArabic ? "المبلغ المالي الكاش (ج.م)" : "Cash Amount (EGP)"
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.source,
      isArabic ? t.typeAr : t.typeEn,
      isArabic ? t.partyAr : t.partyEn,
      isArabic ? t.descriptionAr : t.descriptionEn,
      t.weightInfo || "",
      t.cashAmount
    ]);

    downloadCSV(headers, rows, isArabic ? "الدفتر_الموحد_للإيرادات_والمصروفات" : "pyramids_consolidated_ledger");
  };

  // Apply search filtering and type restrictions
  const filteredTransactions = allTransactions.filter((t) => {
    const searchString = (searchTerm || "").toLowerCase();
    const partyAr = (t.partyAr || "").toLowerCase();
    const partyEn = (t.partyEn || "").toLowerCase();
    const descriptionAr = (t.descriptionAr || "").toLowerCase();
    const descriptionEn = (t.descriptionEn || "").toLowerCase();
    const typeAr = (t.typeAr || "").toLowerCase();
    const typeEn = (t.typeEn || "").toLowerCase();
    const date = t.date || "";

    const matchesSearch =
      partyAr.includes(searchString) ||
      partyEn.includes(searchString) ||
      descriptionAr.includes(searchString) ||
      descriptionEn.includes(searchString) ||
      typeAr.includes(searchString) ||
      typeEn.includes(searchString) ||
      date.includes(searchString);

    const matchesSource = filterSource === "all" || t.source === filterSource;

    return matchesSearch && matchesSource;
  });

  const handleDelete = (item: UnifiedTransaction) => {
    const confirmMessage = isArabic
      ? `هل تريد حذف هذه العملية من الدفاتر وتصفية أثرها بالصندوق وذمم الصاغة؟\n- النوع: ${item.typeAr}\n- بيان الحساب: ${item.descriptionAr}`
      : `Delete this operation forever? This reverses its accounting impact.\n- Type: ${item.typeEn}\n- Details: ${item.descriptionEn}`;

    showConfirm(confirmMessage, () => {
      if (item.source === "purchase") {
        onDeletePurchase(item.realId);
      } else if (item.source === "sale") {
        onDeleteSale(item.realId);
      } else if (item.source === "expense") {
        onDeleteExpense(item.realId);
      } else if (item.source === "assay_standalone") {
        onDeleteAssayLog(item.realId);
      } else if (item.source === "dealer_statement") {
        onDeleteStatementItem(item.realId);
      } else if (item.source === "wallet_manual") {
        onDeleteWalletTransaction(item.realId);
      }
    });
  };

  // Translations object
  const t = {
    title: isArabic ? "سجل كافة حركات وعمليات الصاغة" : "Consolidated Master Operations Ledger",
    subtitle: isArabic ? "شاشة موحدة للبحث، تتبع، وتصفية كافة فواتير المشتريات، المبيعات والمصروفات بالصندوق" : "Single point of control to audit, inspect, and delete any business transaction on the logs",
    searchPlaceholder: isArabic ? "البحث بالتاريخ، اسم العميل، التاجر أو تفاصيل العملية..." : "Filter by date, participant name, details, type...",
    allTypes: isArabic ? "جميع العمليات" : "All Operations",
    purchases: isArabic ? "مشتريات العملاء" : "Customer Purchases",
    sales: isArabic ? "مبيعات المقاصة" : "Dealer Gold Sales",
    expenses: isArabic ? "المصروفات العامة" : "Operating Expenses",
    assays: isArabic ? "الششنة المنفردة" : "Standalone Assays",
    dealerStatement: isArabic ? "تمويل الذمم وسلف التجار" : "Dealer Loans & Transfers",
    walletManual: isArabic ? "تمويل ومسحوبات الخزنة" : "Vault Funds Modifications",
    empty: isArabic ? "لا توجد حركات مطابقة لشروط البحث والتصفية المتطورة." : "No matching transactions correspond to current filters.",
    colDate: isArabic ? "التاريخ" : "Date",
    colType: isArabic ? "نوع الحركة" : "Type",
    colParty: isArabic ? "الطرف المعني" : "Counterparty",
    colDetails: isArabic ? "بيان الحركة وتفاصيل الأوزان" : "Details & Quantities",
    colWeight: isArabic ? "الوزن والعيار" : "Weight Metrics",
    colCash: isArabic ? "الأثر النقدي كاش" : "Cash Impact",
    actions: isArabic ? "خيارات" : "Control",
    clearButton: isArabic ? "تصفير ومسح كافة حركات المعمل" : "Wipe Audit Ledgers to Zero",
    confirmClear: isArabic 
      ? "تنبيه نهائي: سيتم حذف كافة الفواتير، العمليات، كشوفات الحساب وتصفير رصيد الخزنة بالكامل لتبدأ بدفتر جديد تماماً! هل توافق؟" 
      : "Severe Alert: This will wipe out all purchases, sales, logs, and dealer balances to zero to establish an empty book. Proceed?"
  };

  return (
    <div id="master-ledger-suite-container" className="space-y-6 animate-fade-in text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div>
          <h2 className="text-base font-black text-amber-400 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export Consolidated Excel button */}
          <button
            type="button"
            onClick={handleExportConsolidatedExcel}
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-600 text-xs py-2 px-4 rounded-lg font-black transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/15 cursor-pointer"
            title={isArabic ? "تحميل الدفتر المالي الموحد كاملاً بصيغة إكسل" : "Download entire unified ledger in Excel"}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isArabic ? "تحميل الدفتر الموحد (Excel)" : "Download Unified Ledger (Excel)"}</span>
          </button>

          {/* Master reset button on this ledger */}
          <button
            type="button"
            onClick={() => {
              showConfirm(t.confirmClear, () => {
                onClearLedger();
              });
            }}
            className="bg-rose-500/[0.12] hover:bg-rose-500/[0.22] text-rose-400 border border-rose-500/20 text-xs py-2 px-4 rounded-lg font-black transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isArabic ? "تصفير وإعادة تعيين الحسابات بالكامل" : "Reset ledgers to zero"}
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            <span>{t.clearButton}</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search Input : 5 Columns */}
        <div className="md:col-span-5 relative">
          <Search className="absolute ltr:left-3 rtl:right-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg py-2 ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Category filtering tags : 7 Columns */}
        <div className="md:col-span-7 flex flex-wrap gap-1.5 justify-start md:justify-end text-[11px] font-bold">
          <button
            onClick={() => setFilterSource("all")}
            className={`px-3 py-1.5 rounded-md transition-all ${filterSource === "all" ? "bg-amber-500 text-slate-950 shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t.allTypes} ({allTransactions.length})
          </button>
          <button
            onClick={() => setFilterSource("purchase")}
            className={`px-3 py-1.5 rounded-md transition-all ${filterSource === "purchase" ? "bg-emerald-500 text-slate-950 shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t.purchases} ({purchases.length})
          </button>
          <button
            onClick={() => setFilterSource("sale")}
            className={`px-3 py-1.5 rounded-md transition-all ${filterSource === "sale" ? "bg-rose-500/80 text-white shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t.sales} ({sales.length})
          </button>
          <button
            onClick={() => setFilterSource("expense")}
            className={`px-3 py-1.5 rounded-md transition-all ${filterSource === "expense" ? "bg-amber-500/20 border border-amber-500/40 text-amber-400" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t.expenses} ({expenses.length})
          </button>
          <button
            onClick={() => setFilterSource("assay_standalone")}
            className={`px-3 py-1.5 rounded-md transition-all ${filterSource === "assay_standalone" ? "bg-cyan-500 text-slate-950 shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t.assays}
          </button>
          <button
            onClick={() => setFilterSource("dealer_statement")}
            className={`px-3 py-1.5 rounded-md transition-all ${filterSource === "dealer_statement" ? "bg-blue-500 text-white shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t.dealerStatement}
          </button>
          <button
            onClick={() => setFilterSource("wallet_manual")}
            className={`px-3 py-1.5 rounded-md transition-all ${filterSource === "wallet_manual" ? "bg-purple-600 text-white shadow-md" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t.walletManual}
          </button>
        </div>
      </div>

      {/* DATA LOGTABLE CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {filteredTransactions.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-bold">{t.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 font-black">
                <tr>
                  <th className="p-3 w-28 text-center">{t.colDate}</th>
                  <th className="p-3 w-52">{t.colType}</th>
                  <th className="p-3 w-44">{t.colParty}</th>
                  <th className="p-3">{t.colDetails}</th>
                  <th className="p-3 text-center w-36">{t.colWeight}</th>
                  <th className="p-3 text-center w-40">{t.colCash}</th>
                  <th className="p-3 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredTransactions.map((item) => {
                  let sourceBadgeColor = "bg-slate-800 text-slate-300";
                  if (item.source === "purchase") sourceBadgeColor = "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400";
                  if (item.source === "sale") sourceBadgeColor = "bg-rose-500/10 border border-rose-500/25 text-rose-400";
                  if (item.source === "expense") sourceBadgeColor = "bg-amber-500/10 border border-amber-500/25 text-amber-400";
                  if (item.source === "assay_standalone") sourceBadgeColor = "bg-cyan-500/10 border border-cyan-500/25 text-cyan-400";
                  if (item.source === "dealer_statement") sourceBadgeColor = "bg-blue-500/10 border border-blue-500/25 text-blue-400";
                  if (item.source === "wallet_manual") sourceBadgeColor = "bg-purple-500/10 border border-purple-500/25 text-purple-400";

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Date */}
                      <td className="p-3 text-center font-mono text-[10px] text-slate-400 whitespace-nowrap">{item.date}</td>

                      {/* Source/Type Badge */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-1.5 rounded-md text-[9px] font-black ${sourceBadgeColor}`}>
                          {isArabic ? item.typeAr : item.typeEn}
                        </span>
                      </td>

                      {/* Party */}
                      <td className="p-3 font-semibold text-slate-200">
                        {isArabic ? item.partyAr : item.partyEn}
                      </td>

                      {/* Details */}
                      <td className="p-3 text-slate-400 text-xs text-wrap leading-relaxed">
                        {isArabic ? item.descriptionAr : item.descriptionEn}
                      </td>

                      {/* Weights */}
                      <td className="p-3 text-center font-mono font-extrabold whitespace-nowrap">
                        {item.weightInfo ? (
                          <span className="text-slate-200">{item.weightInfo}</span>
                        ) : (
                          <span className="text-slate-650">-</span>
                        )}
                      </td>

                      {/* Financial cash balance impact */}
                      <td className="p-3 text-center font-mono font-black whitespace-nowrap text-xs">
                        {item.cashAmount > 0 ? (
                          <span className="text-emerald-450">+{formatCurrency(item.cashAmount, isArabic)}</span>
                        ) : item.cashAmount < 0 ? (
                          <span className="text-rose-455">{formatCurrency(item.cashAmount, isArabic)}</span>
                        ) : (
                          <span className="text-slate-650">-</span>
                        )}
                      </td>

                      {/* Action buttons (Delete) */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-555 text-rose-400 hover:text-white rounded transition-colors"
                          title={isArabic ? "حذف المعاملة" : "Delete Operation"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
