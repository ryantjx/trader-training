/**
 * Deterministic seeding: date -> seed -> question set.
 *
 * The promise the site makes is "everyone sees the same 20 questions today".
 * That holds because the whole set is a pure function of a date string, with no
 * server and no hidden state.
 */
import { mulberry32, type Rng } from './rng';

/** Singapore is UTC+8 with no daylight saving, so this is a fixed offset. */
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * The quiz day, in SGT.
 *
 * Roll-over is defined in SGT rather than UTC or local time so that the set
 * changes at a single unambiguous moment for every user, regardless of where
 * they are. A trader in Sydney and one in London get the same questions on the
 * same Asian trading day.
 */
export function quizDateKey(now: Date = new Date()): string {
  const sgtWallClock = new Date(now.getTime() + SGT_OFFSET_MS);
  return sgtWallClock.toISOString().slice(0, 10);
}

/** True if the string looks like an ISO calendar date (YYYY-MM-DD). */
export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * FNV-1a, 32-bit.
 *
 * Chosen over a cryptographic hash because it is a handful of integer
 * operations, is exactly specified, and has no dependency. Avalanche quality is
 * sufficient for spreading question seeds; it is not a security primitive.
 */
export function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // h *= 16777619, via shifts to stay inside 32-bit integer ops.
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}

/** The seed for a whole day's set. */
export function dailySeed(dateKey: string): number {
  return hash32(`daily|${dateKey}`);
}

/**
 * The seed for one question within a day's set.
 *
 * Keyed on the slot index as well as the generator, so the same generator
 * appearing twice in a set produces two different questions rather than the
 * same one twice.
 */
export function seedFor(dateKey: string, generatorId: string, slot: number): number {
  return hash32(`${dateKey}|${generatorId}|${slot}`);
}

/** An Rng for a specific question. */
export function rngFor(dateKey: string, generatorId: string, slot: number): Rng {
  return mulberry32(seedFor(dateKey, generatorId, slot));
}

/**
 * An Rng for a non-daily context (free drill, tests), from an arbitrary key.
 * Distinct prefix from daily seeds so the two namespaces cannot collide.
 */
export function freeRng(key: string): Rng {
  return mulberry32(hash32(`free|${key}`));
}

/** Seed namespace for the standalone parity game: the date, not the set. */
export function paritySeed(dateKey: string): number {
  return hash32(`parity|${dateKey}`);
}
