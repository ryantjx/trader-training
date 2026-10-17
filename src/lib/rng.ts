/**
 * Seeded pseudo-random number generator.
 *
 * Everything the quiz generates must be reproducible from a date, so nothing in
 * this codebase may call Math.random(). All randomness flows through an Rng.
 *
 * mulberry32 is used because it is tiny, has no dependencies, and produces the
 * same sequence from the same seed on every JS engine: it uses only integer
 * operations (xor, shifts, imul) that are exactly specified by the language.
 * That last property is the whole point — Math.random() and transcendental
 * functions are not guaranteed to agree across engines, integer ops are.
 */

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max], inclusive. Throws if min > max. */
  int(min: number, max: number): number;
  /** Uniform element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** n distinct elements, order randomised. n is clamped to the array length. */
  sample<T>(items: readonly T[], n: number): T[];
  /** A new array in randomised order. Does not mutate the input. */
  shuffle<T>(items: readonly T[]): T[];
  /** True with probability p (default 0.5). */
  bool(p?: number): boolean;
  /** One of two values, by probability p of returning `a`. */
  either<T>(a: T, b: T, p?: number): T;
}

export function mulberry32(seed: number): Rng {
  // Normalise to uint32 so the sequence depends on the hash, not on sign.
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error(`rng.int requires finite bounds, got ${min}..${max}`);
    }
    if (max < min) {
      throw new Error(`rng.int requires min <= max, got ${min}..${max}`);
    }
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (hi < lo) return lo;
    return lo + Math.floor(next() * (hi - lo + 1));
  };

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('rng.pick requires a non-empty array');
    const item = items[int(0, items.length - 1)];
    // The index is always in range, so this cannot be undefined; the assertion
    // exists to satisfy noUncheckedIndexedAccess without a non-null assertion.
    return item as T;
  };

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      const a = out[i] as T;
      const b = out[j] as T;
      out[i] = b;
      out[j] = a;
    }
    return out;
  };

  const sample = <T,>(items: readonly T[], n: number): T[] => {
    const count = Math.max(0, Math.min(n, items.length));
    return shuffle(items).slice(0, count);
  };

  const bool = (p = 0.5): boolean => next() < p;

  const either = <T,>(a: T, b: T, p = 0.5): T => (bool(p) ? a : b);

  return { next, int, pick, sample, shuffle, bool, either };
}
