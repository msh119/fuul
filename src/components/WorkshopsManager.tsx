/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Building2,
  Trash2,
  User,
  Calendar,
  Scale,
  DollarSign,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  UserCheck,
  Search,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  X,
  TrendingDown,
  TrendingUp,
  Info
} from "lucide-react";
import { Workshop, WorkshopTransaction, Dealer } from "../types";
import { formatCurrency, formatWeight, getMillesimalKarat, calculateEquivalentWeight, downloadCSV } from "../utils";

interface WorkshopsManagerProps {
  workshops: Workshop[];
  workshopTransactions: WorkshopTransaction[];
  dealers: Dealer[];
  isArabic: boolean;
  onAddWorkshop: (ws: Workshop) => void;
  onDeleteWorkshop: (id: string) => void;
  onAddWorkshopTransaction: (tx: WorkshopTransaction) => void;
  onDeleteWorkshopTransaction: (id: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showAlert: (message: string) => void;
}

export default function WorkshopsManager({
  workshops,
  workshopTransactions,
  dealers,
  isArabic,
  onAddWorkshop,
  onDeleteWorkshop,
  onAddWorkshopTransaction,
  onDeleteWorkshopTransaction,
  showConfirm,
  showAlert,
}: WorkshopsManagerProps) {
  // Navigation inside workshop view: List vs Selected
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(
    workshops.length > 0 ? workshops[0].id : null
  );

  // Workshop Creation Form State
  const [wsNameAr, setWsNameAr] = useState("");
  const [wsNameEn, setWsNameEn] = useState("");
  const [wsManagerAr, setWsManagerAr] = useState("");
  const [wsManagerEn, setWsManagerEn] = useState("");
  const [wsPhone, setWsPhone] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Direct cash/gold adjustment states
  const [adjustType, setAdjustType] = useState<"cash" | "gold">("cash");
  const [adjustDirection, setAdjustDirection] = useState<"deposit" | "withdraw">("deposit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustKarat, setAdjustKarat] = useState("21");
  const [adjustDescAr, setAdjustDescAr] = useState("");
  const [adjustDescEn, setAdjustDescEn] = useState("");

  // Workshop Purchase (Client Gold Buy) Form State
  const [custName, setCustName] = useState("");
  const [pWeight, setPWeight] = useState("");
  const [pKarat, setPKarat] = useState("875"); // default 21k
  const [pPrice21, setPPrice21] = useState("6150");
  const [pAssayFee, setPAssayFee] = useState("150");

  // Workshop Sale (Sell Gold to Dealer) Form State
  const [sDealerId, setSDealerId] = useState(dealers.length > 0 ? dealers[0].id : "");
  const [sWeight, setSWeight] = useState("");
  const [sKarat, setSKarat] = useState("875"); // default 21k
  const [sPrice21, setSPrice21] = useState("6170");

  // Filter & Search ledger inside selected workshop page
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTxType, setFilterTxType] = useState("all");

  // Synchronize selectedWorkshopId if workshops list changes
  useEffect(() => {
    if (workshops.length > 0) {
      const exists = workshops.some((w) => w.id === selectedWorkshopId);
      if (!exists) {
        setSelectedWorkshopId(workshops[0].id);
      }
    } else {
      setSelectedWorkshopId(null);
    }
  }, [workshops, selectedWorkshopId]);

  // Synchronize sDealerId if dealers list changes
  useEffect(() => {
    if (dealers.length > 0) {
      const exists = dealers.some((dl) => dl.id === sDealerId);
      if (!exists) {
        setSDealerId(dealers[0].id);
      }
    } else {
      setSDealerId("");
    }
  }, [dealers, sDealerId]);

  const activeWorkshop = workshops.find((w) => w.id === selectedWorkshopId);

  // 1. Calculations specific to selected workshop
  const selectedWsTransactions = workshopTransactions.filter(
    (tx) => tx.workshopId === selectedWorkshopId
  );

  // Calculate Safes Balances for selected workshop
  // Financial Safe: cumulative cashAmount
  const hashCashSafe = selectedWsTransactions.reduce((acc, tx) => acc + tx.cashAmount, 0);

  // Golden Safe (Actual Weight): purchases, gold_deposits(+) vs sales, gold_withdrawals(-)
  const hashGoldActualWeight = selectedWsTransactions.reduce((acc, tx) => {
    if (tx.type === "purchase" || tx.type === "gold_deposit") {
      return acc + tx.actualWeight;
    } else if (tx.type === "sale" || tx.type === "gold_withdrawal") {
      return acc - tx.actualWeight;
    }
    return acc;
  }, 0);

  // Golden Safe (Equivalent weight 21):
  const hashGoldEquivWeight21 = selectedWsTransactions.reduce((acc, tx) => {
    if (tx.type === "purchase" || tx.type === "gold_deposit") {
      return acc + tx.equivalentWeight21;
    } else if (tx.type === "sale" || tx.type === "gold_withdrawal") {
      return acc - tx.equivalentWeight21;
    }
    return acc;
  }, 0);

  // Labels dictionary
  const dictionary = {
    title: isArabic ? "إدارة أقسام حسابات الورش والمسابك" : "Workshops & Refineries Accountancy Module",
    subtitle: isArabic ? "حسابات مستقلة وخزائن نقدية وعينية منفصلة لكل ورشة" : "Independent Cash and Gold Safes per Foundry Contractor",
    addWsBtn: isArabic ? "تسجيل ورشة / مسبك جديد" : "Register New Workshop",
    wsNameAr: isArabic ? "اسم الورشة (بالعربية) *" : "Workshop Name (Arabic) *",
    wsNameEn: isArabic ? "اسم الورشة (بالإنجليزية) *" : "Workshop Name (English) *",
    wsManagerAr: isArabic ? "أمين الورشة / المدير (بالعربية)" : "Manager Name (Arabic)",
    wsManagerEn: isArabic ? "أمين الورشة / المدير (بالإنجليزية)" : "Manager Name (English)",
    wsPhone: isArabic ? "رقم الجوال للورشة" : "Workshop Phone",
    saveWs: isArabic ? "إضافة الورشة وتأسيس الخزائن" : "Initialize Workshop Profiles",
    noWorkshops: isArabic ? "لا توجد ورش مسجلة بالنظام حالياً." : "No workshops registered in the system yet.",
    activeWsLabel: isArabic ? "الورشة النشطة حالياً:" : "Selected Workshop Profile:",
    manager: isArabic ? "المدير المسؤول:" : "Manager in charge:",
    phone: isArabic ? "هاتف الاتصال:" : "Contact Phone:",
    cashSafe: isArabic ? "الخزينة المالية للورشة" : "Workshop Cash Safe Balance",
    goldSafeActual: isArabic ? "عهدة الذهب الخام بالورشة" : "Workshop Actual Gold Stock",
    goldSafeEquiv: isArabic ? "عهدة عيار 21 المعادل للورشة" : "Workshop Equivalent 21K Stock",
    directAdjustTitle: isArabic ? "تعديل رصيد الخزائن يدويًا (إيداع / سحب مباشر)" : "Direct Vault Modifications (Immediate cash/gold load)",
    pFormTitle: isArabic ? "شراء ذهب من عميل (لحساب الورشة)" : "Buy Gold from Customer (Workshop Payout)",
    sFormTitle: isArabic ? "بيع ذهب من الورشة لتاجر" : "Sell Workshop Gold to Dealer",
    custNameLabel: isArabic ? "اسم العميل المورد للذهب *" : "Client Forwarded *",
    custNamePlaceholder: isArabic ? "العميل المرسل من الورشة" : "Client sent by refinery",
    weightLabel: isArabic ? "الوزن الفعلي الحالي (جرام) *" : "Actual Weight (g) *",
    karatLabel: isArabic ? "العيار أو الششنة بالتيزاب *" : "Karat / Fineness *",
    karatPlaceholder: isArabic ? "عرب: 21 أو 875" : "e.g., 21 or 875",
    price21Label: isArabic ? "سعر غرام عيار 21 *" : "Grams Price of Karat 21 *",
    assayFeeLabel: isArabic ? "خصم رسم التحليل والششنة (ج.م)" : "Deduct Assay & Acid Fee (EGP)",
    dealerLabel: isArabic ? "اختر تاجر البيع المقاصاصي *" : "Select Dealer for Sale Offset *",
    registerTx: isArabic ? "قيد وتمرير القيد للورشة" : "Log Workshop Transaction",
    historyTitle: isArabic ? "دفتر حركة المعاملات الخاصة بالورشة والمسابك" : "Workshop Double-Entry Ledger Registers",
    searchPlaceholder: isArabic ? "ابحث بالبيان أو العميل أو رقم الحركة..." : "Search workshop ledger items...",
    downloadExcel: isArabic ? "تحميل الحركة كـ Excel" : "Export Workshop Ledger",
    deleteWsAlert: isArabic ? "هل أنت متأكد من مسح هذه الورشة؟ سيؤدي ذلك لمسح الورشة وحركاتها وصناديقها تماماً." : "Are you sure you want to delete this workshop? This will erase profiles and separate ledgers entirely.",
    deleteTxAlert: isArabic ? "هل أنت متأكد من حذف حركة الورشة المحددة؟ سيؤثر هذا على رصيد الخزائن." : "Confirm deleting this workshop transaction? Balance will re-calculate."
  };

  const handleCreateWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsNameAr || !wsNameEn) {
      showAlert(isArabic ? "برجاء توفير اسم الورشة بالعربية والإنجليزية" : "Please enter the workshop name in both Arabic and English.");
      return;
    }

