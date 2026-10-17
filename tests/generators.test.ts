import { describe, expect, it } from 'vitest';
import { buildDailySet, DAILY_SET_SIZE, DAILY_QUOTA } from '../src/lib/daily';
import { GENERATORS, availableGenerators } from '../src/lib/generators/registry';
import { isMarkStable, mark } from '../src/lib/marking';
import { drawLegal, isLegal } from '../src/lib/generators/parity';
import { mulberry32 } from '../src/lib/rng';
import { CATEGORIES } from '../src/lib/types';
import { INDICES } from '../src/lib/generators/indices';
import type { NumericQuestion, Question } from '../src/lib/types';

const DATES = [
  '2026-10-17',
  '2026-10-18',
  '2026-10-19',
  '2026-12-31',
  '2027-01-01',
  '2027-06-15',
];

function firstNumeric(questions: readonly Question[]): NumericQuestion | undefined {
  return questions.find((q): q is NumericQuestion => q.kind === 'numeric');
}

describe('determinism', () => {
  it('produces an identical set for the same date', () => {
    for (const date of DATES) {
      const a = buildDailySet(date, 2);
      const b = buildDailySet(date, 2);
      expect(b.questions.map((q) => q.id)).toEqual(a.questions.map((q) => q.id));
      expect(JSON.stringify(b.questions)).toBe(JSON.stringify(a.questions));
    }
  });

  it('produces a different set on different dates', () => {
    const a = buildDailySet('2026-10-17', 2);
    const b = buildDailySet('2026-10-18', 2);
    // Not a guarantee for any single question, but the assembled set should
    // differ. Compared on the generator ids and answers together.
    const sig = (s: typeof a) => s.questions.map((q) => `${q.generatorId}:${q.id}`).join('|');
    expect(sig(b)).not.toBe(sig(a));
  });

  it('builds exactly the advertised number of questions', () => {
    const set = buildDailySet('2026-10-17', 2);
    expect(set.questions).toHaveLength(DAILY_SET_SIZE);
    const quotaTotal = Object.values(DAILY_QUOTA).reduce((a, b) => a + b, 0);
    expect(quotaTotal).toBe(DAILY_SET_SIZE);
  });

  // The homepage is the daily set, drawing from all three groups. If a group
  // silently dropped out of the quota the homepage would quietly become
  // single-topic, which is worth catching.
  it('draws from every group in the daily set', () => {
    for (const date of DATES) {
      const present = new Set(buildDailySet(date, 2).questions.map((q) => q.category));
      for (const category of CATEGORIES) {
        expect(present, `${category} missing from the set on ${date}`).toContain(category);
      }
    }
  });

  it('interleaves categories rather than blocking them', () => {
    const set = buildDailySet('2026-10-17', 2);
    const categories = set.questions.map((q) => q.category);
    // The first three questions should not all be the same category, which is
    // what a blocked (unshuffled) assembly would produce.
    const firstThree = new Set(categories.slice(0, 3));
    expect(firstThree.size).toBeGreaterThan(1);
  });
});

