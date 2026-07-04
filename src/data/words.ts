/// <reference types="vite/client" />

import type { VocabularyWord } from "../types";

const wordModules = import.meta.glob("./words/**/*.json", {
  eager: true,
  import: "default",
});

function getWordArray(moduleValue: unknown, path: string): VocabularyWord[] {
  if (!Array.isArray(moduleValue)) {
    throw new Error(`Expected ${path} to export an array of vocabulary words.`);
  }

  return moduleValue as VocabularyWord[];
}

export const words = Object.entries(wordModules)
  .flatMap(([path, moduleValue]) => getWordArray(moduleValue, path))
  .sort((a, b) => a.id.localeCompare(b.id));
