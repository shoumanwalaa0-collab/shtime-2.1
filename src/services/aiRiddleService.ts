import { Riddle } from '../types';

export interface GeneratedRiddlePayload {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  acceptedAnswersAr: string[];
  acceptedAnswersEn: string[];
  hintAr: string;
  hintEn: string;
  categoryIndex: number;
}

export async function fetchAiGeneratedRiddles(
  startStage: number,
  count = 10,
  language: 'ar' | 'en' = 'ar'
): Promise<Riddle[]> {
  try {
    const response = await fetch('/api/gemini/generate-riddles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startStage,
        count,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.riddles)) {
      return data.riddles.map((r: GeneratedRiddlePayload, idx: number) => ({
        id: startStage + idx,
        question: r.questionAr,
        answer: r.answerAr,
        acceptedAnswers: Array.isArray(r.acceptedAnswersAr) ? r.acceptedAnswersAr : [r.answerAr],
        hint: r.hintAr,
        categoryIndex: typeof r.categoryIndex === 'number' ? r.categoryIndex : 5,
        questionEn: r.questionEn,
        answerEn: r.answerEn,
        acceptedAnswersEn: Array.isArray(r.acceptedAnswersEn) ? r.acceptedAnswersEn : [r.answerEn],
        hintEn: r.hintEn,
        isAiGenerated: true,
      }));
    }
  } catch (error) {
    console.error('Error generating AI riddles:', error);
  }

  // High-IQ Fallback generated riddles in case network or API is temporarily unreachable
  return generateFallbackAiRiddles(startStage, count);
}

function generateFallbackAiRiddles(startStage: number, count: number): Riddle[] {
  const fallbacks: Omit<Riddle, 'id'>[] = [
    {
      question: 'أنا لست حيّاً، ولكنني أنمو؛ ليس لدي رئتان، لكنني أحتاج إلى الهواء لأعيش؛ والماء يقتلني فوراً.. فما أكون؟',
      answer: 'النار',
      acceptedAnswers: ['نار', 'اللهب', 'الشهب'],
      hint: 'تولد من شرارة وتلتهم الحطب',
      categoryIndex: 4,
      questionEn: 'I am not alive, but I grow; I do not have lungs, but I need air to live; and water kills me instantly. What am I?',
      answerEn: 'Fire',
      acceptedAnswersEn: ['fire', 'flame', 'the fire'],
      hintEn: 'Born from a spark and devours wood',
      isAiGenerated: true,
    },
    {
      question: 'شيء يملك وجهاً ولكن بلا عيون، وله يدان ولكن بلا أصابع، يتحرك بلا توقف ولكنه يظل في مكانه؟',
      answer: 'الساعة',
      acceptedAnswers: ['ساعة', 'ساعه', 'الساعه'],
      hint: 'تقيس الزمن بدقة',
      categoryIndex: 4,
      questionEn: 'I have a face with no eyes, and hands with no fingers. I move continuously yet stay in the same place. What am I?',
      answerEn: 'Clock',
      acceptedAnswersEn: ['clock', 'watch', 'the clock'],
      hintEn: 'Measures time accurately',
      isAiGenerated: true,
    },
    {
      question: 'ما هو الشيء الذي يمكنك أن تلمسه بيدك اليسرى فقط، ويستحيل عليك على الإطلاق أن تلمسه بيدك اليمنى؟',
      answer: 'كوع يدك اليمنى',
      acceptedAnswers: ['كوعك الايمن', 'كوع اليد اليمنى', 'الكوع الايمن', 'يدك اليمنى', 'مرفقك الايمن'],
      hint: 'جزء من ذراعك الأيمن',
      categoryIndex: 5,
      questionEn: 'What can you touch with your left hand, but can never touch with your right hand?',
      answerEn: 'Your right elbow',
      acceptedAnswersEn: ['right elbow', 'your right hand', 'right arm'],
      hintEn: 'Part of your right arm',
      isAiGenerated: true,
    },
    {
      question: 'أنا أسير في الليل والنهار بلا تعب، أعبر القارات دون جواز سفر، وأهمس في أذنك بلا صوت.. فما أنا؟',
      answer: 'الفكرة',
      acceptedAnswers: ['فكرة', 'الافكار', 'فكره', 'الخيال'],
      hint: 'تولد في العقل البشري',
      categoryIndex: 5,
      questionEn: 'I travel night and day without tiring, cross continents without a passport, and whisper to you soundlessly. What am I?',
      answerEn: 'Thought',
      acceptedAnswersEn: ['thought', 'idea', 'an idea', 'the thought'],
      hintEn: 'Born inside the human mind',
      isAiGenerated: true,
    },
    {
      question: 'ما هو الشيء الذي إذا غليته تجمد واشتد تماسكه، بدلاً من أن يذوب أو يتبخر؟',
      answer: 'البيض',
      acceptedAnswers: ['البيضة', 'بيضة', 'بيض'],
      hint: 'طعام غني بالبروتين يطهى بالسلق',
      categoryIndex: 5,
      questionEn: 'What gets harder and solidifies when boiled, instead of melting or evaporating?',
      answerEn: 'Egg',
      acceptedAnswersEn: ['an egg', 'egg', 'the egg', 'eggs'],
      hintEn: 'Protein food often boiled for breakfast',
      isAiGenerated: true,
    },
  ];

  return Array.from({ length: count }).map((_, i) => {
    const template = fallbacks[i % fallbacks.length];
    return {
      ...template,
      id: startStage + i,
      question: template.question,
      questionEn: template.questionEn,
    };
  });
}
