import React, { useState } from 'react';
import { UserGameState } from '../types';
import { getPermanentUsedCodes } from '../utils/codeStorage';
import { X, Clock, DollarSign, KeyRound, Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface UpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onBuyPermanentTime: (seconds: number, costLiras: number) => boolean;
  onRedeemCode: (lirasToAdd: number, code: string) => boolean;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onBuyPermanentTime,
  onRedeemCode,
}) => {
  const [activeTab, setActiveTab] = useState<'time' | 'money'>('time');
  const [selectedMoneyBox, setSelectedMoneyBox] = useState<{ liras: number; price: string; codeLength: number } | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [codeErrorMessage, setCodeErrorMessage] = useState<string | null>(null);
  const [codeSuccessMessage, setCodeSuccessMessage] = useState<string | null>(null);
  const [timeSuccessMessage, setTimeSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTimeUpgrade = (seconds: number, cost: number) => {
    setTimeSuccessMessage(null);
    setCodeErrorMessage(null);
    const success = onBuyPermanentTime(seconds, cost);
    if (success) {
      setTimeSuccessMessage(`تمت زيادة ${seconds} ثوانٍ دائمية إلى جميع الألغاز!`);
      setTimeout(() => setTimeSuccessMessage(null), 3000);
    } else {
      setCodeErrorMessage('انت لا تملك المال الكافي للترقية');
      setTimeout(() => setCodeErrorMessage(null), 3000);
    }
  };

  const handleVerifyAndRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeErrorMessage(null);
    setCodeSuccessMessage(null);

    if (!selectedMoneyBox) return;

    const trimmedCode = promoCodeInput.trim();

    // 1. Must start with 78
    if (!trimmedCode.startsWith('78')) {
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
      return;
    }

    // 2. Must be digits only
    if (!/^\d+$/.test(trimmedCode)) {
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
      return;
    }

    // 3. Length matching rule: accept matching selected box length OR valid codes starting with 78 (e.g., 6, 12, 13 digits like 7878787878787)
    const isValidLength = trimmedCode.length === selectedMoneyBox.codeLength || trimmedCode.length === 13 || (trimmedCode.length >= 6 && trimmedCode.length <= 20);
    if (!isValidLength) {
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
      return;
    }

    // 4. Permanent check: Cannot be reused EVER (even after logout or 600 years)
    const permanentUsedCodes = getPermanentUsedCodes();
    if (gameState.usedCodes.includes(trimmedCode) || permanentUsedCodes.includes(trimmedCode)) {
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها (تم استخدام هذا الكود سابقاً ولن يعمل مجدداً)');
      return;
    }

    // Process valid code redemption
    const success = onRedeemCode(selectedMoneyBox.liras, trimmedCode);
    if (success) {
      setCodeSuccessMessage(`تم إضافة +${selectedMoneyBox.liras} ليرة بنجاح!`);
      setPromoCodeInput('');
      setTimeout(() => {
        setCodeSuccessMessage(null);
        setSelectedMoneyBox(null);
      }, 2500);
    } else {
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0c142b] border border-blue-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(30,58,138,0.6)] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">متجر الترقية والتسوق</h2>
              <p className="text-xs text-blue-300">رصيدك الحالي: <span className="text-amber-300 font-bold">{gameState.liras} ليرة</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Top Navigation Tabs requested by user */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-[#080d1e] p-1.5 rounded-2xl border border-blue-500/20">
          <button
            onClick={() => {
              setActiveTab('time');
              setSelectedMoneyBox(null);
            }}
            className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'time'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border border-blue-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>إضافة وقت دائم</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('money');
              setSelectedMoneyBox(null);
            }}
            className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'money'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg border border-yellow-300/40 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>شراء المال (الكود)</span>
          </button>
        </div>

        {/* Success / Error Banners */}
        {timeSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{timeSuccessMessage}</span>
          </div>
        )}

        {codeErrorMessage && (
          <div className="mb-4 p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{codeErrorMessage}</span>
          </div>
        )}

        {codeSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{codeSuccessMessage}</span>
          </div>
        )}

        {/* Tab 1: Buy Permanent Time */}
        {activeTab === 'time' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <p className="text-xs text-blue-200 bg-blue-950/50 p-3 rounded-xl border border-blue-500/20">
              💡 ملحوظة: الوقت المشتري هنا يبقى معك للأبد وفي جميع الألغاز القادمة حتى تسجيل الخروج!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Box 1: +5s for 60 Liras */}
              <div className="bg-[#111c3a] border border-blue-500/30 hover:border-amber-400 rounded-2xl p-4 text-center flex flex-col justify-between transition-all hover:scale-105 shadow-md">
                <div>
                  <div className="w-10 h-10 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center text-amber-300 font-bold mb-2">
                    +5s
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">زيادة 5 ثوانٍ</h4>
                  <p className="text-[11px] text-slate-400 mb-3">تضاف لمؤقت كل لغز</p>
                </div>
                <button
                  onClick={() => handleTimeUpgrade(5, 60)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  60 ليرة
                </button>
              </div>

              {/* Box 2: +10s for 70 Liras */}
              <div className="bg-[#111c3a] border border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 text-center flex flex-col justify-between transition-all hover:scale-105 shadow-md">
                <div>
                  <div className="w-10 h-10 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center text-amber-300 font-bold mb-2">
                    +10s
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">زيادة 10 ثوانٍ</h4>
                  <p className="text-[11px] text-slate-400 mb-3">تضاف لمؤقت كل لغز</p>
                </div>
                <button
                  onClick={() => handleTimeUpgrade(10, 70)}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  70 ليرة
                </button>
              </div>

              {/* Box 3: +13s for 100 Liras */}
              <div className="bg-[#111c3a] border border-indigo-500/40 hover:border-amber-400 rounded-2xl p-4 text-center flex flex-col justify-between transition-all hover:scale-105 shadow-md">
                <div>
                  <div className="w-10 h-10 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center text-purple-300 font-bold mb-2">
                    +13s
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">زيادة 13 ثانية</h4>
                  <p className="text-[11px] text-slate-400 mb-3">تضاف لمؤقت كل لغز</p>
                </div>
                <button
                  onClick={() => handleTimeUpgrade(13, 100)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  100 ليرة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Buy Liras with Promo Code */}
        {activeTab === 'money' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {!selectedMoneyBox ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Box 1: 100 Lira for $3 (6 digits code) */}
                <div
                  onClick={() => {
                    setSelectedMoneyBox({ liras: 100, price: '$3', codeLength: 6 });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-[#101b38] border border-blue-500/40 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-3xl font-black text-amber-300 mb-1">100 ليرة</div>
                  <div className="text-xs text-blue-300 font-bold mb-4">مقابل 3 دولار</div>
                  <span className="text-[10px] px-3 py-1 bg-blue-900/60 text-blue-200 border border-blue-400/30 rounded-full block">
                    اكتب كود
                  </span>
                </div>

                {/* Box 2: 150 Lira for $5 */}
                <div
                  onClick={() => {
                    setSelectedMoneyBox({ liras: 150, price: '$5', codeLength: 12 });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-[#101b38] border border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-3xl font-black text-amber-300 mb-1">150 ليرة</div>
                  <div className="text-xs text-amber-300 font-bold mb-4">مقابل 5 دولار</div>
                  <span className="text-[10px] px-3 py-1 bg-amber-900/60 text-amber-200 border border-amber-400/30 rounded-full block">
                    اكتب كود
                  </span>
                </div>

                {/* Box 3: 200 Lira for $7 */}
                <div
                  onClick={() => {
                    setSelectedMoneyBox({ liras: 200, price: '$7', codeLength: 13 });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-[#101b38] border border-emerald-500/40 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-3xl font-black text-emerald-300 mb-1">200 ليرة</div>
                  <div className="text-xs text-emerald-300 font-bold mb-4">مقابل 7 دولار</div>
                  <span className="text-[10px] px-3 py-1 bg-emerald-900/60 text-emerald-200 border border-emerald-400/30 rounded-full block">
                    اكتب كود
                  </span>
                </div>
              </div>
            ) : (
              /* Code Input Screen for selected Box */
              <div className="bg-[#0f1a38] border border-amber-400/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      شراء {selectedMoneyBox.liras} ليرة ({selectedMoneyBox.price})
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedMoneyBox(null)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    تغيير الخيار
                  </button>
                </div>

                <form onSubmit={handleVerifyAndRedeemCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">أدخل كود الشراء:</label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 absolute right-3 top-3.5 text-amber-400" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder="اكتب الكود"
                        className="w-full py-3 pr-10 pl-4 bg-[#080d1d] border-2 border-amber-400/50 focus:border-amber-400 rounded-xl text-white font-mono text-center tracking-widest text-lg outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد وشحن {selectedMoneyBox.liras} ليرة</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
