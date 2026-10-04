import React, { useState } from 'react';
import { UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';
import { X, Sparkles, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getPermanentUsedCodes } from '../utils/codeStorage';

interface BuyMentalMathTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onAddMentalMathTime: (seconds: number, costLiras: number, code: string) => boolean;
}

export const BuyMentalMathTimeModal: React.FC<BuyMentalMathTimeModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onAddMentalMathTime,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<{ seconds: number; cost: number } | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRedeemTimeCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedPackage) return;

    const trimmedCode = promoCodeInput.trim();

    // Must start with 789 for mental math time upgrades as requested
    if (!trimmedCode.startsWith('789')) {
      soundFx.playWrongSound();
      setErrorMsg('هناك خطأ في كود شحن وقت الحساب الذهني الخاص بك!');
      return;
    }

    if (!/^\d+$/.test(trimmedCode)) {
      soundFx.playWrongSound();
      setErrorMsg('الكود يجب أن يتكون من أرقام فقط');
      return;
    }

    if (trimmedCode.length < 10 || trimmedCode.length > 20) {
      soundFx.playWrongSound();
      setErrorMsg('طول كود الترقية غير صحيح');
      return;
    }

    const permanentUsedCodes = getPermanentUsedCodes();
    if (gameState.usedCodes.includes(trimmedCode) || permanentUsedCodes.includes(trimmedCode)) {
      soundFx.playWrongSound();
      setErrorMsg('تم استخدام هذا الكود مسبقاً ولن يعمل مجدداً');
      return;
    }

    if (gameState.liras < selectedPackage.cost) {
      soundFx.playWrongSound();
      setErrorMsg('أنت لا تملك ليرات كافية لشراء هذا الوقت!');
      return;
    }

    const success = onAddMentalMathTime(selectedPackage.seconds, selectedPackage.cost, trimmedCode);
    if (success) {
      soundFx.playUpgradeSound();
      setSuccessMsg(`⏱️ تمت إضافة +${selectedPackage.seconds} ثوانٍ دائمة للحساب الذهني بنجاح!`);
      setPromoCodeInput('');
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedPackage(null);
        onClose();
      }, 2500);
    } else {
      soundFx.playWrongSound();
      setErrorMsg('حدث خطأ أثناء إتمام عملية الشراء');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#09152b] via-[#050b18] to-slate-950 border-2 border-blue-500/60 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(59,130,246,0.5)] max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/40 rounded-2xl text-blue-300">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">شراء وقت الحساب الذهني ⏱️</h2>
              <p className="text-xs text-blue-300">رصيدك: <span className="text-amber-300 font-bold">{gameState.liras} ليرة</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full cursor-pointer border border-blue-500/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {!selectedPackage ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Option 1: 5 seconds for 10 liras */}
              <div
                onClick={() => {
                  setSelectedPackage({ seconds: 5, cost: 10 });
                  setPromoCodeInput('');
                  setErrorMsg(null);
                }}
                className="bg-[#101c3d] border border-blue-500/40 hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-105 shadow-lg group"
              >
                <div className="text-2xl font-black text-cyan-300 mb-1">+5 ثوانٍ</div>
                <div className="text-xs text-amber-300 font-bold mb-4">10 ليرات</div>
                <span className="text-[11px] px-3 py-1 bg-blue-900/60 text-blue-200 border border-blue-400/30 rounded-full block font-bold">
                  شراء الوقت ←
                </span>
              </div>

              {/* Option 2: 10 seconds for 20 liras */}
              <div
                onClick={() => {
                  setSelectedPackage({ seconds: 10, cost: 20 });
                  setPromoCodeInput('');
                  setErrorMsg(null);
                }}
                className="bg-[#101c3d] border border-indigo-500/50 hover:border-indigo-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-105 shadow-lg group"
              >
                <div className="text-2xl font-black text-purple-300 mb-1">+10 ثوانٍ</div>
                <div className="text-xs text-amber-300 font-bold mb-4">20 ليرة</div>
                <span className="text-[11px] px-3 py-1 bg-purple-900/60 text-purple-200 border border-purple-400/30 rounded-full block font-bold">
                  شراء الوقت ←
                </span>
              </div>

              {/* Option 3: 15 seconds for 33 liras */}
              <div
                onClick={() => {
                  setSelectedPackage({ seconds: 15, cost: 33 });
                  setPromoCodeInput('');
                  setErrorMsg(null);
                }}
                className="bg-[#101c3d] border border-amber-500/60 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)] group"
              >
                <div className="text-2xl font-black text-yellow-300 mb-1">+15 ثانية</div>
                <div className="text-xs text-amber-300 font-bold mb-4">33 ليرة</div>
                <span className="text-[11px] px-3 py-1 bg-amber-500/20 text-yellow-300 border border-amber-400/40 rounded-full block font-bold">
                  شراء الوقت ←
                </span>
              </div>

            </div>
          ) : (
            /* Code Input Screen for Mental Math Time */
            <div className="bg-[#0b1429] border border-blue-400/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <h4 className="font-black text-white text-base">
                    شراء زيادة {selectedPackage.seconds} ثوانٍ دائمية ({selectedPackage.cost} ليرة)
                  </h4>
                  <p className="text-[11px] text-slate-300">أدخل كود شحن وقت الحساب الذهني:</p>
                </div>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="text-xs text-blue-400 hover:text-white underline cursor-pointer"
                >
                  تغيير الخيار
                </button>
              </div>

              <form onSubmit={handleRedeemTimeCode} className="space-y-3">
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute right-3 top-3.5 text-blue-400" />
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="أدخل كود الشحن..."
                    className="w-full py-3 pr-10 pl-4 bg-[#050a14] border-2 border-blue-400/50 focus:border-blue-400 rounded-xl text-white font-mono text-center tracking-widest text-lg outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>تأكيد وشحن الوقت الدائم ({selectedPackage.cost} ليرة)</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
