import React, { useState } from "react";
import { ShieldCheck, Lock, Delete, X, AlertCircle } from "lucide-react";

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isArabic: boolean;
}

export default function AdminPasscodeModal({ isOpen, onClose, onSuccess, isArabic }: AdminPasscodeModalProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  if (!isOpen) return null;

  const CORRECT_PIN = "202620";

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(false);
    setPin("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === CORRECT_PIN) {
      setPin("");
      setError(false);
      onSuccess();
    } else {
      setError(true);
      // Vibrate if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(150);
      }
    }
  };

  const handleKeyboardInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
      id="admin-passcode-overlay"
    >
      <div 
        className={`bg-slate-900 border ${error ? 'border-rose-500/50 shadow-rose-500/10' : 'border-slate-800 shadow-slate-950/60'} rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transition-all transform duration-300 scale-100 flex flex-col`}
        dir={isArabic ? "rtl" : "ltr"}
      >
        {/* HEADER BAR */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-850 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black text-slate-200 tracking-wider">
              {isArabic ? "المصادقة الأمنية لمدير النظام" : "Admin Permission Authorization"}
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-450 hover:text-white p-1 rounded-lg hover:bg-slate-850"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CORE VERIFICATION BOX */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <Lock className={`w-5 h-5 ${error ? "animate-bounce text-rose-500" : ""}`} />
          </div>

          <h3 className="text-sm font-black text-slate-100 text-center mb-1">
            {isArabic ? "أدخل رمز المرور لفتح لوحة المدير والتقارير" : "Security Lock: Enter Admin PIN"}
          </h3>
          <p className="text-[11px] text-slate-400 text-center mb-5 leading-normal max-w-[280px]">
            {isArabic 
              ? "الاطلاع على كشوفات الذمم، الحسابات الموحدة، وسجلات التقارير العامة يتطلب تأكيد كود المدير." 
              : "Access to statements, consolidated vaults, or general ledgers is restricted. Please enter pin."}
          </p>

          {/* DUMMY HIDDEN INPUT FOR KEYBOARD TYPING SUPPORT */}
          <input
            type="password"
            autoFocus
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 6) {
                setPin(val);
                setError(false);
              }
            }}
            onKeyDown={handleKeyboardInput}
            className="sr-only"
            aria-hidden="true"
          />

          {/* DOTS PREVIEW DISPLAY */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    isFilled 
                      ? "bg-amber-500 border-amber-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.4)]" 
                      : error 
                      ? "border-rose-500/40 bg-rose-950/10" 
                      : "border-slate-700 bg-slate-950"
                  }`}
                />
              );
            })}
          </div>

          {/* ERROR LABEL */}
          {error && (
            <div className="mb-4 text-xs font-bold text-rose-400 bg-rose-950/30 border border-rose-500/20 px-3 py-2 rounded-lg flex items-center gap-1.5 w-full animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{isArabic ? "الكود المدخل غير صحيح! يرجى إعادة المحاولة." : "Invalid passcode! Try again."}</span>
            </div>
          )}

          {/* CUSTOM VIRTUAL KEYPAD FOR MAXIMUM EASE */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-12 bg-slate-950 hover:bg-slate-800 text-slate-100 font-bold rounded-xl border border-slate-800 flex items-center justify-center transition-all active:scale-95 text-sm font-mono shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 bg-slate-950/40 hover:bg-slate-900 text-slate-450 hover:text-slate-300 font-medium rounded-xl border border-slate-850 flex items-center justify-center transition-colors text-[10px]"
            >
              {isArabic ? "مسح" : "Clear"}
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="h-12 bg-slate-950 hover:bg-slate-800 text-slate-100 font-extrabold rounded-xl border border-slate-800 flex items-center justify-center transition-all active:scale-95 text-sm font-mono shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 bg-slate-950/40 hover:bg-slate-900 text-slate-450 hover:text-slate-300 font-medium rounded-xl border border-slate-850 flex items-center justify-center transition-colors shadow-sm"
            >
              <Delete className="w-4 h-4 text-amber-500" />
            </button>
          </div>

          {/* CONFIRM BUTTON */}
          <button
            type="button"
            disabled={pin.length !== 6}
            onClick={() => handleSubmit()}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
              pin.length === 6 
                ? "bg-amber-500 text-slate-950 hover:bg-amber-450 shadow-lg shadow-amber-500/10 cursor-pointer" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isArabic ? "تفعيل صلاحية المدير" : "Unlock Admin Dashboard"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
