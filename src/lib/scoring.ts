/**
 * Scoring.
 *
 * Deliberately simple and legible: the trader's question is "am I getting these
 * right?", so the headline number is accuracy, not an opaque points total. No
 * speed component — the timer exists to create mild pressure and to be
 * informative, not to be scored.
 */
import { CATEGORIES, type AnswerRecord, type Category } from './types';

export interface CategoryScore {
  category: Category;
  correct: number;
  total: number;
  /** 0-100, or null when nothing in the category was attempted. */
  accuracy: number | null;
}

export interface SessionScore {
  correct: number;
  total: number;
  /** 0-100, rounded. */
  accuracy: number;
  elapsedMs: number;
  /** Mean time per answered question. */
  meanMs: number;
  byCategory: CategoryScore[];
}

export function scoreSession(records: readonly AnswerRecord[]): SessionScore {
  const total = records.length;
  const correct = records.filter((r) => r.correct).length;
  const elapsedMs = records.reduce((sum, r) => sum + r.elapsedMs, 0);

  const byCategory: CategoryScore[] = CATEGORIES.map((category) => {
    const inCategory = records.filter((r) => r.question.category === category);
    const hits = inCategory.filter((r) => r.correct).length;
    return {
      category,
      correct: hits,
      total: inCategory.length,
      accuracy: inCategory.length === 0 ? null : Math.round((hits / inCategory.length) * 100),
    };
  }).filter((c) => c.total > 0);

  return {
    correct,
    total,
    accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
    elapsedMs,
    meanMs: total === 0 ? 0 : Math.round(elapsedMs / total),
    byCategory,
  };
}

/** Format a duration as m:ss, or s.ss when under a minute. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
