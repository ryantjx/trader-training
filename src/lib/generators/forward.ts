/**
 * Spot-forward and forward points (README section 1.4).
 *
 *     F = S * (1 + r_quote * t) / (1 + r_base * t)
 *
 * Rates and tenors are drawn as clean values so that the forward rate is exact
 * at 4dp for the tenor grid in use, and the premium/discount direction follows
 * from the interest-rate differential rather than from a convention to memorise:
 * the higher-yielding currency trades at a forward discount.
 */
import { roundTo } from '../money';
import type { ChoiceOption, ChoiceQuestion, Generator, NumericQuestion, Rng, Tier } from '../types';

interface Tenor {
  label: string;
  years: number;
  pipScaling: number;
}

const TENORS: readonly Tenor[] = [
  { label: '1 month', years: 1 / 12, pipScaling: 1 },
  { label: '3 month', years: 3 / 12, pipScaling: 1 },
  { label: '6 month', years: 6 / 12, pipScaling: 1 },
  { label: '1 year', years: 1, pipScaling: 1 },
];

const SPOTS: readonly { pair: string; spot: number; decimals: number }[] = [
  { pair: 'USD/SGD', spot: 1.31, decimals: 4 },
  { pair: 'USD/JPY', spot: 152.4, decimals: 2 },
  { pair: 'USD/HKD', spot: 7.81, decimals: 4 },
  { pair: 'USD/CHF', spot: 0.89, decimals: 4 },
  { pair: 'USD/AUD', spot: 0.65, decimals: 4 },
  { pair: 'USD/CNH', spot: 7.12, decimals: 4 },
];

const RATE_STEPS = [0.5, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5] as const;

function forward(spot: number, rQuote: number, rBase: number, t: number): number {
  return (spot * (1 + rQuote * t)) / (1 + rBase * t);
}

function forwardRate(rng: Rng, tier: Tier): NumericQuestion {
  const spec = rng.pick(SPOTS);
  const tenor = rng.pick(TENORS);
  const rQuote = rng.pick(RATE_STEPS);
  const rBase = rng.pick(RATE_STEPS);
  const quote = spec.pair.split('/')[1] as string;
  const base = spec.pair.split('/')[0] as string;

  const answer = roundTo(forward(spec.spot, rQuote, rBase, tenor.years), spec.decimals);
  const points = roundTo((answer - spec.spot) * 10 ** spec.decimals, 1);

  return {
    kind: 'numeric',
    id: `fwd-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'forward-rate',
    category: 'math',
    subgroup: 'forwards',
    tier,
    prompt: `${spec.pair} spot is ${spec.spot.toFixed(spec.decimals)}. The ${quote} ${tenor.label} rate is ${rQuote}% and the ${base} ${tenor.label} rate is ${rBase}%. What is the ${tenor.label} forward, to ${spec.decimals} decimal places?`,
    context: `F = S x (1 + r_${quote} t) / (1 + r_${base} t), with t = ${tenor.years.toFixed(4)} years.`,
    explain: `F = ${spec.spot.toFixed(spec.decimals)} x (1 + ${rQuote}% x ${tenor.years.toFixed(4)}) / (1 + ${rBase}% x ${tenor.years.toFixed(4)}) = ${answer.toFixed(spec.decimals)}. That is ${points >= 0 ? '+' : ''}${points} forward points. ${rBase > rQuote ? `${base} yields more than ${quote}, so ${base} trades at a forward discount and the points are negative.` : `${quote} yields more than ${base}, so ${quote} trades at a forward discount and ${base} at a premium.`}`,
    anchor: 'The higher-yielding currency trades at a forward discount. Say which leg pays the points before you compute.',
    citation: 'README section 1.4.',
    signature: `fwd|rate-${spec.pair.replace('/', '-')}-${tenor.label.replace(' ', '')}`,
    answer,
    decimals: spec.decimals,
    tolerance: 0,
  };
}

function premiumOrDiscount(rng: Rng, tier: Tier): ChoiceQuestion {
  const spec = rng.pick(SPOTS);
  const rQuote = rng.pick(RATE_STEPS);
  // Force a non-zero differential so the answer is unambiguous.
  const rBase = rng.pick(RATE_STEPS.filter((r) => r !== rQuote));
  const quote = spec.pair.split('/')[1] as string;
  const base = spec.pair.split('/')[0] as string;

  const baseHigher = rBase > rQuote;
  const correct = baseHigher
    ? `${base} at a forward discount, ${quote} at a premium`
    : `${base} at a forward premium, ${quote} at a discount`;

  const options: ChoiceOption[] = [
    { id: 'right', label: correct },
    { id: 'w1', label: `${base} at a forward discount, ${quote} at a premium`, note: 'Check which leg pays the higher interest rate.' },
    { id: 'w2', label: 'Neither: spot and forward are the same', note: 'That would only hold with identical interest rates.' },
  ];

  return {
    kind: 'choice',
    id: `fwd-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'forward-premium',
    category: 'math',
    subgroup: 'forwards',
    tier,
    prompt: `${spec.pair} spot is ${spec.spot.toFixed(spec.decimals)}. The ${quote} rate is ${rQuote}% and the ${base} rate is ${rBase}%. Which leg trades at a forward discount?`,
    context: `${spec.pair} means ${quote} per 1 ${base}. The ${quote} leg is the quote currency and the ${base} leg is the base currency.`,
    explain: `${rBase}% versus ${rQuote}%, so ${baseHigher ? base : quote} is the higher-yielding leg and therefore trades at a forward discount. The forward adjuster is (1 + r_quote t) / (1 + r_base t), so the higher-yielding leg's numerator or denominator is the larger one.`,
    anchor: 'Higher yield, forward discount. The currency you are paid to hold is the one that is more expensive to buy forward.',
    citation: 'README section 1.4, drills.',
    signature: 'fwd|premium-or-discount',
    options: rng.shuffle(options),
    answerId: 'right',
  };
}

