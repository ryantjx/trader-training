# Trader Training Manual

A website of daily quizzes for testing trading knowledge and mental math, built with Astro and Starlight. The focus is on **Asian markets** (HK / JP / SG / AU) and on the arithmetic a trader needs to do in their head, under time pressure, without a calculator.

The content is organised into **three groups** — **Math**, **Markets** and **Asia Derivatives** — and every quiz belongs to exactly one of them. All three feed a single **daily set** (section 4), which is the homepage.

```text
1 Math              arithmetic and pricing relationships        -> 21 generators
2 Markets           microstructure, tickers, market knowledge   -> 15 generators
3 Asia Derivatives   listed contracts and OTC exotics           -> 13 generators
```

Each group is split into **individual quizzes**, and each quiz is its own page: `/quiz/greeks`,
`/quiz/fx`, `/quiz/put-call-parity`, and so on. The sidebar lists them under numbered groups, and
`/group/1-math` (or `2-markets`, `3-asia-derivatives`) gives a mixed drill across a whole group.

The site is focused on the **quizzes**. Content supports them: every quiz states the method, a rule of thumb and a source, so the material is delivered at the point of answering rather than in a separate reading list. The one exception is the market-structure reference in section 2.3, which exists because microstructure is genuinely reading-first. The emphasis throughout is on the Asian exotic-options desk: HSI and HSCEI, Nikkei 225, TOPIX, KOSPI 200, FTSE China A50, GIFT Nifty and MSCI structures; the OTC exotics sold on top of them; and the cash-market and microstructure constraints that decide what can actually be hedged.

# 1 Math

Timed, calculator-free drills. The objective is fluency: the ability to produce a defensible number
in a few seconds and to know the order of magnitude before computing.

**Quizzes in this group** (each is its own page under `/quiz/`):

| Quiz | Generators |
| --- | --- |
| Greeks and PnL | `gamma-pnl`, `delta-pnl`, `expected-move`, `delta-gamma-pnl`, `pnl-attribution` |
| Put-call parity | `put-call-parity`, `put-call-parity-structure` |
| Basis points and money | `bp-to-money`, `money-to-bp`, `index-bps-to-money` |
| FX | `fx-conversion`, `fx-triangulation`, `fx-pip-value`, `fx-recall-level` (disabled until the frozen data is verified) |
| Forwards | `forward-rate`, `forward-premium`, `forward-roll-cost` |
| Vol and strikes | `vega-pnl`, `price-move-to-vol`, `delta-strike`, `breakeven-vol` |

## 1.1 Calculating gamma (and the other Greeks)

**What to do.** Given a portfolio's gamma and a price move, estimate the gamma PnL in your head. Then extend the same drill to delta, vega and theta so that a full overnight PnL can be attributed.

**Core formula.**

$$\text{Gamma PnL} = \tfrac{1}{2}\,\Gamma\,(\Delta S)^2$$

where $\Gamma$ is the change in delta per 1% move in the underlying, $\Delta S$ is the price move expressed as a percentage of spot, and the result is in currency. Delta PnL is the first-order term $\Delta \times \Delta S$.

**Worked example.** Gamma is 100,000 for a 1% change in price; the underlying moves 5%.

- The move is 5× the 1% unit, and gamma scales with the **square** of the move: $5^2 = 25$.
- If gamma is quoted per 1 percentage point of spot, a 5% move changes delta by $5 \times 100{,}000 = 500{,}000$; the PnL is the average delta times the move, $\tfrac{1}{2} \times 500{,}000 \times 5\% = \$12{,}500$.
- **The lesson the game teaches is unit discipline**, not the algebra. Every question must state unambiguously whether gamma is quoted per 1% or per 1.00 of spot, and whether the answer is in dollars, in index points, or in ticks.

**Quiz mechanics.**

- Randomly generate spot, the size of the price move, and a gamma figure quoted per 1%.
- Ask for the gamma PnL, then follow up with delta PnL and theta PnL (theta × days) in a mixed "attribute the PnL" round; the vega term is drilled separately in section 1.5, because its unit convention is the single most common source of error in options arithmetic.
- Add the standard back-of-envelope anchors as a second tier: expected move $\approx \sigma S \sqrt{T}$; ATM straddle $\approx 0.8\,\sigma S\sqrt{T}$; one-day move $\approx$ annual vol $/ 16$; one-sigma weekly move $\approx$ annual vol $/ 7$.
- Score on tolerance as well as speed (accept ±1%).

## 1.2 Estimating FX

**What to do.** Test knowledge of the major pairs quoted in the region — SGD, USD, HKD, JPY, AUD (plus CHF, CNH, EUR, GBP, INR) — their current levels, and mental conversion of an amount from one currency to another.

**Upgrades over a simple rate-recall quiz.**

1. **Direction and quoting convention.** USD/JPY vs JPY/USD, and whether a number is a "big figure" or a pip. Randomise the direction so the answer requires the right inverse.
2. **Two-way prices.** Quote bid/ask and require the correct side for the instruction ("I buy USD, sell SGD — do I lift the offer or hit the bid?").
3. **Cross rates by triangulation.** Derive SGD/JPY from USD/SGD and USD/JPY, and CNH/HKD from the USD legs, without going through a direct quote.
4. **Pip and point value.** Value of one pip on a standard lot for each pair, in the quote currency and in USD/SGD.
5. **Onshore vs offshore.** CNY vs CNH and the persistent spread between them; Asia flow often prices the offshore leg first.
6. **Volatility sanity check.** Given a daily range, does the implied annual vol look plausible? (annual vol $\approx$ daily move × 16.)

**Worked examples.**

- Convert 100,000 USD to CHF at USD/CHF 0.89: $100{,}000 \times 0.89 = \text{CHF}\,89{,}000$.
- Convert 500,000 USD to JPY at USD/JPY 152.40: $500{,}000 \times 152.40 = ¥76{,}200{,}000$.
- Triangulate SGD/JPY from USD/SGD 1.31 and USD/JPY 152.40: $\text{SGD/JPY} = 152.40 / 1.31 \approx 116.3$.

**Scoring.** Answer tolerance by instrument: FX prices to a few pips; converted amounts to the nearest 0.1% of notional.

## 1.3 Basis points ↔ money

**What to do.** Instantly convert between a basis point and a currency amount for a given notional, and back. This is the most frequently used mental calculation on a trading floor ("what's 1bp on ¥100bn?").

**Core relation.** For notional $N$ and $b$ basis points:

$$\text{Money} = N \times \frac{b}{10{,}000}$$

