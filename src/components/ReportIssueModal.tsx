import React, { useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { 
  X, AlertTriangle, Send, CheckCircle2, 
  Sparkles, Coins, Gem, MessageSquare 
} from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  onAddLiras?: (amount: number, reason: string) => void;
  onAddJewels?: (amount: number) => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  username = 'اللاعب',
}) => {
  const [issueText, setIssueText] = useState('');
  const [issueCategory, setIssueCategory] = useState<'bug' | 'suggestion' | 'content'>('bug');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;

    soundFx.playWinSound();
    
    // Save to local storage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem('user_reported_issues') || '[]');
      existing.unshift({
        id: Date.now(),
        text: issueText.trim(),
        category: issueCategory,
        date: new Date().toLocaleDateString('ar-EG'),
        status: 'قيد المراجعة',
      });
      localStorage.setItem('user_reported_issues', JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIssueText('');
      onClose();
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none" dir="rtl">
      <div className="relative w-full max-w-lg bg-[#0a0f1d] border-2 border-amber-400/90 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-white space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                الإبلاغ عن خلل أو مشكلة في التطبيق
              </h3>
              <p className="text-[11px] text-amber-300 font-bold">
                مكافأة قد تصل إلى 1000 ليرة أو 5 مجوهرات 💎
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Info Box */}
        <div className="p-3.5 rounded-2xl bg-[#131b2e] border border-amber-400/40 text-xs text-amber-100 font-medium leading-relaxed">
          إن رأيت أي خلل أو أي شيء غير جيد داخل التطبيق أو أي مشكلة غير جيدة داخل التطبيق فأبلغنا فوراً وممكن أن تحصل على مكافأة حسب المشكلة وممكن أن تصل المكافأة <span className="text-yellow-300 font-black underline">(1000) ليرة</span> أو <span className="text-cyan-300 font-black underline">5 مجوهرات</span>!
        </div>

        {isSubmitted ? (
          <div className="p-6 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 text-center space-y-3 animate-scale-up">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 animate-bounce">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">تم استلام بلاغك بنجاح!</h4>
            <p className="text-xs sm:text-sm text-emerald-200 font-bold leading-relaxed">
              شكراً لمساعدتك في تحسين التطبيق. سيتم فحص الخلل وإيداع المكافأة في حسابك فور التحقق منه.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-bold">نوع المشكلة:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIssueCategory('bug')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    issueCategory === 'bug'
                      ? 'bg-red-500/20 border-red-400 text-red-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  خلل برمجـي / عطل
                </button>
                <button
                  type="button"
                  onClick={() => setIssueCategory('content')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    issueCategory === 'content'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  خطأ في لغز أو سؤال
                </button>
                <button
                  type="button"
                  onClick={() => setIssueCategory('suggestion')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    issueCategory === 'suggestion'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  اقتراح أو تحسين
                </button>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-bold">
                اشرح ما رأيته بالتفصيل (أين ومتى حدث):
              </label>
              <textarea
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                placeholder="اكتب تفاصيل الخلل أو المشكلة هنا بدقة لمساعدتنا على حلها ومكافأتك..."
                rows={4}
                required
                className="w-full p-3 rounded-2xl bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 text-white text-xs sm:text-sm font-medium outline-none resize-none"
              />
            </div>

            {/* Rewards info tags */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-800 text-[11px]">
              <span className="text-slate-400">مكافآت التبليغ المعتمدة:</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  حتى 1000 ليرة
                </span>
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5 text-cyan-400" />
                  أو 5 مجوهرات
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!issueText.trim()}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>إرسال البلاغ الآن للإدارة</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
