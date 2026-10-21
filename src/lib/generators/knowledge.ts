/**
 * Asia market knowledge (Manual, Markets and microstructure).
 *
 * Calendars, index construction, access channels and central banks — the
 * non-derivative market layer. Facts here are statements about market convention
 * rather than live data, so they do not go stale in the way a rate does.
 *
 * This file was split out of a mixed `knowledge` category during the move to the
 * three-group taxonomy. The volatility-surface content that used to sit
 * alongside it is derivatives material and now lives in `vol-surface.ts`.
 */
import { roundTo } from '../money';
import type { ChoiceOption, ChoiceQuestion, Generator, NumericQuestion, Rng } from '../types';

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
  return {
    kind: 'choice',
    id: `${generatorId}-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId,
    category: 'markets',
    subgroup: 'market-knowledge',
    prompt,
    context,
    explain,
    anchor,
    citation,
    signature,
    options: rng.shuffle([
      { id: 'right', label: correct },
      ...wrong.map((w, i) => ({ id: `w${i}`, label: w })),
    ]),
    answerId: 'right',
  };
}

function calendar(rng: Rng): ChoiceQuestion {
  const events = [
    {
      id: 'golden-week',
      market: 'Japan',
      when: 'late April',
      correct: 'Golden Week, late April to early May',
      wrong: ['Lunar New Year', 'Obon in mid-August', 'Australia Day'],
      explain:
        'Golden Week runs from late April into early May and is Japan\'s longest holiday cluster. It coincides with the April dividend season, which makes it a dense period for dividend-sensitive structures.',
    },
    {
      id: 'lunar-new-year',
      market: 'Hong Kong and Singapore',
      when: 'early February',
      correct: 'Lunar New Year',
      wrong: ['Golden Week', 'Obon', 'Deepavali'],
      explain:
        'Lunar New Year moves with the lunar calendar, falling between late January and mid-February. Hong Kong, Singapore and Taiwan close for several days, and the exact dates change every year, so the trading calendar has to be looked up rather than assumed.',
    },
    {
      id: 'obon',
      market: 'Japan',
      when: 'mid-August',
      correct: 'Obon in mid-August',
      wrong: ['Golden Week', 'Lunar New Year', 'Australia Day'],
      explain:
        'Obon is a mid-August holiday period in Japan. Volume thins noticeably, which matters for anything that has to be hedged through it.',
    },
    {
      id: 'australia-day',
      market: 'Australia',
      when: '26 January',
      correct: 'Australia Day, 26 January',
      wrong: ['Obon', 'Golden Week', 'Lunar New Year'],
      explain:
        'Australia Day is a fixed-date public holiday on 26 January, so the ASX closure is known years in advance. That is the opposite of the lunar holidays elsewhere in the region, which move every year. Note also that the ASX session shifts in SGT terms when daylight saving changes.',
    },
    {
      id: 'deepavali',
      market: 'Singapore',
      when: 'late October',
      correct: 'Deepavali',
      wrong: ['Obon', 'Golden Week', 'Mid-Autumn Festival'],
      explain:
        'Deepavali is a Singapore public holiday set by the Hindu calendar, so it moves each year within roughly October to November. Singapore\'s holiday list mixes lunar, Islamic and Hindu dates, which is why the SGX calendar cannot be derived from the lunar calendar alone.',
    },
    {
      id: 'mid-autumn',
      market: 'Hong Kong',
      when: 'late September',
      correct: 'The day after Mid-Autumn Festival',
      wrong: ['Golden Week', 'Obon', 'Deepavali'],
      explain:
        'Hong Kong closes on the day following Mid-Autumn Festival, which moves with the lunar calendar into September or October. Note the convention: the public holiday is the day after, not the festival day itself.',
    },
    {
      id: 'new-year',
      market: 'Japan, Hong Kong and Singapore',
      when: '1 January',
      correct: 'New Year, 1 January, with Japanese markets also closed 2-3 January',
      wrong: ['Golden Week', 'Lunar New Year', 'Obon'],
      explain:
        'All three close on 1 January, but Japan\'s exchange holiday runs longer: the Tokyo market is shut for the first three business days of January. A structure with early-January observations therefore has far fewer valid dates in Japan than in Hong Kong or Singapore.',
    },
    {
      id: 'qingming',
      market: 'Hong Kong',
      when: 'early April',
      correct: 'Ching Ming, early April',
      wrong: ['Deepavali', 'Obon', 'Golden Week'],
      explain:
        'Ching Ming falls in early April on the solar calendar, so unlike the lunar new year it is close to a fixed date. It sits near the Japanese dividend season, which means early April is thin in two markets at once.',
    },
  ] as const;

  const item = rng.pick(events);
  return build(
    rng,
    'calendar-event',
    `knowledge|calendar-${item.id}`,
    `Which holiday period closes the ${item.market} market around ${item.when}?`,
    'The Asian trading calendar is not a single calendar: some holidays are lunar and move every year.',
    item.explain,
    'Lunar-calendar holidays move every year, so check the calendar rather than assuming the date. Solar fixed holidays are the exception.',
    'Manual, Markets and microstructure, the trading calendar',
    item.correct,
    item.wrong,
  );
}function accessChannel(rng: Rng): ChoiceQuestion {
  const cases = [
    {
      id: 'northbound',
      prompt: 'A foreign institutional investor wants to buy a Shanghai-listed A-share. Which channel do they typically use?',
      correct: 'Stock Connect (northbound)',
      wrong: ['Stock Connect (southbound)', 'QFII only, since Stock Connect closed', 'They cannot: A-shares are closed to foreign investors'],
      explain:
        'Stock Connect northbound lets offshore investors buy mainland-listed shares through Hong Kong. Southbound is the mirror: mainland investors buying Hong Kong-listed shares. QFII remains a separate, licence-based channel, typically used for larger or more complex mandates.',
      anchor: 'Northbound equals offshore buying onshore. Southbound equals mainland money buying Hong Kong.',
    },
    {
      id: 'southbound',
      prompt: 'Mainland Chinese investors buying Hong Kong-listed shares is known as what?',
      correct: 'Stock Connect (southbound)',
      wrong: ['Stock Connect (northbound)', 'The ADR route', 'QFII'],
      explain:
        'Southbound flow is mainland money buying Hong Kong shares, and it has materially changed the character of the Hong Kong market: turnover is momentum-driven and China-linked. This is a large part of why HKEX is deep but China-linked rather than broad.',
      anchor: 'Southbound flow is why Hong Kong is deep but China-linked, not a broad local market.',
    },
    {
      id: 'h-a',
      prompt: 'A company has both an H-share listing in Hong Kong and an A-share listing onshore. What is the usual relationship?',
      correct: 'They normally trade at different prices, and the spread is a persistent basis',
      wrong: ['They are fungible and trade at the same price', 'The H-share is always at a premium', 'The A-share is always at a premium'],
      explain:
        'The two listings are not fungible: different investor bases, capital controls and settlement. They normally trade at a persistent spread, and the direction of that spread has moved over time rather than being a fixed rule. Anything that fixes on one and hedges the other owns that basis.',
      anchor: 'H and A shares are not fungible. Never assume parity, and check which one your fixing references.',
    },
    {
      id: 'cnh-cny',
      prompt: 'What distinguishes CNH from CNY?',
      correct: 'CNH is the offshore renminbi and trades freely; CNY is onshore and managed within a band',
      wrong: ['CNH is the onshore rate and CNY the offshore one', 'They are the same rate at all times', 'CNH is a futures contract, CNY is spot'],
      explain:
        'CNH is offshore renminbi, traded in Hong Kong and elsewhere without capital controls. CNY is onshore and managed by the PBoC within a band. The two normally trade at a persistent spread, and Asia flow often prices the offshore leg first because it is freely tradeable.',
      anchor: 'CNH trades freely, CNY is managed. A structure fixing on one and hedging the other owns the onshore-offshore spread.',
    },
    {
      id: 'northbound-quota',
      prompt: 'A structure references a mainland index but the desk hedges with an offshore futures contract. What risk does the access structure create?',
      correct: 'A basis between the onshore index and the offshore futures, plus the FX leg',
      wrong: ['No risk, because the underlyings are identical', 'Only counterparty risk on the futures exchange', 'Only dividend risk'],
      explain:
        'Access rules decide who can hold what, and therefore what can be arbitraged. Hedging an onshore index with an offshore future leaves the index basis and the CNH/CNY spread, and neither is visible in a single-venue model. The same logic applies to the H-share and A-share pair.',
      anchor: 'If the fixing venue and the hedge venue differ, you own the basis between them. Read the access route before pricing.',
    },
    {
      id: 'gift-nifty',
      prompt: 'A client wants Nifty exposure while the Indian market is shut. Which route is available?',
      correct: 'The offshore Nifty contract listed on SGX (GIFT Nifty)',
      wrong: ['The onshore NSE contract, which trades around the clock', 'Stock Connect northbound', 'There is no offshore route'],
      explain:
        'The GIFT Nifty contract is listed offshore and trades outside Indian hours, which is what makes it the practical India hedge for a Singapore desk. It carries a basis to the onshore NSE contract, and that basis is a first-order risk for anything fixing onshore and hedging offshore.',
      anchor: 'Japan and India have offshore listings; onshore China does not. Offshore access is what makes a hedge tradeable outside home hours.',
    },
    {
      id: 'connect-settlement',
      prompt: 'A northbound Stock Connect trade settles. What is the practical consequence for the hedge?',
      correct: 'The onshore leg settles on the mainland calendar, so holidays can leave the hedge unpaired',
      wrong: ['It settles on the Hong Kong calendar, identical to any HK trade', 'Settlement is T+0, so there is no lag', 'Northbound trades do not settle at all until sold'],
      explain:
        'Northbound trades settle on the mainland calendar, which differs from Hong Kong\'s. Around Lunar New Year and other mainland holidays the two legs can settle on different days, leaving the hedge unpaired and exposing the desk to a funding gap as well as a price gap.',
      anchor: 'Two calendars means two settlement dates. Check the mainland holiday list before relying on the hedge settling flat.',
    },
    {
      id: 'qfii-relevance',
      prompt: 'When is the QFII route still preferable to Stock Connect?',
      correct: 'For larger or more complex mandates that need access beyond the Connect universe',
      wrong: ['Never: Stock Connect replaced QFII entirely', 'Only for retail investors', 'Only for Hong Kong-domiciled funds'],
      explain:
        'QFII is a licence-based route that reaches a wider set of onshore instruments than Stock Connect, so it remains in use for larger or more complex mandates. For a plain cash-equity hedge, Connect is usually simpler, which is why the two coexist rather than one replacing the other.',
      anchor: 'Connect for simple onshore equity access; QFII for broader or more complex onshore mandates.',
    },
  ] as const;

  const item = rng.pick(cases);
  return build(
    rng,
    'access-channel',
    `knowledge|access-${item.id}`,
    item.prompt,
    'Access and flows determine who can hold what, and therefore what can be arbitraged.',
    item.explain,
    item.anchor,
    'Manual, Markets and microstructure, access and flows',
    item.correct,
    item.wrong,
  );
}

function centralBank(rng: Rng): ChoiceQuestion {
  const cases = [
    {
      id: 'mas',
      prompt: 'What is the MAS policy instrument in Singapore?',
      correct: 'The S$NEER, a trade-weighted exchange-rate band',
      wrong: ['A policy interest rate', 'Reserve requirements only', 'Direct credit controls'],
      explain:
        'MAS targets the Singapore dollar nominal effective exchange rate, a trade-weighted band, rather than an interest rate. That makes SGD uniquely a policy-driven currency, and means SGD rates are largely imported from the US rather than set locally.',
      anchor: 'MAS manages the currency, not the interest rate. SGD rates follow the US, and the SGD forward points follow the rate differential.',
    },
    {
      id: 'pbc',
      prompt: 'Which of these is a PBoC policy rate?',
      correct: 'The 7-day reverse repo rate, alongside the MLF and the LPR',
      wrong: ['The federal funds rate', 'The S$NEER', 'The overnight indexed swap'],
      explain:
        'The PBoC operates through a set of administered rates: the 7-day reverse repo as the main short-term rate, the MLF as a medium-term lending facility, and the LPR as the loan prime rate which is the lending benchmark. There is no single policy rate in the way there is in the US.',
      anchor: 'The PBoC has a set of administered rates rather than one policy rate. The 7-day reverse repo is the main short-term one.',
    },
    {
      id: 'boj',
      prompt: 'What is the BOJ\'s policy rate?',
      correct: 'The overnight call rate, targeted directly',
      wrong: ['The 10-year JGB yield', 'The S$NEER band', 'The LPR'],
      explain:
        'The BOJ targets a short-term overnight call rate rather than a long yield, having exited yield-curve control. The distinction matters for forward points: a policy change moves the front end of the JPY curve first, so USD/JPY forward points reprice before the long end does.',
      anchor: 'The BOJ targets the overnight call rate. JPY forward points respond to the front end, not to the 10-year yield.',
    },
    {
      id: 'rba',
      prompt: 'What is the RBA\'s policy instrument?',
      correct: 'The cash rate target',
      wrong: ['A trade-weighted currency band', 'The 10-year government bond yield', 'The 7-day reverse repo'],
      explain:
        'The RBA sets a cash rate target and manages liquidity to hold the overnight market at it. AUD is a high-beta currency in risk-off moves, so the cash rate is only part of what drives AUD forward points during stress.',
      anchor: 'RBA is a cash-rate target central bank, like the Fed. Its currency moves with risk appetite as much as with policy.',
    },
    {
      id: 'hkma',
      prompt: 'What constrains HKD interest rates?',
      correct: 'The linked exchange rate system, which forces HKD rates to follow USD rates',
      wrong: ['An independent HKD policy rate set by the HKMA', 'A trade-weighted HKD band', 'A ceiling on HKD deposit rates'],
      explain:
        'The HKD is pegged within a band against the USD. When the spot approaches the weak-side convertibility undertaking, the HKMA drains liquidity and HKD rates spike rather than the peg breaking. That spillover into HIBOR is a real cost for a HKD-funded book.',
      anchor: 'HKD is pegged, so HKD rates follow USD rates — and spike at the weak-side limit rather than devaluing.',
    },
    {
      id: 'fed',
      prompt: 'What is the Fed\'s policy instrument?',
      correct: 'The federal funds target range',
      wrong: ['The 10-year Treasury yield', 'A trade-weighted dollar band', 'Reserve requirements only'],
      explain:
        'The Fed sets a target range for the federal funds rate and manages the effective rate inside it. For an Asian book the practical consequence is that USD funding costs set the floor under the region\'s forward points.',
      anchor: 'The Fed sets a target range, not a single rate. USD funding is the anchor for Asian forward points.',
    },
    {
      id: 'rbi',
      prompt: 'What is the RBI\'s policy rate?',
      correct: 'The repo rate',
      wrong: ['The 10-year G-Sec yield', 'The S$NEER band', 'The 7-day reverse repo'],
      explain:
        'The RBI sets the repo rate as its policy rate and manages liquidity around it. INR is partly managed rather than freely floating, so the onshore and offshore INR rates can diverge, and that divergence shows up in USD/INR forward points.',
      anchor: 'RBI sets the repo rate. INR is a managed float, so onshore and offshore forward points can diverge.',
    },
    {
      id: 'instrument-choice',
      prompt: 'A structure pays a coupon linked to the 3-month SGD rate. Which rate determines the coupon most directly?',
      correct: 'SGD rates, which are largely imported from the USD curve because MAS targets the currency',
      wrong: ['The S$NEER band midpoint', 'The MAS policy rate', 'The 10-year SGS yield'],
      explain:
        'Because MAS manages the exchange rate rather than an interest rate, SGD interest rates are substantially imported: they track the USD curve adjusted for the expected path of the band. A structure referencing a short SGD rate is therefore partly a USD rates position.',
      anchor: 'SGD rates are imported from the USD curve, because MAS targets the currency. A short-SGD-rate coupon is partly a USD rates bet.',
    },
  ] as const;

  const item = rng.pick(cases);
  return build(
    rng,
    'central-bank',
    `knowledge|central-bank-${item.id}`,
    item.prompt,
    'The regional central banks operate in materially different ways, and the difference is testable.',
    item.explain,
    item.anchor,
    'Manual, Markets and microstructure, central banks',
    item.correct,
    item.wrong,
  );
}

function indexMembership(rng: Rng): ChoiceQuestion {
  const cases = [
    {
      id: 'sti-size',
      prompt: 'How many constituents does the Straits Times Index have?',
      correct: '30',
      wrong: ['50', '100', '225'],
      explain:
        'The STI is 30 names, and those 30 are about 65% of market capitalisation and 74% of traded value. The other roughly 570 listed names share the rest.',
      anchor: 'STI is 30 names. Nikkei 225 is 225. TOPIX is broad, covering the whole market rather than a fixed count.',
    },
    {
      id: 'nikkei-construction',
      prompt: 'How is the Nikkei 225 constructed?',
      correct: 'Price-weighted',
      wrong: ['Market-cap weighted', 'Equal-weighted', 'Free-float market-cap weighted'],
      explain:
        'The Nikkei 225 is price-weighted, so a high-priced stock has more influence than a large one. The STI, TOPIX and most MSCI indices are free-float market-cap weighted. The construction matters because it changes which names actually drive the index level.',
      anchor: 'Nikkei 225 is price-weighted. STI, TOPIX and MSCI are free-float cap-weighted. A price-weighted index is moved by high-priced stocks, not big ones.',
    },
    {
      id: 'topix-construction',
      prompt: 'How is TOPIX constructed?',
      correct: 'Free-float market-cap weighted, covering the broad market',
      wrong: ['Price-weighted, like the Nikkei', 'Equal-weighted across 225 names', 'A fixed 30-name index'],
      explain:
        'TOPIX is free-float market-cap weighted and covers the broad market rather than a fixed count. It is the deeper and more representative Japanese benchmark, which is why it carries the more orderly vol surface.',
      anchor: 'TOPIX is the broad Japanese benchmark; the Nikkei is a price-weighted 225. The distinction changes both the vol surface and the hedge.',
    },
    {
      id: 'hsi-construction',
      prompt: 'How is the Hang Seng Index constructed?',
      correct: 'Free-float market-cap weighted, with a capped number of constituents',
      wrong: ['Price-weighted', 'Equal-weighted', 'The 225 largest Hong Kong companies'],
      explain:
        'The HSI is free-float market-cap weighted with a capped and expanding constituent count. It is heavily weighted toward the China large-cap complex, which is why HSI-linked structures are effectively China exposure rather than Hong Kong local exposure.',
      anchor: 'HSI is free-float cap-weighted and China-heavy. Hedging the HSI is not the same as hedging Hong Kong local names.',
    },
    {
      id: 'a50-construction',
      prompt: 'What does the FTSE China A50 index track?',
      correct: 'The 50 largest A-share companies by market cap, as an offshore-tradeable proxy',
      wrong: ['All Shanghai-listed shares equally weighted', '50 Hong Kong-listed H-shares', 'The 50 largest Chinese companies globally'],
      explain:
        'The A50 tracks the 50 largest A-share names and is the standard offshore China proxy, precisely because the onshore CSI 300 is not accessible to most offshore participants. Its constituents are heavy in financials and consumer staples, so it is not a neutral proxy for the whole A-share market.',
      anchor: 'A50 is 50 large A-shares, offshore-tradeable. It is a proxy, not the whole market, and its sector mix is concentrated.',
    },
    {
      id: 'sti-construction',
      prompt: 'How are STI constituents selected?',
      correct: 'The largest free-float market-cap names, reviewed quarterly, subject to a liquidity screen',
      wrong: ['The 30 most actively traded names, rebalanced monthly', 'Every SGX-listed company above S$1bn', 'A fixed list set once at launch'],
      explain:
        'The STI is drawn from the largest free-float capitalisation names that pass a liquidity screen, reviewed quarterly. Membership therefore changes with both price performance and turnover, which is why an old index list goes stale.',
      anchor: 'STI membership is reviewed quarterly and screened for liquidity. An old constituent list is a stale list.',
    },
    {
      id: 'msci-construction',
      prompt: 'What is distinctive about MSCI index construction relative to a domestic benchmark?',
      correct: 'Free-float adjusted, with foreign ownership limits and investability screens applied',
      wrong: ['It is always equal-weighted', 'It uses total market cap with no adjustments', 'It only includes domestic-listed shares'],
      explain:
        'MSCI applies free-float adjustment, foreign ownership limits and investability screens, so its weights differ from a domestic benchmark on the same market. That is why an MSCI-linked structure and a domestic-index-linked structure on the same country are not the same exposure.',
      anchor: 'MSCI adjusts for free float and investability. An MSCI hedge and a domestic-index hedge are different exposures on the same country.',
    },
    {
      id: 'gift-nifty-construction',
      prompt: 'A client wants "Indian equity" exposure. Why does the choice between the Nifty 50 and a broader Indian index matter for the hedge?',
      correct: 'They are different universes, so the hedge instrument and hedge ratio are not interchangeable',
      wrong: ['They are identical because both are Indian', 'The Nifty 50 is a currency, not an index', 'Only one has listed futures, so the choice is irrelevant'],
      explain:
        'The Nifty 50 and a broader Indian index cover different sets of companies with different liquidity. The offshore Nifty contract hedges the 50, not the broad market, so a structure on a different index carries a basis against the hedge as well as the usual index basis.',
      anchor: 'Name the index, not the country. Two indices on one market can have different constituents, liquidity and hedgeability.',
    },
    {
      id: 'price-vs-total-return',
      prompt: 'A total-return swap references an index. What has to be specified beyond the index name?',
      correct: 'Whether it is a price index or a total-return index, and therefore how dividends are treated',
      wrong: ['Nothing: all indices are total-return by default', 'Only the currency of the notional', 'Only the rebalance frequency'],
      explain:
        'A price index excludes dividends and a total-return index includes them. For a TRS the dividend leg is a separate cash flow, so the choice changes both the mark and the hedge. Getting it wrong produces a PnL that cannot be explained by index performance alone.',
      anchor: 'Price index or total return? For a TRS the dividend leg is a separate cash flow, so the answer changes the mark.',
    },
  ] as const;

  const item = rng.pick(cases);
  return build(
    rng,
    'index-construction',
    `knowledge|index-construction-${item.id}`,
    item.prompt,
    'Index construction determines what actually moves the index, which in turn determines the hedge.',
    item.explain,
    item.anchor,
    'Manual, Markets and microstructure, index construction',
    item.correct,
    item.wrong,
  );
}

/**
 * Rate differential and policy arithmetic.
 *
 * Market knowledge is mostly recall, but one part is genuinely a number: the
 * interest-rate differential that drives forward points, and the index weight
 * that decides how much of a name a basket actually holds. Both are the
 * arithmetic bridge from a market fact to a pricing consequence.
 */
function rateDifferential(rng: Rng): NumericQuestion {
  const pairs = [
    { pair: 'USD/JPY', base: 'JPY', quote: 'USD' },
    { pair: 'USD/SGD', base: 'SGD', quote: 'USD' },
    { pair: 'USD/CNH', base: 'CNH', quote: 'USD' },
    { pair: 'USD/AUD', base: 'AUD', quote: 'USD' },
    { pair: 'USD/HKD', base: 'HKD', quote: 'USD' },
  ] as const;

  const spec = rng.pick(pairs);
  const quoteRate = rng.pick([3.5, 3.75, 4, 4.25, 4.5] as const);
  const baseRate = rng.pick([0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3.5] as const).toString();

  // The differential is quote minus base. A positive differential means the
  // quote currency yields more, so it trades at a forward discount.
  const baseRateNum = Number(baseRate);
  const answer = roundTo(quoteRate - baseRateNum, 2);

  return {
    kind: 'numeric',
    id: `kn-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'rate-differential',
    category: 'markets',
    subgroup: 'market-knowledge',
    prompt: `The ${spec.quote} one-year rate is ${quoteRate}% and the ${spec.base} one-year rate is ${baseRateNum}%. What is the one-year interest-rate differential, in percentage points to 2 decimal places, defined as ${spec.quote} minus ${spec.base}?`,
    context: 'The differential, not either rate alone, drives the forward points and therefore the cost of rolling a hedge.',
    explain: `${quoteRate}% − ${baseRateNum}% = ${answer.toFixed(2)}pp. ${answer > 0 ? `A positive differential means ${spec.quote} yields more, so ${spec.quote} trades at a forward discount against ${spec.base} and the points are negative for a ${spec.quote} buyer.` : answer < 0 ? `A negative differential means ${spec.base} yields more, so ${spec.base} trades at a forward discount against ${spec.quote}.` : 'A zero differential means spot and forward are the same, before any basis.'}`,
    anchor: 'Forward points follow the differential, not either leg. The higher-yielding currency trades at a forward discount.',
    citation: 'Manual, Markets and microstructure, central banks; Manual, Math and units, forward points',
    signature: `markets|rate-differential-${spec.base}-${quoteRate}-${baseRateNum}`,
    answer,
    decimals: 2,
    tolerance: 0.01,
    unit: 'pp',
  };
}

export const knowledgeGenerators: Generator[] = [
  {
    id: 'calendar-event',
    category: 'markets',
    subgroup: 'market-knowledge',
    about: 'Which holiday periods close which Asian markets.',
    generate: calendar,
  },
  {
    id: 'access-channel',
    category: 'markets',
    subgroup: 'market-knowledge',
    about: 'Stock Connect, QFII and the H/A share relationship.',
    generate: accessChannel,
  },
  {
    id: 'central-bank',
    category: 'markets',
    subgroup: 'market-knowledge',
    about: 'How the regional central banks differ.',
    generate: centralBank,
  },
  {
    id: 'index-construction',
    category: 'markets',
    subgroup: 'market-knowledge',
    about: 'Index construction and membership.',
    generate: indexMembership,
  },
  {
    id: 'rate-differential',
    category: 'markets',
    subgroup: 'market-knowledge',
    about: 'The rate differential behind forward points, in percentage points.',
    generate: rateDifferential,
  },
];

// Re-exported under the old name so registry.ts keeps working; both names point
// at the same list of market-knowledge generators.
export { knowledgeGenerators as marketKnowledgeGenerators };
