/**
 * Gamma and Greek PnL drills (README section 1.1).
 *
 * The unit convention is stated in every prompt, because the README's point is
 * that the difficulty of this drill is unit discipline rather than algebra.
 *
 * Definition used throughout: gamma is quoted in currency per 1 percentage
 * point move in the underlying. With that convention
 *
 *     gamma PnL = (1/2) * gamma * movePct^2 / 100
 *
 * which is the README's worked example: gamma 100,000 and a 5% move give
 * (1/2) * 100,000 * 25 / 100 = 12,500.
 *
 * Reproducibility: every parameter is drawn from a fixed list and every answer
 * is an exact 2dp value, so no rounding decision is ever taken at answer time.
 * With gamma a multiple of 50,000, gamma/200 is an integer, and with movePct to
 * one decimal place movePct^2 has at most two, so the product is exact.
 */
import { round2 } from '../money';
import { INDICES } from './indices';
import type { Generator, Question, Rng, Tier } from '../types';

const GAMMAS = [50_000, 100_000, 150_000, 200_000, 250_000, 400_000, 500_000, 750_000] as const;
const MOVES = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10] as const;
const DELTAS = [10_000, 25_000, 50_000, 100_000, 200_000, 250_000] as const;
const THETAS = [5_000, 10_000, 15_000, 20_000, 25_000, 50_000] as const;
const VOL_POINTS = [1, 1.5, 2, 2.5, 3, 4, 5] as const;
const VEGAS = [10_000, 20_000, 25_000, 50_000, 100_000, 250_000] as const;

/** gamma PnL in currency, exact at 2dp for the parameter sets above. */
function gammaPnl(gamma: number, movePct: number): number {
  return round2((gamma * movePct * movePct) / 200);
}

function deltaPnl(delta: number, movePct: number): number {
  return round2((delta * movePct) / 100);
}

function base(rng: Rng, tier: Tier) {
  const gamma = rng.pick(GAMMAS);
  const movePct = rng.pick(MOVES);
  const index = rng.pick(INDICES);
  return {
    gamma,
    movePct,
    indexName: index.name,
    indexLevel: index.level,
  };
}

function id(rng: Rng): string {
  return `gamma-${rng.int(0, 1_000_000).toString(36)}`;
}

function gammaOnly(rng: Rng, tier: Tier): Question {
  const { gamma, movePct, indexName, indexLevel } = base(rng, tier);
  const answer = gammaPnl(gamma, movePct);

  return {
    kind: 'numeric',
    id: id(rng),
    generatorId: 'gamma-pnl',
    category: 'math',
    tier,
    prompt: `Your book carries a gamma of ${gamma.toLocaleString('en-US')} on the ${indexName}, quoted in dollars per 1 percentage point move in the index. The index is at ${indexLevel.toLocaleString('en-US')} and moves ${movePct}%. What is the gamma PnL, in dollars?`,
    context: 'Gamma is quoted per 1 percentage point, not per 1.00 of spot.',
    explain: `Gamma PnL scales with the square of the move. The move is ${movePct}% = ${movePct} units of 1pp, so the PnL is (1/2) x ${gamma.toLocaleString('en-US')} x ${movePct}^2 / 100 = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Equivalently the delta change is ${(gamma * movePct).toLocaleString('en-US')}, and the PnL is the average delta times the move.`,
    anchor: `With gamma per 1pp: PnL = (gamma / 200) x movePct^2. Here gamma/200 = ${(gamma / 200).toLocaleString('en-US')}.`,
    citation: 'README section 1.1, worked example.',
    signature: 'gamma-pnl|per-1pp',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: 'USD',
  };
}

function deltaPlusGamma(rng: Rng, tier: Tier): Question {
  const { gamma, movePct, indexName, indexLevel } = base(rng, tier);
  const delta = rng.pick(DELTAS);
  const dPnl = deltaPnl(delta, movePct);
  const gPnl = gammaPnl(gamma, movePct);
  const answer = round2(dPnl + gPnl);

  return {
    kind: 'numeric',
    id: id(rng),
    generatorId: 'delta-gamma-pnl',
    category: 'math',
    tier,
    prompt: `Your book is long ${delta.toLocaleString('en-US')} delta and ${gamma.toLocaleString('en-US')} gamma on the ${indexName}, both quoted in dollars per 1 percentage point move. The index moves ${movePct}% in your favour. What is the total PnL, in dollars?`,
    context:
      'Both Greeks are quoted per 1 percentage point move. The delta gain is linear in the move; the gamma gain is quadratic.',
    explain: `Delta PnL = ${delta.toLocaleString('en-US')} x ${movePct} / 100 = ${dPnl.toLocaleString('en-US')}. Gamma PnL = ${gamma.toLocaleString('en-US')} x ${movePct}^2 / 200 = ${gPnl.toLocaleString('en-US')}. Total = ${answer.toLocaleString('en-US')}. The gamma term is the second-order correction, and it grows quadratically, so it dominates as the move widens.`,
    anchor: 'Split PnL into the linear delta term and the quadratic gamma term, then add. Never net the Greeks first.',
    citation: 'README section 1.1, quiz mechanics.',
    signature: 'gamma-pnl|delta-plus-gamma',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: 'USD',
  };
}

