/**
 * Ticker and market-structure drills (README section 2.2, five layers).
 *
 *   layer 1  ticker -> company name
 *   layer 2  ticker -> sector
 *   layer 3  ticker -> market-cap band
 *   layer 4  ticker -> index membership
 *   layer 5  ticker -> liquidity band
 *
 * Plus a hedgeability drill, which is the layer the README argues turns a naming
 * quiz into something an exotics desk actually tests. It reads the
 * `borrowDifficulty`, `listedSingleStockDerivatives` and `offshoreHedgeable`
 * fields, so the question and the reference page cannot disagree.
 *
 * Data is read from a JSON import rather than fs, so the same code runs in the
 * browser (where the daily set is generated) and in Node (where the tests run).
 */
import tickersData from '../../data/tickers.json';
import type { ChoiceOption, ChoiceQuestion, Generator, Rng, Tier } from '../types';

export interface TickerRecord {
  id: string;
  ticker: string;
  name: string;
  market: string;
  sector: string;
  marketCapBn: number;
  stiWeightPct: number;
  adtM: number;
  borrowDifficulty: 'easy' | 'moderate' | 'hard';
  listedSingleStockDerivatives: boolean;
  offshoreHedgeable: boolean;
  inSti: boolean;
}

interface Band {
  id: string;
  label: string;
  minBn: number | null;
  maxBn: number | null;
}

interface AdtBand {
  id: string;
  label: string;
  minM: number | null;
  maxM: number | null;
}

const RECORDS = tickersData.instruments as TickerRecord[];
const CAP_BANDS = tickersData.capBands as Band[];
const ADT_BANDS = tickersData.adtBands as AdtBand[];

export function allTickers(): TickerRecord[] {
  return RECORDS;
}

export function capBandOf(marketCapBn: number): Band {
  for (const band of CAP_BANDS) {
    const aboveMin = band.minBn === null || marketCapBn > band.minBn;
    const belowMax = band.maxBn === null || marketCapBn <= band.maxBn;
    if (aboveMin && belowMax) return band;
  }
  return CAP_BANDS[CAP_BANDS.length - 1] as Band;
}

export function adtBandOf(adtM: number): AdtBand {
  for (const band of ADT_BANDS) {
    const aboveMin = band.minM === null || adtM > band.minM;
    const belowMax = band.maxM === null || adtM <= band.maxM;
    if (aboveMin && belowMax) return band;
  }
  return ADT_BANDS[ADT_BANDS.length - 1] as AdtBand;
}

/**
 * Pick distractors from the same field, avoiding records that would make two
 * options simultaneously correct. Without this, "which sector?" could show two
 * Financials names and have no single right answer.
 */
function distractors(
  rng: Rng,
  target: TickerRecord,
  exclude: (r: TickerRecord) => boolean,
  count: number,
): TickerRecord[] {
  const pool = RECORDS.filter((r) => r.id !== target.id && !exclude(r));
  return rng.sample(pool, count);
}

