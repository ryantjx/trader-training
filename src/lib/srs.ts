/**
 * Spaced repetition, on Leitner boxes.
 *
 * A miss drops the concept to box 0 and it comes back tomorrow. Each
 * consecutive correct answer promotes it one box, so the interval doubles out
 * roughly 1, 3, 7, 16, 35 days. Correct in the top box retires it.
 *
 * Keyed on a question's `signature` — the concept — not on the instance. That is
 * the point: "gamma PnL when the unit is per 1 percentage point" is what gets
 * scheduled, so the drill re-tests the skill with fresh numbers.
 */
import { quizDateKey } from './seed';

/** Days to wait before re-asking, indexed by box. Box 6 means retired. */
export const INTERVALS_DAYS = [0, 1, 3, 7, 16, 35] as const;
export const MAX_BOX = INTERVALS_DAYS.length - 1;

export interface SrsEntry {
  signature: string;
  box: number;
  /** ISO date key on which this concept is next due. */
  due: string;
  attempts: number;
  correct: number;
  /** How many times the concept has been dropped back to box 0. */
  lapses: number;
  lastSeen: string;
}

export type SrsState = Record<string, SrsEntry>;

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Apply an outcome to a concept, returning the updated entry. */
export function review(
  existing: SrsEntry | undefined,
  signature: string,
  correct: boolean,
  today: string = quizDateKey(),
): SrsEntry {
  const base: SrsEntry = existing ?? {
    signature,
    box: 0,
    due: today,
    attempts: 0,
    correct: 0,
    lapses: 0,
    lastSeen: today,
  };

  const box = correct ? Math.min(base.box + 1, MAX_BOX) : 0;
  const days = correct ? (INTERVALS_DAYS[box] ?? 0) : 1;

  return {
    signature,
    box,
    due: addDays(today, days),
    attempts: base.attempts + 1,
    correct: base.correct + (correct ? 1 : 0),
    lapses: base.lapses + (!correct && base.attempts > 0 ? 1 : 0),
    lastSeen: today,
  };
}

/** Concepts due on or before today, most overdue and weakest first. */
export function dueEntries(
  state: SrsState,
  today: string = quizDateKey(),
): SrsEntry[] {
  return Object.values(state)
    .filter((e) => e.due <= today && e.box < MAX_BOX)
    .sort((a, b) => {
      // Overdue first, then lowest box, then most lapses.
      if (a.due !== b.due) return a.due < b.due ? -1 : 1;
      if (a.box !== b.box) return a.box - b.box;
      return b.lapses - a.lapses;
    });
}

/** Concepts that have been missed at least once and are not yet retired. */
export function weakEntries(state: SrsState): SrsEntry[] {
  return Object.values(state)
    .filter((e) => e.lapses > 0 && e.box < MAX_BOX)
    .sort((a, b) => b.lapses - a.lapses || a.box - b.box);
}
