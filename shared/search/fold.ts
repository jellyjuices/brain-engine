const MARKS = /[̀-ͯ]/g;
const JA = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\u30fc\\u3005";
const RUN = new RegExp(`[${JA}]+|(?:(?![${JA}])[\\p{L}\\p{N}\\p{M}])+`, "gu");
const JA_RUN = new RegExp(`^[${JA}]+$`, "u");

export interface WordSegmenter {
  segment(text: string): Iterable<{ segment: string; isWordLike?: boolean }>;
}

let cached: WordSegmenter | null | undefined;

export function fold(text: string): string {
  return text.normalize("NFKD").replace(MARKS, "").normalize("NFC").toLowerCase();
}

export function japaneseSegmenter(): WordSegmenter | null {
  if (cached === undefined) {
    const hasSegmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";
    cached = hasSegmenter ? new Intl.Segmenter("ja", { granularity: "word" }) : null;
  }
  return cached;
}

function unique(terms: string[]): string[] {
  return [...new Set(terms.filter((term) => term !== ""))];
}

function pairs(run: string): string[] {
  const chars = [...run];
  if (chars.length < 2) return [run];
  return chars.slice(1).map((char, i) => `${chars[i]}${char}`);
}

export function japaneseTerms(run: string, segmenter: WordSegmenter | null = japaneseSegmenter()): string[] {
  const words = segmenter ? [...segmenter.segment(run)].filter((part) => part.isWordLike !== false).map((part) => part.segment) : [];
  return unique([...words, ...pairs(run)]);
}

export function isJapanese(run: string): boolean {
  return JA_RUN.test(run);
}

export function tokenize(text: string, segmenter: WordSegmenter | null = japaneseSegmenter()): string[] {
  const runs = fold(text).match(RUN) ?? [];
  return unique(runs.flatMap((run) => (isJapanese(run) ? japaneseTerms(run, segmenter) : [run])));
}