describe('generators', () => {
  it('registers at least one generator per category', () => {
    for (const category of CATEGORIES) {
      const inCategory = availableGenerators().filter((g) => g.category === category);
      expect(inCategory.length, `no generators for ${category}`).toBeGreaterThan(0);
    }
  });

  // The taxonomy collapsed from five categories to three. A generator carrying a
  // stale category would silently disappear from every list, so this is asserted
  // rather than assumed.
  it('uses only the three declared categories', () => {
    for (const generator of GENERATORS) {
      expect(
        CATEGORIES,
        `${generator.id} has unknown category ${generator.category}`,
      ).toContain(generator.category);
    }
  });

  // The merge of listed contracts and OTC exotics into one group is only safe
  // because the subgroup survives, so that the drill page can still tell them
  // apart. Check the derivatives group actually carries both.
  it('keeps the listed and exotic subgroups apart inside the derivatives group', () => {
    const derivatives = GENERATORS.filter((g) => g.category === 'derivatives');
    const subgroups = new Set(derivatives.map((g) => g.subgroup));
    expect(subgroups, 'no listed generators survived the merge').toContain('listed');
    expect(subgroups, 'no exotic generators survived the merge').toContain('exotic');
  });

  it('gives every generator a unique id', () => {
    const ids = GENERATORS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // A question must come from the generator that claims it. Without this, two
  // registry entries can share one function and a 'clearing-house' slot silently
  // serves a stamp-duty question — which is exactly what happened.
  it('has each generator emit its own generatorId', () => {
    for (const generator of availableGenerators()) {
      for (let seed = 0; seed < 25; seed++) {
        const q = generator.generate(mulberry32(seed * 31 + 7), 2);
        expect(
          q.generatorId,
          `${generator.id} emitted a ${q.generatorId} question`,
        ).toBe(generator.id);
      }
    }
  });

  // No two registry entries may point at the same function, which is the root
  // cause of the mismatch above.
  it('does not share a generate function between generators', () => {
    const seen = new Map<unknown, string>();
    for (const generator of GENERATORS) {
      const previous = seen.get(generator.generate);
      expect(
        previous,
        `${generator.id} and ${previous} share the same generate function`,
      ).toBeUndefined();
      seen.set(generator.generate, generator.id);
    }
  });

  // Every generator, over many seeds: no NaN, no Infinity, exactly one correct
  // option, and a well-formed answer.
  it('produces well-formed questions across many seeds', () => {
    for (const generator of availableGenerators()) {
      for (let seed = 0; seed < 250; seed++) {
        const rng = mulberry32(seed * 7919 + generator.id.length);
        const q = generator.generate(rng, (seed % 4 + 1) as 1 | 2 | 3 | 4);

        expect(q.prompt.length, `${generator.id} prompt`).toBeGreaterThan(0);
        expect(q.explain.length, `${generator.id} explain`).toBeGreaterThan(0);
        expect(q.signature.length, `${generator.id} signature`).toBeGreaterThan(0);

        if (q.kind === 'numeric') {
          expect(Number.isFinite(q.answer), `${generator.id} answer finite`).toBe(true);
          expect(Number.isNaN(q.answer), `${generator.id} answer NaN`).toBe(false);
        }

        if (q.kind === 'choice') {
          const ids = q.options.map((o) => o.id);
          expect(new Set(ids).size, `${generator.id} option ids unique`).toBe(ids.length);
          expect(ids, `${generator.id} answer present`).toContain(q.answerId);
          expect(q.options.length, `${generator.id} option count`).toBeGreaterThanOrEqual(2);
        }

        if (q.kind === 'ordering') {
          expect(q.items.length, `${generator.id} item count`).toBe(q.answerOrder.length);
          expect(new Set(q.answerOrder).size).toBe(q.answerOrder.length);
          for (const id of q.answerOrder) {
            expect(q.items.map((i) => i.id), `${generator.id} answer item`).toContain(id);
          }
        }
      }
    }
  });

  // The condition under which keeping the transcendentals is safe: an answer
  // must not sit on a rounding boundary, or two engines could mark it
  // differently.
  it('never puts a numeric answer on a rounding boundary', () => {
    for (const generator of availableGenerators()) {
      for (let seed = 0; seed < 250; seed++) {
        const rng = mulberry32(seed * 104729 + 1);
        const q = generator.generate(rng, 3);
        if (q.kind !== 'numeric') continue;
        expect(
          isMarkStable(q.answer, q.decimals, q.tolerance),
          `${generator.id} answer ${q.answer} is on a boundary at ${q.decimals}dp`,
        ).toBe(true);
      }
    }
  });
});

describe('index levels', () => {
  // A name paired with another index's level is a mistake that reads as
  // plausible to anyone who does not know the level, so it is worth asserting.
  it('keeps every index level within its own order of magnitude', () => {
    for (const index of INDICES) {
      expect(
        index.level,
        `${index.name} level ${index.level} outside ${index.minLevel}..${index.maxLevel}`,
      ).toBeGreaterThanOrEqual(index.minLevel);
      expect(index.level).toBeLessThanOrEqual(index.maxLevel);
    }
  });

  it('does not conflate the KOSPI 200 futures underlying with the KOSPI composite', () => {
    const kospi = INDICES.find((i) => i.name === 'KOSPI 200');
    expect(kospi).toBeDefined();
    // The KOSPI 200 index is a few hundred; the composite is a few thousand.
    expect(kospi!.level).toBeLessThan(1_000);
  });
});

describe('daily set contents', () => {
  it('contains no unavailable generator', () => {
    const unavailable = new Set(GENERATORS.filter((g) => !g.available).map((g) => g.id));
    for (const date of DATES) {
      for (const q of buildDailySet(date, 2).questions) {
        expect(unavailable.has(q.generatorId), `${q.generatorId} should not be asked`).toBe(false);
      }
    }
  });

  it('has a numeric question in every set', () => {
    // The daily set must exercise numeric entry, not only multiple choice.
    for (const date of DATES) {
      const numeric = firstNumeric(buildDailySet(date, 2).questions);
      expect(numeric, `no numeric question on ${date}`).toBeDefined();
    }
  });
});

describe('put-call parity invariants', () => {
  it('never produces a negative option value or a bound violation', () => {
    for (let seed = 0; seed < 5000; seed++) {
      const d = drawLegal(mulberry32(seed));
      expect(isLegal(d), `illegal draw at seed ${seed}`).toBe(true);
      expect(d.callCents).toBeGreaterThanOrEqual(0);
      expect(d.putCents).toBeGreaterThanOrEqual(0);
      expect(d.callCents).toBeLessThanOrEqual(d.stockCents);
      expect(d.putCents).toBeLessThanOrEqual(d.strikeCents);
    }
  });

  it('holds parity exactly to the penny', () => {
    for (let seed = 0; seed < 5000; seed++) {
      const d = drawLegal(mulberry32(seed + 999));
      const residual = d.stockCents - d.strikeCents + d.putCents + d.revConCents - d.callCents;
      expect(residual, `parity residual at seed ${seed}`).toBe(0);
    }
  });
});

describe('marking', () => {
  it('marks numeric answers at the stated precision', () => {
    const q: NumericQuestion = {
      kind: 'numeric',
      id: 'x',
      generatorId: 'x',
      category: 'math',
      tier: 1,
      prompt: 'p',
      explain: 'e',
      signature: 's',
      answer: 12.03,
      decimals: 2,
      tolerance: 0,
    };
    expect(mark(q, { kind: 'numeric', value: 12.03 }).correct).toBe(true);
    expect(mark(q, { kind: 'numeric', value: 12.031 }).correct).toBe(true);
    expect(mark(q, { kind: 'numeric', value: 12.04 }).correct).toBe(false);
    expect(mark(q, { kind: 'numeric', value: null }).correct).toBe(false);
  });
});
