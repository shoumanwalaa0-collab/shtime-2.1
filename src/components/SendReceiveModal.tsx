import React, { useState, useEffect } from 'react';
import { 
  X, Send, Download, Coins, KeyRound, User, 
  AlertTriangle, CheckCircle2, ShieldCheck, 
  RefreshCw, Clock, Calendar 
} from 'lucide-react';
import { UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';

interface SendReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onAddLiras: (amount: number) => void;
}

export interface TransferRecord {
  id: string;
  senderName: string;
  amount: number;
  password?: string;
  createdAt?: number;
}

const STORAGE_KEY = 'RIDDLE_GAME_REAL_TRANSFERS_V1';

export const SendReceiveModal: React.FC<SendReceiveModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onForceDeductLiras,
  onAddLiras,
}) => {
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  
  // Send form state
  const [recipientName, setRecipientName] = useState('');
  const [transferPassword, setTransferPassword] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number>(5);

  // Receive transfers state (synced with real backend server, empty if nobody sent money)
  const [pendingTransfers, setPendingTransfers] = useState<TransferRecord[]>([]);

  const fetchTransfersFromServer = async () => {
    try {
      const res = await fetch('/api/transfers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.transfers)) {
          setPendingTransfers(data.transfers);
          return;
        }
      }
      // Fallback
      const res2 = await fetch('/api/internal/app-sync');
      if (res2.ok) {
        const data2 = await res2.json();
        if (Array.isArray(data2.transfersList)) {
          setPendingTransfers(data2.transfersList);
        }
      }
    } catch {
      // Network fallback
    }
  };

  useEffect(() => {
    fetchTransfersFromServer();
    const interval = setInterval(fetchTransfersFromServer, 3000);
    return () => clearInterval(interval);
  }, []);

  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [inputReceivePassword, setInputReceivePassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate remaining days from 10 days duration
  const getRemainingDays = (createdAt?: number) => {
    if (!createdAt) return 10;
    const elapsedDays = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, 10 - elapsedDays);
  };

  if (!isOpen) return null;

  // Generate amounts from 5 to 400 step 5
  const amountOptions: number[] = [];
  for (let i = 5; i <= 400; i += 5) {
    amountOptions.push(i);
  }

  const handleSendMoney = async () => {
    soundFx.playClickSound();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Recipient name validation (> 5 chars)
    const trimmedName = recipientName.trim();
    if (trimmedName.length <= 5) {
      setErrorMsg('اسم المستلم يجب أن يكون أكثر من 5 حروف!');
      return;
    }

    // Check if name was already used in active transfers to prevent exact duplicate names
    const isDuplicate = pendingTransfers.some((t) => t.senderName.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      setErrorMsg('عذراً، هذا الاسم مستخدم مسبقاً ولا يمكن تكراره مطلقاً!');
      return;
    }

    // 2. Password validation (> 10 chars, English letters upper & lower, numbers)
    const hasEnglishLetters = /[a-zA-Z]/.test(transferPassword);
    const hasUpperCase = /[A-Z]/.test(transferPassword);
    const hasLowerCase = /[a-z]/.test(transferPassword);
    const hasNumbers = /[0-9]/.test(transferPassword);

    if (
      transferPassword.length <= 10 ||
      !hasEnglishLetters ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumbers
    ) {
      setErrorMsg('الباسورد يجب أن يكون أكثر من 10 خانات، باللغة الإنجليزية، ويحتوي على أحرف كبيرة وصغيرة وأرقام!');
      return;
    }

    // 3. Amount check (Max 400, user must have enough liras)
    if (gameState.liras < selectedAmount) {
      soundFx.playWrongSound();
      setErrorMsg(`عذراً، رصيدك الحالي (${gameState.liras} ليرة) لا يكفي لإرسال ${selectedAmount} ليرة!`);
      return;
    }

    // Execute transfer deduction
    onForceDeductLiras(selectedAmount, `إرسال مال إلى ${trimmedName}: تم خصم ${selectedAmount} ليرة`);
    soundFx.playWinSound();

    // Send to real backend server so other phones see it immediately
    try {
      const res = await fetch('/api/transfers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: trimmedName,
          amount: selectedAmount,
          password: transferPassword,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transfers) {
          setPendingTransfers(data.transfers);
        }
      }
    } catch {
      const newTransfer: TransferRecord = {
        id: Date.now().toString(),
        senderName: trimmedName,
        amount: selectedAmount,
        password: transferPassword,
        createdAt: Date.now(),
      };
      setPendingTransfers((prev) => [newTransfer, ...prev]);
    }

    setSuccessMsg(`✅ تم إرسال مبلغ ${selectedAmount} ليرة بنجاح إلى (${trimmedName}) وباقي 10 أيام للاستلام!`);

    setTimeout(() => {
      setSuccessMsg(null);
      setRecipientName('');
      setTransferPassword('');
      setSelectedAmount(5);
    }, 4000);
  };

  const handleClaimTransfer = async () => {
    soundFx.playClickSound();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedTransfer) return;
    const trimmedPass = inputReceivePassword.trim();
    if (!trimmedPass) {
      setErrorMsg('يرجى كتابة الباسورد للتأكد من هويتك أولاً!');
      return;
    }

    // Verify and claim on internal server background endpoint
    try {
      const res = await fetch('/api/internal/claim-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: selectedTransfer.id,
          password: trimmedPass,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        soundFx.playWrongSound();
        setErrorMsg(data.error || 'هذا المال ليس لك، انت غير مسموح ان تستخدمه، اكتب الباسورد صح وسوف تستخدمه');
        return;
      }

      // Password verified! Add money to user balance
      const receivedAmount = data.amount || selectedTransfer.amount;
      onAddLiras(receivedAmount);
      soundFx.playWinSound();

      // Refresh list
      fetchTransfersFromServer();

      setSuccessMsg(`🎉 تم استلام مبلغ ${receivedAmount} ليرة بنجاح من (${data.senderName || selectedTransfer.senderName}) وتمت إضافته لرصيدك!`);
      setSelectedTransfer(null);
      setInputReceivePassword('');

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    } catch {
      // Local fallback verification
      if (selectedTransfer.password && selectedTransfer.password.trim() !== trimmedPass) {
        soundFx.playWrongSound();
        setErrorMsg('هذا المال ليس لك، انت غير مسموح ان تستخدمه، اكتب الباسورد صح وسوف تستخدمه');
        return;
      }

      onAddLiras(selectedTransfer.amount);
      soundFx.playWinSound();
      setPendingTransfers((prev) => prev.filter((t) => t.id !== selectedTransfer.id));

      setSuccessMsg(`🎉 تم استلام مبلغ ${selectedTransfer.amount} ليرة بنجاح من (${selectedTransfer.senderName}) وتمت إضافته لرصيدك!`);
      setSelectedTransfer(null);
      setInputReceivePassword('');

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none" dir="rtl">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1c1303] via-[#0f0b03] to-[#080501] border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 shadow-[0_0_80px_rgba(245,158,11,0.6)] my-auto flex flex-col max-h-[95vh] overflow-y-auto">
        
        {/* TOP BAR: Title & X Close Button */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400 animate-bounce" />
            <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-100">
              {mode === 'send' ? 'إرسال مال حقيقي للأشخاص' : 'استلام مال حقيقي من الأشخاص'}
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="p-2 text-amber-300/80 hover:text-white bg-amber-950/60 hover:bg-amber-900/60 rounded-full border border-amber-500/30 transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CURRENT LIRAS BADGE */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border-2 border-amber-500/60 flex items-center gap-2 text-yellow-400 font-black text-base shadow-inner">
            <Coins className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span>رصيدك الحالي: {gameState.liras} ليرة 🪙</span>
          </div>
        </div>

        {/* TWO ADJACENT TOGGLE BUTTONS (إرسال مال / استلام مال) */}
        <div className="grid grid-cols-2 gap-0 p-1.5 rounded-2xl bg-slate-950 border border-amber-500/40 mb-5 shadow-inner">
          <button
            onClick={() => {
              soundFx.playClickSound();
              setMode('send');
              setErrorMsg(null);
              setSelectedTransfer(null);
            }}
            className={`py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'send'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>إرسال مال</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClickSound();
              setMode('receive');
              setErrorMsg(null);
            }}
            className={`py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'receive'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>استلام مال</span>
          </button>
        </div>

        {/* ERROR / SUCCESS TOASTS */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/90 border-2 border-red-500 text-red-200 font-black text-xs sm:text-sm rounded-2xl text-center shadow-lg animate-shake flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 font-black text-xs sm:text-sm rounded-2xl text-center shadow-lg animate-bounce flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SEND MONEY SECTION */}
        {mode === 'send' && (
          <div className="animate-fade-in flex flex-col gap-4">
            
            {/* 1. Recipient Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" />
                <span>اسم المستلم الحقيقي (أكثر من 5 حروف، غير مكرر):</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="مثال: عبدالله_محمد"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-amber-500/50 text-white font-bold text-sm focus:outline-none focus:border-yellow-400 shadow-inner"
              />
            </div>

            {/* 2. Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>باسورد التحويل الآمن (&gt; 10 خانات، إنجليزي، أحرف كبيرة وصغيرة وأرقام):</span>
              </label>
              <input
                type="password"
                value={transferPassword}
                onChange={(e) => setTransferPassword(e.target.value)}
                placeholder="مثال: SecurePass2026X"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-amber-500/50 text-white font-bold text-sm focus:outline-none focus:border-yellow-400 shadow-inner"
              />
            </div>

            {/* 3. Amount Selector (5 to 400 step 5) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-200 flex items-center justify-between">
                <span>المبلغ المراد إرساله (الحد الأقصى 400 ليرة):</span>
                <span className="text-yellow-400 font-black text-sm">{selectedAmount} 🪙</span>
              </label>
              <select
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-amber-500/50 text-white font-bold text-sm focus:outline-none focus:border-yellow-400 shadow-inner cursor-pointer"
              >
                {amountOptions.map((amt) => (
                  <option key={amt} value={amt}>
                    {amt} ليرة
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Notice */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 font-bold">
              <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>مدة صلاحية الحوالة: تبقى محفوظة على السيرفر لمدة 10 أيام للاستلام قبل انقضائها.</span>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMoney}
              className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.6)] border-2 border-yellow-200 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5 fill-current" />
              <span>إرسال المبلغ ({selectedAmount} 🪙)</span>
            </button>

          </div>
        )}

        {/* RECEIVE MONEY SECTION (Simplified details, 10-day expiry, password verification) */}
        {mode === 'receive' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">قائمة الحوالات المتاحة للاستلام</h3>
                <p className="text-xs text-emerald-300/80 mt-0.5">تبين من أرسل المال وتفاصيله منبسطة، ويلزمك الباسورد لاستلامه</p>
              </div>
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  fetchTransfersFromServer();
                }}
                className="p-2 bg-slate-900 border border-slate-700 hover:border-emerald-400 text-emerald-400 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="تحديث القائمة"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تحديث</span>
              </button>
            </div>

            {/* Transfers List */}
            <div className="flex flex-col gap-3">
              {pendingTransfers.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
                    📭
                  </div>
                  <h4 className="text-base font-black text-slate-300">لا يوجد أي شخص أرسل مال حتى الآن!</h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    القائمة فارغة تماماً لعدم وجود أي مرسلين. عندما يرسل أي شخص مالاً من أي جهاز آخر وفق الشروط، سيظهر هنا فوراً بكل تفاصيله لتستلمه بالباسورد.
                  </p>
                </div>
              ) : (
                pendingTransfers.map((tx) => {
                  const remainingDays = getRemainingDays(tx.createdAt);
                  const isSelected = selectedTransfer?.id === tx.id;
                  return (
                    <div 
                      key={tx.id}
                      className={`p-4 rounded-2xl transition-all border ${
                        isSelected 
                          ? 'bg-slate-900 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-emerald-500/40 hover:border-emerald-400 shadow-md'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Section 1: Sender Name & Details */}
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-black text-base shrink-0">
                            👤
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-white">{tx.senderName}</h4>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                حوالة معتمدة
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                                ⏳ متبقي {remainingDays} أيام للاستلام
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {new Date(tx.createdAt || Date.now()).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Amount & Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40 text-yellow-400 font-black text-sm shadow-inner">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span>{tx.amount} ليرة</span>
                          </div>

                          <button
                            onClick={() => {
                              soundFx.playClickSound();
                              if (selectedTransfer?.id === tx.id) {
                                setSelectedTransfer(null);
                                setInputReceivePassword('');
                                setErrorMsg(null);
                              } else {
                                setSelectedTransfer(tx);
                                setInputReceivePassword('');
                                setErrorMsg(null);
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                              isSelected
                                ? 'bg-slate-800 text-slate-300 border border-slate-600'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                            }`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{isSelected ? 'إلغاء ✕' : 'الحصول على المبلغ 🪙'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Password Prompt when this transfer is clicked */}
                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-slate-800 animate-fade-in space-y-3">
                          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs text-slate-300 leading-relaxed">
                            🔐 <strong className="text-white">تأكيد الاستلام:</strong> يرجى كتابة الباسورد للتحقق والتأكد من هويتك لاستلام مبلغ ({tx.amount} ليرة) من ({tx.senderName}):
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="password"
                              value={inputReceivePassword}
                              onChange={(e) => {
                                setInputReceivePassword(e.target.value);
                                if (errorMsg) setErrorMsg(null);
                              }}
                              placeholder="اكتب باسورد الاستلام هنا للتأكد..."
                              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleClaimTransfer();
                              }}
                            />
                            <button
                              onClick={handleClaimTransfer}
                              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                              تأكيد واستلام المبلغ 💰
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTransfer(null);
                                setInputReceivePassword('');
                                setErrorMsg(null);
                              }}
                              className="px-3 py-2.5 bg-slate-900 text-slate-400 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
