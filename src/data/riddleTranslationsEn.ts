// Comprehensive English translations and fallbacks for Shtime-2 Riddles
export interface EnglishRiddleData {
  qEn: string;
  aEn: string;
  altsEn: string[];
  hEn: string;
}

// Stage-specific English data
export const RIDDLE_TRANSLATIONS_EN: Record<number, EnglishRiddleData> = {
  1: {
    qEn: 'I am a child of water, yet if thrown into water I perish and dissolve. When touched by fire, I turn solid and white as snow. What am I?',
    aEn: 'Salt',
    altsEn: ['salt', 'sea salt', 'table salt', 'the salt'],
    hEn: 'Extracted from the sea and seasoned on food',
  },
  2: {
    qEn: 'A silent object that judges between people fairly with no bias. It has no ears or tongue, and its decisions rest between two pans. What is it?',
    aEn: 'Scale',
    altsEn: ['scale', 'balance', 'scales', 'weighing scale'],
    hEn: 'Symbol of justice in courthouses',
  },
  3: {
    qEn: 'Ten and two tens, twice as much again, five, three, and two... What is the total sum of this clever calculation?',
    aEn: '100',
    altsEn: ['100', 'one hundred', 'hundred'],
    hEn: '10 + 20 + (30*2) + 5 + 3 + 2',
  },
  4: {
    qEn: 'A tiny vessel that fits in no hand, yet it swallows the sky, the sun, mountains, and oceans in the blink of a moment. What is it?',
    aEn: 'Eye',
    altsEn: ['eye', 'the eye', 'pupil', 'eyes'],
    hEn: 'Your organ of vision',
  },
  5: {
    qEn: 'Something that begins its life tall and ends short; it weeps light and perishes in tears whenever darkness descends. What is it?',
    aEn: 'Candle',
    altsEn: ['candle', 'the candle', 'wax candle'],
    hEn: 'Melts slowly to illuminate the dark',
  },
  6: {
    qEn: 'A plant seed word in Arabic: eaten whole it nourishes you; divided in half, the first half is deadly poison. What is it?',
    aEn: 'Sesame',
    altsEn: ['sesame', 'sesame seed'],
    hEn: 'In Arabic: "سم" is poison, "سمسم" is sesame',
  },
  7: {
    qEn: 'It will never stay firmly in place unless you strike it hard on its head, and the more it is hammered, the deeper it anchors. What is it?',
    aEn: 'Nail',
    altsEn: ['nail', 'the nail', 'iron nail'],
    hEn: 'Driven into wood or walls with a hammer',
  },
  8: {
    qEn: 'What walks with you step by step in broad daylight, but drowns and vanishes into nothingness when you enter a dark room?',
    aEn: 'Shadow',
    altsEn: ['shadow', 'your shadow', 'the shadow'],
    hEn: 'Formed by blocking light with your body',
  },
  9: {
    qEn: 'What penetrates transparent glass without shattering it, and immerses deep in fresh water without getting wet?',
    aEn: 'Light',
    altsEn: ['light', 'sunlight', 'beam of light', 'the light'],
    hEn: 'Travels at 300,000 km per second',
  },
  10: {
    qEn: 'Something that the more it is guarded, the easier it slips away, and if spoken once, it is lost forever. What is it?',
    aEn: 'Secret',
    altsEn: ['secret', 'a secret', 'the secret'],
    hEn: 'Entrusted only to your truest friend',
  },
  11: {
    qEn: 'A modern electric bullet train is traveling at 120 km/h heading South, while the wind is blowing East. Which direction does its smoke blow?',
    aEn: 'No smoke',
    altsEn: ['no smoke', 'none', 'there is no smoke', 'zero smoke'],
    hEn: 'Pay attention to the type of energy: it is electric!',
  },
  12: {
    qEn: 'A grand tree with no fruit and no shade; it bears twelve branches, and on each branch grow thirty leaves. What is it?',
    aEn: 'Year',
    altsEn: ['year', 'the year', 'calendar year'],
    hEn: '12 months and 30 days per month',
  },
  13: {
    qEn: 'A mute desert animal that can endure weeks without water, sleeps with its eyes open, and is famously called the ship of the desert?',
    aEn: 'Camel',
    altsEn: ['camel', 'the camel'],
    hEn: 'Withstands thirst and scorching desert journeys',
  },
  14: {
    qEn: 'What breathes every dawn without lungs or spirit, and is mentioned with reverence in the Holy Quran (Surah At-Takwir)?',
    aEn: 'Morning',
    altsEn: ['morning', 'dawn', 'daybreak', 'the morning'],
    hEn: '"And by the morning as it breathes"',
  },
  15: {
    qEn: 'What was the living tomb that traveled with its occupant across vast ocean depths in three layers of darkness?',
    aEn: 'Whale',
    altsEn: ['whale', 'the whale', 'whale of jonah'],
    hEn: 'The miracle of Prophet Yunus (Jonah)',
  },
  16: {
    qEn: 'What has five fingers, but possesses no flesh, no bones, and no heartbeat of life?',
    aEn: 'Glove',
    altsEn: ['glove', 'gloves', 'the glove'],
    hEn: 'Worn on hands for warmth or protection',
  },
  17: {
    qEn: 'Something with many sharp teeth that never bites, but rather arranges order atop the highest point of the body?',
    aEn: 'Comb',
    altsEn: ['comb', 'hair comb', 'the comb'],
    hEn: 'Untangles and styles your hair',
  },
  18: {
    qEn: 'What do you cast into the bottom of the sea when you need it, and pull back up when your voyage is ready to begin?',
    aEn: 'Anchor',
    altsEn: ['anchor', 'the anchor', 'ship anchor'],
    hEn: 'Holds massive vessels steady in harbors',
  },
  19: {
    qEn: 'What letter sits right in the exact middle of the word "PARIS"?',
    aEn: 'Letter R',
    altsEn: ['r', 'letter r', 'the letter r'],
    hEn: 'Look at the 3rd letter of P-A-R-I-S',
  },
  20: {
    qEn: 'A question asked to people everywhere, whose correct answer changes every single second and never stays constant?',
    aEn: 'What time is it',
    altsEn: ['time', 'what time is it', 'what is the time', 'current time'],
    hEn: 'Asked to determine the present moment',
  },
};

export function getEnglishRiddle(
  id: number,
  fallbackArabicQ: string,
  fallbackArabicA: string,
  fallbackArabicH: string
): EnglishRiddleData {
  if (RIDDLE_TRANSLATIONS_EN[id]) {
    return RIDDLE_TRANSLATIONS_EN[id];
  }

  // Generative fallback representation for other stages
  return {
    qEn: `Stage ${id} Challenge: ${fallbackArabicQ}`,
    aEn: fallbackArabicA,
    altsEn: [fallbackArabicA],
    hEn: `Hint: ${fallbackArabicH}`,
  };
}
