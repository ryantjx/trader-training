/**
 * Glossary.
 *
 * One typed source for every abbreviation and convention the question text uses.
 * It exists because the drills are dense with shorthand — KO, KI, CAS, SQ, ADT,
 * DvP, GIFT, Rev/Con, S$NEER, MLF, LPR — and a reader who does not already know
 * a term cannot answer the question that uses it, which confuses a knowledge gap
 * with a vocabulary gap.
 *
 * Three consumers:
 *
 *   - the glossary page renders the whole list from this data, so the page cannot
 *     drift from what the quizzes reference;
 *   - quiz pages render a "terms used here" strip from each guide's `terms`;
 *   - inline prose can use the Term component to show the expansion on hover.
 *
 * Definitions are written to be useful to a trader, not exhaustive. Where a term
 * is a convention rather than a definition, the entry states the convention.
 */
export interface GlossaryEntry {
  id: string;
  /** The term as it appears in question text. */
  term: string;
  /** Short expansion, shown in the tooltip. */
  expansion: string;
  /** One or two sentences of definition. */
  definition: string;
  /** Grouping for the glossary page. */
  area: 'Math' | 'Markets' | 'Derivatives' | 'Structures';
}

export const GLOSSARY: readonly GlossaryEntry[] = [
  // Math
  {
    id: 'bp',
    term: 'bp',
    expansion: 'basis point, one hundredth of one percent',
    definition:
      'One basis point is 0.01%, so 10,000bp is 100%. On a desk it is usually applied to a notional (a cost or a fee) or to a price (a move); these are different quantities and the question states which.',
    area: 'Math',
  },
  {
    id: 'notional',
    term: 'notional',
    expansion: 'the face amount a calculation is applied to',
    definition:
      'The reference amount on which a rate or a basis point is charged. Notional is not the same as market value: a swap can have a large notional and a small mark.',
    area: 'Math',
  },
  {
    id: 'delta',
    term: 'delta',
    expansion: 'change in value per unit change in the underlying',
    definition:
      'The first-order sensitivity of an option or book to the underlying. Quoted either as a currency amount per point of the underlying or as the standardised hedge ratio between 0 and 1.',
    area: 'Math',
  },
  {
    id: 'gamma',
    term: 'gamma',
    expansion: 'change in delta per unit change in the underlying',
    definition:
      'The second-order sensitivity, and the reason PnL scales with the square of a move. Usually quoted per 1 percentage point of the underlying, which is where unit errors happen.',
    area: 'Math',
  },
  {
    id: 'vega',
    term: 'vega',
    expansion: 'change in value per vol point',
    definition:
      'Sensitivity to implied volatility. Conventionally quoted per vol point (1%), so a vega of 10,000 loses 10,000 for each point of vol sold.',
    area: 'Math',
  },
  {
    id: 'theta',
    term: 'theta',
    expansion: 'value lost per day from time decay',
    definition:
      'The time-decay term. A long-gamma book pays theta, and the trade is only profitable if realised volatility exceeds the breakeven level implied by that decay.',
    area: 'Math',
  },
  {
    id: 'pp',
    term: 'pp',
    expansion: 'percentage point',
    definition:
      'One percentage point of the underlying, as distinct from 1.00 of spot. A gamma quoted per 1pp is 100 times larger than the same gamma quoted per 1.00, and the drills always state which is meant.',
    area: 'Math',
  },
  {
    id: 'vol-point',
    term: 'vol point',
    expansion: 'one percentage point of implied volatility',
    definition:
      'Vol is quoted in annualised percentage terms, so one vol point is a move from, say, 20% to 21%. Vega is conventionally quoted per vol point.',
    area: 'Math',
  },
  {
    id: 'breakeven-vol',
    term: 'breakeven vol',
    expansion: 'realised vol required to pay for gamma decay',
    definition:
      'The realised volatility at which a long-gamma position exactly covers its theta. Approximately the square root of twice theta divided by gamma, per unit time.',
    area: 'Math',
  },
  {
    id: 'forward-vol',
    term: 'forward vol',
    expansion: 'implied vol between two future dates',
    definition:
      'The volatility the market implies for a future window, derived from two spot vols. It is the correct input for multi-period payoffs such as cliquets, and it is not the same as spot vol.',
    area: 'Math',
  },
  {
    id: 'forward-points',
    term: 'forward points',
    expansion: 'forward rate minus spot, in pips',
    definition:
      'The cost or benefit of settling later rather than now. Positive points mean the base currency trades at a forward premium, which follows from the interest-rate differential.',
    area: 'Math',
  },
  {
    id: 'cip',
    term: 'CIP',
    expansion: 'covered interest parity',
    definition:
      'The no-arbitrage relationship linking spot, forward and the two interest rates. If it is violated for a currency pair, the gap is a funding or capital-control effect rather than free money.',
    area: 'Math',
  },
  {
    id: 'tenor',
    term: 'tenor',
    expansion: 'the maturity of a contract',
    definition:
      'The time to expiry, expressed as 1M, 3M, 6M, 1Y and so on. Forward points and volatilities are quoted against a tenor, not against a date.',
    area: 'Math',
  },
  {
    id: 'pip',
    term: 'pip',
    expansion: 'the smallest conventional FX price increment',
    definition:
      'For most pairs a pip is the fourth decimal place; for yen pairs it is the second. A pip value is the money one pip is worth on a given notional, in the quote currency.',
    area: 'Math',
  },
  {
    id: 'cross-rate',
    term: 'cross rate',
    expansion: 'an FX rate derived from two USD legs',
    definition:
      'A rate between two currencies neither of which is USD, computed from their respective USD quotes. The difficulty is always which leg goes on top.',
    area: 'Math',
  },
  {
    id: 'cnh',
    term: 'CNH',
    expansion: 'offshore renminbi, traded outside mainland China',
    definition:
      'The offshore renminbi, which trades freely in Hong Kong and elsewhere, as distinct from CNY, the onshore rate managed within a band. The two normally trade at a persistent spread.',
    area: 'Math',
  },
  {
    id: 'parity',
    term: 'put-call parity',
    expansion: 'the no-arbitrage link between a call, a put, the stock and carry',
    definition:
      'Call minus put equals stock minus strike, adjusted for the carry of the replicating position. Given four of the five values, the fifth is determined to the penny.',
    area: 'Math',
  },
  {
    id: 'revcon',
    term: 'Rev/Con',
    expansion: 'reversal or conversion carry',
    definition:
      'The financing and dividend term in the parity relationship. Positive for a conversion (long stock, short call, long put), negative for a reversal, which is the mirror position.',
    area: 'Math',
  },
  {
    id: 'conversion',
    term: 'conversion',
    expansion: 'long stock, short call, long put',
    definition:
      'A position that replicates a bond: the payoff is fixed regardless of where the stock ends up, so the trade earns the carry rather than taking a directional view.',
    area: 'Math',
  },
  {
    id: 'reversal',
    term: 'reversal',
    expansion: 'short stock, long call, short put',
    definition:
      'The mirror of a conversion. The carry has the opposite sign, which is why the parity carry term can be either positive or negative.',
    area: 'Math',
  },

  // Markets
  {
    id: 'cas',
    term: 'CAS',
    expansion: 'Closing Auction Session (Hong Kong)',
    definition:
      'The Hong Kong window in which the closing price is determined by auction. Orders cannot be cancelled once it opens, which is what stops the close being influenced in the final seconds.',
    area: 'Markets',
  },
  {
    id: 'tac',
    term: 'TAC',
    expansion: 'Trade at Close (SGX)',
    definition:
      'The SGX window after the closing auction in which trades execute at the fixed closing price. It exists so a large order can be worked at a known price instead of taking auction risk.',
    area: 'Markets',
  },
  {
    id: 'iep',
    term: 'IEP',
    expansion: 'Indicative Equilibrium Price',
    definition:
      'The price SGX publishes during the pre-open phase to indicate where the auction would clear. The auction matching algorithm is the same one that computes it.',
    area: 'Markets',
  },
  {
    id: 'sq',
    term: 'SQ',
    expansion: 'Special Quotation, the Japanese settlement price',
    definition:
      'The settlement price for Japanese derivatives, computed from the opening prices of the index constituents on the second Friday of the contract month. It is why Japanese futures expire mid-month rather than at month end.',
    area: 'Markets',
  },
  {
    id: 'dvp',
    term: 'DvP',
    expansion: 'delivery versus payment',
    definition:
      'Settlement in which the securities and the cash move at the same moment, so neither side carries the other’s credit risk between trade and settlement.',
    area: 'Markets',
  },
  {
    id: 'ccp',
    term: 'CCP',
    expansion: 'central counterparty',
    definition:
      'The clearing house that interposes itself between buyer and seller. A single CCP covering both cash and derivatives, as at JPX, allows cross-margining; split clearing, as at SGX, does not.',
    area: 'Markets',
  },
  {
    id: 'stamp-duty',
    term: 'stamp duty',
    expansion: 'a transaction levy on share trades',
    definition:
      'A per-side tax on stock trades. Hong Kong charges 0.1% per side; SGX and JPX are stamp-duty-free on exchange trades. On a delta-hedging book this is a material recurring cost.',
    area: 'Markets',
  },
  {
    id: 'adt',
    term: 'ADT',
    expansion: 'average daily turnover',
    definition:
      'The average value traded per day. It is the measure that decides whether a name can be hedged at size, and it is not implied by market capitalisation.',
    area: 'Markets',
  },
  {
    id: 'sti',
    term: 'STI',
    expansion: 'Straits Times Index',
    definition:
      'The Singapore benchmark: thirty constituents by free-float market capitalisation, reviewed quarterly. The thirty names account for roughly two thirds of market cap and three quarters of traded value.',
    area: 'Markets',
  },
  {
    id: 'reit',
    term: 'REIT',
    expansion: 'real estate investment trust',
    definition:
      'A listed vehicle that owns income-producing property and distributes most of its income. Singapore has a large S-REIT sector, and REITs are among the few SGX names liquid enough to hedge at size.',
    area: 'Markets',
  },
  {
    id: 'borrow',
    term: 'borrow',
    expansion: 'the availability of stock to short',
    definition:
      'To short a single name you must borrow it, and in Asia borrow is hard on most names. SGX requires short-sell orders to be marked and positions reported, and there is no listed single-stock future to synthesise a borrow.',
    area: 'Markets',
  },
  {
    id: 'stock-connect',
    term: 'Stock Connect',
    expansion: 'the Shanghai/Shenzhen–Hong Kong mutual access channel',
    definition:
      'Northbound lets offshore investors buy mainland-listed A-shares through Hong Kong; southbound lets mainland investors buy Hong Kong shares. It is a separate channel from the licence-based QFII route.',
    area: 'Markets',
  },
  {
    id: 'qfii',
    term: 'QFII',
    expansion: 'Qualified Foreign Institutional Investor',
    definition:
      'A licence-based route for foreign institutions to invest onshore in China. It predates Stock Connect and is still used for larger or more complex mandates.',
    area: 'Markets',
  },
  {
    id: 'h-share',
    term: 'H-share',
    expansion: 'a mainland company’s Hong Kong-listed share',
    definition:
      'A share of a mainland-incorporated company listed in Hong Kong. It is not fungible with the company’s A-share, so the two trade at a persistent spread.',
    area: 'Markets',
  },
  {
    id: 'a-share',
    term: 'A-share',
    expansion: 'a mainland-listed renminbi share',
    definition:
      'A share listed on the Shanghai or Shenzhen exchange and quoted in renminbi. Where a structure references the A-share close but hedges the H-share, the basis is a real risk.',
    area: 'Markets',
  },
  {
    id: 'neer',
    term: 'S$NEER',
    expansion: 'Singapore dollar nominal effective exchange rate',
    definition:
      'The trade-weighted currency band that MAS targets instead of an interest rate. Because policy operates through the currency, SGD interest rates are largely imported from the US.',
    area: 'Markets',
  },
  {
    id: 'mlf',
    term: 'MLF',
    expansion: 'Medium-term Lending Facility (PBoC)',
    definition:
      'A PBoC medium-term lending facility. The PBoC operates a set of administered rates rather than a single policy rate, so the MLF matters alongside the 7-day reverse repo and the LPR.',
    area: 'Markets',
  },
  {
    id: 'lpr',
    term: 'LPR',
    expansion: 'Loan Prime Rate (China)',
    definition:
      'The lending benchmark published in China, set off the PBoC’s medium-term rate. It is the reference for onshore loan pricing rather than a market-traded rate.',
    area: 'Markets',
  },
  {
    id: 'gift-nifty',
    term: 'GIFT Nifty',
    expansion: 'the NSE IFSC Nifty contract traded on SGX',
    definition:
      'The offshore India equity benchmark, traded in Gujarat and available on SGX. It is the practical India hedge outside Indian hours, and it carries a basis to the onshore NSE contract.',
    area: 'Markets',
  },
  {
    id: 'point-value',
    term: 'point value',
    expansion: 'money per index point on one futures lot',
    definition:
      'The multiplier that converts an index move into currency. It differs by contract — HSI is HKD 50 per point, the SGX Nikkei contract JPY 500 — and it is the unit of every hedge calculation.',
    area: 'Markets',
  },
  {
    id: 'sgt',
    term: 'SGT',
    expansion: 'Singapore Time (UTC+8)',
    definition:
      'The single clock this site uses. The desk is in Singapore, and one clock is what makes cross-venue comparison possible: "JPX closes at 14:30 SGT" is usable, "JPX closes at 15:30" is not. SGT has no daylight saving.',
    area: 'Markets',
  },
  {
    id: 'hsi',
    term: 'HSI',
    expansion: 'Hang Seng Index',
    definition:
      'The Hong Kong benchmark, free-float market-cap weighted and heavily weighted toward the China large-cap complex. Hedged with HSI and MHI futures on HKFE.',
    area: 'Markets',
  },
  {
    id: 'mhi',
    term: 'MHI',
    expansion: 'Mini-Hang Seng Index futures',
    definition:
      'The mini contract on the HSI, one fifth the point value of the full contract. Same expiry as the full contract, so it is a sizing tool rather than a different hedge.',
    area: 'Markets',
  },
  {
    id: 'cdp',
    term: 'CDP',
    expansion: 'Central Depository (Singapore)',
    definition:
      'The SGX clearing house and depository for cash securities. Derivatives clear separately through SGX-DC, with no cross-margin between the two pools.',
    area: 'Markets',
  },
  {
    id: 'ccass',
    term: 'CCASS',
    expansion: 'Central Clearing and Settlement System (Hong Kong)',
    definition:
      'The Hong Kong depository, operated by HKSCC. Settlement of stock trades runs T+2 through it; the clearing houses for futures and options are separate entities.',
    area: 'Markets',
  },
  {
    id: 'chess',
    term: 'CHESS',
    expansion: 'Clearing House Electronic Subregister System (Australia)',
    definition:
      'The ASX depository. ASX Clear handles cash and ASX Clear (Futures) handles derivatives, so the two legs do not net against each other.',
    area: 'Markets',
  },
  {
    id: 'otc',
    term: 'OTC',
    expansion: 'over the counter',
    definition:
      'Traded bilaterally rather than on an exchange. In Asia this is where single-name vol, correlation and dividend risk must be hedged, because the exchanges list no such products.',
    area: 'Markets',
  },
  {
    id: 'hkfe',
    term: 'HKFE',
    expansion: 'Hong Kong Futures Exchange',
    definition:
      'The derivatives venue within HKEX. Lists HSI, MHI and stock futures and options, and is separate from the cash venue SEHK.',
    area: 'Markets',
  },
  {
    id: 'jscc',
    term: 'JSCC',
    expansion: 'Japan Securities Clearing Corporation',
    definition:
      'The single central counterparty for Japanese cash and derivatives. Because it clears both legs, a cash-plus-futures hedge margins in one pool — the structural advantage over SGX.',
    area: 'Markets',
  },
  {
    id: 'hkma',
    term: 'HKMA',
    expansion: 'Hong Kong Monetary Authority',
    definition:
      'The authority that operates the HKD linked exchange rate system. When spot approaches the weak-side limit it drains liquidity, so HKD rates spike rather than the peg breaking.',
    area: 'Markets',
  },
  {
    id: 'boj',
    term: 'BOJ',
    expansion: 'Bank of Japan',
    definition:
      'Japan\'s central bank, which targets a short-term overnight call rate. A policy change moves the front of the JPY curve first, so USD/JPY forward points reprice before the long end.',
    area: 'Markets',
  },
  {
    id: 'rba',
    term: 'RBA',
    expansion: 'Reserve Bank of Australia',
    definition:
      'Australia\'s central bank, which sets a cash rate target. AUD is high-beta in risk-off moves, so forward points move with risk appetite as well as with policy.',
    area: 'Markets',
  },
  {
    id: 'rbi',
    term: 'RBI',
    expansion: 'Reserve Bank of India',
    definition:
      'India\'s central bank, which sets the repo rate. INR is a managed float, so onshore and offshore forward points can diverge.',
    area: 'Markets',
  },
  {
    id: 'mas',
    term: 'MAS',
    expansion: 'Monetary Authority of Singapore',
    definition:
      'Singapore\'s central bank, which targets the S$NEER currency band rather than an interest rate. That makes SGD rates largely imported from the USD curve.',
    area: 'Markets',
  },
  {
    id: 'hibor',
    term: 'HIBOR',
    expansion: 'Hong Kong Interbank Offered Rate',
    definition:
      'The HKD interbank rate. Because the currency is pegged, HIBOR tracks USD rates and can spike when the HKMA drains liquidity at the weak-side limit.',
    area: 'Markets',
  },
  {
    id: 'cffex',
    term: 'CFFEX',
    expansion: 'China Financial Futures Exchange',
    definition:
      'The onshore venue for CSI 300 and other mainland index futures. Not accessible to most offshore participants, which is why the offshore A50 contract on SGX exists.',
    area: 'Markets',
  },
  {
    id: 'nse',
    term: 'NSE',
    expansion: 'National Stock Exchange of India',
    definition:
      'The onshore Indian venue. Its Nifty contract trades in Indian hours; the offshore proxy is the GIFT Nifty contract, which carries a basis to it.',
    area: 'Markets',
  },
  {
    id: 'ifsc',
    term: 'IFSC',
    expansion: 'International Financial Services Centre (Gujarat)',
    definition:
      'The Indian offshore zone where the NSE lists the GIFT Nifty contract. That contract is what trades on SGX and is the practical India hedge outside Indian hours.',
    area: 'Markets',
  },
  {
    id: 'csa',
    term: 'CSA',
    expansion: 'Credit Support Annex',
    definition:
      'The collateral agreement attached to an ISDA master. It governs margin on OTC trades, and it is part of why single-name vol is harder to mark than a listed position.',
    area: 'Markets',
  },
  {
    id: 'isda',
    term: 'ISDA',
    expansion: 'International Swaps and Derivatives Association',
    definition:
      'The body whose master agreement governs most OTC derivatives. A trade with a new OTC counterparty requires an ISDA and a CSA before it can be executed at all.',
    area: 'Markets',
  },
  {
    id: 'itayose',
    term: 'Itayose',
    expansion: 'the Japanese auction method',
    definition:
      'The auction algorithm used at the Japanese close. A single Itayose auction sets the closing price, and there is no post-auction window as there is at SGX.',
    area: 'Markets',
  },
  {
    id: 'ching-ming',
    term: 'Ching Ming',
    expansion: 'a Hong Kong public holiday in early April',
    definition:
      'Falls on the solar calendar, so unlike the lunar new year it is close to a fixed date. It sits near the Japanese dividend season, so early April is thin in two markets at once.',
    area: 'Markets',
  },
  {
    id: 'deepavali',
    term: 'Deepavali',
    expansion: 'a Singapore public holiday set by the Hindu calendar',
    definition:
      'Moves each year within roughly October to November. Singapore\'s holiday list mixes lunar, Islamic and Hindu dates, so the SGX calendar cannot be derived from the lunar calendar alone.',
    area: 'Markets',
  },
  {
    id: 'hkscc',
    term: 'HKSCC',
    expansion: 'Hong Kong Securities Clearing Company',
    definition:
      'Clears and settles Hong Kong cash securities, and operates CCASS. Futures and options clear through HKCC and SEOCH instead.',
    area: 'Markets',
  },
  {
    id: 'hkcc',
    term: 'HKCC',
    expansion: 'Hong Kong Futures Clearing Corporation',
    definition:
      'Clears Hong Kong futures, including HSI and MHI. Separate from HKSCC for cash and SEOCH for stock options, so there is no single CCP.',
    area: 'Markets',
  },
  {
    id: 'seoch',
    term: 'SEOCH',
    expansion: 'SEHK Options Clearing House',
    definition:
      'Clears Hong Kong stock options. One of four clearing entities at HKEX, alongside HKSCC, HKCC and OTC Clear.',
    area: 'Markets',
  },
  {
    id: 'atm',
    term: 'ATM',
    expansion: 'at the money',
    definition:
      'An option whose strike equals spot. "ATM vol" is the implied vol at that strike, and it is the reference point for skew: a wing is quoted as its vol minus ATM.',
    area: 'Derivatives',
  },
  {
    id: 'topix',
    term: 'TOPIX',
    expansion: 'Tokyo Stock Price Index',
    definition:
      'The broad Japanese benchmark, free-float market-cap weighted, and the deeper of the two Japanese indices. Unlike the Nikkei 225 it has no offshore listing, so a TOPIX hedge is confined to Tokyo hours.',
    area: 'Markets',
  },
  {
    id: 'spi-200',
    term: 'SPI 200',
    expansion: 'S&P/ASX 200 futures',
    definition:
      'The Australian index futures contract, AUD 25 per index point, expiring on the third Thursday. It is the only on-exchange hedge for an Australian equity book.',
    area: 'Markets',
  },
  {
    id: 'tse',
    term: 'TSE',
    expansion: 'Tokyo Stock Exchange',
    definition:
      'The Japanese cash venue, part of JPX. Sessions run 09:00-11:30 and 12:30-15:30 JST, which is 08:00-10:30 and 11:30-14:30 SGT.',
    area: 'Markets',
  },
  {
    id: 'jst',
    term: 'JST',
    expansion: 'Japan Standard Time (UTC+9)',
    definition:
      'One hour ahead of SGT, year-round. There is no daylight saving, so a Japanese session defined in JST never shifts in SGT terms.',
    area: 'Markets',
  },

  // Derivatives
  {
    id: 'ko',
    term: 'KO',
    expansion: 'knock-out',
    definition:
      'A barrier whose breach ends the structure early. An autocallable knocks out on the autocall level; a barrier option knocks out by ceasing to exist.',
    area: 'Derivatives',
  },
  {
    id: 'ki',
    term: 'KI',
    expansion: 'knock-in',
    definition:
      'A barrier whose breach activates the payoff, or in a structured note the level at which the investor’s principal becomes at risk. Gamma flips sign around the KI on an autocallable book.',
    area: 'Derivatives',
  },
  {
    id: 'sticky-strike',
    term: 'sticky strike',
    expansion: 'vol fixed against the strike',
    definition:
      'A surface convention in which each strike keeps its implied vol as spot moves. With downward-sloping skew, a fall in spot therefore raises ATM vol, because a higher strike becomes the new at-the-money point.',
    area: 'Derivatives',
  },
  {
    id: 'sticky-delta',
    term: 'sticky delta',
    expansion: 'vol fixed against delta or moneyness',
    definition:
      'A convention in which the smile travels with spot, so ATM vol stays roughly unchanged and the whole skew shifts. Standard for payoffs that reference moneyness.',
    area: 'Derivatives',
  },
  {
    id: 'sticky-local-vol',
    term: 'sticky local vol',
    expansion: 'vol fixed against a spot level',
    definition:
      'A convention in which the vol at a fixed spot level is held constant, so the skew slides through fixed strikes as spot moves. It is the correct mental model for a barrier book, because a barrier is a fixed spot level.',
    area: 'Derivatives',
  },
  {
    id: 'skew',
    term: 'skew',
    expansion: 'the difference in implied vol across strikes',
    definition:
      'Asian index skew slopes down: out-of-the-money puts trade at higher implied vol than equivalent calls, driven by demand for downside protection and by retail structures whose dealers are short downside gamma.',
    area: 'Derivatives',
  },
  {
    id: 'term-structure',
    term: 'term structure',
    expansion: 'implied vol across maturities',
    definition:
      'The shape of vol against tenor. Front-end richness usually reflects expected events; the roll-down of a long-dated vega position as it becomes short-dated is a real PnL source.',
    area: 'Derivatives',
  },
  {
    id: 'vol-basis',
    term: 'vol basis',
    expansion: 'the vol difference between two venues for one underlying',
    definition:
      'The same underlying trading in two places — A50 on SGX versus CSI 300 onshore, Nikkei on SGX versus OSE — carries two surfaces. Hedging in one venue while marking in another leaves a basis that no single-venue model shows.',
    area: 'Derivatives',
  },
  {
    id: 'quanto',
    term: 'quanto',
    expansion: 'payoff converted at a fixed FX rate',
    definition:
      'A structure whose payoff is denominated in one currency but references an asset in another, converted at a pre-agreed rate. The quanto adjustment to vol can be large; the USD-quoted Nikkei is the canonical example.',
    area: 'Derivatives',
  },
  {
    id: 'dispersion',
    term: 'dispersion',
    expansion: 'long single-name vol against short index vol',
    definition:
      'A trade that is long the volatility of individual names and short index volatility, and therefore short correlation. It is hard to run in Asia because single-name vol must be sourced OTC.',
    area: 'Derivatives',
  },
  {
    id: 'delta-convention',
    term: 'delta convention',
    expansion: 'spot, forward or driftless delta',
    definition:
      'The same option has several deltas. Spot delta is the derivative against spot; forward delta against the forward; driftless delta strips out rate and dividend drift. Two desks quoting "the 25-delta put" can mean three different strikes.',
    area: 'Derivatives',
  },
  {
    id: 'american-call',
    term: 'American call',
    expansion: 'an option exercisable at any time before expiry',
    definition:
      'Early exercise is normally never optimal for a non-dividend-paying stock, but it can be immediately before an ex-dividend date, when capturing the dividend outweighs the remaining time value.',
    area: 'Derivatives',
  },

  // Structures
  {
    id: 'autocall',
    term: 'autocallable',
    expansion: 'a note that redeems early if a level is met',
    definition:
      'A structured note that redeems early, at par plus a coupon, the first time the underlying is at or above the autocall level on an observation date. It caps upside while leaving downside exposed, so the investor is short a knock-out call and long a knock-in put.',
    area: 'Structures',
  },
  {
    id: 'worst-of',
    term: 'worst-of',
    expansion: 'a structure whose payoff depends on the worst performer',
    definition:
      'A multi-underlying note where the coupon and the redemption depend on the worst-performing underlying. The feature makes correlation a first-order risk: the desk holding the other side is short correlation.',
    area: 'Structures',
  },
  {
    id: 'snowball',
    term: 'snowball',
    expansion: 'the Chinese autocallable variant',
    definition:
      'No coupon barrier, a knock-in around 75% of initial and an autocall around 103%, with a high conditional coupon. Economically the dealer is short a knock-in put and short a call spread.',
    area: 'Structures',
  },
  {
    id: 'accumulator',
    term: 'accumulator',
    expansion: 'a daily-buy structure with leveraged downside',
    definition:
      'Buys a fixed quantity each day while the price is inside a range; below the strike the buyer takes double quantity down to a knock-in, and a knock-out above ends the structure. The seller is short gamma and short vol.',
    area: 'Structures',
  },
  {
    id: 'cliquet',
    term: 'cliquet',
    expansion: 'a series of locked-in periodic returns',
    definition:
      'A structure that locks in periodic returns subject to a local cap and floor, smoothing a volatile path into a steadier coupon. It marks to forward vol, so the desk is long forward vol and short spot vol.',
    area: 'Structures',
  },
  {
    id: 'reset-barrier',
    term: 'reset barrier',
    expansion: 'a barrier that is re-fixed after a breach',
    definition:
      'An Asian convention: if the barrier is breached on a reset date, it is re-fixed rather than killing the option. The trader must know the reset schedule as well as the level.',
    area: 'Structures',
  },
  {
    id: 'parisian',
    term: 'Parisian barrier',
    expansion: 'a barrier requiring a sustained breach',
    definition:
      'A barrier that triggers only after the level has been breached for a cumulative number of days or over a consecutive window, rather than on an instantaneous touch. Delta near the barrier is smoother than for a plain barrier.',
    area: 'Structures',
  },
  {
    id: 'range-accrual',
    term: 'range accrual',
    expansion: 'a note paying a coupon per day inside a range',
    definition:
      'Pays a coupon for each day the underlying fixes inside a stated range. The fixing convention is part of the payoff, so a change in the observation window changes the value.',
    area: 'Structures',
  },
  {
    id: 'one-touch',
    term: 'one-touch',
    expansion: 'a digital paying if a barrier is ever touched',
    definition:
      'A binary payoff conditional on the barrier being touched at any point before expiry. A no-touch is its mirror, paying only if the barrier is never touched. Gamma is very high near the barrier.',
    area: 'Structures',
  },
  {
    id: 'cbbc',
    term: 'CBBC',
    expansion: 'callable bull/bear contract',
    definition:
      'A Hong Kong-listed leveraged product with a mandatory call feature: it is terminated when the underlying touches a call level. Heavily used by retail, and a source of hedging flow for the desk.',
    area: 'Structures',
  },
  {
    id: 'trs',
    term: 'TRS',
    expansion: 'total return swap',
    definition:
      'A swap exchanging the total return of an asset — price plus dividends — for a financing leg. The dividend component must be handled separately, which is why the region’s missing listed dividend legs matter.',
    area: 'Structures',
  },
];

const byId = new Map(GLOSSARY.map((entry) => [entry.id, entry]));
const byTerm = new Map(GLOSSARY.map((entry) => [entry.term.toLowerCase(), entry]));

export function glossaryEntry(id: string): GlossaryEntry | undefined {
  return byId.get(id);
}

export function glossaryByTerm(term: string): GlossaryEntry | undefined {
  return byTerm.get(term.toLowerCase());
}

/** Entries grouped by area, in a stable order, for the glossary page. */
export function glossaryByArea(): { area: GlossaryEntry['area']; entries: GlossaryEntry[] }[] {
  const areas: GlossaryEntry['area'][] = ['Math', 'Markets', 'Derivatives', 'Structures'];
  return areas.map((area) => ({
    area,
    entries: GLOSSARY.filter((entry) => entry.area === area),
  }));
}

/** Look up several ids, dropping any that do not exist. Used by the term strip. */
export function glossaryEntries(ids: readonly string[]): GlossaryEntry[] {
  return ids.map((id) => byId.get(id)).filter((entry): entry is GlossaryEntry => entry !== undefined);
}