**Worked examples.**

- 1bp on ¥100bn: $100 \times 10^9 \times 0.0001 = ¥10{,}000{,}000$, i.e. ¥10m.
- 1bp on USD 100m: $\text{USD }100 \times 10^6 \times 0.0001 = \text{USD }10{,}000$.
- 1bp on HKD 1bn: about HKD 100,000.
- Reverse: a PnL of ¥50m on ¥100bn notional corresponds to $50{,}000{,}000 / 100{,}000{,}000{,}000 / 0.0001 = 5$bp.

**Anchor table to memorise.** The figure is linear in the notional, so only one row needs to be recalled.

| Notional (USD) | 1bp |
| --- | --- |
| 1m | 100 |
| 10m | 1,000 |
| 100m | 10,000 |
| 1bn | 100,000 |
| 10bn | 1,000,000 |

**Regional anchors.** 1bp on SGD 100m is about SGD 10,000; 1bp on JPY 10bn about JPY 1,000,000; 1bp on HKD 1bn about HKD 100,000. A basis point of **notional** and a basis point of **price** are different quantities, so the drill must include both, and the question should say which is being asked.

**Quiz mechanics.** Randomise notional (spanning m to bn, in the four regional currencies plus USD), the currency and the direction of conversion. Include a "what is this in bp?" round and a "cost of X bp on this trade" round framed as an execution-cost question. Score on speed and on order of magnitude.

## 1.4 Spot-forward and forward points

**What to do.** Derive an FX forward rate from spot and the interest-rate differential, interpret forward points, and reason about whether a currency trades at a premium or discount.

**Core relations.** With spot $S$, domestic (quote-currency) rate $r_d$ and foreign (base-currency) rate $r_f$, over a period of time $t$ in years:

$$F = S \times \frac{1 + r_d\, t}{1 + r_f\, t}$$

and, in the continuous convention, $F = S\, e^{(r_d - r_f) t}$. Forward points are simply $F - S$, usually quoted in pips, and scaled to the tenor.

**Worked example.** Spot USD/SGD 1.31, SGD 1-year rate 2.5%, USD 1-year rate 4.0%:

$$F = 1.31 \times \frac{1.025}{1.040} = 1.31 \times 0.98558 \approx 1.2911$$

so USD/SGD trades at a forward **discount** of roughly 189 points (about 189 pips). The intuition: the lower-yielding currency (SGD) trades at a forward premium, and the higher-yielding currency (USD) at a forward discount, so that no risk-free profit is available.

**Drills.**

- Forward points for 1M / 3M / 6M / 1Y in the yen, CNH, SGD, HKD and AUD crosses.
- Direction questions: "is AUD at a premium or discount versus USD, and which side pays away the points?"
- Covered interest parity checks: given spot, forward and one rate, solve for the other rate.
- Hedging application: cost in points of rolling a hedge forward by one month.

**Quiz mechanics.** Numeric entry for the forward rate and the points, with tolerance set by tenor (tighter for short tenors). Include an interpretation round with multiple-choice answers on premium/discount and on which currency the points are paid away from.

## 1.5 Vega, vol-to-price and strike from delta

**What to do.** Convert between vol points and money, and between a price move and a vol move, in your head. Produce an approximately correct strike for a given delta. This is the arithmetic that is actually used on an exotic book, and it is asked at interview far more often than gamma PnL.

**Vega.** Vega PnL is the vol analogue of delta PnL:

$$\text{Vega PnL} = \text{Vega} \times \Delta\sigma$$

where the unit convention must again be stated: vega is normally quoted per **vol point** (1%, i.e. 0.01 in decimal terms) or per 1.00 of vol, and the two differ by a factor of 100.

**Price move to vol points.** At $k$% annualised vol, a price move of $x$% is equivalent to roughly $x / k$ vol points. A 1% move at 20 vol is about 5 vol points; a 1% move at 10 vol is about 10 vol points; a 2% move at 40 vol is about 5 vol points.

**Strike from delta.** Using the normal approximation, with $\Delta$ as a positive-magnitude delta (0.25 for a 25-delta option) and $\Phi^{-1}$ the inverse standard normal CDF:

$$K \approx S \exp\!\left(\pm\, \Phi^{-1}(\Delta)\, \sigma \sqrt{T}\right)$$

with the sign negative for a put and positive for a call. The useful round numbers are $\Phi^{-1}(0.25) \approx 0.67$ and $\Phi^{-1}(0.10) \approx 1.28$, so a 25-delta put sits about $0.67\,\sigma\sqrt{T}$ below spot and a 10-delta put about $1.28\,\sigma\sqrt{T}$ below.

**Worked example.** Spot 100, vol 20%, one year, so $\sigma\sqrt{T} = 0.20$. The 25-delta put is about $0.67 \times 0.20 = 13.4\%$ below spot, a strike near 86.6; the 10-delta put is about $1.28 \times 0.20 = 25.6\%$ below spot, a strike near 74.4. At three months $\sigma\sqrt{T} = 0.10$ and the same deltas sit near 93.3 and 87.2, so **tenor changes the wing distance by a factor of two**. This single relationship is what makes a 25-delta strike quotable without a model.

**Breakeven vol and the gamma–theta trade.** The realised vol needed to pay for the decay of a long-gamma position over a period is

$$\sigma_{be} = \sqrt{\frac{2\,\Theta}{\Gamma}}$$

per unit time, and the PnL from running a gamma book over horizon $t$ is approximately

$$\text{PnL} \approx \tfrac{1}{2}\,\Gamma\, S^2 \left(\sigma_{realised}^2 - \sigma_{implied}^2\right) t$$

so a gamma book makes money only if realised vol exceeds implied vol by enough to cover the decay.

**Forward vol.** For structures whose payoff spans several periods, the relevant input is the forward vol. Between $t_1$ and $t_2$, implied by the spot vols $\sigma_{0 \to t_1}$ and $\sigma_{0 \to t_2}$:

$$\sigma_{t_1 \to t_2}^2 = \frac{\sigma_{0 \to t_2}^2\, t_2 - \sigma_{0 \to t_1}^2\, t_1}{t_2 - t_1}$$

**Quiz mechanics.** Numeric entry for vega PnL, the vol-equivalent of a price move, the delta-strike and the breakeven vol; multiple-choice for the unit convention; and a round that supplies a term structure and asks for the forward vol over a stated window. Score on speed and on being right to the nearest vol point or the nearest index point.

## 1.6 Put-call parity

