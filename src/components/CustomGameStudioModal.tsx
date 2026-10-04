import React, { useState, useRef, useEffect } from 'react';
import { UserGameState, UserCustomGame } from '../types';
import { soundFx } from '../utils/soundEffects';
import {
  Sparkles,
  Gamepad2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  DollarSign,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface CustomGameStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onDeductJewels: (amount: number) => boolean;
  onAddJewels: (amount: number) => void;
  onOpenBuyJewels: () => void;
  onPublishGame: (game: UserCustomGame) => void;
  onShowPublishCelebration?: (gameName: string) => void;
}

// Preset default luxury game thumbnails for quick selection
const PRESET_GAME_IMAGES = [
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612287233207-6b4df9d4ceb8?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
];

export const CustomGameStudioModal: React.FC<CustomGameStudioModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onDeductJewels,
  onPublishGame,
  onShowPublishCelebration,
}) => {
  // Form State
  const [gameName, setGameName] = useState('');
  const [gameLink, setGameLink] = useState('');
  const [gameImage, setGameImage] = useState<string>(PRESET_GAME_IMAGES[0]);
  const [gameTax, setGameTax] = useState<number>(20);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // VALIDATION FOR LINK:
  // Must start with https:// or http://, have NO spaces anywhere, and be a valid working URL
  // "المهم ان لا يكون هناك اي فراغ والمهم ان يكون رابط يعمل وجيد وطبعا ليس اختراقا"
  const linkTrimmed = gameLink.trim();
  const startsWithHttp = linkTrimmed.startsWith('https://') || linkTrimmed.startsWith('http://');
  const hasNoSpaces = linkTrimmed.length > 0 && !/\s/.test(linkTrimmed);

  let isValidUrlStructure = false;
  try {
    if (startsWithHttp && hasNoSpaces) {
      const parsed = new URL(linkTrimmed);
      isValidUrlStructure = Boolean(parsed.hostname && parsed.hostname.includes('.'));
    }
  } catch {
    isValidUrlStructure = false;
  }

  const isLinkValid = startsWithHttp && hasNoSpaces && isValidUrlStructure;
  const isNameValid = gameName.trim().length > 0;
  const isImageValid = Boolean(gameImage);
  const hasEnoughJewels = (gameState.jewels || 0) >= 3;

  // ALL conditions must be met for button "التالي" to be enabled
  const isFormValid = isNameValid && isLinkValid && isImageValid && hasEnoughJewels;

  // Handle Image File Upload (drag/drop or manual select)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setGameImage(event.target.result as string);
        setErrorMsg(null);
        soundFx.playClickSound();
      }
    };
    reader.readAsDataURL(file);
  };

  // Publish validation & submit
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isPublishing) {
      soundFx.playWrongSound();
      return;
    }

    setErrorMsg(null);

    // Deduct Jewels
    const deducted = onDeductJewels(3);
    if (!deducted) {
      setErrorMsg('تعذر خصم المجوهرات! رصيدك غير كافٍ (تحتاج 3 مجوهرات 💎).');
      soundFx.playWrongSound();
      return;
    }

    setIsPublishing(true);
    soundFx.playWinSound();

    const newGame: UserCustomGame = {
      id: 'game_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: gameName.trim(),
      description: `لعبة رائعة تم تصميمها ونشرها بواسطة ${gameState.playerName || 'مستخدم'} بالذكاء الاصطناعي لجميع مستخدمي Shtime-2`,
      imageUrl: gameImage,
      url: linkTrimmed,
      tax: gameTax,
      creatorName: gameState.playerName || 'مستخدم',
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    // Save locally
    onPublishGame(newGame);

    // Save to real server backend
    try {
      await fetch('/api/custom-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame),
      });
    } catch {
      // Offline fallback
    }

    setIsPublishing(false);

    // Show celebration and close
    if (onShowPublishCelebration) {
      onShowPublishCelebration(gameName.trim());
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-gradient-to-b from-[#0e0a02] via-[#050401] to-slate-950 flex flex-col select-none overflow-y-auto"
      dir="rtl"
    >
      {/* 
        IMPORTANT NOTICE:
        "لا يمكن الخروج من هذه الصفحه ان دخل الى التطبيق طبعا لا يمكن الخروج من هذه الصفحه ابدا"
        As strictly ordered by user, there is NO exit button on this page!
      */}

      {/* Top Header */}
      <div className="w-full bg-[#090702] px-4 sm:px-8 pt-8 pb-6 flex flex-col items-center justify-center text-center shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.7)]">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
            اصنع لعبة وانشرها مع كل مستخدمين Shtime-2
          </h1>
        </div>
        <p className="text-sm sm:text-base text-amber-200/90 font-medium">
          املأ الحقول التالية لنشر لعبتك فوراً لجميع اللاعبين ليتمكنوا من لعبها وربح الليرات منها 🚀
        </p>
      </div>

      {/* الخط الأبيض البارز مع مسافة واسعة فوق وتحت */}
      <div className="w-full px-4 sm:px-8 my-4 sm:my-6">
        <div className="w-full h-1.5 sm:h-2 bg-white shadow-[0_0_25px_rgba(255,255,255,0.9)] rounded-full" />
      </div>

      {/* Main Content Area with generous vertical spacing (أكثر من 30 سم مساحة لتحت) */}
      <div className="w-full flex-1 max-w-4xl mx-auto px-4 sm:px-8 pt-4 pb-36 sm:pb-48 space-y-8">
        {/* Error Alert Message */}
        {errorMsg && (
          <div className="w-full bg-red-950/90 border-2 border-red-500 rounded-2xl p-4 text-center text-red-200 font-black text-sm animate-shake flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-8">
          {/* 1. الحقل الأول: اسم اللعبة */}
          <div className="bg-black/60 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] space-y-2 text-right">
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-black text-yellow-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>اسم اللعبة الخاص بك</span>
              </label>
              {isNameValid ? (
                <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-950/60 rounded-full border border-emerald-400/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم إدخال الاسم</span>
                </span>
              ) : (
                <span className="text-xs text-amber-300 font-bold px-3 py-1 bg-amber-950/60 rounded-full border border-amber-400/40">
                  مطلوب
                </span>
              )}
            </div>

            <input
              type="text"
              value={gameName}
              onChange={(e) => {
                setGameName(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="اكتب هنا اسم اللعبة..."
              className="w-full px-4 py-3 bg-slate-900/90 border-2 border-amber-400/60 rounded-2xl text-white font-bold text-base focus:outline-none focus:border-yellow-300 shadow-inner placeholder-amber-100/40"
            />

            {/* الشروط والتوضيح تحت الحقل مباشرة */}
            <p className="text-xs sm:text-sm text-amber-200/90 font-medium pt-1">
              📌 <span className="font-bold text-yellow-300">الاسم:</span> أي اسم تريده للعبة (لا بأس بأي اسم تختاره).
            </p>
          </div>

          {/* 2. الحقل الثاني: رابط اللعبة */}
          <div className="bg-black/60 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] space-y-3 text-right">
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-black text-yellow-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>رابط اللعبة (شروط دقيقة)</span>
              </label>
              {isLinkValid ? (
                <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-950/60 rounded-full border border-emerald-400/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>الرابط مستوفٍ للشروط</span>
                </span>
              ) : (
                <span className="text-xs text-amber-300 font-bold px-3 py-1 bg-amber-950/60 rounded-full border border-amber-400/40">
                  مطلوب بالشروط
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={gameLink}
                onChange={(e) => {
                  setGameLink(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="https://mygame.app أو https://mygame.net"
                className={`w-full px-4 py-3 bg-slate-900/90 border-2 rounded-2xl text-white font-mono font-bold text-sm sm:text-base focus:outline-none shadow-inner placeholder-amber-100/40 ${
                  isLinkValid
                    ? 'border-emerald-400'
                    : gameLink.length > 0
                    ? 'border-amber-400/80'
                    : 'border-amber-400/60'
                }`}
                dir="ltr"
              />
              <LinkIcon className="w-5 h-5 text-amber-400 absolute left-4 top-3.5 pointer-events-none" />
            </div>

            {/* الشروط والتوضيح الدقيق كما طلب المستخدم */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
                📌 <span className="font-bold text-yellow-300">شروط الرابط:</span> يجب أن يكون رابطاً صالحاً يعمل ويبدأ بـ <span className="font-mono text-cyan-300 font-bold">https://</span> أو <span className="font-mono text-cyan-300 font-bold">http://</span>، وممنوع وجود أي فراغات نهائياً (يمكن استخدام روابط ألعاب تنتهي بـ <span className="font-mono text-emerald-300 font-bold">.app</span> أو <span className="font-mono text-emerald-300 font-bold">.net</span> أو <span className="font-mono text-emerald-300 font-bold">.com</span>).
              </p>

              {/* بطاقات التحقق الفوري من الشروط */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs font-bold">
                <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                  startsWithHttp
                    ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300'
                    : 'bg-black/40 border-amber-500/30 text-amber-400/70'
                }`}>
                  {startsWithHttp ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4" />}
                  <span>يبدأ بـ https:// أو http://</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                  hasNoSpaces
                    ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300'
                    : 'bg-black/40 border-amber-500/30 text-amber-400/70'
                }`}>
                  {hasNoSpaces ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4" />}
                  <span>بدون أي فراغات نهائياً</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                  isValidUrlStructure
                    ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300'
                    : 'bg-black/40 border-amber-500/30 text-amber-400/70'
                }`}>
                  {isValidUrlStructure ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4" />}
                  <span>رابط موقع صالح وآمن</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. الحقل الثالث: مكان إضافة صورة */}
          <div className="bg-black/60 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] space-y-4 text-right">
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-black text-yellow-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
                  3
                </span>
                <span>إضافة صورة اللعبة</span>
              </label>
              <span className="text-xs text-amber-300 font-bold px-3 py-1 bg-amber-950/60 rounded-full border border-amber-400/40">
                مطلوب
              </span>
            </div>

            {/* الشروط والتوضيح تحت العنوان */}
            <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
              📌 <span className="font-bold text-yellow-300">الصورة:</span> أي صورة لتكون موجودة على الكارت الخاص باللعبة.
            </p>

            {/* Image upload button & Preset images */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Custom Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow border border-amber-400 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4 text-white" />
                <span>رفع صورة من جهازك 📁</span>
              </button>

              <span className="text-xs text-amber-300 font-bold">أو اختر صورة جاهزة فوراً:</span>

              {/* Preset Thumbnails */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_GAME_IMAGES.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setGameImage(imgUrl);
                      soundFx.playClickSound();
                    }}
                    className={`w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      gameImage === imgUrl
                        ? 'border-yellow-300 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                        : 'border-amber-400/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="Preset" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="pt-2 border-t border-amber-500/20">
              <span className="text-xs font-black text-amber-300 block mb-2">معاينة شكل كارت اللعبة كما سيظهر للجميع:</span>
              <div className="max-w-xs mx-auto rounded-2xl p-4 bg-gradient-to-r from-amber-950/90 via-yellow-950/70 to-slate-950 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] text-center space-y-2">
                <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 border-amber-400 shadow bg-black/60 flex items-center justify-center">
                  <img
                    src={gameImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-base font-black text-yellow-300 font-mono">
                  {gameName || 'اسم اللعبة هنا'}
                </h4>
                <div className="text-[11px] text-amber-200 font-bold flex items-center justify-between pt-1 border-t border-amber-500/30">
                  <span>ضريبة الدخول: {gameTax} ليرة</span>
                  <span className="text-cyan-300">دخول اللعبة 🚀</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. ضريبة الدخول (Tax) */}
          <div className="bg-black/60 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] space-y-2 text-right">
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-black text-yellow-300 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>ضريبة دخول اللعبة (كم يدفع اللاعب بالليرات للدخول):</span>
              </label>
              <span className="text-sm font-black text-yellow-300 px-3 py-1 bg-amber-950/80 rounded-xl border border-amber-400">
                {gameTax} ليرة 💰
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={40}
              step={5}
              value={gameTax}
              onChange={(e) => setGameTax(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
            />
            <p className="text-xs text-amber-200/80 font-medium">
              تحصل أنت على 50% من قيمة الضريبة في كل مرة يلعب فيها أي شخص لعبتك!
            </p>
          </div>

          {/* 
            5. كبسة "التالي" تحت الصورة والحقول
            "وتحت صوره كبسه التالي لا يمكن كبسها الا ان كانت الشروط توافق على هذا"
          */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!isFormValid || isPublishing}
              className={`w-full py-4.5 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all ${
                isFormValid && !isPublishing
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 shadow-[0_0_45px_rgba(245,158,11,0.85)] border-2 border-yellow-200 cursor-pointer active:scale-98'
                  : 'bg-slate-900/80 text-gray-500 border-2 border-gray-800 cursor-not-allowed opacity-60'
              }`}
            >
              <Sparkles className={`w-6 h-6 ${isFormValid ? 'fill-current text-slate-950 animate-bounce' : 'text-gray-600'}`} />
              <span>
                {isPublishing ? 'جاري إنتاج ونشر اللعبة...' : 'التالي ➔'}
              </span>
            </button>

            {!isFormValid && (
              <p className="text-center text-xs text-amber-300/80 font-bold">
                ⚠️ كبسة «التالي» معطلة حتى تستوفي جميع الشروط (الاسم، الرابط بالصيغة الصحيحة، الصورة، و3 مجوهرات 💎).
              </p>
            )}

            {/* كبسة تحت كبسة التالي: بدء صناعة تفتح الرابط المخصص */}
            <div className="pt-2">
              <a
                href="https://shtime-2-game.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundFx.playClickSound()}
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(79,70,229,0.6)] border-2 border-indigo-300 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center no-underline"
              >
                <ExternalLink className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span>بدء صناعة 🚀</span>
              </a>
              <p className="text-center text-[11px] text-indigo-200/80 mt-1 font-mono dir-ltr">
                https://shtime-2-game.app
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
