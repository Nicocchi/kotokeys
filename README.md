# KotoKeys

A serverless React/Vite Japanese vocabulary typing trainer.

## Install

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Add words

Word data is split by JLPT level and subcategory under `src/data/words/`. For example:

```text
src/data/words/n5/animals.json
src/data/words/n5/time.json
src/data/words/n4/action-verb.json
src/data/words/n3/location-place.json
src/data/words/n2/school-work.json
src/data/words/n1/other.json
```

Each file contains a JSON array. To add words later, open the matching file and add another object to that array. Empty category files can stay as `[]`.

Each word uses this shape:

```json
[
  {
    "id": "n5-object-book",
    "jlpt": "N5",
    "subcategory": "Objects",
    "name": "本",
    "kanji": "本",
    "kana": "ほん",
    "pitchAccent": "ほん [1]",
    "meaning": "book",
    "explanation": "A basic noun for book. It can also mean origin in some compounds.",
    "kanjiBreakdown": [
      {
        "kanji": "本",
        "meanings": [
          "book",
          "origin"
        ]
      }
    ],
    "example": {
      "japanese": "本を読みます。",
      "english": "I read a book.",
      "furigana": [
        {
          "text": "本",
          "reading": "ほん",
          "highlight": true
        },
        {
          "text": "を"
        },
        {
          "text": "読",
          "reading": "よ"
        },
        {
          "text": "みます。"
        }
      ]
    },
    "acceptedJapanese": [
      "本",
      "ほん"
    ],
    "acceptedEnglish": [
      "book"
    ],
    "pitchAccentNumber": 1
  }
]
```

### Example sentence furigana

Example sentence furigana is optional. If an example has a `furigana` array, the app renders it with ruby text above the kanji. If it does not, the app falls back to the plain `example.japanese` string.

Each segment supports:

```json
{ "text": "公園", "reading": "こうえん" }
```

Use segments without `reading` for kana, particles, punctuation, or text that does not need furigana. Add `"highlight": true` to color the target word red in the example sentence.

### Pitch accent display

Use `pitchAccentNumber` for new words. the app draws the visual high/low pitch guide from the kana automatically. High-pitch morae are shown in red, and low-pitch morae use a muted lower guide line:

```text
0 = heiban: low first mora, then high
1 = atamadaka: high first mora, then drops
2+ = pitch drops after that mora number
```

You can still use the older `pitchAccent` string format like `いぬ [2]`, but `pitchAccentNumber` is clearer and easier to render consistently. For unusual cases, `pitchPattern` can override the generated pattern, such as `["H", "L", "L", "L"]`.

## Japanese font rendering

The app bundles `@fontsource/noto-sans-jp` and applies it to Japanese text through the `.jp-text` class and `lang="ja"`. This helps kanji such as `今` render with Japanese glyph shapes instead of falling back to Chinese-oriented system fonts.

When adding new Japanese UI components, wrap Japanese text like this:

```tsx
<span lang="ja" className="jp-text">今</span>
```

## Scaling the word data

The app automatically imports every JSON file under `src/data/words/**` using Vite's `import.meta.glob`, so you do not need to update an index file when you add more category JSON files.


## Contributions

All the words come from the anki deck [here](https://ankiweb.net/shared/info/1550984460) since it includes JLPT N5-N1 and tagged appropriately.

Pitch accent data is taken from [Kanjium GitHub repository](https://github.com/mifunetoshiro/kanjium).

Example sentences are taken from:
- [Tatoeba home page](https://tatoeba.org/) 
- [Tatoeba terms of use](https://tatoeba.org/en/terms_of_use)

## AI Usage

- This repo is assisted with AI tools to generate a base site template and word conversion scripts.
- AI does ***NOT*** generate any of the words, sentences or pitch accent data.
- All words, sentences, and categories are manually reviewed by me to ensure they are correct.