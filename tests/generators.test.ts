import { describe, expect, it } from 'vitest';
import { buildDailySet, DAILY_SET_SIZE, DAILY_QUOTA } from '../src/lib/daily';
import { GENERATORS, availableGenerators } from '../src/lib/generators/registry';
import { isMarkStable, mark } from '../src/lib/marking';
import { markText, normalizeTextAnswer } from '../src/lib/marking';
import { drawLegal, isLegal } from '../src/lib/generators/parity';
import { mulberry32 } from '../src/lib/rng';
import { CATEGORIES, QUIZZES } from '../src/lib/types';
import { INDICES } from '../src/lib/generators/indices';
import { acceptedNames, allTickers, tickerGenerators } from '../src/lib/generators/tickers';
import { initialResponse } from '../src/lib/responses';
import type { ChoiceQuestion, NumericQuestion, Question, TextQuestion } from '../src/lib/types';

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

        if (q.kind === 'text') {
          expect(q.accept.length, `${generator.id} accept list`).toBeGreaterThan(0);
          // The canonical answer is always in the accepted set, and the marker
          // always accepts the canonical spelling.
          expect(q.accept, `${generator.id} answer in accept`).toContain(q.answer);
          expect(
            mark(q, { kind: 'text', text: q.answer }).correct,
            `${generator.id} rejects its own answer`,
          ).toBe(true);
          // Two variants that fold to the same string would list a duplicate in
          // the feedback panel and buy nothing.
          const folded = q.accept.map(normalizeTextAnswer);
          expect(new Set(folded).size, `${generator.id} accept variants collide`).toBe(
            folded.length,
          );
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

/** The code a ticker question is about, read back from its prompt. */
function codeInPrompt(prompt: string): string {
  const named = prompt.match(/trades as (.+?)[.?]$/);
  if (named) return (named[1] as string).trim();
  const parenthesised = prompt.match(/\(([A-Z0-9 ]+)\)/);
  return (parenthesised?.[1] ?? '').trim();
}

describe('ticker naming, both formats', () => {
  const choiceGen = tickerGenerators.find((g) => g.id === 'ticker-name');
  const typedGen = tickerGenerators.find((g) => g.id === 'ticker-name-typed');
  const byCode = new Map(allTickers().map((r) => [r.code, r]));

  it('asks ticker to company as a multiple choice and as free text', () => {
    expect(choiceGen, 'no multiple-choice naming generator').toBeDefined();
    expect(typedGen, 'no free-text naming generator').toBeDefined();
    const choice = choiceGen!.generate(mulberry32(11), 1);
    const typed = typedGen!.generate(mulberry32(11), 2);
    expect(choice.kind).toBe('choice');
    expect(typed.kind).toBe('text');
    expect(choice.subgroup).toBe('tickers');
    expect(typed.subgroup).toBe('tickers');
    // Different concepts, so a miss on free text does not suppress the multiple
    // choice variant in the spaced-repetition queue.
    expect(choice.signature).not.toBe(typed.signature);
  });

  it('gives every record a unique code built from ticker plus venue suffix', () => {
    const codes = allTickers().map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const record of allTickers()) {
      expect(record.code.startsWith(record.ticker), `${record.code} does not start ${record.ticker}`).toBe(true);
      expect(record.code.length, `${record.code} has no venue suffix`).toBeGreaterThan(record.ticker.length);
    }
  });

  it('covers all four venues and maps 9984 JT to SoftBank', () => {
    expect(new Set(allTickers().map((r) => r.market))).toEqual(
      new Set(['SGX', 'TSE', 'HKEX', 'ASX']),
    );
    expect(byCode.get('9984 JT')?.name).toBe('SoftBank Group');
    expect(byCode.get('700 HK')?.name).toBe('Tencent Holdings');
  });

  it('accepts every listed name and alias', () => {
    for (const record of allTickers()) {
      const accept = acceptedNames(record);
      expect(accept[0], `${record.code} canonical answer`).toBe(record.name);
      expect(markText(accept, record.name), `${record.code} rejects its own name`).toBe(true);
      for (const alias of record.aliases) {
        expect(markText(accept, alias), `${record.code} rejects alias ${alias}`).toBe(true);
      }
    }
  });

  it('does not accept a different listed company', () => {
    for (const record of allTickers()) {
      const accept = acceptedNames(record);
      for (const other of allTickers()) {
        if (other.id === record.id) continue;
        if (normalizeTextAnswer(other.name) === normalizeTextAnswer(record.name)) continue;
        expect(
          markText(accept, other.name),
          `${other.name} marked correct for ${record.code}`,
        ).toBe(false);
      }
    }
  });

  it('never offers the same company twice in one multiple choice', () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = choiceGen!.generate(mulberry32(seed * 7 + 3), 1) as ChoiceQuestion;
      const labels = q.options.map((o) => o.label);
      expect(new Set(labels).size, `duplicate option at seed ${seed}`).toBe(labels.length);
    }
  });

  it('asks the numeric drills only about rows that carry the field', () => {
    for (let seed = 0; seed < 200; seed++) {
      const code = codeInPrompt(
        tickerGenerators
          .find((g) => g.id === 'ticker-cap-band')!
          .generate(mulberry32(seed * 13 + 1), 2).prompt,
      );
      expect(byCode.get(code)?.marketCapBn, `cap band asked about ${code}`).not.toBeNull();
    }
    for (let seed = 0; seed < 200; seed++) {
      const code = codeInPrompt(
        tickerGenerators
          .find((g) => g.id === 'ticker-liquidity')!
          .generate(mulberry32(seed * 17 + 5), 3).prompt,
      );
      expect(byCode.get(code)?.adtM, `liquidity asked about ${code}`).not.toBeNull();
    }
    for (let seed = 0; seed < 200; seed++) {
      const code = codeInPrompt(
        tickerGenerators
          .find((g) => g.id === 'ticker-index-membership')!
          .generate(mulberry32(seed * 19 + 7), 2).prompt,
      );
      // An STI question is only fair about a Singapore listing.
      expect(byCode.get(code)?.market, `STI asked about ${code}`).toBe('SGX');
    }
  });
});

