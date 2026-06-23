/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Coins,
  Scale,
  TrendingUp,
  DollarSign,
  Settings,
  FolderOpen,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Database,
  RefreshCw,
  TrendingDown,
  Info,
  Layers,
  FileSpreadsheet,
  Globe,
  UserCheck,
  Plus,
  Minus,
  Wallet,
  Building2,
  Lock,
  ShieldAlert,
  Users,
  BookOpen
} from "lucide-react";

import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getOrCreateSpreadsheet,
  syncAllLedgersToGoogleSheets,
  getCachedToken
} from "./googleSheetsSync";

import {
  Dealer,
  DealerStatementItem,
  PurchaseItem,
  SaleItem,
  PublicExpenseItem,
  PrivateWalletTransaction,
  AssayLogItem,
  DailyGoldPrices,
  Workshop,
  WorkshopTransaction,
  Partner,
  PartnerTransaction
} from "./types";

import {
  INITIAL_DEALERS,
  INITIAL_DEALER_STATEMENTS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_PRIVATE_WALLET_TRANSACTIONS,
  INITIAL_ASSAY_LOGS,
  INITIAL_WORKSHOPS,
  INITIAL_WORKSHOP_TRANSACTIONS,
  loadFromLocalStorage,
  saveToLocalStorage,
  formatCurrency,
  formatWeight
} from "./utils";

import DashboardOverview from "./components/DashboardOverview";
import PurchasesManager from "./components/PurchasesManager";
import SalesManager from "./components/SalesManager";
import ExpensesManager from "./components/ExpensesManager";
import DealersManager from "./components/DealersManager";
import MasterLedger from "./components/MasterLedger";
import CustomModal from "./components/CustomModal";
import WorkshopsManager from "./components/WorkshopsManager";
import SafesCenter from "./components/SafesCenter";
import GoogleSyncCenter from "./components/GoogleSyncCenter";
import LocalDatabaseConsole from "./components/LocalDatabaseConsole";
import TradingViewGoldChart from "./components/TradingViewGoldChart";
import ArabCurrenciesTicker from "./components/ArabCurrenciesTicker";
import AdminPasscodeModal from "./components/AdminPasscodeModal";
import PartnersManager from "./components/PartnersManager";
import SystemManual from "./components/SystemManual";

