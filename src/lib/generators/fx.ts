/**
 * FX conversion and triangulation (README section 1.2).
 *
 * Important design decision: these questions SUPPLY the rate in the question
 * text. They never ask the trader to recall a live level. That is deliberate —
 * a recall drill becomes unanswerable, and unfair, the moment the rate moves,
 * and the frozen fx.json is illustrative rather than verified. Conversion
 * arithmetic is the trainable skill; the level itself is not.
 *
 * Recall-the-level drills exist only as a separate generator that refuses to
 * run unless fx.json has been verified.
 */
import fxData from '../../data/fx.json';
import { round2, roundTo } from '../money';
import type { Generator, NumericQuestion, Rng, Tier } from '../types';

interface Pair {
  pair: string;
  rate: number;
  pipDecimals: number;
}

const PAIRS = fxData.usdPairs as Pair[];
const VERIFIED = fxData.verified as boolean;

function formatAmount(value: number, code: string): string {
  return `${value.toLocaleString('en-US')} ${code}`;
}

function rateFor(pair: string): Pair {
  const found = PAIRS.find((p) => p.pair === pair);
  if (!found) throw new Error(`No rate for ${pair}`);
  return found;
}

const CONVERSIONS: readonly { from: string; to: string; pair: string; amounts: readonly number[] }[] = [
  { from: 'USD', to: 'JPY', pair: 'USD/JPY', amounts: [100_000, 500_000, 1_000_000, 10_000_000] },
  { from: 'USD', to: 'CHF', pair: 'USD/CHF', amounts: [100_000, 250_000, 1_000_000] },
  { from: 'USD', to: 'SGD', pair: 'USD/SGD', amounts: [1_000_000, 5_000_000, 25_000_000] },
  { from: 'USD', to: 'HKD', pair: 'USD/HKD', amounts: [1_000_000, 10_000_000] },
  { from: 'USD', to: 'CNH', pair: 'USD/CNH', amounts: [1_000_000, 10_000_000, 50_000_000] },
  { from: 'USD', to: 'AUD', pair: 'USD/AUD', amounts: [1_000_000, 5_000_000] },
];

function usdConversion(rng: Rng, tier: Tier): NumericQuestion {
  const spec = rng.pick(CONVERSIONS);
  const pair = rateFor(spec.pair);
  const amount = rng.pick(spec.amounts);

  // Answer rounded to whole units of the quote currency, which is what a trader
  // would actually quote for these sizes.
  const raw = amount * pair.rate;
  const answer = round2(raw);

  return {
    kind: 'numeric',
    id: `fx-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'fx-conversion',
    category: 'math',
    subgroup: 'fx',
    tier,
    prompt: `Convert ${formatAmount(amount, spec.from)} to ${spec.to} at ${pair.pair} ${pair.rate.toFixed(pair.pipDecimals)}. Give the answer in ${spec.to}, to 2 decimal places.`,
    context: `${pair.pair} is quoted as ${spec.to} per 1 ${spec.from}. Multiply, do not divide.`,
    explain: `${amount.toLocaleString('en-US')} x ${pair.rate.toFixed(pair.pipDecimals)} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${spec.to}.`,
    anchor: `For a USD/XXX quote, USD amounts are multiplied by the rate. For XXX/USD, they are divided. Check the direction before computing.`,
    citation: 'README section 1.2.',
    signature: `fx|convert-${spec.pair.replace('/', '-')}`,
    answer,
    decimals: 2,
    tolerance: 0,
    unit: spec.to,
  };
}

const TRIANGULATIONS: readonly { a: string; b: string; cross: string; inverse: boolean }[] = [
  { a: 'USD/SGD', b: 'USD/JPY', cross: 'SGD/JPY', inverse: false },
  { a: 'USD/CHF', b: 'USD/JPY', cross: 'CHF/JPY', inverse: false },
  { a: 'USD/SGD', b: 'USD/HKD', cross: 'SGD/HKD', inverse: false },
  { a: 'USD/AUD', b: 'USD/SGD', cross: 'AUD/SGD', inverse: false },
  { a: 'USD/CNH', b: 'USD/HKD', cross: 'CNH/HKD', inverse: false },
  { a: 'USD/JPY', b: 'USD/SGD', cross: 'JPY/SGD', inverse: false },
];

function triangulation(rng: Rng, tier: Tier): NumericQuestion {
  const spec = rng.pick(TRIANGULATIONS);
  const pa = rateFor(spec.a);
  const pb = rateFor(spec.b);
  const answer = roundTo(pb.rate / pa.rate, 4);

  return {
    kind: 'numeric',
    id: `fx-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'fx-triangulation',
    category: 'math',
    subgroup: 'fx',
    tier,
    prompt: `Given ${spec.a} ${pa.rate.toFixed(pa.pipDecimals)} and ${spec.b} ${pb.rate.toFixed(pb.pipDecimals)}, what is ${spec.cross}? Give 4 decimal places.`,
    context: 'Both quotes share the USD leg. The cross rate is the ratio of the two, and you must decide which way round.',
    explain: `${spec.cross} = ${spec.b} / ${spec.a} = ${pb.rate.toFixed(pb.pipDecimals)} / ${pa.rate.toFixed(pa.pipDecimals)} = ${answer.toFixed(4)}. Getting the ratio the wrong way round is the whole difficulty of this drill.`,
    anchor: 'Write the units out. To get SGD per JPY from USD/SGD and USD/JPY, put the JPY leg on top: JPY-per-USD divided by SGD-per-USD.',
    citation: 'README section 1.2, worked example (SGD/JPY from USD/SGD 1.31 and USD/JPY 152.40).',
    signature: `fx|triangulate-${spec.cross.replace('/', '-')}`,
    answer,
    decimals: 4,
    tolerance: 0,
  };
}

