import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import type { RadicalInfo } from "../types";
import { radicalPositionLabel, radicalPositionUrl, radicals } from "../data/kanji";
import { MaskedSvg, RadicalAnimation, RadicalGlyph } from "./KanjiMedia";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const STROKE_COUNTS = Array.from(new Set(radicals.map((radical) => radical.strokes))).sort((a, b) => a - b);

export function RadicalsDialog({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [strokeFilter, setStrokeFilter] = useState<number | null>(null);
  const [importantOnly, setImportantOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return radicals.filter((radical) => {
      if (strokeFilter !== null && radical.strokes !== strokeFilter) return false;
      if (importantOnly && !radical.important) return false;
      if (!needle) return true;
      return [radical.radical, radical.reading, radical.readingRomaji, radical.meaning, radical.position, radical.positionRomaji]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query, strokeFilter, importantOnly]);

  const grouped = useMemo(() => {
    const map = new Map<number, RadicalInfo[]>();
    for (const radical of visible) {
      const list = map.get(radical.strokes) ?? [];
      list.push(radical);
      map.set(radical.strokes, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [visible]);

  return (
    <>
      <button
        aria-label="Close radicals overlay"
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/55 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="radicals-title"
        className={`fixed left-1/2 top-1/2 z-[70] flex max-h-[88vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 flex-col rounded-[2rem] border border-default-200 bg-background shadow-2xl transition-all ${
          isOpen ? "-translate-y-1/2 scale-100 opacity-100" : "pointer-events-none -translate-y-[45%] scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-3 sm:p-7 sm:pb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Radicals</p>
            <h2 id="radicals-title" className="text-2xl font-black sm:text-3xl">
              The 214 traditional radicals
            </h2>
            <p className="mt-1 text-sm text-default-500">
              {visible.length} of {radicals.length} entries · variants are listed under their base radical's stroke count.
            </p>
          </div>
          <Button variant="tertiary" className="rounded-full" onPress={onClose}>
            Close
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-3 sm:px-7">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search meaning, reading, or radical…"
            aria-label="Search radicals"
            className="min-w-[14rem] flex-1 rounded-2xl border border-default-200 bg-content1 px-4 py-2 outline-none transition focus:border-primary"
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-default-200 bg-content1 px-3 py-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={importantOnly}
              onChange={(event) => setImportantOnly(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Important only
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5 px-5 pb-3 sm:px-7">
          <FilterChip active={strokeFilter === null} onClick={() => setStrokeFilter(null)}>
            All strokes
          </FilterChip>
          {STROKE_COUNTS.map((count) => (
            <FilterChip key={count} active={strokeFilter === count} onClick={() => setStrokeFilter(count)}>
              {count}
            </FilterChip>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7 sm:pb-7">
          {grouped.length === 0 && <p className="py-8 text-center text-default-500">No radicals match your search.</p>}
          {grouped.map(([strokes, items]) => (
            <section key={strokes} className="mb-5">
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-default-500">
                {strokes} {strokes === 1 ? "stroke" : "strokes"}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((radical) => (
                  <RadicalRow
                    key={radical.id}
                    radical={radical}
                    expanded={expandedId === radical.id}
                    onToggle={() => setExpandedId((current) => (current === radical.id ? null : radical.id))}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

function RadicalRow({ radical, expanded, onToggle }: { radical: RadicalInfo; expanded: boolean; onToggle: () => void }) {
  const positionUrl = radical.positionRomaji ? radicalPositionUrl(radical.positionRomaji) : null;
  const canExpand = radical.hasAnimation;

  return (
    <div
      className={`rounded-2xl border bg-content1 transition ${
        expanded ? "border-primary/60" : "border-default-200"
      } ${canExpand ? "hover:border-primary/50" : ""}`}
    >
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        className={`flex w-full items-center gap-3 p-3 text-left ${canExpand ? "cursor-pointer" : "cursor-default"}`}
      >
        <RadicalGlyph radical={radical} fallbackChar={radical.radical} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span lang="ja" className="jp-text font-bold">
              {radical.reading}
            </span>
            <span className="text-sm text-default-500">{radical.readingRomaji}</span>
            {radical.important && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Important</span>
            )}
            {radical.kangxi !== null && <span className="text-xs text-default-400">#{radical.kangxi}</span>}
          </p>
          <p className="truncate text-sm text-default-500">{radical.meaning}</p>
          {(radical.position || radical.variantOf) && (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-default-500">
              {radical.position && (
                <span className="inline-flex items-center gap-1">
                  {positionUrl && <MaskedSvg src={positionUrl} label="" className="h-3 w-3" />}
                  <span lang="ja" className="jp-text">
                    {radical.position}
                  </span>
                  <span>({radicalPositionLabel(radical.positionRomaji)})</span>
                </span>
              )}
              {radical.variantOf && (
                <span>
                  variant of{" "}
                  <span lang="ja" className="radical-text">
                    {radical.variantOf}
                  </span>
                </span>
              )}
            </p>
          )}
        </div>
        {canExpand && <span className="text-default-400">{expanded ? "▴" : "▾"}</span>}
      </button>
      {expanded && canExpand && (
        <div className="border-t border-default-200 p-3">
          <RadicalAnimation radical={radical} />
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
      className={`min-w-9 cursor-pointer rounded-full border px-3 py-1 text-sm font-bold transition ${
        active ? "koto-primary-fill" : "border-default-200 bg-content1 hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