export default function App() {
  // Lang Toggle: Arabic as default, English as secondary
  const [isArabic, setIsArabic] = useState<boolean>(true);

  // Core Ledgers States
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealerStatements, setDealerStatements] = useState<DealerStatementItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [sales, setSaleItems] = useState<SaleItem[]>([]);
  const [expenses, setExpenses] = useState<PublicExpenseItem[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<PrivateWalletTransaction[]>([]);
  const [assayLogs, setAssayLogs] = useState<AssayLogItem[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopTransactions, setWorkshopTransactions] = useState<WorkshopTransaction[]>([]);

  // Partners & Corporate Capital Lifted States
  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem("pyramids_partners");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "partner_1",
        nameAr: "الحاج أحمد العسيلي (شريك ذهب ومورّد)",
        nameEn: "Al-Haj Ahmed El-Assily (Wholesale Partner)",
        phone: "+201011223344",
        sharePercent: 15,
        capitalContributed: 1500000,
        contractNotesAr: "اتفاق توريد وتسهيلات بيع جملة بالذهب الكسر الششنة وحساب بالوزن العيني",
        contractNotesEn: "Wholesale facility and scrap gold weight supply custom agreement",
        transactions: [
          {
            id: "ptx_1_1",
            date: "2026-05-01",
            type: "capital_inject",
            amount: 1500000,
            descriptionAr: "ضخ رأس مال تأسيسي بدفتر الشركاء الموحد للذهب",
            descriptionEn: "Initial capital injection registered in partners safe book"
          }
        ]
      },
      {
        id: "partner_2",
        nameAr: "المهندس شريف منصور (ممول استثماري عيني)",
        nameEn: "Eng. Sherif Mansour (Investment Financer)",
        phone: "+201144556677",
        sharePercent: 10,
        capitalContributed: 1000000,
        contractNotesAr: "تمويل كاش بالجنيه المصري لدعم سيولة شراء الذهب المستعمل والمشغولات وتصفية ربع سنوية",
        contractNotesEn: "Cash liquidity injection for raw gold acquisitions with quarterly settlements",
        transactions: [
          {
            id: "ptx_2_1",
            date: "2026-05-15",
            type: "capital_inject",
            amount: 1000000,
            descriptionAr: "إيداع كاش تمويلي لدعم المشتريات والسيولة",
            descriptionEn: "Liquidity development support cash deposit"
          }
        ]
      }
    ];
  });

  const [pyramidsCapital, setPyramidsCapital] = useState<number>(() => {
    const saved = localStorage.getItem("pyramids_corporate_capital");
    return saved ? Number(saved) : 3000000;
  });

  const [companyShare, setCompanyShare] = useState<number>(() => {
    const saved = localStorage.getItem("pyramids_company_share_percent");
    return saved ? Number(saved) : 75;
  });

  const [partnersPoolShare, setPartnersPoolShare] = useState<number>(() => {
    const saved = localStorage.getItem("pyramids_partners_pool_share_percent");
    return saved ? Number(saved) : 25;
  });

  // Partners states persistence handlers
  useEffect(() => {
    localStorage.setItem("pyramids_partners", JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem("pyramids_corporate_capital", pyramidsCapital.toString());
  }, [pyramidsCapital]);

  useEffect(() => {
    localStorage.setItem("pyramids_company_share_percent", companyShare.toString());
  }, [companyShare]);

  useEffect(() => {
    localStorage.setItem("pyramids_partners_pool_share_percent", partnersPoolShare.toString());
  }, [partnersPoolShare]);

  // Daily suggestions gold rates
  const [goldPrices, setGoldPrices] = useState<DailyGoldPrices>({
    gold24: 7028,
    gold22: 6443,
    gold21: 6150, // default reference price from initial spec
    gold18: 5271,
  });

  // Google Sheets integration state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetsId, setSpreadsheetsId] = useState<string | null>(localStorage.getItem("pyramids_google_spreadsheet_id"));
  const [spreadsheetsUrl, setSpreadsheetsUrl] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);

  // Admin Mode and Passcode Lock state (Passcode: 202620)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem("pyramids_admin_mode") === "true";
  });
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);

  // Navigation tab (defaults to transaction screen 'purchases' if not admin mode)
  const [activeTab, setActiveTab] = useState<"dashboard" | "safes" | "purchases" | "sales" | "dealers" | "expenses" | "ledger" | "settings" | "workshops" | "syncCenter" | "partners" | "manual">(() => {
    const admin = localStorage.getItem("pyramids_admin_mode") === "true";
    return admin ? "dashboard" : "purchases";
  });

  // Custom Confirmation / Alert System
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"confirm" | "alert">("confirm");
  const [modalMessage, setModalMessage] = useState("");
  const [modalConfirmCallback, setModalConfirmCallback] = useState<(() => void) | undefined>(undefined);

  const showConfirm = (message: string, onConfirm: () => void) => {
    setModalType("confirm");
    setModalMessage(message);
    setModalConfirmCallback(() => onConfirm);
    setModalOpen(true);
  };

  const showAlert = (message: string) => {
    setModalType("alert");
    setModalMessage(message);
    setModalConfirmCallback(undefined);
    setModalOpen(true);
  };

  // Private cash vault adjustment form state (Direct deposit/withdrawal)
  const [directAmount, setDirectAmount] = useState<string>("");
  const [directDescriptionAr, setDirectDescriptionAr] = useState<string>("");
  const [directDescriptionEn, setDirectDescriptionEn] = useState<string>("");

  // Populate data on mount from LocalStorage OR Default Seeds (Empty by default for new book)
  useEffect(() => {
    let savedDealers = loadFromLocalStorage<Dealer[]>("pyramids_dealers", []);
    let savedStatements = loadFromLocalStorage<DealerStatementItem[]>("pyramids_dealer_statements", []);

    // Check if dealer Maged already exists. If not, auto-inject him with 12,125 EGP debt
    const magedExists = savedDealers.some(d => d.id === "d_maged" || d.nameAr === "ماجد" || d.nameEn === "Maged");
    if (!magedExists) {
      const magedDealer: Dealer = {
        id: "d_maged",
        nameAr: "ماجد",
        nameEn: "Maged",
        phone: "01011112222"
      };
      const magedDebtItem: DealerStatementItem = {
        id: "ds_maged_debt_d_maged",
        date: "2026-06-14",
        type: "loan_paid_cash",
        descriptionAr: "رصيد مديونية مستحق على التاجر ماجد",
        descriptionEn: "Initial outstanding debt owed by Maged",
        cashAmount: -12125,
        actualWeight: 0,
        karatValue: 0,
        equivalentWeight21: 0,
        price21: 0,
        goldValue: 0
      };

      savedDealers = [...savedDealers, magedDealer];
      savedStatements = [...savedStatements, magedDebtItem];

      saveToLocalStorage("pyramids_dealers", savedDealers);
      saveToLocalStorage("pyramids_dealer_statements", savedStatements);
    }

    setDealers(savedDealers);
    setDealerStatements(savedStatements);
    
    setPurchases(loadFromLocalStorage<PurchaseItem[]>("pyramids_purchases", []));
    setSaleItems(loadFromLocalStorage<SaleItem[]>("pyramids_sales", []));
    setExpenses(loadFromLocalStorage<PublicExpenseItem[]>("pyramids_expenses", []));
    
    const savedAssays = loadFromLocalStorage<AssayLogItem[]>("pyramids_assay_logs", []);
    setAssayLogs(savedAssays);

    const rawWallet = loadFromLocalStorage<PrivateWalletTransaction[]>("pyramids_wallet", []);
    const repairedWallet = rawWallet.map((tx) => {
      let amount = tx.amount;
      let descriptionAr = tx.descriptionAr;
      let descriptionEn = tx.descriptionEn;

      if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
        if (tx.id.startsWith("w_assay_standalone_")) {
          const logId = tx.id.replace("w_assay_standalone_", "");
          const matchedLog = savedAssays.find((al) => al.id === logId);
          if (matchedLog) {
            amount = matchedLog.assayFee || matchedLog.assayFeeCollected || 0;
          } else {
            amount = 0;
          }
        } else {
          amount = 0;
        }
      }

      if (tx.id.startsWith("w_assay_standalone_") && (descriptionAr.includes("undefined") || descriptionEn.toLowerCase().includes("undefined"))) {
        const logId = tx.id.replace("w_assay_standalone_", "");
        const matchedLog = savedAssays.find((al) => al.id === logId);
        if (matchedLog) {
          const client = matchedLog.customerName || matchedLog.clientName || "عميل عابر";
          descriptionAr = `رسم تحليل ششنة وفحص كاش منفرد للعميل: ${client}`;
          descriptionEn = `Direct cash assay diagnostic fee from: ${client}`;
        }
      }

      return {
        ...tx,
        amount,
        descriptionAr,
        descriptionEn
      };
    });
    setWalletTransactions(repairedWallet);
    if (JSON.stringify(rawWallet) !== JSON.stringify(repairedWallet)) {
      saveToLocalStorage("pyramids_wallet", repairedWallet);
    }
    
    // Workshops and separate ledger safes loaders
    setWorkshops(loadFromLocalStorage<Workshop[]>("pyramids_workshops", INITIAL_WORKSHOPS));
    setWorkshopTransactions(loadFromLocalStorage<WorkshopTransaction[]>("pyramids_workshop_transactions", INITIAL_WORKSHOP_TRANSACTIONS));
    
    const savedPrices = localStorage.getItem("pyramids_gold_prices");
    if (savedPrices) {
      setGoldPrices(JSON.parse(savedPrices));
    }

    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Multi-Language translation index helpers
  const alt = {
    title: isArabic ? "بيراميدز جولد لإدارة حسابات الذهب والششنة" : "Pyramids Gold & Assay Management System",
    subtitle: isArabic ? "بوابة حسابات المطابقة والدمغة والطهيف العينية" : "Double-Entry Assay Ledgers with Tahyeef Standardizations",
    tabDashboard: isArabic ? "لوحة المراقبة العامة" : "Dashboard Metrics",
    tabSafes: isArabic ? "🔐 مركز الخزائن الموحد" : "🔐 Consolidated Safes Center",
    tabPurchases: isArabic ? "شراء الذهب (من العميل)" : "Buy Gold",
    tabSales: isArabic ? "مبيعات التجار (المقاصة)" : "Sell Gold",
    tabDealers: isArabic ? "كشوفات ذمم التجار" : "Dealers Accounts",
    tabExpenses: isArabic ? "المصروفات وفحص المعمل" : "Expenses & Tests",
    tabLedger: isArabic ? "سجل كافة العمليات" : "All Operations Log",
    tabWorkshops: isArabic ? "حسابات الورش والمسابك" : "Workshops Ledger",
    tabSyncCenter: isArabic ? "☁️ مزامنة Google وشيتات الأقسام" : "☁️ Google Sync & Sheet Center",
    tabPartners: isArabic ? "📊 الشركاء وتوزيع الأرباح" : "📊 Partners & Dividends",
    tabManual: isArabic ? "📘 دليل النظام الذهبى" : "📘 Gold System Manual",
    tabSettings: isArabic ? "الخزنة ونسخ الدفاتر" : "Private Vault",
    goldRefTitle: isArabic ? "أسعار غرامات الاسترشاد اليومية:" : "Reference price of gold:",
    walletBalanceLabel: isArabic ? "صندوق الخزنة الخاصة:" : "Private Box Balance:",
    depositAction: isArabic ? "إيداع كاش خاص للتمويل" : "Inject Capital (Deposit)",
    withdrawAction: isArabic ? "سحب كاش خاص للمالك" : "Withdraw Owner Dividends",
    directDescArLabel: isArabic ? "بيان الحركة (بالعربية) *" : "Arabic Memo *",
    directDescEnLabel: isArabic ? "بيان الحركة (بالإنجليزية) *" : "English Memo *",
    directAmountLabel: isArabic ? "المقدار المالي كاش *" : "Cash amount *",
    auditAlert: isArabic ? "تنبيه مطابقة الصندوق وموازين ٢١ العينية الحية" : "Live audit alignment indicator status",
    auditText: isArabic ? "النظام يسوي الحركات تلقائياً لضمان عدم تداخل مبالغ الخزنة مع أرصدة المقاصة للتاجر." : "Double entries prevent cash overlaps or discrepancies.",
  };

  // 1. ADD NEW PURCHASE (WARD / BUY FROM CUSTOMER)
  const handleAddPurchase = (newPurchase: PurchaseItem) => {
    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    saveToLocalStorage("pyramids_purchases", updatedPurchases);

    // Double-Entry logic to Private Wallet:
    const paymentTx: PrivateWalletTransaction = {
      id: `w_pay_${newPurchase.id}`,
      date: newPurchase.date,
      type: "purchase_payment",
      descriptionAr: `فاتورة شراء ذهب عيار ${newPurchase.detectedKarat} بوزن ${newPurchase.actualWeight} جرام من ${newPurchase.customerName} (بخصم ششنة ${newPurchase.assayFee} ج.م، الصافي المدفوع: ${newPurchase.goldValue - newPurchase.assayFee} ج.م)`,
      descriptionEn: `Paid ${newPurchase.customerName} for gold buy (${newPurchase.detectedKarat} k) weight ${newPurchase.actualWeight}g (Less Assay Fee: ${newPurchase.assayFee} EGP, Net Paid: ${newPurchase.goldValue - newPurchase.assayFee} EGP)`,
      amount: -newPurchase.goldValue // cash leaves private wallet
    };

    let updatedWallet = [paymentTx, ...walletTransactions];

    // If there is an assay fee collected:
    if (newPurchase.assayFee > 0) {
      const assayTx: PrivateWalletTransaction = {
        id: `w_assay_${newPurchase.id}`,
        date: newPurchase.date,
        type: "assay_fee_income",
        descriptionAr: `رسم تحليل ششنة مرافق للشراء من ${newPurchase.customerName}`,
        descriptionEn: `Assay fee profit linked to purchase of ${newPurchase.customerName}`,
        amount: newPurchase.assayFee // cash enters private wallet
      };

      const newAssayLog: AssayLogItem = {
        id: `al_${newPurchase.id}`,
        date: newPurchase.date,
        customerName: newPurchase.customerName,
        actualWeight: newPurchase.actualWeight,
        detectedKarat: newPurchase.detectedKarat,
        assayFee: newPurchase.assayFee
      };

      const updatedAssays = [newAssayLog, ...assayLogs];
      setAssayLogs(updatedAssays);
      saveToLocalStorage("pyramids_assay_logs", updatedAssays);

      updatedWallet = [assayTx, ...updatedWallet];
    }

    // If there is a broker fee paid:
    if (newPurchase.brokerFee > 0) {
      const brokerTx: PrivateWalletTransaction = {
        id: `w_broker_${newPurchase.id}`,
        date: newPurchase.date,
        type: "broker_fee_payment",
        descriptionAr: `عمولة حركة الصاغة المفروضة للشراء من ${newPurchase.customerName}`,
        descriptionEn: `Broker fee payment for purchase transaction linked to ${newPurchase.customerName}`,
        amount: -newPurchase.brokerFee // cash leaves private wallet
      };

      updatedWallet = [brokerTx, ...updatedWallet];
    }

    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  const handleDeletePurchase = (id: string) => {
    const updatedPurchases = purchases.filter((p) => p.id !== id);
    setPurchases(updatedPurchases);
    saveToLocalStorage("pyramids_purchases", updatedPurchases);

    // Reverse double entries in wallet and assay logs
    const updatedWallet = walletTransactions.filter(
      (w) => w.id !== `w_pay_${id}` && w.id !== `w_assay_${id}` && w.id !== `w_broker_${id}`
    );
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);

    const updatedAssays = assayLogs.filter((al) => al.id !== `al_${id}`);
    setAssayLogs(updatedAssays);
    saveToLocalStorage("pyramids_assay_logs", updatedAssays);
  };

  // 2. ADD SALE (OFFSET / SELL GOLD TO DEALER)
  const handleAddSale = (newSale: SaleItem) => {
    const updatedSales = [newSale, ...sales];
    setSaleItems(updatedSales);
    saveToLocalStorage("pyramids_sales", updatedSales);

    // Dynamic Settle and offset impact to Dealer's Ledger Statement:
    const dl = dealers.find((d) => d.id === newSale.dealerId);
    const dNameAr = dl ? dl.nameAr : "التاجر";
    const dNameEn = dl ? dl.nameEn : "Dealer";

    const dealerStatementItem: DealerStatementItem = {
      id: `ds_sale_${newSale.id}_${newSale.dealerId}`,
      date: newSale.date,
      type: "gold_sold_to_dealer",
      descriptionAr: `مقاصة تسوية ذهب عيار ${newSale.detectedKarat} بوزن ${newSale.actualWeight}g لتسديد السلف`,
      descriptionEn: `Delivered gold of ${newSale.detectedKarat} karat weight ${newSale.actualWeight}g`,
      cashAmount: 0,
      actualWeight: newSale.actualWeight,
      karatValue: newSale.detectedKarat,
      equivalentWeight21: newSale.equivalentWeight21,
      price21: newSale.price21,
      goldValue: newSale.goldValue
    };

    const updatedStatements = [dealerStatementItem, ...dealerStatements];
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);

    // Double-Entry cash flow receipt into Treasury:
    const saleTx: PrivateWalletTransaction = {
      id: `w_sale_${newSale.id}`,
      date: newSale.date,
      type: "sale_receipt",
      descriptionAr: `فاتورة بيع ذهب عيار ${newSale.detectedKarat} بوزن ${newSale.actualWeight} جم للتاجر ${dNameAr} بقيمة ${newSale.goldValue} ج.م`,
      descriptionEn: `Received cash from dealer ${dNameEn} for gold sale (${newSale.detectedKarat} k) weight ${newSale.actualWeight}g`,
      amount: newSale.goldValue // cash enters private wallet
    };
    const updatedWallet = [saleTx, ...walletTransactions];
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  const handleDeleteSale = (id: string) => {
    const updatedSales = sales.filter((s) => s.id !== id);
    setSaleItems(updatedSales);
    saveToLocalStorage("pyramids_sales", updatedSales);

    const updatedStatements = dealerStatements.filter((ds) => !ds.id.startsWith(`ds_sale_${id}_`));
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);

    // Reverse treasury cash flow entry
    const updatedWallet = walletTransactions.filter((w) => w.id !== `w_sale_${id}`);
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 3. EXPENSES INPUT
  const handleAddExpense = (newExpense: PublicExpenseItem) => {
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    saveToLocalStorage("pyramids_expenses", updatedExpenses);

    // Outflow from private wallet Box
    const walletTx: PrivateWalletTransaction = {
      id: `w_expense_${newExpense.id}`,
      date: newExpense.date,
      type: "expense_overhead",
      descriptionAr: `مصروفات تشغيل: ${newExpense.titleAr} ${newExpense.notes ? `(${newExpense.notes})` : ""}`,
      descriptionEn: `Overhead Expense: ${newExpense.titleEn}`,
      amount: -newExpense.amount
    };

    const updatedWallet = [walletTx, ...walletTransactions];
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(updatedExpenses);
    saveToLocalStorage("pyramids_expenses", updatedExpenses);

    const updatedWallet = walletTransactions.filter((w) => w.id !== `w_expense_${id}`);
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 4. STANDALONE ASSAY TESTS (Testing fee collected as cash diagnostic)
  const handleAddAssayLog = (newLog: AssayLogItem) => {
    const updatedAssayLogs = [newLog, ...assayLogs];
    setAssayLogs(updatedAssayLogs);
    saveToLocalStorage("pyramids_assay_logs", updatedAssayLogs);

    const client = newLog.customerName || newLog.clientName || (isArabic ? "عميل عابر" : "Walk-in Client");
    const fee = newLog.assayFee !== undefined ? newLog.assayFee : (newLog.assayFeeCollected || 0);

    // Inflow directly to Private cash wallet Box
    const walletTx: PrivateWalletTransaction = {
      id: `w_assay_standalone_${newLog.id}`,
      date: newLog.date,
      type: "assay_fee_income",
      descriptionAr: `رسم تحليل ششنة وفحص كاش منفرد للعميل: ${client}`,
      descriptionEn: `Direct cash assay diagnostic fee from: ${client}`,
      amount: fee
    };

    const updatedWallet = [walletTx, ...walletTransactions];
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  const handleDeleteAssayLog = (id: string) => {
    const updatedAssayLogs = assayLogs.filter((al) => al.id !== id);
    setAssayLogs(updatedAssayLogs);
    saveToLocalStorage("pyramids_assay_logs", updatedAssayLogs);

    const updatedWallet = walletTransactions.filter((w) => w.id !== `w_assay_standalone_${id}`);
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 5. DEALER CREATION & RE-ESTABLISH STATEMENTS
  const handleAddDealer = (newDealer: Dealer) => {
    const updatedDealers = [...dealers, newDealer];
    setDealers(updatedDealers);
    saveToLocalStorage("pyramids_dealers", updatedDealers);
  };

  const handleDeleteDealer = (id: string) => {
    const updatedDealers = dealers.filter((d) => d.id !== id);
    setDealers(updatedDealers);
    saveToLocalStorage("pyramids_dealers", updatedDealers);

    // Delete statement items linked with this dealer
    const updatedStatements = dealerStatements.filter(
      (ds) => !ds.id.includes(`_${id}`)
    );
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);
  };

  const handleAddStatementItem = (newItem: DealerStatementItem) => {
    const updatedStatements = [newItem, ...dealerStatements];
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);

    // Settle cashflows directly if they match loan received (+) or cash payouts (-)
    if (newItem.type === "loan_received") {
      const walletTx: PrivateWalletTransaction = {
        id: `w_dealer_loan_${newItem.id}`,
        date: newItem.date,
        type: "loan_cash_received",
        descriptionAr: `استلام تمويل سلفة نقدية جارية من التاجر`,
        descriptionEn: `Received cash loan injection from dealer`,
        amount: newItem.cashAmount // positive inflow
      };

      const updatedWallet = [walletTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    } else if (newItem.type === "loan_paid_cash") {
      const walletTx: PrivateWalletTransaction = {
        id: `w_dealer_repay_${newItem.id}`,
        date: newItem.date,
        type: "loan_cash_paid",
        descriptionAr: `سداد جزئي للسلفة النقدية كاش للتاجر`,
        descriptionEn: `Repaid cash portion of dealer loan from private wallet`,
        amount: newItem.cashAmount // negative outflow
      };

      const updatedWallet = [walletTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    }
  };

  const handleDeleteStatementItem = (id: string) => {
    const updatedStatements = dealerStatements.filter((ds) => ds.id !== id);
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);

    const updatedWallet = walletTransactions.filter(
      (w) => w.id !== `w_dealer_loan_${id}` && w.id !== `w_dealer_repay_${id}`
    );
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 6. GOLD PRICE DIALER UPDATES
  const handleUpdatePrices = (prices: DailyGoldPrices) => {
    setGoldPrices(prices);
    localStorage.setItem("pyramids_gold_prices", JSON.stringify(prices));
  };

  // 7. DIRECT VAULT PRIVATE CASH DEPOSIT OR WITHDRAWAL (BY OWNER)
  const handleDirectCapitalChange = (type: "deposit" | "withdraw") => {
    const valueNum = Number(directAmount);
    if (valueNum <= 0) {
      showAlert(isArabic ? "برجاء توفير مقدار مالي كاش صحيح" : "Please provide a valid cash value.");
      return;
    }

    const directionSigned = type === "deposit" ? valueNum : -valueNum;
    const descAr = directDescriptionAr || (type === "deposit" ? "إيداع مالي إضافي لحساب الخزنة لحركة تداول" : "سحب أرباح أو مصروف خاص بمالك المحل");
    const descEn = directDescriptionEn || (type === "deposit" ? "Additional equity cash deposit into vault" : "Private owner withdrawal outflow");

    const newTx: PrivateWalletTransaction = {
      id: `w_manual_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: type,
      descriptionAr: descAr,
      descriptionEn: descEn,
      amount: directionSigned
    };

    const updatedWallet = [newTx, ...walletTransactions];
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);

    setDirectAmount("");
    setDirectDescriptionAr("");
    setDirectDescriptionEn("");
    showAlert(isArabic ? "تم تعديل حساب صندوق المالك وقيد المعاملة!" : "Private cash ledger transactions successfully posted!");
  };

  // 7.5. WALLET UTILITIES (DELETING, CLEARING, UPDATING INDIVIDUAL TRANSACTIONS AND DIRECT VAULT OVERRIDES)
  const handleDeleteWalletTransaction = (id: string) => {
    // 1. Regular filter of the transaction from the wallet
    const updated = walletTransactions.filter((trans) => trans.id !== id);
    setWalletTransactions(updated);
    saveToLocalStorage("pyramids_wallet", updated);

    // 2. Cascade deletion to underlying modules:
    // A. Purchases / Buy Gold (links: w_pay_..., w_assay_..., w_broker_...)
    if (id.startsWith("w_pay_") || id.startsWith("w_assay_") || id.startsWith("w_broker_")) {
      const purchaseId = id
        .replace("w_pay_", "")
        .replace("w_assay_", "")
        .replace("w_broker_", "");

      // Delete the actual purchase invoice
      const updatedPurchases = purchases.filter((p) => p.id !== purchaseId);
      setPurchases(updatedPurchases);
      saveToLocalStorage("pyramids_purchases", updatedPurchases);

      // Remove all other cash ledger lines associated with this purchase (so deleting pay also deletes assay/broker rows)
      const cleanWallet = updated.filter(
        (w) => w.id !== `w_pay_${purchaseId}` && w.id !== `w_assay_${purchaseId}` && w.id !== `w_broker_${purchaseId}`
      );
      setWalletTransactions(cleanWallet);
      saveToLocalStorage("pyramids_wallet", cleanWallet);

      // Remove from assay certification log
      const updatedAssays = assayLogs.filter((al) => al.id !== `al_${purchaseId}`);
      setAssayLogs(updatedAssays);
      saveToLocalStorage("pyramids_assay_logs", updatedAssays);
    }
    // B. Operating expenses (link: w_expense_...)
    else if (id.startsWith("w_expense_")) {
      const expenseId = id.replace("w_expense_", "");
      const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
      setExpenses(updatedExpenses);
      saveToLocalStorage("pyramids_expenses", updatedExpenses);
    }
    // C. Standalone diagnostic test logs (link: w_assay_standalone_...)
    else if (id.startsWith("w_assay_standalone_")) {
      const logId = id.replace("w_assay_standalone_", "");
      const updatedAssayLogs = assayLogs.filter((al) => al.id !== logId);
      setAssayLogs(updatedAssayLogs);
      saveToLocalStorage("pyramids_assay_logs", updatedAssayLogs);
    }
    // D. Dealer loans (debt credit) or cash repayments (links: w_dealer_loan_..., w_dealer_repay_...)
    else if (id.startsWith("w_dealer_loan_") || id.startsWith("w_dealer_repay_")) {
      const statementId = id
        .replace("w_dealer_loan_", "")
        .replace("w_dealer_repay_", "");
      const updatedStatements = dealerStatements.filter((ds) => ds.id !== statementId);
      setDealerStatements(updatedStatements);
      saveToLocalStorage("pyramids_dealer_statements", updatedStatements);
    }
  };

  const handleClearAllWalletTransactions = () => {
    showConfirm(
      isArabic 
        ? "تنبيه هام جداً: هل تريد تصفير السجل وإعادة تهيئة الدفاتر بالكامل للصفر؟ سيؤدي ذلك لمسح كافة المشتريات والمبيعات والمصروفات ومعاملات التجار لتصفير الخزنة والحسابات." 
        : "Important Security Alert: Are you sure you want to clear the entire log and clear the ledger book? This will permanently wipe all purchases, sales, expenses, and dealer transactions to reset everything to zero.",
      () => {
        setPurchases([]);
        setSaleItems([]);
        setExpenses([]);
        setWalletTransactions([]);
        setDealerStatements([]);
        setAssayLogs([]);

        saveToLocalStorage("pyramids_purchases", []);
        saveToLocalStorage("pyramids_sales", []);
        saveToLocalStorage("pyramids_expenses", []);
        saveToLocalStorage("pyramids_wallet", []);
        saveToLocalStorage("pyramids_dealer_statements", []);
        saveToLocalStorage("pyramids_assay_logs", []);

        showAlert(isArabic ? "تم تصفير الدفتر بالكامل وتهيئة كافة الحسابات بنجاح!" : "Entire accounting ledger book successfully cleared and reset back to zero!");
      }
    );
  };

  const handleUpdateWalletTransaction = (updatedTx: PrivateWalletTransaction) => {
    const updated = walletTransactions.map((tx) => tx.id === updatedTx.id ? updatedTx : tx);
    setWalletTransactions(updated);
    saveToLocalStorage("pyramids_wallet", updated);
  };

  const handleAddWalletTransaction = (newTx: PrivateWalletTransaction) => {
    const updated = [newTx, ...walletTransactions];
    setWalletTransactions(updated);
    saveToLocalStorage("pyramids_wallet", updated);
  };

  // Workshops events managers
  const handleAddWorkshop = (newWs: Workshop) => {
    const updated = [...workshops, newWs];
    setWorkshops(updated);
    saveToLocalStorage("pyramids_workshops", updated);
  };

  const handleDeleteWorkshop = (id: string) => {
    const updatedWorkshops = workshops.filter((w) => w.id !== id);
    setWorkshops(updatedWorkshops);
    saveToLocalStorage("pyramids_workshops", updatedWorkshops);

    // Cascade delete transactions
    const updatedTxs = workshopTransactions.filter((tx) => tx.workshopId !== id);
    setWorkshopTransactions(updatedTxs);
    saveToLocalStorage("pyramids_workshop_transactions", updatedTxs);
  };

  const handleAddWorkshopTransaction = (newTx: WorkshopTransaction) => {
    const updated = [newTx, ...workshopTransactions];
    setWorkshopTransactions(updated);
    saveToLocalStorage("pyramids_workshop_transactions", updated);

    // Double-entry to main cash safe: deduct the workshop purchase payout
    if (newTx.type === "purchase") {
      const paymentTx: PrivateWalletTransaction = {
        id: `w_ws_p_${newTx.id}`,
        date: newTx.date,
        type: "purchase_payment",
        descriptionAr: `[شراء للورشة] سداد شراء عيار ${newTx.detectedKarat} وزن ${newTx.actualWeight}g من ${newTx.customerName} لحساب الورشة/المسبك`,
        descriptionEn: `[Workshop Buy] Paid ${newTx.customerName} for gold buy (${newTx.detectedKarat}k) weight ${newTx.actualWeight}g for workshop use`,
        amount: newTx.cashAmount // Which is already a negative value representing payout
      };

      const updatedWallet = [paymentTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    }
  };

  const handleDeleteWorkshopTransaction = (id: string) => {
    const updated = workshopTransactions.filter((tx) => tx.id !== id);
    setWorkshopTransactions(updated);
    saveToLocalStorage("pyramids_workshop_transactions", updated);

    // Reverse payment deduction from main cash safe if deleting a workshop purchase
    const updatedWallet = walletTransactions.filter((w) => w.id !== `w_ws_p_${id}`);
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 8. DATABASE HARD RESET / CLEARALL
  const handleResetDatabase = () => {
    showConfirm(
      isArabic ? "مسح قاعدة البيانات واسترجاع الوضع التجريبي الافتراضي المعتمد؟" : "Reset entire database back to default testing seeds?",
      () => {
        setDealers(INITIAL_DEALERS);
        setDealerStatements(INITIAL_DEALER_STATEMENTS);
        setPurchases(INITIAL_PURCHASES);
        setSaleItems(INITIAL_SALES);
        setExpenses(INITIAL_EXPENSES);
        setWalletTransactions(INITIAL_PRIVATE_WALLET_TRANSACTIONS);
        setAssayLogs(INITIAL_ASSAY_LOGS);
        setWorkshops(INITIAL_WORKSHOPS);
        setWorkshopTransactions(INITIAL_WORKSHOP_TRANSACTIONS);

        saveToLocalStorage("pyramids_dealers", INITIAL_DEALERS);
        saveToLocalStorage("pyramids_dealer_statements", INITIAL_DEALER_STATEMENTS);
        saveToLocalStorage("pyramids_purchases", INITIAL_PURCHASES);
        saveToLocalStorage("pyramids_sales", INITIAL_SALES);
        saveToLocalStorage("pyramids_expenses", INITIAL_EXPENSES);
        saveToLocalStorage("pyramids_wallet", INITIAL_PRIVATE_WALLET_TRANSACTIONS);
        saveToLocalStorage("pyramids_assay_logs", INITIAL_ASSAY_LOGS);
        saveToLocalStorage("pyramids_workshops", INITIAL_WORKSHOPS);
        saveToLocalStorage("pyramids_workshop_transactions", INITIAL_WORKSHOP_TRANSACTIONS);

        showAlert(isArabic ? "تم استرجاع العينات والبيانات التجريبية بنجاح!" : "Reference seed database successfully loaded!");
      }
    );
  };

  const handleClearAll = () => {
    showConfirm(
      isArabic ? "تحذير أمان: سيتم تصفير كافة المعطيات والموازين للبدء بدفاتر فارغة للعام المالي الجديد. هل توافق؟" : "Warning: Wipe all ledgers for a clean workspace first?",
      () => {
        setDealers([]);
        setDealerStatements([]);
        setPurchases([]);
        setSaleItems([]);
        setExpenses([]);
        setWalletTransactions([]);
        setAssayLogs([]);
        setWorkshops([]);
        setWorkshopTransactions([]);
        setPartners([]);
        setPyramidsCapital(3000000);
        setCompanyShare(100);
        setPartnersPoolShare(0);

        saveToLocalStorage("pyramids_dealers", []);
        saveToLocalStorage("pyramids_dealer_statements", []);
        saveToLocalStorage("pyramids_purchases", []);
        saveToLocalStorage("pyramids_sales", []);
        saveToLocalStorage("pyramids_expenses", []);
        saveToLocalStorage("pyramids_wallet", []);
        saveToLocalStorage("pyramids_assay_logs", []);
        saveToLocalStorage("pyramids_workshops", []);
        saveToLocalStorage("pyramids_workshop_transactions", []);
        saveToLocalStorage("pyramids_partners", []);
        saveToLocalStorage("pyramids_corporate_capital", 3000000);
        saveToLocalStorage("pyramids_company_share_percent", 100);
        saveToLocalStorage("pyramids_partners_pool_share_percent", 0);

        showAlert(isArabic ? "تم تصفير ومسح كافة الدفاتر وإعادة تهيئة الحسابات للصفر بنجاح!" : "All accounting ledger books successfully cleared and reset back to zero!");
      }
    );
  };

  // Google Sheets Sync and Google Auth Action Handlers
  const handleGoogleSheetsLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        showAlert(isArabic ? `مرحباً بك ${res.user.displayName}! تم ربط حساب Google الخاص بك بنجاح.` : `Welcome ${res.user.displayName}! Google Account connected.`);
      }
    } catch (err: any) {
      showAlert(isArabic ? `يبدو أنه حدث خطأ أثناء الاتصال بجوجل: ${err.message}` : `Google connection error: ${err.message}`);
    }
  };

  const handleGoogleSheetsLogout = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      showAlert(isArabic ? "تم تسجيل الخروج وقطع الاتصال بـ Google" : "Signed out of Google Account connection.");
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleSyncToGoogleSheets = async () => {
    let activeToken = googleToken || getCachedToken();
    if (!activeToken) {
      showAlert(isArabic ? "يرجى تسجيل الدخول بحساب Google أولاً للتزامن." : "Please sign in with Google to synchronize.");
      return;
    }

    setIsSyncingSheets(true);
    try {
      const spreadsheet = await getOrCreateSpreadsheet(activeToken, isArabic);
      setSpreadsheetsId(spreadsheet.id);
      setSpreadsheetsUrl(spreadsheet.url);

      await syncAllLedgersToGoogleSheets(activeToken, spreadsheet.id, {
        dealers,
        dealerStatements,
        purchases,
        sales,
        expenses,
        walletTransactions,
        assayLogs,
        workshops,
        workshopTransactions,
        isArabic
      });

      showAlert(isArabic ? "تم نقل ومزامنة كامل الدفاتر بنجاح إلى جدول بيانات جوجل شيت الموحد الخاص بك!" : "Successfully synchronized all spreadsheets with your Google Sheet!");
    } catch (err: any) {
      console.error(err);
      showAlert(isArabic ? `فشل التزامن: ${err.message}` : `Synchronization failed: ${err.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Compute live wallet cash representation
  const totalPartnerCapital = partners.reduce((sum, p) => sum + p.capitalContributed, 0);
  const totalEnterpriseCapital = pyramidsCapital + totalPartnerCapital;

  const totalPartnerWithdrawals = partners.reduce((sum, p) => {
    return sum + p.transactions
      .filter((t) => t.type === "dividend_withdraw")
      .reduce((tSum, t) => tSum + t.amount, 0);
  }, 0);

  const absoluteWalletCash = walletTransactions.reduce((acc, t) => acc + t.amount, 0);
  const privateWalletBalance = totalEnterpriseCapital - totalPartnerWithdrawals + absoluteWalletCash;

  // Reactively computed Working Net Business Profit for SystemManual & general metrics
  const totalSalesGoldValue = sales.reduce((acc, s) => acc + s.goldValue, 0);
  const totalPurchasesGoldValue = purchases.reduce((acc, p) => acc + p.goldValue, 0);
  const totalAssayRevenues = walletTransactions
    .filter((t) => t.type === "assay_fee_income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalBrokerFees = purchases.reduce((acc, p) => acc + p.brokerFee, 0);
  const totalOverheadExpenses = expenses
    .filter((e) => e.category === "overhead")
    .reduce((acc, e) => acc + e.amount, 0);

  const netBusinessProfit =
    totalSalesGoldValue - totalPurchasesGoldValue + totalAssayRevenues - totalBrokerFees - totalOverheadExpenses;

  return (
    <div
      id="pyramids-gold-system"
      className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-[50px]"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* STICKY HEADER CONTAINER */}
      <div className="sticky top-0 z-50 flex flex-col w-full">
        {/* PROFESSIONAL HIGH-CONTRAST GOLD HEADER */}
        <header className="bg-slate-950 border-b border-amber-500/30 px-4 py-3.5 sm:px-6 shadow-md shadow-slate-950/20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* LOGO & LABELS */}
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-lg text-slate-950 shadow-md shadow-amber-500/10">
                <Coins className="w-5.5 h-5.5 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-white hover:text-amber-400 transition-colors leading-none tracking-tight">
                    {alt.title}
                  </h1>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8.5px] px-1.5 py-0.5 rounded-full font-black font-mono">
                    BALANCED
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{alt.subtitle}</p>
              </div>
            </div>

            {/* ACTIVE DAY SUGGESTIONS RATES */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <span className="text-slate-400 font-medium">{isArabic ? "الصافي عيار ٢٤:" : "24k Pure:"}</span>
                <span className="font-mono font-bold text-amber-400">{formatCurrency(goldPrices.gold24, isArabic)}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-slate-400 font-medium">{isArabic ? "المرجع عيار ٢١:" : "Karat 21 Ref:"}</span>
                <span className="font-mono font-bold text-amber-450">{formatCurrency(goldPrices.gold21, isArabic)}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-slate-400 font-medium">{isArabic ? "عيار ١٨ صاغة:" : "18k Stamp:"}</span>
                <span className="font-mono font-bold text-orange-400">{formatCurrency(goldPrices.gold18, isArabic)}</span>
              </div>

              {/* ADMIN / EMPLOYEE MODE CONTROLLER */}
              {isAdminMode ? (
                <button
                  type="button"
                  id="admin-mode-lock-btn"
                  onClick={() => {
                    setIsAdminMode(false);
                    localStorage.setItem("pyramids_admin_mode", "false");
                    setActiveTab("purchases");
                    showAlert(isArabic ? "تم قفل لوحة المدير بنجاح والعودة لحساب الموظف العادي لحماية البيانات." : "Admin dashboard secured! Safely reverted back to regular standard operations.");
                  }}
                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-rose-500/10 text-emerald-400 hover:text-rose-400 rounded-lg transition-all border border-emerald-500/20 hover:border-rose-500/20 flex items-center gap-1.5 text-[11px] font-black cursor-pointer shadow-inner group"
                  title={isArabic ? "اضغط لقفل صلاحيات وسجل المدير على الفور" : "Click to lock and secure admin credentials instantly"}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 group-hover:text-rose-400 animate-pulse" />
                  <span>{isArabic ? "المدير العام 👑" : "Admin Mode 👑"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="admin-mode-unlock-btn"
                  onClick={() => {
                    setShowPasscodeModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-500/10 text-slate-350 hover:text-amber-450 rounded-lg transition-all border border-slate-800 hover:border-amber-500/20 flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                  title={isArabic ? "تسجيل الدخول بصلاحية المدير العام للوصول للسجل والتقارير" : "Enter PIN code to authorize manager access"}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isArabic? "حساب موظف 👤" : "Employee 👤"}</span>
                </button>
              )}

              {/* BILINGUAL LANGUAGE SWITCHER */}
              <button
                onClick={() => setIsArabic(!isArabic)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-350 hover:text-white transition-colors border border-slate-800 flex items-center gap-1 text-[11px]"
                title={isArabic ? "Switch to English" : "تغيير للعربية"}
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? "En" : "عرب"}</span>
              </button>
            </div>

          </div>
        </header>
      </div>

      {/* SYSTEM BROADCAST NOTIFICATION */}
      <div className="bg-amber-450/5 border-b border-amber-500/10 px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px]">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{alt.auditAlert}: {formatCurrency(absoluteWalletCash, isArabic)}</span>
          </div>
          <span className="text-slate-400">{alt.auditText}</span>
        </div>
      </div>

      {/* SWISS MODERN TAB NAVIGATION & SIDEBAR */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 sm:px-6 flex flex-col md:flex-row gap-6 items-start">
        {/* SIDEBAR NAVIGATION (VERTICAL ON DESKTOP, HORIZONTAL TRACK ON MOBILE) */}
        <aside className="w-full md:w-64 lg:w-72 md:sticky md:top-24 flex-shrink-0 flex flex-col gap-3 z-30">
          <div className="bg-slate-950 p-2 sm:p-3 rounded-2xl border border-slate-850 shadow-xl w-full flex flex-col gap-1.5 md:gap-2">
            
            <div className="hidden md:block px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-900 mb-1">
              {isArabic ? "أقسام المنصة" : "Platform Divisions"}
            </div>

            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible scrollbar-none gap-1 bg-slate-900 md:bg-transparent p-1 md:p-0 rounded-xl md:rounded-none">
              
              {/* ADMIN ONLY TABS */}
              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                    activeTab === "dashboard"
                      ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Layers className="w-4 h-4 flex-shrink-0" />
                  <span>{alt.tabDashboard}</span>
                </button>
              )}

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("safes")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                    activeTab === "safes"
                      ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Database className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{alt.tabSafes}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("purchases")}
                className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                  activeTab === "purchases"
                    ? "bg-amber-500 text-slate-900 shadow-md md:shadow-amber-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{alt.tabPurchases}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sales")}
                className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                  activeTab === "sales"
                    ? "bg-amber-500 text-slate-900 shadow-md md:shadow-amber-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 text-rose-450 flex-shrink-0" />
                <span>{alt.tabSales}</span>
              </button>

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("dealers")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                    activeTab === "dealers"
                      ? "bg-amber-500 text-slate-900 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{alt.tabDealers}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("expenses")}
                className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                  activeTab === "expenses"
                    ? "bg-amber-500 text-slate-900 shadow-md md:shadow-amber-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <DollarSign className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{alt.tabExpenses}</span>
              </button>

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("ledger")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                    activeTab === "ledger"
                      ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{alt.tabLedger}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("workshops")}
                className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                  activeTab === "workshops"
                    ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span>{alt.tabWorkshops}</span>
              </button>

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("syncCenter")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                    activeTab === "syncCenter"
                      ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{alt.tabSyncCenter}</span>
                </button>
              )}

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("partners")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                    activeTab === "partners"
                      ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{alt.tabPartners}</span>
                </button>
              )}

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap md:w-full ${
                    activeTab === "manual"
                      ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{alt.tabManual}</span>
                </button>
              )}

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all md:w-full md:mt-2 whitespace-nowrap ltr:md:ml-0 ltr:ml-auto rtl:md:mr-0 rtl:mr-auto ${
                    activeTab === "settings"
                      ? "bg-amber-500 text-slate-950 shadow-md md:shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span>{alt.tabSettings}</span>
                </button>
              )}

            </div>
          </div>

          {/* Quick info widgets on Desktop */}
          <div className="hidden md:flex bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 flex-col gap-3 w-full">
            <div>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                {isArabic ? "إجمالي سيولة الخزينة" : "Unified Vault Cash"}
              </span>
              <div className={`text-sm font-mono font-black tracking-tight ${privateWalletBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatCurrency(privateWalletBalance, isArabic)}
              </div>
            </div>

            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                {isArabic ? "المطابقة البرمجية" : "Inherent Alignment Check"}
              </span>
              <div className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                {isArabic ? "تكامل حسابات الذهب العينية لضمان دقة الاستحقاق." : "Ensures real-time physical gold alignment."}
              </div>
            </div>
          </div>
        </aside>

        {/* ACTIVE RAILS VIEWPORT */}
        <div id="active-tab-viewport" className="flex-1 w-full min-w-0 transition-all duration-300">
          {["dashboard", "safes", "dealers", "ledger", "syncCenter", "settings", "partners"].includes(activeTab) && !isAdminMode ? (
            <div className="bg-[#0c1322] border border-slate-850 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto my-8 sm:my-16 shadow-2xl flex flex-col items-center animate-fade-in" id="restricted-admin-access-card">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-zinc-950">
                <Lock className="w-6 h-6 animate-pulse text-amber-500" />
              </div>
              <h2 className="text-base font-black text-slate-100 mb-3 leading-none flex items-center gap-1.5 justify-center">
                <span>{isArabic ? "صلاحيات الوصول مخصصة لمدير النظام 🔒" : "Access Restricted to Administrator 🔒"}</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-sm mx-auto">
                {isArabic 
                  ? "سجلات المعاملات المالية، والتقارير العامة، وكشوفات تجار الجملة والمقاصة مخصصة فقط للمدير العام. يرجى مصادقة كود التحقق للمتابعة." 
                  : "All live financial books, daily metrics audits, wholesale outstanding balances, and Google Sheets Synchronization centers are restricted to administrative authorization only."}
              </p>
              <button
                type="button"
                onClick={() => setShowPasscodeModal(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5 focus:outline-none"
              >
                <ShieldAlert className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>{isArabic ? "تأكيد الرمز لفتح لوحة المدير" : "Unlock Admin Dashboard"}</span>
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
            <DashboardOverview
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              walletTransactions={walletTransactions}
              dealerStatements={dealerStatements}
              isArabic={isArabic}
              onDeleteWalletTransaction={handleDeleteWalletTransaction}
              onClearWalletTransactions={handleClearAllWalletTransactions}
              onUpdateWalletTransaction={handleUpdateWalletTransaction}
              onAddWalletTransaction={handleAddWalletTransaction}
              showConfirm={showConfirm}
              showAlert={showAlert}
              privateWalletBalance={privateWalletBalance}
            />
          )}

          {activeTab === "safes" && (
            <SafesCenter
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              walletTransactions={walletTransactions}
              dealerStatements={dealerStatements}
              dealers={dealers}
              workshops={workshops}
              workshopTransactions={workshopTransactions}
              assayLogs={assayLogs}
              isArabic={isArabic}
              onAddWalletTransaction={handleAddWalletTransaction}
              googleUser={googleUser}
              googleToken={googleToken}
              spreadsheetsId={spreadsheetsId}
              spreadsheetsUrl={spreadsheetsUrl}
              isSyncingSheets={isSyncingSheets}
              onSyncToGoogleSheets={handleSyncToGoogleSheets}
              onGoogleSignIn={handleGoogleSheetsLogin}
              onGoogleSheetsLogout={handleGoogleSheetsLogout}
              showAlert={showAlert}
              privateWalletBalance={privateWalletBalance}
            />
          )}

          {activeTab === "purchases" && (
            <PurchasesManager
              purchases={purchases}
              isArabic={isArabic}
              onAddPurchase={handleAddPurchase}
              onDeletePurchase={handleDeletePurchase}
              showConfirm={showConfirm}
              showAlert={showAlert}
              isAdminMode={isAdminMode}
              onRequestAdminUnlock={() => setShowPasscodeModal(true)}
            />
          )}

          {activeTab === "sales" && (
            <SalesManager
              sales={sales}
              dealers={dealers}
              dealerStatements={dealerStatements}
              isArabic={isArabic}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
              showConfirm={showConfirm}
              showAlert={showAlert}
            />
          )}

          {activeTab === "dealers" && (
            <DealersManager
              dealers={dealers}
              statementItems={dealerStatements}
              isArabic={isArabic}
              onAddDealer={handleAddDealer}
              onDeleteDealer={handleDeleteDealer}
              onAddStatementItem={handleAddStatementItem}
              onDeleteStatementItem={handleDeleteStatementItem}
              showConfirm={showConfirm}
            />
          )}

          {activeTab === "expenses" && (
            <ExpensesManager
              expenses={expenses}
              assayLogs={assayLogs}
              isArabic={isArabic}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onAddAssayLog={handleAddAssayLog}
              onDeleteAssayLog={handleDeleteAssayLog}
              showConfirm={showConfirm}
              showAlert={showAlert}
              isAdminMode={isAdminMode}
              onRequestAdminUnlock={() => setShowPasscodeModal(true)}
            />
          )}

          {activeTab === "ledger" && (
            <MasterLedger
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              assayLogs={assayLogs}
              dealerStatements={dealerStatements}
              walletTransactions={walletTransactions}
              dealers={dealers}
              isArabic={isArabic}
              onDeletePurchase={handleDeletePurchase}
              onDeleteSale={handleDeleteSale}
              onDeleteExpense={handleDeleteExpense}
              onDeleteAssayLog={handleDeleteAssayLog}
              onDeleteStatementItem={handleDeleteStatementItem}
              onDeleteWalletTransaction={handleDeleteWalletTransaction}
              onClearLedger={handleClearAll}
              showConfirm={showConfirm}
            />
          )}

          {activeTab === "workshops" && (
            <WorkshopsManager
              workshops={workshops}
              workshopTransactions={workshopTransactions}
              dealers={dealers}
              isArabic={isArabic}
              onAddWorkshop={handleAddWorkshop}
              onDeleteWorkshop={handleDeleteWorkshop}
              onAddWorkshopTransaction={handleAddWorkshopTransaction}
              onDeleteWorkshopTransaction={handleDeleteWorkshopTransaction}
              showConfirm={showConfirm}
              showAlert={showAlert}
            />
          )}

          {activeTab === "syncCenter" && (
            <GoogleSyncCenter
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              walletTransactions={walletTransactions}
              dealerStatements={dealerStatements}
              dealers={dealers}
              workshops={workshops}
              workshopTransactions={workshopTransactions}
              assayLogs={assayLogs}
              isArabic={isArabic}
              googleUser={googleUser}
              googleToken={googleToken}
              spreadsheetsId={spreadsheetsId}
              spreadsheetsUrl={spreadsheetsUrl}
              isSyncingSheets={isSyncingSheets}
              onSyncToGoogleSheets={handleSyncToGoogleSheets}
              onGoogleSignIn={handleGoogleSheetsLogin}
              onGoogleSheetsLogout={handleGoogleSheetsLogout}
              showAlert={showAlert}
            />
          )}

          {activeTab === "partners" && (
            <PartnersManager
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              walletTransactions={walletTransactions}
              setWalletTransactions={setWalletTransactions}
              isArabic={isArabic}
              showConfirm={showConfirm}
              showAlert={showAlert}
              partners={partners}
              setPartners={setPartners}
              pyramidsCapital={pyramidsCapital}
              setPyramidsCapital={setPyramidsCapital}
              companyShare={companyShare}
              setCompanyShare={setCompanyShare}
              partnersPoolShare={partnersPoolShare}
              setPartnersPoolShare={setPartnersPoolShare}
              privateWalletBalance={privateWalletBalance}
            />
          )}

          {activeTab === "manual" && (
            <SystemManual
              isArabic={isArabic}
              netBusinessProfit={netBusinessProfit}
              privateWalletBalance={privateWalletBalance}
            />
          )}

          {activeTab === "settings" && (
            <div id="settings-view-container" className="space-y-6 animate-fade-in text-slate-100">
              
              {/* Reference Prices adjustments */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
                <h3 className="text-xs font-black text-amber-400 mb-1 flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <span>{isArabic ? "برمجة أسعار الإرشاد لغرامات الذهب المحلية اليومية" : "Update Daily Suggestion Gold Rates"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  {isArabic 
                    ? "الأسعار المدونة هنا تستخدم كقيمة استرشادية واقتراحات نموذجية للفواتير لتسريع المعاملات." 
                    : "Used as suggestions across billing and invoicing calculators in the workshop."}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ٢٤ صافي" : "24k Pure"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold24}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold24: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ٢٢" : "Karat 22"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold22}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold22: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ٢١ مرجع" : "Karat 21 Reference"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold21}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold21: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ١٨ صاغة" : "Karat 18 Jewel"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold18}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold18: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* MANUAL CAPITAL DIRECT ADJUSTMENTS FOR CASH OVERHEAD DIRECT INJECTIONS */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
                <h3 className="text-xs font-black text-amber-400 mb-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span>{isArabic ? "تعديل رصيد الخزنة الخاصة للمالك يدوياً" : "Direct Adjustment of Private Cash Box"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  {isArabic 
                    ? "يتيح لك هذا القسم إيداع سيولة تداول إضافية أو سحب مسحوبات شخصية من رأس المال دون التداخل مع كشوفات التجار." 
                    : "Add initial gold capital, manual cash injections, or withdraw proprietor cash dividends easily."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
                  <div>
                    <label className="block mb-1.5 text-slate-400">{alt.directAmountLabel}</label>
                    <input
                      type="number"
                      value={directAmount}
                      onChange={(e) => setDirectAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-400">{alt.directDescArLabel}</label>
                    <input
                      type="text"
                      value={directDescriptionAr}
                      onChange={(e) => setDirectDescriptionAr(e.target.value)}
                      placeholder="مثال: إيداع رأس مال افتتاح إضافي"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500 text-right"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-400">{alt.directDescEnLabel}</label>
                    <input
                      type="text"
                      value={directDescriptionEn}
                      onChange={(e) => setDirectDescriptionEn(e.target.value)}
                      placeholder="e.g., Prop. Cash injection to fund purchase"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    <button
                      onClick={() => handleDirectCapitalChange("deposit")}
                      type="button"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 rounded transition-colors"
                    >
                      {isArabic ? "إيداع تمويل (+)" : "Deposit (+)"}
                    </button>
                    <button
                      onClick={() => handleDirectCapitalChange("withdraw")}
                      type="button"
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 rounded transition-colors"
                    >
                      {isArabic ? "سحب حجر (-)" : "Withdraw (-)"}
                    </button>
                  </div>
                </div>
              </div>

              {/* GOOGLE SHEETS SYNC & Compiled Excel Exports Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-850">
                  <div className="flex items-center gap-3">
                    <span className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                      <FileSpreadsheet className="w-6 h-6" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                        <span>{isArabic ? "مزامنة سحابة Google Sheets وتصدير Excel" : "Google Sheets Sync & Excel Export"}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-black font-mono">
                          LIVE SYNC
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {isArabic 
                          ? "قم بتصدير ومزامنة كامل الدفاتر (مشتريات، مبيعات، كشوفات تجار، مصروفات، الصندوق) تلقائياً في جداول مستقلة وتنزيل ملف Excel المجمع."
                          : "Synchronize full-ledger registers automatically to multiple sheets on Drive and download unified XLSX files."}
                      </p>
                    </div>
                  </div>

                  {/* USER GOOGLE OAUTH CONNECTION BTN / ACCOUNT INFO */}
                  <div className="flex items-center gap-2.5">
                    {googleUser ? (
                      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-805 p-1.5 ltr:pr-3 rtl:pl-3 rounded-lg text-xs font-semibold">
                        {googleUser.photoURL ? (
                          <img 
                            src={googleUser.photoURL} 
                            referrerPolicy="no-referrer" 
                            alt="Avatar" 
                            className="w-7 h-7 rounded-full border border-emerald-500/30"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-slate-800 text-amber-500 flex items-center justify-center font-bold font-mono">
                            G
                          </span>
                        )}
                        <div className="text-left rtl:text-right">
                          <p className="text-[10.5px] font-black text-white leading-none">{googleUser.displayName}</p>
                          <p className="text-[9px] text-slate-500 leading-none mt-0.5">{googleUser.email}</p>
                        </div>
                        <button
                          onClick={handleGoogleSheetsLogout}
                          className="p-1 px-2 bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 rounded cursor-pointer transition-all text-[10px] text-slate-400 font-bold ml-1.5"
                        >
                          {isArabic ? "قطع الاتصال" : "Disconnect"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGoogleSheetsLogin}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-755 text-slate-200 py-2.5 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 48 48 text-left">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span>{isArabic ? "ربط مزامنة Google" : "Connect Google Drive"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ACTIVE CONTROLS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  
                  {/* TRIGGER BUTTON */}
                  <button
                    onClick={handleSyncToGoogleSheets}
                    disabled={isSyncingSheets}
                    className={`p-3 rounded-lg flex flex-col justify-between items-start transition-all border outline-none text-left rtl:text-right cursor-pointer ${
                      isSyncingSheets
                        ? "bg-slate-950/20 border-slate-850 text-slate-500 cursor-not-allowed"
                        : googleUser
                        ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
                        : "bg-slate-950/45 hover:bg-slate-900/60 border-slate-850 text-slate-400"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`p-1.5 rounded-md ${googleUser ? "bg-emerald-500/20" : "bg-slate-800"}`}>
                        <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? "animate-spin" : ""}`} />
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">{isArabic ? "تجميع كامل" : "Sync all"}</span>
                    </div>
                    <div className="mt-3">
                      <p className="font-black text-[12px]">{isArabic ? "مزامنة كامل السجل" : "Sync Entire Book"}</p>
                      <p className="text-[9.5px] text-slate-500 font-medium mt-1">
                        {isArabic ? "كافة الدفاتر والصناديق وعلاقات الذمم" : "All books, tabs, caches and statements"}
                      </p>
                    </div>
                  </button>

                  {/* OPEN SPREADSHEET LIVE LINK */}
                  {spreadsheetsId ? (
                    <a
                      href={spreadsheetsUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetsId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-950/65 hover:bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between items-start transition-all text-left rtl:text-right cursor-pointer group"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="p-1.5 bg-slate-850 rounded-md text-emerald-400 group-hover:scale-105 transition-transform">
                          <FileSpreadsheet className="w-4 h-4" />
                        </span>
                        <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider">{isArabic ? "مفتوح بجوجل" : "On Google Sheets"}</span>
                      </div>
                      <div className="mt-3">
                        <p className="font-black text-[12px] text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {isArabic ? "فتح جدول البيانات المباشر" : "Open Google Sheets"}
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-medium mt-1">
                          {isArabic ? "تصفح الجداول المزامنة سحابياً" : "View and edit spreadsheets on Drive"}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="p-3 bg-slate-950/20 border border-slate-850/40 rounded-lg flex flex-col justify-between items-start text-slate-600">
                      <span className="p-1.5 bg-slate-900/40 rounded-md">
                        <FileSpreadsheet className="w-4 h-4" />
                      </span>
                      <div className="mt-3">
                        <p className="font-black text-[12px]">{isArabic ? "جدول البيانات غير متاح" : "Sheet not created"}</p>
                        <p className="text-[9px] font-medium mt-1">{isArabic ? "يتم إنشاؤه تلقائياً عقب أول تصفح مفعل" : "Created automatically keying into first sync"}</p>
                      </div>
                    </div>
                  )}

                  {/* EXCEL DOWNLOAD COMPILED LINK */}
                  {spreadsheetsId ? (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetsId}/export?format=xlsx`}
                      className="p-3 bg-slate-950/65 hover:bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between items-start transition-all text-left rtl:text-right cursor-pointer group"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="p-1.5 bg-slate-850 rounded-md text-amber-500 group-hover:scale-105 transition-transform">
                          <Database className="w-4 h-4" />
                        </span>
                        <span className="text-[9.5px] font-bold text-amber-400 uppercase tracking-wider">.XLSX EXPORT</span>
                      </div>
                      <div className="mt-3">
                        <p className="font-black text-[12px] text-slate-200 group-hover:text-amber-400 transition-colors">
                          {isArabic ? "تحميل كـ Excel مجمّع" : "Download Excel (.xlsx)"}
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-medium mt-1">
                          {isArabic ? "تنزيل كافة الأقسام مدمجة بملف واحد" : "Compile tabs into a single workbook"}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="p-3 bg-slate-950/20 border border-slate-850/40 rounded-lg flex flex-col justify-between items-start text-slate-600">
                      <span className="p-1.5 bg-slate-900/40 rounded-md">
                        <Database className="w-4 h-4" />
                      </span>
                      <div className="mt-3">
                        <p className="font-black text-[12px]">{isArabic ? "تحميل إكسل غير متاح" : "Excel compiler offline"}</p>
                        <p className="text-[9px] font-medium mt-1">{isArabic ? "يتطلب ربط المزامنة السحابية أولاً" : "Requires active spreadsheet linkage first"}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* DATA INJECTIONS & SAMPLE RECOVERY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Backups & Restore */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-amber-500" />
                      <span>{isArabic ? "النسخ الاحتياطي وتأمينات الدفاتر" : "Proprietary Local Database Backups"}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2 p-0.5">
                      {isArabic 
                        ? "يعمل البرنامج كلياً محلياً ويخزن قواعد البيانات في المتصفح للحفاظ على أعلى مستويات الخصوصية والتكتم وسرية الموازين. يوصى بالتصدير دورياً." 
                        : "Everything runs serverless in sandbox memory ensuring absolute confidentiality. Download files to transfer them."}
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-4 text-xs font-bold">
                    <button
                      onClick={() => {
                        const backupData = {
                          dealers,
                          dealerStatements,
                          purchases,
                          sales,
                          expenses,
                          walletTransactions,
                          assayLogs,
                          exportedAt: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `نسخة_احتياطية_موازين_الأهرام_${new Date().toISOString().split("T")[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded transition-colors flex items-center justify-center gap-1 font-black"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isArabic ? "تصدير الدفاتر (.JSON)" : "Export Database"}</span>
                    </button>

                    <label className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 py-2 rounded cursor-pointer transition-colors flex items-center justify-center gap-1 font-semibold text-center">
                      <FolderOpen className="w-4 h-4 text-amber-450" />
                      <span>{isArabic ? "استيراد واستعادة" : "Import Backup"}</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const parsed = JSON.parse(event.target?.result as string);
                              if (parsed.dealers && parsed.purchases) {
                                setDealers(parsed.dealers || []);
                                setDealerStatements(parsed.dealerStatements || []);
                                setPurchases(parsed.purchases || []);
                                setSaleItems(parsed.sales || []);
                                setExpenses(parsed.expenses || []);
                                setWalletTransactions(parsed.walletTransactions || []);
                                setAssayLogs(parsed.assayLogs || []);

                                saveToLocalStorage("pyramids_dealers", parsed.dealers || []);
                                saveToLocalStorage("pyramids_dealer_statements", parsed.dealerStatements || []);
                                saveToLocalStorage("pyramids_purchases", parsed.purchases || []);
                                saveToLocalStorage("pyramids_sales", parsed.sales || []);
                                saveToLocalStorage("pyramids_expenses", parsed.expenses || []);
                                saveToLocalStorage("pyramids_wallet", parsed.walletTransactions || []);
                                saveToLocalStorage("pyramids_assay_logs", parsed.assayLogs || []);
                                showAlert(isArabic ? "تم استعادة قاعدة بيانات الأهرام بنجاح!" : "Database successfully restored!");
                              } else {
                                showAlert(isArabic ? "ملف النسخة الاحتياطية غير سليم!" : "Invalid backup file structure.");
                              }
                            } catch (err) {
                              showAlert("Failed to parse file.");
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Database Cleansing & Sample Recovery */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-rose-500 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-rose-500" />
                      <span>{isArabic ? "تطهير وإعادة ضبط الدفاتر المحتسبة" : "Wipe Ledgers & Clean Workspace"}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2 p-0.5">
                      {isArabic 
                        ? "تعديل معطيات المزامنة كلياً لاستيراد العينات الرقمية للتدريب والمطابقة، أو البدء بدفاتر صاغة فارغة تماماً للعام المالي الجديد." 
                        : "Reset database back to template examples or empty all inputs for a newer accounting year."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 text-xs font-bold">
                    <button
                      onClick={handleResetDatabase}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 py-2 rounded transition-colors"
                    >
                      {isArabic ? "تنزيل العينات التجريبية" : "Load Reference Seeds"}
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="bg-rose-500/[0.15] hover:bg-rose-500/[0.25] text-rose-400 border border-rose-500/20 py-2 rounded transition-colors"
                    >
                      {isArabic ? "تصفير ومسح الدفاتر" : "Wipe All Databases"}
                    </button>
                  </div>
                </div>

              </div>

              {/* ADMIN SECURE DATABASE CONSOLE */}
              <LocalDatabaseConsole
                purchases={purchases}
                sales={sales}
                expenses={expenses}
                walletTransactions={walletTransactions}
                dealerStatements={dealerStatements}
                dealers={dealers}
                workshops={workshops}
                workshopTransactions={workshopTransactions}
                assayLogs={assayLogs}
                isArabic={isArabic}
                onDeletePurchase={handleDeletePurchase}
                onDeleteSale={handleDeleteSale}
                onDeleteExpense={handleDeleteExpense}
                onDeleteWalletTransaction={handleDeleteWalletTransaction}
                onDeleteWorkshopTransaction={handleDeleteWorkshopTransaction}
                onDeleteAssayLog={handleDeleteAssayLog}
                showAlert={showAlert}
              />

            </div>
          )}
            </>
          )}
        </div>
      </main>

      {/* TRADINGVIEW GLOBAL LIVE PRECIOUS METALS CHART */}
      <div className="px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full mb-8">
        <TradingViewGoldChart isArabic={isArabic} />
      </div>

      {/* FOOTER GENERAL LEGALS */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 mt-12 text-center text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium text-slate-400">
          <p>{isArabic ? "جميع الحقوق محفوظة © الأهرام لتجارة وتعدين وششنة الذهب" : "All rights reserved © Pyramids Gold Refining Ledger Suite"}</p>
          <div className="flex gap-4 text-slate-500">
            <span>{isArabic ? "تصفية الطهيف ٢١ بالسهم المرجعي" : "Tahyeef 21 Reference systems calibrated"}</span>
            <span className="text-amber-500">★ {isArabic ? "دقة الميزان المهني" : "Professional Grade Accuracy"}</span>
          </div>
        </div>
      </footer>

      {/* GLOBAL HIGH-END CUSTOM MODAL */}
      <CustomModal
        isOpen={modalOpen}
        type={modalType}
        message={modalMessage}
        isArabic={isArabic}
        onConfirm={modalType === "confirm" ? modalConfirmCallback : undefined}
        onClose={() => setModalOpen(false)}
      />

      {/* ADMIN ENCRYPTED PASSCODE KEYPAD */}
      <AdminPasscodeModal
        isOpen={showPasscodeModal}
        isArabic={isArabic}
        onClose={() => setShowPasscodeModal(false)}
        onSuccess={() => {
          setIsAdminMode(true);
          localStorage.setItem("pyramids_admin_mode", "true");
          setShowPasscodeModal(false);
          setActiveTab("dashboard");
          showAlert(isArabic ? "تم تفعيل رتبة المدير العام بنجاح! تم فتح سجل العمليات والتقارير وتصفية الخزائن الموحدة." : "Admin Mode unlocked successfully! Granted master access to safes, statement logs, and reports.");
        }}
      />

      {/* FIXED ARAB ECONOMIC CHANNELS STYLE TICKER BANNER FOR ARAB CURRENCY CONVERSIONS */}
      <ArabCurrenciesTicker isArabic={isArabic} />

    </div>
  );
}
