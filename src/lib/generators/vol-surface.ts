/**
 * Volatility surface and skew drill (README section 3.2.2).
 *
 * Moved here from the old `knowledge` category when the taxonomy collapsed to
 * three groups: skew, term structure and vol basis are derivatives content, not
 * market-structure content. The questions test the *shape* of the surface and
 * the convention it is quoted in — which are stable — rather than a particular
 * level, which is not.
 */
import type { ChoiceOption, ChoiceQuestion, Generator, Rng, Tier } from '../types';

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
      'Front-end vol richness tracks realised vol and flow concentration, not index size. In practice Korea and the smaller, more retail-driven indices frequently carry the richest front-end vol, while the deepest index, TOPIX, is comparatively orderly. The examinable point is that richness is a function of flow and realisation, so it must be observed rather than inferred from index size.',
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
  tier: Tier,
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
    tier,
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

function volSurfaceRecall(rng: Rng, tier: Tier): ChoiceQuestion {
  const item = rng.pick(CASES);
  return build(
    rng,
    'vol-surface-recall',
    `vol-surface|${item.id}`,
    item.prompt,
    "Knowledge of the surface's shape rather than of a particular level: levels move, conventions do not.",
    item.explain,
    item.anchor,
    'README sections 3.2.2 and 3.3.',
    item.correct,
    item.wrong,
    tier,
  );
}

export const volSurfaceGenerators: Generator[] = [
  {
    id: 'vol-surface-recall',
    category: 'derivatives',
    subgroup: 'vol-surface',
    tier: 3,
    about: 'The shape of the Asian vol surface, skew, term structure and cross-market basis.',
    generate: volSurfaceRecall,
  },
];