function fullAttribution(rng: Rng, tier: Tier): Question {
  const { gamma, movePct, indexName, indexLevel } = base(rng, tier);
  const delta = rng.pick(DELTAS);
  const theta = rng.pick(THETAS);
  const days = rng.int(1, 5);
  const vega = rng.pick(VEGAS);
  const volMove = rng.pick(VOL_POINTS);

  const dPnl = deltaPnl(delta, movePct);
  const gPnl = gammaPnl(gamma, movePct);
  const thetaPnl = -round2(theta * days);
  const vegaPnl = round2(vega * volMove);
  const answer = round2(dPnl + gPnl + thetaPnl + vegaPnl);

  return {
    kind: 'numeric',
    id: id(rng),
    generatorId: 'pnl-attribution',
    category: 'math',
    tier,
    prompt: `Overnight, the ${indexName} moved ${movePct}% and implied vol rose ${volMove} points over ${days} calendar day${days > 1 ? 's' : ''}. Your book: delta ${delta.toLocaleString('en-US')}, gamma ${gamma.toLocaleString('en-US')}, vega ${vega.toLocaleString('en-US')} per vol point, theta ${theta.toLocaleString('en-US')} per day. What is the total PnL, in dollars?`,
    context:
      'Delta and gamma are per 1 percentage point move. Vega is per vol point (1% of vol). Theta is a cost, so it enters negative.',
    explain: `Delta: +${dPnl.toLocaleString('en-US')}. Gamma: +${gPnl.toLocaleString('en-US')}. Vega (vol rose): +${vegaPnl.toLocaleString('en-US')}. Theta over ${days} day${days > 1 ? 's' : ''}: ${thetaPnl.toLocaleString('en-US')}. Total ${answer.toLocaleString('en-US')}.`,
    anchor: 'Attribution is additive only to second order. On a large move the cross terms stop being negligible and the decomposition will not reconcile.',
    citation: 'README sections 1.1 and 1.5.',
    signature: 'gamma-pnl|full-attribution',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: 'USD',
  };
}

function expectedMove(rng: Rng, tier: Tier): Question {
  const vol = rng.pick([10, 15, 20, 25, 30, 40, 50] as const);
  const index = rng.pick(INDICES);
  const annualMovePct = vol;
  const daily = round2(annualMovePct / 16);
  const weekly = round2(annualMovePct / 7);
  const answer = daily;

  return {
    kind: 'numeric',
    id: id(rng),
    generatorId: 'expected-move',
    category: 'math',
    tier,
    prompt: `The ${index.name} is at ${index.level.toLocaleString('en-US')} and one-month implied vol is ${vol}%. Using the standard approximation, what is the one-day expected move as a percentage of spot, to the nearest 0.01%?`,
    context: 'One-day move is approximately annual vol divided by 16, because there are roughly 256 trading days in a year.',
    explain: `One-day move = ${vol} / 16 = ${daily}%. For reference the one-week figure is ${vol} / 7 = ${weekly}%. The divisors come from the square root of time: sqrt(256) = 16 and sqrt(52) = 7.2.`,
    anchor: 'Annual vol / 16 is the daily move. Annual vol / 7 is the weekly move. Memorise both divisors.',
    citation: 'README section 1.1, back-of-envelope anchors.',
    signature: 'expected-move|one-day',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: '%',
  };
}

function deltaPnlOnly(rng: Rng, tier: Tier): Question {
  const delta = rng.pick(DELTAS);
  const movePct = rng.pick(MOVES);
  const answer = deltaPnl(delta, movePct);
  const index = rng.pick(INDICES);

  return {
    kind: 'numeric',
    id: id(rng),
    generatorId: 'delta-pnl',
    category: 'math',
    tier,
    prompt: `You are long ${delta.toLocaleString('en-US')} delta on the ${index.name}, quoted in dollars per 1 percentage point move. The index moves ${movePct}%. What is the delta PnL, in dollars?`,
    context: 'Delta is quoted per 1 percentage point move.',
    explain: `Delta PnL = delta x movePct / 100 = ${delta.toLocaleString('en-US')} x ${movePct} / 100 = ${answer.toLocaleString('en-US')}.`,
    anchor: 'Delta per 1pp, so the answer is delta x movePct / 100. Note the divide by 100: the move is quoted in percent.',
    citation: 'README section 1.1.',
    signature: 'gamma-pnl|delta-only',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: 'USD',
  };
}

export const gammaGenerators: Generator[] = [
  {
    id: 'gamma-pnl',
    category: 'math',
    tier: 1,
    about: 'Gamma PnL from a gamma quoted per 1 percentage point and a percentage move.',
    generate: gammaOnly,
  },
  {
    id: 'delta-pnl',
    category: 'math',
    tier: 1,
    about: 'Delta PnL, to keep the unit convention of a Greek quoted "per 1pp" sharp.',
    generate: deltaPnlOnly,
  },
  {
    id: 'expected-move',
    category: 'math',
    tier: 2,
    about: 'One-day and one-week expected move from annualised vol (vol/16 and vol/7).',
    generate: expectedMove,
  },
  {
    id: 'delta-gamma-pnl',
    category: 'math',
    tier: 3,
    about: 'Total PnL split into the linear delta term and the quadratic gamma term.',
    generate: deltaPlusGamma,
  },
  {
    id: 'pnl-attribution',
    category: 'math',
    tier: 4,
    about: 'Full overnight attribution across delta, gamma, vega and theta.',
    generate: fullAttribution,
  },
];