**Source artifact.** `https://claude.ai/public/artifacts/956f25f7-129e-4d65-b31b-3bcfd41aae35` (moontower). Keep this game to the **standard** form of the artifact: do not add exotic extensions here. No negative option values are allowed.

**Description of the original game.**

The artifact is a single-page React quiz titled *"Put-Call Parity Trading Game"*, subtitled *"Test your options pricing skills!"*. It presents the parity relationship in a trader's shorthand as:

$$\text{Call} = (\text{Stock} - \text{Strike}) + \text{Put} + \text{Rev/Con}$$

That is, the call is decomposed into intrinsic value, the put, and the reversal/conversion ("Rev/Con") carry term, which captures the financing and dividend effect of holding the replicating position to expiry.

**How it plays.**

- A session is **15 questions, no time limit**, with the instruction "Find the missing value".
- Each question displays four of the five variables — Call Value, Put Value, Stock Price, Strike Price and Rev/Con Value — and hides exactly one of them at random. The hidden variable is the answer.
- Input is a single numeric field with two-decimal precision; submission is disabled until a value is entered. Correctness is checked to a **0.01 tolerance**.
- After submitting, the game shows correct/incorrect feedback with both the user's answer and the correct answer, and the running score increments on a correct response.
- A session timer runs continuously; the clock **pauses** once a question is answered, and a progress indicator tracks "Question n/15".
- At the end of the 15 questions the game displays the final score and elapsed time, with an option to restart.

**Question generation (why the numbers look realistic but not clean).**

- Stock price is drawn uniformly from **20 to 150** and rounded to the penny.
- Strike is set within ±10 of spot, in **0.50 increments**, so questions include ITM, ATM and OTM combinations.
- The Rev/Con term is drawn from **−2 to +2** to the penny, giving both reversal (negative carry) and conversion (positive carry) cases.
- Intrinsic values are $\max(0, S - K)$ for the call and $\max(0, K - S)$ for the put; a time-value term of **0 to 3** is added; and small random premium adjustments of ±0.25 are applied to the call and put so that the arithmetic does not collapse to a round number.
- The hidden variable is chosen at random from call, put, stock and Rev/Con, and the correct answer is obtained by rearranging parity, e.g. $\text{Put} = \text{Call} - (S - K) - \text{Rev/Con}$ and $\text{Stock} = K + \text{Call} - \text{Put} - \text{Rev/Con}$.

**Description of the version to build.**

