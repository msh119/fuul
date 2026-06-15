/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Coins,
  TrendingUp,
  Scale,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Briefcase,
  Layers,
  Activity,
  UserCheck,
  Trash2,
  Edit,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  Sliders,
  FileSpreadsheet
} from "lucide-react";
import { PurchaseItem, SaleItem, PublicExpenseItem, PrivateWalletTransaction, DealerStatementItem } from "../types";
import { formatCurrency, formatWeight, downloadCSV } from "../utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";

interface DashboardOverviewProps {
  purchases: PurchaseItem[];
  sales: SaleItem[];
  expenses: PublicExpenseItem[];
  walletTransactions: PrivateWalletTransaction[];
  dealerStatements: DealerStatementItem[];
  isArabic: boolean;
  onDeleteWalletTransaction: (id: string) => void;
  onClearWalletTransactions: () => void;
  onUpdateWalletTransaction: (updatedTx: PrivateWalletTransaction) => void;
  onAddWalletTransaction: (newTx: PrivateWalletTransaction) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showAlert: (message: string) => void;
}

export default function DashboardOverview({
  purchases,
  sales,
  expenses,
  walletTransactions,
  dealerStatements,
  isArabic,
  onDeleteWalletTransaction,
  onClearWalletTransactions,
  onUpdateWalletTransaction,
  onAddWalletTransaction,
  showConfirm,
  showAlert,
}: DashboardOverviewProps) {
  const [filterType, setFilterType] = useState<string>("all");

  // State-driven interactive modal tools
  const [editingTx, setEditingTx] = useState<PrivateWalletTransaction | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editDescAr, setEditDescAr] = useState<string>("");
  const [editDescEn, setEditDescEn] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editIsPositive, setEditIsPositive] = useState<boolean>(true);

  // Quick Direct Vault Balance Overrides
  const [isOverriding, setIsOverriding] = useState<boolean>(false);
  const [newTargetBalance, setNewTargetBalance] = useState<string>("");

  const handleExportWalletExcel = () => {
    const headers = [
      isArabic ? "معرف الحركة" : "Transaction ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "نوع المعاملة" : "Type",
      isArabic ? "البيان بالعربية" : "Description (Ar)",
      isArabic ? "البيان بالإنجليزية" : "Description (En)",
      isArabic ? "المقدار المالي (ج.م)" : "Cash Impact (EGP)"
    ];

    const rows = walletTransactions.map((w) => [
      w.id,
      w.date,
      w.type,
      w.descriptionAr,
      w.descriptionEn,
      w.amount
    ]);

    downloadCSV(headers, rows, isArabic ? "حسابات_خزينة_الأهرام" : "pyramids_wallet_cashflow");
    showAlert(isArabic ? "تم تحميل كشف الصندوق والميزانية بنجاح!" : "Wallet statement downloaded as Excel (CSV) successfully!");
  };

  const startEditing = (tx: PrivateWalletTransaction) => {
    setEditingTx(tx);
    setEditDate(tx.date || "");
    setEditDescAr(tx.descriptionAr || "");
    setEditDescEn(tx.descriptionEn || "");
    setEditAmount(tx.amount !== undefined ? Math.abs(tx.amount).toString() : "");
    setEditIsPositive(tx.amount !== undefined ? tx.amount >= 0 : true);
  };

  const handleSaveEdit = () => {
    if (!editingTx) return;
    const amountVal = Math.abs(Number(editAmount)) || 0;
    const finalAmount = editIsPositive ? amountVal : -amountVal;

    const updated: PrivateWalletTransaction = {
      ...editingTx,
      date: editDate,
      descriptionAr: editDescAr.trim() || editingTx.descriptionAr,
      descriptionEn: editDescEn.trim() || editingTx.descriptionEn,
      amount: finalAmount
    };

    onUpdateWalletTransaction(updated);
    setEditingTx(null);
  };

  const handlePerformOverride = () => {
    const targetVal = Number(newTargetBalance);
    if (isNaN(targetVal)) {
      showAlert(isArabic ? "برجاء توفير قيمة مالية صحيحة" : "Please provide a valid numeric value.");
      return;
    }

    const currentBalance = walletTransactions.reduce((acc, t) => acc + t.amount, 0);
    const diff = targetVal - currentBalance;

    if (diff === 0) {
      showAlert(isArabic ? "الرصيد المدخل مطابق للرصيد الفعلي حالياً!" : "The entered balance matches current ledger balance!");
      setIsOverriding(false);
      return;
    }

    const newTx: PrivateWalletTransaction = {
      id: `w_balance_override_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: diff > 0 ? "deposit" : "withdraw",
      descriptionAr: `تسوية يدوية لمطابقة رصيد الخزنة الفعلي (جرد الخزنة)`,
      descriptionEn: `Manual adjustment to match physical vault cash box count`,
      amount: diff
    };

    onAddWalletTransaction(newTx);
    setNewTargetBalance("");
    setIsOverriding(false);
    showAlert(isArabic ? "تم تعديل وتسوية الخزنة وتسجيل حركة الفارق المالي بنجاح!" : "Vault balance successfully aligned and adjust transaction posted!");
  };

  // Multi-Language Translation Map
  const t = {
    // Labels
    privateWallet: isArabic ? "الخزنة الخاصة (صندوق المالك)" : "Private Cash Wallet (Owner's Box)",
    assayRevenue: isArabic ? "إيرادات التحليل والششنة" : "Total Assay Revenues",
    outstandingDealerDebts: isArabic ? "ديون وسلفيات التجار (معلقات)" : "Dealer Cash Swaps (Outstanding)",
    unpaidGoldDealer: isArabic ? "رصيد معلقات الذهب طرف التجار" : "Outstanding Gold Balance with Dealers",
    netProfit: isArabic ? "الربح الصافي الجاري" : "Net Business Profit",
    recentTransactions: isArabic ? "دفتر حركة الخزنة الخاصة بالتفصيل" : "Private Ledger Transaction Feed",
    all: isArabic ? "الكل" : "All",
    deposits: isArabic ? "الإيداعات ورأس المال" : "Deposits & Capital",
    withdrawals: isArabic ? "المسحوبات والمصروفات" : "Outflows & Expenses",
    goldFlowLabel: isArabic ? "منحنى حركة موازين الذهب الصافي عيار 21" : "Pure Gold (21 Equivalent) Balance Curve",
    cashFlowLabel: isArabic ? "حركة نقدية الموازنة والتدفق والربح" : "Wallet Liquidity & Capital Inflows",
    date: isArabic ? "التاريخ" : "Date",
    description: isArabic ? "البيان والعملية" : "Description / Memo",
    amount: isArabic ? "القيمة" : "Amount EGP",
    type: isArabic ? "النوع" : "Transaction Type",
    systemStats: isArabic ? "مؤشرات الموازنة العينية للمعمل" : "Pyramids Market Operational Metrics",
    goldEquivalent: isArabic ? "ذهب معادل عيار 21" : "Karat 21 Equivalent Gold",
    noData: isArabic ? "لا توجد حركات مالية كافية حالياً." : "No transactions logged in private ledger yet.",
    profitFormulaLabel: isArabic ? "معادلة احتساب ربحية الدفتر" : "Market Profit Formula (Tahyeef Balanced)",
  };

  // 1. Calculate Private Wallet Balance (Sum of walletTransactions.amount)
  const privateWalletBalance = walletTransactions.reduce((acc, t) => acc + t.amount, 0);

  // 2. Calculate Total Assay Revenues
  const totalAssayRevenues = walletTransactions
    .filter((t) => t.type === "assay_fee_income")
    .reduce((acc, t) => acc + t.amount, 0);

  // 3. Outstanding Dealer Debts (Cumulative Cash Loans received minus cash repayments)
  const totalLoansReceived = dealerStatements
    .filter((ds) => ds.type === "loan_received")
    .reduce((acc, ds) => acc + ds.cashAmount, 0);

  const totalLoansPaidCash = dealerStatements
    .filter((ds) => ds.type === "loan_paid_cash")
    .reduce((acc, ds) => acc + Math.abs(ds.cashAmount), 0);

  const outstandingDealerCashDebts = totalLoansReceived - totalLoansPaidCash;

  // Outstanding gold balance with dealers (cumulative delivered minus received)
  const totalGoldDelivered21 = dealerStatements
    .filter((ds) => ds.type === "gold_sold_to_dealer")
    .reduce((acc, ds) => acc + Math.abs(ds.equivalentWeight21), 0);

  const totalGoldReceived21 = dealerStatements
    .filter((ds) => ds.type === "gold_received_from_dealer")
    .reduce((acc, ds) => acc + Math.abs(ds.equivalentWeight21), 0);

  const outstandingDealerGoldWeight = totalGoldDelivered21 - totalGoldReceived21;

  // 4. Calculate Net Business Profit
  // Profit = (Total Sales gold value to dealers) - (Total purchases gold value from customers) + (Assay fees) - (Broker fees) - (Overhead expenses)
  const totalSalesGoldValue = sales.reduce((acc, s) => acc + s.goldValue, 0);
  const totalPurchasesGoldValue = purchases.reduce((acc, p) => acc + p.goldValue, 0);
  const totalBrokerFees = purchases.reduce((acc, p) => acc + p.brokerFee, 0);
  const totalOverheadExpenses = expenses
    .filter((e) => e.category === "overhead")
    .reduce((acc, e) => acc + e.amount, 0);

  const netBusinessProfit =
    totalSalesGoldValue - totalPurchasesGoldValue + totalAssayRevenues - totalBrokerFees - totalOverheadExpenses;

  // 5. Total Incoming Gold Actual Weight (إجمالي الوزن الذهب الخام الداخل)
  const totalIncomingActualWeight = purchases.reduce((acc, p) => acc + p.actualWeight, 0) +
    dealerStatements
      .filter((ds) => ds.type === "gold_received_from_dealer")
      .reduce((acc, ds) => acc + Math.abs(ds.actualWeight), 0);

  // 6. Total Incoming Gold Equivalent weight (إجمالي عيار المعادل للداخل)
  const totalIncomingEquivalentWeight = purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0) +
    dealerStatements
      .filter((ds) => ds.type === "gold_received_from_dealer")
      .reduce((acc, ds) => acc + Math.abs(ds.equivalentWeight21), 0);

  // 7. Net physical actual gold weight inside safe (الرصيد الفعلي الحالي بالخزنة)
  const netGoldSafeActualWeight = purchases.reduce((acc, p) => acc + p.actualWeight, 0) -
    dealerStatements.reduce((acc, ds) => acc + ds.actualWeight, 0);

  // 8. Net equivalent gold 21 weight inside safe (الرصيد المعادل الحالي بالخزنة)
  const netGoldSafeEquivalentWeight = purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0) -
    dealerStatements.reduce((acc, ds) => acc + ds.equivalentWeight21, 0);

  // Cumulative sold gold (خزنة المبيعات للتجار)
  const cumulativeSoldActualWeight = sales.reduce((acc, s) => acc + s.actualWeight, 0);
  const cumulativeSoldEquivalentWeight = sales.reduce((acc, s) => acc + s.equivalentWeight21, 0);

  // Filtered Wallet logs for view
  const filteredWalletTransactions = walletTransactions.filter((trans) => {
    if (filterType === "all") return true;
    if (filterType === "deposit-only") {
      return trans.amount > 0;
    }
    if (filterType === "outflow-only") {
      return trans.amount < 0;
    }
    return true;
  });

  // Calculate chart data aggregated by dates
  const allDates = Array.from(
    new Set([
      ...purchases.map((p) => p.date),
      ...sales.map((s) => s.date),
      ...expenses.map((e) => e.date),
      ...walletTransactions.map((w) => w.date)
    ])
  ).sort();

  const chartData = allDates.map((date) => {
    // Total purchased grams of equivalent 21
    const dayPurchases21 = purchases
      .filter((p) => p.date === date)
      .reduce((acc, p) => acc + p.equivalentWeight21, 0);

    // Total sold grams of equivalent 21
    const daySales21 = sales
      .filter((s) => s.date === date)
      .reduce((acc, s) => acc + s.equivalentWeight21, 0);

    // Day incomes
    const dayCashIn = walletTransactions
      .filter((w) => w.date === date && w.amount > 0)
      .reduce((acc, w) => acc + w.amount, 0);

    // Day outflows
    const dayCashOut = walletTransactions
      .filter((w) => w.date === date && w.amount < 0)
      .reduce((acc, w) => acc + Math.abs(w.amount), 0);

    return {
      date,
      [isArabic ? "الوارد (عيار 21)" : "Purchases (21g)"]: Number(dayPurchases21.toFixed(3)),
      [isArabic ? "الصادر للتاجر" : "Sales to Dealer"]: Number(daySales21.toFixed(3)),
      [isArabic ? "المقبوضات المالية" : "Inflows (EGP)"]: dayCashIn,
      [isArabic ? "المدفوعات والمصاريف" : "Outflows (EGP)"]: dayCashOut
    };
  });

  return (
    <div id="gold-accounting-dashboard-overview" className="space-y-6 animate-fade-in text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* SECTION 1: DENSE FINANCIAL BALANCE TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* WALLET BOX */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-slate-400 text-xs font-bold font-sans uppercase tracking-wider">{t.privateWallet}</p>
              {!isOverriding ? (
                <div className="flex items-center gap-2 mt-2">
                  <h3 className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(privateWalletBalance, isArabic)}
                  </h3>
                  <button
                    onClick={() => {
                      setNewTargetBalance(privateWalletBalance.toString());
                      setIsOverriding(true);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                    title={isArabic ? "تعديل وضبط يدوي لرصيد الخزنة الفعلي" : "Adjust / Override actual vault balance"}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <label className="text-[10px] text-amber-400 block font-bold">
                    {isArabic ? "أدخل الرصيد الفعلي الحالي:" : "Enter physical count balance:"}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={newTargetBalance}
                      onChange={(e) => setNewTargetBalance(e.target.value)}
                      className="w-full max-w-[120px] bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
                      placeholder="e.g. 15000"
                    />
                    <button
                      onClick={handlePerformOverride}
                      className="p-1 bg-emerald-500 hover:bg-emerald-600 rounded text-slate-950 transition-colors"
                      title={isArabic ? "تأكيد ومواءمة الرصيد" : "Confirm adjustment"}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => setIsOverriding(false)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 transition-colors"
                      title={isArabic ? "إلغاء الأمر" : "Cancel"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20 flex-shrink-0">
              <Wallet className="w-5 h-5 animate-pulse" />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
            <span>{isArabic ? "السيولة الحالية بالصندوق" : "Cash on hand"}</span>
            <span className="font-mono text-slate-300 font-bold">{walletTransactions.length} {isArabic ? "حركة" : "ops"}</span>
          </div>
        </div>

        {/* ASSAY REVENUES */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.assayRevenue}</p>
              <h3 className="text-xl font-black text-emerald-400 mt-2 font-mono">
                {formatCurrency(totalAssayRevenues, isArabic)}
              </h3>
            </div>
            <span className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/25">
              <Activity className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
            <span>{isArabic ? "رافد أرباح المعمل المستقل" : "Independent assay profit stream"}</span>
            <span className="text-emerald-400 font-bold font-mono">
              {walletTransactions.filter((tw) => tw.type === "assay_fee_income").length} {isArabic ? "عملية ششنة" : "tests"}
            </span>
          </div>
        </div>

        {/* OUTSTANDING LOANS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.outstandingDealerDebts}</p>
              <h3 className="text-xl font-black text-rose-400 mt-2 font-mono">
                {formatCurrency(outstandingDealerCashDebts, isArabic)}
              </h3>
            </div>
            <span className="p-2.5 bg-rose-500/10 rounded-lg text-rose-450 border border-rose-500/25">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500">
            <div className="flex justify-between">
              <span>{isArabic ? "أرصدة سلفيات المعلقات نقدية" : "Outstanding loan balance"}</span>
              <span className="text-rose-400 font-mono font-bold">{formatCurrency(totalLoansReceived, isArabic)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-dashed border-slate-800/80">
              <span className="text-slate-400">{t.unpaidGoldDealer}:</span>
              <span className={`font-mono font-bold ${outstandingDealerGoldWeight >= 0 ? "text-amber-400" : "text-rose-400"}`}>
                {outstandingDealerGoldWeight.toFixed(3)}g
              </span>
            </div>
          </div>
        </div>

        {/* NET PROFIT WITH FORMULA TRIBUTE */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.netProfit}</p>
              <h3 className={`text-xl font-black mt-2 font-mono ${netBusinessProfit >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                {formatCurrency(netBusinessProfit, isArabic)}
              </h3>
            </div>
            <span className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            <div className="flex justify-between font-semibold">
              <span>{isArabic ? "المبيعات الفورية ناقص مشتريات الصاغة" : "Sales minus customer buys"}</span>
              <span className="font-bold font-mono text-slate-300">
                {netBusinessProfit >= 0 ? "+" : ""}{formatCurrency(netBusinessProfit, isArabic)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 1.5: THE THREE MAIN VAULTS FOR THE SHOP/OWNER */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2 text-[10px] bg-amber-500/10 text-amber-400 rounded-full font-bold border border-amber-500/10">Shop Central Safes</span>
          <h3 className="text-xs font-bold text-slate-200">
            {isArabic ? "خزائن وموازين المحل الرئيسية الـثـلاثـيـة (الخاصة بي)" : "Main Shop Central Vaults & Balances (My 3 Safes)"}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. FINANCIAL CASH SAFE FOR THE SHOP */}
          <div className="bg-slate-900 border border-emerald-500/25 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-450 text-[11px] font-black uppercase tracking-wider">
                  {isArabic ? "1️⃣ الخزنة المالية الخاصة بي (المحل)" : "1. My Private Cash Safe (Shop)"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <h3 className="text-lg font-black text-emerald-400 font-mono">
                    {formatCurrency(privateWalletBalance, isArabic)}
                  </h3>
                  {!isOverriding ? (
                    <button
                      onClick={() => {
                        setNewTargetBalance(privateWalletBalance.toString());
                        setIsOverriding(true);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                      title={isArabic ? "ضبط يدوي لرصيد الخزنة الفعلي" : "Adjust actual vault balance"}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={newTargetBalance}
                        onChange={(e) => setNewTargetBalance(e.target.value)}
                        className="max-w-[80px] bg-slate-950 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                      />
                      <button onClick={handlePerformOverride} className="p-1 bg-emerald-500 hover:bg-emerald-600 rounded text-slate-950">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Wallet className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>{isArabic ? "السيولة الحالية بالصندوق:" : "Cash liquidity:"}</span>
                <span className="font-mono text-slate-300 font-bold">{formatCurrency(privateWalletBalance, isArabic)}</span>
              </div>
            </div>
          </div>

          {/* 2. PHYSICAL GOLD VAULT (ACTUAL WEIGHT RAW) */}
          <div className="bg-slate-900 border border-amber-550/30 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-450 text-[11px] font-black uppercase tracking-wider">
                  {isArabic ? "2️⃣ الخزنة الذهبية الخاصة بي (الوزن الفعلي)" : "2. My Gold Safe (Physical Actual Weight)"}
                </p>
                <h3 className="text-lg font-black text-slate-100 mt-2 font-mono">
                  {formatWeight(netGoldSafeActualWeight, isArabic)}
                </h3>
              </div>
              <span className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                <Layers className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>{isArabic ? "الوارد كسر من الشراء:" : "Raw In from customer:"}</span>
                <span className="font-mono text-emerald-400 font-bold">
                  +{formatWeight(purchases.reduce((acc, p) => acc + p.actualWeight, 0), isArabic)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isArabic ? "المسلم للتاجر:" : "Out to dealer:"}</span>
                <span className="font-mono text-rose-400 font-bold">
                  -{formatWeight(dealerStatements.reduce((acc, ds) => acc + ds.actualWeight, 0), isArabic)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. EQUIVALENT 21K GOLD VAULT */}
          <div className="bg-slate-900 border border-amber-500/25 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-400 text-[11px] font-black uppercase tracking-wider">
                  {isArabic ? "3️⃣ خزنة الذهب المعادل للمحل (عيار ٢١)" : "3. My Gold 21K Equiv Safe (Shop)"}
                </p>
                <h3 className="text-lg font-black text-amber-500 mt-2 font-mono">
                  {formatWeight(netGoldSafeEquivalentWeight, isArabic)}
                </h3>
              </div>
              <span className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                <Scale className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>{isArabic ? "إجمالي وارد عيار ٢١:" : "Total 21k Incoming:"}</span>
                <span className="font-mono text-slate-355 font-bold">
                  {formatWeight(purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0), isArabic)}
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 leading-none mt-1">
                <span>{isArabic ? "الرصيد الكلي المعادل عيار ٢١ المتاح" : "Total net Karat 21 equivalent gold reserves"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ADDITIONAL SECONDARY STOCK METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* SALES GOLD VAULT (THE CUMULATIVE SALES STORAGE) */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">
                {isArabic ? "متراكم المبيعات (الذهب المباع للتجار)" : "Sales Gold safe (Cumu Sold)"}
              </p>
              <h4 className="text-sm font-black text-emerald-450 mt-1 font-mono">
                {formatWeight(cumulativeSoldActualWeight, isArabic)} <span className="text-[10px] text-slate-500 font-sans">({isArabic ? "معادل ٢١:" : "equiv 21:"} {formatWeight(cumulativeSoldEquivalentWeight, isArabic)})</span>
              </h4>
            </div>
            <span className="p-2 bg-slate-950 rounded-lg text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          {/* NET FLOW TURNOVER TURNS */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">
                {isArabic ? "معدل تدفق ودوران موازين المحل" : "Gold Flow Turnover Rate"}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                <span className="font-mono text-emerald-400 font-bold">+{purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0).toFixed(1)}g</span>
                <span className="text-slate-600">/</span>
                <span className="font-mono text-rose-450 font-bold">-{dealerStatements.filter((ds) => ds.type === "gold_sold_to_dealer").reduce((acc, ds) => acc + Math.abs(ds.equivalentWeight21), 0).toFixed(1)}g</span>
              </div>
            </div>
            <span className="p-2 bg-slate-950 rounded-lg text-slate-400">
              <Activity className="w-4 h-4" />
            </span>
          </div>
        </div>

      </div>

      {/* PROFIT FORMULA INFO CARD */}
      <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-lg flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-500/10 rounded text-amber-500 border border-amber-500/20">
            <Scale className="w-3.5 h-3.5" />
          </span>
          <div>
            <p className="font-bold text-slate-200">{t.profitFormulaLabel}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isArabic 
                ? "الربحية = (قيمة بيع التجار) - (قيمة الشراء من العميل) + (إيراد الششنة) - (مصاريف ونثريات الصاغة العامة)" 
                : "Profitability = (Sales Value) - (Buys Value) + (Assay Revenue) - (Overhead General Outflows)"}
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-[10px] font-mono text-emerald-400 font-black bg-slate-950 px-2 py-1 rounded">
          {outstandingDealerGoldWeight.toFixed(3)}g {isArabic ? "صافي ذهب طرف التجار" : "Net outstanding gold"}
        </div>
      </div>

      {/* SECTION 2: GRAPH VISUALIZERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GOLD FLOW CHART */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200">{t.goldFlowLabel}</h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {isArabic ? "تسوية عيار 21 بالسهم والمقاصة" : "Conversion comparison metrics computed in Karat 21 / 875 equivalent"}
              </p>
            </div>
            <span className="text-[10px] bg-amber-550/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold font-mono">
              Tahyeef (875) Ref
            </span>
          </div>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                {isArabic ? "لا توجد حركات لليومية بعد." : "No daily records for graphing gold flow."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldInFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffd700" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ffd700" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="goldOutFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#f8fafc",
                      textAlign: isArabic ? "right" : "left",
                      fontSize: "10px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey={isArabic ? "الوارد (عيار 21)" : "Purchases (21g)"}
                    stroke="#ffd700"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#goldInFlow)"
                  />
                  <Area
                    type="monotone"
                    dataKey={isArabic ? "الصادر للتاجر" : "Sales to Dealer"}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#goldOutFlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CASH FLOW FLOWCHART */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200">{t.cashFlowLabel}</h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {isArabic ? "تحرك المبالغ المالية من وإلى الخزنة الكونية للمحل" : "Inflow receipts vs purchase payments plus general expenses"}
              </p>
            </div>
            <span className="text-[10px] bg-slate-950 hover:bg-slate-850 text-slate-400 px-2 py-0.5 rounded font-mono font-semibold">
              EGP Ledger
            </span>
          </div>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs text-center">
                {isArabic ? "لا توجد معاملات بعد." : "No transactions to graph cash flow."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#f8fafc",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "10px" }} />
                  <Bar
                    dataKey={isArabic ? "المقبوضات المالية" : "Inflows (EGP)"}
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey={isArabic ? "المدفوعات والمصاريف" : "Outflows (EGP)"}
                    fill="#f43f5e"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 3: RECENT PRIVATE WALLET LEDGER TRANSACTIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        
        {/* Table header with filters */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] bg-amber-500/10 text-amber-400 rounded-full font-bold border border-amber-500/10">LEDGER</span>
            <h3 className="text-xs font-bold text-slate-200">{t.recentTransactions}</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[10px] gap-1 font-bold">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded transition-all ${filterType === "all" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}
              >
                {t.all}
              </button>
              <button
                type="button"
                onClick={() => setFilterType("deposit-only")}
                className={`px-2.5 py-1 rounded transition-all ${filterType === "deposit-only" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}
              >
                {t.deposits}
              </button>
              <button
                type="button"
                onClick={() => setFilterType("outflow-only")}
                className={`px-2.5 py-1 rounded transition-all ${filterType === "outflow-only" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}
              >
                {t.withdrawals}
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportWalletExcel}
              className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer"
              title={isArabic ? "تحميل كشف حركة الصندوق كـ إكسل منفصل" : "Download wallet ledger Excel sheet separate"}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isArabic ? "تحميل إكسل" : "Download Excel"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                showConfirm(
                  isArabic 
                    ? "تنبيه هام جداً: هل تريد تصفير السجل وإعادة تهيئة الدفاتر بالكامل للصفر؟ سيؤدي ذلك لمسح كافة المشتريات والمبيعات والمصروفات ومعاملات التجار لتصفير الخزنة والحسابات." 
                    : "Important Security Alert: Are you sure you want to clear the entire log and clear the ledger book? This will permanently wipe all purchases, sales, expenses, and dealer transactions to reset everything to zero.",
                  onClearWalletTransactions
                );
              }}
              className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              title={isArabic ? "تصفير ومسح كامل سجل الخزنة" : "Reset / Clear entire ledger"}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-450" />
              <span>{isArabic ? "تصفير السجل" : "Clear Ledger"}</span>
            </button>
          </div>
        </div>

        {/* The ledger data table */}
        <div className="overflow-x-auto">
          {filteredWalletTransactions.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              {t.noData}
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase">
                  <th className="p-3 whitespace-nowrap">{t.date}</th>
                  <th className="p-3 text-right">{t.description}</th>
                  <th className="p-3 text-center">{t.type}</th>
                  <th className="p-3 text-center">{t.amount}</th>
                  <th className="p-3 text-center">{isArabic ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-350">
                {filteredWalletTransactions.map((trans) => {
                  const isPositive = trans.amount >= 0;
                  
                  // Label mapper helper
                  let typeLabel: string = trans.type;
                  if (trans.type === "deposit") typeLabel = isArabic ? "رأس مال / إيداع مال" : "Capital / Deposit";
                  else if (trans.type === "withdraw") typeLabel = isArabic ? "مسحوبات مالية" : "Withdrawal";
                  else if (trans.type === "purchase_payment") typeLabel = isArabic ? "شراء ذهب" : "Gold Purchase payment";
                  else if (trans.type === "sale_receipt") typeLabel = isArabic ? "تحصيل مبيعات" : "Sale Income";
                  else if (trans.type === "assay_fee_income") typeLabel = isArabic ? "إيراد ششنة" : "Assay Fee Profit";
                  else if (trans.type === "expense_overhead") typeLabel = isArabic ? "مصروف عام" : "Overhead Expense";
                  else if (trans.type === "broker_fee_payment") typeLabel = isArabic ? "عمولة سمسرة" : "Broker Commission";
                  else if (trans.type === "loan_cash_received") typeLabel = isArabic ? "سلفة من تاجر (+)" : "Loan from Dealer (+)";
                  else if (trans.type === "loan_cash_paid") typeLabel = isArabic ? "سداد سلفة للتاجر" : "Loan Repayment (-)";

                  return (
                    <tr key={trans.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 font-mono text-[10px] whitespace-nowrap text-slate-400">{trans.date}</td>
                      <td className="p-3 font-medium text-slate-100">{isArabic ? trans.descriptionAr : trans.descriptionEn}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          trans.type === "assay_fee_income" ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400" :
                          trans.type === "broker_fee_payment" ? "bg-rose-500/10 border-rose-500/10 text-rose-450" :
                          trans.type === "loan_cash_received" ? "bg-yellow-500/10 border-yellow-500/10 text-yellow-400" :
                          isPositive ? "bg-emerald-500/10 border-emerald-555/10 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-300"
                        }`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap font-mono font-bold">
                        <span className={isPositive ? "text-emerald-400" : "text-rose-450"}>
                          {isPositive ? "+" : ""}{formatCurrency(trans.amount, isArabic)}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditing(trans)}
                            className="p-1 px-1.5 bg-slate-800 hover:bg-slate-705 hover:text-amber-400 rounded text-slate-300 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title={isArabic ? "تعديل المعاملة" : "Edit Transaction"}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm(
                                isArabic ? "هل متأكد من حذف هذه المعاملة؟" : "Are you sure you want to delete this transaction?",
                                () => {
                                  onDeleteWalletTransaction(trans.id);
                                }
                              );
                            }}
                            className="p-1 px-1.5 bg-rose-555/10 text-rose-400 hover:bg-rose-500/25 rounded transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title={isArabic ? "حذف المعاملة" : "Delete Transaction"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* GORGEOUS POPUP EDIT MODAL */}
      {editingTx && (
        <div id="edit-tx-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-amber-500/40 rounded-xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setEditingTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 p-1 rounded-lg transition-colors border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5 mb-1">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>{isArabic ? "تعديل القيد المالي بالخزنة" : "Modify Cash Ledger Record"}</span>
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">
              {isArabic 
                ? "قم بتحديث تفاصيل الحركة والمالك لتسوية نقاط جرد الصندوق يدوياً." 
                : "Update manual transaction items/dates for exact matching."}
            </p>

            <div className="space-y-3.5 text-xs font-semibold text-slate-350">
              
              {/* Type direction toggle */}
              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "اتجاه حركية النقدية:" : "Flow Direction Sign:"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsPositive(true)}
                    className={`p-1.5 rounded font-bold border ${editIsPositive ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"}`}
                  >
                    {isArabic ? "وارد خزنة مباشر (+)" : "Inflow / Deposit (+)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsPositive(false)}
                    className={`p-1.5 rounded font-bold border ${!editIsPositive ? "bg-rose-500/10 border-rose-500/40 text-rose-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"}`}
                  >
                    {isArabic ? "صادر من الخزينة (-)" : "Outflow / Withdrawal (-)"}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "القيمة المالية كاش (جنيه):" : "Amount Cash (EGP):"}</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="e.g. 5000"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "تاريخ تسجيل الحركة:" : "Transaction Date:"}</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Description Arabic */}
              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "البيان والوصف بالعربية:" : "Arabic Description:"}</label>
                <input
                  type="text"
                  value={editDescAr}
                  onChange={(e) => setEditDescAr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white focus:ring-1 focus:ring-amber-500 outline-none text-right"
                  placeholder="مثال: تعديل تسوية وتوريد إضافي"
                />
              </div>

              {/* Description English */}
              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "البيان والوصف بالإنجليزية:" : "English Description:"}</label>
                <input
                  type="text"
                  value={editDescEn}
                  onChange={(e) => setEditDescEn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white focus:ring-1 focus:ring-amber-555 outline-none"
                  placeholder="e.g., Cash adjustments and alignment"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>{isArabic ? "إلغاء التعديل" : "Cancel"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded transition-colors flex items-center justify-center gap-1 font-black"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isArabic ? "حفظ التعديلات" : "Save Changes"}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
