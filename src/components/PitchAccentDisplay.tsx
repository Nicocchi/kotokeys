import type { VocabularyWord } from "../types";
import { getPitchAccentNumber, kanaToMoras, pitchPatternForWord } from "../lib";

type Props = {
  word: VocabularyWord;
  size?: "sm" | "md" | "lg";
  className?: string;
  showNumber?: boolean;
};

export function PitchAccentDisplay({ word, size = "md", className = "", showNumber = true }: Props) {
  const moras = kanaToMoras(word.kana);
  const pattern = pitchPatternForWord(word);
  const accentNumber = getPitchAccentNumber(word);

  if (moras.length === 0) {
    return null;
  }

  const sizeClass = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-2.5 py-1.5",
    lg: "text-2xl px-4 py-3",
  }[size];

  const moraClass = {
    sm: "min-w-[1.05rem] pt-1.5 pb-1",
    md: "min-w-[1.25rem] pt-2 pb-1.5",
    lg: "min-w-[2rem] pt-3 pb-2",
  }[size];

  const topLineClass = size === "lg" ? "border-t-[3px]" : "border-t-2";
  const bottomLineClass = size === "lg" ? "border-b-[3px]" : "border-b-2";
  const verticalLineClass = size === "lg" ? "border-r-[3px]" : "border-r-2";

  return (
    <div
      lang="ja"
      className={`jp-text inline-flex items-center gap-2 rounded-xl border border-default-200 bg-content2/80 text-foreground ${sizeClass} ${className}`}
      aria-label={`${word.kana}${accentNumber !== null ? `, pitch accent ${accentNumber}` : ""}`}
      title={accentNumber !== null ? `${word.kana} [${accentNumber}]` : word.kana}
    >
      <span className="inline-flex items-center">
        {moras.map((mora, index) => {
          const pitch = pattern[index] ?? "L";
          const nextPitch = pattern[index + 1];
          const hasTransition = nextPitch !== undefined && nextPitch !== pitch;

          return (
            <span
              key={`${word.id}-mora-${index}-${mora}`}
              className={`relative inline-flex items-center justify-center font-semibold leading-none ${moraClass}`}
            >
              <span
                className={`absolute left-0 right-0 top-0 rounded-full ${topLineClass} ${
                  pitch === "H" ? "border-danger" : "border-transparent"
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 right-0 rounded-full ${bottomLineClass} ${
                  pitch === "L" ? "border-default-400/80" : "border-transparent"
                }`}
              />
              {hasTransition && (
                <span
                  className={`absolute bottom-0 right-[-1px] top-0 ${verticalLineClass} border-danger`}
                />
              )}
              <span className={`relative z-10 ${pitch === "H" ? "text-danger" : "text-default-600"}`}>{mora}</span>
            </span>
          );
        })}
      </span>

      {showNumber && accentNumber !== null && (
        <span className="rounded-md bg-content1 px-1.5 py-0.5 text-xs font-bold text-default-500">[{accentNumber}]</span>
      )}
    </div>
  );
}
