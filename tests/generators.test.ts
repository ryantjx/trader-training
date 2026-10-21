import { describe, expect, it } from 'vitest';
import { buildDailySet, DAILY_SET_SIZE, DAILY_QUOTA } from '../src/lib/daily';
import { GENERATORS, availableGenerators } from '../src/lib/generators/registry';
import { isMarkStable, mark } from '../src/lib/marking';
import { drawLegal, isLegal } from '../src/lib/generators/parity';
import { mulberry32 } from '../src/lib/rng';
import { CATEGORIES, QUIZZES } from '../src/lib/types';
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
      const a = buildDailySet(date);
      const b = buildDailySet(date);
      expect(b.questions.map((q) => q.id)).toEqual(a.questions.map((q) => q.id));
      expect(JSON.stringify(b.questions)).toBe(JSON.stringify(a.questions));
    }
  });

  it('produces a different set on different dates', () => {
    const a = buildDailySet('2026-10-17');
    const b = buildDailySet('2026-10-18');
    // Not a guarantee for any single question, but the assembled set should
    // differ. Compared on the generator ids and answers together.
    const sig = (s: typeof a) => s.questions.map((q) => `${q.generatorId}:${q.id}`).join('|');
    expect(sig(b)).not.toBe(sig(a));
  });

  it('builds exactly the advertised number of questions', () => {
    const set = buildDailySet('2026-10-17');
    expect(set.questions).toHaveLength(DAILY_SET_SIZE);
    const quotaTotal = Object.values(DAILY_QUOTA).reduce((a, b) => a + b, 0);
    expect(quotaTotal).toBe(DAILY_SET_SIZE);
  });

  // The homepage is the daily set, drawing from all three groups. If a group
  // silently dropped out of the quota the homepage would quietly become
  // single-topic, which is worth catching.
  it('draws from every group in the daily set', () => {
    for (const date of DATES) {
      const present = new Set(buildDailySet(date).questions.map((q) => q.category));
      for (const category of CATEGORIES) {
        expect(present, `${category} missing from the set on ${date}`).toContain(category);
      }
    }
  });

  it('interleaves categories rather than blocking them', () => {
    const set = buildDailySet('2026-10-17');
    const categories = set.questions.map((q) => q.category);
    // The first three questions should not all be the same category, which is
    // what a blocked (unshuffled) assembly would produce.
    const firstThree = new Set(categories.slice(0, 3));
    expect(firstThree.size).toBeGreaterThan(1);
  });

  // Drawing with replacement put a repeated generator into essentially every
  // set. Each category pool is larger than its quota, so a set should be able to
  // use twenty different generators.
  it('uses every generator at most once per set', () => {
    for (const date of DATES) {
      const ids = buildDailySet(date).questions.map((q) => q.generatorId);
      expect(new Set(ids).size, `repeated generator in the set for ${date}`).toBe(ids.length);
    }
  });

  // A difficulty tier used to filter the pool, which silently orphaned 17 of 47
  // generators at the default setting. With no tier there is no filter, so the
  // whole pool must be reachable.
  it('reaches every available generator within a month of sets', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 31; d++) {
      for (const q of buildDailySet(`2026-12-${String(d).padStart(2, '0')}`).questions) {
        seen.add(q.generatorId);
      }
    }
    const unreachable = availableGenerators()
      .map((g) => g.id)
      .filter((id) => !seen.has(id));
    expect(unreachable, `unreachable generators: ${unreachable.join(', ')}`).toHaveLength(0);
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
  // because the subgroup survives, so that the quiz pages can still tell them
  // apart. Check the derivatives group actually carries both.
  it('keeps the listed and exotic subgroups apart inside the derivatives group', () => {
    const derivatives = GENERATORS.filter((g) => g.category === 'derivatives');
    const subgroups = new Set(derivatives.map((g) => g.subgroup));
    expect(subgroups, 'no listed generators survived the merge').toContain('listed');
    expect(subgroups, 'no exotic generators survived the merge').toContain('exotic');
  });

  // Every quiz is its own page, so a generator with no subgroup would have no
  // route and would silently vanish from the site.
  it('gives every generator a subgroup, so every question has a page', () => {
    for (const generator of GENERATORS) {
      expect(generator.subgroup, `${generator.id} has no subgroup`).toBeDefined();
      expect(QUIZZES.map((q) => q.subgroup)).toContain(generator.subgroup);
    }
  });

  // Each quiz in the sidebar must actually have questions behind it.
  it('has every declared quiz populated', () => {
    for (const quiz of QUIZZES) {
      const inQuiz = GENERATORS.filter((g) => g.subgroup === quiz.subgroup && g.available);
      expect(inQuiz.length, `quiz ${quiz.subgroup} has no generators`).toBeGreaterThan(0);
    }
  });

  // A quiz with no arithmetic is a reading test. Four quizzes once had none
  // (microstructure, tickers, market knowledge, vol surface), which made the
  // site's "calculator-free arithmetic" promise uneven across groups.
  it('gives every quiz at least one numeric question', () => {
    for (const quiz of QUIZZES) {
      const inQuiz = GENERATORS.filter((g) => g.subgroup === quiz.subgroup && g.available);
      const hasNumeric = inQuiz.some((generator) => {
        for (let seed = 0; seed < 20; seed++) {
          if (generator.generate(mulberry32(seed * 37)).kind === 'numeric') return true;
        }
        return false;
      });
      expect(hasNumeric, `${quiz.subgroup} has no numeric generator`).toBe(true);
    }
  });

  // A quiz's generators must belong to the group the quiz is filed under, or the
  // sidebar and the page would disagree about where it lives.
  it('files each quiz under the group its generators use', () => {
    for (const quiz of QUIZZES) {
      const generators = GENERATORS.filter((g) => g.subgroup === quiz.subgroup);
      for (const generator of generators) {
        expect(
          generator.category,
          `${quiz.subgroup} is filed under ${quiz.category} but a generator uses ${generator.category}`,
        ).toBe(quiz.category);
      }
    }
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
        const q = generator.generate(mulberry32(seed * 31 + 7));
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
        const q = generator.generate(rng);

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
        const q = generator.generate(rng);
        if (q.kind !== 'numeric') continue;
        expect(
          isMarkStable(q.answer, q.decimals, q.tolerance),
          `${generator.id} answer ${q.answer} is on a boundary at ${q.decimals}dp`,
        ).toBe(true);
      }
    }
  });

  // A choice question with two identical option labels can mark a correct pick
  // wrong. This was a real bug in forward-premium, where the distractor was a
  // copy of the correct statement on roughly half of all draws.
  it('gives every choice question distinct option labels', () => {
    for (const generator of availableGenerators()) {
      for (let seed = 0; seed < 300; seed++) {
        const q = generator.generate(mulberry32(seed * 7919 + 3));
        if (q.kind !== 'choice') continue;
        const labels = q.options.map((o) => o.label);
        expect(
          new Set(labels).size,
          `${generator.id} emitted duplicate option labels: ${labels.join(' | ')}`,
        ).toBe(labels.length);
      }
    }
  });

  // The site claims calculator-free arithmetic. Anything needing more than two
  // decimal places at zero tolerance is a mental long division, not a drill.
  it('never demands more than 2dp at zero tolerance', () => {
    for (const generator of availableGenerators()) {
      for (let seed = 0; seed < 200; seed++) {
        const q = generator.generate(mulberry32(seed * 31 + 11));
        if (q.kind !== 'numeric') continue;
        expect(
          q.decimals > 2 && q.tolerance === 0,
          `${generator.id} asks for ${q.decimals}dp with zero tolerance`,
        ).toBe(false);
      }
    }
  });

  // Recall drills are only useful if the case list is bigger than a single
  // sitting. Eight is the floor for a choice drill: fewer than that and a daily
  // player sees the whole drill in one or two sessions.
  //
  // Ordering questions are exempt at eight because the number of genuinely
  // distinct routines is small — the region has three closing structures and two
  // SGX routines, not eight. They are still held to five, which is every real
  // routine rather than a repeated one.
  //
  // Distinctness is measured on prompt + context, because a numeric or
  // structure question can vary entirely in the figures while the wording stays
  // fixed. For a recall drill the context is constant, so this does not weaken
  // the check where it matters.
  it('gives every generator a case list bigger than one sitting', () => {
    for (const generator of availableGenerators()) {
      const questions = new Set<string>();
      let kind: string | null = null;
      for (let seed = 0; seed < 1500; seed++) {
        const q = generator.generate(mulberry32(seed * 2654435761));
        kind = q.kind;
        questions.add(`${q.prompt}\n${q.context ?? ''}`);
      }
      const floor = kind === 'ordering' ? 5 : 8;
      expect(
        questions.size,
        `${generator.id} only produces ${questions.size} distinct questions`,
      ).toBeGreaterThanOrEqual(floor);
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
});

describe('daily set contents', () => {
  it('contains no unavailable generator', () => {
    const unavailable = new Set(GENERATORS.filter((g) => !g.available).map((g) => g.id));
    for (const date of DATES) {
      for (const q of buildDailySet(date).questions) {
        expect(unavailable.has(q.generatorId), `${q.generatorId} should not be asked`).toBe(false);
      }
    }
  });

  it('has a numeric question in every set', () => {
    // The daily set must exercise numeric entry, not only multiple choice.
    for (const date of DATES) {
      const numeric = firstNumeric(buildDailySet(date).questions);
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
