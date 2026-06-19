/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyGoldPrices {
  gold24: number;
  gold22: number;
  gold21: number;
  gold18: number;
}

export interface Dealer {
  id: string;
  nameAr: string;
  nameEn: string;
  phone?: string;
}

export interface DealerStatementItem {
  id: string;
  date: string;
  type: 'loan_received' | 'loan_paid_cash' | 'gold_sold_to_dealer' | 'gold_received_from_dealer';
  descriptionAr: string;
  descriptionEn: string;
  cashAmount: number; // Positive for cash we received, Negative for cash we paid back
  actualWeight: number; // Positive for weight we delivered to dealer, Negative for weight we received
  karatValue: number;
  equivalentWeight21: number; // positive/negative depending on direction
  price21: number;
  goldValue: number; // positive/negative
}

export interface PurchaseItem {
  id: string;
  date: string;
  customerName: string;
  actualWeight: number;
  detectedKarat: number; // can be e.g. 842 or 21 (if <= 24, converted to millesimal)
  currentKarat?: number; // Commercial / rough category karat (e.g. 21, 18, 24)
  equivalentWeight21: number; // calculated at 875 ref
  price21: number;
  goldValue: number; // equivalentWeight21 * price21
  assayFee: number; // goes to assay ledger & flows to private cash wallet
  brokerFee: number; // transaction-specific expense
}

export interface SaleItem {
  id: string;
  date: string;
  dealerId: string;
  actualWeight: number;
  detectedKarat: number; // can be e.g. 852
  currentKarat?: number; // Commercial / rough category karat (e.g. 21, 18, 24)
  equivalentWeight21: number;
  price21: number;
  goldValue: number;
}

export interface PublicExpenseItem {
  id: string;
  date: string;
  titleAr: string;
  titleEn: string;
  category: 'overhead' | 'transaction'; // overhead = general, transaction = linked
  amount: number;
  notes?: string;
}

export interface PrivateWalletTransaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'purchase_payment' | 'sale_receipt' | 'assay_fee_income' | 'expense_overhead' | 'broker_fee_payment' | 'loan_cash_received' | 'loan_cash_paid' | 'partner_dividend_payout' | 'partner_capital_injection';
  descriptionAr: string;
  descriptionEn: string;
  amount: number; // positive for income, negative for outflow
}

export interface AssayLogItem {
  id: string;
  date: string;
  customerName?: string;
  clientName?: string;
  actualWeight: number;
  detectedKarat: number;
  currentKarat?: number;
  assayFee?: number;
  assayFeeCollected?: number;
}

export interface Workshop {
  id: string;
  nameAr: string;
  nameEn: string;
  managerAr?: string;
  managerEn?: string;
  phone?: string;
}

export interface WorkshopTransaction {
  id: string;
  workshopId: string;
  date: string;
  type: 'purchase' | 'sale' | 'cash_deposit' | 'cash_withdrawal' | 'gold_deposit' | 'gold_withdrawal';
  customerName?: string;
  dealerId?: string; // sold to which dealer on behalf of workshop
  actualWeight: number;
  detectedKarat: number;
  equivalentWeight21: number;
  price21: number;
  goldValue: number;
  assayFee: number;
  brokerFee: number;
  cashAmount: number; // positive for cash arriving at workshop balance, negative for paid out/withdrawn
  descriptionAr: string;
  descriptionEn: string;
}

export interface PartnerTransaction {
  id: string;
  date: string;
  type: 'capital_inject' | 'dividend_withdraw'; // capital injection or cash reward/withdrawal
  amount: number;
  descriptionAr: string;
  descriptionEn: string;
}

export interface Partner {
  id: string;
  nameAr: string;
  nameEn: string;
  phone?: string;
  sharePercent: number; // overall direct profit/loss ratio of the company (e.g. 15 for 15%)
  capitalContributed: number; // Total core seed money
  transactions: PartnerTransaction[];
  contractNotesAr?: string; // Special agreement note in Arabic
  contractNotesEn?: string; // Special agreement note in English
}