- Same structure and difficulty: 15 questions, one hidden variable, numeric entry, 0.01 tolerance, running score and timer that pauses between questions.
- **Enforce the no-negative-option-value constraint.** The generator must reject and resample any question in which the call or the put would be negative, and must reject any state that violates the no-arbitrage bounds for a European option:
  - $\max(0,\, S - K) \le C \le S$ and $\max(0,\, K - S) \le P \le K$ (undiscounted, in the game's simplified framing);
  - the parity relation must hold exactly to the penny at generation time, so that the displayed figures are internally consistent and the answer is unique.
- Explain the Rev/Con term in a tooltip: positive for a conversion (long stock, short call, long put, financed), negative for a reversal.
- Keep the arithmetic in the game's original units (single currency, two decimals) so the mental-math difficulty is unchanged.

# 2 Markets

Microstructure, ticker recall and market knowledge for HK, JP, SG and AU. This is the group with the
one genuinely reading-first component: microstructure rewards knowing the rules before practising
them, so a **one-page market-structure summary per market** supports the quizzes here.

**Quizzes in this group:**

| Quiz | Generators |
| --- | --- |
| Microstructure | `session-open-at-time`, `stamp-duty`, `clearing-house`, `sgx-closing-routine` |
| Tickers | `ticker-name`, `ticker-name-typed`, `ticker-sector`, `ticker-cap-band`, `ticker-index-membership`, `ticker-liquidity`, `ticker-hedgeability` |
| Market knowledge | `calendar-event`, `access-channel`, `central-bank`, `index-construction` |

## 2.1 Market microstructure

**What to do.** Test execution cost, trading hours (quoted in **SGT**), auction mechanics and the operational rules that determine what a trade actually costs and when it settles.

**Topics covered.**

- **Session times in SGT** for JPX, SGX, HKEX and ASX, including lunch breaks, so that "is market X open at SGT time T?" can be answered from memory.
- **Auction windows** — opening, mid-day and closing routines, and the non-cancel phases.
- **Board lots, tick sizes and tick value** in currency per lot.
- **Settlement cycle** (T+1/T+2), delivery-versus-payment and the depository responsible.
- **Transaction costs** — brokerage, clearing, exchange/access fees, GST or consumption tax on fees, and the bid-ask spread.
- **Levies** — stamp duty and transaction taxes (HK is the notable one; SGX and JPX are stamp-duty-free on trades).
- **Short-selling and borrow** — marking requirements, position reporting, uptick rules, borrow availability.

**SGX reference material.** The microstructure questions for Singapore are drawn from `src/content/sgx-market-structure.md`, the market-structure reference for SGX, HKEX and JPX. The specifics to encode as questions are as follows.

*Trading hours (SGT).*

- **Pre-open (opening routine)** 08:30 to 08:58–08:59; the phase **ends at a random point within a one-minute window**.
- **Non-cancel phase** 08:58–08:59 to 09:00, during which orders cannot be entered, modified or cancelled.
- **Opening auction** at 09:00 — the opening price is matched by the same algorithm used to compute the Indicative Equilibrium Price (IEP); unmatched orders carry into continuous trading.
- **Morning session** 09:00 to 12:00.
- **Pre-open (mid-day break)** 12:00 to 12:58–12:59 (random end), **non-cancel** 12:58–12:59 to 13:00, **mid-day auction** at 13:00.
- **Afternoon session** 13:00 to 17:00.
- **Pre-close (closing routine)** 17:00 to 17:04–17:05 (random end; 12:00 to 12:04–12:05 on a half-day).
- **Non-cancel phase** 17:04–17:05 to 17:06, then the **closing auction** at 17:06 computes and matches the closing price.
- **Trade at Close (TAC)** 17:06 to 17:16 transacts at the fixed closing price.
- **Market close** 17:16 full-day, 12:16 half-day.

*Board lots (tiered from 5 October 2026).*

| Price band | Board lot |
| --- | --- |
| Up to and including SGD 10 | 100 units |
| Above SGD 10 and up to SGD 100 | 10 units |
| Above SGD 100 | 1 unit |

Reviewed quarterly; SGX purges all resting orders for affected securities on transition day.

*Market structure and scale.*

- ~600 listed companies, ~SGD 1.1–1.2tn market cap; daily turnover ~S\$1–2.5bn.
- **High concentration**: the 30 STI constituents are ~65% of market cap and ~74% of traded value. The three banks alone (~S\$440bn) are ~38% of total market cap and roughly half of STI weight.
- Structurally defensive — Financials and Real Estate/REITs dominate; only ~220 stocks averaged above S\$100k ADT in 9M26.
- Institutional/foreign-dominated, small concentrated retail, no large domestic pension force → hedging-oriented flow.

*Operations.*

- **Settlement T+2** through **CDP**, delivery-versus-payment, scripless book-entry.
- **No stamp duty** on exchange trades (the 0.2% rate applies only to physical transfer instruments). **No dividend withholding tax** (one-tier system); CDP credits dividends automatically; most names pay semi-annually, REITs quarterly.
- **Transaction costs**: brokerage + clearing fee + trading/access fee + 9% GST on fees + the bid-ask spread.
- **Short selling**: Chapter 8A requires short-sell orders to be marked and positions reported to MAS; borrow is hard on single names.
- **Split margining**: cash clears through CDP, derivatives through SGX-DC (initial and variation margin, three intra-day cycles), with **no cross-margin** between the two pools.

*Derivatives and venue comparison.*

- SGX lists **no single-stock futures or options**; listed options are **index, commodity and FX only** (Nikkei 225 options are the deepest equity-options book; IODEX iron ore options are the most liquid option overall; **no STI options** and STI futures are near-dormant).
- Cash and derivatives sessions differ, and the derivatives calendar has its own holiday schedule, so a hedge can trade when SGX cash, HKEX and JPX are shut.
- **Trading hours (SGT) across venues** — JPX 08:00–10:30 and 11:30–14:30; SGX 09:00–12:00 and 13:00–17:00; HKEX 09:30–12:00 and 13:00–16:00. Opens: JPX → SGX → HKEX. Closes: JPX → HKEX → SGX.
- **Structure** — each market separates trading venue, clearing house and depository: SGX (SGX-ST / SGX-DT; CDP + SGX-DC; CDP), HKEX (SEHK / HKFE / LME; HKSCC, HKCC, SEOCH, OTC Clear; CCASS), JPX (TSE / OSE; **JSCC, a single CCP for cash and derivatives**; JSCC).
- **Costs** — HKEX is the expensive market at 0.1% per side stamp duty; SGX and JPX are stamp-duty-free on trades.
- **Exotics hedgeability** — the microstructure facts that bind an exotic book: SGX and HKEX list **no single-stock options and no single-stock futures**, so single-name delta, vega and gamma must be sourced OTC; index futures, and in the front tenors index options, are the only on-exchange hedge legs; and SGX's **split margining** (CDP for cash, SGX-DC for derivatives, no cross-margin) creates a funding drag that JPX's single CCP avoids. The windows and fixings that protect a structure sit inside these sessions — HK's CAS closing window, SGX's Trade at Close, the Korean intraday volatility interruptions and the ASX closing auction.

**Quiz mechanics.** A mix of multiple-choice (session times, which venue, which fee applies), numeric entry (tick value, all-in cost of a round trip in basis points) and ordering questions (sequence the phases of the SGX closing routine).

## 2.2 Stock guessing game

**What to do.** Asian stocks generally go by numbers — memorise the ticker, then build outward from it. Test the ticker against the company name, then layer sector, market cap band, index membership and liquidity.

**Codes.** The desk quotes a ticker with a venue suffix, and so does this drill: `D05 SP` Singapore, `9984 JT` Tokyo, `700 HK` Hong Kong, `BHP AU` Australia. The suffix is part of the answer, because `5 HK` is HSBC while `700 HK` is Tencent — the number alone decides nothing.

**Layered difficulty.** Each question can be asked at one of five levels, so the same ticker dataset supports both a warm-up and a hard round:

1. **Ticker → company name** (e.g. `D05 SP` → DBS, `9984 JT` → SoftBank Group), asked twice: multiple choice, where the name is recognised among four listed names, and **free text**, where it is produced from the code alone. The free-text version folds case, punctuation and corporate suffixes, so `softbank group corp.` marks correct against `SoftBank Group`, and it forgives one typo in a name of eight characters or more. It does not forgive a short name: `AIG` is not `AIA`, and `DBX` is not `DBS`.
2. **Ticker → sector** (Financials, Real Estate/REITs, Industrials, Telecom, Consumer, Transport, Tech, Utilities).
3. **Ticker → market cap band** (mega > S\$100bn, large S\$10–100bn, mid S\$2–10bn, small < S\$2bn).
4. **Ticker → index membership and approximate weight** (STI, HSI, TOPIX, Nikkei 225, ASX 200).
5. **Ticker → liquidity** (average daily turnover band) — the level that separates a name that looks big from a name that is actually tradeable.

**Seed dataset (SGX, 30 Sep 2026).**

| Ticker | Name | Sector | Mkt cap (S\$bn) | ~% of STI | 3Q26 ADT (S\$m) |
| --- | --- | --- | --- | --- | --- |
| D05 | DBS | Financials | 222.9 | ~25% | ~307 |
| O39 | OCBC | Financials | 144.8 | ~17% | ~189 |
| U11 | UOB | Financials | 72.0 | ~8% | ~148 |
| Z74 | Singtel | Telecom | 69.8 | ~8% | ~115 |
| S63 | ST Engineering | Industrials | 33.9 | ~4% | ~52 |
| S68 | SGX | Financials | 24.0 | ~3% | ~64 |
| F34 | Wilmar International | Consumer | 22.9 | ~3% | ~22 |
| H78 | Hongkong Land | Real Estate | 21.8 | ~3% | ~22 |
| C6L | Singapore Airlines | Industrials | 21.1 | ~2% | ~48 |
| BN4 | Keppel | Industrials | 20.9 | ~2% | ~43 |
| BS6 | Yangzijiang Shipbuilding | Industrials | 20.4 | ~2% | ~76 |
| J36 | Jardine Matheson | Industrials | 20.4 | ~2% | ~31 |
| C38U | CapitaLand Integrated Com Trust | REIT | 17.7 | ~2% | ~66 |
| A17U | CapitaLand Ascendas REIT | REIT | 11.3 | ~1.5% | ~51 |
| U96 | Sembcorp Industries | Utilities | 10.4 | ~1.5% | ~56 |
| 5E2 | Seatrium | Industrials | 7.1 | ~1% | ~33 |
| AJBU | Keppel DC REIT | REIT | 5.8 | ~1% | ~33 |
| AWX | AEM Holdings | Tech | 3.1 | <1% | ~45 |

`src/data/tickers.json` also carries HK, JP and AU names on the same schema, so the naming drill covers all four venues. Those rows hold listing facts only — code, name, sector, venue. Their market-cap, turnover and borrow fields are `null` because no source has been checked, and every generator that needs one skips null rows: the cap-band and liquidity drills therefore ask SGX names only, and the STI-membership and hedgeability drills are restricted to Singapore listings. Add the numbers when a source has been checked, not before. Refresh at each index review. Note the case that makes the liquidity level worth testing: **AEM** is small (~S\$3bn) but trades ~S\$45m/day, so market cap alone misleads.

**Which tickers matter for exotics.** The desk is most often asked for paper on the names where retail demand and borrow availability meet. In Singapore, the **banks (D05, O39, U11)** and the large **S-REITs (C38U, A17U, M44U, ME8U, AJBU)**, because they are the only names with enough liquidity to hedge at size. In Hong Kong, the **H-share and China-large-cap complex** that underpins HSI-linked structures (for example 700 Tencent, 9988 Alibaba, 939 CCB, 1299 AIA). In Korea, the **large-cap technology and battery names** referenced by ELS. In Japan, the **Nikkei-heavy exporters** whose volatility drives Nikkei autocallables and cliquets. In Australia, the **ASX 200 top-20** names referenced by index and single-name structures.

**Schema fields for the dataset.** The exotics games need more than a ticker and a sector. Add, per instrument: market; index membership; market-cap band; average daily turnover band; **borrow difficulty** (easy / restricted / hard); **whether it has listed single-stock options or futures in its home market**; and **whether it can be delta-hedged on-exchange offshore**. The last two fields convert the dataset from a naming quiz into a hedgeability quiz, which is the part of an exotics desk's job that a naming quiz does not test.

## 2.3 Market knowledge

Knowledge of the mechanics, calendars and access rules of each market. This section is supported by a **one-page reference document per market** — a market-structure summary covering the trading venue, clearing house, depository, session times, fee and tax schedule, settlement cycle, short-selling regime and margining arrangements for **SGX, HKEX, JPX and ASX**. The reference document is the study material; the games below are the test.

**Reference document outline** (one page per market, identical structure so the markets can be compared side by side).

1. **Venue structure** — trading venue(s), clearing house / CCP, depository.
2. **Trading hours in SGT** — continuous sessions, lunch breaks, auction windows.
3. **Board lots, tick sizes and tick value.**
4. **Settlement** — cycle, method (DvP), depository, scripless or not.
5. **Costs and taxes** — brokerage, exchange and clearing fees, tax on fees, stamp duty, withholding.
6. **Short selling** — marking, reporting, uptick rules, borrow availability.
7. **Margining** — CCP arrangement and whether cash and derivatives cross-margin.
8. **Derivatives coverage** — what is listed, what is not, and where the gaps push flow.
9. **Investor base and liquidity profile** — who trades the market and how deep it really is.

**Games.**

- **Index membership and construction.** HSI, TOPIX, Nikkei 225, STI and ASX 200 constituents, top weights, and how each index is built — price-weighted (Nikkei 225) versus free-float cap-weighted (STI, TOPIX, MSCI). "Is name X in index Y, and roughly what weight?"
- **Trading calendar.** Golden Week, Lunar New Year, Obon, Chuseok, and the Singapore and Australian holidays. "Is market X open at SGT time T on date D?" Lunar holidays move every year, which is what makes this a real drill rather than a lookup.
- **Access and flows.** Stock Connect northbound and southbound, QFII, and the H-share / A-share relationship — which is a persistent basis, not a fungibility. "Which channel can a foreign investor use to buy this name?"
- **Rates and central banks.** Fed, BOJ, PBoC (MLF, LPR, 7-day reverse repo), RBA, MAS (S$NEER). Meeting calendar, policy stance, and which instrument moves first. Singapore is the distinctive case: MAS targets a currency band, not an interest rate.

Vol-surface and skew recall moved to the derivatives group in section 3.2.2, and the structured-product landscape to section 3.2.4, because both are derivatives content rather than market-structure content. Short-selling and tick rules are not yet a generator of their own: borrow availability is tested through the ticker hedgeability drill in section 2.2.

# 3 Asia Derivatives

The derivatives layer for the region, in two halves: the **listed** contracts a desk uses as hedge
legs, and the **OTC exotics** sold on top of them. This is the core of the project; everything else
serves it.

**Quizzes in this group:**

| Quiz | Generators |
| --- | --- |
| Listed derivatives | `contract-point-value`, `contract-notional`, `contract-expiry`, `contract-cross-listed` |
| Exotic options | `exotic-identify`, `exotic-greeks`, `exotic-stickiness`, `exotic-hedgeability`, `exotic-convention`, `exotic-where-sold`, `forward-vol`, `vol-basis-pnl` |
| Vol surface and skew | `vol-surface-recall` |

## 3.1 Listed derivatives

**Autocallables and accumulators.** The dominant retail structured products in HK, JP and KR flow.

- *Autocallable*: a note that redeems early if the underlying is at or above a knock-out level on an observation date. Test the payoff grid — KO level, KI level, coupon, observation schedule — and "does it autocall on this path?" questions.
- *Accumulator*: a daily-buy structure with a strike and a knockout, where downside buying is leveraged. Test the payoff asymmetry and why the seller is short gamma and short vol.

**Barrier options.** Knock-in and knock-out payoff intuition, and the specific question of when an option vanishes.

- Single barrier vs double barrier; up-and-out vs down-and-in.
- Why a down-and-in put is more expensive than a vanilla put at some spots but cheaper at others.
- Behaviour near the barrier, and the discontinuity in delta.

**Skew and term structure.** Which strike or tenor carries the higher implied vol, and why.

- Asian index skew is pronounced: HK index puts and JP index puts trade rich to calls.
- Term structure: whether the front or the back is richer, and the relationship to expected events (earnings, dividends, elections, BOJ/PBoC meetings).
- **Forward vol**: the vol between two future dates, which is the input for cliquets and other multi-period payoffs and is not the same as spot vol.
- **Cross-market vol basis**: the same underlying trading in two venues — A50 on SGX versus CSI 300 onshore, Nikkei on SGX versus OSE, H-shares versus A-shares, Nifty on SGX versus NSE — and which venue sets the price. This basis is a first-order hedge risk for an exotic book and is treated in section 3.2.2.

**Index futures specifications.** Multipliers, tick sizes, tick value and expiry conventions.

| Contract | Market | Multiplier / notional convention | Expiry convention |
| --- | --- | --- | --- |
| HSI / MHI futures | HK | HKD per index point (mini = 1/5 of full) | Business day before the last business day of the month |
| Nikkei 225 futures | JP / SG | JPY (and USD on SGX) per index point | SQ on the second Friday |
| TOPIX futures | JP | JPY per index point | Second Friday (SQ) |
| KOSPI 200 futures | KR | KRW per index point | Second Thursday |
| FTSE China A50 futures | SG | USD per index point | Last business day of the month |
| ASX 200 (SPI) futures | AU | AUD per index point | Third Thursday |

Test both the specification (what is a one-tick move worth?) and the calendar (when does it expire?).

**GIFT Nifty and offshore access.** The NSE IFSC contract traded on SGX, its role as the offshore India proxy, and the session overlap that makes it useful outside Indian hours.

**MSCI suite and index options.** The MSCI Singapore / Asia / country and sector futures and options available on SGX. Note that FTSE Taiwan, FTSE China H50 and MSCI Singapore index options are effectively zero volume.

**Dividends and total return.**

- Japan's April dividend season and HK's ex-dividend clustering, and how index futures and option prices adjust for them.
- The early-exercise decision on an ITM American call before an ex-dividend date.
- SGX lists a **Nikkei Stock Average Dividend Point Index Future** — the **only index on SGX with a dedicated dividend leg**, and thinly traded. A50, Nifty, MSCI and STI have no listed dividend leg, so the dividend risk on those indices is hedged OTC (dividend swaps) or priced into the structure. Test the contract, its liquidity, and the fallback.

**Commodities and FX derivatives on SGX.** Iron ore (IODEX) and steel, freight (FFA), rubber (TSR20), coal, petrochemicals, dairy, listed FX (USD/CNH, USD/INR) and short-term interest-rate futures. Iron ore options are the most liquid option on SGX.

**Quiz mechanics.** Match the product to its payoff diagram, identify the contract specification, and answer "what happens on this path" scenario questions. A payoff sketch (drag handle nodes to the correct payoff shape) makes a good interactive extension.

## 3.2 Exotic options

This is the core of the desk, and it is the section the rest of the manual serves. Asian exotics are sold overwhelmingly as **retail and private-bank structured products**, priced off a **dealer-controlled OTC volatility surface**, and hedged with a **narrow set of listed index futures** plus an **opaque single-stock borrow market**. The demands are therefore: recall of the local market conventions (fixings, observation rules, resetting barriers, trading windows), fluency in the vol arithmetic that turns vega and skew into money, and hard judgement about what can actually be hedged and where.

### 3.2.1 Exotic payoffs to know by heart

**Autocallables.** The dominant structure in HK, JP, KR and SG retail flow.

- *Worst-of autocallable*: a multi-underlying note; coupons are paid while all underlyings are above the coupon barrier, the note redeems early the first time all are at or above the autocall level on an observation date, and principal is at risk if any underlying closes below the knock-in (KI) level at maturity. The worst-of feature makes correlation a first-order risk: the desk is effectively **short correlation**, and pays for it in worst-of spread.
- *Snowball*, the Chinese market variant: no coupon barrier, a KI level (typically 75% of initial) and an autocall level (typically 103%), with a high conditional coupon. The dealer is short a knock-in put and short a call spread, long gamma above the KI level and short gamma into it.
- *Phoenix*: a snowball with a conditional coupon barrier.
- Test the payoff grid, the "does it autocall on this path" question, and the two behavioural facts: autocallables **cap upside** and **concentrate downside**, and the desk's gamma flips sign around the KI level.

**Accumulators and decumulators.** Daily-buy structures, in the "I kill you later" family.

- *Accumulator*: buy a fixed number of shares each day while the price is inside a range (above the strike, below the knock-out). Below the strike the buyer takes **double** the quantity, down to a KI level. The seller is short a strip of put spreads plus a short knock-out call.
- *Decumulator*: the mirror image, selling daily.
- Test the payoff asymmetry, the daily observation mechanics, and why the seller is short gamma and short vol.

**Barriers.** Knock-in and knock-out payoff intuition, and the specific question of when an option vanishes.

- Single versus double barrier; up-and-out versus down-and-in; one-touch versus no-touch (a no-touch is a digital whose payoff requires the barrier never to be touched).
- **Resetting barriers** — Asia's distinguishing convention. In a reset barrier the barrier can be **re-fixed** on a reset date if it has been breached, so the option does not die. The trader must know the reset schedule and the reset rule. Common in HK and Korean retail structures.
- **Parisian and window barriers**: the trigger requires the barrier to have been breached for a cumulative number of days or a consecutive window rather than on an instantaneous touch. Test both the trigger condition and its effect on price relative to a plain barrier.
- Behaviour near the barrier, and the discontinuity in delta.

**Digitals, ranges and one-touch.** Cash-or-nothing and asset-or-nothing payoffs; range accruals, which pay a coupon for each day the underlying fixes inside a range; and the pin risk around the strike that a digital creates.

**Lookbacks, cliquets and reverse cliquets.** Lookback payoff conventions (fixed versus floating strike). Cliquets lock in a series of periodic returns with a local cap and floor, which converts volatile returns into a smoothed coupon; they are a common Asian retail structure, and the dealer is **long forward vol and short spot vol** (short gamma), so a cliquet is a bet on the forward-vol versus spot-vol spread.

**Dispersion and correlation.** A portfolio of single-stock options hedged with an index option, so the desk is long single-name vol, short index vol and short correlation. Asian dispersion is hard to run for exactly the reason set out in section 3.3: single-name vol must be sourced OTC and cannot be hedged on-exchange on SGX.

**Worst-of and best-of.** Multi-asset structures whose payoff depends on the worst (or best) performer. Test correlation intuition: the worst-of always trades below the average of the components, and the gap widens as correlation falls.

**TRS and total-return notes.** Total-return swaps on indices and single names, where the dividend leg and the financing leg must be handled separately. This ties directly to the dividend drills in section 3.1.

**Quanto and composite.** Payoff converted at a fixed FX rate versus a floating one, and the quanto adjustment to vol. Relevant wherever an Asian index is sold to a USD or EUR investor.

### 3.2.2 Vol surface mechanics

**Skew.** Asian index skew is pronounced, and the sign is conventional per market. Test which strike carries the higher implied vol and, critically, **which convention the desk is quoting in**:

- **Sticky-strike** — vol is a function of the fixed strike, and the surface does not move when spot moves. Used for pricing and for most vanilla books.
- **Sticky-delta / sticky-moneyness** — the smile is anchored to delta, so the whole skew shifts with spot. Used for exotics whose payoff references moneyness.
- **Sticky-local-vol** — the vol at a fixed *spot level* is held constant, so the skew slides through the fixed strikes as spot moves. This is the correct mental model for a barrier-heavy book, because a barrier is a fixed spot level.

The drill: given a spot move and a stated convention, say whether ATM vol rises or falls, whether the 90% put gets richer or cheaper, and which way the skew rotates. This one distinction changes the mark-to-market of an autocallable book more than almost any other modelling choice, and it is routinely tested.

**Term structure.** Front versus back richness, how the curve behaves into known events, and the **roll-down**: how much a long-dated vega position loses as it becomes short-dated. A cliquet marks to forward vol, so its PnL is driven by the back end of the curve even though it is a short-dated structure.

**Forward vol.** For cliquets and other multi-period structures the input is the forward vol between two future dates, not spot vol; the arithmetic is drilled in section 1.5. Test whether realised forward vol is beating implied.

**Basis and cross-market vol.** The same underlying trades in more than one place — A50 on SGX versus CSI 300 onshore, Nikkei on SGX versus OSE, H-shares versus A-shares, Nifty on SGX versus NSE. Test which venue sets the price, the typical size and sign of the basis, and the effect of the two markets' differing session hours on the hedge. This basis is a first-order risk for anyone hedging an Asian exotic book, and it is invisible in a single-venue model.

### 3.2.3 Delta conventions

The same option has several "deltas", and Asia's conventions differ from the West's. The strike-from-delta arithmetic is drilled in section 1.5; what must be recalled here is the convention, not the number.

| Convention | Definition | Where used |
| --- | --- | --- |
| Spot delta | $\partial V / \partial S$ | Local vol surfaces, most pricing |
| Forward delta | $\partial V / \partial F$ | FX and futures-referenced books |
| Driftless delta | Spot delta with no drift and no discounting | Single-stock Asian and Korean convention |

For a call, spot and forward delta differ by the discount factor, and a driftless delta strips the rate and dividend drift out. Test the conversion between them and the practical consequence: **two desks quoting "the 25-delta put" can mean three different strikes**, and an exotic's mark moves if the convention is changed after the trade.

**Delta shape in practice.** A knock-in barrier's delta is discontinuous at the barrier; a worst-of's delta is the delta of the worst performer and therefore jumps between names as the worst changes; an autocallable's delta changes sign around the autocall level. Test the qualitative shape of delta before testing a number.

### 3.2.4 Product economics and conventions

**Observation, averaging and fixing conventions.** These determine the payoff, they are pure convention, and they are where mispricing and disputes originate.

- **Averaging**: Asian (average-rate) options average over a set of fixings — arithmetic versus geometric average, the averaging window, and whether fixings before the trade date are included.
- **Fixing sources**: which fixing (official close, exchange close, an intraday window average, or a central-bank reference rate such as the PBoC CNY fix or the MAS S$NEER basis). Test "which fixing does this structure reference?".
- **Hong Kong and China convention**: **H-shares referencing A-share prices**, and the use of the A-share close as the fixing for an H-share-linked structure.
- **Observation timing**: close-to-close versus intraday, the exact local close in SGT, and whether a holiday shifts the observation to the next business day.
- **Trading windows** that exist so a barrier or fixing cannot be gamed in a thin hour — Korea's intraday volatility-interruption rules, HK's CAS closing window, SGX's Trade at Close, and the ASX closing auction. Test "which window protects this barrier?".
- **Disruption events**: market disruption, change in law, increased cost of hedging, and the standard fallback — postpone the observation, then determine the price by dealer poll.

**Dividends, borrow and corporate actions.** Japanese dividend-season structures and HK ex-dividend clustering; the difference between a **price index** and a **total-return index** for a TRS or dividend-linked structure; and the early-exercise decision on an ITM American call before an ex-dividend date. The only listed dividend leg in the region is the SGX Nikkei dividend-point future, so dividend risk on other indices must be hedged OTC.

**Quanto and FX-in-payoff.** Fixed versus floating conversion, and the quanto adjustment to vol, which can be large — the Nikkei quoted in USD is the canonical example.

**Tax, regulatory and issuance overlay.** The Asian retail exotics market is shaped by rules as much as by payoffs.

- **Hong Kong** — a listed structured-product regime with product-approval paperwork, the **0.1% per side stamp duty** on the shares that hedge it, and an issuer market-making duty. Structured products are retail-dominated.
- **Korea** — an authorisation and suitability regime for ELW, DLS and ELS, plus intraday volatility-interruption rules that change the hedging window.
- **Japan** — the Financial Instruments and Exchange Act disclosure and suitability rules for retail structured notes, with a distinct domestic retail and institutional base.
- **Singapore** — no collateralised wrapper, full issuer credit risk on a listed structured product, and a standing two-way market-making duty. Distribution runs through the private-bank channel, so tickets are large and the buyer base is narrow.
- **China** — a licence-constrained market: onshore hedging is limited to authorised channels and offshore hedging is restricted to the listed offshore contracts, with QFII, Stock Connect and the CNH/CNY split all bearing on what can be hedged and when.
- **Suitability and disclosure** — the KYC and suitability classification that decides whether a retail investor may be sold an autocallable at all, and the point-of-sale disclosure (KO and KI levels, worst-of and correlation language) the desk must produce.

**Where each product is sold.** Retail appetite differs by market, and it drives what the desk is asked to price: China — snowballs, autocallables and fixed-coupon notes; Korea — ELS and ELW, dispersion and worst-of; Hong Kong — accumulators, CBBCs and warrants; Japan — Nikkei-linked autocallables, cliquets and FX structures; Singapore — index autocallables and TRS sold to private banks. The most useful drill in this area is "what can actually be sold to whom, in which market".

## 3.3 The Asia exotics hedge gap

The defining constraint on an Asian exotic book is what can and cannot be hedged on-exchange. This should be tested as a first-class fact rather than as trivia.

| Risk | Where it is managed | Consequence for the book |
| --- | --- | --- |
| **Index delta** (HSI, Nikkei, TOPIX, A50, Nifty, MSCI) | On-exchange index futures on HKFE, OSE and SGX | Cheap and deep; the practical hedge leg |
| **Index gamma and vega** | Index options on HKFE, OSE and SGX (Nikkei options are the deepest) | Liquid only in the front tenors and near the money |
| **Single-stock delta** | Borrow, and OTC swap or repo | Hard-to-borrow names; no listed single-stock futures or options on SGX or HKEX |
| **Single-stock vega and gamma** | OTC options, dealer to dealer | Wider spreads, dealer dependence, no central clearing, ISDA/CSA machinery, harder marks |
| **Dividend and total return** | SGX Nikkei dividend-point future (thin), plus OTC | Most indices have no listed dividend leg |
| **Correlation and dispersion** | Effectively OTC only | No listed correlation product; the desk holds the risk until it can be offset |
| **Barrier and reset risk** | OTC only, plus a delta/gamma hedge with index futures | A reset or a window barrier cannot be hedged statically |
| **Quanto and FX** | Listed USD/CNH and USD/INR futures and options on SGX, plus OTC | Some listed FX cover; the rest is OTC |

The examinable conclusions are:

- **No listed single-stock vanilla** on SGX or HKEX means a barrier, digital, autocallable, cliquet or dispersion book cannot be delta- or vega-hedged with exchange-traded single-name options. Only index delta, and in the front tenors index gamma and vega, are hedgeable on-exchange; single-name vol must be sourced OTC, with the dealer dependence, margin and mark-to-market opacity that implies.
- **No single-stock futures** means no listed borrow or repo leg, so delta-one and dividend-stripping hedges lose their exchange-traded financing leg.
- **Split margining** on SGX (CDP for cash, SGX-DC for derivatives, no cross-margin) creates a funding drag on a hedged book that a single-CCP venue such as JPX avoids.
- **Concentration** makes dispersion and worst-of behave badly: SGX's banks and REITs trade as one factor, so "diversified" Asian worst-of baskets are less diversified than their component count suggests.
- **The hedge leg is index, but the risk is single-name.** Most Asian exotic demand is for structures on names or baskets that cannot be hedged on-exchange, which is why the OTC vol market, not the listed one, sets the price.

## 3.4 Quiz mechanics

- **Match the product to its payoff diagram** — the primary exotics drill. Include the worst-of, the snowball, the reset barrier and the cliquet, which are the four most commonly confused.
- **Identify the structure from a term sheet** — given KO and KI levels, observation dates, barrier type, averaging and fixing source, deduce the product and state whether the desk is long or short gamma, vega and correlation.
- **Path questions** — "given this price path and these levels, does it autocall, is the KI breached, and what is the payoff?"
- **Hedgeability questions** — "which of these risks can be laid off on-exchange in Singapore, and where must the rest go?"
- **Convention questions** — stickiness, delta convention, averaging type and fixing source.
- **Numeric rounds** — delta-strike, vol-equivalent of a price move, forward vol, breakeven vol and vega PnL, all drawn from section 1.
- **Interactive extensions** — an autocallable path simulator; a drag-and-drop payoff builder; and a volatility-surface explorer that toggles the stickiness convention and shows the resulting change in a barrier or autocallable mark.

# 4 The combined quiz

The daily set is the **homepage**. Twenty questions are assembled from the three groups, with time and
score tracking, so a single visit covers arithmetic, market recall and derivatives knowledge together.

- **Daily seeded challenge.** A deterministic seed based on the date, so every user receives the same
  questions on the same day and a score is comparable from one day to the next. The day rolls over at
  midnight SGT, so the change happens at one unambiguous moment wherever the trader is.
- **Mixed rounds.** A balanced set drawn from all three groups, **interleaved rather than blocked**,
  because that is what a trading day looks like: switching between arithmetic and recall with no warm-up.
- **Group weighting.** Math carries 8 questions, Markets 5 and Asia Derivatives 7, so the exotic-options
  desk gets the largest single share of the derivatives content.
- **Per-question timer that pauses.** The clock stops when a question is answered, so reading the
  explanation is never counted against the trader.
- **Scoring.** Accuracy per group and overall, so arithmetic and recall are ranked separately rather
  than blended into one number that hides which is failing.
- **Spaced repetition.** Missed concepts resurface on expanding intervals, keyed on the concept rather
  than the particular question, so the drill re-tests the skill with fresh numbers.
- **Difficulty tiers.** Graduate → junior → VP → MD, controlling both question difficulty and the time
  allowance. The hardest derivatives questions — payoff identification, hedgeability, stickiness
  convention — are reserved for the VP and MD tiers.
- **No leaderboard, by decision.** The competitive element is against your own personal best. The site
  is fully static with no accounts and no server, so scores are never transmitted anywhere.

# 5 Implementation notes

- **Framework**: Astro with Starlight for the layout and the market-structure pages; the quizzes
  themselves as interactive islands (React) so that question generators run client-side.
- **Three groups, one taxonomy.** The groups are `math`, `markets` and `derivatives` in code, mirroring
  the three sections above. Every generator declares exactly one, and the daily set builder, the quiz
  pages, the tests and the About page all read from the same registry.
- **Subgroups where a group is too broad.** Merging listed contracts and OTC exotics into `derivatives`
  would have lost the distinction the desk actually cares about, so each generator also carries an
  optional `subgroup` (`listed`, `exotic`, `vol-surface`) and the quiz page groups by it.
- **Data**: the quiz datasets (tickers, contract specifications, session times, FX levels) are held as
  plain JSON in `src/data/` and imported directly, **not** as Astro content collections, because the
  generators must run both in the browser (the set is assembled client-side) and in Node (the tests).
  Fields that cannot be verified are omitted or flagged rather than guessed.
- **Determinism**: all question generators take an explicit seed argument, so a daily challenge is
  identical for every user and can be replayed for debugging. Nothing is fetched at build or play time.
- **Exotic book modelling**: the section 3.2 drills assume a local-volatility or
  stochastic-local-volatility style surface for pricing autocallables, snowballs, cliquets and barriers,
  with the stickiness convention stated explicitly on every position. The quiz only needs the convention
  and the resulting direction of the mark, not the model itself, so this is expressed as data on each
  question rather than as a pricing library.
- **Deployment**: GitHub Pages, from a static build. `astro.config.mjs` sets `site` and `base` for a
  project page, so `base` must match the repository name or every asset 404s while the HTML still loads.
  The workflow runs the test suite before building, so a failing generator test blocks the deploy.
- **Reference material**: `src/content/sgx-market-structure.md` is the current SGX / HKEX / JPX market-structure
  source; it feeds the section 2.1 microstructure quizzes, the section 3.3 hedge-gap table and the
  section 2.3 market reference pages.
