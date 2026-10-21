/**
 * Basis points to money, and back (Manual, Math and units).
 *
 * The single most-used mental calculation on a desk. All arithmetic is in
 * integer minor units so the answer is exact.
 *
 * The README makes an important distinction that the generators enforce: a basis
 * point OF NOTIONAL (a cost) and a basis point OF PRICE (a move) are different
 * quantities, and the question must say which is being asked.
 */
import contractsData from '../../data/contracts.json';
import { roundTo } from '../money';
import { INDICES } from './indices';
import type { Generator, NumericQuestion, Rng } from '../types';

interface Currency {
  code: string;
  /** Minor-unit scale: how many minor units in one major unit. JPY has none. */
  minorPer: number;
  /** A plausible notional ladder, in major units. */
  notionals: readonly number[];
}

const CURRENCIES: readonly Currency[] = [
  { code: 'USD', minorPer: 100, notionals: [1e6, 10e6, 25e6, 50e6, 100e6, 250e6, 1e9] },
  { code: 'SGD', minorPer: 100, notionals: [10e6, 50e6, 100e6, 250e6, 500e6, 1e9] },
  { code: 'HKD', minorPer: 100, notionals: [10e6, 50e6, 100e6, 500e6, 1e9] },
  { code: 'JPY', minorPer: 1, notionals: [1e9, 10e9, 50e9, 100e9, 500e9] },
  { code: 'AUD', minorPer: 100, notionals: [10e6, 50e6, 100e6, 250e6] },
];

function formatNotional(value: number, code: string): string {
  if (value >= 1e9) return `${value / 1e9}bn ${code}`;
  if (value >= 1e6) return `${value / 1e6}m ${code}`;
  return `${value.toLocaleString('en-US')} ${code}`;
}

/** Round a notional down to something a trader would actually quote. */
function cleanNotional(rng: Rng, currency: Currency): number {
  return rng.pick(currency.notionals);
}

/** bps on a notional, in the notional's own currency. Exact by construction. */
function bpToMoney(rng: Rng): NumericQuestion {
  const currency = rng.pick(CURRENCIES);
  const notional = cleanNotional(rng, currency);
  const bps = rng.pick([0.5, 1, 2, 2.5, 3, 5, 10, 25] as const);

  // notional * bps / 10000. With bps a multiple of 0.5 and notional a clean
  // ladder value, this is exact at the scale of the currency.
  const answer = (notional * bps) / 10000;

  return {
    kind: 'numeric',
    id: `bp-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'bp-to-money',
    category: 'math',
    subgroup: 'basis-points',
    prompt: `What is ${bps} basis point${bps === 1 ? '' : 's'} of ${formatNotional(notional, currency.code)}, in ${currency.code}?`,
    context: 'A basis point of notional is a cost or a fee, not a price move.',
    explain: `Money = notional x bps / 10,000 = ${notional.toLocaleString('en-US')} x ${bps} / 10,000 = ${answer.toLocaleString('en-US', { minimumFractionDigits: currency.minorPer === 1 ? 0 : 2, maximumFractionDigits: currency.minorPer === 1 ? 0 : 2 })} ${currency.code}.`,
    anchor: '1bp on USD 1m is 100. Scale linearly: 1bp on 100m is 10,000, on 1bn is 100,000.',
    citation: 'Manual, Math and units',
    signature: 'bp|notional-to-money',
    answer,
    decimals: currency.minorPer === 1 ? 0 : 2,
    tolerance: 0,
    unit: currency.code,
  };
}

/** Money on a notional, back to bps. */
function moneyToBp(rng: Rng): NumericQuestion {
  const currency = rng.pick(CURRENCIES);
  const notional = cleanNotional(rng, currency);
  const bps = rng.pick([1, 2, 2.5, 5, 10, 20, 50] as const);
  const money = (notional * bps) / 10000;

  return {
    kind: 'numeric',
    id: `bp-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'money-to-bp',
    category: 'math',
    subgroup: 'basis-points',
    prompt: `You made ${money.toLocaleString('en-US')} ${currency.code} on ${formatNotional(notional, currency.code)} of notional. How many basis points is that?`,
    context: 'Express the PnL as a fraction of notional, then multiply by 10,000.',
    explain: `bps = money / notional x 10,000 = ${money.toLocaleString('en-US')} / ${notional.toLocaleString('en-US')} x 10,000 = ${bps}bp.`,
    anchor: 'bp = money / notional x 10,000. Divide first, then scale up, to keep the arithmetic in your head.',
    citation: 'Manual, Math and units',
    signature: 'bp|money-to-notional',
    answer: bps,
    decimals: 2,
    tolerance: 0,
    unit: 'bp',
  };
}

/**
 * The trading-price version, where an index move in bps becomes money.
 *
 * The contract table is read from `contracts.json` and `indices.ts` rather than
 * kept here. This file previously carried a third hardcoded copy of the same
 * multipliers and levels, so a correction in one place could silently leave the
 * other two wrong.
 */
function indexMoveToMoney(rng: Rng): NumericQuestion {
  const contract = rng.pick(contractsData.contracts as {
    name: string;
    underlying: string;
    currency: string;
    multiplierPerPoint: number;
  }[]);
  const index = INDICES.find((i) => i.name === contract.underlying) ?? INDICES[0]!;
  const bps = rng.pick([10, 25, 50, 100] as const);
  const lots = rng.pick([1, 2, 5, 10] as const);

  // A move of `bps` on the level, in index points.
  const pointsMove = (index.level * bps) / 10000;
  const answer = roundTo(pointsMove * contract.multiplierPerPoint * lots, 2);

  return {
    kind: 'numeric',
    id: `bp-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'index-bps-to-money',
    category: 'math',
    subgroup: 'basis-points',
    prompt: `The ${contract.name} is at ${index.level.toLocaleString('en-US')} with a multiplier of ${contract.multiplierPerPoint.toLocaleString('en-US')} ${contract.currency} per index point. You hold ${lots} lot${lots > 1 ? 's' : ''}. What is the PnL from a ${bps}bp move in the index, in ${contract.currency}?`,
    context: 'Here the basis point is of PRICE, not of notional. Convert to index points first, then to money.',
    explain: `A ${bps}bp move is ${index.level.toLocaleString('en-US')} x ${bps} / 10,000 = ${pointsMove.toFixed(2)} index points. Money = ${pointsMove.toFixed(2)} x ${contract.multiplierPerPoint.toLocaleString('en-US')} x ${lots} = ${answer.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${contract.currency}.`,
    anchor: 'A basis point of index level is not a basis point of notional. Points first, then multiply by the point value.',
    citation: 'Manual, Math and units',
    signature: `bp|index-price-to-money-${contract.multiplierPerPoint}`,
    answer,
    decimals: 2,
    tolerance: 0,
    unit: contract.currency,
  };
}

export const bpGenerators: Generator[] = [
  {
    id: 'bp-to-money',
    category: 'math',
    subgroup: 'basis-points',
    about: 'Basis points of notional to money, across the regional currencies.',
    generate: bpToMoney,
  },
  {
    id: 'money-to-bp',
    category: 'math',
    subgroup: 'basis-points',
    about: 'Money back to basis points of notional.',
    generate: moneyToBp,
  },
  {
    id: 'index-bps-to-money',
    category: 'math',
    subgroup: 'basis-points',
    about: 'A basis-point move in an index level, converted to money through the point value.',
    generate: indexMoveToMoney,
  },
];
