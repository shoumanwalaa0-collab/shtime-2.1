import React, { useMemo } from 'react';
import { LogOut, ArrowRight, DollarSign } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface RealCashEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName?: string;
}

interface ProfitRow {
  liras: number;
  lirasText: string;
  usdText: string;
}

export const RealCashEarningsModal: React.FC<RealCashEarningsModalProps> = ({
  isOpen,
  onClose,
  gameName = 'shtime-2.',
}) => {
  // Precompute the profit rows from 5,000 to 1,000,000 by 5,000 increments (+0.65$ each)
  const profitList = useMemo<ProfitRow[]>(() => {
    const list: ProfitRow[] = [];
    for (let lira = 5000; lira <= 1000000; lira += 5000) {
      const step = lira / 5000;
      const dollars = step * 0.65;
      
      let usdText = '';
      if (dollars < 1) {
        // e.g. 00،65$
        usdText = '00،65$';
      } else {
        // e.g. 1،30$, 1،95$, 2،60$, 130،00$
        usdText = `${dollars.toFixed(2).replace('.', '،')}$`;
      }

      list.push({
        liras: lira,
        lirasText: `${lira.toLocaleString()} ليرة`,
        usdText,
      });
    }
    return list;
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none"
      dir="rtl"
    >
      {/* 
        Gray Screen Background:
        "تكون بشاشه رماديه ومكتوب فيها باللون الاسود اسفل تتطلب هذه العمليه بعض الوقت.
        لكن وبالخلفيه تبين هذه الاشياء ويمكن تحليكها الى فوق وتحت وفي الاعلى الخط الابيض فوقه اسم اللعبه وحدها كبسه الخروج التي تؤدي الى صفحه واللي قبلها"
      */}
      <div className="relative w-full max-w-2xl h-[92vh] max-h-[780px] bg-[#6b7280] border-2 border-gray-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-black">
        
        {/* TOP BAR: ABOVE THE WHITE LINE */}
        <div className="w-full px-5 py-3.5 flex items-center justify-between bg-[#4b5563] text-white">
          {/* Game Name */}
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider drop-shadow-md">
              {gameName}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-black">
              أرباح مالية حقيقية
            </span>
          </div>

          {/* كبسة الخروج التي تؤدي إلى الصفحة واللي قبلها */}
          <button
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-black text-xs sm:text-sm rounded-2xl border border-red-400 shadow-md cursor-pointer active:scale-95 transition-all"
            title="خروج إلى الصفحة السابقة"
          >
            <ArrowRight className="w-4 h-4" />
            <span>خروج</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* الخط الأبيض الإلزامي في الأعلى تحت اسم اللعبة وكبسة الخروج */}
        <div className="w-full px-4 sm:px-6 my-3 shrink-0">
          <div className="w-full h-1.5 sm:h-2 bg-white shadow-[0_0_20px_rgba(255,255,255,0.95)] rounded-full"></div>
        </div>

        {/* 
          SCROLLABLE LIST AREA IN THE BACKGROUND:
          "وبالخلفيه تبين هذه الاشياء ويمكن تحريكها الى فوق وتحت"
        */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-28 sm:pb-36 space-y-2.5 bg-[#6b7280]">
          <div className="text-center mb-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-950">
              جدول تحويل أرباح الليرات إلى أموال حقيقية بالدولار 💵
            </h2>
            <p className="text-xs font-bold text-slate-900 mt-1">
              يبدأ من 5,000 ليرة إلى 1,000,000 ليرة بزيادة 65 سنتاً لكل 5,000 ليرة
            </p>
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            {profitList.map((item) => (
              <div
                key={item.liras}
                className="bg-[#e5e7eb] hover:bg-white text-black font-mono font-black text-sm sm:text-base px-4 py-3 rounded-xl border border-gray-400 shadow-sm flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-900">{item.lirasText}</span>
                </div>

                <div className="flex-1 mx-3 border-b-2 border-dotted border-gray-500 min-w-[24px]"></div>

                <div className="text-emerald-800 font-extrabold text-base sm:text-lg dir-ltr">
                  {item.usdText}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* الخط الأبيض الفاصل قبل الأسفل */}
        <div className="w-full h-0.5 bg-gray-400"></div>

        {/* 
          BOTTOM NOTE WRITTEN IN BLACK:
          "ومكتوب فيها باللون الاسود اسفل تتطلب هذه العمليه بعض الوقت."
        */}
        <div className="w-full py-3.5 px-4 bg-[#9ca3af] text-center border-t border-gray-400 shadow-inner">
          <p className="text-black font-black text-sm sm:text-base tracking-wide">
            تتطلب هذه العملية بعض الوقت.
          </p>
        </div>

      </div>
    </div>
  );
};
