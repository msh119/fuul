import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";
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
} from "./types";
import { formatCurrency, formatWeight } from "./utils";

// Initialize Firebase App and Auth once
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Token was cleared or didn't persist in memory (tab refreshed)
        // User is logged in but we need to sign in again or prompt.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In trigger (Must be called on button click/interaction)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error("Failed to extract Google Access Token from Firebase Credential");
    }
    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error) {
    console.error("Firebase Google Auth Sign-In failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log Out Helper
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getCachedToken = () => cachedAccessToken;

// REST API Helpers for Sheet Operations
export interface SheetSyncOptions {
  dealers: Dealer[];
  dealerStatements: DealerStatementItem[];
  purchases: PurchaseItem[];
  sales: SaleItem[];
  expenses: PublicExpenseItem[];
  walletTransactions: PrivateWalletTransaction[];
  assayLogs: AssayLogItem[];
  workshops?: Workshop[];
  workshopTransactions?: WorkshopTransaction[];
  isArabic: boolean;
}

// Check spreadsheet existence and verify we can read it, or create a brand new one
export const getOrCreateSpreadsheet = async (accessToken: string, isArabic: boolean): Promise<{ id: string; url: string }> => {
  const existingId = localStorage.getItem("pyramids_google_spreadsheet_id");
  if (existingId) {
    try {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${existingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        return { id: existingId, url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${existingId}` };
      }
    } catch (e) {
      console.warn("Stored spreadsheet not accessible, creating a new one...", e);
    }
  }

  // Create sheet with designated tabs
  const sheetsConfig = [
    { properties: { title: isArabic ? "مراكز الموازين والعهدة" : "Dashboard Metrics" } },
    { properties: { title: isArabic ? "شراء الذهب - Purchases" : "Gold Purchases" } },
    { properties: { title: isArabic ? "مبيعات الصاغة - Sales" : "Gold Sales" } },
    { properties: { title: isArabic ? "حسابات التجار - Dealers" : "Dealers" } },
    { properties: { title: isArabic ? "كشوفات ذمم التجار - Statements" : "Dealer Statements" } },
    { properties: { title: isArabic ? "المصروفات - Expenses" : "Overhead Expenses" } },
    { properties: { title: isArabic ? "فحوصات المعمل - Assay Logs" : "Assay Diagnostics" } },
    { properties: { title: isArabic ? "صندوق الخزنة - Cash Box" : "Private Cash Ledger" } },
    { properties: { title: isArabic ? "حسابات الورش والمسابك - Workshops" : "Workshops" } },
    { properties: { title: isArabic ? "حركات الورش - Workshop Transactions" : "Workshop Ledger" } }
  ];

  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title: isArabic ? "سجلات دفاتر مؤسسة الأهرام للذهب" : "Refinement Ledger Suite (Pyramids Gold)"
      },
      sheets: sheetsConfig
    })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errorText}`);
  }

  const createdSpreadsheet = await createRes.json();
  const newId = createdSpreadsheet.spreadsheetId;
  const newUrl = createdSpreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newId}`;

  localStorage.setItem("pyramids_google_spreadsheet_id", newId);
  return { id: newId, url: newUrl };
};

// Batch Clearing and Synchronizing of Entire database
export const syncAllLedgersToGoogleSheets = async (
  accessToken: string,
  spreadsheetId: string,
  options: SheetSyncOptions
): Promise<void> => {
  const {
    dealers,
    dealerStatements,
    purchases,
    sales,
    expenses,
    walletTransactions,
    assayLogs,
    workshops = [],
    workshopTransactions = [],
    isArabic
  } = options;

  // Let's do clear on all specific tabs first to prevent leftovers
  const sheetNames = [
    isArabic ? "مراكز الموازين والعهدة" : "Dashboard Metrics",
    isArabic ? "شراء الذهب - Purchases" : "Gold Purchases",
    isArabic ? "مبيعات الصاغة - Sales" : "Gold Sales",
    isArabic ? "حسابات التجار - Dealers" : "Dealers",
    isArabic ? "كشوفات ذمم التجار - Statements" : "Dealer Statements",
    isArabic ? "المصروفات - Expenses" : "Overhead Expenses",
    isArabic ? "فحوصات المعمل - Assay Logs" : "Assay Diagnostics",
    isArabic ? "صندوق الخزنة - Cash Box" : "Private Cash Ledger",
    isArabic ? "حسابات الورش والمسابك - Workshops" : "Workshops",
    isArabic ? "حركات الورش - Workshop Transactions" : "Workshop Ledger"
  ];

  const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ranges: sheetNames.map((name) => `'${name}'!A1:Z5000`)
    })
  });

  if (!clearRes.ok) {
    throw new Error("Failed to clear prior data tables in sheets.");
  }

  // Define sheets payload inputs
  const data = [];

  // Sheet 1: Dashboard Metrics
  const netSafeActual = purchases.reduce((acc, p) => acc + p.actualWeight, 0) -
    dealerStatements.reduce((acc, ds) => acc + ds.actualWeight, 0);
  const netSafeEquivalent = purchases.reduce((acc, p) => acc + p.equivalentWeight21, 0) -
    dealerStatements.reduce((acc, ds) => acc + ds.equivalentWeight21, 0);
  const absoluteWalletCash = walletTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalPurchasesGoldValue = purchases.reduce((acc, p) => acc + p.goldValue, 0);
  const totalSalesGoldValue = sales.reduce((acc, s) => acc + s.goldValue, 0);
  const totalAssayRevenues = assayLogs.reduce((acc, l) => acc + (l.assayFee || l.assayFeeCollected || 0), 0);
  const totalBrokerFees = purchases.reduce((acc, p) => acc + p.brokerFee, 0);
  const totalOverheadExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalSalesGoldValue - totalPurchasesGoldValue + totalAssayRevenues - totalBrokerFees - totalOverheadExpenses;

  const dashboardRows = [
    [isArabic ? "المطابقة والمؤشرات الحية للأهرام" : "Pyramids Active Operational KPI Log", "", ""],
    [],
    [isArabic ? "المؤشر الجاري" : "Operational KPI Title", isArabic ? "القيمة الرقمية" : "Numerical Value", isArabic ? "الوحدة / العملة" : "Unit / Details"],
    [isArabic ? "رصيد الذهب الفعلي الحالي بالخزنة" : "Live Net Gold Actual Stock", netSafeActual.toFixed(3), isArabic ? "جرام خام" : "g actual"],
    [isArabic ? "رصيد الذهب المعادل للعيار ٢١ بالخزنة" : "Live 21K Equiv Stock", netSafeEquivalent.toFixed(3), isArabic ? "جرام معادل" : "g equiv 21K"],
    [isArabic ? "المبلغ المتوفر بصندوق الخزنة النقدية" : "Private Vault Box Cash Balance", absoluteWalletCash, "EGP"],
    [isArabic ? "الصافي الجاري للأرباح والمكاسب المشتركة" : "Net Working Business Profit", netProfit, "EGP"],
    [],
    [isArabic ? "إجمالي الوارد الكلي الفعلي" : "Total Raw Material Accumulated Incoming", purchases.reduce((acc, p) => acc + p.actualWeight, 0).toFixed(3), isArabic ? "جرام" : "g"],
    [isArabic ? "إجمالي الصادر للصاغة الفعلي" : "Total Material Outsourced to Dealers", sales.reduce((acc, s) => acc + s.actualWeight, 0).toFixed(3), isArabic ? "جرام" : "g"]
  ];

  data.push({
    range: `'${sheetNames[0]}'!A1`,
    values: dashboardRows
  });

  // Sheet 2: Purchases
  const purchasesHeader = [
    isArabic ? "كود الفاتورة" : "ID",
    isArabic ? "التاريخ" : "Date",
    isArabic ? "اسم العميل" : "Customer Name",
    isArabic ? "الوزن الخام (جرام)" : "Actual Weight (g)",
    isArabic ? "عيار الفحص (ملم)" : "Detected Karat/Finess",
    isArabic ? "الوزن المعادل ٢١ (g)" : "21K Equiv Weight (g)",
    isArabic ? "سعر عيار ٢١ المرجعي" : "Price 21 (EGP)",
    isArabic ? "قيمة الذهب الإجمالية" : "Gold Value (EGP)",
    isArabic ? "رسم الششنة / المعمل" : "Assay Fee (EGP)",
    isArabic ? "عمولة السمسار المدفوعة" : "Broker Fee Paid (EGP)"
  ];
  const purchasesRows = purchases.map((p) => [
    p.id,
    p.date,
    p.customerName,
    p.actualWeight,
    p.detectedKarat,
    p.equivalentWeight21,
    p.price21,
    p.goldValue,
    p.assayFee,
    p.brokerFee
  ]);
  data.push({
    range: `'${sheetNames[1]}'!A1`,
    values: [purchasesHeader, ...purchasesRows]
  });

  // Sheet 3: Sales
  const salesHeader = [
    isArabic ? "كود الفاتورة" : "ID",
    isArabic ? "التاريخ" : "Date",
    isArabic ? "التاجر المسوق له" : "Dealer Name",
    isArabic ? "الوزن الخام المباع (g)" : "Actual Weight Sold (g)",
    isArabic ? "العيار الفعلي" : "Detected Karat",
    isArabic ? "الوزن المعادل ٢١ (g)" : "21K Equiv Weight (g)",
    isArabic ? "سعر عيار ٢١ للتاجر" : "Price 21 (EGP)",
    isArabic ? "قيمة الذهب الإجمالية" : "Calculated Gold Value (EGP)"
  ];
  const salesRows = sales.map((s) => {
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
  data.push({
    range: `'${sheetNames[2]}'!A1`,
    values: [salesHeader, ...salesRows]
  });

  // Sheet 4: Dealers
  const dealersHeader = [
    isArabic ? "كود التاجر" : "Dealer ID",
    isArabic ? "الاسم بالعربية" : "Name (Arabic)",
    isArabic ? "الاسم بالإنجليزية" : "Name (English)",
    isArabic ? "رقم الهاتف والاتصال" : "Phone"
  ];
  const dealersRows = dealers.map((d) => [
    d.id,
    d.nameAr,
    d.nameEn,
    d.phone || ""
  ]);
  data.push({
    range: `'${sheetNames[3]}'!A1`,
    values: [dealersHeader, ...dealersRows]
  });

  // Sheet 5: Dealer Statements
  const statementsHeader = [
    isArabic ? "كود المعاملة" : "Transaction ID",
    isArabic ? "التاريخ" : "Date",
    isArabic ? "نوع الحركة" : "Type",
    isArabic ? "البيان بالعربية" : "Description (Ar)",
    isArabic ? "البيان بالإنجليزية" : "Description (En)",
    isArabic ? "النقدية نقدًا (EGP)" : "Cash flow (EGP)",
    isArabic ? "الوزن الخام الفعلي (g)" : "Material Raw Delivered (g)",
    isArabic ? "قيمة العيار للششنة" : "Karat/Fineness",
    isArabic ? "الوزن معادل ٢١ (g)" : "21K Equiv (g)",
    isArabic ? "سعر غرام ٢١" : "Gram 21 price",
    isArabic ? "الصافي المحتسب للذهب" : "Equivalent Gold Value"
  ];
  const statementsRows = dealerStatements.map((ds) => [
    ds.id,
    ds.date,
    ds.type,
    ds.descriptionAr,
    ds.descriptionEn,
    ds.cashAmount,
    ds.actualWeight,
    ds.karatValue,
    ds.equivalentWeight21,
    ds.price21,
    ds.goldValue
  ]);
  data.push({
    range: `'${sheetNames[4]}'!A1`,
    values: [statementsHeader, ...statementsRows]
  });

  // Sheet 6: Expenses
  const expensesHeader = [
    isArabic ? "معرف المصروف" : "ID",
    isArabic ? "التاريخ" : "Date",
    isArabic ? "البند بالعربية" : "Title (Ar)",
    isArabic ? "البند بالإنجليزية" : "Title (En)",
    isArabic ? "نوع النفقة" : "Type",
    isArabic ? "المقدار المالي" : "Amount (EGP)",
    isArabic ? "ملاحظات وتفاصيل" : "Notes"
  ];
  const expensesRows = expenses.map((e) => [
    e.id,
    e.date,
    e.titleAr,
    e.titleEn,
    e.category,
    e.amount,
    e.notes || ""
  ]);
  data.push({
    range: `'${sheetNames[5]}'!A1`,
    values: [expensesHeader, ...expensesRows]
  });

  // Sheet 7: Assay Logs
  const assayHeader = [
    isArabic ? "رقم الفحص" : "Test ID",
    isArabic ? "التاريخ" : "Date",
    isArabic ? "اسم طالب الفحص" : "Customer / Client Name",
    isArabic ? "وزن عينة الفحص (g)" : "Sample actual weight (g)",
    isArabic ? "العيار المحدد نموذجياً" : "Karat detected",
    isArabic ? "رسم الفحص المحصل" : "Assay Fee collected"
  ];
  const assayRows = assayLogs.map((al) => [
    al.id,
    al.date,
    al.customerName || al.clientName || "",
    al.actualWeight,
    al.detectedKarat,
    al.assayFee || al.assayFeeCollected || 0
  ]);
  data.push({
    range: `'${sheetNames[6]}'!A1`,
    values: [assayHeader, ...assayRows]
  });

  // Sheet 8: Wallet Cash Transactions
  const walletHeader = [
    isArabic ? "كود التداول" : "ID",
    isArabic ? "التاريخ" : "Date",
    isArabic ? "القيد الافتراضي" : "Type",
    isArabic ? "الحساب بالعربية" : "Label (Arabic)",
    isArabic ? "الحساب بالإنجليزية" : "Label (English)",
    isArabic ? "حركة الخزينة (EGP)" : "Amount change (EGP)"
  ];
  const walletRows = walletTransactions.map((tx) => [
    tx.id,
    tx.date,
    tx.type,
    tx.descriptionAr,
    tx.descriptionEn,
    tx.amount
  ]);
  data.push({
    range: `'${sheetNames[7]}'!A1`,
    values: [walletHeader, ...walletRows]
  });

  // Sheet 9: Workshops
  const workshopsHeader = [
    isArabic ? "كود الورشة" : "Workshop ID",
    isArabic ? "الاسم بالعربية" : "Name (Ar)",
    isArabic ? "الاسم بالإنجليزية" : "Name (En)",
    isArabic ? "أمين المستودع" : "Manager (Ar)",
    isArabic ? "أمين المستودع بالإنجليزية" : "Manager (En)",
    isArabic ? "الهاتف" : "Phone"
  ];
  const workshopsRows = workshops.map((w) => [
    w.id,
    w.nameAr,
    w.nameEn,
    w.managerAr || "",
    w.managerEn || "",
    w.phone || ""
  ]);
  data.push({
    range: `'${sheetNames[8]}'!A1`,
    values: [workshopsHeader, ...workshopsRows]
  });

  // Sheet 10: Workshop Transactions
  const wsTxHeader = [
    isArabic ? "كود الحركة" : "Tx ID",
    isArabic ? "التاريخ" : "Date",
    isArabic ? "كود الورشة" : "Workshop ID",
    isArabic ? "نوع الحركة" : "Type",
    isArabic ? "العميل / التاجر" : "Customer / Dealer",
    isArabic ? "الوزن الفعلي (جرام)" : "Actual Weight (g)",
    isArabic ? "العيار" : "Detected Karat",
    isArabic ? "المعادل ٢١ (جرام)" : "21K Equivalent",
    isArabic ? "سعر عيار ٢١ للغرام" : "Gram Price 21",
    isArabic ? "المبلغ المالي الكاش" : "Cash change (EGP)",
    isArabic ? "البيان بالعربية" : "Arabic Memo",
    isArabic ? "البيان بالإنجليزية" : "English Memo"
  ];
  const wsTxRows = workshopTransactions.map((t) => [
    t.id,
    t.date,
    t.workshopId,
    t.type,
    t.customerName || t.dealerId || "",
    t.actualWeight,
    t.detectedKarat,
    t.equivalentWeight21,
    t.price21,
    t.cashAmount,
    t.descriptionAr,
    t.descriptionEn
  ]);
  data.push({
    range: `'${sheetNames[9]}'!A1`,
    values: [wsTxHeader, ...wsTxRows]
  });

  // Post batch values update
  const syncRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: data
    })
  });

  if (!syncRes.ok) {
    const errorText = await syncRes.text();
    throw new Error(`Google Sheets sync command failed: ${errorText}`);
  }
};

/**
 * Scans localStorage and packages all Pyramids-related data into a JSON structure
 */
export const getFullBackupData = (): any => {
  const backup: any = {
    _backup_app_id: "pyramids_gold",
    _backup_timestamp: new Date().toISOString(),
  };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("pyramids_")) {
      if (key === "pyramids_partners_unlocked_session") continue;
      try {
        const val = localStorage.getItem(key);
        if (val) {
          backup[key] = JSON.parse(val);
        }
      } catch (e) {
        // Fallback for string preferences
        backup[key] = localStorage.getItem(key);
      }
    }
  }
  return backup;
};

/**
 * Restores all Pyramids-related data from a JSON structure to localStorage
 */
export const restoreFullBackupData = (backup: any): boolean => {
  if (!backup || backup._backup_app_id !== "pyramids_gold") {
    return false;
  }
  
  // Clean existing pyramids data to avoid conflicts, except spreadsheet configuration or unlocked sessions
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("pyramids_") && key !== "pyramids_google_spreadsheet_id" && key !== "pyramids_partners_unlocked_session") {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // Write new data
  Object.keys(backup).forEach((key) => {
    if (key.startsWith("pyramids_")) {
      const val = backup[key];
      if (typeof val === "object" && val !== null) {
        localStorage.setItem(key, JSON.stringify(val));
      } else if (val !== undefined && val !== null) {
        localStorage.setItem(key, String(val));
      }
    }
  });
  return true;
};

/**
 * Saves a full backup JSON object to the user's Google Drive as pyramids_gold_backup.json
 */
export const backupToGoogleDrive = async (accessToken: string, backupData: any): Promise<void> => {
  // 1. Search if file already exists
  const searchRes = await fetch("https://www.googleapis.com/drive/v3/files?q=name='pyramids_gold_backup.json'+and+trashed=false", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Failed to query Google Drive files: ${errorText}`);
  }

  const searchData = await searchRes.json();
  const files = searchData.files || [];
  let fileId = "";

  if (files.length > 0) {
    fileId = files[0].id;
  } else {
    // Create new file metadata
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "pyramids_gold_backup.json",
        mimeType: "application/json"
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create Google Drive file metadata: ${errorText}`);
    }

    const createdData = await createRes.json();
    fileId = createdData.id;
  }

  // 2. Upload file content
  const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(backupData, null, 2)
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Failed to upload backup content to Google Drive: ${errorText}`);
  }
};

/**
 * Downloads pyramids_gold_backup.json from the user's Google Drive and returns the JSON content
 */
export const restoreFromGoogleDrive = async (accessToken: string): Promise<any> => {
  // 1. Find file
  const searchRes = await fetch("https://www.googleapis.com/drive/v3/files?q=name='pyramids_gold_backup.json'+and+trashed=false", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Failed to query Google Drive: ${errorText}`);
  }

  const searchData = await searchRes.json();
  const files = searchData.files || [];

  if (files.length === 0) {
    return null;
  }

  const fileId = files[0].id;

  // 2. Download contents
  const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!downloadRes.ok) {
    const errorText = await downloadRes.text();
    throw new Error(`Failed to download backup file from Google Drive: ${errorText}`);
  }

  return await downloadRes.json();
};

