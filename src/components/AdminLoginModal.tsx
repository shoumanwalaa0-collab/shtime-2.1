import React, { useState } from 'react';
import { UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';
import { X, KeyRound, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  setGameState: React.Dispatch<React.SetStateAction<UserGameState>>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  gameState,
  setGameState,
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const ADMIN_SECRET_CODE = '7813008';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (code.trim() !== ADMIN_SECRET_CODE) {
      soundFx.playWrongSound();
      setErrorMsg('❌ الكود سري وغير صحيح! لا يمكنك الحصول على صلاحيات الأدمن.');
      return;
    }

    soundFx.playWinSound();
    setSuccessMsg('🎉 تم التحقق من كود الأدمن بنجاح وتفعيل الصلاحيات الإدارية! (تنبيه أمني: تم حظر منح الأموال المجانية نهائياً - لا يمكن لأي شخص الحصول مجاناً على مال).');

    // Admin authorization activated WITHOUT free money!
    // Per user order: "ألغى prom و لا يمكن لاي شخص حصل مجان على مال"
    setGameState((prev) => ({
      ...prev,
      isAdmin: true,
    }));

    setTimeout(() => {
      setSuccessMsg(null);
      setCode('');
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in select-none" dir="rtl">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a0f02] via-[#0d0701] to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.6)] text-white">
        
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-300">لوحة دخول الأدمن 🔐</h2>
              <p className="text-[11px] text-amber-200/70">أدخل الكود السري الخاص بالمشرفين</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-amber-300 hover:text-white bg-slate-900 rounded-full border border-amber-500/30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Rule Notice */}
        <div className="mb-4 p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-[11px] font-bold text-center">
          ⚖️ قانون النظام المالي: لا يمكن لأي شخص الحصول مجاناً على مال. الأموال تُكتسب باللعب والتحدي فقط.
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/90 border border-red-500 text-red-200 font-black text-xs rounded-xl text-center shadow flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/95 border border-emerald-500 text-emerald-200 font-black text-xs rounded-xl text-center shadow flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-amber-200 mb-1">كود إثبات الأدمن:</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute right-3 top-3.5 text-amber-400" />
              <input
                type="password"
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="أدخل الكود السري هنا..."
                className="w-full py-3 pr-10 pl-4 bg-[#080601] border-2 border-amber-500/50 focus:border-amber-400 rounded-2xl text-white font-mono text-center text-lg outline-none"
                dir="ltr"
              />
            </div>
            <p className="text-[10px] text-amber-300/80 mt-1 text-center">
              💡 مخصص فقط للمشرفين المصرح لهم (لا يتضمن أي منح مالي مجاني).
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.6)] cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>تأكيد كود المشرف والدخول ⚡</span>
          </button>
        </form>

      </div>
    </div>
  );
};
