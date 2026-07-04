import { useEffect, useState } from "react";
import type { FuriganaSegment, VocabularyWord } from "../types";
import { PitchAccentDisplay } from "./PitchAccentDisplay";

type Props = {
  word: VocabularyWord;
  showExampleFurigana: boolean;
  className?: string;
};

export function WordDetails({ word, showExampleFurigana, className = "" }: Props) {
  const [showEnglishExample, setShowEnglishExample] = useState(false);

  useEffect(() => {
    setShowEnglishExample(false);
  }, [word.id]);

  return (
    <section className={`glass-panel w-full rounded-[2rem] p-6 sm:p-7 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-default-500">Word Info</p>
          <h2 lang="ja" className="jp-text mt-1 text-4xl font-bold tracking-tight">{word.name}</h2>
          <PitchAccentDisplay word={word} className="mt-3" />
          <p className="mt-2 text-xs text-default-500">Pitch guide: red top line/text = high pitch, muted bottom line = low pitch.</p>
        </div>
        <div className="rounded-2xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          {word.jlpt} · {word.subcategory}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <InfoItem label="Meaning" value={word.meaning} />
        <InfoItem label="Explanation" value={word.explanation} />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-default-500">Kanji</p>
        {word.kanjiBreakdown.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {word.kanjiBreakdown.map((tag) => (
              <span
                key={`${word.id}-${tag.kanji}`}
                className="rounded-2xl border border-default-200 bg-content1 px-3 py-2 text-sm"
              >
                <span lang="ja" className="jp-text mr-2 text-lg font-bold">{tag.kanji}</span>
                <span className="text-default-500">{tag.meanings.join(", ")}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-default-500">No kanji breakdown added yet.</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-content2 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-default-500">Example Sentence</p>
          <button
            type="button"
            onClick={() => setShowEnglishExample((visible) => !visible)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-default-200 bg-content1 px-3 py-1.5 text-sm font-bold text-default-600 transition hover:border-primary/50 hover:text-primary"
            aria-label={showEnglishExample ? "Hide English translation" : "Show English translation"}
            title={showEnglishExample ? "Hide English translation" : "Show English translation"}
          >
            {showEnglishExample ? <EyeIcon /> : <EyeOffIcon />}
            <span>{showEnglishExample ? "Hide" : "Reveal"}</span>
          </button>
        </div>

        <ExampleJapaneseSentence word={word} showFurigana={showExampleFurigana} />

        <div className="relative mt-3 overflow-hidden rounded-xl border border-default-200 bg-content1 px-4 py-3">
          <p
            className={`leading-relaxed text-default-500 transition duration-200 ${
              showEnglishExample ? "blur-0" : "select-none blur-sm"
            }`}
          >
            {word.example.english}
          </p>
          {!showEnglishExample && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-content1/25 text-sm font-bold text-default-500">
              Translation hidden
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-content2 p-4">
      <p className="text-sm font-semibold text-default-500">{label}</p>
      <p className="mt-1 leading-relaxed">{value}</p>
    </div>
  );
}

function ExampleJapaneseSentence({ word, showFurigana }: { word: VocabularyWord; showFurigana: boolean }) {
  const segments = word.example.furigana;

  if (!showFurigana || !segments || segments.length === 0) {
    return <p lang="ja" className="jp-text text-xl font-semibold leading-loose">{word.example.japanese}</p>;
  }

  return (
    <p lang="ja" className="jp-text example-sentence text-xl font-semibold leading-[2.25]">
      {segments.map((segment, index) => {
        const highlighted = isHighlightedSegment(segment, word);
        const key = `${word.id}-example-${index}-${segment.text}`;

        if (!segment.reading) {
          return (
            <span key={key} className={highlighted ? "text-danger" : undefined}>
              {segment.text}
            </span>
          );
        }

        return (
          <ruby key={key} className={highlighted ? "text-danger" : undefined}>
            <span>{segment.text}</span>
            <rt className={highlighted ? "text-danger" : "text-default-500"}>{segment.reading}</rt>
          </ruby>
        );
      })}
    </p>
  );
}

function isHighlightedSegment(segment: FuriganaSegment, word: VocabularyWord) {
  if (segment.highlight) return true;
  if (!word.kanji) return false;
  return segment.text === word.kanji || segment.text === word.name;
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
      <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c6.5 0 10 8 10 8a16.4 16.4 0 0 1-3.1 4.1" />
      <path d="M6.1 6.1C3.5 7.9 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 5.1-1.5" />
    </svg>
  );
}
