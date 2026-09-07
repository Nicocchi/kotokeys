export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

export const SUBCATEGORIES = [
  "Time",
  "Family",
  "Food and Drinks",
  "Location/Place",
  "Action/Verb",
  "Adjective",
  "Numbers/Counting",
  "Nature/Weather",
  "Transportation",
  "Objects",
  "Animals",
  "Direction/Position",
  "School/Work",
  "Health/Body",
  "Hobbies/Activities",
  "People/Roles",
  "Other",
] as const;

export type JLPTLevel = (typeof JLPT_LEVELS)[number];
export type Subcategory = (typeof SUBCATEGORIES)[number];

export type KanjiTag = {
  kanji: string;
  meanings: string[];
};

export type FuriganaSegment = {
  text: string;
  reading?: string;
  highlight?: boolean;
};

export type VocabularyWord = {
  id: string;
  jlpt: JLPTLevel;
  subcategory: Subcategory;
  name: string;
  kanji: string;
  kana: string;
  pitchAccent?: string;
  pitchAccentNumber?: number;
  pitchPattern?: Array<"H" | "L">;
  meaning: string;
  explanation: string;
  kanjiBreakdown: KanjiTag[];
  example: {
    japanese: string;
    english: string;
    furigana?: FuriganaSegment[];
    source?: {
      name: string;
      license: string;
      japaneseSentenceId?: string;
      englishSentenceId?: string;
      url?: string;
    };
  };
  acceptedJapanese?: string[];
  acceptedEnglish?: string[];
};

export type PromptMode = "mixed" | "jp-to-en" | "en-to-jp";
export type ActiveDirection = "jp-to-en" | "en-to-jp";
export type AnswerStatus = "answering" | "correct" | "wrong";

export type KanjiRadicalInfo = {
  char: string;
  name: string;
  nameJa: string;
  meaning: string;
  position: string;
  positionJa: string;
  strokes: number | null;
  id: number | null;
};

export type KanjiMedia = {
  /** Kanji alive media name, e.g. "nani" or "jutsu-no(beru)". */
  name: string;
  /** End time (seconds) of each stroke in the stroke-order video; null means the video's end. */
  strokeTimings?: Array<number | null>;
};

export type KanjiInfo = {
  meanings: string[];
  strokes: number;
  onyomi: string[];
  kunyomi: string[];
  grade?: number;
  radical?: KanjiRadicalInfo;
  media?: KanjiMedia;
  source: "kanjialive" | "kanjidic";
};

export type RadicalInfo = {
  id: number;
  kangxi: number | null;
  radical: string;
  codepoint: string;
  strokes: number;
  meaning: string;
  reading: string;
  readingRomaji: string;
  position: string;
  positionRomaji: string;
  important: boolean;
  origin: string;
  variantOf: string | null;
  variantOfId: number | null;
  mediaName: string | null;
  hasAnimation: boolean;
};