/** Pip value on a standard lot. Supplied rate, so always answerable. */
function pipValue(rng: Rng, tier: Tier): NumericQuestion {
  const pair = rng.pick(PAIRS.filter((p) => p.pipDecimals === 4));
  const notional = rng.pick([100_000, 1_000_000, 10_000_000] as const);
  const pipSize = 1 / 10 ** pair.pipDecimals;
  // Pip value in the QUOTE currency.
  const answer = round2(notional * pipSize);
  const quote = pair.pair.split('/')[1] as string;

  return {
    kind: 'numeric',
    id: `fx-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'fx-pip-value',
    category: 'math',
    subgroup: 'fx',
    tier,
    prompt: `You hold ${formatAmount(notional, pair.pair.split('/')[0] as string)} of ${pair.pair}. What is the value of one pip, in ${quote}?`,
    context: `${pair.pair} is quoted to ${pair.pipDecimals} decimal places, so one pip is ${pipSize}.`,
    explain: `Pip value in the quote currency = notional x pip size = ${notional.toLocaleString('en-US')} x ${pipSize} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote}. To express it in USD you would divide by the rate.`,
    anchor: 'One pip on a 100,000 unit lot is 10 units of the quote currency for a 4dp pair, and 1,000 for a JPY pair quoted to 2dp.',
    citation: 'README section 1.2, upgrade 4.',
    signature: `fx|pip-value-${pair.pair.replace('/', '-')}`,
    answer,
    decimals: 2,
    tolerance: 0,
    unit: quote,
  };
}

/**
 * Recall of a rate level. Refuses to run until fx.json is verified, so the daily
 * set cannot contain a question whose answer is stale.
 */
function recallLevel(rng: Rng, tier: Tier): NumericQuestion {
  if (!VERIFIED) {
    // Not a throw: a generator that cannot run must yield something, and the set
    // builder filters on a capability flag instead. See registry.ts.
    throw new Error('fx recall requires verified data');
  }
  const pair = rng.pick(PAIRS);
  return {
    kind: 'numeric',
    id: `fx-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'fx-recall-level',
    category: 'math',
    subgroup: 'fx',
    tier,
    prompt: `What is ${pair.pair} currently trading at? Give ${pair.pipDecimals} decimal places.`,
    context: `Data snapshot: ${fxData.asOf}.`,
    explain: `The rate in the snapshot is ${pair.rate.toFixed(pair.pipDecimals)}.`,
    anchor: 'Knowing the big figure matters more than the last pip. Aim to be within a figure, not to the pip, when recalling from memory.',
    citation: `fx.json, asOf ${fxData.asOf}.`,
    signature: `fx|recall-${pair.pair.replace('/', '-')}`,
    answer: pair.rate,
    decimals: pair.pipDecimals,
    tolerance: 0,
    unit: pair.pair.split('/')[1] as string,
  };
}

export const fxGenerators: Generator[] = [
  {
    id: 'fx-conversion',
    category: 'math',
    subgroup: 'fx',
    tier: 1,
    about: 'Convert an amount between currencies at a supplied rate.',
    generate: usdConversion,
  },
  {
    id: 'fx-triangulation',
    category: 'math',
    subgroup: 'fx',
    tier: 3,
    about: 'Derive a cross rate from two USD legs.',
    generate: triangulation,
  },
  {
    id: 'fx-pip-value',
    category: 'math',
    subgroup: 'fx',
    tier: 2,
    about: 'Value of one pip on a given notional, in the quote currency.',
    generate: pipValue,
  },
  {
    id: 'fx-recall-level',
    category: 'math',
    subgroup: 'fx',
    tier: 2,
    about: 'Recall the current level of a pair. Disabled until fx.json is verified.',
    generate: recallLevel,
  },
];

export const fxDataVerified = VERIFIED;