function rollCost(rng: Rng, tier: Tier): NumericQuestion {
  const spec = rng.pick(SPOTS);
  const tenor = rng.pick(TENORS);
  const rQuote = rng.pick(RATE_STEPS);
  const rBase = rng.pick(RATE_STEPS);
  const notional = rng.pick([1_000_000, 10_000_000, 50_000_000] as const);

  const days = Math.round(tenor.years * 365);
  const f = forward(spec.spot, rQuote, rBase, tenor.years);
  // Cost of the forward points on the notional, in the base currency's terms,
  // converted through spot so it is expressed in the quote currency.
  const pointsPerBase = f - spec.spot;
  const answer = roundTo(Math.abs(pointsPerBase) * notional, 2);

  return {
    kind: 'numeric',
    id: `fwd-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'forward-roll-cost',
    category: 'math',
    subgroup: 'forwards',
    tier,
    prompt: `${spec.pair} spot is ${spec.spot.toFixed(spec.decimals)} and the ${tenor.label} forward points are ${pointsPerBase >= 0 ? '+' : ''}${roundTo(pointsPerBase * 10 ** spec.decimals, 1)} pips. You need to roll a ${notional.toLocaleString('en-US')} ${spec.pair.split('/')[0] as string} hedge one ${tenor.label} forward. What does the roll cost, in ${spec.pair.split('/')[1] as string}, to 2 decimal places? Ignore bid-ask.`,
    context: 'Cost = absolute forward points x notional. The sign tells you which side pays; the magnitude is what you budget.',
    explain: `|${pointsPerBase.toFixed(6)}| x ${notional.toLocaleString('en-US')} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${spec.pair.split('/')[1] as string}. Over about ${days} days, which is where the ${tenor.label} points come from.`,
    anchor: 'Rolling a hedge is a known cost, not a market call. Price it in points, then in money, before rolling.',
    citation: 'README section 1.4, drills.',
    signature: `fwd|roll-cost-${spec.pair.replace('/', '-')}`,
    answer,
    decimals: 2,
    tolerance: 0,
    unit: spec.pair.split('/')[1] as string,
  };
}

export const forwardGenerators: Generator[] = [
  {
    id: 'forward-rate',
    category: 'math',
    subgroup: 'forwards',
    tier: 3,
    about: 'Derive an FX forward rate from spot and an interest-rate differential.',
    generate: forwardRate,
  },
  {
    id: 'forward-premium',
    category: 'math',
    subgroup: 'forwards',
    tier: 2,
    about: 'Which leg of an FX pair trades at a forward premium or discount.',
    generate: premiumOrDiscount,
  },
  {
    id: 'forward-roll-cost',
    category: 'math',
    subgroup: 'forwards',
    tier: 4,
    about: 'Cost in money of rolling a hedge forward by one tenor.',
    generate: rollCost,
  },
];
