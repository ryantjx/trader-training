/**
 * Index levels used as question parameters.
 *
 * Shared by every generator that needs an index, so a name can never be paired
 * with another index's level. That mistake is easy to make and hard to spot — a
 * question reading "the STI is at 39,000" reads as plausible to anyone who does
 * not know the STI is around 5,800, and it teaches the wrong scale.
 *
 * These are approximate working levels for arithmetic drills, not market data.
 * They are deliberately round-ish so the mental math is not swamped by the
 * level itself, and their only requirement is to be the right order of magnitude
 * for the index named.
 */
export interface IndexRef {
  name: string;
  level: number;
  /** Order-of-magnitude guard, asserted in the tests. */
  minLevel: number;
  maxLevel: number;
}

export const INDICES: readonly IndexRef[] = [
  { name: 'HSI', level: 24_000, minLevel: 10_000, maxLevel: 40_000 },
  { name: 'Nikkei 225', level: 39_000, minLevel: 15_000, maxLevel: 60_000 },
  { name: 'TOPIX', level: 2_750, minLevel: 1_000, maxLevel: 5_000 },
  { name: 'FTSE China A50', level: 14_500, minLevel: 8_000, maxLevel: 25_000 },
  { name: 'ASX 200', level: 8_400, minLevel: 5_000, maxLevel: 12_000 },
  { name: 'STI', level: 5_800, minLevel: 2_500, maxLevel: 8_000 },
] as const;

export function indexByName(name: string): IndexRef {
  const found = INDICES.find((i) => i.name === name);
  if (!found) throw new Error(`Unknown index: ${name}`);
  return found;
}
