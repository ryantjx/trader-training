/**
 * Vega, vol-to-price and strike from delta (README section 1.5).
 *
 * This is the arithmetic an exotic desk actually uses, and the README argues it
 * is asked at interview far more often than gamma PnL.
 *
 * A note on the decision to keep transcendentals. The strike-from-delta drill
 * needs exp and sqrt. Those are not guaranteed to agree in the last bit across
 * JS engines, but every answer here is displayed and marked at 2dp (or at one
 * index point), which absorbs any last-bit drift by a very wide margin: the
 * quantities involved are order 1e2, and a last-bit difference is order 1e-14.
 * The property tests assert answers do not land near a rounding boundary, which
 * is the condition under which that reasoning holds.
 *
 *     K ≈ S * exp(±z * sigma * sqrt(T)),  z = Phi^-1(delta)
 */
import { roundTo } from '../money';
import { INDICES } from './indices';
import type { Generator, NumericQuestion, Rng, Tier } from '../types';

const VOLS = [10, 12, 15, 18, 20, 22, 25, 30, 35, 40] as const;
const TENORS = [
  { label: '1 month', years: 1 / 12 },
  { label: '3 month', years: 3 / 12 },
  { label: '6 month', years: 6 / 12 },
  { label: '1 year', years: 1 },
] as const;
const VEGAS = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000] as const;
const VOL_MOVES = [0.5, 1, 1.5, 2, 2.5, 3, 5] as const;

/** Inverse standard normal CDF, Acklam's rational approximation. */
export function invNorm(p: number): number {
  if (p <= 0 || p >= 1) throw new Error('invNorm requires 0 < p < 1');
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
    );
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
    ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
  );
}

/** Strike for a given positive delta, using the lognormal approximation. */
export function strikeFromDelta(
  spot: number,
  volPct: number,
  years: number,
  delta: number,
  isPut: boolean,
): number {
  const sigma = volPct / 100;
  const z = Math.abs(invNorm(delta));
  const exponent = z * sigma * Math.sqrt(years);
  return isPut ? spot * Math.exp(-exponent) : spot * Math.exp(exponent);
}

function vegaPnl(rng: Rng, tier: Tier): NumericQuestion {
  const vega = rng.pick(VEGAS);
  const volMove = rng.pick(VOL_MOVES);
  const answer = roundTo(vega * volMove, 2);

  return {
    kind: 'numeric',
    id: `vega-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'vega-pnl',
    category: 'math',
    subgroup: 'vol',
    tier,
    prompt: `Your vega is ${vega.toLocaleString('en-US')} per vol point. Implied vol rises ${volMove} points. What is the vega PnL, in dollars?`,
    context: 'Vega is quoted per vol point, meaning per 1% absolute change in vol, not per 1% of vol.',
    explain: `Vega PnL = vega x volts moved = ${vega.toLocaleString('en-US')} x ${volMove} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
    anchor: 'Vega per vol point and vega per 1.00 of vol differ by a factor of 100. Establish which before quoting anything.',
    citation: 'README section 1.5.',
    signature: 'vega|pnl',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: 'USD',
  };
}

