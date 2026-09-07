/// <reference types="vite/client" />

import type { KanjiInfo, RadicalInfo } from "../types";
import kanjiJson from "./kanji/kanji.json";
import radicalsJson from "./kanji/radicals.json";

/** Per-kanji data for every kanji used by the word lists (Kanji alive + KANJIDIC2). */
export const kanjiData = kanjiJson as unknown as Record<string, KanjiInfo>;

/** All 214 traditional radicals plus their variants (Kanji alive). */
export const radicals = radicalsJson as unknown as RadicalInfo[];

const radicalsById = new Map(radicals.map((radical) => [radical.id, radical]));

const MEDIA_BASE = `${import.meta.env.BASE_URL}kanjialive`;

export function getKanjiInfo(char: string): KanjiInfo | undefined {
  return kanjiData[char];
}

export function getRadicalById(id: number | null | undefined): RadicalInfo | undefined {
  return id == null ? undefined : radicalsById.get(id);
}

export function kanjiAnimationUrl(mediaName: string) {
  return `${MEDIA_BASE}/kanji-animations/${encodeURIComponent(mediaName)}_00.mp4`;
}

export function radicalCharacterUrl(mediaName: string) {
  return `${MEDIA_BASE}/radical-characters/${encodeURIComponent(mediaName)}.svg`;
}

export function radicalFrameUrl(mediaName: string, frame: 0 | 1 | 2) {
  return `${MEDIA_BASE}/radical-animations/${encodeURIComponent(mediaName)}${frame}.svg`;
}

const POSITION_ICONS = new Set([
  "ashi",
  "gyougamae",
  "hakogamae",
  "hen",
  "kanmuri",
  "keigamae",
  "kigamae",
  "kunigamae",
  "mongamae",
  "nyou",
  "tare",
  "tsukuri",
  "tsutsumigamae",
]);

const POSITION_LABELS: Record<string, string> = {
  hen: "left side",
  tsukuri: "right side",
  kanmuri: "top",
  ashi: "bottom",
  tare: "top and left",
  nyou: "left and bottom",
  kamae: "enclosure",
  gyougamae: "left and right enclosure",
  hakogamae: "box enclosure (open right)",
  keigamae: "enclosure (open bottom)",
  kigamae: "enclosure (open bottom)",
  kunigamae: "full enclosure",
  mongamae: "gate enclosure",
  tsutsumigamae: "wrapping enclosure",
};

/** Kanji alive writes enclosure positions as "kamae, mongamae"; the icon uses the specific name. */
export function radicalPositionKey(positionRomaji: string): string | null {
  const parts = positionRomaji
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const key = parts[parts.length - 1];
  return key && POSITION_ICONS.has(key) ? key : null;
}

export function radicalPositionUrl(positionRomaji: string): string | null {
  const key = radicalPositionKey(positionRomaji);
  return key ? `${MEDIA_BASE}/radical-positions/${key}.svg` : null;
}

export function radicalPositionLabel(positionRomaji: string): string {
  const key = radicalPositionKey(positionRomaji) ?? positionRomaji.trim();
  return POSITION_LABELS[key] ?? key;
}
