/**
 * Volatility surface and skew drill (Manual, Markets and microstructure).
 *
 * Moved here from the old `knowledge` category when the taxonomy collapsed to
 * three groups: skew, term structure and vol basis are derivatives content, not
 * market-structure content. The questions test the *shape* of the surface and
 * the convention it is quoted in — which are stable — rather than a particular
 * level, which is not.
 */
import { roundTo } from '../money';
import type { ChoiceOption, ChoiceQuestion, Generator, NumericQuestion, Rng } from '../types';

interface SkewCase {
  id: string;
  prompt: string;
  correct: string;
  wrong: readonly string[];
  explain: string;
  anchor: string;
}

const CASES: readonly SkewCase[] = [
  {
    id: 'index-richness',
    prompt: 'Across the major Asian indices, which is generally richest in front-end implied vol?',
    correct: 'The index with the highest realised volatility and most concentrated retail flow',
    wrong: [
      'The largest index by market capitalisation',
      'The index with the most constituents',
      'The index with the longest trading hours',
    ],
    explain:
      'Front-end vol richness tracks realised vol and flow concentration, not index size. In practice the smaller, more retail-driven indices frequently carry the richest front-end vol, while the deepest index, TOPIX, is comparatively orderly. The examinable point is that richness is a function of flow and realisation, so it must be observed rather than inferred from index size.',
    anchor:
      'Vol richness follows realised vol and flow concentration, not market cap. Look at the surface, do not infer it.',
  },
  {
    id: 'skew-direction',
    prompt: 'What is the usual shape of index skew in Asia?',
    correct: 'Downward-sloping: puts trade at higher implied vol than calls',
    wrong: [
      'Upward-sloping: calls trade higher than puts',
      'Flat: Asian indices have no skew',
      'It changes sign every quarter',
    ],
    explain:
      'Asian index skew is pronounced and downward-sloping: out-of-the-money puts trade at higher implied vol than equivalent calls. This is driven by demand for downside protection and, in several markets, by leveraged retail structures whose dealers are structurally short downside gamma.',
    anchor:
      'Asian index skew slopes down. Puts are richer than calls, and the skew is steeper than in developed Western indices.',
  },
  {
    id: 'term-structure',
    prompt: 'A cliquet marks to which part of the volatility surface?',
    correct: 'Forward vol between future dates, so the back end of the curve drives it',
    wrong: [
      'Spot vol only, like a vanilla option',
      'The front end, because the structure is short-dated',
      'The skew at the money, and nothing else',
    ],
    explain:
      'A cliquet locks in a series of periodic returns, so the relevant input is the forward vol between future observation dates rather than spot vol. That means its PnL is driven by the back end of the curve even though the structure itself is short-dated — which is why a cliquet behaves quite differently from a vanilla option of the same maturity.',
    anchor:
      'Cliquets mark to forward vol, so they are exposed to the back of the curve. Forward vol is the input, not spot vol.',
  },
  {
    id: 'vol-basis',
    prompt: 'You hedge an A50 option with the SGX contract but your client marks against the onshore CSI 300. What risk have you taken?',
    correct: 'A cross-market volatility basis between the two venues',
    wrong: [
      'Pure delta risk, since both are China A-share exposure',
      'No additional risk, as the underlyings are the same',
      'Only FX risk, because SGX prices in USD',
    ],
    explain:
      'The same underlying trading in two venues carries two vol surfaces. Hedging in one venue while marking in another leaves a basis that no single-venue model shows, and it is a first-order risk for an Asian exotic book. The same applies to Nikkei on SGX versus OSE, H-shares versus A-shares, and Nifty on SGX versus NSE.',
    anchor:
      'Cross-market vol basis is a real, persistent, quotable cost. Hedge venue and marking venue must be checked separately.',
  },
  {
    id: 'atm-vs-wing',
    prompt: 'For an Asian index, where is implied vol usually highest across the strike range?',
    correct: 'In the downside wing, below spot',
    wrong: [
      'At the money',
      'In the upside wing, above spot',
      'At the far upside wing only',
    ],
    explain:
      'Downward-sloping skew means the downside wing carries the highest implied vol. That is the opposite of a commodity or a single stock with call-skew, where demand for upside calls can lift the upper wing. Assuming the wrong direction inverts the whole surface and the hedge.',
    anchor: 'Asian index: downside wing is richest. Do not import a call-skew assumption from another asset class.',
  },
  {
    id: 'skew-steepening',
    prompt: 'A risk event approaches and the market buys downside protection. What happens to index skew?',
    correct: 'It steepens: downside puts get richer relative to calls',
    wrong: [
      'It flattens',
      'It inverts, so calls get richer',
      'It is unaffected, because skew is a structural constant',
    ],
    explain:
      'Skew is not constant: it responds to demand. When the market buys downside protection into an event, the downside wing richens and the skew steepens. A barrier book marked on sticky-strike will see its own marks move even if spot does not, because the surface it marks against has changed shape.',
    anchor: 'Skew steepens into risk events as downside demand rises. A static surface assumption fails exactly when it matters.',
  },
  {
    id: 'term-inversion',
    prompt: 'An index has a known event in three weeks and is calm afterwards. What shape is the term structure likely to take?',
    correct: 'Front-end rich relative to the back: an inverted term structure',
    wrong: [
      'Contango: the back end is richer than the front',
      'Flat, because vol is a single number',
      'It depends only on realised vol, not on events',
    ],
    explain:
      'A known event lifts the vol over the period that contains it, so the front end trades rich to the back and the curve inverts. Anything marking to the back of the curve — a cliquet, or a long-dated vega position — will not pick up that premium.',
    anchor: 'Events lift the front end. An inverted curve is information about a dated event, not about long-run vol.',
  },
  {
    id: 'skew-tenor',
    prompt: 'Comparing the same 25-delta put across tenors, where is the skew typically steepest?',
    correct: 'In the front end, where supply and demand are most concentrated',
    wrong: [
      'In the back end, because more can happen over a longer horizon',
      'It is identical across tenors by construction',
      'Only in the wings beyond 10 delta',
    ],
    explain:
      'Front-end skew is usually steeper because hedging demand and event risk concentrate there, and there is less time for the distribution to normalise. The back end is flatter. This is why a short-dated structure is more sensitive to a change in skew than a long-dated one on the same underlying.',
    anchor: 'Skew is steepest in the front. A short-dated structure carries more skew risk than a long-dated one.',
  },
  {
    id: 'sticky-choice-barrier',
    prompt: 'A barrier book is being marked. Which stickiness convention is the right one to use?',
    correct: 'Sticky-local-vol, because a barrier is a fixed spot level',
    wrong: [
      'Sticky-strike, because strikes are fixed',
      'Sticky-delta, because delta is the hedge ratio',
      'None: barriers do not have a vol convention',
    ],
    explain:
      'A barrier is defined by a spot level, so the convention that attaches vol to a spot level is the one that matches the payoff. Marking a barrier book on sticky-strike or sticky-delta mis-specifies what moves when spot moves, and the error grows as spot approaches the barrier.',
    anchor: 'Barrier equals spot level equals sticky-local-vol. Match the convention to the variable the payoff references.',
  },
];