function priceMoveToVolPoints(rng: Rng, tier: Tier): NumericQuestion {
  const vol = rng.pick(VOLS);
  const move = rng.pick([0.5, 1, 1.5, 2, 3, 4] as const);
  const answer = roundTo((move / vol) * 100 / 100, 4);

  return {
    kind: 'numeric',
    id: `vol-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'price-move-to-vol',
    category: 'math',
    subgroup: 'vol',
    tier,
    prompt: `The index moves ${move}% in a day and annualised implied vol is ${vol}%. Express that move in vol points, to 4 decimal places.`,
    context: 'A move of x% at k% annualised vol is worth approximately x / k vol points.',
    explain: `${move} / ${vol} = ${answer.toFixed(4)} vol points. At ${vol}% vol, a 1% move is about ${(100 / vol).toFixed(2)} vol points, so the ${move}% move is ${move} times that.`,
    anchor: 'Divide the percentage move by the percentage vol. At 20 vol a 1% move is 5 vol points; at 10 vol it is 10.',
    citation: 'README section 1.5.',
    signature: 'vol|price-move-to-vol-points',
    answer,
    decimals: 4,
    tolerance: 0,
  };
}

function deltaStrike(rng: Rng, tier: Tier): NumericQuestion {
  const index = rng.pick(INDICES);
  const spot = index.level;
  const vol = rng.pick(VOLS);
  const tenor = rng.pick(TENORS);
  const delta = rng.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4] as const);
  const isPut = rng.bool();

  const strike = strikeFromDelta(spot, vol, tenor.years, delta, isPut);
  const answer = roundTo(strike, 1);
  const pctFromSpot = ((strike - spot) / spot) * 100;

  return {
    kind: 'numeric',
    id: `delta-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'delta-strike',
    category: 'math',
    subgroup: 'vol',
    tier,
    prompt: `The ${index.name} is at ${spot.toLocaleString('en-US')}, ${tenor.label} implied vol is ${vol}%. Where is the ${Math.round(delta * 100)}-delta ${isPut ? 'put' : 'call'} strike, to 1 decimal place?`,
    context: `K ≈ S x exp(±z σ√T) with z = Φ⁻¹(${delta}). Round numbers: Φ⁻¹(0.25) ≈ 0.67, Φ⁻¹(0.10) ≈ 1.28.`,
    explain: `σ√T = ${(vol / 100).toFixed(4)} x √${tenor.years.toFixed(4)} = ${((vol / 100) * Math.sqrt(tenor.years)).toFixed(4)}. z = Φ⁻¹(${delta}) = ${Math.abs(invNorm(delta)).toFixed(4)}. The wing sits ${Math.abs(Math.abs(invNorm(delta)) * (vol / 100) * Math.sqrt(tenor.years) * 100).toFixed(2)}% ${isPut ? 'below' : 'above'} spot, so K ≈ ${answer.toFixed(1)}.`,
    anchor: 'A 25-delta option sits about 0.67 σ√T from spot; a 10-delta about 1.28 σ√T. Tenor scales that distance by √T, so the same delta is much closer to spot in the front.',
    citation: 'README section 1.5.',
    signature: `vol|delta-strike-${Math.round(delta * 100)}-${isPut ? 'put' : 'call'}`,
    answer,
    decimals: 1,
    tolerance: 0,
  };
}

function breakevenVol(rng: Rng, tier: Tier): NumericQuestion {
  const theta = rng.pick([5_000, 10_000, 20_000, 25_000, 50_000] as const);
  const gamma = rng.pick([50_000, 100_000, 200_000, 250_000, 500_000] as const);
  // sigma_be = sqrt(2 * theta / gamma), expressed in annualised vol points by
  // multiplying by 100 and by sqrt(252) trading days for a daily theta/gamma.
  const dailyVol = Math.sqrt((2 * theta) / gamma);
  const annualPct = roundTo(dailyVol * Math.sqrt(252) * 100, 2);

  return {
    kind: 'numeric',
    id: `be-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'breakeven-vol',
    category: 'math',
    subgroup: 'vol',
    tier,
    prompt: `Your book has gamma ${gamma.toLocaleString('en-US')} and theta ${theta.toLocaleString('en-US')} per day, both in dollars per 1 percentage point. What annualised realised vol do you need to break even, in vol points to 2 decimal places? Assume 252 trading days.`,
    context: 'σ_be = sqrt(2 Θ / Γ) per unit time. Convert the daily figure to annualised by multiplying by sqrt(252).',
    explain: `Daily breakeven = sqrt(2 x ${theta.toLocaleString('en-US')} / ${gamma.toLocaleString('en-US')}) = ${dailyVol.toFixed(6)}. Annualised = ${dailyVol.toFixed(6)} x sqrt(252) x 100 = ${annualPct.toFixed(2)} vol points.`,
    anchor: 'Breakeven vol rises with the square root of the theta/gamma ratio. Doubling theta raises the breakeven by about 41%.',
    citation: 'README section 1.5.',
    signature: 'vol|breakeven',
    answer: annualPct,
    decimals: 2,
    tolerance: 0,
    unit: 'vol pts',
  };
}

function forwardVol(rng: Rng, tier: Tier): NumericQuestion {
  const t1 = rng.pick([0.25, 0.5, 1] as const);
  const t2 = rng.pick([2, 3] as const);
  const s1 = rng.pick([12, 14, 16, 18, 20, 22] as const);
  const s2 = rng.pick([16, 18, 20, 22, 24, 26] as const);

  const variance = (s2 * s2 * t2 - s1 * s1 * t1) / (t2 - t1);
  const answer = roundTo(Math.sqrt(Math.max(0, variance)), 2);

  return {
    kind: 'numeric',
    id: `fwdvol-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'forward-vol',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: `The ${t1 * 12}-month implied vol is ${s1}% and the ${t2}-year implied vol is ${s2}%. What is the forward vol between ${t1 * 12} months and ${t2} years, to 2 decimal places?`,
    context: 'σ²_{t1→t2} = (σ²_{0→t2} t2 − σ²_{0→t1} t1) / (t2 − t1).',
    explain: `σ² = (${s2}² x ${t2} − ${s1}² x ${t1}) / (${t2} − ${t1}) = ${variance.toFixed(4)}, so σ = ${answer.toFixed(2)}%.`,
    anchor: 'Work in variance, not vol. Average variances weighted by time, then take the square root at the end.',
    citation: 'README sections 1.5 and 4.2.',
    signature: 'vol|forward-vol',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: '%',
  };
}

