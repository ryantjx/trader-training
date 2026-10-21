import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/lib/rng';
import {
  MATCHING_MARKETS,
  buildMatchingQuestion,
  instrumentsForMarket,
  matchingMarkets,
  ricOf,
  type MatchingDirection,
} from '../src/lib/ticker-match';

describe('ticker matching data', () => {
  it('has populated, unique codes and RICs for every market', () => {
    const minimums = { HK: 250, JP: 250, SG: 50, AU: 50 } as const;
    for (const market of MATCHING_MARKETS) {
      const instruments = instrumentsForMarket(market);
      expect(instruments.length, market).toBeGreaterThanOrEqual(minimums[market]);
      expect(new Set(instruments.map((instrument) => instrument.code)).size).toBe(instruments.length);
      expect(new Set(instruments.map((instrument) => ricOf(market, instrument.code))).size).toBe(instruments.length);
      expect(instruments.every((instrument) => instrument.name.length > 2)).toBe(true);
      expect(matchingMarkets[market].source.length).toBeGreaterThan(10);
    }
  });

  it.each<MatchingDirection>(['code-to-name', 'name-to-code'])('builds four distinct options for %s', (direction) => {
    const question = buildMatchingQuestion(mulberry32(12345), 'JP', direction);
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options.map((option) => option.id)).size).toBe(4);
    expect(question.options.filter((option) => option.id === question.answerId)).toHaveLength(1);
  });
});