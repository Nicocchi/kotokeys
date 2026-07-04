import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { words } from "./data/words";
import { useThemeMode } from "./hooks/useThemeMode";
import {
  answerLabel,
  filterWords,
  getDirection,
  isCorrectAnswer,
  randomItem,
} from "./lib";
import { JLPT_LEVELS, SUBCATEGORIES } from "./types";
import type { ActiveDirection, AnswerStatus, JLPTLevel, PromptMode, Subcategory, VocabularyWord } from "./types";
import { WordDetails } from "./components/WordDetails";
import { PitchAccentDisplay } from "./components/PitchAccentDisplay";

const MAX_STREAK_KEY = "kotokeys-max-streak";
const LEGACY_MAX_STREAK_KEY = "kotopia-max-streak";
const DETAILS_PLACEMENT_KEY = "kotokeys-details-placement";
const LEGACY_DETAILS_PLACEMENT_KEY = "kotopia-details-placement";
const EXAMPLE_FURIGANA_KEY = "kotokeys-example-furigana";
const LEGACY_EXAMPLE_FURIGANA_KEY = "kotopia-example-furigana";
const USE_ALL_JLPT_LEVELS_KEY = "kotokeys-use-all-jlpt-levels";
const SELECTED_JLPT_LEVELS_KEY = "kotokeys-selected-jlpt-levels";
const USE_ALL_SUBCATEGORIES_KEY = "kotokeys-use-all-subcategories";
const SELECTED_SUBCATEGORIES_KEY = "kotokeys-selected-subcategories";
const PROMPT_MODE_KEY = "kotokeys-prompt-mode";
const LEGACY_PROMPT_MODE_KEY = "kotopia-prompt-mode";
const SHOW_KANA_KEY = "kotokeys-show-kana";
const LEGACY_SHOW_KANA_KEY = "kotopia-show-kana";
const THEME_KEY = "kotokeys-theme";
const LEGACY_THEME_KEY = "kotopia-theme";

const SAVED_OPTION_KEYS = [
  DETAILS_PLACEMENT_KEY,
  LEGACY_DETAILS_PLACEMENT_KEY,
  EXAMPLE_FURIGANA_KEY,
  LEGACY_EXAMPLE_FURIGANA_KEY,
  USE_ALL_JLPT_LEVELS_KEY,
  SELECTED_JLPT_LEVELS_KEY,
  USE_ALL_SUBCATEGORIES_KEY,
  SELECTED_SUBCATEGORIES_KEY,
  PROMPT_MODE_KEY,
  LEGACY_PROMPT_MODE_KEY,
  SHOW_KANA_KEY,
  LEGACY_SHOW_KANA_KEY,
  THEME_KEY,
  LEGACY_THEME_KEY,
];

type Question = {
  word: VocabularyWord;
  direction: ActiveDirection;
};

type DetailsPlacement = "side" | "bottom";

function getSavedValue(primaryKey: string, legacyKey: string) {
  return localStorage.getItem(primaryKey) ?? localStorage.getItem(legacyKey);
}

function getSavedBoolean(primaryKey: string, legacyKey: string, fallback: boolean) {
  const saved = getSavedValue(primaryKey, legacyKey);
  return saved === null ? fallback : saved === "true";
}

function getSavedBooleanValue(key: string, fallback: boolean) {
  const saved = localStorage.getItem(key);
  return saved === null ? fallback : saved === "true";
}

function getSavedOption<T extends string>(primaryKey: string, legacyKey: string, allowedValues: readonly T[], fallback: T) {
  const saved = getSavedValue(primaryKey, legacyKey);
  return saved !== null && allowedValues.includes(saved as T) ? (saved as T) : fallback;
}

function getSavedSelection<T extends string>(key: string, allowedValues: readonly T[], fallback: T[]) {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return fallback;

    const selected = allowedValues.filter((value) => parsed.includes(value));
    return selected.length > 0 ? selected : fallback;
  } catch {
    return fallback;
  }
}

function createQuestion(pool: VocabularyWord[], promptMode: PromptMode, previousId?: string): Question {
  const usable = pool.length > 1 ? pool.filter((word) => word.id !== previousId) : pool;
  return {
    word: randomItem(usable),
    direction: getDirection(promptMode),
  };
}

