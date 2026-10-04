export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    appName: 'shtime-2.',
    appSubtitle: 'عالم الألغاز والذكاء الفائق',
    riddles: 'الألغاز',
    levelsAndRewards: 'المستويات والجوائز',
    upgradesAndShop: 'الترقية والمتجر',
    promoCode: 'تم إلغاء البرومو (لا أموال مجانية)',
    onlineGames: 'ألعاب أون لاين',
    otherGames: 'ألعاب أخرى',
    sendReceive: 'إرسال أو استلام ليرات',
    createGame: 'صناعة لعبة (3 مجوهرات)',
    communityGames: 'ألعاب المجتمع',
    realCash: 'أرباح مالية حقيقية',
    soon: 'SOON',
    language: 'اللغة',
    activeLanguage: 'عربي : مستخدم',
    englishLanguage: 'English',
    liras: 'ليرة',
    jewels: 'مجوهرات',
    logout: 'تسجيل خروج',
    stage: 'المرحلة',
    of: 'من',
    category: 'فئة',
    startStageNow: 'انقر لبدء المرحلة الآن',
    timeBoost: 'وقت إضافي',
    superWin: 'فوز أسطوري',
    hint: 'تلميح (5 ليرات)',
    submitAnswer: 'تحقق من الإجابة',
    placeholderAnswer: 'اكتب إجابتك الذكية هنا...',
    correctAnswerTitle: 'إجابة صحيحة وذكية! 🎉',
    correctAnswerDesc: 'مبروك! لقد ربحت +5 ليرات وتقدمت للمرحلة التالية!',
    nextStage: 'المرحلة التالية',
    wrongAnswerTitle: 'إجابة غير صحيحة!',
    timeoutTitle: 'انتهى الوقت المحدد!',
    theAnswerIs: 'الجواب الصحيح هو:',
    payToStay: 'دفع 20 ليرة والمحاولة مرة أخرى',
    fallBackThree: 'تراجع 3 مراحل (-15 ليرة)',
    aiStages: 'ألغاز الذكاء الاصطناعي (Gemini AI)',
    aiGenerateBtn: 'صناعة ألغاز جديدة بالذكاء الاصطناعي',
    aiGenerating: 'جاري استدعاء Gemini AI لصناعة أسئلة جديدة...',
    fcmNotifications: 'إشعارات FCM',
    fcmActive: 'خدمة FCM مفعلة',
    fcmPeriodicMsg: 'Shtime-2.  الاعب الان 2026_2027',
    fcmUpdateMsg: 'Now shtime-2 تحديث جديد يمكنك الان اذ انهيت المراحل يبدا الذكاء الاصطناعي بصناعه مراحل وتم اضافه قائمه SOON التي يمكنك بها رؤيه التحديثات القادمه',
    soonModalTitle: '1. قريباً انت بنفسك سوف تصنع سؤال',
    back: 'عودة',
    categories: {
      0: 'مبتدئ',
      1: 'الصعود',
      2: 'تقدم',
      3: 'متقدم',
      4: 'الرفع',
      5: 'صعب',
    },
  },
  en: {
    appName: 'shtime-2.',
    appSubtitle: 'World of Super Riddles & IQ',
    riddles: 'Riddles',
    levelsAndRewards: 'Levels & Rewards',
    upgradesAndShop: 'Upgrades & Shop',
    promoCode: 'Promo Cancelled (No Free Money)',
    onlineGames: 'Online Games',
    otherGames: 'Other Games',
    sendReceive: 'Send / Claim Liras',
    createGame: 'Create Game (3 Jewels)',
    communityGames: 'Community Games',
    realCash: 'Real Cash Earnings',
    soon: 'SOON',
    language: 'Language',
    activeLanguage: 'Arabic : In Use',
    englishLanguage: 'English',
    liras: 'Liras',
    jewels: 'Jewels',
    logout: 'Logout',
    stage: 'Stage',
    of: 'of',
    category: 'Category',
    startStageNow: 'Click to Start Stage Now',
    timeBoost: 'Extra Time',
    superWin: 'Super Win',
    hint: 'Hint (5 Liras)',
    submitAnswer: 'Submit Answer',
    placeholderAnswer: 'Type your smart answer here...',
    correctAnswerTitle: 'Correct & Brilliant Answer! 🎉',
    correctAnswerDesc: 'Congrats! You earned +5 Liras and advanced to the next stage!',
    nextStage: 'Next Stage',
    wrongAnswerTitle: 'Incorrect Answer!',
    timeoutTitle: 'Time Expired!',
    theAnswerIs: 'The correct answer is:',
    payToStay: 'Pay 20 Liras & Try Again',
    fallBackThree: 'Fall back 3 stages (-15 Liras)',
    aiStages: 'Gemini AI Smart Riddles',
    aiGenerateBtn: 'Generate New Riddles with AI',
    aiGenerating: 'Invoking Gemini AI to craft new challenges...',
    fcmNotifications: 'FCM Notifications',
    fcmActive: 'FCM Service Active',
    fcmPeriodicMsg: 'Shtime-2. Play now',
    fcmUpdateMsg: 'Now shtime-2 New update: Once you finish all stages, AI starts crafting new stages, and the SOON menu is added to preview upcoming updates!',
    soonModalTitle: '1. Soon you yourself will create questions',
    back: 'Back',
    categories: {
      0: 'Beginner',
      1: 'Ascent',
      2: 'Progress',
      3: 'Advanced',
      4: 'Elevation',
      5: 'Challenging',
    },
  },
} as const;

export function getStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem('shtime_language');
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    // fallback
  }
  return 'ar'; // Default language is Arabic
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem('shtime_language', lang);
  } catch {
    // ignore
  }
}
