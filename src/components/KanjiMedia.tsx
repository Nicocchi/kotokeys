import { useEffect, useRef, useState } from "react";
import type { KanjiMedia, RadicalInfo } from "../types";
import { kanjiAnimationUrl, radicalCharacterUrl, radicalFrameUrl } from "../data/kanji";

/**
 * Renders a black-on-transparent SVG (Kanji alive radical art) using the current text
 * colour, so it stays visible in both light and dark themes.
 */
export function MaskedSvg({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  const mask = `url("${src}")`;
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block bg-current ${className}`}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

/** Radical character: Kanji alive artwork when available, otherwise the character in the radicals font. */
export function RadicalGlyph({
  radical,
  fallbackChar,
  className = "h-10 w-10",
}: {
  radical?: RadicalInfo;
  fallbackChar: string;
  className?: string;
}) {
  const label = radical ? `${radical.reading} radical` : `${fallbackChar} radical`;
  if (radical?.mediaName) {
    return <MaskedSvg src={radicalCharacterUrl(radical.mediaName)} label={label} className={className} />;
  }
  return (
    <span
      lang="ja"
      aria-label={label}
      className={`radical-text inline-flex items-center justify-center text-3xl font-bold leading-none ${className}`}
    >
      {radical?.radical ?? fallbackChar}
    </span>
  );
}

const FRAMES = [0, 1, 2] as const;
const FRAME_INTERVAL_MS = 1100;

/** Three-part Kanji alive drawing showing how a radical evolved from its pictograph into its modern form. */
export function RadicalAnimation({ radical, className = "" }: { radical: RadicalInfo; className?: string }) {
  const [frame, setFrame] = useState<0 | 1 | 2>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const mediaName = radical.mediaName;

  useEffect(() => {
    setFrame(0);
    setIsPlaying(true);
  }, [mediaName]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => setFrame((current) => ((current + 1) % 3) as 0 | 1 | 2), FRAME_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isPlaying, mediaName]);

  if (!mediaName || !radical.hasAnimation) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={() => setIsPlaying((playing) => !playing)}
        aria-label={isPlaying ? "Pause radical animation" : "Play radical animation"}
        title={isPlaying ? "Pause" : "Play"}
        className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-default-200 bg-content1 transition hover:border-primary/50"
      >
        <MaskedSvg src={radicalFrameUrl(mediaName, frame)} label={`${radical.reading} form ${frame + 1} of 3`} className="h-16 w-16" />
      </button>
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          {FRAMES.map((index) => (
            <button
              key={index}
              type="button"
              aria-pressed={frame === index}
              aria-label={`Show form ${index + 1}`}
              onClick={() => {
                setIsPlaying(false);
                setFrame(index);
              }}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition ${
                frame === index ? "koto-primary-fill" : "border-default-200 bg-content1 hover:border-primary/50"
              }`}
            >
              <MaskedSvg src={radicalFrameUrl(mediaName, index)} label="" className="h-6 w-6" />
            </button>
          ))}
        </div>
        <p className="text-xs text-default-500">Pictograph → modern form. Click a frame to pause.</p>
      </div>
    </div>
  );
}

/** Kanji alive stroke-order video with per-stroke seeking. */
export function KanjiStrokeAnimation({ kanji, media, className = "" }: { kanji: string; media: KanjiMedia; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeStroke, setActiveStroke] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timings = media.strokeTimings ?? [];
  const src = kanjiAnimationUrl(media.name);

  useEffect(() => {
    setActiveStroke(null);
    setIsPlaying(false);
  }, [media.name]);

  function play() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  }

  function strokeEnd(index: number) {
    const video = videoRef.current;
    const end = timings[index];
    return end ?? Math.max(0, (video?.duration ?? 0) - 0.05);
  }

  function seekToStroke(index: number) {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = strokeEnd(index);
    setActiveStroke(index);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || video.paused || timings.length === 0) return;
    const current = timings.findIndex((end) => end === null || video.currentTime < end);
    setActiveStroke(current === -1 ? timings.length - 1 : current);
  }

  // The videos have no poster; show the finished kanji (the last frame) until played.
  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video || Number.isNaN(video.duration)) return;
    video.currentTime = Math.max(0, video.duration - 0.05);
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => (isPlaying ? videoRef.current?.pause() : play())}
          aria-label={isPlaying ? `Pause stroke order for ${kanji}` : `Play stroke order for ${kanji}`}
          className="relative h-36 w-36 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-default-200 bg-white"
        >
          <video
            ref={videoRef}
            src={src}
            muted
            playsInline
            preload="auto"
            className="h-full w-full"
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
          />
          {!isPlaying && (
            <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs text-white">
              ▶
            </span>
          )}
        </button>
        <p className="min-w-[8rem] flex-1 text-xs text-default-500">
          {timings.length > 0
            ? `${timings.length} strokes. Click a number to jump to that stroke, or play the whole animation.`
            : "Click the video to play the stroke order."}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={play}
          className="cursor-pointer rounded-xl border border-default-200 bg-content1 px-3 py-1.5 text-sm font-bold transition hover:border-primary/50"
        >
          Play all
        </button>
        {timings.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={activeStroke === index}
            aria-label={`Show stroke ${index + 1}`}
            onClick={() => seekToStroke(index)}
            className={`h-9 min-w-9 cursor-pointer rounded-xl border px-2 text-sm font-bold transition ${
              activeStroke === index ? "koto-primary-fill" : "border-default-200 bg-content1 hover:border-primary/50"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
