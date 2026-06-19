/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  PlusCircle,
  Search,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
  Activity,
  Award,
  DollarSign,
  FlaskConical,
  Scale,
  FileSpreadsheet
} from "lucide-react";
import { PublicExpenseItem, AssayLogItem } from "../types";
import { formatCurrency, formatWeight, downloadCSV, getMillesimalKarat } from "../utils";

interface ExpensesManagerProps {
  expenses: PublicExpenseItem[];
  assayLogs: AssayLogItem[];
  isArabic: boolean;
  onAddExpense: (expense: PublicExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onAddAssayLog: (log: AssayLogItem) => void;
  onDeleteAssayLog: (id: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showAlert: (message: string) => void;
  isAdminMode: boolean;
  onRequestAdminUnlock?: () => void;
}

export default function ExpensesManager({
  expenses,
  assayLogs,
  isArabic,
  onAddExpense,
  onDeleteExpense,
  onAddAssayLog,
  onDeleteAssayLog,
  showConfirm,
  showAlert,
  isAdminMode,
  onRequestAdminUnlock,
}: ExpensesManagerProps) {
  // Overhead Expenses local form
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("نثريات وضيافة");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  // Standalone Assay Log local form (for simple diagnostic tests paid in cash)
  const [assayClient, setAssayClient] = useState("");
  const [assayWeight, setAssayWeight] = useState("");
  const [assayCurrentKarat, setAssayCurrentKarat] = useState("21"); // Default commercial current karat
  const [assayKarat, setAssayKarat] = useState("875"); // Default standard (875 Karat)
  const [assayFeeCollected, setAssayFeeCollected] = useState("200");

  const handleAssayCurrentKaratChange = (val: string) => {
    setAssayCurrentKarat(val);
    const numericVal = Number(val);
    if (numericVal > 0) {
      const millesimal = getMillesimalKarat(numericVal);
      setAssayKarat(String(millesimal));
    }
  };

  // Search filter
  const [expenseSearch, setExpenseSearch] = useState("");
  const [assaySearch, setAssaySearch] = useState("");

  const handleExportExpensesExcel = () => {
    const headers = [
      isArabic ? "معرف المصروف" : "Expense ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "البند" : "Title",
      isArabic ? "نوع النفقة" : "Category",
      isArabic ? "المقدار المالي (ج.م)" : "Amount (EGP)",
      isArabic ? "ملاحظات وتفاصيل" : "Notes"
    ];

    const rows = expenses.map((e) => [
      e.id,
      e.date,
      isArabic ? e.titleAr : e.titleEn,
      e.category,
      e.amount,
      e.notes || ""
    ]);

    downloadCSV(headers, rows, isArabic ? "مصروفات_مؤسسة_الأهرام" : "pyramids_overhead_expenses");
    showAlert(isArabic ? "تم تحميل شيت المصروفات بنجاح!" : "Expenses list downloaded as Excel (CSV) successfully!");
  };

  const handleExportAssayLogsExcel = () => {
    const headers = [
      isArabic ? "رقم الفحص" : "Test ID",
      isArabic ? "التاريخ" : "Date",
      isArabic ? "اسم طالب الفحص" : "Customer / Client Name",
      isArabic ? "وزن عينة الفحص (جرام)" : "Sample Weight (g)",
      isArabic ? "العيار المحدد نموذجياً" : "Karat Detected",
      isArabic ? "رسم الفحص المحصل (ج.م)" : "Assay Fee Collected"
    ];

    const rows = assayLogs.map((al) => [
      al.id,
      al.date,
      al.customerName || al.clientName || "",
      al.actualWeight,
      al.detectedKarat,
      al.assayFee || al.assayFeeCollected || 0
    ]);

    downloadCSV(headers, rows, isArabic ? "سجل_فحوصات_المعمل" : "pyramids_assay_diagnostic_logs");
    showAlert(isArabic ? "تم تحميل سجل ششنة المعمل بنجاح!" : "Assay diagnostic logs downloaded as Excel (CSV) successfully!");
  };

  const presetCategories = isArabic
    ? [
        "محلول أحماض ومواد تيزاب",
        "أجور صهر وبوتقة صب",
        "فاتورة كهرباء ومياه المعمل",
        "إيجار وصيانة آلات الصاغة",
        "نثريات وضيافة العمال",
        "رسوم ترخيص ودمغة وموازين"
      ]
    : [
        "Acid testing solutions & chemicals",
        "Melting crucible & gas wages",
        "Electricity & water utilities",
        "Gold weights calibration & maintenance",
        "Overhead operations & tea buffet",
        "Government trade stamp fees"
      ];

  const t = {
    expenseTitle: isArabic ? "تسجيل مصروفات تشغيلية وعمومية" : "Log Workspace Operational Expenses",
    categoryLabel: isArabic ? "بند مصروفات جاهز ومقترح" : "Predefined Expense Category",
    titleLabel: isArabic ? "عنوان ووصف بند الصرف *" : "Expense Item Name / Code *",
    titlePlaceholder: isArabic ? "مثال: شراء كحول نقي وغاز بوتان" : "e.g., Crucible replacement carbon",
    amountLabel: isArabic ? "مقدار المبلغ المدفوع *" : "Amount Paid *",
    notesLabel: isArabic ? "نثريات وملاحظات إضافية" : "Internal Remarks / Details",
    submitExpense: isArabic ? "قيد المصروف فورياً في الحسابات" : "Post Expense To Cash Ledger",
    assayTitle: isArabic ? "تسجيل رسم ششنة / فحص كاش منفرد" : "Post Direct Cash Assay Diagnostics Service",
    clientLabel: isArabic ? "اسم العميل المورّد للتحليل *" : "Customer Name for Diagnostic *",
    clientPlaceholder: isArabic ? "مثال: صائغ محلي كاش" : "e.g., Local jeweler cash walkin",
    weightLabel: isArabic ? "الوزن الفعلي المفحوص (جرام) *" : "Inspected Gold Weight (g) *",
    karatLabel: isArabic ? "عيار المعمل *" : "Lab Assay Karat *",
    feeLabel: isArabic ? "رسم الفحص الكاش المقبوض *" : "Diagnostic Fee Collected (EGP) *",
    submitAssay: isArabic ? "تسجيل رسم الششنة وإثبات الدفعة" : "Register Assay Testing Income",
    totalOverhead: isArabic ? "إجمالي المصاريف التشغيلية الكلية" : "Total Workshop Running Expenses",
    totalAssayRev: isArabic ? "إجمالي إيراد رسوم فحص المعمل" : "Total Diagnostic Testing Revenue",
    expenseLedgerTab: isArabic ? "دفتر المصروفات التشغيلية والنثريات" : "Overhead running Expenses Ledger",
    assayLedgerTab: isArabic ? "إيرادات ورسوم الششنة والتحليل الكيميائي" : "Diagnostic Assays revenue Logs",
    date: isArabic ? "التاريخ" : "Date",
    delete: isArabic ? "حذف" : "Delete",
    category: isArabic ? "فئة المصروف" : "Category",
    notes: isArabic ? "البيان والملاحظات" : "Details",
    total: isArabic ? "المقدار" : "Price",
    karat: isArabic ? "عيار" : "Kkt",
    weight: isArabic ? "الوزن" : "Weight",
    client: isArabic ? "العميل المستفيد" : "Client Beneficiary",
    searchPlaceholder: isArabic ? "تفتيش الدفتر..." : "Filter records list...",
  };

  const handleAddOverheadExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expenseAmount);
    if (!expenseTitle || amountNum <= 0) {
      showAlert(isArabic ? "برجاء توفير بيانات سليمة ومبلغ أكبر من الصفر" : "Please provide a valid title and quantity.");
      return;
    }

    const newExpense: PublicExpenseItem = {
      id: "e_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      titleAr: isArabic ? `${expenseCategory} - ${expenseTitle}` : `Overhead - ${expenseTitle}`,
      titleEn: isArabic ? `Overhead - ${expenseTitle}` : `${expenseCategory} - ${expenseTitle}`,
      category: "overhead",
      amount: amountNum,
      notes: expenseNotes.trim() || undefined
    };

    onAddExpense(newExpense);

    // Reset fields
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseNotes("");
  };

