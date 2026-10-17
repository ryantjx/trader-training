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
