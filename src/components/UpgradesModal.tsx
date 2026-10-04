import React, { useState } from 'react';
import { UserGameState } from '../types';
import { getPermanentUsedCodes, savePermanentlyUsedCode } from '../utils/codeStorage';
import { soundFx } from '../utils/soundEffects';
import {
  X,
  Clock,
  DollarSign,
  Gem,
  Brain,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface UpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onBuyPermanentTime: (costLiras: number, seconds: number) => void;
  onBuyMentalMathTime: (costLiras: number, seconds: number) => boolean;
  onRedeemCode: (code: string, lirasToAdd: number) => boolean;
  onRedeemJewelsCode: (code: string, jewelsToAdd: number) => boolean;
  onApplyUpgradeReward?: (upgradeType: string, rewardValue?: number) => { title: string; description: string };
  initialTab?: 'time' | 'money' | 'jewels' | 'mental_math';
  onShowToast?: (msg: string) => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onBuyPermanentTime,
  onBuyMentalMathTime,
  onRedeemCode,
  onRedeemJewelsCode,
  initialTab = 'jewels',
}) => {
  const [activeTab, setActiveTab] = useState<'time' | 'money' | 'jewels' | 'mental_math'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Money purchase state
  const [selectedMoneyBox, setSelectedMoneyBox] = useState<{ liras: number; price: string; codeLength: number } | null>(null);

  // Jewels purchase state
  const [selectedJewelsBox, setSelectedJewelsBox] = useState<{
    jewels: number;
    price: string;
    codeLength: number;
    discountNotice?: string;
    isMostUsed?: boolean;
  } | null>(null);

  // Mental math purchase state
  const [selectedMathBox, setSelectedMathBox] = useState<{ seconds: number; costLiras: number; codeLength: number } | null>(null);

  // Card code inputs and notices
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [codeErrorMessage, setCodeErrorMessage] = useState<string | null>(null);
  const [codeSuccessMessage, setCodeSuccessMessage] = useState<string | null>(null);
  const [timeSuccessMessage, setTimeSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Buy Permanent Riddle Time with Liras
  const handleRiddleTimeUpgrade = (seconds: number, cost: number) => {
    setTimeSuccessMessage(null);
    setCodeErrorMessage(null);
    if (gameState.liras < cost) {
      soundFx.playWrongSound();
      setCodeErrorMessage('انت لا تملك المال الكافي للترقية');
      setTimeout(() => setCodeErrorMessage(null), 3500);
      return;
    }
    soundFx.playUpgradeSound();
    onBuyPermanentTime(cost, seconds);
    setTimeSuccessMessage(`تمت زيادة ${seconds} ثوانٍ دائمية إلى جميع الألغاز!`);
    setTimeout(() => setTimeSuccessMessage(null), 3000);
  };

  // 2. Buy Mental Math Time with Liras (or via secure code starting with 789)
  const handleMentalMathTimeDirectBuy = (seconds: number, cost: number) => {
    setTimeSuccessMessage(null);
    setCodeErrorMessage(null);
    if (gameState.liras < cost) {
      soundFx.playWrongSound();
      setCodeErrorMessage('انت لا تملك المال الكافي لشراء هذا الوقت للحساب الذهني');
      setTimeout(() => setCodeErrorMessage(null), 3500);
      return;
    }
    soundFx.playUpgradeSound();
    const success = onBuyMentalMathTime(cost, seconds);
    if (success) {
      setTimeSuccessMessage(`تمت إضافة +${seconds} ثوانٍ دائمية للأبد في قائمة الحساب الذهني!`);
      setTimeout(() => setTimeSuccessMessage(null), 3500);
    }
  };

  // Redeem code for Mental Math Time (requires starting with 789)
  const handleVerifyMentalMathCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeErrorMessage(null);
    setCodeSuccessMessage(null);

    if (!selectedMathBox) return;
    const trimmed = promoCodeInput.trim();

    // Must start with 789
    if (!trimmed.startsWith('789')) {
      soundFx.playWrongSound();
      setCodeErrorMessage('هناك خطأ في الكود الخاص بك لا يمكن استخدامه!');
      return;
    }

    if (!/^\d+$/.test(trimmed)) {
      soundFx.playWrongSound();
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها (أرقام فقط)');
      return;
    }

    if (trimmed.length !== selectedMathBox.codeLength) {
      soundFx.playWrongSound();
      setCodeErrorMessage(`هناك خطا في الكود الخاص بك لا يمكن استخدامها (يجب أن يكون ${selectedMathBox.codeLength} رقماً)`);
      return;
    }

    const permanentUsed = getPermanentUsedCodes();
    if (gameState.usedCodes.includes(trimmed) || permanentUsed.includes(trimmed)) {
      soundFx.playWrongSound();
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها (تم استخدام هذا الكود سابقاً ولن يعمل مجدداً)');
      return;
    }

    // Success
    savePermanentlyUsedCode(trimmed);
    onBuyMentalMathTime(0, selectedMathBox.seconds);
    soundFx.playWinSound();
    setCodeSuccessMessage(`تم شحن +${selectedMathBox.seconds} ثوانٍ دائمية للأبد في الحساب الذهني!`);
    setPromoCodeInput('');
    setTimeout(() => {
      setCodeSuccessMessage(null);
      setSelectedMathBox(null);
    }, 2500);
  };

  // 3. Redeem Code for Liras (Purchase cards only - No free promo codes allowed!)
  const handleVerifyMoneyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeErrorMessage(null);
    setCodeSuccessMessage(null);

    if (!selectedMoneyBox) return;
    const trimmed = promoCodeInput.trim();

    // Strict prohibition of promo/free attempts
    if (
      trimmed.toUpperCase().includes('PROMO') ||
      trimmed.toUpperCase().includes('FREE') ||
      trimmed.toUpperCase().includes('SHTIME')
    ) {
      soundFx.playWrongSound();
      setCodeErrorMessage('تم إلغاء نظام الأكواد الترويجية (Promo) نهائياً! لا يمكن لأي شخص الحصول مجاناً على مال.');
      return;
    }

    // Specific strict validation rule for 1000 Liras:
    // "Must be a 16-digit code starting with 78913008"
    if (selectedMoneyBox.liras === 1000) {
      if (!trimmed.startsWith('78913008')) {
        soundFx.playWrongSound();
        setCodeErrorMessage('هناك خطأ في الكود! يرجى التأكد من كود الـ 1000 ليرة المكون من 16 رقماً');
        return;
      }

      if (!/^\d+$/.test(trimmed)) {
        soundFx.playWrongSound();
        setCodeErrorMessage('هناك خطأ في الكود! الكود يتكون من أرقام فقط');
        return;
      }

      if (trimmed.length !== 16) {
        soundFx.playWrongSound();
        setCodeErrorMessage(`الكود غير مكتمل! يجب أن يتكون من 16 رقماً بالتمام (أنت كتبت ${trimmed.length} رقماً)`);
        return;
      }
    } else {
      if (!trimmed.startsWith('78')) {
        soundFx.playWrongSound();
        setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
        return;
      }

      if (!/^\d+$/.test(trimmed)) {
        soundFx.playWrongSound();
        setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
        return;
      }

      const isValidLength =
        trimmed.length === selectedMoneyBox.codeLength ||
        trimmed.length === 13 ||
        (trimmed.length >= 6 && trimmed.length <= 20);
      if (!isValidLength) {
        soundFx.playWrongSound();
        setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
        return;
      }
    }

    const permanentUsed = getPermanentUsedCodes();
    if (gameState.usedCodes.includes(trimmed) || permanentUsed.includes(trimmed)) {
      soundFx.playWrongSound();
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها (تم استخدام هذا الكود سابقاً ولن يعمل مجدداً)');
      return;
    }

    const success = onRedeemCode(trimmed, selectedMoneyBox.liras);
    if (success) {
      soundFx.playCoinSound();
      setCodeSuccessMessage(`تم شحن +${selectedMoneyBox.liras} ليرة بنجاح! 💰🎉`);
      setPromoCodeInput('');
      setTimeout(() => {
        setCodeSuccessMessage(null);
        setSelectedMoneyBox(null);
      }, 2500);
    } else {
      soundFx.playWrongSound();
      setCodeErrorMessage('تعذر شحن الكود، يرجى إعادة المحاولة');
    }
  };

  // 4. Redeem Code for Jewels (Box 1: 14 digits, Box 2: 15 digits, Box 3: 16 digits, start with 78, single-use, no hints/assistance)
  const handleVerifyJewelsCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeErrorMessage(null);
    setCodeSuccessMessage(null);

    if (!selectedJewelsBox) return;
    const trimmed = promoCodeInput.trim();

    // Must start with 78
    if (!trimmed.startsWith('78')) {
      soundFx.playWrongSound();
      setCodeErrorMessage('هناك خطأ في الكود الخاص بك لا يمكن استخدامه!');
      return;
    }

    if (!/^\d+$/.test(trimmed)) {
      soundFx.playWrongSound();
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها');
      return;
    }

    // Exact length check: 14, 15, or 16 digits depending on selected box
    if (trimmed.length !== selectedJewelsBox.codeLength) {
      soundFx.playWrongSound();
      setCodeErrorMessage(`هناك خطا في الكود الخاص بك لا يمكن استخدامها (يجب أن يتكون من ${selectedJewelsBox.codeLength} رقماً بالضبط)`);
      return;
    }

    const permanentUsed = getPermanentUsedCodes();
    if (gameState.usedCodes.includes(trimmed) || permanentUsed.includes(trimmed)) {
      soundFx.playWrongSound();
      setCodeErrorMessage('هناك خطا في الكود الخاص بك لا يمكن استخدامها (تم استخدام هذا الكود سابقاً ولن يعمل مجدداً)');
      return;
    }

    const success = onRedeemJewelsCode(trimmed, selectedJewelsBox.jewels);
    if (success) {
      soundFx.playWinSound();
      setCodeSuccessMessage(`🎉 تم شحن +${selectedJewelsBox.jewels} مجوهرات بنجاح لحسابك!`);
      setPromoCodeInput('');
      setTimeout(() => {
        setCodeSuccessMessage(null);
        setSelectedJewelsBox(null);
      }, 2500);
    } else {
      soundFx.playWrongSound();
      setCodeErrorMessage('حدث خطأ أثناء الشحن');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in select-none" dir="rtl">
      <div className="relative w-full max-w-2xl bg-[#0c142b] border border-blue-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(30,58,138,0.6)] max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/30 to-blue-500/30 border border-amber-400/50 rounded-2xl text-amber-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">متجر الترقية والتسوق</h2>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-blue-300">
                  المال: <strong className="text-amber-300 font-bold">{gameState.liras} ليرة</strong>
                </span>
                <span className="text-blue-300 border-r border-slate-700 pr-3">
                  المجوهرات: <strong className="text-yellow-300 font-black drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">{gameState.jewels || 0} 💎</strong>
                </span>
                <span className="text-blue-300 border-r border-slate-700 pr-3 hidden sm:inline">
                  وقت الحساب الذهني: <strong className="text-purple-300 font-bold">+{gameState.mentalMathBonusSeconds || 0}s</strong>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedMoneyBox?.liras === 1000) {
                soundFx.playWrongSound();
                setCodeErrorMessage('لا يمكن الخروج من هذه الصفحة إلا بعد كتابة كود الـ 1000 ليرة المكون من 16 رقماً بشكل صحيح!');
                return;
              }
              onClose();
            }}
            className={`p-2 rounded-full cursor-pointer transition-all ${
              selectedMoneyBox?.liras === 1000
                ? 'text-slate-600 bg-slate-900/50 cursor-not-allowed opacity-50'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
            title={selectedMoneyBox?.liras === 1000 ? 'لا يمكن الخروج حتى كتابة الكود بشكل صحيح' : 'إغلاق'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 CATEGORY TABS (Promo removed per official policy) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-5 bg-[#080d1e] p-1.5 rounded-2xl border border-blue-500/20">
          
          {/* Tab 1: شراء مجوهرات (ذهبي وأزرق) */}
          <button
            onClick={() => {
              if (selectedMoneyBox?.liras === 1000) {
                soundFx.playWrongSound();
                setCodeErrorMessage('لا يمكن مغادرة هذه الصفحة إلا بعد كتابة كود الـ 1000 ليرة بشكل صحيح!');
                return;
              }
              setActiveTab('jewels');
              setSelectedMoneyBox(null);
              setSelectedJewelsBox(null);
              setSelectedMathBox(null);
              setCodeErrorMessage(null);
            }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'jewels'
                ? 'bg-gradient-to-r from-amber-500 via-blue-600 to-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] border-2 border-amber-300 scale-[1.02]'
                : 'text-amber-300/80 hover:text-white bg-amber-950/20'
            }`}
          >
            <Gem className="w-4 h-4 text-yellow-300 animate-bounce" />
            <span>مجوهرات</span>
          </button>

          {/* Tab 2: وقت للحساب الذهني */}
          <button
            onClick={() => {
              if (selectedMoneyBox?.liras === 1000) {
                soundFx.playWrongSound();
                setCodeErrorMessage('لا يمكن مغادرة هذه الصفحة إلا بعد كتابة كود الـ 1000 ليرة بشكل صحيح!');
                return;
              }
              setActiveTab('mental_math');
              setSelectedMoneyBox(null);
              setSelectedJewelsBox(null);
              setSelectedMathBox(null);
              setCodeErrorMessage(null);
            }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'mental_math'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border-2 border-purple-400 scale-[1.02]'
                : 'text-purple-300/80 hover:text-white bg-purple-950/20'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
            <span>وقت حساب ذهني</span>
          </button>

          {/* Tab 3: وقت الألغاز */}
          <button
            onClick={() => {
              if (selectedMoneyBox?.liras === 1000) {
                soundFx.playWrongSound();
                setCodeErrorMessage('لا يمكن مغادرة هذه الصفحة إلا بعد كتابة كود الـ 1000 ليرة بشكل صحيح!');
                return;
              }
              setActiveTab('time');
              setSelectedMoneyBox(null);
              setSelectedJewelsBox(null);
              setSelectedMathBox(null);
              setCodeErrorMessage(null);
            }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'time'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] border-2 border-blue-400 scale-[1.02]'
                : 'text-blue-300/80 hover:text-white bg-blue-950/20'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-300" />
            <span>وقت الألغاز</span>
          </button>

          {/* Tab 4: شراء ليرات */}
          <button
            onClick={() => {
              if (selectedMoneyBox?.liras === 1000) {
                soundFx.playWrongSound();
                setCodeErrorMessage('لا يمكن مغادرة هذه الصفحة إلا بعد كتابة كود الـ 1000 ليرة بشكل صحيح!');
                return;
              }
              setActiveTab('money');
              setSelectedMoneyBox(null);
              setSelectedJewelsBox(null);
              setSelectedMathBox(null);
              setCodeErrorMessage(null);
            }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'money'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-yellow-300 scale-[1.02]'
                : 'text-amber-300/80 hover:text-white bg-amber-950/20'
            }`}
          >
            <DollarSign className="w-4 h-4 text-yellow-300" />
            <span>شراء ليرات</span>
          </button>
        </div>

        {/* THE PROMINENT WHITE LINE with generous margins */}
        <div className="w-full my-4 sm:my-5 shrink-0">
          <div className="w-full h-1.5 sm:h-2 bg-white shadow-[0_0_25px_rgba(255,255,255,0.95)] rounded-full" />
        </div>

        {/* Banners */}
        {timeSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{timeSuccessMessage}</span>
          </div>
        )}

        {codeErrorMessage && (
          <div className="mb-4 p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-shake">
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

        {/* ================= TAB 1: شراء مجوهرات (ذهبي وأزرق) ================= */}
        {activeTab === 'jewels' && (
          <div className="space-y-4 overflow-y-auto pr-1 pt-3 pb-24 sm:pb-32">
            <div className="p-3 bg-gradient-to-r from-blue-950/80 via-amber-950/50 to-blue-950/80 rounded-2xl border border-amber-400/40 text-center">
              <p className="text-xs text-amber-200 font-bold">
                💎 عملة المجوهرات الذهبية اللامعة: تُستخدم في قسم «صناعة لعبة خاصة بك» وتكلفة صناعة اللعبة الواحدة 3 مجوهرات!
              </p>
            </div>

            {!selectedJewelsBox ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* المربع الأول: 5 مجوهرات مقابل 6 دولارات (كود من 14 رقماً يبدأ بـ 78) */}
                <div
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedJewelsBox({
                      jewels: 5,
                      price: '6 دولارات',
                      codeLength: 14,
                    });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-gradient-to-b from-[#101b38] to-[#0a1226] border-2 border-blue-400/60 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-600/30 border border-amber-400/50 flex items-center justify-center text-yellow-300 font-black mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                    💎
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 mb-1">
                    5 مجوهرات
                  </div>
                  <div className="text-xs text-blue-300 font-bold mb-3">مقابل 6 دولارات</div>
                  <span className="text-[11px] px-3 py-1 bg-gradient-to-r from-blue-900 to-indigo-900 text-amber-200 border border-amber-400/40 rounded-full font-bold inline-block shadow">
                    شحن بكود بطاقة (14 رقماً)
                  </span>
                </div>

                {/* المربع الثاني: 10 مجوهرات مقابل 10 دولارات (كود من 15 رقماً يبدأ بـ 78) */}
                <div
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedJewelsBox({
                      jewels: 10,
                      price: '10 دولارات',
                      codeLength: 15,
                    });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-gradient-to-b from-[#14182e] to-[#080d1e] border-2 border-amber-400/70 hover:border-yellow-300 rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-yellow-300 font-black mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                    💎💎
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 mb-1">
                    10 مجوهرات
                  </div>
                  <div className="text-xs text-amber-300 font-bold mb-3">مقابل 10 دولارات</div>
                  <span className="text-[11px] px-3 py-1 bg-gradient-to-r from-amber-900 to-yellow-900 text-yellow-200 border border-yellow-400/40 rounded-full font-bold inline-block shadow">
                    شحن بكود بطاقة (15 رقماً)
                  </span>
                </div>

                {/* المربع الثالث: 30 مجوهرة مقابل 15 دولاراً (الأكثر استخداماً وخصم 5 دولارات - كود من 16 رقماً يبدأ بـ 78) */}
                <div
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedJewelsBox({
                      jewels: 30,
                      price: '15 دولاراً',
                      codeLength: 16,
                      discountNotice: 'خصم 5 دولارات (عرض خاص)',
                      isMostUsed: true,
                    });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-gradient-to-b from-[#1e1b36] via-[#131128] to-[#0a081a] border-2 border-yellow-300 hover:border-amber-200 rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-[0_0_30px_rgba(234,179,8,0.4)] group relative overflow-hidden"
                >
                  {/* Top Badge: الأكثر استخداماً */}
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow">
                    الأكثر استخداماً 🔥
                  </div>

                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-500/30 to-blue-600/30 border-2 border-yellow-300 flex items-center justify-center text-yellow-300 font-black mb-2 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.7)]">
                    💎👑
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 mb-1">
                    30 مجوهرة
                  </div>
                  <div className="text-xs text-yellow-300 font-black mb-1">مقابل 15 دولاراً</div>
                  <div className="text-[10px] text-emerald-400 font-bold mb-3">خصم 5 دولارات كاملة!</div>
                  <span className="text-[11px] px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border border-yellow-200 rounded-full font-black inline-block shadow">
                    شحن بكود بطاقة (16 رقماً)
                  </span>
                </div>
              </div>
            ) : (
              /* شاشة إدخال كود البطاقة البنكية للشراء (بدون أي مساعدات ونظام حماية لمنع التكرار) */
              <div className="bg-[#0f1a38] border-2 border-amber-400/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      شراء {selectedJewelsBox.jewels} مجوهرة ({selectedJewelsBox.price})
                    </h4>
                    {selectedJewelsBox.discountNotice && (
                      <span className="text-xs text-emerald-400 font-bold">
                        {selectedJewelsBox.discountNotice}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedJewelsBox(null)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    تغيير الخيار
                  </button>
                </div>

                <div className="text-xs text-amber-200/90 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                  🔒 نظام الحماية البنكية: يتطلب كود شراء صالح من {selectedJewelsBox.codeLength} رقماً. يُستخدم الكود لمرة واحدة فقط دون أي مساعدات.
                </div>

                <form onSubmit={handleVerifyJewelsCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      أدخل كود الشراء ({selectedJewelsBox.codeLength} رقماً):
                    </label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 absolute right-3 top-3.5 text-amber-400" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder={`اكتب الكود المكون من ${selectedJewelsBox.codeLength} رقماً...`}
                        className="w-full py-3 pr-10 pl-4 bg-[#080d1d] border-2 border-amber-400/50 focus:border-amber-400 rounded-xl text-white font-mono text-center tracking-widest text-base sm:text-lg outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد وشحن {selectedJewelsBox.jewels} مجوهرات 💎</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: شراء وقت للحساب الذهني ================= */}
        {activeTab === 'mental_math' && (
          <div className="space-y-4 overflow-y-auto pr-1 pt-3 pb-24 sm:pb-32">
            <div className="p-3 bg-purple-950/50 border border-purple-500/30 rounded-2xl text-center">
              <p className="text-xs text-purple-200 font-bold">
                🧠 شراء وقت للحساب الذهني: يضاف الوقت المشتري هنا إلى مؤقت الـ 15 ثانية للأبد في جميع مراحل الحساب الذهني!
              </p>
            </div>

            {!selectedMathBox ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* خيار 1: +5 ثوانٍ مقابل 10 ليرات */}
                <div className="bg-[#111633] border border-purple-500/40 hover:border-purple-300 rounded-2xl p-4 text-center flex flex-col justify-between shadow-md">
                  <div>
                    <div className="w-10 h-10 mx-auto bg-purple-600/20 border border-purple-400/40 rounded-full flex items-center justify-center text-purple-300 font-black mb-2">
                      +5s
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">زيادة 5 ثوانٍ</h4>
                    <p className="text-[11px] text-slate-400 mb-3">للأبد في الحساب الذهني</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleMentalMathTimeDirectBuy(5, 10)}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      شراء بـ 10 ليرات
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMathBox({ seconds: 5, costLiras: 10, codeLength: 6 });
                        setPromoCodeInput('');
                        setCodeErrorMessage(null);
                      }}
                      className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[10px] rounded-lg border border-purple-500/30 cursor-pointer"
                    >
                      أو شحن بكود البطاقة
                    </button>
                  </div>
                </div>

                {/* خيار 2: +10 ثوانٍ مقابل 20 ليرة */}
                <div className="bg-[#111633] border border-purple-500/40 hover:border-purple-300 rounded-2xl p-4 text-center flex flex-col justify-between shadow-md">
                  <div>
                    <div className="w-10 h-10 mx-auto bg-purple-600/20 border border-purple-400/40 rounded-full flex items-center justify-center text-purple-300 font-black mb-2">
                      +10s
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">زيادة 10 ثوانٍ</h4>
                    <p className="text-[11px] text-slate-400 mb-3">للأبد في الحساب الذهني</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleMentalMathTimeDirectBuy(10, 20)}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      شراء بـ 20 ليرة
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMathBox({ seconds: 10, costLiras: 20, codeLength: 12 });
                        setPromoCodeInput('');
                        setCodeErrorMessage(null);
                      }}
                      className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[10px] rounded-lg border border-purple-500/30 cursor-pointer"
                    >
                      أو شحن بكود البطاقة
                    </button>
                  </div>
                </div>

                {/* خيار 3: +15 ثانية مقابل 33 ليرة */}
                <div className="bg-[#111633] border-2 border-purple-400 hover:border-amber-400 rounded-2xl p-4 text-center flex flex-col justify-between shadow-md">
                  <div>
                    <div className="w-10 h-10 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-black mb-2 shadow">
                      +15s
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">زيادة 15 ثانية</h4>
                    <p className="text-[11px] text-slate-400 mb-3">للأبد في الحساب الذهني</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleMentalMathTimeDirectBuy(15, 33)}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      شراء بـ 33 ليرة
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMathBox({ seconds: 15, costLiras: 33, codeLength: 13 });
                        setPromoCodeInput('');
                        setCodeErrorMessage(null);
                      }}
                      className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[10px] rounded-lg border border-purple-500/30 cursor-pointer"
                    >
                      أو شحن بكود البطاقة
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* إدخال كود الحساب الذهني */
              <div className="bg-[#0f1a38] border-2 border-purple-400/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      شحن +{selectedMathBox.seconds} ثوانٍ للحساب الذهني
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedMathBox(null)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    تغيير الخيار
                  </button>
                </div>

                <form onSubmit={handleVerifyMentalMathCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      أدخل كود الشحن ({selectedMathBox.codeLength} رقماً):
                    </label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 absolute right-3 top-3.5 text-purple-400" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder={`اكتب الكود المكون من ${selectedMathBox.codeLength} رقماً...`}
                        className="w-full py-3 pr-10 pl-4 bg-[#080d1d] border-2 border-purple-400/50 focus:border-purple-400 rounded-xl text-white font-mono text-center tracking-widest text-base sm:text-lg outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد وشحن +{selectedMathBox.seconds}s للحساب الذهني</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: وقت الألغاز ================= */}
        {activeTab === 'time' && (
          <div className="space-y-4 overflow-y-auto pr-1 pt-3 pb-24 sm:pb-32">
            <p className="text-xs text-blue-200 bg-blue-950/50 p-3 rounded-xl border border-blue-500/20">
              💡 زيادة وقت الألغاز يضيف ثوانٍ إضافية دائمة إلى عداد كل لغز لتساعدك على التفكير بهدوء!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#111c3a] border border-blue-500/40 hover:border-amber-400 rounded-2xl p-4 text-center flex flex-col justify-between transition-all hover:scale-105 shadow-md">
                <div>
                  <div className="w-10 h-10 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center text-blue-300 font-bold mb-2">
                    +5s
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">زيادة 5 ثوانٍ</h4>
                  <p className="text-[11px] text-slate-400 mb-3">تضاف لمؤقت كل لغز</p>
                </div>
                <button
                  onClick={() => handleRiddleTimeUpgrade(5, 50)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  50 ليرة
                </button>
              </div>

              <div className="bg-[#111c3a] border border-blue-500/40 hover:border-amber-400 rounded-2xl p-4 text-center flex flex-col justify-between transition-all hover:scale-105 shadow-md">
                <div>
                  <div className="w-10 h-10 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center text-blue-300 font-bold mb-2">
                    +10s
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">زيادة 10 ثوانٍ</h4>
                  <p className="text-[11px] text-slate-400 mb-3">تضاف لمؤقت كل لغز</p>
                </div>
                <button
                  onClick={() => handleRiddleTimeUpgrade(10, 80)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  80 ليرة
                </button>
              </div>

              <div className="bg-[#111c3a] border border-indigo-500/40 hover:border-amber-400 rounded-2xl p-4 text-center flex flex-col justify-between transition-all hover:scale-105 shadow-md">
                <div>
                  <div className="w-10 h-10 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center text-purple-300 font-bold mb-2">
                    +13s
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">زيادة 13 ثانية</h4>
                  <p className="text-[11px] text-slate-400 mb-3">تضاف لمؤقت كل لغز</p>
                </div>
                <button
                  onClick={() => handleRiddleTimeUpgrade(13, 100)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  100 ليرة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: شراء ليرات (بطاقات شراء معتمدة فقط) ================= */}
        {activeTab === 'money' && (
          <div className="space-y-4 overflow-y-auto pr-1 pt-3 pb-24 sm:pb-32">
            
            {/* Legal / Rules Notice */}
            <div className="p-3 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 rounded-2xl border border-amber-500/40 text-center">
              <p className="text-xs text-amber-200 font-bold">
                🔒 تنبيه مالي رسمي: تم إلغاء نظام الأكواد الترويجية (Promo). لا يمكن لأي شخص الحصول مجاناً على مال أو ليرات. الشحن يتم فقط عبر بطاقات الشراء المعتمدة أو ربح الجوائز بالفوز بالألعاب.
              </p>
            </div>

            {!selectedMoneyBox ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Box 1: 100 Lira for $3 (6 digits code) */}
                <div
                  onClick={() => {
                    setSelectedMoneyBox({ liras: 100, price: '$3', codeLength: 6 });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-[#101b38] border border-blue-500/40 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-2xl font-black text-amber-300 mb-1">100 ليرة</div>
                  <div className="text-xs text-blue-300 font-bold mb-3">مقابل 3 دولار</div>
                  <span className="text-[10px] px-2.5 py-1 bg-blue-900/60 text-blue-200 border border-blue-400/30 rounded-full block">
                    كود بطاقة الشراء
                  </span>
                </div>

                {/* Box 2: 150 Lira for $5 */}
                <div
                  onClick={() => {
                    setSelectedMoneyBox({ liras: 150, price: '$5', codeLength: 12 });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-[#101b38] border border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-2xl font-black text-amber-300 mb-1">150 ليرة</div>
                  <div className="text-xs text-amber-300 font-bold mb-3">مقابل 5 دولار</div>
                  <span className="text-[10px] px-2.5 py-1 bg-amber-900/60 text-amber-200 border border-amber-400/30 rounded-full block">
                    كود بطاقة الشراء
                  </span>
                </div>

                {/* Box 3: 200 Lira for $7 */}
                <div
                  onClick={() => {
                    setSelectedMoneyBox({ liras: 200, price: '$7', codeLength: 13 });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-[#101b38] border border-emerald-500/40 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-2xl font-black text-emerald-300 mb-1">200 ليرة</div>
                  <div className="text-xs text-emerald-300 font-bold mb-3">مقابل 7 دولار</div>
                  <span className="text-[10px] px-2.5 py-1 bg-emerald-900/60 text-emerald-200 border border-emerald-400/30 rounded-full block">
                    كود بطاقة الشراء
                  </span>
                </div>

                {/* Box 4: 1000 Lira for $25 */}
                <div
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedMoneyBox({ liras: 1000, price: '$25', codeLength: 16 });
                    setPromoCodeInput('');
                    setCodeErrorMessage(null);
                  }}
                  className="bg-gradient-to-b from-[#241a08] via-[#1a1306] to-[#0d0903] border-2 border-amber-400 hover:border-yellow-300 rounded-2xl p-4 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-[0_0_25px_rgba(234,179,8,0.35)] group relative overflow-hidden"
                >
                  <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow">
                    عرض VIP 👑
                  </div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 mb-1">
                    1000 ليرة
                  </div>
                  <div className="text-xs text-amber-300 font-black mb-2">مقابل 25 دولار</div>
                  <span className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-amber-900 to-yellow-900 text-yellow-200 border border-yellow-400/50 rounded-full font-bold block shadow">
                    كود بطاقة الشراء (16 رقماً)
                  </span>
                  <p className="text-[9px] text-amber-400/80 mt-1 font-semibold">🔒 محمي: لا يمكن الخروج بدون الكود</p>
                </div>
              </div>
            ) : (
              /* Code Input Screen for selected Box */
              <div className="bg-[#0f1a38] border border-amber-400/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base flex items-center gap-2">
                      <span>شراء {selectedMoneyBox.liras} ليرة ({selectedMoneyBox.price})</span>
                      {selectedMoneyBox.liras === 1000 && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/50 rounded-full font-black">
                          🔒 مقفل
                        </span>
                      )}
                    </h4>
                  </div>
                  {/* Notice: No 'change option' allowed when in 1000 Lira box */}
                  {selectedMoneyBox.liras !== 1000 && (
                    <button
                      onClick={() => setSelectedMoneyBox(null)}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      تغيير الخيار
                    </button>
                  )}
                </div>

                {selectedMoneyBox.liras === 1000 && (
                  <div className="text-xs text-amber-200/95 bg-gradient-to-r from-amber-950/60 to-red-950/40 p-3 rounded-xl border border-amber-500/40 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      🔒 <strong>صفحة مقفلة ومؤمنة:</strong> لا يمكن الخروج من هذه الصفحة أو إغلاقها إلا بعد إدخال كود الشراء المكون من 16 رقماً بشكل صحيح!
                    </span>
                  </div>
                )}

                <form onSubmit={handleVerifyMoneyCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {selectedMoneyBox.liras === 1000
                        ? 'أدخل كود الشراء (16 رقماً):'
                        : 'أدخل كود الشراء:'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 absolute right-3 top-3.5 text-amber-400" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder={
                          selectedMoneyBox.liras === 1000
                            ? 'اكتب كود الـ 16 رقماً...'
                            : 'اكتب الكود...'
                        }
                        maxLength={selectedMoneyBox.liras === 1000 ? 16 : undefined}
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
