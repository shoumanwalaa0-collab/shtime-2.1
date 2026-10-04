export interface Milestone {
  id: string;
  type: 'liras' | 'stages';
  target: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badgeColor: string;
  glowColor: string;
}

export const MILESTONES: Milestone[] = [
  // Liras milestones
  {
    id: 'liras_50',
    type: 'liras',
    target: 50,
    title: 'بداية الثروة',
    subtitle: '50 ليرة في رصيدك',
    description: 'رائع! لقد جمعت أول 50 ليرة في محفظتك. خطوة ممتازة نحو احتراف الألغاز.',
    icon: '💰',
    badgeColor: 'from-amber-500 to-yellow-400',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'liras_100',
    type: 'liras',
    target: 100,
    title: 'مئة ليرة ذهبية',
    subtitle: '100 ليرة في رصيدك',
    description: 'إنجاز رائع! محفظتك تحتوي الآن على 100 ليرة كاملة. واصل التحدي لتحقيق المزيد.',
    icon: '🪙',
    badgeColor: 'from-yellow-400 to-amber-600',
    glowColor: 'rgba(245, 158, 11, 0.5)',
  },
  {
    id: 'liras_250',
    type: 'liras',
    target: 250,
    title: 'تاجر خبير',
    subtitle: '250 ليرة في رصيدك',
    description: 'أحسنت! رصيدك تجاوز 250 ليرة. يمكنك استخدامها في شراء الترقيات وتحديات الألعاب.',
    icon: '💎',
    badgeColor: 'from-cyan-400 to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.5)',
  },
  {
    id: 'liras_500',
    type: 'liras',
    target: 500,
    title: 'خزينة الذهب',
    subtitle: '500 ليرة في رصيدك',
    description: 'مذهل! رصيدك بلغ 500 ليرة. أصبحت من أغنى اللاعبين وأكثرهم حنكة.',
    icon: '👑',
    badgeColor: 'from-purple-500 to-indigo-600',
    glowColor: 'rgba(168, 85, 247, 0.5)',
  },
  {
    id: 'liras_1000',
    type: 'liras',
    target: 1000,
    title: 'مليونير الألغاز',
    subtitle: '1000 ليرة في رصيدك',
    description: 'أسطورة حقيقية! لقد جمعت 1,000 ليرة. ذكاؤك في حل الألغاز لا يقدّر بثمن.',
    icon: '🌟',
    badgeColor: 'from-emerald-400 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
  {
    id: 'liras_2000',
    type: 'liras',
    target: 2000,
    title: 'أسطورة الثروة',
    subtitle: '2000 ليرة في رصيدك',
    description: 'رصيدك بلغ 2,000 ليرة! لقد حطمت الأرقام القياسية في جمع الليرات.',
    icon: '🏆',
    badgeColor: 'from-amber-400 via-orange-500 to-red-500',
    glowColor: 'rgba(249, 115, 22, 0.6)',
  },
  {
    id: 'liras_5000',
    type: 'liras',
    target: 5000,
    title: 'ملك الليرات الخارق',
    subtitle: '5000 ليرة في رصيدك',
    description: 'أعلى مراتب الثراء والمجد! 5,000 ليرة في رصيدك، لا أحد ينافسك في الصدارة.',
    icon: '⚡',
    badgeColor: 'from-pink-500 via-purple-500 to-indigo-500',
    glowColor: 'rgba(236, 72, 153, 0.6)',
  },

  // Stages milestones
  {
    id: 'stages_5',
    type: 'stages',
    target: 5,
    title: 'أولى الخطوات',
    subtitle: 'إكمال 5 مراحل',
    description: 'بداية مشجعة! لقد اجتزت أول 5 مراحل من الألغاز بنجاح وتفوق.',
    icon: '🚀',
    badgeColor: 'from-blue-500 to-cyan-400',
    glowColor: 'rgba(59, 130, 246, 0.5)',
  },
  {
    id: 'stages_10',
    type: 'stages',
    target: 10,
    title: 'عاشق الألغاز',
    subtitle: 'إكمال 10 مراحل',
    description: 'ممتاز! أنهيت 10 مراحل. سرعة بديهتك تتطور مع كل لغز تحله.',
    icon: '🧠',
    badgeColor: 'from-indigo-500 to-purple-600',
    glowColor: 'rgba(99, 102, 241, 0.5)',
  },
  {
    id: 'stages_25',
    type: 'stages',
    target: 25,
    title: 'مفكك الرموز',
    subtitle: 'إكمال 25 مرحلة',
    description: 'أحسنت! 25 لغزاً تم فك رموزه بذكاء. أنت في طريقك نحو المستويات المتقدمة.',
    icon: '🔍',
    badgeColor: 'from-emerald-500 to-green-600',
    glowColor: 'rgba(34, 197, 94, 0.5)',
  },
  {
    id: 'stages_50',
    type: 'stages',
    target: 50,
    title: 'خبير التحديات',
    subtitle: 'إكمال 50 مرحلة',
    description: 'إنجاز نصف المئة! أتممت 50 مرحلة بنجاح باهر. مهاراتك العقلية لا مثيل لها.',
    icon: '🎯',
    badgeColor: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.5)',
  },
  {
    id: 'stages_75',
    type: 'stages',
    target: 75,
    title: 'بطل المراحل',
    subtitle: 'إكمال 75 مرحلة',
    description: 'بطل حقيقي! 75 مرحلة تم حلها. أنت تقترب من مرحلة المئة مرحلة الكبرى.',
    icon: '🎖️',
    badgeColor: 'from-rose-500 to-pink-600',
    glowColor: 'rgba(244, 63, 94, 0.5)',
  },
  {
    id: 'stages_100',
    type: 'stages',
    target: 100,
    title: 'نصف الطريق نحو القمة',
    subtitle: 'إكمال 100 مرحلة',
    description: 'إنجاز القرن! 100 مرحلة مكتملة. لقد قطعت نصف مشوار اللعبة كاملاً.',
    icon: '🏔️',
    badgeColor: 'from-cyan-500 via-blue-600 to-indigo-600',
    glowColor: 'rgba(6, 182, 212, 0.6)',
  },
  {
    id: 'stages_150',
    type: 'stages',
    target: 150,
    title: 'عبقري الألغاز',
    subtitle: 'إكمال 150 مرحلة',
    description: '150 لغزاً ومرحلة تم اجتيازها! عقلك فذّ وتفكيرك استراتيجي لا يُقهر.',
    icon: '🔮',
    badgeColor: 'from-purple-600 to-fuchsia-600',
    glowColor: 'rgba(192, 38, 211, 0.6)',
  },
  {
    id: 'stages_205',
    type: 'stages',
    target: 205,
    title: 'ختم اللعبة الأسطوري',
    subtitle: 'إكمال كل المراحل (205/205)',
    description: 'ألف مبروك! لقد ختمت جميع مراحل اللعبة الـ 205 كاملة وتوجت بطلاً مطلقاً للعبة!',
    icon: '👑',
    badgeColor: 'from-yellow-400 via-amber-500 to-red-600',
    glowColor: 'rgba(234, 179, 8, 0.8)',
  },
];

/**
 * Check if the user reached any new milestones
 */
export function checkNewMilestones(
  liras: number,
  completedStages: number,
  alreadyNotifiedIds: string[] = []
): Milestone | null {
  const notifiedSet = new Set(alreadyNotifiedIds);

  // Check stage milestones first (sorted by target ascending)
  const stageMilestones = MILESTONES.filter((m) => m.type === 'stages' && completedStages >= m.target && !notifiedSet.has(m.id));
  if (stageMilestones.length > 0) {
    return stageMilestones[0];
  }

  // Check liras milestones (sorted by target ascending)
  const lirasMilestones = MILESTONES.filter((m) => m.type === 'liras' && liras >= m.target && !notifiedSet.has(m.id));
  if (lirasMilestones.length > 0) {
    return lirasMilestones[0];
  }

  return null;
}
