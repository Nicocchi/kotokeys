import { getKanjiInfo, getRadicalById, radicalPositionLabel, radicalPositionUrl } from "../data/kanji";
import { KanjiStrokeAnimation, MaskedSvg, RadicalAnimation, RadicalGlyph } from "./KanjiMedia";

type Props = {
  char: string;
  /** Meanings from the word data, used when the kanji is missing from the kanji dataset. */
  fallbackMeanings: string[];
  showStrokes: boolean;
  showRadicals: boolean;
};

export function KanjiInfoCard({ char, fallbackMeanings, showStrokes, showRadicals }: Props) {
  const info = getKanjiInfo(char);
  const meanings = info?.meanings?.length ? info.meanings : fallbackMeanings;
  const radical = info?.radical;
  const radicalEntry = getRadicalById(radical?.id);
  const positionUrl = radical ? radicalPositionUrl(radical.position) : null;

  return (
    <div className="rounded-2xl border border-default-200 bg-content1 p-4">
      <div className="flex items-start gap-4">
        <span lang="ja" className="jp-text shrink-0 text-5xl font-bold leading-none">
          {char}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-snug">{meanings.join(", ")}</p>
          {info && (
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-default-500">
              <dt className="font-semibold">Strokes</dt>
              <dd>{info.strokes}</dd>
              {info.onyomi.length > 0 && (
                <>
                  <dt className="font-semibold">On</dt>
                  <dd lang="ja" className="jp-text">
                    {info.onyomi.join("、")}
                  </dd>
                </>
              )}
              {info.kunyomi.length > 0 && (
                <>
                  <dt className="font-semibold">Kun</dt>
                  <dd lang="ja" className="jp-text">
                    {info.kunyomi.join("、")}
                  </dd>
                </>
              )}
            </dl>
          )}
        </div>
      </div>

      {showRadicals && radical && (
        <div className="mt-3 rounded-xl bg-content2 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-default-500">Radical</p>
          <div className="mt-2 flex items-center gap-3">
            <RadicalGlyph radical={radicalEntry} fallbackChar={radical.char} className="h-10 w-10 shrink-0" />
            <div className="min-w-0 text-sm">
              <p>
                <span lang="ja" className="jp-text font-bold">
                  {radical.nameJa || radical.char}
                </span>
                {radical.name && <span className="ml-1 text-default-500">({radical.name})</span>}
              </p>
              <p className="text-default-500">
                {radical.meaning}
                {radical.strokes ? ` · ${radical.strokes} ${radical.strokes === 1 ? "stroke" : "strokes"}` : ""}
              </p>
              {radical.position && (
                <p className="flex items-center gap-1.5 text-default-500">
                  {positionUrl && <MaskedSvg src={positionUrl} label="" className="h-3.5 w-3.5" />}
                  <span lang="ja" className="jp-text">
                    {radical.positionJa.split(/[、,]/).map((part) => part.trim()).filter(Boolean).pop()}
                  </span>
                  <span>· {radicalPositionLabel(radical.position)}</span>
                </p>
              )}
            </div>
          </div>
          {radicalEntry?.hasAnimation && <RadicalAnimation radical={radicalEntry} className="mt-3" />}
        </div>
      )}

      {showStrokes && info?.media && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-default-500">Stroke order</p>
          <KanjiStrokeAnimation kanji={char} media={info.media} />
        </div>
      )}
      {showStrokes && info && !info.media && (
        <p className="mt-3 text-xs text-default-500">No stroke-order animation is available for this kanji.</p>
      )}
    </div>
  );
}