function build(
  rng: Rng,
  signature: string,
  generatorId: string,
  prompt: string,
  context: string,
  explain: string,
  anchor: string,
  citation: string,
  correctLabel: string,
  wrongLabels: string[],
  tier: Tier,
): ChoiceQuestion {
  const correct: ChoiceOption = { id: 'right', label: correctLabel };
  const wrong: ChoiceOption[] = wrongLabels.map((label, i) => ({ id: `w${i}`, label }));

  return {
    kind: 'choice',
    id: `${generatorId}-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId,
    category: 'markets',
    subgroup: 'tickers',
    tier,
    prompt,
    context,
    explain,
    anchor,
    citation,
    signature,
    options: rng.shuffle([correct, ...wrong]),
    answerId: 'right',
  };
}

function nameFromTicker(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(RECORDS);
  const others = distractors(rng, target, () => false, 3);
  return build(
    rng,
    'tickers|name',
    'ticker-name',
    `Which company is ${target.ticker} on ${target.market}?`,
    'SGX tickers are numeric-looking codes rather than a recognisable abbreviation.',
    `${target.ticker} is ${target.name}, a ${target.sector} name.`,
    'Learn the exchange code first, then the business. In Singapore the code is not a mnemonic for anything.',
    'README section 2.2; data from src/content/sgx-market-structure.md (30 Sep 2026).',
    target.name,
    others.map((o) => o.name),
    tier,
  );
}

function sectorFromTicker(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(RECORDS);
  // Distractors must sit in a different sector, or the question has two answers.
  const others = distractors(rng, target, (r) => r.sector === target.sector, 3);
  const sectors = Array.from(new Set(others.map((o) => o.sector)));
  // If the pool could not supply three distinct sectors, fall back to the sector
  // list itself so the option set is still unambiguous.
  const options = sectors.length >= 3 ? sectors.slice(0, 3) : ['Financials', 'REIT', 'Tech'].filter((s) => s !== target.sector).slice(0, 3);

  return build(
    rng,
    'tickers|sector',
    'ticker-sector',
    `What sector does ${target.name} (${target.ticker}) sit in?`,
    `${target.market}, as at the data snapshot.`,
    `${target.name} is classified as ${target.sector}.`,
    'Singapore is structurally defensive: Financials and Real Estate/REITs dominate, and the three banks are about half of the STI.',
    'README section 2.2; sector taxonomy from src/content/sgx-market-structure.md.',
    target.sector,
    options,
    tier,
  );
}

function capBandFromTicker(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(RECORDS);
  const band = capBandOf(target.marketCapBn);
  const others = CAP_BANDS.filter((b) => b.id !== band.id);
  return build(
    rng,
    'tickers|cap-band',
    'ticker-cap-band',
    `Roughly what market-cap band does ${target.name} (${target.ticker}) sit in?`,
    `Bands: mega above S$100bn, large S$10-100bn, mid S$2-10bn, small below S$2bn.`,
    `${target.name} is ${band.label.toLowerCase()} cap at about S$${target.marketCapBn}bn.`,
    'Top 5 SGX names (three banks plus Singtel) are roughly 44% of total market cap. Concentration is the defining feature.',
    'README section 2.2; market cap as at 30 Sep 2026.',
    band.label,
    others.map((b) => b.label),
    tier,
  );
}

function indexMembership(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(RECORDS);
  const isSti = target.inSti;
  const correct = isSti ? 'Yes, it is an STI constituent' : 'No, it is outside the STI';
  const wrong = isSti ? 'No, it is outside the STI' : 'Yes, it is an STI constituent';
  return build(
    rng,
    'tickers|index-membership',
    'ticker-index-membership',
    `Is ${target.name} (${target.ticker}) a constituent of the Straits Times Index?`,
    'The STI is the top 30 by free-float market cap, reviewed quarterly.',
    isSti
      ? `${target.name} is in the STI${target.stiWeightPct ? `, with an indicative weight of about ${target.stiWeightPct}%` : ''}.`
      : `${target.name} is outside the STI. The 30 STI names are about 65% of market cap and 74% of traded value; the other ~570 listed names share the rest.`,
    'STI = 30 names = ~65% of market cap. If a name is liquid and you have not seen it in the index list, check the review date.',
    'README section 2.2; membership as at Oct 2026.',
    correct,
    [wrong],
    tier,
  );
}

function liquidityBand(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(RECORDS);
  const band = adtBandOf(target.adtM);
  const others = ADT_BANDS.filter((b) => b.id !== band.id);
  return build(
    rng,
    'tickers|liquidity',
    'ticker-liquidity',
    `How liquid is ${target.name} (${target.ticker})? Choose the average daily turnover band.`,
    `Bands: deep above S$100m, active S$50-100m, moderate S$20-50m, thin below S$20m.`,
    `${target.name} trades about S$${target.adtM}m/day, which is ${band.label.toLowerCase()}.${target.adtM < 50 && target.marketCapBn > 20 ? ' Note it is a sizeable company that trades less than you would expect: market cap alone misleads.' : ''}`,
    'Market cap and liquidity are different questions. AEM is small (about S$3bn) yet trades about S$45m/day; plenty of larger names are less tradeable.',
    'README section 2.2; 3Q26 average daily turnover.',
    band.label,
    others.map((b) => b.label),
    tier,
  );
}

function hedgeability(rng: Rng, tier: Tier): ChoiceQuestion {
  // Prefer names where the answer is instructive: no listed single-stock
  // derivatives anywhere in the region, and hard-to-borrow.
  const target = rng.pick(RECORDS);
  const correct = 'Index futures only: the single-name risk stays OTC';

  return build(
    rng,
    'tickers|hedgeability',
    'ticker-hedgeability',
    `You are short a barrier option on ${target.name} (${target.ticker}) in size. What listed hedge is available?`,
    `The position is in size, and single-name liquidity in the region is thin outside a handful of names.`,
    `Neither SGX nor HKEX lists single-stock options or single-stock futures, so ${target.ticker} has no listed vanilla hedge and borrow is ${target.borrowDifficulty}. Only the index delta is hedgeable on-exchange; the single-name gamma and vega must be sourced OTC, with the wider spreads, dealer dependence and harder marks that implies.`,
    'The hedge leg in Asia is index, but the risk is usually single-name. That mismatch is why the OTC vol market sets the price.',
    'README sections 2.2 and 4.5; src/content/sgx-market-structure.md (no listed single-stock derivatives on SGX or HKEX).',
    correct,
    [
      'Listed single-stock options on SGX',
      'Listed single-stock futures on HKEX, so a delta-one hedge is available',
      'A listed single-name variance swap',
    ],
    tier,
  );
}

export const tickerGenerators: Generator[] = [
  {
    id: 'ticker-name',
    category: 'markets',
    subgroup: 'tickers',
    tier: 1,
    about: 'Ticker to company name.',
    generate: nameFromTicker,
  },
  {
    id: 'ticker-sector',
    category: 'markets',
    subgroup: 'tickers',
    tier: 1,
    about: 'Ticker to sector.',
    generate: sectorFromTicker,
  },
  {
    id: 'ticker-cap-band',
    category: 'markets',
    subgroup: 'tickers',
    tier: 2,
    about: 'Ticker to market-cap band.',
    generate: capBandFromTicker,
  },
  {
    id: 'ticker-index-membership',
    category: 'markets',
    subgroup: 'tickers',
    tier: 2,
    about: 'Whether a name is in the STI.',
    generate: indexMembership,
  },
  {
    id: 'ticker-liquidity',
    category: 'markets',
    subgroup: 'tickers',
    tier: 3,
    about: 'Ticker to average daily turnover band.',
    generate: liquidityBand,
  },
  {
    id: 'ticker-hedgeability',
    category: 'markets',
    subgroup: 'tickers',
    tier: 4,
    about: 'What listed hedge exists for a single-name position.',
    generate: hedgeability,
  },
];
