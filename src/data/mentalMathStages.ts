export interface MentalMathStage {
  stage: number;
  question: string;
  levelTitle: string;
  options: string[]; // Exactly 6 answers, 1 correct
  correctAnswer: string;
  explanation: string;
}

export const MENTAL_MATH_STAGES: MentalMathStage[] = [
  // STAGES 1 - 15: Grade 6 to 7 (Fractions, Operations, PEMDAS, Decimals)
  {
    stage: 1,
    question: "1/2 + 3/4 = ?",
    levelTitle: "الصف السادس - جمع الكسور",
    options: ["5/4", "4/6", "1", "7/4", "3/8", "3/2"],
    correctAnswer: "5/4",
    explanation: "2/4 + 3/4 = 5/4"
  },
  {
    stage: 2,
    question: "(15 × 4) - (28 ÷ 2) = ?",
    levelTitle: "الصف السادس - ترتيب العمليات",
    options: ["46", "44", "48", "32", "52", "36"],
    correctAnswer: "46",
    explanation: "60 - 14 = 46"
  },
  {
    stage: 3,
    question: "3/5 × 15/9 = ?",
    levelTitle: "الصف السادس - ضرب الكسور",
    options: ["1", "3/4", "5/3", "9/15", "2", "1/3"],
    correctAnswer: "1",
    explanation: "(3 × 15) / (5 × 9) = 45 / 45 = 1"
  },
  {
    stage: 4,
    question: "4.5 + 3.25 - 1.75 = ?",
    levelTitle: "الصف السادس - الأعداد العشرية",
    options: ["6", "5.5", "6.25", "5.75", "6.5", "7"],
    correctAnswer: "6",
    explanation: "4.5 + 1.5 = 6.0"
  },
  {
    stage: 5,
    question: "5/6 - 1/3 = ?",
    levelTitle: "الصف السادس - طرح الكسور",
    options: ["1/2", "4/3", "2/3", "1/3", "4/6", "3/4"],
    correctAnswer: "1/2",
    explanation: "5/6 - 2/6 = 3/6 = 1/2"
  },
  {
    stage: 6,
    question: "(8 + 4) × (18 ÷ 3) - 12 = ?",
    levelTitle: "الصف السادس - قواعد العمليات الحسابية",
    options: ["60", "54", "72", "48", "66", "64"],
    correctAnswer: "60",
    explanation: "12 × 6 - 12 = 72 - 12 = 60"
  },
  {
    stage: 7,
    question: "2/3 ÷ 4/9 = ?",
    levelTitle: "الصف السادس - قسمة الكسور",
    options: ["3/2", "8/27", "2/3", "4/3", "3/4", "5/3"],
    correctAnswer: "3/2",
    explanation: "(2/3) × (9/4) = 18/12 = 3/2"
  },
  {
    stage: 8,
    question: "(-8) × 4 + (-15) ÷ (-3) = ?",
    levelTitle: "الصف السادس/السابع - الأعداد الصحيحة والإشارات",
    options: ["-27", "-37", "-22", "27", "-35", "-19"],
    correctAnswer: "-27",
    explanation: "-32 + 5 = -27"
  },
  {
    stage: 9,
    question: "35% of 240 = ?",
    levelTitle: "الصف السادس - النسبة المئوية",
    options: ["84", "74", "94", "80", "78", "88"],
    correctAnswer: "84",
    explanation: "0.35 × 240 = 84"
  },
  {
    stage: 10,
    question: "7/8 - 1/4 + 1/2 = ?",
    levelTitle: "الصف السادس - عمليات الكسور المركبة",
    options: ["9/8", "7/8", "5/8", "11/8", "1", "3/4"],
    correctAnswer: "9/8",
    explanation: "7/8 - 2/8 + 4/8 = 9/8"
  },
  {
    stage: 11,
    question: "3² + 4² - 2³ = ?",
    levelTitle: "الصف السابع - الأسس والقوى",
    options: ["17", "19", "15", "21", "25", "13"],
    correctAnswer: "17",
    explanation: "9 + 16 - 8 = 17"
  },
  {
    stage: 12,
    question: "Solve for x: 3x - 7 = 26",
    levelTitle: "الصف السابع - معادلات الدرجة الأولى",
    options: ["11", "9", "13", "8", "12", "10"],
    correctAnswer: "11",
    explanation: "3x = 33 => x = 11"
  },
  {
    stage: 13,
    question: "(2/3 + 1/6) × 12 = ?",
    levelTitle: "الصف السابع - أقواس وكسور",
    options: ["10", "8", "12", "9", "14", "11"],
    correctAnswer: "10",
    explanation: "(4/6 + 1/6) × 12 = (5/6) × 12 = 10"
  },
  {
    stage: 14,
    question: "(-4)³ + 5² × 2 = ?",
    levelTitle: "الصف السابع - حساب الأسس السالبة والموجبة",
    options: ["-14", "-12", "-18", "14", "-24", "-8"],
    correctAnswer: "-14",
    explanation: "-64 + 25 × 2 = -64 + 50 = -14"
  },
  {
    stage: 15,
    question: "√196 - √81 + 3² = ?",
    levelTitle: "الصف السابع - الجذور التربيعية",
    options: ["14", "16", "12", "18", "10", "15"],
    correctAnswer: "14",
    explanation: "14 - 9 + 9 = 14"
  },

  // STAGES 16 - 31: Grade 7 to 8 (Multi-step algebra, equations, rational rules)
  {
    stage: 16,
    question: "Solve for x: x/4 + 9 = 17",
    levelTitle: "الصف السابع/الثامن - معادلات كسرية",
    options: ["32", "28", "36", "24", "30", "40"],
    correctAnswer: "32",
    explanation: "x/4 = 8 => x = 32"
  },
  {
    stage: 17,
    question: "(1/4 + 1/3) ÷ (7/12) = ?",
    levelTitle: "الصف السابع/الثامن - قسمة المقادير الكسرية",
    options: ["1", "7/12", "12/7", "2", "1/2", "3/4"],
    correctAnswer: "1",
    explanation: "(3/12 + 4/12) ÷ (7/12) = (7/12) ÷ (7/12) = 1"
  },
  {
    stage: 18,
    question: "4(2x + 3) = 44, x = ?",
    levelTitle: "الصف الثامن - حل المعادلات الخطية",
    options: ["4", "3", "5", "6", "2", "7"],
    correctAnswer: "4",
    explanation: "8x + 12 = 44 => 8x = 32 => x = 4"
  },
  {
    stage: 19,
    question: "(5/2)² - (3/2)² = ?",
    levelTitle: "الصف الثامن - متطابقات وفرق المربعات",
    options: ["4", "2", "8", "16", "6", "1"],
    correctAnswer: "4",
    explanation: "25/4 - 9/4 = 16/4 = 4"
  },
  {
    stage: 20,
    question: "|-18| - |-7| + (-3)² = ?",
    levelTitle: "الصف الثامن - القيمة المطلقة والقوى",
    options: ["20", "18", "22", "16", "24", "11"],
    correctAnswer: "20",
    explanation: "18 - 7 + 9 = 20"
  },
  {
    stage: 21,
    question: "2⁵ × 2³ ÷ 2⁴ = ?",
    levelTitle: "الصف الثامن - خواص الأسس",
    options: ["16", "32", "8", "64", "4", "12"],
    correctAnswer: "16",
    explanation: "2^(5 + 3 - 4) = 2⁴ = 16"
  },
  {
    stage: 22,
    question: "Solve for x: 5(x - 2) = 3x + 14",
    levelTitle: "الصف الثامن - معادلة ذات طرفين",
    options: ["12", "10", "14", "8", "16", "11"],
    correctAnswer: "12",
    explanation: "5x - 10 = 3x + 14 => 2x = 24 => x = 12"
  },
  {
    stage: 23,
    question: "√225 + ∛64 - 2⁴ = ?",
    levelTitle: "الصف الثامن - الجذور التكعيبية والتربيعية",
    options: ["3", "5", "1", "7", "4", "2"],
    correctAnswer: "3",
    explanation: "15 + 4 - 16 = 3"
  },
  {
    stage: 24,
    question: "If 2^(x+1) = 64, find x",
    levelTitle: "الصف الثامن - معادلات أسية تمهيدية",
    options: ["5", "4", "6", "7", "3", "8"],
    correctAnswer: "5",
    explanation: "2^(x+1) = 2⁶ => x + 1 = 6 => x = 5"
  },
  {
    stage: 25,
    question: "(3/4)⁻² = ?",
    levelTitle: "الصف الثامن - الأس السالب للكسور",
    options: ["16/9", "9/16", "-9/16", "4/3", "-16/9", "7/9"],
    correctAnswer: "16/9",
    explanation: "(4/3)² = 16/9"
  },
  {
    stage: 26,
    question: "Solve for x: (2x - 3)/5 = (x + 6)/4",
    levelTitle: "الصف الثامن/التاسع - التناسب والمعادلات",
    options: ["14", "12", "16", "10", "15", "18"],
    correctAnswer: "14",
    explanation: "4(2x - 3) = 5(x + 6) => 8x - 12 = 5x + 30 => 3x = 42 => x = 14"
  },
  {
    stage: 27,
    question: "Right triangle legs are 9 and 12. Hypotenuse = ?",
    levelTitle: "الصف الثامن/التاسع - نظرية فيثاغورس",
    options: ["15", "13", "17", "14", "21", "18"],
    correctAnswer: "15",
    explanation: "√(9² + 12²) = √(81 + 144) = √225 = 15"
  },
  {
    stage: 28,
    question: "3⁻¹ + 6⁻¹ = ?",
    levelTitle: "الصف الثامن - جمع المقاليب",
    options: ["1/2", "1/9", "2/9", "1/3", "2/3", "5/6"],
    correctAnswer: "1/2",
    explanation: "1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2"
  },
  {
    stage: 29,
    question: "If 3x + 2y = 22 and y = 2x - 3, find x",
    levelTitle: "الصف التاسع - التعويض في الأنظمة الخطية",
    options: ["4", "3", "5", "6", "2", "7"],
    correctAnswer: "4",
    explanation: "3x + 2(2x - 3) = 22 => 7x - 6 = 22 => 7x = 28 => x = 4"
  },
  {
    stage: 30,
    question: "Evaluate (x² - 16) / (x - 4) when x = 9",
    levelTitle: "الصف التاسع - تبسيط المقادير الجبرية",
    options: ["13", "11", "15", "9", "17", "12"],
    correctAnswer: "13",
    explanation: "(x - 4)(x + 4) / (x - 4) = x + 4. At x = 9: 9 + 4 = 13"
  },
  {
    stage: 31,
    question: "∛512 × √49 - 5² = ?",
    levelTitle: "الصف التاسع - العمليات المتقدمة على الجذور",
    options: ["31", "29", "33", "27", "35", "37"],
    correctAnswer: "31",
    explanation: "8 × 7 - 25 = 56 - 25 = 31"
  },

  // STAGES 32 - 34: Grade 8 to 9 HARD (أنظمة متقدمة، معادلات تربيعية، متطابقات شهيرة)
  {
    stage: 32,
    question: "Quadratic: x² - 11x + 24 = 0. Find the sum of roots",
    levelTitle: "الصف التاسع - مجموع جذري المعادلة التربيعية",
    options: ["11", "24", "8", "3", "-11", "14"],
    correctAnswer: "11",
    explanation: "Sum of roots = -b/a = -(-11)/1 = 11 (Roots: 3 and 8)"
  },
  {
    stage: 33,
    question: "System: 3x - 2y = 19 and 2x + y = 15. Find (x + y)",
    levelTitle: "الصف التاسع - حل جملة معادلتين خطيتين",
    options: ["8", "7", "9", "6", "10", "12"],
    correctAnswer: "8",
    explanation: "y = 15 - 2x => 3x - 2(15 - 2x) = 19 => 7x = 49 => x = 7, y = 1 => 7 + 1 = 8"
  },
  {
    stage: 34,
    question: "If a + 1/a = 5, find the exact value of a² + 1/a²",
    levelTitle: "الصف التاسع المتقدم - المتطابقات الشهيرة",
    options: ["23", "25", "27", "21", "20", "22"],
    correctAnswer: "23",
    explanation: "(a + 1/a)² = a² + 2 + 1/a² = 25 => a² + 1/a² = 23"
  },

  // STAGES 35 - 40: High School (2nd & 3rd Secondary - الثاني والثالث الثانوي)
  {
    stage: 35,
    question: "Trigonometry: 4 sin(30°) cos(60°) + tan²(45°) = ?",
    levelTitle: "الثاني ثانوي - النسب المثلثية الدائرية",
    options: ["2", "1", "3", "0", "1/2", "4"],
    correctAnswer: "2",
    explanation: "4 × (1/2) × (1/2) + 1² = 1 + 1 = 2"
  },
  {
    stage: 36,
    question: "Logarithms: log₂(64) + log₃(243) - ln(e⁴) = ?",
    levelTitle: "الثاني/الثالث ثانوي - قواعد اللوغاريتمات والأس الطبيعي",
    options: ["7", "8", "6", "9", "5", "11"],
    correctAnswer: "7",
    explanation: "6 + 5 - 4 = 7"
  },
  {
    stage: 37,
    question: "Calculus Limit: lim_{x → 4} (x² - 16) / (x - 4) = ?",
    levelTitle: "الثالث ثانوي - نهايات الدوال الكسرية",
    options: ["8", "4", "16", "0", "Undefined", "12"],
    correctAnswer: "8",
    explanation: "lim_{x → 4} (x + 4) = 4 + 4 = 8"
  },
  {
    stage: 38,
    question: "Calculus Derivative: If f(x) = 2x³ - 5x² + 7x - 9, find f'(2)",
    levelTitle: "الثالث ثانوي - مشتقة دالة كثيرات الحدود",
    options: ["11", "9", "13", "15", "7", "17"],
    correctAnswer: "11",
    explanation: "f'(x) = 6x² - 10x + 7. At x = 2: 6(4) - 10(2) + 7 = 24 - 20 + 7 = 11"
  },
  {
    stage: 39,
    question: "Combinatorics: Permutations & Combinations P(5, 2) + C(6, 2) = ?",
    levelTitle: "الثاني/الثالث ثانوي - التباديل والتوافيق",
    options: ["35", "30", "40", "25", "45", "50"],
    correctAnswer: "35",
    explanation: "P(5, 2) = 20, C(6, 2) = 15 => 20 + 15 = 35"
  },
  {
    stage: 40,
    question: "Definite Integral: ∫₀³ (3x² - 2x + 1) dx = ?",
    levelTitle: "الثالث ثانوي - التكامل المحدد النهائي",
    options: ["21", "18", "24", "27", "15", "30"],
    correctAnswer: "21",
    explanation: "[x³ - x² + x] from 0 to 3 = (27 - 9 + 3) - 0 = 21"
  }
];