  const handleAddDiagnosticAssay = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = Number(assayWeight);
    const karatNum = Number(assayKarat);
    const feeNum = Number(assayFeeCollected);

    if (!assayClient || weightNum <= 0 || karatNum <= 0 || feeNum <= 0) {
      showAlert(isArabic ? "برجاء التأكد من صحة مدخلات فحص الششنة" : "Please double check diagnostic parameters.");
      return;
    }

    const newAssay: AssayLogItem = {
      id: "as_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      clientName: assayClient,
      actualWeight: weightNum,
      detectedKarat: karatNum,
      currentKarat: Number(assayCurrentKarat),
      assayFeeCollected: feeNum,
    };

    onAddAssayLog(newAssay);

    // Reset fields
    setAssayClient("");
    setAssayWeight("");
    setAssayCurrentKarat("21");
    setAssayKarat("875");
    setAssayFeeCollected("200");
  };

  // Filter operations
  const filteredExpenses = expenses.filter((e) => {
    const term = expenseSearch.toLowerCase();
    const title = (e.titleAr || e.titleEn || "").toLowerCase();
    const notes = (e.notes || "").toLowerCase();
    return title.includes(term) || notes.includes(term) || e.date.includes(term);
  });

  const filteredAssayLogs = assayLogs.filter((log) => {
    const term = assaySearch.toLowerCase();
    const name = log.clientName || log.customerName || "";
    return name.toLowerCase().includes(term) || log.date.includes(term);
  });

  const sumExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const sumAssays = filteredAssayLogs.reduce((acc, l) => acc + (l.assayFeeCollected || l.assayFee || 0), 0);

  return (
    <div id="expenses-manager-section" className="space-y-8 animate-fade-in text-slate-200" dir={isArabic ? "rtl" : "ltr"}>
      
      {/* SECTION 1: TWO SYMMETRIC INPUT FORMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* OPERATIONAL EXPENSES INPUT */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
          <h2 className="text-xs font-black text-amber-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>{t.expenseTitle}</span>
          </h2>
          
          <form onSubmit={handleAddOverheadExpense} className="space-y-4 text-xs font-semibold text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">{isArabic ? "التاريخ (اليوم تلقائي)" : "Date (Automated)"}</label>
                <div className="bg-slate-950 border border-slate-800 p-2 rounded text-slate-400">
                  {new Date().toISOString().split("T")[0]}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{t.categoryLabel}</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => {
                    setExpenseCategory(e.target.value);
                    setExpenseTitle(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                >
                  {presetCategories.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="other">{isArabic ? "أخرى (كتابة مخصصة)" : "Custom category below"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">{t.titleLabel}</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder={t.titlePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{t.amountLabel}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-slate-400">{t.notesLabel}</label>
              <textarea
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                rows={1}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                placeholder={isArabic ? "رقم الفاتورة أو المورد..." : "Invoice reference notes..."}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.submitExpense}</span>
            </button>
          </form>
        </div>

        {/* STANDALONE DIAGNOSTIC ASSAY INPUT */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
          <h2 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span>{t.assayTitle}</span>
          </h2>

          <form onSubmit={handleAddDiagnosticAssay} className="space-y-4 text-xs font-semibold text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">{t.clientLabel}</label>
                <div className="relative">
                  <span className="absolute right-2.5 top-2 text-slate-500">@</span>
                  <input
                    type="text"
                    required
                    value={assayClient}
                    onChange={(e) => setAssayClient(e.target.value)}
                    placeholder={t.clientPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 pr-8 pl-3 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{t.weightLabel}</label>
                <div className="relative">
                  <Scale className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={assayWeight}
                    onChange={(e) => setAssayWeight(e.target.value)}
                    placeholder="0.000"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 pr-8 pl-3 text-white text-left font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-slate-400 flex justify-between">
                  <span>{isArabic ? "العيار الحالي *" : "Current Karat *"}</span>
                  <span className="text-[10px] text-emerald-500 font-bold">({isArabic ? "عيار" : "K"})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max="24"
                  required
                  value={assayCurrentKarat}
                  onChange={(e) => handleAssayCurrentKaratChange(e.target.value)}
                  placeholder="21"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400 flex justify-between">
                  <span>{t.karatLabel}</span>
                  <span className="text-[10px] text-emerald-500 font-bold">({isArabic ? "ششنة" : "assay"})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={assayKarat}
                  onChange={(e) => setAssayKarat(e.target.value)}
                  placeholder="875"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">{t.feeLabel}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={assayFeeCollected}
                  onChange={(e) => setAssayFeeCollected(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-left font-mono outline-none/focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.submitAssay}</span>
            </button>
          </form>
        </div>

      </div>

      {/* SECTION 2: THE LEDGERS LISTS AND LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* EXPENSES DETAIL TAB PANEL */}
        <div className={`${isAdminMode ? "lg:col-span-6" : "lg:col-span-12"} space-y-4`}>
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex justify-between items-center whitespace-nowrap">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">{t.totalOverhead}</span>
              <span className="font-mono text-xs font-black text-rose-400">{formatCurrency(sumExpenses, isArabic)}</span>
            </div>
            <div className="relative w-48 text-right">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1 pr-6 pl-2 text-[11px] text-white outline-none"
              />
              <Search className="absolute right-1.5 top-2 w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 font-bold text-xs flex justify-between items-center">
              <span>{t.expenseLedgerTab}</span>
              <button
                type="button"
                onClick={handleExportExpensesExcel}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 rounded flex items-center gap-1 text-[9.5px] font-bold cursor-pointer transition-all"
                title={isArabic ? "تحميل عينة إكسل منفصل لهذا القسم" : "Download separate Excel sheet for this division"}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isArabic ? "تحميل إكسل" : "Download Excel"}</span>
              </button>
            </div>
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-slate-555 text-xs">{isArabic ? "لا توجد مصروفات مسجلة." : "No expenses in ledger."}</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-805">
                    <tr>
                      <th className="p-2.5">{t.date}</th>
                      <th className="p-2.5">{isArabic ? "بند الصرف" : "Title"}</th>
                      <th className="p-2.5">{t.category}</th>
                      <th className="p-2.5 text-center">{t.total}</th>
                      <th className="p-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-800/30 text-[11px]">
                        <td className="p-2.5 font-mono text-slate-500">{exp.date}</td>
                        <td className="p-2.5 font-bold text-slate-100 whitespace-nowrap">{isArabic ? exp.titleAr : exp.titleEn}</td>
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{isArabic ? "مصروف عام" : "Overhead"}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-rose-400">{formatCurrency(exp.amount, isArabic)}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => {
                              showConfirm(
                                isArabic ? "حذف قيد المصروف هذا بشكل نهائي؟" : "Delete this expense permanently?",
                                () => {
                                  onDeleteExpense(exp.id);
                                }
                              );
                            }}
                            className="text-slate-500 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ASSAY TESTING REVENUES LOGS PANEL */}
        {isAdminMode && (
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex justify-between items-center whitespace-nowrap">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">{t.totalAssayRev}</span>
                <span className="font-mono text-xs font-black text-emerald-400">{formatCurrency(sumAssays, isArabic)}</span>
              </div>
              <div className="relative w-48 text-right">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={assaySearch}
                  onChange={(e) => setAssaySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 pr-6 pl-2 text-[11px] text-white outline-none"
                />
                <Search className="absolute right-1.5 top-2 w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 font-bold text-xs text-emerald-400 flex justify-between items-center">
                <span>{t.assayLedgerTab}</span>
                <button
                  type="button"
                  onClick={handleExportAssayLogsExcel}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-800 rounded flex items-center gap-1 text-[9.5px] font-bold cursor-pointer transition-all"
                  title={isArabic ? "تحميل عينة إكسل منفصل لهذا القسم" : "Download separate Excel sheet for this division"}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isArabic ? "تحميل إكسل" : "Download Excel"}</span>
                </button>
              </div>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                {filteredAssayLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-555 text-xs">{isArabic ? "لا توجد حركات ششنه مسجلة." : "No assays on ledger logs."}</div>
                ) : (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-805">
                      <tr>
                        <th className="p-2.5">{t.date}</th>
                        <th className="p-2.5">{t.client}</th>
                        <th className="p-2.5 text-center">{t.weight}</th>
                        <th className="p-2.5 text-center">{t.karat}</th>
                        <th className="p-2.5 text-center">{t.total}</th>
                        <th className="p-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {filteredAssayLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 text-[11px]">
                          <td className="p-2.5 font-mono text-slate-500">{log.date}</td>
                          <td className="p-2.5 font-bold text-slate-100 whitespace-nowrap">{log.clientName || log.customerName || "-"}</td>
                          <td className="p-2.5 text-center font-mono">{log.actualWeight.toFixed(2)}g</td>
                          <td className="p-2.5 text-center font-mono text-slate-400">
                            {log.currentKarat ? `${log.currentKarat}K (${log.detectedKarat})` : log.detectedKarat}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-450">+{formatCurrency(log.assayFeeCollected || log.assayFee || 0, isArabic)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => {
                                showConfirm(
                                  isArabic ? "حذف قيد الششنة الكاش المفرد هذا؟" : "Delete custom assay log?",
                                  () => {
                                    onDeleteAssayLog(log.id);
                                  }
                                );
                              }}
                              className="text-slate-500 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