function sortJlptLevels(levels: JLPTLevel[]) {
  return [...levels].sort((a, b) => JLPT_LEVELS.indexOf(a) - JLPT_LEVELS.indexOf(b));
}

function sortSubcategories(subcategories: Subcategory[]) {
  return [...subcategories].sort((a, b) => SUBCATEGORIES.indexOf(a) - SUBCATEGORIES.indexOf(b));
}

function selectionBadgeLabel<T extends string>(selected: readonly T[], all: readonly T[], allLabel: string, pluralLabel: string) {
  if (selected.length === all.length) return allLabel;
  if (selected.length === 1) return selected[0];
  return `${selected.length} ${pluralLabel}`;
}

export default function App() {
  const { theme, toggleTheme, setTheme } = useThemeMode();

  const [useAllJlptLevels, setUseAllJlptLevels] = useState(() =>
    getSavedBooleanValue(USE_ALL_JLPT_LEVELS_KEY, true),
  );
  const [useAllSubcategories, setUseAllSubcategories] = useState(() =>
    getSavedBooleanValue(USE_ALL_SUBCATEGORIES_KEY, true),
  );
  const [selectedJlptLevels, setSelectedJlptLevels] = useState<JLPTLevel[]>(() =>
    getSavedSelection(SELECTED_JLPT_LEVELS_KEY, JLPT_LEVELS, [...JLPT_LEVELS]),
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<Subcategory[]>(() =>
    getSavedSelection(SELECTED_SUBCATEGORIES_KEY, SUBCATEGORIES, [...SUBCATEGORIES]),
  );
  const [promptMode, setPromptMode] = useState<PromptMode>(() =>
    getSavedOption(PROMPT_MODE_KEY, LEGACY_PROMPT_MODE_KEY, ["mixed", "jp-to-en", "en-to-jp"], "mixed"),
  );
  const [showKana, setShowKana] = useState(() =>
    getSavedBoolean(SHOW_KANA_KEY, LEGACY_SHOW_KANA_KEY, true),
  );
  const [showExampleFurigana, setShowExampleFurigana] = useState(() =>
    getSavedBoolean(EXAMPLE_FURIGANA_KEY, LEGACY_EXAMPLE_FURIGANA_KEY, true),
  );
  const [detailsPlacement, setDetailsPlacement] = useState<DetailsPlacement>(() => {
    const saved = getSavedValue(DETAILS_PLACEMENT_KEY, LEGACY_DETAILS_PLACEMENT_KEY);
    return saved === "bottom" || saved === "side" ? saved : "side";
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<AnswerStatus>("answering");
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(() => Number(getSavedValue(MAX_STREAK_KEY, LEGACY_MAX_STREAK_KEY) ?? 0));
  const answerInputRef = useRef<HTMLInputElement>(null);

  const activeJlptLevels = useMemo(
    () => (useAllJlptLevels ? [...JLPT_LEVELS] : selectedJlptLevels),
    [useAllJlptLevels, selectedJlptLevels],
  );

  const activeSubcategories = useMemo(
    () => (useAllSubcategories ? [...SUBCATEGORIES] : selectedSubcategories),
    [useAllSubcategories, selectedSubcategories],
  );

  const currentPool = useMemo(
    () => filterWords(words, activeJlptLevels, activeSubcategories),
    [activeJlptLevels, activeSubcategories],
  );

  const [question, setQuestion] = useState<Question>(() =>
    createQuestion(currentPool.length > 0 ? currentPool : words, promptMode),
  );

  const levelCounts = useMemo(() => {
    const map = new Map<JLPTLevel, number>();
    for (const level of JLPT_LEVELS) {
      map.set(level, words.filter((word) => word.jlpt === level && activeSubcategories.includes(word.subcategory)).length);
    }
    return map;
  }, [activeSubcategories]);

  const subcategoryCounts = useMemo(() => {
    const map = new Map<Subcategory, number>();
    for (const subcategory of SUBCATEGORIES) {
      map.set(
        subcategory,
        words.filter((word) => activeJlptLevels.includes(word.jlpt) && word.subcategory === subcategory).length,
      );
    }
    return map;
  }, [activeJlptLevels]);

  function startNewQuestion(pool = currentPool, mode = promptMode, previousId = question.word.id) {
    if (pool.length === 0) return;
    setQuestion(createQuestion(pool, mode, previousId));
    setAnswer("");
    setStatus("answering");
  }

  function submitAnswer() {
    if (status !== "answering") {
      startNewQuestion();
      return;
    }

    const correct = isCorrectAnswer(answer, question.word, question.direction);
    if (correct) {
      const nextStreak = streak + 1;
      const nextMax = Math.max(maxStreak, nextStreak);
      setStreak(nextStreak);
      setMaxStreak(nextMax);
      localStorage.setItem(MAX_STREAK_KEY, String(nextMax));
      setStatus("correct");
    } else {
      setStreak(0);
      setStatus("wrong");
    }
  }

  function handleFilterChange(
    nextUseAllJlptLevels: boolean,
    nextJlptLevels: JLPTLevel[],
    nextUseAllSubcategories: boolean,
    nextSubcategories: Subcategory[],
  ) {
    const nextActiveJlptLevels = nextUseAllJlptLevels ? [...JLPT_LEVELS] : sortJlptLevels(nextJlptLevels);
    const nextActiveSubcategories = nextUseAllSubcategories ? [...SUBCATEGORIES] : sortSubcategories(nextSubcategories);

    if (nextActiveJlptLevels.length === 0 || nextActiveSubcategories.length === 0) return;

    const nextPool = filterWords(words, nextActiveJlptLevels, nextActiveSubcategories);
    if (nextPool.length === 0) return;

    setUseAllJlptLevels(nextUseAllJlptLevels);
    setUseAllSubcategories(nextUseAllSubcategories);
    setSelectedJlptLevels(nextUseAllJlptLevels ? [...JLPT_LEVELS] : nextActiveJlptLevels);
    setSelectedSubcategories(nextUseAllSubcategories ? [...SUBCATEGORIES] : nextActiveSubcategories);
    setQuestion(createQuestion(nextPool, promptMode, question.word.id));
    setAnswer("");
    setStatus("answering");
  }

  function handleJlptToggle(level: JLPTLevel) {
    if (useAllJlptLevels) return;

    const isSelected = selectedJlptLevels.includes(level);
    const nextLevels = isSelected
      ? selectedJlptLevels.filter((selectedLevel) => selectedLevel !== level)
      : [...selectedJlptLevels, level];

    handleFilterChange(false, nextLevels, useAllSubcategories, selectedSubcategories);
  }

  function handleSubcategoryToggle(subcategory: Subcategory) {
    if (useAllSubcategories) return;

    const isSelected = selectedSubcategories.includes(subcategory);
    const nextSubcategories = isSelected
      ? selectedSubcategories.filter((selectedSubcategory) => selectedSubcategory !== subcategory)
      : [...selectedSubcategories, subcategory];

    handleFilterChange(useAllJlptLevels, selectedJlptLevels, false, nextSubcategories);
  }

  function handleUseAllJlptLevelsChange(useAll: boolean) {
    const nextJlptLevels = useAll ? [...JLPT_LEVELS] : [JLPT_LEVELS[0]];
    handleFilterChange(useAll, nextJlptLevels, useAllSubcategories, selectedSubcategories);
  }

  function handleUseAllSubcategoriesChange(useAll: boolean) {
    const nextSubcategories = useAll ? [...SUBCATEGORIES] : [SUBCATEGORIES[0]];
    handleFilterChange(useAllJlptLevels, selectedJlptLevels, useAll, nextSubcategories);
  }

  function handleRandomCategory() {
    const availablePairs = Array.from(
      new Map(words.map((word) => [`${word.jlpt}|${word.subcategory}`, word])).values(),
    );

    if (availablePairs.length === 0) return;

    const randomWordFromPair = randomItem(availablePairs);
    const nextJlptLevels = [randomWordFromPair.jlpt];
    const nextSubcategories = [randomWordFromPair.subcategory];
    const nextPool = filterWords(words, nextJlptLevels, nextSubcategories);

    setUseAllJlptLevels(false);
    setUseAllSubcategories(false);
    setSelectedJlptLevels(nextJlptLevels);
    setSelectedSubcategories(nextSubcategories);
    setQuestion(createQuestion(nextPool, promptMode, question.word.id));
    setAnswer("");
    setStatus("answering");
  }

  function handlePromptModeChange(nextMode: PromptMode) {
    setPromptMode(nextMode);
    localStorage.setItem(PROMPT_MODE_KEY, nextMode);
    setQuestion((current) => ({ ...current, direction: getDirection(nextMode) }));
    setAnswer("");
    setStatus("answering");
  }

  function handleShowKanaChange(show: boolean) {
    setShowKana(show);
    localStorage.setItem(SHOW_KANA_KEY, String(show));
  }

  function handleDetailsPlacementChange(nextPlacement: DetailsPlacement) {
    setDetailsPlacement(nextPlacement);
    localStorage.setItem(DETAILS_PLACEMENT_KEY, nextPlacement);
  }

  function handleExampleFuriganaChange(show: boolean) {
    setShowExampleFurigana(show);
    localStorage.setItem(EXAMPLE_FURIGANA_KEY, String(show));
  }

  function handleClearStreaks() {
    const shouldClear = window.confirm("Clear your current streak and max streak?");
    if (!shouldClear) return;

    setStreak(0);
    setMaxStreak(0);
    localStorage.setItem(MAX_STREAK_KEY, "0");
    localStorage.removeItem(LEGACY_MAX_STREAK_KEY);
  }

  function handleClearSavedOptions() {
    const shouldClear = window.confirm("Clear saved options and reset practice settings to defaults? Your streaks will not be cleared.");
    if (!shouldClear) return;

    for (const key of SAVED_OPTION_KEYS) {
      localStorage.removeItem(key);
    }

    const defaultJlptLevels = [...JLPT_LEVELS];
    const defaultSubcategories = [...SUBCATEGORIES];
    const defaultPool = filterWords(words, defaultJlptLevels, defaultSubcategories);

    setTheme("dark");
    setUseAllJlptLevels(true);
    setUseAllSubcategories(true);
    setSelectedJlptLevels(defaultJlptLevels);
    setSelectedSubcategories(defaultSubcategories);
    setPromptMode("mixed");
    setShowKana(true);
    setShowExampleFurigana(true);
    setDetailsPlacement("side");
    setQuestion(createQuestion(defaultPool.length > 0 ? defaultPool : words, "mixed", question.word.id));
    setAnswer("");
    setStatus("answering");
  }

  useEffect(() => {
    localStorage.setItem(USE_ALL_JLPT_LEVELS_KEY, String(useAllJlptLevels));
  }, [useAllJlptLevels]);

  useEffect(() => {
    localStorage.setItem(USE_ALL_SUBCATEGORIES_KEY, String(useAllSubcategories));
  }, [useAllSubcategories]);

  useEffect(() => {
    localStorage.setItem(SELECTED_JLPT_LEVELS_KEY, JSON.stringify(selectedJlptLevels));
  }, [selectedJlptLevels]);

  useEffect(() => {
    localStorage.setItem(SELECTED_SUBCATEGORIES_KEY, JSON.stringify(selectedSubcategories));
  }, [selectedSubcategories]);

  useEffect(() => {
    if (status === "answering") {
      answerInputRef.current?.focus();
    }
  }, [status, question.word.id]);

  useEffect(() => {
    function handleGlobalEnter(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.isComposing || isPanelOpen || isHelpOpen) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      const role = target?.getAttribute("role");

      // Let buttons and menu controls handle their own Enter behavior.
      if (tagName === "button" || tagName === "select" || tagName === "textarea" || role === "button") {
        return;
      }

      event.preventDefault();
      submitAnswer();
    }

    window.addEventListener("keydown", handleGlobalEnter);
    return () => window.removeEventListener("keydown", handleGlobalEnter);
  });

  const isResult = status !== "answering";
  const correctAnswer = answerLabel(question.word, question.direction);
  const promptInstruction = question.direction === "en-to-jp" ? "Type the Japanese" : "Type the English meaning";
  const jlptBadge = selectionBadgeLabel(activeJlptLevels, JLPT_LEVELS, "All JLPT", "Levels");
  const subcategoryBadge = selectionBadgeLabel(activeSubcategories, SUBCATEGORIES, "All Categories", "Categories");

  return (
    <main className="soft-grid min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">Japanese Vocab Trainer</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">KotoKeys</h1>
          </div>

          <div className="flex items-center gap-2">
            <StatPill label="Streak" value={streak} />
            <StatPill label="Max" value={maxStreak} />
            <Button variant="tertiary" className="rounded-full" onPress={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button variant="tertiary" className="rounded-full" onPress={() => setIsHelpOpen(true)}>
              Help
            </Button>
            <Button variant="primary" className="rounded-full" onPress={() => setIsPanelOpen(true)}>
              Menu
            </Button>
          </div>
        </header>

        <section className="grid flex-1 place-items-center">
          <div
            className={`w-full ${
              isResult && detailsPlacement === "side"
                ? "max-w-[1400px] xl:grid xl:grid-cols-[minmax(0,780px)_minmax(500px,560px)] xl:items-start xl:justify-center xl:gap-8"
                : "max-w-3xl"
            }`}
          >
            <div className="glass-panel rounded-[2rem] p-5 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>{jlptBadge}</Badge>
                  <Badge>{subcategoryBadge}</Badge>
                  <Badge>{question.word.jlpt} · {question.word.subcategory}</Badge>
                  <Badge>{question.direction === "en-to-jp" ? "English → Japanese" : "Japanese → English"}</Badge>
                </div>
                <p className="text-sm text-default-500">Press Enter to submit, then Enter again for next.</p>
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-default-500">{promptInstruction}</p>
              <div className="my-6 rounded-[1.5rem] bg-content1 p-6 text-center shadow-sm sm:p-10">
                {question.direction === "en-to-jp" ? (
                  <p className="break-words text-5xl font-black tracking-tight sm:text-7xl">{question.word.meaning}</p>
                ) : (
                  <JapanesePrompt word={question.word} showKana={showKana} />
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={answerInputRef}
                  autoFocus
                  disabled={isResult}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder={question.direction === "en-to-jp" ? "例: 犬 or いぬ" : "Example: dog"}
                  className="min-h-14 flex-1 rounded-2xl border border-default-200 bg-content1 px-4 text-lg outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 disabled:opacity-70"
                />
                <Button
                  className="min-h-14 rounded-2xl px-8 text-base font-bold"
                  variant={isResult ? "tertiary" : "primary"}
                  onPress={submitAnswer}
                >
                  {isResult ? "Next" : "Submit"}
                </Button>
              </div>

              {status === "correct" && (
                <ResultBox
                  tone="success"
                  title="Correct!"
                  message={`Answer: ${correctAnswer}`}
                  messageClassName={question.direction === "en-to-jp" ? "jp-text" : undefined}
                />
              )}

              {status === "wrong" && (
                <ResultBox
                  tone="danger"
                  title="Not quite"
                  message={`Correct answer: ${correctAnswer}`}
                  messageClassName={question.direction === "en-to-jp" ? "jp-text" : undefined}
                />
              )}
            </div>

            {isResult && (
              <WordDetails
                word={question.word}
                showExampleFurigana={showExampleFurigana}
                className={detailsPlacement === "side" ? "mt-5 xl:mt-0" : "mt-5"}
              />
            )}
          </div>
        </section>
      </div>

      <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <SidePanel
        isOpen={isPanelOpen}
        useAllJlptLevels={useAllJlptLevels}
        useAllSubcategories={useAllSubcategories}
        selectedJlptLevels={selectedJlptLevels}
        selectedSubcategories={selectedSubcategories}
        promptMode={promptMode}
        showKana={showKana}
        showExampleFurigana={showExampleFurigana}
        detailsPlacement={detailsPlacement}
        levelCounts={levelCounts}
        subcategoryCounts={subcategoryCounts}
        onClose={() => setIsPanelOpen(false)}
        onJlptToggle={handleJlptToggle}
        onSubcategoryToggle={handleSubcategoryToggle}
        onUseAllJlptLevelsChange={handleUseAllJlptLevelsChange}
        onUseAllSubcategoriesChange={handleUseAllSubcategoriesChange}
        onPromptModeChange={handlePromptModeChange}
        onShowKanaChange={handleShowKanaChange}
        onShowExampleFuriganaChange={handleExampleFuriganaChange}
        onDetailsPlacementChange={handleDetailsPlacementChange}
        onRandomCategory={handleRandomCategory}
        onClearStreaks={handleClearStreaks}
        onClearSavedOptions={handleClearSavedOptions}
      />
    </main>
  );
}

function JapanesePrompt({ word, showKana }: { word: VocabularyWord; showKana: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p lang="ja" className="jp-text break-words text-5xl font-black tracking-tight sm:text-7xl">{word.kanji}</p>
      {showKana && <PitchAccentDisplay word={word} size="lg" />}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-default-200 bg-content1 px-4 py-2 text-sm shadow-sm">
      <span className="text-default-500">{label}</span>
      <span className="ml-2 font-black">{value}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{children}</span>;
}

function ResultBox({
  tone,
  title,
  message,
  messageClassName = "",
}: {
  tone: "success" | "danger";
  title: string;
  message: string;
  messageClassName?: string;
}) {
  const className =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : "border-danger/30 bg-danger/10 text-danger";

  return (
    <div className={`mt-5 rounded-2xl border px-4 py-3 ${className}`}>
      <p className="font-bold">{title}</p>
      <p className={`mt-1 text-sm opacity-90 ${messageClassName}`}>{message}</p>
    </div>
  );
}


function HelpDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const sampleWord: VocabularyWord = {
    id: "help-pitch-sample",
    jlpt: "N5",
    subcategory: "Time",
    name: "毎朝",
    kanji: "毎朝",
    kana: "まいあさ",
    pitchAccentNumber: 1,
    meaning: "every morning",
    explanation: "Sample word used to show the pitch-accent guide.",
    kanjiBreakdown: [],
    example: {
      japanese: "毎朝、日本語を勉強します。",
      english: "I study Japanese every morning.",
    },
  };

  return (
    <>
      <button
        aria-label="Close help overlay"
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/55 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className={`fixed left-1/2 top-1/2 z-[70] max-h-[86vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-[2rem] border border-default-200 bg-background p-5 shadow-2xl transition-all sm:p-7 ${
          isOpen ? "-translate-y-1/2 scale-100 opacity-100" : "pointer-events-none -translate-y-[45%] scale-95 opacity-0"
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Help</p>
            <h2 id="help-title" className="text-2xl font-black sm:text-3xl">How to use KotoKeys</h2>
          </div>
          <Button variant="tertiary" className="rounded-full" onPress={onClose}>
            Close
          </Button>
        </div>

        <div className="grid gap-4">
          <HelpCard title="How to play">
            <ol className="list-decimal space-y-2 pl-5 text-default-600">
              <li>Use the All checkboxes for the widest word pool, or turn them off to choose specific JLPT levels and subcategories.</li>
              <li>Read the prompt and type the matching answer.</li>
              <li>Press Enter to submit. After the result appears, press Enter again for the next word.</li>
              <li>For English → Japanese prompts, kanji or kana answers are accepted when they are listed in the word data.</li>
              <li>Keep your streak alive by answering correctly in a row.</li>
            </ol>
          </HelpCard>

          <HelpCard title="Pitch accent guide">
            <p className="text-default-600">
              The small kana display shows the word split into morae. The red high parts are pronounced with high pitch.
              The muted lower line marks low pitch. A red vertical drop shows where the word falls from high to low.
            </p>
            <div className="mt-4 rounded-2xl border border-default-200 bg-content1 p-4">
              <p className="mb-2 text-sm font-bold text-default-500">Example</p>
              <PitchAccentDisplay word={sampleWord} size="lg" />
            </div>
          </HelpCard>

          <HelpCard title="What the fallback numbers mean">
            <div className="space-y-3 text-default-600">
              <p>
                Some sources write pitch accent as a number, like <span lang="ja" className="jp-text font-bold text-foreground">まいあさ [1]</span>.
                KotoKeys can read that old format, but <span className="font-bold text-foreground">pitchAccentNumber</span> is clearer in JSON.
              </p>
              <ul className="space-y-2">
                <li><span className="font-bold text-foreground">[0]</span> heiban: starts low, then rises and does not drop inside the word.</li>
                <li><span className="font-bold text-foreground">[1]</span> atamadaka: starts high on the first mora, then drops.</li>
                <li><span className="font-bold text-foreground">[2+]</span> nakadaka/odaka style numbering: starts low, rises, then drops after the numbered mora.</li>
              </ul>
            </div>
          </HelpCard>
        </div>
      </section>
    </>
  );
}

function HelpCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-default-200 bg-content2 p-4 sm:p-5">
      <h3 className="mb-2 text-lg font-black">{title}</h3>
      {children}
    </section>
  );
}


type SidePanelProps = {
  isOpen: boolean;
  useAllJlptLevels: boolean;
  useAllSubcategories: boolean;
  selectedJlptLevels: JLPTLevel[];
  selectedSubcategories: Subcategory[];
  promptMode: PromptMode;
  showKana: boolean;
  showExampleFurigana: boolean;
  detailsPlacement: DetailsPlacement;
  levelCounts: Map<JLPTLevel, number>;
  subcategoryCounts: Map<Subcategory, number>;
  onClose: () => void;
  onJlptToggle: (level: JLPTLevel) => void;
  onSubcategoryToggle: (subcategory: Subcategory) => void;
  onUseAllJlptLevelsChange: (useAll: boolean) => void;
  onUseAllSubcategoriesChange: (useAll: boolean) => void;
  onPromptModeChange: (mode: PromptMode) => void;
  onShowKanaChange: (show: boolean) => void;
  onShowExampleFuriganaChange: (show: boolean) => void;
  onDetailsPlacementChange: (placement: DetailsPlacement) => void;
  onRandomCategory: () => void;
  onClearStreaks: () => void;
  onClearSavedOptions: () => void;
};

function SidePanel({
  isOpen,
  useAllJlptLevels,
  useAllSubcategories,
  selectedJlptLevels,
  selectedSubcategories,
  promptMode,
  showKana,
  showExampleFurigana,
  detailsPlacement,
  levelCounts,
  subcategoryCounts,
  onClose,
  onJlptToggle,
  onSubcategoryToggle,
  onUseAllJlptLevelsChange,
  onUseAllSubcategoriesChange,
  onPromptModeChange,
  onShowKanaChange,
  onShowExampleFuriganaChange,
  onDetailsPlacementChange,
  onRandomCategory,
  onClearStreaks,
  onClearSavedOptions,
}: SidePanelProps) {
  return (
    <>
      <button
        aria-label="Close menu overlay"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-default-200 bg-background p-5 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Menu</p>
            <h2 className="text-2xl font-black">Practice Settings</h2>
          </div>
          <Button variant="tertiary" className="rounded-full" onPress={onClose}>
            Close
          </Button>
        </div>


        <PanelSection title="JLPT Levels">
          <AllFilterCheckbox
            label="All JLPT Levels"
            checked={useAllJlptLevels}
            onChange={onUseAllJlptLevelsChange}
          />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {JLPT_LEVELS.map((level) => {
              const isSelected = selectedJlptLevels.includes(level);
              const count = levelCounts.get(level) ?? 0;
              const isDisabled = useAllJlptLevels || (!isSelected && count === 0);

              return (
                <ToggleButton
                  key={level}
                  active={isSelected}
                  disabled={isDisabled}
                  onClick={() => onJlptToggle(level)}
                  compact
                >
                  <span className="block">{level}</span>
                </ToggleButton>
              );
            })}
          </div>
        </PanelSection>

        <PanelSection title="Subcategories">
          <AllFilterCheckbox
            label="All Subcategories"
            checked={useAllSubcategories}
            onChange={onUseAllSubcategoriesChange}
          />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUBCATEGORIES.map((subcategory) => {
              const count = subcategoryCounts.get(subcategory) ?? 0;
              const isSelected = selectedSubcategories.includes(subcategory);
              const isDisabled = useAllSubcategories || (!isSelected && count === 0);

              return (
                <ToggleButton
                  key={subcategory}
                  active={isSelected}
                  disabled={isDisabled}
                  onClick={() => onSubcategoryToggle(subcategory)}
                >
                  <span className="block text-sm font-bold">{subcategory}</span>
                  <span className={`text-xs ${isSelected ? "text-white/85" : "text-default-500"}`}>{count} words</span>
                </ToggleButton>
              );
            })}
          </div>
        </PanelSection>

        <PanelSection title="Prompt Direction">
          <div className="grid grid-cols-1 gap-2">
            <RadioButton active={promptMode === "mixed"} onClick={() => onPromptModeChange("mixed")}>
              Mixed
            </RadioButton>
            <RadioButton active={promptMode === "jp-to-en"} onClick={() => onPromptModeChange("jp-to-en")}>
              Japanese → English
            </RadioButton>
            <RadioButton active={promptMode === "en-to-jp"} onClick={() => onPromptModeChange("en-to-jp")}>
              English → Japanese
            </RadioButton>
          </div>
        </PanelSection>

        <PanelSection title="Display">
          <div className="grid gap-2">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-default-200 bg-content1 px-4 py-3">
              <span>
                <span className="block font-bold">Show hiragana / visual pitch accent</span>
                <span className="text-sm text-default-500">Used when Japanese is shown as the prompt.</span>
              </span>
              <input
                type="checkbox"
                checked={showKana}
                onChange={(event) => onShowKanaChange(event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-default-200 bg-content1 px-4 py-3">
              <span>
                <span className="block font-bold">Show example sentence furigana</span>
                <span className="text-sm text-default-500">Adds small kana readings above kanji in example sentences.</span>
              </span>
              <input
                type="checkbox"
                checked={showExampleFurigana}
                onChange={(event) => onShowExampleFuriganaChange(event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>

            <div className="rounded-2xl border border-default-200 bg-content1 p-3">
              <p className="mb-2 px-1 text-sm font-bold">Word details position</p>
              <div className="grid grid-cols-2 gap-2">
                <RadioButton active={detailsPlacement === "side"} onClick={() => onDetailsPlacementChange("side")}>
                  Side
                </RadioButton>
                <RadioButton active={detailsPlacement === "bottom"} onClick={() => onDetailsPlacementChange("bottom")}>
                  Bottom
                </RadioButton>
              </div>
            </div>
          </div>
        </PanelSection>

        <div className="mt-6 flex gap-2">
          <Button fullWidth variant="primary" className="rounded-2xl" onPress={onRandomCategory}>
            Random Category
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-danger">Reset</p>
          <p className="mb-4 text-sm leading-relaxed text-default-600">
            Clear streak counters or reset saved practice options on this device. Saved options include filters, prompt direction, display toggles, details placement, and theme.
          </p>
          <div className="grid gap-2">
            <Button fullWidth variant="tertiary" className="rounded-2xl border border-danger/40 text-danger hover:bg-danger/10" onPress={onClearStreaks}>
              Clear Streaks
            </Button>
            <Button fullWidth variant="tertiary" className="rounded-2xl border border-danger/40 text-danger hover:bg-danger/10" onPress={onClearSavedOptions}>
              Clear Saved Options
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

function AllFilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
        checked
          ? "koto-primary-fill hover:opacity-95"
          : "border-default-200 bg-content1 hover:border-primary/50"
      }`}
    >
      <span className="block font-black">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer accent-primary"
      />
    </label>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-default-500">{title}</h3>
      {children}
    </section>
  );
}

function ToggleButton({
  active,
  disabled = false,
  compact = false,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      aria-pressed={active}
      className={`rounded-2xl border text-left font-bold transition ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${compact ? "px-2 py-3 text-center" : "px-4 py-3"} ${
        active
          ? "koto-primary-fill"
          : disabled
            ? "border-default-200 bg-content1 text-default-400 opacity-45"
            : "border-default-200 bg-content1 hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function RadioButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border px-4 py-3 text-left font-bold transition cursor-pointer ${
        active ? "koto-primary-fill" : "border-default-200 bg-content1 hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
