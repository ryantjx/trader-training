/**
 * Answer marking.
 *
 * Numeric questions are marked at a fixed number of decimals (2 by default),
 * which is the project's rule for the parity game and the mental-math drills
 * alike. Marking at a fixed precision rather than a floating comparison is what
 * makes a "correct to 2dp" requirement meaningful and reproducible.
 */
import { roundTo } from './money';
import type { Question, Response } from './types';

export interface MarkResult {
  correct: boolean;
  /** Populated for numeric questions, for the feedback panel. */
  expected?: number;
  /** Populated for choice questions. */
  expectedId?: string;
  /** Populated for ordering questions. */
  expectedOrder?: string[];
  /** Populated for free-text questions, with the canonical spelling. */
  expectedText?: string;
}

function markNumeric(
  answer: number,
  tolerance: number,
  decimals: number,
  value: number | null,
): MarkResult {
  if (value === null || !Number.isFinite(value)) {
    return { correct: false, expected: answer };
  }
  if (tolerance > 0) {
    return { correct: Math.abs(value - answer) <= tolerance, expected: answer };
  }
  const a = roundTo(value, decimals);
  const b = roundTo(answer, decimals);
  return { correct: a === b, expected: answer };
}

/**
 * Corporate suffixes stripped before a free-text answer is compared.
 *
 * The desk writes "SoftBank Group" on one ticket and "Softbank" on the next; the
 * drill must not mark the second wrong. Only suffixes that never distinguish two
 * names in the dataset are listed. "Bank", "Land" and similar are deliberately
 * absent: dropping them would merge DBS Bank with DBS Group or Hongkong Land with
 * Hong Kong Exchange.
 */
const STRIPPED_SUFFIXES = new Set([
  'ltd',
  'limited',
  'plc',
  'inc',
  'incorporated',
  'corp',
  'corporation',
  'co',
  'company',
  'holdings',
  'holding',
  'group',
  'sa',
  'ag',
  'nv',
  'llc',
  'kk',
]);

/**
 * Fold a free-text answer to the form that is compared.
 *
 * Diacritics, case, punctuation and ampersands are removed, so "BHP Billiton &
 * Co." and "bhp billiton and co" collapse to the same string. Trailing corporate
 * suffixes are dropped repeatedly, but never the last remaining token, so a name
 * that is itself a suffix ("Group") cannot normalise to the empty string.
 */
export function normalizeTextAnswer(raw: string): string {
  const folded = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const tokens = folded.split(/\s+/).filter(Boolean);
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1] as string;
    if (!STRIPPED_SUFFIXES.has(last)) break;
    tokens.pop();
  }
  return tokens.join(' ');
}

/**
 * Damerau-Levenshtein distance, capped at `cap` for early exit.
 *
 * Transpositions count as one edit, because "softbnak" is the typo a keyboard
 * produces and it should not cost a mark.
 */
function editDistanceWithin(a: string, b: string, cap: number): boolean {
  if (Math.abs(a.length - b.length) > cap) return false;
  const rows = a.length + 1;
  const cols = b.length + 1;
  let prevPrev = new Array<number>(cols).fill(0);
  let prev = new Array<number>(cols).fill(0);
  let curr = new Array<number>(cols).fill(0);

  for (let j = 0; j < cols; j++) prev[j] = j;

  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    let rowMin = i;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] as number) + 1,
        (curr[j - 1] as number) + 1,
        (prev[j - 1] as number) + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        curr[j] = Math.min(curr[j] as number, (prevPrev[j - 2] as number) + 1);
      }
      rowMin = Math.min(rowMin, curr[j] as number);
    }
    if (rowMin > cap) return false;
    const swap = prevPrev;
    prevPrev = prev;
    prev = curr;
    curr = swap;
  }
  return (prev[cols - 1] as number) <= cap;
}

/** Shortest normalised answer that may absorb a typo. Below this, a one-letter
 * slip changes which company is named ("AIA" / "AIG", "CBA" / "CBI"). */
const TYPO_MIN_LENGTH = 8;

/**
 * Mark a free-text answer against every accepted variant.
 *
 * A one-edit difference is accepted only when both strings are at least
 * `TYPO_MIN_LENGTH` characters after normalisation, which keeps short ticker-like
 * names strict while forgiving a transposed pair of letters in a long one.
 */
export function markText(accept: readonly string[], submitted: string): boolean {
  const given = normalizeTextAnswer(submitted);
  if (given === '') return false;

  const variants = accept.map(normalizeTextAnswer).filter((v) => v !== '');
  if (variants.includes(given)) return true;
  if (given.length < TYPO_MIN_LENGTH) return false;

  return variants.some(
    (variant) => variant.length >= TYPO_MIN_LENGTH && editDistanceWithin(given, variant, 1),
  );
}

export function mark(question: Question, response: Response): MarkResult {
  switch (question.kind) {
    case 'numeric': {
      const value = response.kind === 'numeric' ? response.value : null;
      return markNumeric(question.answer, question.tolerance, question.decimals, value);
    }
    case 'choice': {
      const id = response.kind === 'choice' ? response.optionId : null;
      return { correct: id === question.answerId, expectedId: question.answerId };
    }
    case 'ordering': {
      const order = response.kind === 'ordering' ? response.order : [];
      const correct =
        order.length === question.answerOrder.length &&
        order.every((id, i) => id === question.answerOrder[i]);
      return { correct, expectedOrder: question.answerOrder };
    }
    case 'text': {
      const given = response.kind === 'text' ? response.text : '';
      return { correct: markText(question.accept, given), expectedText: question.answer };
    }
  }
}

/**
 * Whether a numeric answer sits exactly on a representable boundary.
 *
 * The generator tests use this to guarantee that a last-bit difference in a
 * transcendental function between two JS engines cannot change a mark. If an
 * answer is exactly representable at the marked precision, and it is not within
 * half an ulp of the boundary, rounding is stable.
 */
export function isMarkStable(answer: number, decimals: number, tolerance: number): boolean {
  if (tolerance > 0) return true; // a tolerance band absorbs any last-bit drift.
  const factor = 10 ** decimals;
  const scaled = answer * factor;
  // If the scaled value is within 1e-6 of an integer it is safe. If it is within
  // 1e-6 of a .5 boundary it is not, because that is where rounding flips.
  const nearestHalf = Math.round(scaled - 0.5) + 0.5;
  return Math.abs(scaled - nearestHalf) > 1e-6;
}