function build(
  rng: Rng,
  generatorId: string,
  signature: string,
  prompt: string,
  context: string,
  explain: string,
  anchor: string,
  citation: string,
  correct: string,
  wrong: readonly string[],
  
): ChoiceQuestion {
  const options: ChoiceOption[] = [
    { id: 'right', label: correct },
    ...wrong.map((w, i) => ({ id: `w${i}`, label: w })),
  ];
  return {
    kind: 'choice',
    id: `${generatorId}-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId,
    category: 'derivatives',
    subgroup: 'vol-surface',
    prompt,
    context,
    explain,
    anchor,
    citation,
    signature,
    options: rng.shuffle(options),
    answerId: 'right',
  };
}

function volSurfaceRecall(rng: Rng): ChoiceQuestion {
  const item = rng.pick(CASES);
  return build(
    rng,
    'vol-surface-recall',
    `vol-surface|${item.id}`,
    item.prompt,
    "Knowledge of the surface's shape rather than of a particular level: levels move, conventions do not.",
    item.explain,
    item.anchor,
    'Manual, Exotic options, the volatility surface',
    item.correct,
    item.wrong,
  );
}

/**
 * Skew in vol points, and its cost in money.
 *
 * The surface is described qualitatively everywhere else. This drills the two
 * numbers that turn the description into a mark: the put-call vol difference at
 * a fixed delta, and what that difference is worth against a given vega.
 */
function skewCost(rng: Rng): NumericQuestion {
  const spot = rng.pick([2_750, 5_800, 8_400, 14_500, 24_000, 39_000] as const);
  const atm = rng.pick([10, 12, 14, 16, 18, 20] as const);
  const putPremium = rng.pick([1.5, 2, 2.5, 3, 3.5, 4, 5] as const);
  const vega = rng.pick([10_000, 25_000, 50_000, 100_000] as const);

  // The 25-delta put trades above ATM by the skew premium; the call below it.
  const putVol = roundTo(atm + putPremium, 2);
  const callVol = roundTo(atm - putPremium, 2);
  const answer = roundTo(vega * putPremium, 2);

  return {
    kind: 'numeric',
    id: `skew-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'skew-cost',
    category: 'derivatives',
    subgroup: 'vol-surface',
    prompt: `An index at ${spot.toLocaleString('en-US')} has ATM vol ${atm}%. The 25-delta put is quoted at ${putVol}% and the 25-delta call at ${callVol}%. You are long 25-delta puts with vega ${vega.toLocaleString('en-US')} per vol point. What is the skew worth to your position, in dollars to 2 decimal places?`,
    context: 'Skew in vol points is the put vol minus ATM. Its value to the position is vega x that difference.',
    explain: `The skew is ${putVol}% − ${atm}% = ${putPremium} vol points in the put wing. Vega x skew = ${vega.toLocaleString('en-US')} x ${putPremium} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. A long-put book is paid for the skew being steep, and loses the same amount if the wing flattens.`,
    anchor: 'Skew is a vol number and a money number. Vega times the wing premium is what the skew is worth.',
    citation: 'Manual, Exotic options, the volatility surface',
    signature: `vol-surface|skew-cost-${putPremium}-${vega}`,
    answer,
    decimals: 2,
    tolerance: 0.01,
    unit: 'USD',
  };
}

export const volSurfaceGenerators: Generator[] = [
  {
    id: 'vol-surface-recall',
    category: 'derivatives',
    subgroup: 'vol-surface',
    about: 'The shape of the Asian vol surface, skew, term structure and cross-market basis.',
    generate: volSurfaceRecall,
  },
  {
    id: 'skew-cost',
    category: 'derivatives',
    subgroup: 'vol-surface',
    about: 'The skew of a wing in vol points, and what it is worth against vega.',
    generate: skewCost,
  },
];
