import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import type { JLPTLevel, VocabularyWord } from "../types";
import { JLPT_LEVELS } from "../types";
import { words } from "../data/words";
import { WordDetails } from "./WordDetails";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const PAGE_SIZE = 150;

const wordsByLevel = new Map<JLPTLevel, VocabularyWord[]>(
  JLPT_LEVELS.map((level) => [level, words.filter((word) => word.jlpt === level)]),
);
// Browse order: N5 first, then up through N1 (the shared `words` array is sorted by id, which puts N1 first).
const allWords = JLPT_LEVELS.flatMap((level) => wordsByLevel.get(level) ?? []);

function searchText(word: VocabularyWord) {
  return [word.kanji, word.kana, word.name, word.meaning, ...(word.acceptedEnglish ?? []), ...(word.acceptedJapanese ?? [])]
    .join(" ")
    .toLowerCase();
}

export function WordsDialog({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<JLPTLevel | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = level ? (wordsByLevel.get(level) ?? []) : allWords;
    return needle ? pool.filter((word) => searchText(word).includes(needle)) : pool;
  }, [query, level]);

  const shown = visible.slice(0, limit);
  const grouped = useMemo(() => {
    const map = new Map<JLPTLevel, VocabularyWord[]>();
    for (const word of shown) {
      const list = map.get(word.jlpt) ?? [];
      list.push(word);
      map.set(word.jlpt, list);
    }
    return JLPT_LEVELS.filter((jlpt) => map.has(jlpt)).map((jlpt) => [jlpt, map.get(jlpt)!] as const);
  }, [shown]);

  function update(next: () => void) {
    next();
    setLimit(PAGE_SIZE);
    setExpandedId(null);
  }

  return (
    <>
      <button
        aria-label="Close words overlay"
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/55 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="words-title"
        className={`fixed left-1/2 top-1/2 z-[70] flex max-h-[88vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 flex-col rounded-[2rem] border border-default-200 bg-background shadow-2xl transition-all ${
          isOpen ? "-translate-y-1/2 scale-100 opacity-100" : "pointer-events-none -translate-y-[45%] scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-3 sm:p-7 sm:pb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Words</p>
            <h2 id="words-title" className="text-2xl font-black sm:text-3xl">
              All vocabulary
            </h2>
            <p className="mt-1 text-sm text-default-500">
              {visible.length.toLocaleString()} of {words.length.toLocaleString()} words · click a word for its full details.
            </p>
          </div>
          <Button variant="tertiary" className="rounded-full" onPress={onClose}>
            Close
          </Button>
        </div>

        <div className="px-5 pb-3 sm:px-7">
          <input
            type="search"
            value={query}
            onChange={(event) => update(() => setQuery(event.target.value))}
            placeholder="Search kanji, kana, or English meaning…"
            aria-label="Search words"
            className="w-full rounded-2xl border border-default-200 bg-content1 px-4 py-2 outline-none transition focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 px-5 pb-3 sm:px-7">
          <FilterChip active={level === null} onClick={() => update(() => setLevel(null))}>
            All levels
          </FilterChip>
          {JLPT_LEVELS.map((jlpt) => (
            <FilterChip key={jlpt} active={level === jlpt} onClick={() => update(() => setLevel(jlpt))}>
              {jlpt}
            </FilterChip>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7 sm:pb-7">
          {visible.length === 0 && <p className="py-8 text-center text-default-500">No words match your search.</p>}
          {grouped.map(([jlpt, items]) => (
            <section key={jlpt} className="mb-5">
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-default-500">
                {jlpt} · {(wordsByLevel.get(jlpt) ?? []).length.toLocaleString()} words
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((word) => (
                  <WordRow
                    key={word.id}
                    word={word}
                    expanded={expandedId === word.id}
                    onToggle={() => setExpandedId((current) => (current === word.id ? null : word.id))}
                  />
                ))}
              </div>
            </section>
          ))}
          {visible.length > limit && (
            <div className="flex justify-center pb-2">
              <Button variant="tertiary" className="rounded-full" onPress={() => setLimit((current) => current + PAGE_SIZE)}>
                Show {Math.min(PAGE_SIZE, visible.length - limit)} more ({(visible.length - limit).toLocaleString()} remaining)
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function WordRow({ word, expanded, onToggle }: { word: VocabularyWord; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      className={`rounded-2xl border bg-content1 transition hover:border-primary/50 ${
        expanded ? "border-primary/60 sm:col-span-2" : "border-default-200"
      }`}
    >
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full cursor-pointer items-center gap-3 p-3 text-left">
        <span lang="ja" className="jp-text min-w-[3.5rem] shrink-0 text-2xl font-bold leading-none">
          {word.kanji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            {word.kana !== word.kanji && (
              <span lang="ja" className="jp-text text-sm text-default-500">
                {word.kana}
              </span>
            )}
            <span className="truncate font-bold">{word.meaning}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{word.jlpt}</span>
          </span>
        </span>
        <span className="text-default-400">{expanded ? "▴" : "▾"}</span>
      </button>
      {expanded && (
        <div className="border-t border-default-200 p-3">
          <WordDetails word={word} showExampleFurigana className="rounded-2xl p-4 sm:p-5" />
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-bold transition ${
        active ? "koto-primary-fill" : "border-default-200 bg-content1 hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
