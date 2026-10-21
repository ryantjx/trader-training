import tickerNames from '../data/ticker-names.json';
import type { Rng } from './rng';

export type MatchingMarket = 'HK' | 'JP' | 'SG' | 'AU';
export type MatchingDirection = 'code-to-name' | 'name-to-code';

export interface MatchingInstrument {
  code: string;
  name: string;
}

interface MarketData {
  label: string;
  venue: string;
  ricSuffix: string;
  index: string;
  source: string;
  instruments: MatchingInstrument[];
}

export interface MatchingOption {
  id: string;
  label: string;
}

export interface MatchingQuestion {
  instrument: MatchingInstrument;
  direction: MatchingDirection;
  prompt: string;
  options: MatchingOption[];
  answerId: string;
}

export const MATCHING_MARKETS: readonly MatchingMarket[] = ['HK', 'JP', 'SG', 'AU'];

export const matchingMarkets: Record<MatchingMarket, MarketData> = tickerNames.markets;

export function instrumentsForMarket(market: MatchingMarket): MatchingInstrument[] {
  return matchingMarkets[market].instruments;
}

export function ricOf(market: MatchingMarket, code: string): string {
  return `${code}${matchingMarkets[market].ricSuffix}`;
}

export function formatInstrument(market: MatchingMarket, instrument: MatchingInstrument): string {
  return `${instrument.code} (${ricOf(market, instrument.code)})`;
}

export function buildMatchingQuestion(
  rng: Rng,
  market: MatchingMarket,
  direction: MatchingDirection,
): MatchingQuestion {
  const instruments = instrumentsForMarket(market);
  const instrument = rng.pick(instruments);
  const distractors = rng
    .sample(instruments.filter((candidate) => candidate.code !== instrument.code), 3);
  const choices = rng.shuffle([instrument, ...distractors]);
  const answerId = instrument.code;

  return {
    instrument,
    direction,
    prompt:
      direction === 'code-to-name'
        ? `Which company trades as ${formatInstrument(market, instrument)}?`
        : `Which exchange code and RIC identify ${instrument.name}?`,
    options: choices.map((choice) => ({
      id: choice.code,
      label: direction === 'code-to-name' ? choice.name : formatInstrument(market, choice),
    })),
    answerId,
  };
}