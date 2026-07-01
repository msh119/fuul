/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Percent,
  TrendingUp,
  Coins,
  Lock,
  ShieldAlert,
  Key,
  FileSpreadsheet,
  PlusCircle,
  Trash2,
  Calendar,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  Trash,
  DollarSign
} from "lucide-react";
import { PurchaseItem, SaleItem, PublicExpenseItem, PrivateWalletTransaction, Partner, PartnerTransaction } from "../types";
import { formatCurrency, downloadCSV } from "../utils";

interface PartnersManagerProps {
  purchases: PurchaseItem[];
  sales: SaleItem[];
  expenses: PublicExpenseItem[];
  walletTransactions: PrivateWalletTransaction[]; // used to calculate total assay revenues
  isArabic: boolean;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showAlert: (message: string) => void;
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  pyramidsCapital: number;
  setPyramidsCapital: (val: number) => void;
  companyShare: number;
  setCompanyShare: (val: number) => void;
  partnersPoolShare: number;
  setPartnersPoolShare: (val: number) => void;
  privateWalletBalance: number;
  setWalletTransactions?: React.Dispatch<React.SetStateAction<PrivateWalletTransaction[]>>;
}

export default function PartnersManager({
  purchases,
  sales,
  expenses,
  walletTransactions,
  isArabic,
  showConfirm,
  showAlert,
  partners,
  setPartners,
  pyramidsCapital,
  setPyramidsCapital,
  companyShare,
  setCompanyShare,
  partnersPoolShare,
  setPartnersPoolShare,
  privateWalletBalance,
  setWalletTransactions,
}: PartnersManagerProps) {
  // SECURITY STATE
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("pyramids_partners_unlocked_session") === "true";
  });
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [securityError, setSecurityError] = useState(false);

  // PYRAMIDS CORPORATE CAPITAL MODIFIER
  const [isEditingPyramidsCapital, setIsEditingPyramidsCapital] = useState(false);
  const [tempPyramidsCapital, setTempPyramidsCapital] = useState(pyramidsCapital.toString());

  // FORM STATES
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartnerNameAr, setNewPartnerNameAr] = useState("");
  const [newPartnerNameEn, setNewPartnerNameEn] = useState("");
  const [newPartnerPhone, setNewPartnerPhone] = useState("");
  const [newPartnerShare, setNewPartnerShare] = useState("");
  const [newPartnerCapital, setNewPartnerCapital] = useState("");
  const [newPartnerNotesAr, setNewPartnerNotesAr] = useState("");
  const [newPartnerNotesEn, setNewPartnerNotesEn] = useState("");

  // EDIT PARTNER STATES
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [selectedPartnerForEdit, setSelectedPartnerForEdit] = useState<Partner | null>(null);
  const [editPartnerNameAr, setEditPartnerNameAr] = useState("");
  const [editPartnerNameEn, setEditPartnerNameEn] = useState("");
  const [editPartnerPhone, setEditPartnerPhone] = useState("");
  const [editPartnerShare, setEditPartnerShare] = useState("");
  const [editPartnerNotesAr, setEditPartnerNotesAr] = useState("");
  const [editPartnerNotesEn, setEditPartnerNotesEn] = useState("");

  const [selectedPartnerForTx, setSelectedPartnerForTx] = useState<Partner | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"capital_inject" | "dividend_withdraw">("capital_inject");
  const [txAmount, setTxAmount] = useState("");
  const [txDescAr, setTxDescAr] = useState("");
  const [txDescEn, setTxDescEn] = useState("");

  const [isEditingRatios, setIsEditingRatios] = useState(false);
  const [tempCompanyShare, setTempCompanyShare] = useState(companyShare);
  const [tempPartnersShare, setTempPartnersShare] = useState(partnersPoolShare);

  useEffect(() => {
    setTempCompanyShare(companyShare);
    setTempPartnersShare(partnersPoolShare);
  }, [companyShare, partnersPoolShare]);

  useEffect(() => {
    setTempPyramidsCapital(pyramidsCapital.toString());
  }, [pyramidsCapital]);

  // FORM TRANSLATIONS MAP
  const t = {
    securityTitle: isArabic ? "صلاحية الشركاء والممولين المغلقة 💎" : "Confidential Partners Ledger 💎",
    securityDesc: isArabic
      ? "تعتمد حسابات أنصبة الشراكة وصافي الأرباح والخسائر وحصص التمويل على بيانات مشفرة وحساسة للمالك العام. يتطلب إلغاء القيود إدخال كود المصادقة الأمنية المخصص."
      : "Ratios of partnership shares, profit allocations, and funding stakes contain sensitive data. Please enter the dedicated authorization passcode to proceed.",
    unlockBtn: isArabic ? "فك التشفير والمتابعة" : "Approve Passcode",
    wrongCode: isArabic ? "رمز المرور المدخل غير صحيح بالمرة!" : "Passcode verification failed! Check coordinates.",
    tabTitle: isArabic ? "نظام الشركاء وتوزيع الأرباح والاستثمار" : "Partners, Stakeholders & Net Distributions",
    companyRatioText: isArabic ? "نسبة شركة بيراميدز (الرئيسية)" : "Pyramids Company Main Stake",
    partnersPoolText: isArabic ? "نسبة الشركاء والممولين الإجمالية" : "Combined Partners Stakes Pool",
    distTotal: isArabic ? "إجمالي التوزيع" : "Total Allocation",
    editRatios: isArabic ? "تعديل النسب التعاقدية" : "Configure Profit Ratios",
    saveRatios: isArabic ? "حفظ العقود الجارية" : "Save Contract Ratios",
    pyramidsCapitalLabel: isArabic ? "رأس مال شركة بيراميدز الممول المكتتب:" : "Pyramids Gold Paid Corporate Capital:",
    pyramidsCapitalHelp: isArabic ? "تكلفة تم دفعها من بيراميدز وقابلة للزيادة" : "Initial cost funded by Pyramids Gold, dynamically increasable",
    editPyramidsCapitalTitle: isArabic ? "تعديل وتنمية رأس مال المؤسسة الرئيسي" : "Update Corporate Capital Principal",
    saveCapital: isArabic ? "حفظ رأس المال المدفوع" : "Commit Capital Value",
    totalEnterpriseCapital: isArabic ? "إجمالي القيمة الرأسمالية للمشروع" : "Joined Enterprise Enterprise Capital",
    cancel: isArabic ? "إلغاء الأمر" : "Cancel",
    partnerListTitle: isArabic ? "شبكة الشركاء النشطين وحصصهم" : "Current Registered Partners & stakes",
    addPartner: isArabic ? "تسجيل شريك / ممول جديد" : "Register Cohort Partner",
    nameArPlaceholder: isArabic ? "الاسم الكامل (بالعربية) *" : "Full Name (Arabic) *",
    nameEnPlaceholder: isArabic ? "الاسم الكامل (بالانجليزية) *" : "Full Name (English) *",
    phoneLabel: isArabic ? "الهاتف (اختياري)" : "Phone (Optional)",
    shareLabel: isArabic ? "نسبة الأرباح من إجمالي الشركة (%) *" : "Share of Overall Business Profit (%) *",
    capitalLabel: isArabic ? "رأس المال التمويلي المودع المبدئي *" : "Initial Core Capital Investment *",
    submitPartner: isArabic ? "إدراج شريك بجدول العقود" : "Commit Partner Record",
    metricsTitle: isArabic ? "موازين الأرباح والخسائر وعوائد الشراكة" : "Active Distribution ledger & yields",
    overallNetProfit: isArabic ? "الربح الصافي الجاري للمؤسسة:" : "Working Web Net Business Profit:",
    compYield: isArabic ? "عائد شركة بيراميدز الجاري" : "Pyramids Net Yield",
    partYield: isArabic ? "إجمالي عوائد الشركاء الجارية" : "Combined Partners Yield",
    contributedCapTotal: isArabic ? "إجمالي المبالغ والممولات" : "Total Registered Capital",
    outstandingBalance: isArabic ? "الرصيد المتاح الشامل" : "Aggregate Liquid Book Balance",
    partnerCardShare: isArabic ? "الحسابات الخاصة بالشريك" : "Individual Partner Ledger Summary",
    shareRatioLabel: isArabic ? "الحصة من الأرباح الجارية:" : "Actual profit stake ratio:",
    capitalInvestedLabel: isArabic ? "رأس مال التمويل:" : "Core Funded Capital:",
    earnedProfitsLabel: isArabic ? "الأرباح المحققة الجارية:" : "Realtime Earned Yields:",
    withdrawalsLabel: isArabic ? "دفعات المسحوبات والأرباح:" : "Dividends / Capital Deductions:",
    netSafeBalance: isArabic ? "إجمالي المستحقات والذمة:" : "Current Outstanding Stake Value:",
    addTxBtn: isArabic ? "تسجيل حركة مالية" : "Log Capital / Profit Tx",
    deletePartnerTitle: isArabic ? "حذف الشريك" : "Delete Partner Record",
    txModalTitle: isArabic ? "تسجيل حركة محاسبية للشريك: " : "Post Transaction to Partner: ",
    txTypeLabel: isArabic ? "نوع الحركة المالية والبيان:" : "Action Type & Ledger Class:",
    capitalInjectOption: isArabic ? "إيداع / جلب رأس مال إضافي" : "Support Deposit (Capital Injection)",
    dividendWithdrawOption: isArabic ? "سحب أرباح أو دفعات للمسحوبات" : "Dividend Payout (Dividend / Share Withdrawal)",
    amountInputLabel: isArabic ? "قيمة الحركة كاش (ج.م) *" : "Cash Amount (EGP) *",
    descArInput: isArabic ? "البيان وتوضيح الحركة (بالعربية) *" : "Memo / Description (Arabic) *",
    descEnInput: isArabic ? "البيان وتوضيح الحركة (بالانجليزية) *" : "Memo / Description (English) *",
    submitTx: isArabic ? "ترحيل الحركة لدفتر الشريك" : "Post Transaction to Slate",
    statementTitle: isArabic ? "دفتر الحركات التاريخي لحسابات الشركاء والممولين" : "Combined Stakeholders Transaction Ledger Flow",
    exportExcel: isArabic ? "تحميل سجل الشركاء إكسل" : "Download Partners Excel",
    date: isArabic ? "التاريخ" : "Date",
    noPartners: isArabic ? "لا يوجد ممولين مسجلين بعد في الدفتر." : "No partners found in local ledger records.",
    ratioAlertWarning: isArabic ? "الرجاء الملاحظة أن مجموع نسب الشركاء يجب ألا يتجاوز نسبة حقل الشركاء الإجمالية المتفق عليها لضمان الاتساق المحاسبي!" : "Ensure that individual partner shares do not exceed the combined partners share pool limit for double-entry compatibility!",
    contractNotesArLabel: isArabic ? "الوضع والاتفاق الخاص والشروط الجانبية (بالعربية) *" : "Custom Agreement & Side Conditions (Arabic) *",
    contractNotesEnLabel: isArabic ? "الوضع والاتفاق الخاص والشروط الجانبية (بالإنجليزية) *" : "Custom Agreement & Side Conditions (English) *",
    contractNotesPlaceholderAr: isArabic ? "مثال: اتفاقية توريد عيني بالذهب المكسور أو عوائد شهرية ثابتة" : "e.g. Scrap gold supply or fixed monthly yields contract terms",
    contractNotesPlaceholderEn: isArabic ? "e.g. Custom scrap gold weight supply or fixed returns" : "e.g. Custom scrap gold weight supply or fixed returns",
    editPartnerTitle: isArabic ? "تعديل بنود وعقد الشريك" : "Edit Partner Contract & Situation",
    saveChanges: isArabic ? "حفظ التعديلات التعاقدية" : "Save Modified Agreement"
  };

  // CHECK SECURITY CODE ENTRY
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = securityCodeInput.trim().toUpperCase();
    if (code === "XULA9611" || code === "202620") {
      setIsUnlocked(true);
      setSecurityError(false);
      sessionStorage.setItem("pyramids_partners_unlocked_session", "true");
      showAlert(isArabic ? "تم التحقق والمصادقة على فك تشفير أنصبة الشركاء والممولين!" : "Confidential Partners & Stakeholders matrix successfully decrypted!");
    } else {
      setSecurityError(true);
      setIsUnlocked(false);
    }
  };

  // INTERACTIVE RE-COMPUTATIONS (Same netProfit formula as Dashboard overview)
  const totalPurchasesWeight = purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0);
  const totalPurchasesValue = purchases.reduce((acc, p) => acc + p.goldValue, 0);
  
  // Weighted average cost of 21k gold purchased
  const averagePurchasePrice21 = totalPurchasesWeight > 0 
    ? totalPurchasesValue / totalPurchasesWeight 
    : 3000;

  const totalSalesWeight = sales.reduce((acc, s) => acc + s.equivalentWeight21, 0);
  const totalSalesValue = sales.reduce((acc, s) => acc + s.goldValue, 0);

  // Cost of Gold Sold (COGS)
  const costOfGoldSold = totalSalesWeight * averagePurchasePrice21;

  // Realized Gold Trading Profit
  const goldTradingProfit = totalSalesValue - costOfGoldSold;

  const totalAssayRevenues = walletTransactions
    .filter((t) => t.type === "assay_fee_income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalBrokerFees = purchases.reduce((acc, p) => acc + p.brokerFee, 0);
  const totalOverheadExpenses = expenses
    .filter((e) => e.category === "overhead")
    .reduce((acc, e) => acc + e.amount, 0);

  const netBusinessProfit =
    goldTradingProfit + totalAssayRevenues - totalBrokerFees - totalOverheadExpenses;

  // Aggregate Calculations for Partners
  const totalPartnersAllocatedShare = partners.reduce((acc, p) => acc + p.sharePercent, 0);
  const totalCapitalContributed = partners.reduce((acc, p) => acc + p.capitalContributed, 0);

  // Corporate Profit Allocation & Vault Liquidity Matrix data
  const summaryRows = [
    {
      id: "company",
      type: "company",
      nameAr: "مؤسسة بيراميدز (الحصة التشغيلية)",
      nameEn: "Pyramids Enterprise (Operational Stake)",
      sharePercent: companyShare,
      capital: pyramidsCapital,
      earnedProfits: netBusinessProfit * (companyShare / 100),
      withdrawals: 0,
      netDues: netBusinessProfit * (companyShare / 100),
      vaultCashShare: privateWalletBalance * (companyShare / 100)
    },
    ...partners.map((p) => {
      const calc = getPartnerBalancesAndCalculations(p);
      return {
        id: p.id,
        type: "partner",
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        sharePercent: p.sharePercent,
        capital: p.capitalContributed,
        earnedProfits: calc.earnedProfits,
        withdrawals: calc.totalWithdrawals,
        netDues: calc.earnedProfits - calc.totalWithdrawals,
        vaultCashShare: privateWalletBalance * (p.sharePercent / 100)
      };
    })
  ];

  // Totals for table summary
  const totalSummaryCapital = pyramidsCapital + totalCapitalContributed;
  const totalSummaryEarnedProfits = netBusinessProfit;
  const totalSummaryWithdrawals = partners.reduce((sum, p) => {
    return sum + p.transactions
      .filter((t) => t.type === "dividend_withdraw")
      .reduce((tSum, t) => tSum + t.amount, 0);
  }, 0);
  const totalSummaryNetDues = totalSummaryEarnedProfits - totalSummaryWithdrawals;
  const totalSummaryVaultCash = privateWalletBalance;

  // Ratios handler
  const handleSaveRatios = () => {
    if (tempCompanyShare + tempPartnersShare !== 100) {
      showAlert(isArabic ? "يجب أن يكون مجموع نسب الشركة والشركاء معاً يساوي ١٠٠٪ تماماً!" : "Company share and Partners share must sum to exactly 100%!");
      return;
    }
    setCompanyShare(tempCompanyShare);
    setPartnersPoolShare(tempPartnersShare);
    localStorage.setItem("pyramids_company_share_percent", tempCompanyShare.toString());
    localStorage.setItem("pyramids_partners_pool_share_percent", tempPartnersShare.toString());
    setIsEditingRatios(false);
    showAlert(isArabic ? "تم تعديل وحفظ بنود ونسب الشراكة بنجاح في سجل العقود!" : "Contract overall margins saved and updated successfully!");
  };

  // Pyramids Corporate Capital Saver
  const handleSavePyramidsCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const capNum = Number(tempPyramidsCapital);
    if (isNaN(capNum) || capNum < 0) {
      showAlert(isArabic ? "الرجاء توفير قيمة مالية صحيحة أكبر من أو تساوي الصفر!" : "Please specify a valid capital amount.");
      return;
    }
    setPyramidsCapital(capNum);
    setIsEditingPyramidsCapital(false);
    showAlert(isArabic ? `تم تحديث وزيادة رأس مال شركة بيراميدز المكتتب ليكون: ${formatCurrency(capNum, true)}` : `Pyramids corporate capital principal updated to ${formatCurrency(capNum, false)}`);
  };

  // Add Partner handler
  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const shareNum = Number(newPartnerShare);
    const capitalNum = Number(newPartnerCapital);

    if (!newPartnerNameAr || !newPartnerNameEn || isNaN(shareNum) || isNaN(capitalNum)) {
      showAlert(isArabic ? "الرجاء تعبئة الحقول الأساسية بشكل صحيح!" : "Please fill in all required fields cleanly.");
      return;
    }

    if (totalPartnersAllocatedShare + shareNum > partnersPoolShare) {
      showAlert(
        isArabic
          ? `نسبة الشريك جديدة تتجاوز السقف المسموح به للشركاء وهو ${partnersPoolShare}%. المتبقي المتاح للتوزيع: ${(partnersPoolShare - totalPartnersAllocatedShare).toFixed(1)}%`
          : `New partner stake exceeds combined partners pool limit of ${partnersPoolShare}%. Remaining available stake: ${(partnersPoolShare - totalPartnersAllocatedShare).toFixed(1)}%`
      );
      return;
    }

    const newPartner: Partner = {
      id: `partner_${Date.now()}`,
      nameAr: newPartnerNameAr,
      nameEn: newPartnerNameEn,
      phone: newPartnerPhone || undefined,
      sharePercent: shareNum,
      capitalContributed: capitalNum,
      contractNotesAr: newPartnerNotesAr || undefined,
      contractNotesEn: newPartnerNotesEn || undefined,
      transactions: [
        {
          id: `ptx_init_${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          type: "capital_inject",
          amount: capitalNum,
          descriptionAr: `رأس مال تأسيسي للممول عند إضافته بالنظام بقوانين ${shareNum}%`,
          descriptionEn: `Core capital deposit for newly registered stakeholder at ${shareNum}% stake`
        }
      ]
    };

    const updated = [...partners, newPartner];
    setPartners(updated);
    setShowAddModal(false);
    setNewPartnerNameAr("");
    setNewPartnerNameEn("");
    setNewPartnerPhone("");
    setNewPartnerShare("");
    setNewPartnerCapital("");
    setNewPartnerNotesAr("");
    setNewPartnerNotesEn("");
    showAlert(isArabic ? `تمت إضافة الممول والشريك ${newPartnerNameAr} للمنصة وتوليد دفاتره!` : `Successfully established stakeholder entry for ${newPartnerNameEn}!`);
  };

  // Open edit partner modal and set initial values
  const handleOpenEditPartnerModal = (partner: Partner) => {
    setSelectedPartnerForEdit(partner);
    setEditPartnerNameAr(partner.nameAr);
    setEditPartnerNameEn(partner.nameEn);
    setEditPartnerPhone(partner.phone || "");
    setEditPartnerShare(partner.sharePercent.toString());
    setEditPartnerNotesAr(partner.contractNotesAr || "");
    setEditPartnerNotesEn(partner.contractNotesEn || "");
    setShowEditPartnerModal(true);
  };

  // Save changes to edited partner
  const handleSaveEditPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerForEdit) return;

    const shareNum = Number(editPartnerShare);
    if (isNaN(shareNum) || shareNum < 0) {
      showAlert(isArabic ? "الرجاء توفير نسبة صحيحة أكبر من أو تساوي الصفر!" : "Please specify a valid share percentage.");
      return;
    }

    // Verify ratio limit does not exceed total pool
    const otherPartnersAllocated = partners
      .filter((p) => p.id !== selectedPartnerForEdit.id)
      .reduce((sum, p) => sum + p.sharePercent, 0);

    if (otherPartnersAllocated + shareNum > partnersPoolShare) {
      showAlert(
        isArabic
          ? `نسبة الشريك المعدلة تتجاوز السقف الإجمالي للشركاء وهو ${partnersPoolShare}%. الحد الأقصى المتاح لهذا الشريك حالياً: ${(partnersPoolShare - otherPartnersAllocated).toFixed(1)}%`
          : `Modified partner share exceeds combined partners pool limit of ${partnersPoolShare}%. Maximum available for this partner is ${(partnersPoolShare - otherPartnersAllocated).toFixed(1)}%`
      );
      return;
    }

    const updatedPartners = partners.map((p) => {
      if (p.id === selectedPartnerForEdit.id) {
        return {
          ...p,
          nameAr: editPartnerNameAr,
          nameEn: editPartnerNameEn,
          phone: editPartnerPhone || undefined,
          sharePercent: shareNum,
          contractNotesAr: editPartnerNotesAr || undefined,
          contractNotesEn: editPartnerNotesEn || undefined,
        };
      }
      return p;
    });

    setPartners(updatedPartners);
    setShowEditPartnerModal(false);
    setSelectedPartnerForEdit(null);
    showAlert(isArabic ? "تم تعديل وحفظ بنود الشراكة وعقد الممول بنجاح!" : "Partner agreement and contract updated successfully!");
  };

  // Delete Partner handler
  const handleDeletePartner = (id: string, name: string) => {
    showConfirm(
      isArabic
        ? `هل أنت متأكد تماماً من شطب الشريك (${name}) من الدفتر تماماً؟ سيؤدي ذلك لشطب كامل بيانات رأس المال وتاريخ العمليات المحاسبية الخاصة به.`
        : `Decommission stakeholder ledger of (${name}) permanently? All ledger history and capital will be expunged.`,
      () => {
        const partnerToDelete = partners.find((p) => p.id === id);
        if (partnerToDelete && setWalletTransactions) {
          const txIdsToDelete = partnerToDelete.transactions.map((t) => `w_ptx_${t.id}`);
          const updatedWallet = walletTransactions.filter((w) => !txIdsToDelete.includes(w.id));
          setWalletTransactions(updatedWallet);
          localStorage.setItem("pyramids_wallet", JSON.stringify(updatedWallet));
        }

        const updated = partners.filter((p) => p.id !== id);
        setPartners(updated);
        showAlert(isArabic ? "تم شطب وتصفية سجل الشريك بنجاح." : "Stakeholder profile removed.");
      }
    );
  };

  // Open transaction modal
  const handleOpenTxModal = (partner: Partner) => {
    setSelectedPartnerForTx(partner);
    setTxAmount("");
    setTxDescAr(isArabic ? "سحب توزيع ربحية دوري" : "Periodic profit share dividend drawdown");
    setTxDescEn(isArabic ? "Drawdown of capital profit yields" : "Periodic dividend cash withdrawal");
    setTxType("dividend_withdraw");
    setShowTxModal(true);
  };

  // Handle post transaction
  const handlePostPartnerTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerForTx) return;

    const amountNum = Number(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showAlert(isArabic ? "الرجاء توفير قيمة مالية صحيحة أكبر من الصفر!" : "Please specify a valid financial amount greater than zero.");
      return;
    }

    if (!txDescAr || !txDescEn) {
      showAlert(isArabic ? "الرجاء ملء بيانات وصف وبيان الحركة للتوثيق!" : "Please write a memo description in both languages for audit logging.");
      return;
    }

    const newTx: PartnerTransaction = {
      id: `ptx_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: txType,
      amount: amountNum,
      descriptionAr: txDescAr,
      descriptionEn: txDescEn
    };

    const updatedPartners = partners.map((p) => {
      if (p.id === selectedPartnerForTx.id) {
        let newCapital = p.capitalContributed;
        if (txType === "capital_inject") {
          newCapital += amountNum;
        }
        return {
          ...p,
          capitalContributed: newCapital,
          transactions: [newTx, ...p.transactions]
        };
      }
      return p;
    });

    setPartners(updatedPartners);

    // Double-entry cash flow logging in Central Vault:
    if (setWalletTransactions) {
      const pNameAr = selectedPartnerForTx.nameAr;
      const pNameEn = selectedPartnerForTx.nameEn;

      const vaultTx: PrivateWalletTransaction = {
        id: `w_ptx_${newTx.id}`,
        date: newTx.date,
        type: txType === "dividend_withdraw" ? "partner_dividend_payout" : "partner_capital_injection",
        descriptionAr: txType === "dividend_withdraw"
          ? `مسحوبات أرباح الشريك (${pNameAr}): ${txDescAr}`
          : `تمويل كاش إضافي من الشريك (${pNameAr}): ${txDescAr}`,
        descriptionEn: txType === "dividend_withdraw"
          ? `Dividend withdrawal of Partner (${pNameEn}): ${txDescEn}`
          : `Capital injection by Partner (${pNameEn}): ${txDescEn}`,
        amount: txType === "dividend_withdraw" ? -amountNum : amountNum
      };

      const updatedWallet = [vaultTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      localStorage.setItem("pyramids_wallet", JSON.stringify(updatedWallet));
    }

    setShowTxModal(false);
    setSelectedPartnerForTx(null);
    showAlert(isArabic ? "تم تسجيل وترحيل الحركة المالية في حسابات الشريك وبخزنة المحل بنجاح!" : "Transaction successfully written to stakeholder history and deducted from shop vault!");
  };

  // Delete transaction
  const handleDeleteTx = (partnerId: string, txId: string) => {
    showConfirm(
      isArabic ? "هل تريد بالتأكيد حذف هذه الحركة الموثقة للشريك والتراجع عنها بالمجاميع؟" : "Revert and drop this stakeholder transaction permanently?",
      () => {
        const updated = partners.map((p) => {
          if (p.id === partnerId) {
            const targetTx = p.transactions.find((t) => t.id === txId);
            let newCapital = p.capitalContributed;
            if (targetTx && targetTx.type === "capital_inject") {
              newCapital -= targetTx.amount; // rollback capital addition
            }
            return {
              ...p,
              capitalContributed: newCapital,
              transactions: p.transactions.filter((t) => t.id !== txId)
            };
          }
          return p;
        });
        setPartners(updated);

        // Delete double-entry from central vault
        if (setWalletTransactions) {
          const updatedWallet = walletTransactions.filter((tx) => tx.id !== `w_ptx_${txId}`);
          setWalletTransactions(updatedWallet);
          localStorage.setItem("pyramids_wallet", JSON.stringify(updatedWallet));
        }

        showAlert(isArabic ? "تم إلغاء قيد الحركة وإرجاع الموازنة." : "Transaction reverted successfully.");
      }
    );
  };

  // Calculate detailed summary per partner
  const getPartnerBalancesAndCalculations = (p: Partner) => {
    // Profit = Net platform profit * (Partner overall share ratio / 100)
    const earnedProfits = netBusinessProfit * (p.sharePercent / 100);

    // Sum of capital inject transactions (excluding the initial one if already factored, wait we manage capitalContributed cleanly in state so let's sum based on transactions class)
    // Actually, let's keep capital as the current principal and track withdrawals separately:
    const totalWithdrawals = p.transactions
      .filter((t) => t.type === "dividend_withdraw")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalInjections = p.transactions
      .filter((t) => t.type === "capital_inject")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalPartnerWithdrawn = totalWithdrawals;
    const netCurrentStakeValue = totalInjections + earnedProfits - totalWithdrawals;

    return {
      earnedProfits,
      totalWithdrawals,
      totalInjections,
      netCurrentStakeValue
    };
  };

  // Export Combined Partner Records to Excel
  const handleExportPartnersExcel = () => {
    const csvRows: string[][] = [];

    // --- Section 1: HEADER SECTION ---
    csvRows.push([isArabic ? "سجل الحسابات الكامل والجامع للشركاء والممولين" : "COMPLETE INTEGRATED PARTNERS & STAKEHOLDERS LEDGER"]);
    csvRows.push([isArabic ? `تاريخ التصدير: ${new Date().toLocaleDateString()}` : `Export Date: ${new Date().toLocaleDateString()}`]);
    csvRows.push([]); // empty line

    // --- Section 2: SUMMARY METRICS OF BUSINESS ---
    csvRows.push([isArabic ? "ملخص أداء المنصة المالي العام" : "GENERAL BUSINESS FINANCIAL SUMMARY"]);
    csvRows.push([
      isArabic ? "إجمالي صافي أرباح المؤسسة" : "Overall Net Platform Profits",
      isArabic ? "حصة خزينة الشركة" : "Company Reserve Box Share",
      isArabic ? "الحصيلة المتبقية للشركاء" : "Partners Pool Share",
      isArabic ? "رأس مال شركة بيراميدز الممول" : "Pyramids Corporate Capital Paid",
      isArabic ? "مجموع رأس مال الممولين المغذّى" : "Total Capital Invested by Partners",
      isArabic ? "إجمالي القيمة الرأسمالية للمشروع" : "Joined Enterprise Enterprise Capital"
    ]);
    csvRows.push([
      netBusinessProfit.toFixed(2),
      (netBusinessProfit * (companyShare / 100)).toFixed(2),
      (netBusinessProfit * (partnersPoolShare / 100)).toFixed(2),
      pyramidsCapital.toFixed(2),
      totalCapitalContributed.toFixed(2),
      (pyramidsCapital + totalCapitalContributed).toFixed(2)
    ]);
    csvRows.push([]); // empty line
    csvRows.push([]); // empty line

    // --- Section 3: PARTNERS PROFILES & EQUITIES ---
    csvRows.push([isArabic ? "كشف أرصدة وأنصبة الشركاء الحالية" : "STAKEHOLDERS EQUITY & ACTIVE BALANCE STATEMENTS"]);
    csvRows.push([
      isArabic ? "معرف الشريك" : "Partner ID",
      isArabic ? "الاسم العربي" : "Arabic Name",
      isArabic ? "الاسم الإنجليزي" : "English Name",
      isArabic ? "الهاتف" : "Phone",
      isArabic ? "نسبة الأرباح المتفق عليها" : "Contract Share Percent",
      isArabic ? "إجمالي المساهمات الرأسمالية" : "Total Capital Injections (EGP)",
      isArabic ? "عائدات الأرباح الحية المستحقة" : "Realtime Earned Yields (EGP)",
      isArabic ? "إجمالي السحوبات ومسحوبات الأرباح" : "Total Cash Withdrawals (EGP)",
      isArabic ? "الوضع والاتفاق الخاص للشريك" : "Agreement & Special Situation (Notes)",
      isArabic ? "الذمة المالية والأرصدة المستحقة" : "Net Ledger Outstanding Stake Value (EGP)"
    ]);

    partners.forEach((p) => {
      const calc = getPartnerBalancesAndCalculations(p);
      csvRows.push([
        p.id,
        p.nameAr,
        p.nameEn,
        p.phone || "-",
        `${p.sharePercent}%`,
        calc.totalInjections.toFixed(2),
        calc.earnedProfits.toFixed(2),
        calc.totalWithdrawals.toFixed(2),
        (isArabic ? p.contractNotesAr : p.contractNotesEn) || (isArabic ? "اتفاق قياسي" : "Standard Agreement"),
        calc.netCurrentStakeValue.toFixed(2)
      ]);
    });

    csvRows.push([]); // empty line
    csvRows.push([]); // empty line

    // --- Section 4: COMBINED LEDGER OF ALL TRANSACTIONS ---
    csvRows.push([isArabic ? "دفتر حركات وقيود الشركاء التاريخية بالتفصيل" : "CHRONOLOGICAL PARTNER TRANSACTION LEDGER JOURNAL"]);
    csvRows.push([
      isArabic ? "اسم الشريك" : "Partner Name",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "نوع الحركة" : "Transaction Type",
      isArabic ? "المقدار العيني (EGP)" : "Cash Flow EGP",
      isArabic ? "البيان بالعربية" : "Arabic Memo Description",
      isArabic ? "البيان بالإنجليزية" : "English Memo Description"
    ]);

    // Gather all transactions and sort by date descending
    const allTxs = partners.flatMap((p) =>
      p.transactions.map((t) => ({
        partnerName: isArabic ? p.nameAr : p.nameEn,
        ...t
      }))
    ).sort((a, b) => b.date.localeCompare(a.date));

    allTxs.forEach((row) => {
      csvRows.push([
        row.partnerName,
        row.date,
        row.type === "capital_inject" 
          ? (isArabic ? "حقوق تمويل ورأس مال" : "Capital Inject") 
          : (isArabic ? "مسحوبات أرباح" : "Dividend Withdraw"),
        `${row.type === "capital_inject" ? "+" : "-"}${row.amount}`,
        row.descriptionAr,
        row.descriptionEn
      ]);
    });

    // Custom download generator for multiple segments in one CSV
    try {
      const csvContent = "\uFEFF" + csvRows.map(line => line.map(val => {
        const cleanVal = String(val ?? "").replace(/"/g, '""');
        return `"${cleanVal}"`;
      }).join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = isArabic ? "كشف_حسابات_الشركاء_التفصيلي_الكامل" : "pyramids_partners_complete_ledger_report";
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert(isArabic ? "تم تصدير سجل الشركاء والحسابات الكامل بنجاح!" : "Complete partners accounts ledger successfully exported to Excel (CSV)!");
    } catch (error) {
      console.error("Failed to generate partners complete ledger CSV", error);
    }
  };

  // SECURITY GATE VIEWPORTS
  if (!isUnlocked) {
    return (
      <div className="bg-[#0b1321] border border-slate-850 rounded-2xl p-8 sm:p-14 text-center max-w-xl mx-auto my-12 shadow-2xl flex flex-col items-center animate-fade-in" id="partners-unlocked-guard">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-md shadow-slate-950">
          <Lock className="w-7 h-7 text-amber-500" />
        </div>
        
        <h2 className="text-base font-black text-slate-100 mb-3 leading-none flex items-center gap-1.5 justify-center">
          <span>{t.securityTitle}</span>
        </h2>
        
        <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-md mx-auto">
          {t.securityDesc}
        </p>

        <form onSubmit={handleVerifyPasscode} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Key className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="password"
              placeholder={isArabic ? "أدخل كود المرور الخاص بالشركاء لمنع الدخول غير المصرح" : "Enter confidential partner passcode to unlock"}
              value={securityCodeInput}
              onChange={(e) => {
                setSecurityCodeInput(e.target.value);
                setSecurityError(false);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-center text-white text-xs skeleton-glow outline-none focus:border-amber-500 tracking-widest font-mono uppercase font-black"
              autoFocus
            />
          </div>

          {securityError && (
            <p className="text-xs font-bold text-rose-400 bg-rose-950/20 border border-rose-500/20 px-3 py-1.5 rounded-lg animate-shake">
              {t.wrongCode}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
          >
            <ShieldAlert className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>{t.unlockBtn}</span>
          </button>
        </form>
      </div>
    );
  }

  // ACTIVE UNLOCKED DASHBOARD VIEWPORT
  return (
    <div className="space-y-6" id="partners-management-division-active">
      {/* HEADER SECTION */}
      <div className="bg-slate-950 border border-slate-850 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5 mb-1">
              <span>{t.tabTitle}</span>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded font-mono">CONFIDENTIAL</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {isArabic 
                ? "إدارة أنصبة حقوق الملكية للشركاء وعائدات شركة بيراميدز وربط مساهمات الكاش وصافي الأرباح." 
                : "Manage equity weight allocations, capital contributions, pyramids corporate yields, and net shares."}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportPartnersExcel}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{t.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* RATIOS CONFIGURATION METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* CONTRACT STAKE RATIOS CARD - 5 COLS */}
        <div className="md:col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <span className="text-xs font-black text-slate-200 uppercase flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-amber-500" />
                <span>{isArabic ? "بنود عقد توزيع النسب المئوية للمكاسب والتمويل" : "Customizable Percentage Ratios Settings"}</span>
              </span>
            </div>

            {isEditingRatios ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.companyRatioText}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempCompanyShare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTempCompanyShare(val);
                        setTempPartnersShare(100 - val);
                      }}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono text-xs font-bold text-slate-100 w-12 text-center">{tempCompanyShare}%</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.partnersPoolText}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempPartnersShare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTempPartnersShare(val);
                        setTempCompanyShare(100 - val);
                      }}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono text-xs font-bold text-slate-100 w-12 text-center">{tempPartnersShare}%</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg text-[10.5px] flex justify-between text-slate-400">
                  <span>{t.distTotal}:</span>
                  <span className={`font-mono font-bold ${tempCompanyShare + tempPartnersShare === 100 ? "text-emerald-400" : "text-rose-400"}`}>
                    {tempCompanyShare + tempPartnersShare}% / 100%
                  </span>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsEditingRatios(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 text-[11px] rounded font-bold cursor-pointer transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveRatios}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 text-[11px] font-black rounded cursor-pointer hover:bg-amber-450 transition-colors"
                  >
                    {t.saveRatios}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-500 block font-bold mb-1">{t.companyRatioText}</span>
                    <span className="text-xl font-mono text-amber-500 font-black">{companyShare}%</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-500 block font-bold mb-1">{t.partnersPoolText}</span>
                    <span className="text-xl font-mono text-blue-400 font-black">{partnersPoolShare}%</span>
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-500 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850">
                  {isArabic 
                    ? `تضمن المعادلة توزيع صافي الأرباح الجارية للمنصة بنظام المحاصة. نسبة المؤسسة هي الأغلبية (${companyShare}%) وتتشارك بقية الحصص والأنصبة بين الممولين تحت مظلة الـ ${partnersPoolShare}% المتفق عليها.` 
                    : `Corporate equity reserves are split in the ratio of ${companyShare}/${partnersPoolShare}. Pyramids Gold remains the primary general stakeholder, with the remaining stake of ${partnersPoolShare}% distributed to investments.`}
                </div>

                <button
                  onClick={() => {
                    setTempCompanyShare(companyShare);
                    setTempPartnersShare(partnersPoolShare);
                    setIsEditingRatios(true);
                  }}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-850 text-amber-500 hover:text-amber-450 border border-slate-800 hover:border-slate-700 transition-colors font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>{t.editRatios}</span>
                </button>
              </div>
            )}

            {/* Pyramids Capital (Mawda' / Cost paid by Pyramids) block */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
              <span className="text-[11px] font-black text-slate-350 uppercase flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-505 shrink-0" />
                <span>{isArabic ? "الحساب الرأسمالي لمؤسسة بيراميدز (وقابل للزيادة)" : "Pyramids Corporate Capital Fund"}</span>
              </span>

              {isEditingPyramidsCapital ? (
                <form onSubmit={handleSavePyramidsCapital} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {isArabic ? "رأس المال الحالي المدفوع (ج.م) *" : "Paid Up Capital (EGP) *"}
                    </label>
                    <input
                      type="number"
                      required
                      value={tempPyramidsCapital}
                      onChange={(e) => setTempPyramidsCapital(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs outline-none focus:border-amber-500"
                    />
                    <span className="text-[9px] text-slate-500 block leading-normal mt-1">
                      {t.pyramidsCapitalHelp}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingPyramidsCapital(false)}
                      className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10.5px] rounded font-bold cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-450 text-slate-950 text-[10.5px] font-black rounded cursor-pointer"
                    >
                      {t.saveCapital}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">
                        {t.pyramidsCapitalLabel}
                      </span>
                      <span className="text-sm font-mono font-black text-amber-500">
                        {formatCurrency(pyramidsCapital, isArabic)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPyramidsCapital(pyramidsCapital.toString());
                        setIsEditingPyramidsCapital(true);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors"
                      title={isArabic ? "تعديل و زيادة رأس المال" : "Update capital contribution"}
                    >
                      ⚙️ {isArabic ? "تعديل" : "Edit"}
                    </button>
                  </div>
                  <p className="text-[9.5px] text-slate-500 italic mt-1 leading-normal" dir="auto">
                    💡 {t.pyramidsCapitalHelp}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FINANCIAL PERFORMANCE MATRIX COMPILATION - 7 COLS */}
        <div className="md:col-span-12 lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <span className="text-xs font-black text-slate-200 uppercase flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{t.metricsTitle}</span>
              </span>
              <span className="text-[10px] text-slate-450 font-bold">{isArabic ? "حسابات دورية حية" : "Live dynamic calculations"}</span>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">{t.overallNetProfit}</span>
                <span className={`text-base font-mono font-black ${netBusinessProfit >= 0 ? "text-emerald-450" : "text-rose-400"}`}>
                  {formatCurrency(netBusinessProfit, isArabic)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2 py-1 rounded font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>EGP LIVE BALANCE</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9.5px] text-slate-550 block font-bold mb-1">{t.compYield} ({companyShare}%):</span>
                <span className="font-mono text-sm font-black text-amber-500 block">
                  {formatCurrency(netBusinessProfit * (companyShare / 100), isArabic)}
                </span>
              </div>
              <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9.5px] text-slate-550 block font-bold mb-1">{t.partYield} ({partnersPoolShare}%):</span>
                <span className="font-mono text-sm font-black text-blue-400 block">
                  {formatCurrency(netBusinessProfit * (partnersPoolShare / 100), isArabic)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <span className="text-[9px] text-slate-500 font-bold block mb-0.5">
                {isArabic ? "رأس مال شركة بيراميدز:" : "Pyramids Corporate Capital:"}
              </span>
              <span className="text-xs font-mono font-black text-amber-500">
                {formatCurrency(pyramidsCapital, isArabic)}
              </span>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <span className="text-[9px] text-slate-500 font-bold block mb-0.5">
                {isArabic ? "مجموع تمويلات الشركاء:" : "Total Partners Capital:"}
              </span>
              <span className="text-xs font-mono font-black text-blue-400">
                {formatCurrency(totalCapitalContributed, isArabic)}
              </span>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 col-span-1 sm:col-span-1">
              <span className="text-[9px] text-slate-500 font-bold block mb-0.5">
                {isArabic ? "إجمالي رأس المال الشامل:" : "Enterprise Capitalization:"}
              </span>
              <span className="text-xs font-mono font-black text-emerald-400">
                {formatCurrency(pyramidsCapital + totalCapitalContributed, isArabic)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* RATIO INTEGRITY ALERT */}
      {totalPartnersAllocatedShare > partnersPoolShare && (
        <div className="bg-rose-500/5 border border-rose-500/10 p-3 sm:p-4 rounded-xl flex items-start gap-2 text-[11px] text-rose-400">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{t.ratioAlertWarning}</span>
        </div>
      )}

      {/* CUMULATIVE PARTNERS PROFIT & LOSS ALLOCATION & TREASURY CASH COVERAGE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-5 space-y-4">
        <div className="flex border-b border-slate-850 pb-3 justify-between items-center">
          <div>
            <h3 className="text-xs font-black text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{isArabic ? "جدول توزيع الأرباح التراكمي وتغطية السيولة في الخزنة" : "Cumulative P&L Allocation & Vault Liquidity Matrix"}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold leading-normal mt-0.5" dir="auto">
              {isArabic 
                ? "مقارنة دقيقة توضح نصيب كل طرف من الأرباح المحققة مقابل مسحوباته، ومقدار غطائه النقدي الفعلي من سيولة الخزنة الجارية."
                : "A granular snapshot of each stakeholder's accumulated profits vs withdrawals, and their proportional coverage of live physical treasury liquidity."}
            </p>
          </div>
          <span className="text-[9px] font-mono font-extrabold bg-slate-950 p-1.5 rounded-lg border border-slate-850 text-slate-400">
            {isArabic ? "مُحدث آنياً" : "REAL-TIME MATRIX"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-950/70 text-[10px] text-slate-500 font-extrabold uppercase border-b border-slate-850">
                <th className="py-2.5 px-3 text-right">{isArabic ? "الطرف / الشريك" : "Stakeholder / Partner"}</th>
                <th className="py-2.5 px-3 text-center">{isArabic ? "النسبة %" : "Stake %"}</th>
                <th className="py-2.5 px-3 text-center">{isArabic ? "رأس المال المودع" : "Injected Capital"}</th>
                <th className="py-2.5 px-3 text-center">{isArabic ? "الأرباح التراكمية" : "Accrued P&L"}</th>
                <th className="py-2.5 px-3 text-center">{isArabic ? "المسحوبات المحسوبة" : "Dividends Drawn"}</th>
                <th className="py-2.5 px-3 text-center">{isArabic ? "صافي المستحقات" : "Net Unpaid Dues"}</th>
                <th className="py-2.5 px-3 text-left">{isArabic ? "نصيب السيولة بالخزنة" : "Proportional Vault Cash"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 font-mono text-slate-300">
              {summaryRows.map((row) => {
                const hasDues = row.netDues > 0;
                // Calculate liquidity coverage of dues if they are positive
                const coveragePercent = hasDues
                  ? (privateWalletBalance >= row.netDues ? 100 : Math.max(0, Math.round((privateWalletBalance / row.netDues) * 100)))
                  : 100;

                return (
                  <tr key={row.id} className={`hover:bg-slate-950/30 transition-colors ${row.type === 'company' ? 'bg-amber-500/[0.01]' : ''}`}>
                    <td className="py-3 px-3 font-sans font-bold text-slate-100 text-right">
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className={`w-1.5 h-1.5 rounded-full ${row.type === 'company' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                        <span>{isArabic ? row.nameAr : row.nameEn}</span>
                        {row.type === 'company' && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black border border-amber-500/20">
                            {isArabic ? "المحفظة الأم" : "OPERATIONAL"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-extrabold">{row.sharePercent}%</td>
                    <td className="py-3 px-3 text-center text-slate-200">{formatCurrency(row.capital, isArabic)}</td>
                    <td className={`py-3 px-3 text-center font-bold ${row.earnedProfits >= 0 ? "text-emerald-450" : "text-rose-455"}`}>
                      {row.earnedProfits >= 0 ? "+" : ""}{formatCurrency(row.earnedProfits, isArabic)}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-450">{formatCurrency(row.withdrawals, isArabic)}</td>
                    <td className={`py-3 px-3 text-center font-black ${row.netDues >= 0 ? "text-emerald-450" : "text-rose-400"}`}>
                      {formatCurrency(row.netDues, isArabic)}
                    </td>
                    <td className="py-3 px-3 text-left">
                      <div className="flex flex-col items-start gap-1 justify-end">
                        <span className="text-blue-400 font-black text-[12.5px]">
                          {formatCurrency(row.vaultCashShare, isArabic)}
                        </span>
                        {row.netDues > 0 && (
                          <span className={`text-[8.5px] font-sans px-1.5 py-0.5 rounded-md font-extrabold border ${
                            coveragePercent >= 100 
                              ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/15" 
                              : coveragePercent > 50 
                              ? "bg-amber-500/5 text-amber-400 border-amber-500/15" 
                              : "bg-rose-500/5 text-rose-400 border-rose-500/15"
                          }`}>
                            {isArabic 
                              ? `تغطية سيولة الخزنة للأرباح: ${coveragePercent}%`
                              : `Vault payout coverage: ${coveragePercent}%`}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Aggregated Totals row representation */}
              <tr className="bg-slate-950/50 border-t-2 border-slate-800 text-[11px] font-black">
                <td className="py-3 px-3 font-sans font-black text-slate-200 text-right">
                  {isArabic ? "مجموع الميزانية الشاملة للشركاء" : "Enterprise Aggregates / Totals"}
                </td>
                <td className="py-3 px-3 text-center text-slate-400">{companyShare + totalPartnersAllocatedShare}%</td>
                <td className="py-3 px-3 text-center text-blue-400">{formatCurrency(totalSummaryCapital, isArabic)}</td>
                <td className={`py-3 px-3 text-center font-black ${totalSummaryEarnedProfits >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {totalSummaryEarnedProfits >= 0 ? "+" : ""}{formatCurrency(totalSummaryEarnedProfits, isArabic)}
                </td>
                <td className="py-3 px-3 text-center text-rose-400">{formatCurrency(totalSummaryWithdrawals, isArabic)}</td>
                <td className={`py-3 px-3 text-center font-black ${totalSummaryNetDues >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCurrency(totalSummaryNetDues, isArabic)}
                </td>
                <td className="py-3 px-3 text-left text-blue-400 text-sm">
                  <div className="flex flex-col items-start">
                    <span className="font-extrabold">{formatCurrency(totalSummaryVaultCash, isArabic)}</span>
                    <span className="text-[8px] font-sans text-slate-500 uppercase tracking-widest">{isArabic ? "رصيد الذهب والسيولة الموحد" : "Total Shop Liquid reserves"}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 text-[10px] text-slate-400 space-y-1" dir="auto">
          <p className="flex items-center gap-1.5 leading-relaxed text-slate-400">
            <span className="text-amber-500">💡</span>
            <span>
              {isArabic
                ? "توضيح محاسبي: يتم احتساب الأرباح التراكمية بناءً على نسبة حصة كل شريك من إجمالي أرباح المحل القائمة بالتسييل (Tahyeef Balanced). غطاء الخزنة يمثل نصيبهم في المتوفر نقداً في الخزانة الآن لتسهيل عمليات التوزيع."
                : "Accounting Note: Accrued P&L values are updated on-the-fly dynamically based on each partner's configured profit share ratio. Proportional liquidity displays their fractional claim on the real-time physical vault cash."}
            </span>
          </p>
        </div>
      </div>

      {/* PARTNERS DETAILED LIST SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-950 p-4 border border-slate-850 rounded-2xl">
          <div>
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span>{t.partnerListTitle}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold">
              {isArabic 
                ? `مجموع نسب الممولين الموزعة حالياً: ${totalPartnersAllocatedShare}% متبقي متاح للتوزيع: ${(partnersPoolShare - totalPartnersAllocatedShare).toFixed(1)}%` 
                : `Total allocated partner stakes: ${totalPartnersAllocatedShare}%. Stake residual to deploy: ${(partnersPoolShare - totalPartnersAllocatedShare).toFixed(1)}%`}
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-amber-500/10"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.addPartner}</span>
          </button>
        </div>

        {/* PARTNERS CARDS GRID */}
        {partners.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl text-slate-555 text-xs">
            {t.noPartners}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((p) => {
              const calc = getPartnerBalancesAndCalculations(p);
              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between space-y-4">
                  {/* Name and Phone */}
                  <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 leading-tight mb-1">
                        <Users className="w-4 h-4 text-amber-505 shrink-0" />
                        <span>{isArabic ? p.nameAr : p.nameEn}</span>
                      </h4>
                      {p.phone && <span className="text-[10px] font-mono text-slate-450 tracking-wider block">{p.phone}</span>}
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEditPartnerModal(p)}
                        className="text-slate-500 hover:text-amber-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title={isArabic ? "تعديل عقد الشريك" : "Edit Partner agreement"}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(p.id, isArabic ? p.nameAr : p.nameEn)}
                        className="text-slate-505 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title={t.deletePartnerTitle}
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Special Situation/Agreement Description */}
                  {(p.contractNotesAr || p.contractNotesEn) && (
                    <div className="bg-slate-950/45 border border-slate-800/80 p-3 rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <span>📌 {isArabic ? "وضع الاتفاق الخاص للشراكة:" : "Special Agreement & Status Setup:"}</span>
                      </span>
                      <p className="text-slate-350 leading-relaxed italic px-2 border-r border-amber-500/20" dir="auto">
                        {isArabic ? p.contractNotesAr : p.contractNotesEn}
                      </p>
                    </div>
                  )}

                  {/* Calculations Details Block */}
                  <div className="space-y-2 text-xs bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                    <div className="flex justify-between">
                      <span className="text-slate-450 text-[10.5px] font-bold">{t.shareRatioLabel}</span>
                      <span className="font-mono font-black text-amber-500">{p.sharePercent}% {isArabic ? "من الأرباح" : "of profit"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 text-[10.5px] font-bold">{t.capitalInvestedLabel}</span>
                      <span className="font-mono text-slate-200 font-bold">{formatCurrency(p.capitalContributed, isArabic)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/60 pt-1.5 mt-1.5">
                      <span className="text-slate-450 text-[10.5px] font-bold">{t.earnedProfitsLabel}</span>
                      <span className="font-mono text-emerald-400 font-bold">+{formatCurrency(calc.earnedProfits, isArabic)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 text-[10.5px] font-bold">{t.withdrawalsLabel}</span>
                      <span className="font-mono text-rose-400 font-bold">-{formatCurrency(calc.totalWithdrawals, isArabic)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
                      <span className="text-slate-200 text-[11px] font-black">{t.netSafeBalance}</span>
                      <span className={`font-mono text-sm font-black ${calc.netCurrentStakeValue >= 0 ? "text-emerald-450" : "text-rose-400"}`}>
                        {formatCurrency(calc.netCurrentStakeValue, isArabic)}
                      </span>
                    </div>
                  </div>

                  {/* Action Block buttons */}
                  <button
                    onClick={() => handleOpenTxModal(p)}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-850 text-blue-400 hover:text-blue-300 border border-slate-850 hover:border-slate-750 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{t.addTxBtn}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMBINED PARTNERS TRANSACTIONS LEDGER HISTORICAL LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>{t.statementTitle}</span>
          </h3>
          <span className="text-[10px] bg-slate-850 text-amber-400 px-2.5 py-0.5 rounded-lg font-mono font-bold">
            {partners.reduce((sum, p) => sum + p.transactions.length, 0)} {isArabic ? "حركة مقيدة" : "entries logged"}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          {partners.reduce((sum, p) => sum + p.transactions.length, 0) === 0 ? (
            <div className="p-8 text-center text-slate-555 text-xs">
              {isArabic ? "لا توجد أي حركات تمويل أو سحب مسجلة للشركاء." : "No partner transactions mapped yet."}
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-805">
                <tr>
                  <th className="p-3 text-right">{t.overallNetProfit.replace(":", "")}</th>
                  <th className="p-3">{isArabic ? "الشريك المالي" : "Stakeholder Name"}</th>
                  <th className="p-3 text-center">{t.date}</th>
                  <th className="p-3 text-center">{isArabic ? "النوع" : "Ledger Type"}</th>
                  <th className="p-3 text-right">{isArabic ? "البيان والحركة" : "Memo Statement Detail"}</th>
                  <th className="p-3 text-center">{isArabic ? "مقدار الكاش" : "EGP Cash Amount"}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {partners.flatMap((p) =>
                  p.transactions.map((tx) => ({
                    partnerId: p.id,
                    partnerNameAr: p.nameAr,
                    partnerNameEn: p.nameEn,
                    ...tx
                  }))
                )
                .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
                .map((row) => (
                  <tr key={row.id} className="hover:bg-slate-850/40 text-[11px]">
                    <td className="p-3 font-mono text-slate-500 text-[10px] font-bold">
                      {isArabic ? "رصيد محاسبي" : "Indexed row"}
                    </td>
                    <td className="p-3 font-bold text-slate-100 whitespace-nowrap">
                      {isArabic ? row.partnerNameAr : row.partnerNameEn}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-400 whitespace-nowrap">{row.date}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.type === "capital_inject" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                      }`}>
                        {row.type === "capital_inject"
                          ? (isArabic ? "حقوق تمويل ورأس مال" : "Capital Inject")
                          : (isArabic ? "مسحوبات أرباح" : "Dividend withdraw")}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-350 max-w-xs truncate" title={isArabic ? row.descriptionAr : row.descriptionEn}>
                      {isArabic ? row.descriptionAr : row.descriptionEn}
                    </td>
                    <td className="p-3 text-center font-mono font-black text-slate-100">
                      <span className={row.type === "capital_inject" ? "text-emerald-400" : "text-rose-400"}>
                        {row.type === "capital_inject" ? "+" : "-"}
                        {formatCurrency(row.amount, isArabic)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteTx(row.partnerId, row.id)}
                        className="text-slate-500 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {(() => {
                const allTxs = partners.flatMap((p) =>
                  p.transactions.map((tx) => ({
                    partnerId: p.id,
                    ...tx
                  }))
                );
                const totalInjected = allTxs
                  .filter((tx) => tx.type === "capital_inject")
                  .reduce((sum, tx) => sum + tx.amount, 0);
                const totalWithdrawn = allTxs
                  .filter((tx) => tx.type === "dividend_withdraw")
                  .reduce((sum, tx) => sum + tx.amount, 0);
                const netCashDelta = totalInjected - totalWithdrawn;
                return (
                  <tfoot className="bg-slate-950 font-bold text-slate-200 border-t border-slate-800 text-center text-[11px]">
                    <tr>
                      <td className="p-3 font-sans text-right">{isArabic ? "المجموع الشامل" : "Grand Total"}</td>
                      <td className="p-3 font-sans text-right">({allTxs.length} {isArabic ? "عملية" : "lines"})</td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3 text-right">
                        <span className="text-slate-400">
                          {isArabic 
                            ? `تمويل: +${formatCurrency(totalInjected, isArabic)} / سحب: -${formatCurrency(totalWithdrawn, isArabic)}` 
                            : `Inject: +${formatCurrency(totalInjected, isArabic)} / Drawn: -${formatCurrency(totalWithdrawn, isArabic)}`}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className={netCashDelta >= 0 ? "text-emerald-400" : "text-rose-450"}>
                          {netCashDelta >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(netCashDelta), isArabic)}
                        </span>
                      </td>
                      <td className="p-3"></td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD COHORT PARTNER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <form
            onSubmit={handleAddPartner}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden animate-fade-in"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                <UserPlus className="w-5 h-5" />
                <span>{t.addPartner}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.nameArPlaceholder}</label>
                <input
                  type="text"
                  required
                  value={newPartnerNameAr}
                  onChange={(e) => setNewPartnerNameAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.nameEnPlaceholder}</label>
                <input
                  type="text"
                  required
                  value={newPartnerNameEn}
                  onChange={(e) => setNewPartnerNameEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.phoneLabel}</label>
                <input
                  type="text"
                  value={newPartnerPhone}
                  onChange={(e) => setNewPartnerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10.2px] text-slate-400 font-bold block mb-1">{t.shareLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPartnerShare}
                    onChange={(e) => setNewPartnerShare(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs font-mono outline-none focus:border-amber-500"
                    placeholder="e.g. 10.5"
                  />
                  <span className="text-[9.5px] text-slate-500 block">من إجمالي {partnersPoolShare}% المستهدف</span>
                </div>

                <div>
                  <label className="text-[10.2px] text-slate-400 font-bold block mb-1">{t.capitalLabel}</label>
                  <input
                    type="number"
                    required
                    value={newPartnerCapital}
                    onChange={(e) => setNewPartnerCapital(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs font-mono outline-none focus:border-amber-500"
                    placeholder="e.g. 500000"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.contractNotesArLabel}</label>
                <textarea
                  value={newPartnerNotesAr}
                  onChange={(e) => setNewPartnerNotesAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                  placeholder={t.contractNotesPlaceholderAr}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.contractNotesEnLabel}</label>
                <textarea
                  value={newPartnerNotesEn}
                  onChange={(e) => setNewPartnerNotesEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                  placeholder={t.contractNotesPlaceholderEn}
                  rows={2}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 bg-slate-850 text-slate-350 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black rounded-lg"
              >
                {t.submitPartner}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT COHORT PARTNER MODAL */}
      {showEditPartnerModal && selectedPartnerForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <form
            onSubmit={handleSaveEditPartner}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden animate-fade-in"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                <Settings2 className="w-5 h-5 text-amber-500" />
                <span>{t.editPartnerTitle}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowEditPartnerModal(false);
                  setSelectedPartnerForEdit(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.nameArPlaceholder}</label>
                <input
                  type="text"
                  required
                  value={editPartnerNameAr}
                  onChange={(e) => setEditPartnerNameAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.nameEnPlaceholder}</label>
                <input
                  type="text"
                  required
                  value={editPartnerNameEn}
                  onChange={(e) => setEditPartnerNameEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.phoneLabel}</label>
                <input
                  type="text"
                  value={editPartnerPhone}
                  onChange={(e) => setEditPartnerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.shareLabel}</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editPartnerShare}
                  onChange={(e) => setEditPartnerShare(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs font-mono outline-none focus:border-amber-500"
                  placeholder="e.g. 10.5"
                />
                <span className="text-[9.5px] text-slate-500 block">
                  {isArabic 
                    ? `مجموع نسب بقية الشركاء: ${(partners.filter(p => p.id !== selectedPartnerForEdit.id).reduce((sum, p) => sum + p.sharePercent, 0)).toFixed(1)}% من المظلة الإجمالية ${partnersPoolShare}%`
                    : `Active shares of other partners: ${(partners.filter(p => p.id !== selectedPartnerForEdit.id).reduce((sum, p) => sum + p.sharePercent, 0)).toFixed(1)}% of total pool ${partnersPoolShare}%`}
                </span>
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.contractNotesArLabel}</label>
                <textarea
                  value={editPartnerNotesAr}
                  onChange={(e) => setEditPartnerNotesAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                  placeholder={t.contractNotesPlaceholderAr}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.contractNotesEnLabel}</label>
                <textarea
                  value={editPartnerNotesEn}
                  onChange={(e) => setEditPartnerNotesEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                  placeholder={t.contractNotesPlaceholderEn}
                  rows={2}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowEditPartnerModal(false);
                  setSelectedPartnerForEdit(null);
                }}
                className="px-3 py-2 bg-slate-850 text-slate-350 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black rounded-lg"
              >
                {t.saveChanges}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: LOG PARTNER TRANSACTION */}
      {showTxModal && selectedPartnerForTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <form
            onSubmit={handlePostPartnerTx}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden animate-fade-in"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-emerald-400" />
                <span>{t.txModalTitle} {isArabic ? selectedPartnerForTx.nameAr : selectedPartnerForTx.nameEn}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowTxModal(false);
                  setSelectedPartnerForTx(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.txTypeLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType("dividend_withdraw");
                      setTxDescAr(isArabic ? "سحب دفعة من حصة الأرباح الدورية" : "Dividend withdrawal drawdown EGP");
                      setTxDescEn("Periodic dividend cash withdrawal");
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      txType === "dividend_withdraw"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-450"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 mx-auto mb-1 text-rose-500" />
                    <span>{t.dividendWithdrawOption}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType("capital_inject");
                      setTxDescAr(isArabic ? "إيداع كاش تمويلي لزيادة حصة رأس المال" : "Additional capital injection deposit");
                      setTxDescEn("Stake support capital injection deposit");
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      txType === "capital_inject"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-405"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 mx-auto mb-1 text-emerald-450" />
                    <span>{t.capitalInjectOption}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.amountInputLabel}</label>
                <input
                  type="number"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs font-mono outline-none focus:border-amber-500"
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.descArInput}</label>
                <input
                  type="text"
                  required
                  value={txDescAr}
                  onChange={(e) => setTxDescAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-400 font-bold block mb-1">{t.descEnInput}</label>
                <input
                  type="text"
                  required
                  value={txDescEn}
                  onChange={(e) => setTxDescEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.0 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowTxModal(false);
                  setSelectedPartnerForTx(null);
                }}
                className="px-3 py-2 bg-slate-850 text-slate-350 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black rounded-lg"
              >
                {t.submitTx}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
