/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert, AlertCircle, CheckCircle2, X } from "lucide-react";

interface CustomModalProps {
  isOpen: boolean;
  type: "confirm" | "alert";
  message: string;
  isArabic: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function CustomModal({
  isOpen,
  type,
  message,
  isArabic,
  onConfirm,
  onCancel,
  onClose,
}: CustomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir={isArabic ? "rtl" : "ltr"}>
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 text-slate-100 flex flex-col gap-4 transform scale-100 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon + Message */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${type === "confirm" ? "bg-amber-500/10 text-amber-500" : "bg-cyan-500/10 text-cyan-400"}`}>
            {type === "confirm" ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          
          <div className="space-y-1 py-1 flex-1">
            <h3 className="text-sm font-black text-white">
              {type === "confirm" 
                ? (isArabic ? "تأكيد الإجراء المطلوب" : "Confirm Requested Action")
                : (isArabic ? "إشعار النظام" : "System Notification")
              }
            </h3>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          <button 
            type="button" 
            onClick={type === "confirm" ? onCancel || onClose : onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-2 text-xs font-black">
          {type === "confirm" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onCancel) onCancel();
                  onClose();
                }}
                className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 py-2 px-4 rounded-lg transition-colors border border-slate-700/50"
              >
                {isArabic ? "إلغاء الأمر" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 px-5 rounded-lg transition-colors shadow-md shadow-amber-500/15"
              >
                {isArabic ? "تأكيد نعم" : "Confirm Yes"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-2 px-6 rounded-lg transition-colors font-black"
            >
              {isArabic ? "موافق" : "OK"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
