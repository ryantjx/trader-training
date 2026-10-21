/**
 * The daily set.
 *
 * Twenty questions, assembled from a date. Two properties make this work as a
 * daily habit:
 *
 *   DETERMINISM  The set is a pure function of the date key, so every user gets
 *                the same twenty questions on the same day and a personal best
 *                is comparable across days.
 *
 *   INTERLEAVING Categories are mixed rather than blocked, because that is what
 *                a trading day looks like: the point is to switch between
 *                arithmetic and recall without a warm-up.
 *
 * The quota below is the desk weighting: mental math and exotics carry the most
 * weight, since the project is aimed at an exotic-options desk.
 */
import { rngFor } from './seed';
import { availableGenerators } from './generators/registry';
import type { Category, Question } from './types';

export const DAILY_SET_SIZE = 20;

/**
 * Quota per group. Sums to DAILY_SET_SIZE.
 *
 * Math and Asia Derivatives carry the most weight, since the project is aimed at
 * an exotic-options desk.
 */
export const DAILY_QUOTA: Record<Category, number> = {
  math: 8,
  markets: 5,
  derivatives: 7,
};

export interface DailySet {
  dateKey: string;
  questions: Question[];
  /** Generator ids in slot order, for debugging and tests. */
  slots: string[];
}

/**
 * Build the set for a date.
 *
 * The whole generator pool is available, with no difficulty filter. Drawing is
 * without replacement within a category, so a 20-question set uses 20 different
 * generators wherever the pool is large enough.
 *
 * Slot numbering is global across the whole set rather than per category, so a
 * generator that appears in more than one slot draws different parameters each
 * time.
 */
export function buildDailySet(dateKey: string): DailySet {
  const questions: Question[] = [];
  const slots: string[] = [];
  let slot = 0;

  for (const category of Object.keys(DAILY_QUOTA) as Category[]) {
    const quota = DAILY_QUOTA[category];
    const pool = availableGenerators().filter((g) => g.category === category);
    if (pool.length === 0) continue;

    // Shuffle the pool with a seed derived from the date and category, then walk
    // it. Each generator is used at most once per category until the pool is
    // exhausted, at which point the shuffle is repeated for the remainder.
    let order: typeof pool = [];
    let cursor = 0;

    for (let i = 0; i < quota; i++) {
      if (cursor >= order.length) {
        order = rngFor(dateKey, `${category}:pool`, i).shuffle(pool);
        cursor = 0;
      }
      const generator = order[cursor] as (typeof pool)[number];
      cursor++;

      // A second, independent rng for the generator's own parameters, so the
      // choice of generator cannot be affected by how a generator consumes its
      // randomness.
      const genRng = rngFor(dateKey, `gen:${generator.id}`, slot);
      const question = generator.generate(genRng);

      questions.push(question);
      slots.push(generator.id);
      slot++;
    }
  }

  // Interleave: the quotas above block the categories, so shuffle the assembled
  // list. Seeded, so the interleaving is also reproducible.
  const order = Array.from({ length: questions.length }, (_, i) => i);
  const shuffleRng = rngFor(dateKey, 'order', 0);
  const shuffled = shuffleRng.shuffle(order);

  return {
    dateKey,
    questions: shuffled.map((i) => questions[i] as Question),
    slots: shuffled.map((i) => slots[i] as string),
  };
}