function volBasis(rng: Rng, tier: Tier): NumericQuestion {
  const onshore = rng.pick([16, 18, 20, 22, 24] as const);
  const basis = rng.pick([-1.5, -1, -0.75, -0.5, 0.5, 0.75, 1, 1.5] as const);
  const offshore = roundTo(onshore + basis, 2);
  const notional = rng.pick([1_000_000, 10_000_000, 25_000_000] as const);
  const vega = rng.pick([10_000, 25_000, 50_000] as const);
  const answer = roundTo(vega * Math.abs(basis), 2);

  return {
    kind: 'numeric',
    id: `basis-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'vol-basis-pnl',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: `You are hedged with the onshore contract at ${onshore}% vol, but your option is marked to offshore vol at ${offshore}%. Your vega is ${vega.toLocaleString('en-US')} per vol point. How much PnL does the basis cost you, in dollars to 2 decimal places?`,
    context: 'The basis is the vol difference between the two venues for the same underlying, such as A50 on SGX versus CSI 300 onshore.',
    explain: `The basis is ${basis} vol points. Cost = vega x |basis| = ${vega.toLocaleString('en-US')} x ${Math.abs(basis)} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. The basis is a first-order risk because you hedge in one venue and mark in another.`,
    anchor: 'A cross-market vol basis is a persistent, quotable cost. Budget for it rather than treating it as noise.',
    citation: 'README section 4.2, Basis and cross-market vol.',
    signature: 'vol|basis-pnl',
    answer,
    decimals: 2,
    tolerance: 0,
    unit: 'USD',
  };
}

export const vegaGenerators: Generator[] = [
  {
    id: 'vega-pnl',
    category: 'math',
    subgroup: 'vol',
    tier: 1,
    about: 'Vega PnL from vega quoted per vol point.',
    generate: vegaPnl,
  },
  {
    id: 'price-move-to-vol',
    category: 'math',
    subgroup: 'vol',
    tier: 2,
    about: 'Express a percentage price move in vol points.',
    generate: priceMoveToVolPoints,
  },
  {
    id: 'delta-strike',
    category: 'math',
    subgroup: 'vol',
    tier: 3,
    about: 'Approximate the strike for a given delta.',
    generate: deltaStrike,
  },
  {
    id: 'breakeven-vol',
    category: 'math',
    subgroup: 'vol',
    tier: 4,
    about: 'Annualised breakeven vol from gamma and theta.',
    generate: breakevenVol,
  },
  {
    id: 'forward-vol',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 3,
    about: 'Forward vol between two tenors from spot vols.',
    generate: forwardVol,
  },
  {
    id: 'vol-basis-pnl',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 4,
    about: 'Cost of a cross-market vol basis, such as A50 versus CSI 300.',
    generate: volBasis,
  },
];