    const newWs: Workshop = {
      id: "ws_" + Date.now(),
      nameAr: wsNameAr,
      nameEn: wsNameEn,
      managerAr: wsManagerAr || undefined,
      managerEn: wsManagerEn || undefined,
      phone: wsPhone || undefined,
    };

    onAddWorkshop(newWs);
    setSelectedWorkshopId(newWs.id);

    // Initial empty load alert
    setWsNameAr("");
    setWsNameEn("");
    setWsManagerAr("");
    setWsManagerEn("");
    setWsPhone("");
    setShowAddForm(false);
  };

  // Direct cash or gold adjustment (deposit / withdraw)
  const handleDirectAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshopId) return;
    const amountVal = Number(adjustAmount);
    if (!amountVal || amountVal <= 0) {
      showAlert(isArabic ? "برجاء توفير مقدار مالي أو عيني صحيح" : "Please provide a valid cash or gold amount.");
      return;
    }

    const dateStr = new Date().toISOString().split("T")[0];
    let equivalentWeight = 0;
    let actualWeightLocal = 0;
    let cashAmountLocal = 0;

    let dAr = adjustDescAr.trim();
    let dEn = adjustDescEn.trim();

    if (adjustType === "cash") {
      // Cash adjustment
      const sign = adjustDirection === "deposit" ? 1 : -1;
      cashAmountLocal = amountVal * sign;
      if (!dAr) dAr = adjustDirection === "deposit" ? "إيداع كاش يدوي للخزينة المالية" : "سحب كاش يدوياً من الخزينة المالية";
      if (!dEn) dEn = adjustDirection === "deposit" ? "Direct manual cash deposit" : "Direct manual cash withdrawal";
    } else {
      // Gold adjustment
      actualWeightLocal = amountVal;
      const detectedKaratNum = Number(adjustKarat) || 875;
      const millesimal = getMillesimalKarat(detectedKaratNum);
      equivalentWeight = Number(((millesimal / 875) * actualWeightLocal).toFixed(3));
      
      const parsedKaratText = adjustKarat;
      if (!dAr) dAr = adjustDirection === "deposit" ? `إيداع ذهب عيار ${parsedKaratText} بوزن ${actualWeightLocal}g عيناً` : `سحب ذهب عيار ${parsedKaratText} بوزن ${actualWeightLocal}g عيناً`;
      if (!dEn) dEn = adjustDirection === "deposit" ? `Manual gold deposit (${parsedKaratText}) weight ${actualWeightLocal}g` : `Manual gold withdrawal (${parsedKaratText}) weight ${actualWeightLocal}g`;
    }

    const finalKaratForTx = adjustType === "gold" 
      ? (Number(adjustKarat) || 875)
      : 0;

    const newTx: WorkshopTransaction = {
      id: "wst_" + Date.now(),
      workshopId: selectedWorkshopId,
      date: dateStr,
      type: adjustType === "cash" 
        ? (adjustDirection === "deposit" ? "cash_deposit" : "cash_withdrawal")
        : (adjustDirection === "deposit" ? "gold_deposit" : "gold_withdrawal"),
      actualWeight: actualWeightLocal,
      detectedKarat: finalKaratForTx,
      equivalentWeight21: equivalentWeight,
      price21: 0,
      goldValue: 0,
      assayFee: 0,
      brokerFee: 0,
      cashAmount: cashAmountLocal,
      descriptionAr: dAr,
      descriptionEn: dEn,
    };

    onAddWorkshopTransaction(newTx);
    
    // reset form
    setAdjustAmount("");
    setAdjustKarat("21");
    setAdjustDescAr("");
    setAdjustDescEn("");
    showAlert(isArabic ? "تم قيد حركة رصيد الخزينة بنجاح!" : "Special safe transactions successfully logged!");
  };

  // Workshop Purchase (Buy gold from client sent by foundry)
  const handleRegisterWorkshopPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshopId) return;

    const weightNum = Number(pWeight);
    const karatNum = Number(pKarat);
    const price21Num = Number(pPrice21);
    const assayFeeNum = Number(pAssayFee);

    if (!custName || weightNum <= 0 || karatNum <= 0 || price21Num <= 0) {
      showAlert(isArabic ? "برجاء توفير معطيات المشتريات الصحيحة والأوزان" : "Please provide valid client buy values.");
      return;
    }

    const millesimal = getMillesimalKarat(karatNum);
    const computedEquiv21 = Number(((millesimal / 875) * weightNum).toFixed(3));
    const grossGoldValue = Math.round(computedEquiv21 * price21Num);
    
    // Net cash leaving workshop safe: Gold value minus acid fee
    const netPayoutCash = grossGoldValue - assayFeeNum;

    const parsedKaratText = pKarat;
    const finalKaratForTx = karatNum;

    const newTx: WorkshopTransaction = {
      id: "wst_p_" + Date.now(),
      workshopId: selectedWorkshopId,
      date: new Date().toISOString().split("T")[0],
      type: "purchase",
      customerName: custName,
      actualWeight: weightNum,
      detectedKarat: finalKaratForTx,
      equivalentWeight21: computedEquiv21,
      price21: price21Num,
      goldValue: grossGoldValue,
      assayFee: assayFeeNum,
      brokerFee: 0,
      cashAmount: -netPayoutCash, // negative EGP leaves workshop safe
      descriptionAr: `شراء ذهب عيار ${parsedKaratText} وزن ${weightNum}g من العميل (${custName}) برسم ششنة ${assayFeeNum} ج.م`,
      descriptionEn: `Workshop gold buy (${parsedKaratText}) weight ${weightNum}g from ${custName} (Acid Fee: ${assayFeeNum} EGP)`,
    };

    onAddWorkshopTransaction(newTx);

    // reset Form
    setCustName("");
    setPWeight("");
    setPKarat("875");
    showAlert(isArabic ? "تم قيد فاتورة المشتريات وتخفيض كاش الورشة وإضافة وزن الذهب لعهدتها بسلام." : "Workshop purchase coupon registered successfully!");
  };

  // Workshop Sale (Sell gold from foundry to a wholesale dealer)
  const handleRegisterWorkshopSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshopId) return;

    const weightNum = Number(sWeight);
    const karatNum = Number(sKarat);
    const price21Num = Number(sPrice21);

    if (weightNum <= 0 || karatNum <= 0 || price21Num <= 0 || !sDealerId) {
      showAlert(isArabic ? "برجاء استيفاء كامل قيم مبيعات عهدة الورشة" : "Please provide valid workshop sales attributes.");
      return;
    }

    const millesimal = getMillesimalKarat(karatNum);
    const computedEquiv21 = Number(((millesimal / 875) * weightNum).toFixed(3));
    const grossValue = Math.round(computedEquiv21 * price21Num);

    // Find dealer name
    const dObj = dealers.find((d) => d.id === sDealerId);
    const dNameAr = dObj ? dObj.nameAr : "التاجر";
    const dNameEn = dObj ? dObj.nameEn : "Dealer";

    const parsedKaratText = sKarat;
    const finalKaratForTx = karatNum;

    const newTx: WorkshopTransaction = {
      id: "wst_s_" + Date.now(),
      workshopId: selectedWorkshopId,
      date: new Date().toISOString().split("T")[0],
      type: "sale",
      dealerId: sDealerId,
      actualWeight: weightNum,
      detectedKarat: finalKaratForTx,
      equivalentWeight21: computedEquiv21,
      price21: price21Num,
      goldValue: grossValue,
      assayFee: 0,
      brokerFee: 0,
      cashAmount: grossValue, // Sale proceeds go into the workshop financial safe
      descriptionAr: `بيع ذهب الورشة عوارض عيار ${parsedKaratText} بوزن ${weightNum}g للتاجر (${dNameAr}) للتحصيل النقدي`,
      descriptionEn: `Sold workshop gold stock (${parsedKaratText}) weight ${weightNum}g to ${dNameEn}`,
    };

    onAddWorkshopTransaction(newTx);

    setSWeight("");
    setSKarat("875");
    showAlert(isArabic ? "تم تسجيل تسوية مبيعات عهدة الورشة للتاجر وتزويد الخزنة المالية بالقيمة النقدية!" : "Workshop gold store stock sale successfully recorded!");
  };

  // Export Selected Workshop transactions to separate Excel (CSV format)
  const handleExportWorkshopToCSV = () => {
    if (!activeWorkshop) return;
    const headers = [
      isArabic ? "معرف الحركة" : "Transaction ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "النوع" : "Type",
      isArabic ? "اسم العميل / التفصيلي" : "Client Reference",
      isArabic ? "الوزن الخام (جرام)" : "Actual Weight (g)",
      isArabic ? "العيار" : "Karat / Fineness",
      isArabic ? "مكافئ عيار 21" : "Equivalent 21g",
      isArabic ? "سعر عيار 21" : "Price 21 (EGP)",
      isArabic ? "قيمة الذهب" : "Gold Value (EGP)",
      isArabic ? "خصم الششنة" : "Assay Acid Fee",
      isArabic ? "الأثر المالي المجلوب (ج.م)" : "Cash Balance Alteration (EGP)",
      isArabic ? "البيان بالعربية" : "Arabic Description",
      isArabic ? "البيان بالإنجليزية" : "English Description"
    ];

    const rows = selectedWsTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.type,
      tx.customerName || tx.dealerId || "",
      tx.actualWeight,
      tx.detectedKarat,
      tx.equivalentWeight21,
      tx.price21,
      tx.goldValue,
      tx.assayFee,
      tx.cashAmount,
      tx.descriptionAr,
      tx.descriptionEn
    ]);

    const titlePrefix = activeWorkshop.nameEn.replace(/\s+/g, "_").toLowerCase();
    downloadCSV(headers, rows, `${titlePrefix}_workshop_report`);
    showAlert(isArabic ? `تم تحميل كشف الورشة (${activeWorkshop.nameAr}) بنجاح!` : `Exported ledger for workshop ${activeWorkshop.nameEn} successfully.`);
  };

  // Ledger filter list
  const filteredTransactions = selectedWsTransactions.filter((tx) => {
    const isMatchedType =
      filterTxType === "all" ||
      (filterTxType === "buys" && tx.type === "purchase") ||
      (filterTxType === "sales" && tx.type === "sale") ||
      (filterTxType === "adjustments" && ["cash_deposit", "cash_withdrawal", "gold_deposit", "gold_withdrawal"].includes(tx.type));

    const matchedSearch =
      tx.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    return isMatchedType && matchedSearch;
  });

  return (
    <div id="workshops-management-dashboard" className="space-y-6 animate-fade-in text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* HEADER SECTION FOR MODULE */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-black text-amber-400 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>{dictionary.title}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">{dictionary.subtitle}</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          type="button"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          <span>{dictionary.addWsBtn}</span>
        </button>
      </div>

      {/* NEW WORKSHOP CREATION FORM */}
      {showAddForm && (
        <form onSubmit={handleCreateWorkshop} className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-xl space-y-4 text-xs font-semibold text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-slate-400">{dictionary.wsNameAr}</label>
              <input
                type="text"
                required
                value={wsNameAr}
                onChange={(e) => setWsNameAr(e.target.value)}
                placeholder="مثال: ورشة العائلة الفنية"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400">{dictionary.wsNameEn}</label>
              <input
                type="text"
                required
                value={wsNameEn}
                onChange={(e) => setWsNameEn(e.target.value)}
                placeholder="e.g. Al-Ayala Artistry Foundry"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-slate-400">{dictionary.wsManagerAr}</label>
              <input
                type="text"
                value={wsManagerAr}
                onChange={(e) => setWsManagerAr(e.target.value)}
                placeholder="اسم مدير الورشة بالعربية"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400">{dictionary.wsManagerEn}</label>
              <input
                type="text"
                value={wsManagerEn}
                onChange={(e) => setWsManagerEn(e.target.value)}
                placeholder="Manager name on English records"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400">{dictionary.wsPhone}</label>
              <input
                type="text"
                value={wsPhone}
                onChange={(e) => setWsPhone(e.target.value)}
                placeholder="e.g. 010112233"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              onClick={() => setShowAddForm(false)}
              type="button"
              className="bg-slate-850 hover:bg-slate-800 text-slate-400 px-4 py-2.5 rounded text-xs transition-colors"
            >
              {isArabic ? "إلغاء التأسيس" : "Cancel"}
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-605 text-slate-950 font-black px-5 py-2.5 rounded text-xs transition-colors"
            >
              {dictionary.saveWs}
            </button>
          </div>
        </form>
      )}

      {/* NO WORKSHOPS STATE CONTAINER */}
      {workshops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-xs font-bold">{dictionary.noWorkshops}</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs px-4 py-2 rounded-lg font-black transition-all"
          >
            {isArabic ? "ابدأ وأنشئ أول ورشة متعاقدة" : "Initialize First Workshop Profile"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* WORKSHOP FINDER RAIL AND LISTS (Left list 4-cols) */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-3.5 shadow-xl">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black border-b border-slate-900 pb-2 flex justify-between items-center">
              <span>{isArabic ? "دليل الورش المسجلة" : "Foundry Index Registries"}</span>
              <span className="font-mono text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded leading-none">{workshops.length}</span>
            </div>

            <div className="space-y-1.5 max-h-[350px] overflow-y-auto scrollbar-thin">
              {workshops.map((w) => {
                const isActive = w.id === selectedWorkshopId;
                
                // compute custom counts to show on the selectors
                const wsTxs = workshopTransactions.filter(t => t.workshopId === w.id);
                const cashBalance = wsTxs.reduce((acc, tx) => acc + tx.cashAmount, 0);
                const goldBalance21 = wsTxs.reduce((acc, tx) => {
                  if (tx.type === "purchase" || tx.type === "gold_deposit") return acc + tx.equivalentWeight21;
                  if (tx.type === "sale" || tx.type === "gold_withdrawal") return acc - tx.equivalentWeight21;
                  return acc;
                }, 0);

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkshopId(w.id)}
                    className={`p-3 rounded-lg border text-right cursor-pointer transition-all flex flex-col justify-between ${
                      isActive
                        ? "bg-amber-500/10 border-amber-500/40 text-white"
                        : "bg-slate-900/60 border-slate-900 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-black text-xs">{isArabic ? w.nameAr : w.nameEn}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showConfirm(dictionary.deleteWsAlert, () => {
                            onDeleteWorkshop(w.id);
                            if (selectedWorkshopId === w.id) {
                              const remaining = workshops.filter((rm) => rm.id !== w.id);
                              setSelectedWorkshopId(remaining.length > 0 ? remaining[0].id : null);
                            }
                          });
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-950/60 rounded transition-all"
                        title={isArabic ? "مسح الورشة" : "Delete Workshop"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-500 mt-2 font-mono">
                      <span>{isArabic ? "كاش:" : "Cash:"} <span className={cashBalance >= 0 ? "text-emerald-400 font-bold" : "text-rose-400"}>{cashBalance.toLocaleString()} EGP</span></span>
                      <span>{isArabic ? "ذهب ٢١:" : "21k Gold:"} <span className="text-amber-400 font-bold">{goldBalance21.toFixed(2)}g</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900/40 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed font-semibold border border-slate-900">
              <span className="text-amber-400 font-bold">💡 {isArabic ? "فصل الحسابات الذاتي:" : "Auto-segregated Ledgers:"}</span>
              <p className="mt-1">
                {isArabic 
                  ? "كل عملية شراء أو تعديل تجريها للورشة المحددة تؤثر فحسب في خزينتها المالية والذهبية المستقلة، بعيداً عن صناديق المتجر الرئيسية والمشاريع المفتوحة للتجار."
                  : "All customer buys or dealer refines recorded inside this workshop viewport strictly offset this workshop's vaults."}
              </p>
            </div>
          </div>

          {/* ACTIVE WORKSHOP CORE UTILITY PANEL (Right viewport 8-cols) */}
          {activeWorkshop && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* SELECTED HEADER BAR */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
                <div>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">
                    {isArabic ? "الورشة المختارة" : "Active Workshop profile"}
                  </span>
                  <h3 className="text-base font-black text-slate-100 mt-1 font-serif">
                    {isArabic ? activeWorkshop.nameAr : activeWorkshop.nameEn}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-slate-500 mt-1.5 font-semibold">
                    {activeWorkshop.managerAr && (
                      <span>{dictionary.manager} <span className="text-slate-350">{isArabic ? activeWorkshop.managerAr : activeWorkshop.managerEn}</span></span>
                    )}
                    {activeWorkshop.phone && (
                      <span>{dictionary.phone} <span className="text-slate-350 font-mono">{activeWorkshop.phone}</span></span>
                    )}
                  </div>
                </div>

                <div className="text-xs bg-slate-950 px-3.5 py-2 hover:bg-slate-900 cursor-pointer rounded-xl font-bold font-mono border border-slate-800 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>{selectedWsTransactions.length} {isArabic ? "معاملة مقيدة" : "operations logged"}</span>
                </div>
              </div>

              {/* THREE INDEPENDENT BALANCE TILES FOR WORKSHOP SAFES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. FINANCIAL SAFE (EGP) */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 shadow-md flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -mr-4 -mt-4 pointer-events-none" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">{dictionary.cashSafe}</span>
                    <h4 className={`text-base font-black font-mono mt-1 ${hashCashSafe >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatCurrency(hashCashSafe, isArabic)}
                    </h4>
                  </div>
                  <span className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>

                {/* 2. GOLD STOCK (Actual g) */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 shadow-md flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-550/5 to-transparent rounded-full -mr-4 -mt-4 pointer-events-none" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">{dictionary.goldSafeActual}</span>
                    <h4 className="text-base font-black text-amber-450 font-mono mt-1">
                      {formatWeight(hashGoldActualWeight, isArabic)}
                    </h4>
                  </div>
                  <span className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                    <Layers className="w-4 h-4" />
                  </span>
                </div>

                {/* 3. GOLD STOCK (Equiv g 21) */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 shadow-md flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-550/5 to-transparent rounded-full -mr-4 -mt-4 pointer-events-none" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">{dictionary.goldSafeEquiv}</span>
                    <h4 className="text-base font-black text-amber-400 font-mono mt-1">
                      {formatWeight(hashGoldEquivWeight21, isArabic)}
                    </h4>
                  </div>
                  <span className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-500 border border-yellow-500/25">
                    <Scale className="w-4 h-4" />
                  </span>
                </div>

              </div>

              {/* DIRECT CODES ADJUSTMENT & ACTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* RE-BALANCE AND DIRECT DEPOSIT/WITHDRAWALS CARD */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-md">
                  <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                    <span>{dictionary.directAdjustTitle}</span>
                  </h3>

                  <form onSubmit={handleDirectAdjust} className="space-y-4 text-xs font-semibold text-slate-300">
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-900 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAdjustType("cash")}
                        className={`py-1.5 rounded transition-all ${adjustType === "cash" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400"}`}
                      >
                        {isArabic ? "تعديل نقدي كاش (ج.م)" : "Cash (EGP)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType("gold")}
                        className={`py-1.5 rounded transition-all ${adjustType === "gold" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400"}`}
                      >
                        {isArabic ? "تعديل عيني ذهب" : "Gold weight"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-900 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAdjustDirection("deposit")}
                        className={`py-1.5 rounded transition-all ${adjustDirection === "deposit" ? "bg-emerald-500/15 text-emerald-400 font-black border border-emerald-500/20" : "text-slate-500"}`}
                      >
                        {isArabic ? "إيداع للورشة (+)" : "Load / Deposit (+)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustDirection("withdraw")}
                        className={`py-1.5 rounded transition-all ${adjustDirection === "withdraw" ? "bg-rose-500/15 text-rose-450 font-black border border-rose-500/20" : "text-slate-500"}`}
                      >
                        {isArabic ? "سحب وتخفيض (-)" : "Withdraw / Unload (-)"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block mb-1 text-slate-400">
                          {adjustType === "cash" 
                            ? (isArabic ? "المقدار المالي كاش *" : "Cash amount *")
                            : (isArabic ? "الوزن الفعلي (جرام) *" : "Actual weight (g) *")}
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="0.000"
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {adjustType === "gold" ? (
                        <div>
                          <label className="block mb-1 text-slate-400">{dictionary.karatLabel}</label>
                          <input
                            type="number"
                            required
                            value={adjustKarat}
                            onChange={(e) => setAdjustKarat(e.target.value)}
                            placeholder="e.g. 21"
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      ) : (
                        <div className="opacity-40 select-none">
                          <label className="block mb-1 text-slate-500">{isArabic ? "العيار (غير مطلوب)" : "Karat (Unused)"}</label>
                          <input
                            type="text"
                            disabled
                            placeholder="N/A"
                            className="w-full bg-slate-950 border border-slate-9(0) text-slate-600 rounded p-2 text-center"
                          />
                        </div>
                      )}
                    </div>



                    <div>
                      <label className="block mb-1 text-slate-405">{isArabic ? "ملاحظات الحركة (بالعربية)" : "Memo (Arabic)"}</label>
                      <input
                        type="text"
                        value={adjustDescAr}
                        onChange={(e) => setAdjustDescAr(e.target.value)}
                        placeholder="بيان تفصيلي للحركة بالعربية"
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-slate-405">{isArabic ? "البيان بالإنجليزية" : "Memo (English)"}</label>
                      <input
                        type="text"
                        value={adjustDescEn}
                        onChange={(e) => setAdjustDescEn(e.target.value)}
                        placeholder="English explanation memo"
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-2.5 rounded font-black transition-colors"
                    >
                      {isArabic ? "تعديل رصيد الخزائن وتأكيد القيد" : "Submit Vault Adjustment Transaction"}
                    </button>
                  </form>
                </div>

                {/* WORKSHOP SPECIFIC PURCHASE: CLIENT FORWARDED BY CONTRACT */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-md">
                  <h3 className="text-xs font-bold text-emerald-400 mb-4 flex items-center gap-1.5">
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>{dictionary.pFormTitle}</span>
                  </h3>

                  <form onSubmit={handleRegisterWorkshopPurchase} className="space-y-4 text-xs font-semibold text-slate-300">
                    <div>
                      <label className="block mb-1 text-slate-400">{dictionary.custNameLabel}</label>
                      <div className="relative">
                        <User className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          placeholder={dictionary.custNamePlaceholder}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 pr-9 pl-4 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block mb-1 text-slate-400">{dictionary.weightLabel}</label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          value={pWeight}
                          onChange={(e) => setPWeight(e.target.value)}
                          placeholder="0.000"
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-slate-455">{dictionary.karatLabel}</label>
                        <input
                          type="number"
                          required
                          value={pKarat}
                          onChange={(e) => setPKarat(e.target.value)}
                          placeholder={dictionary.karatPlaceholder}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-slate-400">{dictionary.price21Label}</label>
                        <input
                          type="number"
                          required
                          value={pPrice21}
                          onChange={(e) => setPPrice21(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-slate-400">{dictionary.assayFeeLabel}</label>
                        <input
                          type="number"
                          required
                          value={pAssayFee}
                          onChange={(e) => setPAssayFee(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* LIVE CALCULATION AREA */}


                    {pWeight && Number(pWeight) > 0 && (() => {
                      const liveKarat = Number(pKarat);
                      const equivWeight = calculateEquivalentWeight(Number(pWeight), liveKarat);
                      const grossVal = Math.round(equivWeight * Number(pPrice21));
                      const netVal = grossVal - Number(pAssayFee);
                      return (
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[11px] font-sans text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>{isArabic ? "الوزن المعادل (عيار 21):" : "Karat 21 equivalent weight:"}</span>
                            <span className="font-bold text-amber-450 font-mono">
                              {formatWeight(equivWeight, isArabic)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{isArabic ? "قيمة الذهب الإجمالية:" : "Gross Gold payout:"}</span>
                            <span className="font-bold text-white font-mono">
                              {formatCurrency(grossVal, isArabic)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-dashed border-slate-800 text-[10px] text-emerald-400">
                            <span>{isArabic ? "الصافي من صندوق الورشة (EGP):" : "Net leave workshop asset:"}</span>
                            <span className="font-bold font-mono">
                              {formatCurrency(netVal, isArabic)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded font-black transition-colors"
                    >
                      {dictionary.registerTx}
                    </button>
                  </form>
                </div>

              </div>

              {/* SELLING WORKSHOP HELD GOLD BACK TO MARKET WHOLESALE DEALERS */}
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-md">
                <h3 className="text-xs font-bold text-rose-455 mb-4 flex items-center gap-1.5">
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>{dictionary.sFormTitle}</span>
                </h3>

                <form onSubmit={handleRegisterWorkshopSale} className="space-y-4 text-xs font-semibold text-slate-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1 text-slate-400">{dictionary.dealerLabel}</label>
                      <select
                        value={sDealerId}
                        onChange={(e) => setSDealerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-rose-500"
                      >
                        {dealers.map((dl) => (
                          <option key={dl.id} value={dl.id}>
                            {isArabic ? dl.nameAr : dl.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-slate-400">{dictionary.weightLabel}</label>
                      <input
                        type="number"
                        step="0.001"
                        required
                        value={sWeight}
                        onChange={(e) => setSWeight(e.target.value)}
                        placeholder="0.000"
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-slate-455">{dictionary.karatLabel}</label>
                      <input
                        type="number"
                        required
                        value={sKarat}
                        onChange={(e) => setSKarat(e.target.value)}
                        placeholder={dictionary.karatPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-slate-405">{dictionary.price21Label}</label>
                      <input
                        type="number"
                        required
                        value={sPrice21}
                        onChange={(e) => setSPrice21(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-rose-555"
                      />
                    </div>

                    {/* LIVE SALE PREVIEWS */}
                    {sWeight && Number(sWeight) > 0 && (() => {
                      const liveKarat = Number(sKarat);
                      const equivWeight = calculateEquivalentWeight(Number(sWeight), liveKarat);
                      const grossVal = Math.round(equivWeight * Number(sPrice21));
                      return (
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-[11px] font-sans text-slate-400 flex flex-col justify-center w-full">
                          <div className="flex justify-between">
                            <span>{isArabic ? "المكافئ ٢١ للتخفيض:" : "Equiv 21 Weight deducted:"}</span>
                            <span className="font-bold text-orange-400 font-mono">
                              -{formatWeight(equivWeight, isArabic)}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1 text-[11px] text-emerald-400">
                            <span>{isArabic ? "قيمة كاش مضافة لخزينة الورشة:" : "Incoming cash back to foundry safe:"}</span>
                            <span className="font-bold font-mono">
                              +{formatCurrency(grossVal, isArabic)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded font-black transition-colors"
                  >
                    {isArabic ? "تسجيل مبيعات وتغذية خزينة الورشة المالية" : "Execute Sale and Fund Foundry Cash Safe"}
                  </button>
                </form>
              </div>

              {/* TRANSACTIONS LEDGER LIST SPECIFIC TO SELECTED WORKSHOP */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 bg-slate-950/60 border-b border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <h3 className="text-xs font-bold text-slate-200">{dictionary.historyTitle}</h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportWorkshopToCSV}
                      className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{dictionary.downloadExcel}</span>
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="p-3 bg-slate-950/20 border-b border-slate-850 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div className="relative flex-1">
                    <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isArabic ? "ابحث بالبيان أو العميل أو القيمة..." : "Search by customer name or memo..."}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 pr-8 pl-4 text-white text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-850 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setFilterTxType("all")}
                      className={`px-3 py-1 rounded transition-all ${filterTxType === "all" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}
                    >
                      {isArabic ? "الكل" : "All"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTxType("buys")}
                      className={`px-3 py-1 rounded transition-all ${filterTxType === "buys" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}
                    >
                      {isArabic ? "المشتريات" : "Purchases"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTxType("sales")}
                      className={`px-3 py-1 rounded transition-all ${filterTxType === "sales" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}
                    >
                      {isArabic ? "المبيعات" : "Sales"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTxType("adjustments")}
                      className={`px-3 py-1 rounded transition-all ${filterTxType === "adjustments" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}
                    >
                      {isArabic ? "الخزائن" : "Adjustments"}
                    </button>
                  </div>
                </div>

                {/* Ledger Data Table */}
                <div className="overflow-x-auto">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-xs">
                      {isArabic 
                        ? "لا توجد حركات مطابقة لمعطيات البحث حالياً." 
                        : "No workshop transactions matched filters."}
                    </div>
                  ) : (
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-850 text-[10px] uppercase">
                          <th className="p-3 whitespace-nowrap">{isArabic ? "التاريخ" : "Date"}</th>
                          <th className="p-3">{isArabic ? "البيان والعملية" : "Description / Memo"}</th>
                          <th className="p-3 text-center">{isArabic ? "الجرام ميزان" : "Actual g"}</th>
                          <th className="p-3 text-center">{isArabic ? "مكافئ ٢١" : "Equiv 21g"}</th>
                          <th className="p-3 text-center">{isArabic ? "السهم" : "Karat"}</th>
                          <th className="p-3 text-center">{isArabic ? "تأثير كاش الصندوق" : "Cash Safe delta"}</th>
                          <th className="p-3 text-center">{isArabic ? "إجراء" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-350">
                        {filteredTransactions.map((tx) => {
                          const hasEgpDelta = tx.cashAmount !== 0;
                          
                          let typeTagLabel: string = tx.type;
                          if (tx.type === "purchase") typeTagLabel = isArabic ? "شراء عميل" : "Customer Buy";
                          else if (tx.type === "sale") typeTagLabel = isArabic ? "بيع تاجر" : "Dealer Sale";
                          else if (tx.type === "cash_deposit") typeTagLabel = isArabic ? "+ شحن كاش" : "Fund Cash (+)";
                          else if (tx.type === "cash_withdrawal") typeTagLabel = isArabic ? "- سحب كاش" : "Withdraw Cash (-)";
                          else if (tx.type === "gold_deposit") typeTagLabel = isArabic ? "+ إيداع ذهب" : "Fund Gold (+)";
                          else if (tx.type === "gold_withdrawal") typeTagLabel = isArabic ? "- سحب ذهب" : "Withdraw Gold (-)";

                          return (
                            <tr key={tx.id} className="hover:bg-slate-800/10 transition-colors">
                              <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">{tx.date}</td>
                              <td className="p-3">
                                <span className="font-semibold text-slate-100">{isArabic ? tx.descriptionAr : tx.descriptionEn}</span>
                                {tx.customerName && (
                                  <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                                    {isArabic ? "مرسل من العميل: " : "Forwarded client: "}{tx.customerName}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center font-mono font-bold">
                                {tx.actualWeight > 0 ? formatWeight(tx.actualWeight, isArabic) : "-"}
                              </td>
                              <td className="p-3 text-center font-mono text-amber-500 font-bold">
                                {tx.equivalentWeight21 > 0 ? formatWeight(tx.equivalentWeight21, isArabic) : "-"}
                              </td>
                              <td className="p-3 text-center font-mono text-slate-400">
                                {tx.detectedKarat > 0 ? tx.detectedKarat : "-"}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap font-mono font-bold">
                                {hasEgpDelta ? (
                                  <span className={tx.cashAmount >= 0 ? "text-emerald-400" : "text-rose-450"}>
                                    {tx.cashAmount >= 0 ? "+" : ""}{formatCurrency(tx.cashAmount, isArabic)}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    showConfirm(dictionary.deleteTxAlert, () => {
                                      onDeleteWorkshopTransaction(tx.id);
                                    });
                                  }}
                                  className="p-1 px-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded transition-colors"
                                  title={isArabic ? "حذف الحركة" : "Delete recorded line"}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {(() => {
                        const totalActual = filteredTransactions.reduce((acc, tx) => acc + (tx.actualWeight || 0), 0);
                        const totalEquiv = filteredTransactions.reduce((acc, tx) => acc + (tx.equivalentWeight21 || 0), 0);
                        const totalCash = filteredTransactions.reduce((acc, tx) => acc + (tx.cashAmount || 0), 0);
                        return (
                          <tfoot className="bg-slate-950 font-bold text-slate-200 border-t border-slate-800 text-center">
                            <tr>
                              <td className="p-3 font-sans text-right">{isArabic ? "إجمالي الحركات" : "Total of Transactions"}</td>
                              <td className="p-3 font-sans text-right">({filteredTransactions.length} {isArabic ? "حركات" : "lines"})</td>
                              <td className="p-3 font-mono text-white">{totalActual > 0 ? formatWeight(totalActual, isArabic) : "-"}</td>
                              <td className="p-3 font-mono text-amber-500 font-bold">{totalEquiv > 0 ? formatWeight(totalEquiv, isArabic) : "-"}</td>
                              <td className="p-3 font-mono text-slate-400">-</td>
                              <td className="p-3 font-mono font-bold whitespace-nowrap">
                                <span className={totalCash >= 0 ? "text-emerald-400" : "text-rose-450"}>
                                  {totalCash >= 0 ? "+" : ""}{formatCurrency(totalCash, isArabic)}
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

            </div>
          )}

        </div>
      )}

    </div>
  );
}
