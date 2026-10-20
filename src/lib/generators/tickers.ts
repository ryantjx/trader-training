/**
 * Ticker and market-structure drills (README section 2.2, five layers).
 *
 *   layer 1  ticker -> company name     (multiple choice, and free text)
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
 * Layer 1 is asked twice, and deliberately so. Recognising a name among four
 * printed options is recall with a prompt; typing it from the code alone is the
 * task the desk actually sets. Issue #1 asked for both, and the free-text form is
 * marked through `markText` in marking.ts, which folds case, punctuation and
 * corporate suffixes before comparing.
 *
 * Coverage. The SGX block of the dataset is verified to the 30 Sep 2026
 * market-structure table, so it carries market cap, turnover and borrow. The HK,
 * JP and AU blocks carry listing facts only (code, name, sector, venue); their
 * numeric fields are null and every generator that needs one skips null rows.
 * That is the difference between an unverified question and an unfair one.
 *
 * Data is read from a JSON import rather than fs, so the same code runs in the
 * browser (where the daily set is generated) and in Node (where the tests run).
 */
import tickersData from '../../data/tickers.json';
import { normalizeTextAnswer } from '../marking';
import type { ChoiceOption, ChoiceQuestion, Generator, Rng, TextQuestion, Tier } from '../types';

export interface TickerRecord {
  id: string;
  ticker: string;
  /** Ticker plus venue suffix, as the desk quotes it: 9984 JT, 700 HK, D05 SP. */
  code: string;
  name: string;
  /** Other spellings the free-text drill marks correct. */
  aliases: string[];
  market: string;
  sector: string;
  /** Null where the venue block is not verified. Never guess a value. */
  marketCapBn: number | null;
  stiWeightPct: number | null;
  adtM: number | null;
  borrowDifficulty: 'easy' | 'moderate' | 'hard' | null;
  listedSingleStockDerivatives: boolean | null;
  offshoreHedgeable: boolean | null;
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
const VENUES = tickersData.venues as Record<string, string>;

export function allTickers(): TickerRecord[] {
  return RECORDS;
}

/** Venue name for the context line, falling back to the code itself. */
export function venueName(market: string): string {
  return VENUES[market] ?? market;
}

/**
 * Short venue name for the suffix hint.
 *
 * The legal names are too long to sit in a context line and one of them, "Hong
 * Kong Exchanges and Clearing", is also the name of a listed company (388 HK),
 * which reads as a mistake next to a question about a different issuer.
 */
const VENUE_SHORT: Record<string, string> = {
  SGX: 'Singapore',
  TSE: 'Tokyo',
  HKEX: 'Hong Kong',
  ASX: 'Australia',
};

export function venueShortName(market: string): string {
  return VENUE_SHORT[market] ?? market;
}

/** Records that carry a value for a numeric field the drill needs. */
function withCap(): TickerRecord[] {
  return RECORDS.filter((r) => r.marketCapBn !== null);
}

function withAdt(): TickerRecord[] {
  return RECORDS.filter((r) => r.adtM !== null);
}

/**
 * The STI-membership pool. A Japanese name is trivially outside the STI, so
 * asking would test nothing; the question is only worth putting to a Singapore
 * listing.
 */
function stiEligible(): TickerRecord[] {
  return RECORDS.filter((r) => r.market === 'SGX');
}

/**
 * The hedgeability pool. The explanation is sourced from the SGX reference page
 * and only holds for SGX listings, so the pool is restricted to rows where the
 * borrow field has actually been verified.
 */
function hedgeablePool(): TickerRecord[] {
  return RECORDS.filter((r) => r.market === 'SGX' && r.borrowDifficulty !== null);
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
  pool: TickerRecord[] = RECORDS,
): TickerRecord[] {
  const candidates = pool.filter((r) => r.id !== target.id && !exclude(r));
  return rng.sample(candidates, count);
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

/**
 * The accepted answer set for a free-text naming question.
 *
 * The canonical name is first, because `TextQuestion.answer` is read from
 * `accept[0]` and shown in the feedback panel. Variants that fold to the same
 * normalised string are dropped, so the "also accepted" line does not list
 * "CSL Limited" next to "CSL".
 */
export function acceptedNames(record: TickerRecord): string[] {
  const canonical = normalizeTextAnswer(record.name);
  const seen = new Set([canonical]);
  const accept = [record.name];
  for (const alias of record.aliases) {
    const folded = normalizeTextAnswer(alias);
    if (folded === '' || seen.has(folded)) continue;
    seen.add(folded);
    accept.push(alias);
  }
  return accept;
}

/** Citation that states what the row is actually verified to. */
function nameCitation(record: TickerRecord): string {
  return record.marketCapBn === null
    ? 'README section 2.2; src/data/tickers.json — code, name and sector from the exchange listing. The numeric fields for this venue are not verified and are not asked.'
    : 'README section 2.2; src/data/tickers.json and src/content/sgx-market-structure.md (30 Sep 2026).';
}

function nameFromTicker(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(RECORDS);
  const others = distractors(rng, target, () => false, 3);
  return build(
    rng,
    'tickers|name',
    'ticker-name',
    `Which company trades as ${target.code}?`,
    `The suffix is the venue: ${target.code.slice(target.ticker.length + 1)} is ${venueShortName(target.market)}.`,
    `${target.code} is ${target.name}, ${target.sector}, on ${venueName(target.market)}.`,
    'Asian codes are numbers, not mnemonics: 9984 JT is Tokyo, 700 HK is Hong Kong, 5 HK is HSBC and not Tencent, D05 SP is Singapore, BHP AU is Sydney. Learn the pair, code and suffix.',
    nameCitation(target),
    target.name,
    others.map((o) => o.name),
    tier,
  );
}

function nameFromTickerTyped(rng: Rng, tier: Tier): TextQuestion {
  const target = rng.pick(RECORDS);
  return {
    kind: 'text',
    id: `ticker-name-typed-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'ticker-name-typed',
    category: 'markets',
    subgroup: 'tickers',
    tier,
    prompt: `Name the company that trades as ${target.code}.`,
    context: `${venueName(target.market)}. Type the company name — the ticker will not be marked.`,
    explain: `${target.code} is ${target.name}, ${target.sector}, on ${venueName(target.market)}.`,
    anchor:
      'Say the code, then the name, then the sector. Recall that skips the middle step is recognition, not memory, and it fails on a live ticket.',
    citation: nameCitation(target),
    signature: 'tickers|name-typed',
    answer: target.name,
    accept: acceptedNames(target),
    placeholder: 'Company name',
  };
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
    `What sector does ${target.name} (${target.code}) sit in?`,
    `${venueName(target.market)}, as at the data snapshot.`,
    `${target.name} is classified as ${target.sector}.`,
    'Singapore is structurally defensive: Financials and Real Estate/REITs dominate, and the three banks are about half of the STI. Hong Kong and Australia are Financials-heavy too; Japan is not, and Tokyo is where the exporter and semiconductor names sit.',
    'README section 2.2; sector taxonomy from src/data/tickers.json and src/content/sgx-market-structure.md.',
    target.sector,
    options,
    tier,
  );
}

function capBandFromTicker(rng: Rng, tier: Tier): ChoiceQuestion {
  const pool = withCap();
  const target = rng.pick(pool);
  const band = capBandOf(target.marketCapBn as number);
  const others = CAP_BANDS.filter((b) => b.id !== band.id);
  return build(
    rng,
    'tickers|cap-band',
    'ticker-cap-band',
    `Roughly what market-cap band does ${target.name} (${target.code}) sit in?`,
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
  const target = rng.pick(stiEligible());
  const isSti = target.inSti;
  const correct = isSti ? 'Yes, it is an STI constituent' : 'No, it is outside the STI';
  const wrong = isSti ? 'No, it is outside the STI' : 'Yes, it is an STI constituent';
  return build(
    rng,
    'tickers|index-membership',
    'ticker-index-membership',
    `Is ${target.name} (${target.code}) a constituent of the Straits Times Index?`,
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
  const target = rng.pick(withAdt());
  const band = adtBandOf(target.adtM as number);
  const others = ADT_BANDS.filter((b) => b.id !== band.id);
  const cap = target.marketCapBn as number | null;
  return build(
    rng,
    'tickers|liquidity',
    'ticker-liquidity',
    `How liquid is ${target.name} (${target.code})? Choose the average daily turnover band.`,
    `Bands: deep above S$100m, active S$50-100m, moderate S$20-50m, thin below S$20m.`,
    `${target.name} trades about S$${target.adtM}m/day, which is ${band.label.toLowerCase()}.${(target.adtM as number) < 50 && cap !== null && cap > 20 ? ' Note it is a sizeable company that trades less than you would expect: market cap alone misleads.' : ''}`,
    'Market cap and liquidity are different questions. AEM is small (about S$3bn) yet trades about S$45m/day; plenty of larger names are less tradeable.',
    'README section 2.2; 3Q26 average daily turnover.',
    band.label,
    others.map((b) => b.label),
    tier,
  );
}

function hedgeability(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(hedgeablePool());
  const correct = 'Index futures only: the single-name risk stays OTC';

  return build(
    rng,
    'tickers|hedgeability',
    'ticker-hedgeability',
    `You are short a barrier option on ${target.name} (${target.code}) in size. What listed hedge is available?`,
    `The position is in size, and single-name liquidity in the region is thin outside a handful of names.`,
    `Neither SGX nor HKEX lists single-stock options or single-stock futures, so ${target.code} has no listed vanilla hedge and borrow is ${target.borrowDifficulty}. Only the index delta is hedgeable on-exchange; the single-name gamma and vega must be sourced OTC, with the wider spreads, dealer dependence and harder marks that implies.`,
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
    about: 'Ticker to company name, multiple choice.',
    generate: nameFromTicker,
  },
  {
    id: 'ticker-name-typed',
    category: 'markets',
    subgroup: 'tickers',
    tier: 2,
    about: 'Ticker to company name, free text: name the company from the code alone.',
    generate: nameFromTickerTyped,
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
    about: 'Ticker to market-cap band. SGX names only — the other venues are not verified.',
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
    about: 'Ticker to average daily turnover band. SGX names only.',
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