describe('free-text marking', () => {
  it('folds case, punctuation, ampersands and corporate suffixes', () => {
    expect(normalizeTextAnswer('  SoftBank Group  ')).toBe('softbank');
    expect(normalizeTextAnswer('softbank group corp.')).toBe('softbank');
    expect(normalizeTextAnswer('Jardine Matheson Holdings')).toBe('jardine matheson');
    expect(normalizeTextAnswer('Jardine Matheson Holdings')).toBe(
      normalizeTextAnswer('Jardine Matheson'),
    );
    expect(normalizeTextAnswer('BHP Billiton & Co.')).toBe('bhp billiton and');
  });

  it('does not fold away a word that distinguishes two names', () => {
    expect(normalizeTextAnswer('Hongkong Land')).toBe('hongkong land');
    expect(markText(['Hongkong Land'], 'Hong Kong Exchange')).toBe(false);
    expect(markText(['Singapore Airlines'], 'Singapore Exchange')).toBe(false);
  });

  it('forgives one typo in a long name and nothing in a short one', () => {
    expect(markText(['SoftBank Group'], 'softbnak group')).toBe(true);
    expect(markText(['Advantest'], 'Advantst')).toBe(true);
    // Below eight normalised characters a one-letter slip names another company.
    expect(markText(['AIA Group'], 'AIG')).toBe(false);
    expect(markText(['DBS'], 'DBX')).toBe(false);
  });

  it('rejects an empty or blank answer', () => {
    expect(markText(['CSL'], '')).toBe(false);
    expect(markText(['CSL'], '   ')).toBe(false);
    expect(markText(['CSL'], '...')).toBe(false);
  });

  it('marks a text question through mark() and reports the canonical spelling', () => {
    const q: TextQuestion = {
      kind: 'text',
      id: 't1',
      generatorId: 'ticker-name-typed',
      category: 'markets',
      subgroup: 'tickers',
      tier: 2,
      prompt: 'Name the company that trades as 9984 JT.',
      explain: 'e',
      signature: 'tickers|name-typed',
      answer: 'SoftBank Group',
      accept: ['SoftBank Group', 'Softbank'],
    };
    const right = mark(q, { kind: 'text', text: 'softbank group corp.' });
    expect(right.correct).toBe(true);
    expect(right.expectedText).toBe('SoftBank Group');
    expect(mark(q, { kind: 'text', text: 'NTT' }).correct).toBe(false);
    // A response of the wrong shape must not be marked correct.
    expect(mark(q, { kind: 'numeric', value: 9984 }).correct).toBe(false);
  });
});

describe('response shapes', () => {
  // Every mode resets its input through initialResponse() when the question
  // changes. A shape that does not match the question would leave the marker
  // reading a response built for a different interaction, and the free-text kind
  // is the one that can silently arrive as an empty numeric.
  it('gives every question kind an empty response of its own shape', () => {
    const samples = new Map<string, Question>();
    for (const date of DATES) {
      for (const q of buildDailySet(date, 2).questions) samples.set(q.kind, q);
    }
    for (const generator of availableGenerators()) {
      const q = generator.generate(mulberry32(5), 2);
      samples.set(q.kind, q);
    }
    expect(new Set(samples.keys())).toEqual(new Set(['numeric', 'choice', 'ordering', 'text']));

    for (const [kind, question] of samples) {
      const response = initialResponse(question);
      expect(response.kind, `${kind} initial response shape`).toBe(kind);
      // An untouched question is never already correct.
      expect(mark(question, response).correct, `${kind} empty response marked correct`).toBe(false);
    }
  });
});
