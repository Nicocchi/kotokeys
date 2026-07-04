# Word data layout

KotoKeys loads every JSON file under `src/data/words/**` automatically with Vite's `import.meta.glob`.

Add new words to the matching JLPT/category file:

```text
src/data/words/n5/animals.json
src/data/words/n4/action-verb.json
src/data/words/n3/location-place.json
src/data/words/n2/school-work.json
src/data/words/n1/other.json
```

Each file should contain a JSON array. Empty categories can stay as `[]`.

## Pitch accent

Use `pitchAccentNumber` for the visual pitch accent display. This is the common numeric accent pattern:

```text
0 = heiban: low on the first mora, then high
1 = atamadaka: high on the first mora, then drops
2+ = pitch drops after that mora number
```

The app splits `kana` into morae, then draws the high/low pitch line automatically. High-pitch morae are shown in red, and low-pitch morae use a muted lower guide line. For most words, this means you only need to add `kana` and `pitchAccentNumber`.

Example:

```json
{
  "kana": "まいあさ",
  "pitchAccentNumber": 1
}
```

That displays like a visual pitch-accent guide instead of only showing `まいあさ [1]`.

For unusual words, you can override the generated pattern with `pitchPattern`:

```json
{
  "kana": "まいあさ",
  "pitchPattern": ["H", "L", "L", "L"]
}
```

## Example sentence furigana

Add optional `example.furigana` segments when you want the example sentence to render with readings above kanji. The plain `example.japanese` string is still required because it is used as the fallback when furigana is hidden or omitted.

```json
"example": {
  "japanese": "犬が公園にいます。",
  "english": "There is a dog in the park.",
  "furigana": [
    { "text": "犬", "reading": "いぬ", "highlight": true },
    { "text": "が" },
    { "text": "公園", "reading": "こうえん" },
    { "text": "にいます。" }
  ]
}
```

Segment fields:

```text
text = the visible Japanese text for this segment
reading = optional furigana shown above the segment
highlight = optional red highlight, useful for the target vocabulary word
```

Keep particles, kana-only parts, and punctuation as regular segments without `reading`.

## Full word example

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

The old `pitchAccent` string field is still supported as a fallback if it contains a number like `いぬ [2]`, but `pitchAccentNumber` is clearer for adding new data.

The app still uses the `jlpt` and `subcategory` fields inside each word. Keep those matching the folder/file so filtering works correctly.

## Sources/Credits

Example sentences and English translations may come from Tatoeba sentence pairs. Tatoeba data is community-contributed and released under CC BY 2.0 FR, with some sentences also available under CC0. When a word uses a Tatoeba example, the JSON keeps the Japanese sentence ID, English sentence ID, license, and sentence URL in `example.source`.

Pitch accent numbers were populated from Kanjium's `accents.txt` data. Attribution requested by that project:

> The pitch accent notation, verb particle data, phonetics, homonyms and other additions or modifications to EDICT, KANJIDIC or KRADFILE were provided by Uros O. through his free database.
