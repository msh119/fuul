/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SafesCenter Component
 * A unified "Safes & Cloud Sync center" aggregating all Shop, Dealers, and Workshops physical and financial safes.
 */

import React, { useState } from "react";
import {
  Wallet,
  Scale,
  TrendingUp,
  Coins,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Database,
  Building2,
  User,
  FileSpreadsheet,
  ArrowRightLeft,
  Lock,
  PlusCircle,
  MinusCircle,
  Check,
  Edit,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldAlert,
  Save
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
import { formatCurrency, formatWeight, downloadCSV } from "../utils";

interface SafesCenterProps {
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
  onAddWalletTransaction: (tx: PrivateWalletTransaction) => void;
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

export default function SafesCenter({
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
  onAddWalletTransaction,
  googleUser,
  googleToken,
  spreadsheetsId,
  spreadsheetsUrl,
  isSyncingSheets,
  onSyncToGoogleSheets,
  onGoogleSignIn,
  onGoogleSheetsLogout,
  showAlert,
}: SafesCenterProps) {
  // Manual Box Cash Capital adjustment states
  const [isCaptialAdjustOpen, setIsCapitalAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescAr, setAdjustDescAr] = useState("");
  const [adjustDescEn, setAdjustDescEn] = useState("");
  const [adjustType, setAdjustType] = useState<"deposit" | "withdraw">("deposit");

  // Shop central balances
  const privateWalletBalance = walletTransactions.reduce((acc, t) => acc + t.amount, 0);
  const netGoldSafeActualWeight = purchases.reduce((acc, p) => acc + p.actualWeight, 0) -
    dealerStatements.reduce((acc, ds) => acc + ds.actualWeight, 0);
  const netGoldSafeEquivalentWeight = purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0) -
    dealerStatements.reduce((acc, ds) => acc + ds.equivalentWeight21, 0);

  const cumulativeSoldActualWeight = sales.reduce((acc, s) => acc + s.actualWeight, 0);
  const cumulativeSoldEquivalentWeight = sales.reduce((acc, s) => acc + s.equivalentWeight21, 0);

  // Handle Capital Injection/Withdrawal
  const handlePerformCapitalAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(adjustAmount);
    if (!adjustAmount || isNaN(amountNum) || amountNum <= 0) {
      showAlert(isArabic ? "يرجى إدخال مبلغ مالي صحيح وموجب." : "Please enter a valid positive amount.");
      return;
    }

    const directionLabelAr = adjustType === "deposit" ? "إيداع كاش تمويلي" : "سحب كاش للمالك";
    const directionLabelEn = adjustType === "deposit" ? "Capital Injected" : "Withdrawal by Owner";

    const finalAr = adjustDescAr.trim() || directionLabelAr;
    const finalEn = adjustDescEn.trim() || directionLabelEn;

    const newTx: PrivateWalletTransaction = {
      id: `w_cap_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: adjustType === "deposit" ? "deposit" : "withdraw",
      descriptionAr: finalAr,
      descriptionEn: finalEn,
      amount: adjustType === "deposit" ? amountNum : -amountNum
    };

    onAddWalletTransaction(newTx);
    showAlert(isArabic ? "تم تعديل رصيد الصندوق بنجاح!" : "Private cash box successfully adjusted!");
    setAdjustAmount("");
    setAdjustDescAr("");
    setAdjustDescEn("");
    setIsCapitalAdjustOpen(false);
  };

  // Helper to calculate Dealer Balances
  const getDealerBalances = (dealerId: string) => {
    const dealerItems = dealerStatements.filter(
      (item) => item.id.includes(`_${dealerId}`) || (dealerId === "d1" && item.id.startsWith("ds_"))
    );

    let totalCashLoans = 0;
    let totalCashPaid = 0;
    let totalWeightDelivered = 0;
    let totalWeightReceived = 0;

    dealerItems.forEach((item) => {
      if (item.type === "loan_received") {
        totalCashLoans += item.cashAmount;
      } else if (item.type === "loan_paid_cash") {
        totalCashPaid += Math.abs(item.cashAmount);
      } else if (item.type === "gold_sold_to_dealer") {
        totalWeightDelivered += Math.abs(item.equivalentWeight21);
      } else if (item.type === "gold_received_from_dealer") {
        totalWeightReceived += Math.abs(item.equivalentWeight21);
      }
    });

    const outstandingCashDebt = totalCashLoans - totalCashPaid;
    const outstandingGoldBalance = totalWeightDelivered - totalWeightReceived; // positive means they owe us gold
    const outstandingGoldActualWeight = dealerItems.reduce((acc, item) => acc + (item.actualWeight || 0), 0);

    return {
      outstandingCashDebt,
      outstandingGoldBalance,
      outstandingGoldActualWeight,
      transactionCount: dealerItems.length,
      items: dealerItems
    };
  };

  // Helper to calculate Workshop Balances
  const getWorkshopBalances = (workshopId: string) => {
    const wsItems = workshopTransactions.filter((tx) => tx.workshopId === workshopId);

    const hashCashSafe = wsItems.reduce((acc, tx) => acc + tx.cashAmount, 0);

    const hashGoldActualWeight = wsItems.reduce((acc, tx) => {
      if (tx.type === "purchase" || tx.type === "gold_deposit") {
        return acc + tx.actualWeight;
      } else if (tx.type === "sale" || tx.type === "gold_withdrawal") {
        return acc - tx.actualWeight;
      }
      return acc;
    }, 0);

    const hashGoldEquivWeight21 = wsItems.reduce((acc, tx) => {
      if (tx.type === "purchase" || tx.type === "gold_deposit") {
        return acc + tx.equivalentWeight21;
      } else if (tx.type === "sale" || tx.type === "gold_withdrawal") {
        return acc - tx.equivalentWeight21;
      }
      return acc;
    }, 0);

    return {
      cashBalance: hashCashSafe,
      goldActual: hashGoldActualWeight,
      goldEquiv21: hashGoldEquivWeight21,
      transactionCount: wsItems.length,
      items: wsItems
    };
  };

  // Table download offline CSV functions
  const downloadPurchasesCSV = () => {
    const headers = [
      isArabic ? "كود الفاتورة" : "Invoice ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "اسم العميل" : "Customer Name",
      isArabic ? "الوزن الخام (جرام)" : "Actual Weight (g)",
      isArabic ? "عيار الششنة" : "Detected Karat",
      isArabic ? "الوزن المعادل 21" : "21K Equiv Weight (g)",
      isArabic ? "سعر غرام 21" : "Price 21 (EGP)",
      isArabic ? "قيمة الذهب" : "Gold Value (EGP)",
      isArabic ? "رسم الششنة" : "Assay Fee (EGP)",
      isArabic ? "عمولة السمسار" : "Broker Fee (EGP)"
    ];
    const rows = purchases.map(p => [
      p.id, p.date, p.customerName, p.actualWeight, p.detectedKarat,
      p.equivalentWeight21, p.price21, p.goldValue, p.assayFee, p.brokerFee
    ]);
    downloadCSV(headers, rows, isArabic ? "مشتريات_الذهب_الأهرام" : "pyramids_gold_purchases");
  };

  const downloadSalesCSV = () => {
    const headers = [
      isArabic ? "كود الحركة" : "ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "التاجر المسلم" : "Dealer ID",
      isArabic ? "الوزن الفعلي" : "Actual Weight (g)",
      isArabic ? "العيار" : "Karat",
      isArabic ? "الوزن المعادل 21" : "21K Equiv Weight",
      isArabic ? "سعر عيار 21" : "Price 21",
      isArabic ? "القيمة الإجمالية" : "EGP Value"
    ];
    const rows = sales.map(s => [
      s.id, s.date, s.dealerId, s.actualWeight, s.detectedKarat, s.equivalentWeight21, s.price21, s.goldValue
    ]);
    downloadCSV(headers, rows, isArabic ? "مبيعات_الصاغة_الأهرام" : "pyramids_gold_sales");
  };

  const downloadCashTransactionsCSV = () => {
    const headers = [
      isArabic ? "الرقم" : "ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "نوع الحركة" : "Type",
      isArabic ? "البيان بالعربية" : "Description (Ar)",
      isArabic ? "البيان بالإنجليزية" : "Description (En)",
      isArabic ? "التغير المالي كاش" : "Amount (EGP)"
    ];
    const rows = walletTransactions.map(t => [
      t.id, t.date, t.type, t.descriptionAr, t.descriptionEn, t.amount
    ]);
    downloadCSV(headers, rows, isArabic ? "كشف_حساب_الخزنة_المالية" : "pyramids_gold_cashbox_ledger");
  };

  const downloadAllDealersSummaryCSV = () => {
    const headers = [
      isArabic ? "كود التاجر" : "Dealer ID",
      isArabic ? "الاسم بالعربية" : "Name (Arabic)",
      isArabic ? "الاسم بالإنجليزية" : "Name (English)",
      isArabic ? "الخزنة المالية (مدين)" : "Cash Balance (EGP)",
      isArabic ? "الخزنة الذهبية الفعيلة (g)" : "Actual Gold Stock (g)",
      isArabic ? "خزنة المعادل عيار 21 (g)" : "21K Equiv Stock (g)"
    ];
    const rows = dealers.map(d => {
      const bal = getDealerBalances(d.id);
      return [
        d.id,
        d.nameAr,
        d.nameEn,
        bal.outstandingCashDebt,
        bal.outstandingGoldActualWeight,
        bal.outstandingGoldBalance
      ];
    });
    downloadCSV(headers, rows, isArabic ? "ملخص_خزائن_التجار" : "pyramids_dealers_safes_summary");
  };

  const downloadAllWorkshopsSummaryCSV = () => {
    const headers = [
      isArabic ? "كود الورشة" : "Workshop ID",
      isArabic ? "الاسم بالعربية" : "Name (Arabic)",
      isArabic ? "الاسم بالإنجليزية" : "Name (English)",
      isArabic ? "الخزنة المالية (كاش)" : "Cash Stock (EGP)",
      isArabic ? "العهدة الذهبية الفعيلة (g)" : "Actual Weight Stock (g)",
      isArabic ? "عهدة عيار 21 المعادل (g)" : "21K Equiv Stock (g)"
    ];
    const rows = workshops.map(w => {
      const bal = getWorkshopBalances(w.id);
      return [
        w.id,
        w.nameAr,
        w.nameEn,
        bal.cashBalance,
        bal.goldActual,
        bal.goldEquiv21
      ];
    });
    downloadCSV(headers, rows, isArabic ? "ملخص_خزائن_الورش" : "pyramids_workshops_safes_summary");
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* MASTER TITLE BOX */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
              <Database className="w-5.5 h-5.5 text-amber-500" />
              <span>{isArabic ? "مركز الخزائن الموحد وتزامن الحسابات" : "Unified Safes Ledger & Google Sheets Sync Center"}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              {isArabic 
                ? "شاشة مركزية موحدة تدمج كافة الخزائن المالية والعينية (للمحل، التجار، والورش) وتتيح التصدير الفوري والإكسل المباشر."
                : "A single centralized ledger tracking both financial cash and physical gold vaults for the shop, merchants, and contractors."}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {!googleUser ? (
              <button
                onClick={onGoogleSignIn}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-xs text-amber-400 rounded-lg border border-amber-500/30 flex items-center gap-2 transition-all font-black"
              >
                <Database className="w-4 h-4 text-yellow-500" />
                <span>{isArabic ? "ربط بريد Google للتزامن المباشر" : "Link Google Account API"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300 font-semibold">{googleUser.email}</span>
                <span className="text-slate-600">|</span>
                <button
                  onClick={onSyncToGoogleSheets}
                  disabled={isSyncingSheets}
                  className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-bold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? "animate-spin" : ""}`} />
                  {isArabic ? "تزامن حركي" : "Sync Sheets"}
                </button>
                <span className="text-slate-600">|</span>
                <button onClick={onGoogleSheetsLogout} className="text-rose-400 hover:text-rose-300 transition-colors">
                  {isArabic ? "قطع الاتصال" : "Disconnect"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: SHOP CENTRAL SAFES */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2 text-[10px] bg-amber-500/10 text-amber-400 rounded-full font-bold border border-amber-500/10">Shop Central Safes</span>
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
            {isArabic ? "1️⃣ خزائن وموازين المحل والمالك الرئيسية (الخاصة بي)" : "1. Shop Central Vaults & Balances (My 3 Safes)"}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* 1. SHOP CASH BOX SAFE */}
          <div className="bg-slate-900 border border-emerald-500/25 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  {isArabic ? "الخزنة النقدية الكاش" : "My Cash Safe (Shop Box)"}
                </p>
                <h3 className="text-lg font-black text-emerald-400 mt-2 font-mono">
                  {formatCurrency(privateWalletBalance, isArabic)}
                </h3>
              </div>
              <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Wallet className="w-4.5 h-4.5" />
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{isArabic ? "سيولتك بالصندوق:" : "Cash liquidity:"}</span>
                <span className="font-mono text-slate-300 font-bold">{formatCurrency(privateWalletBalance, isArabic)}</span>
              </div>
              
              <button
                onClick={() => {
                  setIsCapitalAdjustOpen(!isCaptialAdjustOpen);
                  setAdjustType("deposit");
                }}
                className="w-full mt-1.5 py-1 px-2 bg-slate-950 hover:bg-slate-800 border border-emerald-500/20 hover:border-emerald-500/40 text-[9.5px] text-emerald-400 rounded font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3 h-3" />
                <span>{isArabic ? "إيداع / سحب مباشر للأموال" : "Direct Cash Deposit/Withdrawal"}</span>
              </button>
            </div>
          </div>

          {/* 2. PHYSICAL GOLD VAULT (ACTUAL WEIGHT RAW) */}
          <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  {isArabic ? "الخزنة الذهبية (الوزن الفعلي)" : "Physical Actual Weight Safe"}
                </p>
                <h3 className="text-lg font-black text-slate-100 mt-2 font-mono">
                  {formatWeight(netGoldSafeActualWeight, isArabic)}
                </h3>
              </div>
              <span className="p-2 bg-amber-500/10 rounded-lg text-amber-450 border border-amber-500/20">
                <Scale className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>{isArabic ? "الوارد كسر الكلي:" : "Total Raw In:"}</span>
                <span className="font-mono text-emerald-400 font-bold">
                  +{formatWeight(purchases.reduce((acc, p) => acc + p.actualWeight, 0), isArabic)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isArabic ? "المسلم للتجار الكلي:" : "Total Out to Dealer:"}</span>
                <span className="font-mono text-rose-450 font-bold">
                  -{formatWeight(dealerStatements.reduce((acc, ds) => acc + ds.actualWeight, 0), isArabic)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. EQUIVALENT 21K GOLD VAULT */}
          <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-wider">
                  {isArabic ? "خزنة الذهب المعادل (عيار ٢١)" : "Gold 21K Equiv Safe"}
                </p>
                <h3 className="text-lg font-black text-amber-500 mt-2 font-mono">
                  {formatWeight(netGoldSafeEquivalentWeight, isArabic)}
                </h3>
              </div>
              <span className="p-2 bg-amber-550/10 rounded-lg text-amber-500 border border-amber-550/20">
                <Scale className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>{isArabic ? "وارد عيار ٢١ الموحد:" : "Total 21k Incoming:"}</span>
                <span className="font-mono text-slate-300 font-bold">
                  {formatWeight(purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0), isArabic)}
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 leading-none">
                <span>{isArabic ? "الرصيد المعادل الكلي عيار ٢١ المتاح" : "Total net Karat 21 equivalent gold"}</span>
              </div>
            </div>
          </div>

          {/* 4. TOTAL SALES GOLD STORAGE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  {isArabic ? "متراكم خزنة المبيعات" : "Accumulated Sales Gold"}
                </p>
                <h3 className="text-lg font-black text-emerald-450 mt-2 font-mono">
                  {formatWeight(cumulativeSoldActualWeight, isArabic)}
                </h3>
              </div>
              <span className="p-2 bg-slate-950 rounded-lg text-emerald-500">
                <TrendingUp className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>{isArabic ? "معادل عيار ٢١ المفرغ:" : "Equiv 21 sold:"}</span>
                <span className="font-mono text-slate-300 font-bold">
                  {formatWeight(cumulativeSoldEquivalentWeight, isArabic)}
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 leading-none">
                <span>{isArabic ? "تراكم الذهب المستحق للتسوية والمقاصة" : "Accrued gold delivered offsets"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* MANUAL ADJUST CONSOLE */}
        {isCaptialAdjustOpen && (
          <form 
            onSubmit={handlePerformCapitalAdjustment}
            className="p-5 bg-slate-950 border border-emerald-500/20 rounded-xl animate-fade-in text-xs space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h4 className="font-bold text-slate-200">
                {isArabic ? "تعديل رصيد الخزنة المالية اليدوي (حقن أو سحب رأس المال)" : "Manual Cash-Box Adjustment (Inject / Withdraw)"}
              </h4>
              <button 
                type="button" 
                onClick={() => setIsCapitalAdjustOpen(false)}
                className="p-1 hover:bg-slate-900 rounded text-slate-400"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">{isArabic ? "نوع الحركة *" : "Adjustment Type *"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("deposit")}
                    className={`py-1.5 px-3 rounded text-center transition-colors font-bold ${adjustType === "deposit" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                  >
                    {isArabic ? "إيداع تمويلي" : "Deposit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("withdraw")}
                    className={`py-1.5 px-3 rounded text-center transition-colors font-bold ${adjustType === "withdraw" ? "bg-rose-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                  >
                    {isArabic ? "سحب مالك" : "Withdraw"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">{isArabic ? "المقدار المالي (EGP) *" : "Cash Amount (EGP) *"}</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded px-3 py-1.5 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">{isArabic ? "البيان بالعربية" : "Description (Arabic)"}</label>
                <input
                  type="text"
                  value={adjustDescAr}
                  onChange={(e) => setAdjustDescAr(e.target.value)}
                  placeholder={isArabic ? "إيداع رأس مال مالي إضافي بالخزينة" : "Ar details..."}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded px-3 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">{isArabic ? "البيان بالإنجليزية" : "Description (English)"}</label>
                <input
                  type="text"
                  value={adjustDescEn}
                  onChange={(e) => setAdjustDescEn(e.target.value)}
                  placeholder={isArabic ? "Additional capital funding injection" : "En details..."}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded px-3 py-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isArabic ? "تنفيذ القيد والتعديل" : "Execute Box Entry"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SECTION 2: DEALERS SAFES MATRIX */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] bg-amber-500/10 text-amber-400 rounded-full font-bold border border-amber-500/10">Dealers Live Safes</span>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
              {isArabic ? "2️⃣ خزائن ومقاصات ومطابقات حسابات كبار التجار (ذمم الصاغة)" : "2. Dealers Ledger Balances & Active Counters"}
            </h3>
          </div>
          <button
            onClick={downloadAllDealersSummaryCSV}
            className="p-1 px-2 text-[10.5px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-amber-400 rounded flex items-center gap-1 transition-colors font-bold"
          >
            <Download className="w-3 h-3" />
            <span>{isArabic ? "تحميل ملخص التجار CSV" : "Dealers Summary CSV"}</span>
          </button>
        </div>

        {dealers.length === 0 ? (
          <div className="p-8 bg-slate-900/50 rounded-xl border border-slate-850 text-center text-xs text-slate-500">
            {isArabic ? "لا يوجد تجار مسجلين حالياً لقراءة بيانات الخزائن الخاصة بهم." : "No registered dealers detected to parse vault balances."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dealers.map((d) => {
              const bal = getDealerBalances(d.id);
              const absTotalNetMoney = (bal.outstandingGoldBalance * 6170) - bal.outstandingCashDebt;

              return (
                <div 
                  key={d.id} 
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-xl shadow-lg relative overflow-hidden transition-all flex flex-col justify-between"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start pb-2.5 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-slate-950 text-amber-500 rounded-lg">
                        <User className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">{isArabic ? d.nameAr : d.nameEn}</h4>
                        <p className="text-[9.5px] text-slate-500 font-mono">ID: {d.id} | {bal.transactionCount} {isArabic ? "حركة مقيدة" : "log entries"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const headers = [
                          isArabic ? "معرف الحركة" : "Transaction ID",
                          isArabic ? "التاريخ" : "Date",
                          isArabic ? "نوع الحركة" : "Type",
                          isArabic ? "البيان بالعربية" : "Arabic Description",
                          isArabic ? "البيان بالإنجليزية" : "English Description",
                          isArabic ? "السيولة المالية (EGP)" : "Cash Flow (EGP)",
                          isArabic ? "الوزن الخام (g)" : "Raw Weight (g)",
                          isArabic ? "العيار" : "Finess",
                          isArabic ? "الوزن معادل ٢١" : "21K Equivalent",
                          isArabic ? "السعر المعتمد ٢١" : "Price Gold 21",
                          isArabic ? "صافي قيمة المقاصة" : "Gross Gold Value"
                        ];
                        const rows = bal.items.map(i => [
                          i.id, i.date, i.type, i.descriptionAr, i.descriptionEn, i.cashAmount,
                          i.actualWeight, i.karatValue, i.equivalentWeight21, i.price21, i.goldValue
                        ]);
                        downloadCSV(headers, rows, isArabic ? `كشف_حساب_التاجر_${d.nameAr}` : `pyramids_statement_dealer_${d.nameEn}`);
                      }}
                      className="p-1 px-1.5 bg-slate-950 hover:bg-slate-800 rounded text-[9px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors leading-none"
                      title={isArabic ? "تحميل كشف الحساب الحالي للتاجر" : "Download ledger for this dealer"}
                    >
                      <Download className="w-3 h-3" />
                      <span>{isArabic ? "كشف" : "Statement"}</span>
                    </button>
                  </div>

                  {/* Safes Matrix */}
                  <div className="grid grid-cols-3 gap-2.5 pt-3">
                    
                    {/* Safe A: Cash */}
                    <div className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 block font-bold truncate">
                        {isArabic ? "💵 كاش ج.م" : "Cash EGP"}
                      </span>
                      <span className={`text-[11px] font-mono font-black block mt-1 truncate ${bal.outstandingCashDebt > 0 ? "text-rose-450" : bal.outstandingCashDebt < 0 ? "text-emerald-400" : "text-slate-400"}`}>
                        {formatCurrency(Math.abs(bal.outstandingCashDebt), isArabic)}
                      </span>
                      <span className="text-[8px] text-slate-600 block leading-none mt-1">
                        {bal.outstandingCashDebt > 0 ? (isArabic ? "للتاجر علينا" : "He owes us") : bal.outstandingCashDebt < 0 ? (isArabic ? "لنا عليه" : "We owe him") : (isArabic ? "صفري" : "settled")}
                      </span>
                    </div>

                    {/* Safe B: Raw Weight */}
                    <div className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 block font-bold truncate">
                        {isArabic ? "⚖️ وزن خام" : "Raw Weight"}
                      </span>
                      <span className={`text-[11px] font-mono font-black block mt-1 truncate ${bal.outstandingGoldActualWeight >= 0 ? "text-amber-500" : "text-rose-500"}`}>
                        {formatWeight(Math.abs(bal.outstandingGoldActualWeight), isArabic)}
                      </span>
                      <span className="text-[8px] text-slate-600 block leading-none mt-1">
                        {bal.outstandingGoldActualWeight >= 0 ? (isArabic ? "ميزان سائل" : "مستلم سائل") : (isArabic ? "مستلم سائل" : "مسحوب")}
                      </span>
                    </div>

                    {/* Safe C: 21K Equiv */}
                    <div className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 block font-bold truncate">
                        {isArabic ? "⚜️ معادل ٢١" : "21K Equiv"}
                      </span>
                      <span className={`text-[11px] font-mono font-black block mt-1 truncate ${bal.outstandingGoldBalance >= 0 ? "text-amber-400" : "text-rose-500"}`}>
                        {formatWeight(Math.abs(bal.outstandingGoldBalance), isArabic)}
                      </span>
                      <span className="text-[8px] text-slate-600 block leading-none mt-1">
                        {bal.outstandingGoldBalance >= 0 ? (isArabic ? "طلب عين" : "مطالبة") : (isArabic ? "دائن عين" : "مسحوب")}
                      </span>
                    </div>

                  </div>

                  {/* Absolute Settle Scent */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
                    <span>{isArabic ? "قيمة المقاصة المحتسبة عيار 21:" : "Equiv Cash Settle value:"}</span>
                    <span className="font-mono text-slate-300">
                      {isArabic ? "الصافي:" : "Net:"} <span className={`font-bold ${absTotalNetMoney >= 0 ? "text-emerald-400" : "text-rose-450"}`}>{formatCurrency(absTotalNetMoney, isArabic)}</span>
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: WORKSHOPS SAFES MATRIX */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] bg-amber-500/10 text-amber-400 rounded-full font-bold border border-amber-500/10">Workshops Live Safes</span>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
              {isArabic ? "3️⃣ عهد الخزائن الذهبية والمالية للورش والصاغة الموردين" : "3. Workshops Contractor Safes & Live Stocks"}
            </h3>
          </div>
          <button
            onClick={downloadAllWorkshopsSummaryCSV}
            className="p-1 px-2 text-[10.5px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-amber-500 rounded flex items-center gap-1 transition-colors font-bold"
          >
            <Download className="w-3 h-3" />
            <span>{isArabic ? "تحميل عهد الورش CSV" : "Workshops Summary CSV"}</span>
          </button>
        </div>

        {workshops.length === 0 ? (
          <div className="p-8 bg-slate-900/50 rounded-xl border border-slate-850 text-center text-xs text-slate-500">
            {isArabic ? "لا توجد ورش أو مسابك مسجلة بعد لقراءة بيانات الخزائن الخاصة بها." : "No registered workshops or assayers detected to parse safety structures."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {workshops.map((w) => {
              const bal = getWorkshopBalances(w.id);

              return (
                <div 
                  key={w.id} 
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-xl shadow-lg relative overflow-hidden transition-all flex flex-col justify-between"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start pb-2.5 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-slate-950 text-emerald-550 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">{isArabic ? w.nameAr : w.nameEn}</h4>
                        <p className="text-[9.5px] text-slate-500 font-mono">ID: {w.id} | {bal.transactionCount} {isArabic ? "حركة مالية وعينية" : "workshop transactions"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const headers = [
                          isArabic ? "معرف الحركة" : "Tx ID",
                          isArabic ? "التاريخ" : "Date",
                          isArabic ? "النوع" : "Type",
                          isArabic ? "اسم العميل" : "Customer / Dealer",
                          isArabic ? "الوزن الفعلي (جرام)" : "Actual Weight (g)",
                          isArabic ? "العيار" : "Detected Karat",
                          isArabic ? "المعادل ٢١ (جرام)" : "21K Equivalent (g)",
                          isArabic ? "سعر عيار ٢١ للغرام" : "Grams Price 21",
                          isArabic ? "تغير الكاش (EGP)" : "Cash flow change",
                          isArabic ? "البيان بالعربية" : "Arabic Description",
                          isArabic ? "البيان بالإنجليزية" : "English Description"
                        ];
                        const rows = bal.items.map(i => [
                          i.id, i.date, i.type, i.customerName || i.dealerId || "", i.actualWeight,
                          i.detectedKarat, i.equivalentWeight21, i.price21, i.cashAmount, i.descriptionAr, i.descriptionEn
                        ]);
                        downloadCSV(headers, rows, isArabic ? `دفتر_حركة_الورشة_${w.nameAr}` : `pyramids_ledger_workshop_${w.nameEn}`);
                      }}
                      className="p-1 px-1.5 bg-slate-950 hover:bg-slate-800 rounded text-[9px] text-slate-400 hover:text-amber-450 flex items-center gap-1 transition-colors leading-none"
                      title={isArabic ? "تحميل كشف حركات الورشة الكاملة" : "Download ledger for this workshop"}
                    >
                      <Download className="w-3 h-3" />
                      <span>{isArabic ? "دفتر الحركة" : "Ledger File"}</span>
                    </button>
                  </div>

                  {/* Safes Matrix */}
                  <div className="grid grid-cols-3 gap-2.5 pt-3">
                    
                    {/* Safe A: Cash */}
                    <div className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 block font-bold truncate">
                        {isArabic ? "💵 خزينة كاش الورشة" : "Workshop Cash Box"}
                      </span>
                      <span className={`text-[11px] font-mono font-black block mt-1 truncate ${bal.cashBalance >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {formatCurrency(Math.abs(bal.cashBalance), isArabic)}
                      </span>
                      <span className="text-[8px] text-slate-600 block leading-none mt-1">
                        {bal.cashBalance >= 0 ? (isArabic ? "متوفر بالصندوق" : "Cash Available") : (isArabic ? "عجز مالي بالخزينة" : "Cash Overdrawn")}
                      </span>
                    </div>

                    {/* Safe B: Raw Weight */}
                    <div className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 block font-bold truncate">
                        {isArabic ? "⚖️ عهدة خام ذهب" : "Actual Gold On-Hand"}
                      </span>
                      <span className={`text-[11px] font-mono font-black block mt-1 truncate ${bal.goldActual >= 0 ? "text-slate-100" : "text-rose-500"}`}>
                        {formatWeight(Math.abs(bal.goldActual), isArabic)}
                      </span>
                      <span className="text-[8px] text-slate-600 block leading-none mt-1">
                        {bal.goldActual >= 0 ? (isArabic ? "صافي عهدة عينية" : "In workshop vault") : (isArabic ? "سحب زائد" : "deficit")}
                      </span>
                    </div>

                    {/* Safe C: 21K Equiv */}
                    <div className="p-2 bg-slate-955 rounded border border-slate-850 flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 block font-bold truncate">
                        {isArabic ? "⚜️ معادل عيار ٢١" : "21K Equiv Stock"}
                      </span>
                      <span className={`text-[11px] font-mono font-black block mt-1 truncate ${bal.goldEquiv21 >= 0 ? "text-amber-500" : "text-rose-500"}`}>
                        {formatWeight(Math.abs(bal.goldEquiv21), isArabic)}
                      </span>
                      <span className="text-[8px] text-slate-600 block leading-none mt-1">
                        {isArabic ? "العهدة الذهبية المقاسة" : "Equivalent weight stock"}
                      </span>
                    </div>

                  </div>

                  {/* Manager and Details */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[9.5px] text-slate-500">
                    <span>{isArabic ? `أمين الورشة: ${w.managerAr || "غير محدد"}` : `Manager: ${w.managerEn || "N/A"}`}</span>
                    <span className="text-slate-600">{w.phone || ""}</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: DATA EXPORT & DOWNLOADING HUB */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <h3 className="text-xs font-black text-amber-400 mb-2 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          <span>{isArabic ? "التحميلات وتصدير الدفاتر الموحدة غير المتصلة" : "Consolidated Offline Data Export & Spreadsheets Sync Center"}</span>
        </h3>
        <p className="text-[11px] text-slate-400 mb-4">
          {isArabic 
            ? "حمل كافة ملفات حركة الصياغة والشراء لفتحها ببرنامج Excel بشكل منسق يدعم اللغة العربية دون الحاجة لتشغيل الإنترنت."
            : "Direct structured data exports download. Each file includes standard UTF-8 BOM encoding so it opens seamlessly in Microsoft Excel."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Purchase */}
          <button
            onClick={downloadPurchasesCSV}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/20 rounded-xl transition-all flex flex-col justify-between items-start text-xs font-semibold group cursor-pointer"
          >
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
              <Scale className="w-4.5 h-4.5" />
            </span>
            <div className="mt-4">
              <span className="text-slate-200 block text-xs">{isArabic ? "جدول مشتريات الذهب" : "Gold Purchases CSV"}</span>
              <span className="text-[9.5px] text-slate-500 font-mono block mt-1">{purchases.length} {isArabic ? "فاتورة شراء مقيدة" : "log rows"}</span>
            </div>
          </button>

          {/* Sales */}
          <button
            onClick={downloadSalesCSV}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/20 rounded-xl transition-all flex flex-col justify-between items-start text-xs font-semibold group cursor-pointer"
          >
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4.5 h-4.5" />
            </span>
            <div className="mt-4">
              <span className="text-slate-200 block text-xs">{isArabic ? "جدول مبيعات التجار" : "Gold Sales CSV"}</span>
              <span className="text-[9.5px] text-slate-500 font-mono block mt-1">{sales.length} {isArabic ? "فاتورة مبيعات مقيدة" : "sales details"}</span>
            </div>
          </button>

          {/* Cash Ledger */}
          <button
            onClick={downloadCashTransactionsCSV}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/20 rounded-xl transition-all flex flex-col justify-between items-start text-xs font-semibold group cursor-pointer"
          >
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
              <Wallet className="w-4.5 h-4.5" />
            </span>
            <div className="mt-4">
              <span className="text-slate-200 block text-xs">{isArabic ? "كشف حركة الصندوق الكاش" : "Cash Box Ledger"}</span>
              <span className="text-[9.5px] text-slate-500 font-mono block mt-1">{walletTransactions.length} {isArabic ? "عملية سحب وتدفق" : "transactions"}</span>
            </div>
          </button>

          {/* All Dealers Summary */}
          <button
            onClick={downloadAllDealersSummaryCSV}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/20 rounded-xl transition-all flex flex-col justify-between items-start text-xs font-semibold group cursor-pointer"
          >
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
              <User className="w-4.5 h-4.5" />
            </span>
            <div className="mt-4">
              <span className="text-slate-200 block text-xs">{isArabic ? "ملخص جميع أرصدة التجار" : "All Dealers Summary"}</span>
              <span className="text-[9.5px] text-slate-500 font-mono block mt-1">{dealers.length} {isArabic ? "تاجر نشط بالعهد" : "dealers in vault"}</span>
            </div>
          </button>

          {/* All Workshops Summary */}
          <button
            onClick={downloadAllWorkshopsSummaryCSV}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/20 rounded-xl transition-all flex flex-col justify-between items-start text-xs font-semibold group cursor-pointer"
          >
            <span className="p-2 bg-teal-500/10 text-teal-400 rounded-lg group-hover:scale-105 transition-transform">
              <Building2 className="w-4.5 h-4.5" />
            </span>
            <div className="mt-4">
              <span className="text-slate-200 block text-xs">{isArabic ? "ملخص عهد الورش والمسابك" : "Workshops Summary"}</span>
              <span className="text-[9.5px] text-slate-500 font-mono block mt-1">{workshops.length} {isArabic ? "ورشة قيد العمل" : "workshops loaded"}</span>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}
