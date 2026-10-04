import React, { useState } from 'react';
import { UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';
import { X, Sparkles, ShieldCheck, KeyRound, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { getPermanentUsedCodes } from '../utils/codeStorage';

interface BuyJewelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onAddJewels: (amount: number, code: string) => boolean;
}

export const BuyJewelsModal: React.FC<BuyJewelsModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onAddJewels,
}) => {
  const [selectedBox, setSelectedBox] = useState<{ jewels: number; price: string; codeLength: number } | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRedeemJewelsCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedBox) return;

    const trimmedCode = promoCodeInput.trim();

    // Must start with 78
    if (!trimmedCode.startsWith('78')) {
      soundFx.playWrongSound();
      setErrorMsg('هناك خطأ في كود البطاقة البنكية الخاص بك!');
      return;
    }

    if (!/^\d+$/.test(trimmedCode)) {
      soundFx.playWrongSound();
      setErrorMsg('الكود يجب أن يتكون من أرقام فقط');
      return;
    }

    // Exact length rule matching the box: 14 for 1st, 15 for 2nd, 16 for 3rd
    if (trimmedCode.length !== selectedBox.codeLength) {
      soundFx.playWrongSound();
      setErrorMsg(`هذا الكود مخصص لـ ${selectedBox.codeLength} رقماً حسب الخيار المحدد`);
      return;
    }

    const permanentUsedCodes = getPermanentUsedCodes();
    if (gameState.usedCodes.includes(trimmedCode) || permanentUsedCodes.includes(trimmedCode)) {
      soundFx.playWrongSound();
      setErrorMsg('تم استخدام هذا الكود مسبقاً ولا يمكن استخدامه مرة أخرى');
      return;
    }

    const success = onAddJewels(selectedBox.jewels, trimmedCode);
    if (success) {
      soundFx.playCoinSound();
      setSuccessMsg(`✨ تم شحن وإضافة +${selectedBox.jewels} جوهرة ذهبية بنجاح!`);
      setPromoCodeInput('');
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedBox(null);
        onClose();
      }, 2500);
    } else {
      soundFx.playWrongSound();
      setErrorMsg('حدث خطأ أثناء الشحن');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1a1505] via-[#0d0a02] to-slate-950 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.5)] max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/50 rounded-2xl text-amber-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-200">
                شراء المجوهرات الذهبية اللامعة ✨
              </h2>
              <p className="text-xs text-amber-200/80">رصيدك الحالي: <span className="text-yellow-300 font-bold">{gameState.jewels} جوهرة</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full cursor-pointer border border-amber-500/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* THE PROMINENT WHITE LINE with generous margins */}
        <div className="w-full my-4 sm:my-5 shrink-0">
          <div className="w-full h-1.5 sm:h-2 bg-white shadow-[0_0_25px_rgba(255,255,255,0.95)] rounded-full" />
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
          {!selectedBox ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Box 1: 5 Jewels for $6 (14 digits code) */}
              <div
                onClick={() => {
                  setSelectedBox({ jewels: 5, price: '6 دولار', codeLength: 14 });
                  setPromoCodeInput('');
                  setErrorMsg(null);
                }}
                className="bg-gradient-to-br from-[#2a2004] via-[#151002] to-slate-950 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-105 shadow-lg group relative overflow-hidden"
              >
                <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                  14 رقماً
                </div>
                <div className="text-3xl font-black text-amber-300 mb-1 flex items-center justify-center gap-1">
                  <span>💎</span>
                  <span>5 مجوهرات</span>
                </div>
                <div className="text-xs text-yellow-200 font-bold mb-4">مقابل 6 دولارات</div>
                <span className="text-[11px] px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full block font-bold">
                  شراء بالكود ←
                </span>
              </div>

              {/* Box 2: 10 Jewels for $10 (15 digits code) */}
              <div
                onClick={() => {
                  setSelectedBox({ jewels: 10, price: '10 دولار', codeLength: 15 });
                  setPromoCodeInput('');
                  setErrorMsg(null);
                }}
                className="bg-gradient-to-br from-[#2a2004] via-[#151002] to-slate-950 border-2 border-yellow-400/60 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-105 shadow-lg group relative overflow-hidden"
              >
                <div className="absolute top-2 right-2 bg-yellow-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                  15 رقماً
                </div>
                <div className="text-3xl font-black text-yellow-300 mb-1 flex items-center justify-center gap-1">
                  <span>💎</span>
                  <span>10 مجوهرات</span>
                </div>
                <div className="text-xs text-yellow-200 font-bold mb-4">مقابل 10 دولارات</div>
                <span className="text-[11px] px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 rounded-full block font-bold">
                  شراء بالكود ←
                </span>
              </div>

              {/* Box 3: 30 Jewels for $15 (16 digits code - Most popular with $5 discount) */}
              <div
                onClick={() => {
                  setSelectedBox({ jewels: 30, price: '15 دولار', codeLength: 16 });
                  setPromoCodeInput('');
                  setErrorMsg(null);
                }}
                className="bg-gradient-to-br from-[#332502] via-[#1f1701] to-slate-950 border-2 border-amber-300 hover:border-yellow-200 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-105 shadow-[0_0_25px_rgba(245,158,11,0.4)] group relative overflow-hidden"
              >
                <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow">
                  🔥 خصم 5$
                </div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 mb-1 flex items-center justify-center gap-1">
                  <span>💎</span>
                  <span>30 جوهرة</span>
                </div>
                <div className="text-xs text-amber-300 font-bold mb-4">مقابل 15 دولاراً (الأكثر طلباً)</div>
                <span className="text-[11px] px-3 py-1 bg-amber-400 text-slate-950 rounded-full block font-black shadow">
                  شراء بالكود المميز ←
                </span>
              </div>

            </div>
          ) : (
            /* Code Input Screen for selected Box */
            <div className="bg-[#120d02] border border-amber-400/50 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div>
                  <h4 className="font-black text-white text-base">
                    شراء {selectedBox.jewels} مجوهرات ({selectedBox.price})
                  </h4>
                  <p className="text-[11px] text-amber-300">
                    أدخل كود البطاقة البنكية المكون من {selectedBox.codeLength} رقماً:
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBox(null)}
                  className="text-xs text-amber-400 hover:text-white underline cursor-pointer"
                >
                  تغيير الخيار
                </button>
              </div>

              <form onSubmit={handleRedeemJewelsCode} className="space-y-3">
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute right-3 top-3.5 text-amber-400" />
                  <input
                    type="text"
                    maxLength={selectedBox.codeLength}
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder={`أدخل الكود المكون من ${selectedBox.codeLength} رقماً`}
                    className="w-full py-3 pr-10 pl-4 bg-[#080601] border-2 border-amber-400/60 focus:border-amber-300 rounded-xl text-white font-mono text-center tracking-widest text-lg outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>تأكيد وشحن {selectedBox.jewels} مجوهرات ذهبية</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
