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
