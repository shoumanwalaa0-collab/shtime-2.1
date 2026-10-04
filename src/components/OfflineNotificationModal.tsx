import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

export const OfflineNotificationModal: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showUpdateToast, setShowUpdateToast] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate update notification alert on startup/refresh
    const updateTimer = setTimeout(() => {
      setShowUpdateToast(true);
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(updateTimer);
    };
  }, []);

  return (
    <>
      {/* 1. OFFLINE MODAL (Blue box, center, loading circle, black background X button) */}
      {!isOnline && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-blue-950 via-[#0b1b3d] to-slate-950 border-2 border-blue-400 rounded-3xl p-6 shadow-[0_0_50px_rgba(59,130,246,0.5)] flex flex-col items-center text-center">
            
            {/* Top Black X Close Button */}
            <button
              onClick={() => setIsOnline(true)}
              className="absolute top-3 left-3 w-8 h-8 bg-black hover:bg-slate-900 text-white rounded-full flex items-center justify-center border border-blue-500/40 cursor-pointer shadow transition-all"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Loading / Rotating Circle with WifiOff Icon */}
            <div className="relative w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-400 flex items-center justify-center mb-4 animate-spin" style={{ animationDuration: '3s' }}>
              <WifiOff className="w-7 h-7 text-blue-300 animate-pulse" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">لا يوجد اتصال بالإنترنت</h3>
            <p className="text-xs text-blue-200 font-medium leading-relaxed mb-4">
              أنت ليس معك إنترنت حالياً. يرجى التحقق من اتصال الشبكة لكي يعمل نظام اللعب أونلاين وتحويلات المال الحقيقية بشكل سليم.
            </p>

            <button
              onClick={() => {
                soundFx.playClickSound();
                if (navigator.onLine) {
                  setIsOnline(true);
                } else {
                  alert('لم يتم استعادة الاتصال بعد، يرجى التحقق من الشبكة.');
                }
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. UPDATE NOTIFICATION BANNER (When game updates occur) */}
      {showUpdateToast && (
        <div className="fixed bottom-5 right-5 z-[90] max-w-sm bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce flex items-center gap-3" dir="rtl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            🚀
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-white">تحديث جديد متاح!</h4>
            <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
              تم إطلاق تحديث جديد للعبة والميزات أونلاين. اذهب وجرب الميزات الآن!
            </p>
          </div>
          <button
            onClick={() => setShowUpdateToast(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
