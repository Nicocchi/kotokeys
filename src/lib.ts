import type { ActiveDirection, PromptMode, VocabularyWord } from "./types";

export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getDirection(promptMode: PromptMode): ActiveDirection {
  if (promptMode === "mixed") return Math.random() > 0.5 ? "jp-to-en" : "en-to-jp";
  return promptMode;
}

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[。、,.!?！？'"“”‘’]/g, "")
    .replace(/^to/, "");
}

function englishMeaningParts(meaning: string): string[] {
  return meaning
    .split(/[;,/]/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getAcceptedAnswers(word: VocabularyWord, direction: ActiveDirection): string[] {
  if (direction === "en-to-jp") {
    return [...new Set([word.kanji, word.kana, word.name, ...(word.acceptedJapanese ?? [])])]
      .filter(Boolean)
      .map(normalizeAnswer);
  }

  return [
    ...englishMeaningParts(word.meaning),
    ...(word.acceptedEnglish ?? []),
  ]
    .filter(Boolean)
    .map(normalizeAnswer);
}

export function isCorrectAnswer(input: string, word: VocabularyWord, direction: ActiveDirection): boolean {
  const normalized = normalizeAnswer(input);
  if (!normalized) return false;
  return getAcceptedAnswers(word, direction).includes(normalized);
}

export function answerLabel(word: VocabularyWord, direction: ActiveDirection): string {
  return direction === "en-to-jp" ? `${word.kanji} / ${word.kana}` : word.meaning;
}


export function getPitchAccentNumber(word: VocabularyWord): number | null {
  if (typeof word.pitchAccentNumber === "number") return word.pitchAccentNumber;

  const match = word.pitchAccent?.match(/\[(\d+)\]/);
  return match ? Number(match[1]) : null;
}

const SMALL_KANA = new Set([
  "ゃ",
  "ゅ",
  "ょ",
  "ぁ",
  "ぃ",
  "ぅ",
  "ぇ",
  "ぉ",
  "ゎ",
  "ャ",
  "ュ",
  "ョ",
  "ァ",
  "ィ",
  "ゥ",
  "ェ",
  "ォ",
  "ヮ",
]);

export function kanaToMoras(kana: string): string[] {
  const moras: string[] = [];

  for (const char of kana.trim()) {
    if (SMALL_KANA.has(char) && moras.length > 0) {
      moras[moras.length - 1] += char;
    } else if (!/[\s\u3000]/.test(char)) {
      moras.push(char);
    }
  }

  return moras;
}

export function pitchPatternForWord(word: VocabularyWord): Array<"H" | "L"> {
  if (word.pitchPattern?.length) return word.pitchPattern;

  const moras = kanaToMoras(word.kana);
  const accentNumber = getPitchAccentNumber(word);

  if (accentNumber === null) {
    return moras.map(() => "L");
  }

  return moras.map((_, index) => {
    const moraNumber = index + 1;

    if (accentNumber === 0) {
      return moraNumber === 1 ? "L" : "H";
    }

    if (accentNumber === 1) {
      return moraNumber === 1 ? "H" : "L";
    }

    return moraNumber >= 2 && moraNumber <= accentNumber ? "H" : "L";
  });
}

export function pitchAccentLabel(word: VocabularyWord): string {
  const accentNumber = getPitchAccentNumber(word);
  return accentNumber === null ? word.kana : `${word.kana} [${accentNumber}]`;
}

export function visibleWordLabel(word: VocabularyWord, showKana: boolean): string {
  if (!showKana) return word.kanji;
  return `${word.kanji}（${pitchAccentLabel(word)}）`;
}

export function filterWords(words: VocabularyWord[], jlptLevels: readonly string[], subcategories: readonly string[]) {
  return words.filter((word) => jlptLevels.includes(word.jlpt) && subcategories.includes(word.subcategory));
}
