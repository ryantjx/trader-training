# Singapore Exchange (SGX) — market structure

The material below is a market-structure reference compiled from public sources: exchange rulebooks and product pages, published exchange research, and listed-company disclosures. Every figure carries a source link; verify against the exchange before relying on any of it.

Research on Singapore Exchange (SGX), with a focus on equities and derivatives: liquidity, transaction cost, listed options, dividends and sector composition.

## Resources

**SGX official**

- [SGX – Stock Exchange (equities overview, market data)](https://www.sgx.com/stock-exchange)
- [SGX – Fixed Income](https://www.sgx.com/fixed-income)
- [SGX – Platforms (SGX Titan, Titan DTDC, Titan OTC/Pro, Titan Hub)](https://www.sgx.com/platforms)
- [SGX – Derivatives Platforms (Titan suite)](https://www.sgx.com/derivatives/platforms)
- [SGX – Indices (STI, FTSE ST suite, MSCI Singapore)](https://www.sgx.com/indices)
- [SGX – Data & Connectivity](https://www.sgx.com/data-connectivity)
- [SGX – Trading (board lots, tick, order types, circuit breaker, error trades, short selling, dual currency/class)](https://www.sgx.com/securities/trading)
- [SGX – Derivatives (products, MSCI suite, TAP, NLT, margins, clearing fees)](https://www.sgx.com/derivatives)
- [SGX – Clearing Information (fees, settlement)](https://www.sgx.com/derivatives/clearing-information)
- [SGX – STI Index (constituents, levels)](https://www.sgx.com/indices/products/sti)
- [SGX – Company Announcements (dividends, corporate actions)](https://www.sgx.com/stock-exchange/company-announcements)

**SGX research (Market Updates — used for flow/sector data)**

- [STI Reaches Record High Before September Consolidation (1 Oct 2026)](https://www.sgx.com/research-education/market-updates/20261001-sti-reaches-record-high-september-consolidation)
- [Sector Sweep – Singapore's Maritime Sector (5 Oct 2026)](https://www.sgx.com/research-education/market-updates/20261005-sector-sweep-singapores-maritime-sector-sees-stronger)
- [Stocks That Reversed 1H26 Institutional Outflows in 3Q26 (23 Sep 2026)](https://www.sgx.com/research-education/market-updates/20260923-singapore-stocks-reversed-1h26-institutional-outflows)
- [Retail Investors Net Buy S$888M Over Eight Sessions (17 Sep 2026)](https://www.sgx.com/research-education/market-updates/20260917-retail-investors-net-buy-s888m-over-eight-sessions)

**Comparators (HK / JP)**

- [GovHK – Stamp Duty Rates (HK stock 0.1% per side from 17 Nov 2023)](https://www.gov.hk/en/residents/taxes/stamp/stamp_duty_rates.htm)
- [HKEX – Trading Mechanism (OTP-C, CAS, VCM)](https://www.hkex.com.hk/Services/Trading/Securities/Overview/Trading-Mechanism?sc_lang=en)
- [JPX – Derivatives (products, equities)](https://www.jpx.co.jp/english/derivatives/)

## Executive Summary

SGX is an **offshore index-and-commodity derivatives venue** with a **thin, concentrated cash market**.

- **Trading** — 09:00–12:00 / 13:00–17:00 SGT, with pre-open, mid-day and closing auctions (random end) plus **Trade at Close**; board lots tiered from 5 Oct 2026.
- **Equities** — ~600 listings, ~SGD 1.1–1.2tn cap; **~65% of cap / ~74% of traded value sit in the 30 STI names**; institutional/foreign-dominated.
- **Operations** — T+2 via CDP; **no stamp duty** on trades; **no dividend withholding**; **split margining** (CDP vs SGX-DC).
- **Derivatives** — index-led (A50, Nikkei, MSCI, GIFT Nifty) plus commodities; **no live single-stock futures or options**.

## Platforms

https://www.sgx.com/platforms / https://www.sgx.com/derivatives/platforms

- **SGX Titan** — low-latency, high-throughput **trading, trade registration and clearing** platform for SGX **equity index, FX and commodity** derivatives; the backbone for SGX's position as the world's most liquid **offshore** market for the benchmark indices of **China, India, Japan and ASEAN**, and the leading venue for **iron ore and rubber**.
- **Titan DTDC** (Derivatives Trading & Clearing) — scales products, participants and volumes with higher throughput. ([factsheet, Dec 2019](https://api2.sgx.com/sites/default/files/2019-12/Titan%20DTDC%20Factsheet_Dec%202019.pdf))
  - **Extended trading hours** and **market connectivity**.
  - **Risk controls** — **Pre-Trade Risk Controls (PTRC)**, **self-trade prevention**, **mass-quote protection** and other trading safeguards.
  - **Titan DC** — the derivatives **clearing** engine.
  - **Near-24h instruments.** Most SGX-DT derivatives run a **T session (day) + T+1 session (overnight)**, spanning Asian *and* European/US hours and (for some contracts) extending to ~05:15 SGT the next day. Products with an extended/overnight session include:
    - **Equity index** — **Nikkei 225** (JPY & USD), **FTSE China A50**, **MSCI suite**, **GIFT Nifty** family, FTSE Taiwan / China H50 / Asia ex-Japan ESG.
    - **Commodities** — **iron ore (IODEX)**, **rubber (TSR20)**, coking coal, **freight (FFA)**, steel and petrochemicals.
    - **FX** — **USD/CNH, USD/INR** and other listed FX futures/options.
    - **Rates** — short-term interest-rate futures.
  - Note: the **derivatives** calendar is separate from the cash-equity session (09:00–17:00) and has its own **trading-holiday schedule** — so a hedge can trade when SGX cash, HKEX and JPX are shut. Verify exact session times per contract in the product specifications ([SGX – Trading Schedule](https://www.sgx.com/trading)).
- **Titan OTC** — OTC **trade registration** across **commodities, equity, FX and interest rate** products (excludes OTC financials); brings **clearing members, brokers and clients onto one platform** (clients can get direct view access, or register trades with clearing-member permission).
  - **Registration hours:** Mon–Fri **07:10 SGT → 05:15 SGT** next day (closed 1 Jan).
  - Features: integrated registration workflows, **OTC risk control**, **industry-standard API**, web UI, delegated user management.
- **Titan OTC Pro** — broker-assisted OTC **order management** and information platform built on Titan OTC; adds **price transparency** and full **audit trails**.
  - **Flexible one-to-many / many-to-one protocols**, **pre-execution limit-checks**, **strip + spread trading**, **integrated RFQ workflow**.
- **Titan Hub** — content platform for the Asian derivatives community (standalone or inside Titan OTC); aggregates news, research, prices and analytics for **iron ore, steel, rubber, freight, coal, petrochemicals** (all asset classes covered). Data partners include **S&P Global Platts, ScoutAsia, IHS Markit, Refinitiv, JLC, CNBC**. Free registration.
- **Broader group platforms** — the **Baltic Exchange** (freight), **Climate Impact X** (carbon), **Energy Market Company** (Singapore wholesale power) and **Marketnode** (digital market infrastructure) sit alongside the Titan suite.

## Trading

https://www.sgx.com/stock-exchange/trading

### SGX Trading Hours

- **Pre-open Phase (Opening Routine)**: 08:30 to 08:58–08:59 (ends at a random point within the window)
  - **Non-cancel Phase**: 08:58–08:59 to 09:00
  - **Opening Auction**: 09:00 (opening price matched; unmatched orders carry into continuous trading)
- **Morning Session**: 09:00 to 12:00
- **Pre-open Phase (Mid-day Break)**: 12:00 to 12:58–12:59 (ends at a random point within the window)
  - **Non-cancel Phase**: 12:58–12:59 to 13:00
  - **Mid-day Auction**: 13:00 (matched at the computed price)
- **Afternoon Session**: 13:00 to 17:00
- **Pre-close Phase (Closing Routine)**: 17:00 to 17:04 to 17:05 (ends at a random point within the window, 12:00 to 12:04–12:05 for half-day session)
  - **Non-cancel Phase**: 17:04–17:05 to 17:06
  - **Closing Auction**: 17:06 (closing price computed and matched)
  - **Trade at Close (TAC)**: 17:06 to 17:16 (transact at the fixed closing price)
- **Market Close**: 17:16 (full-day) or 12:16 (half-day)

### Trading Phases

- **Pre-open phase (Opening Routine and Mid-day Break)**
    - Order entry opens at 08:30 (Opening Routine) or 12:00 (Mid-day Break).
    - Submit, cancel and modify are allowed; there is no order matching.
    - Orders resting before the Mid-day Break continue to rest through the break.
    - Ends randomly within a one-minute window — 08:58–08:59 (Opening) or 12:58–12:59 (Mid-day).
    - SGX publishes the Indicative Equilibrium Price (IEP) to indicate the market level.
- **Pre-close phase (Closing Routine)**
    - Order entry opens at 17:00 (full-day) or 12:00 (half-day).
    - Submit, cancel and modify are allowed; there is no order matching.
    - Ends randomly within a one-minute window — 17:04–17:05 (full-day) or 12:04–12:05 (half-day).
- **Non-cancel phase (Opening Routine, Mid-day Break and Closing Routine)**
    - Follows immediately after the Pre-open or Pre-close phase ends.
    - No entering, modifying or cancelling of orders.
- **Auction matching**
    - The system computes a price with an SGX-ST algorithm — the same one used to calculate the IEP.
    - All matchable orders execute at the computed price ("auction matching").
    - Unmatched orders carry forward to the next trading phase.

> Anchor times are from SGX; Pre-open/Pre-close end randomly within a one-minute window and the Non-cancel phase and auction follow immediately after, so the boundary minutes are nominal. Source: [SGX – Trading (Trading Hours & Opening/Closing Routine)](https://www.sgx.com/stock-exchange/trading).

### Board Lots

**Board lots.** The standard board lot is **100 units**, being **tiered from 5 October 2026** so that higher-priced names trade in smaller minimum quantities ([SGX – Trading](https://www.sgx.com/securities/trading)):

| Price band | Board lot |
| --- | --- |
| Up to and including SGD 10 | Existing board lot (100) |
| Above SGD 10 and up to SGD 100 | 10 units |
| Above SGD 100 | 1 unit |

Reviwed quarterly; SGX **purges all resting orders** for affected securities on transition day.

## Equities

- ~**600 listed companies**; ~**SGD 1.1–1.2 trillion** market cap (~USD 0.8tn).
- Daily turnover ~**S\$1–2.5bn** (≈ S\$2.2bn in stocks on a representative Oct 2026 day).
- **High concentration**: 30 STI constituents = ~**65% of market cap**, ~**74% of traded value**.
  - 3Q26 avg daily turnover (ADT): DBS ~**S\$307m**, OCBC ~S\$189m, UOB ~S\$148m, Singtel ~S\$115m.
- **Structurally defensive** — Financials + Real Estate/REITs dominate; banks ≈ half of STI weight.
- **Thin tail** — only ~**220 stocks** averaged > S\$100k ADT in 9M26 (vs ~190 in 9M25); median name near-untradeable in size.
- **Key indices** — STI (top 30), FTSE ST Mid Cap / Small Cap / All-Share, MSCI Singapore.
- **Institutional/foreign-dominated**; small, concentrated retail; no large domestic pension force → **hedging-oriented** flow.
  - **Retail vs institutional** (SGX-published): Sep 2026 institutional **−S\$1.02bn** net sell vs retail **+S\$1.13bn** net buy.
  - **DBS, OCBC, SGX** ≈ two-thirds of retail net buy (8 sessions to 16 Sep); retail tilts to laggards/REITs, institutions rotated into Utilities (Sembcorp) and Tech (AEM).
- **STI at ATH** — STI ETF AUM > S\$6bn; 19 straight months of net inflow (S\$1.96bn).

### Main Sectors

1. **Financials** — DBS (D05), OCBC (O39), UOB (U11), SGX (S68)
2. **Real Estate + REITs** — CapitaLand Investment (9CI), City Developments (C09), UOL (U14), Hongkong Land (H78), Keppel (BN4); S-REITs: CapitaLand Integrated Commercial Trust (C38U), CapitaLand Ascendas REIT (A17U), Mapletree Logistics Trust (M44U), Mapletree Industrial Trust (ME8U), Keppel DC REIT (AJBU), Frasers Logistics & Commercial Trust (BUOU)
3. **Industrials** — ST Engineering (S63), Sembcorp Industries (U96), Seatrium (5E2), Yangzijiang Shipbuilding (BS6)
4. **Telecom** — Singtel (Z74); StarHub (CC3) and NetLink NBN Trust (CJLU) sit outside the STI
5. **Consumer** — DFI Retail (D01), Thai Beverage (Y92), Wilmar International (F34), Genting Singapore (G13), Golden Agri-Resources (E5H)
6. **Transport** — Singapore Airlines (C6L), ComfortDelGro (C52), SATS (S58), Jardine Cycle & Carriage (C07), Jardine Matheson (J36)

> Constituents change at quarterly FTSE reviews; codes and membership are as at Oct 2026. Banks (~50% of STI weight) and REITs are the two liquidity/dividend anchors.

### Key Tickers — Market Cap, STI Weight & Liquidity (30 Sep 2026)

Ranked by market cap. STI weights are indicative (raw-cap approximation; the actual index is free-float adjusted and capped):

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

- **The three banks alone (~S\$440bn) ≈ 38% of total SGX market cap and roughly half of STI weight.**
- **Top 5 (banks + Singtel) ≈ 44% of total market cap.**
- **Liquidity concentrates in the biggest names** (banks + Singtel + REITs + a few Industrials); the market's *traded value* is even more top-heavy than its **market cap** — e.g. **AEM** is small (~S\$3bn) but trades ~S\$45m/day.
- **The STI's 30 names ≈ 65% of total market cap**; the other ~570 listed names share the remaining ~35%.
- Concentration is the defining feature: a handful of names drive both **index level** and **traded value**.

### Sector Rotation & Direction

- **Institutions are rotating *out of* the defensive core (banks, REITs, real estate, telecom) and *into* growth sectors (tech, utilities, energy, maritime/shipbuilding).**
  - **Flow data (Sep 2026)** — institutional net **sell −S\$1.02bn** vs retail **buy +S\$1.13bn**; **Utilities** (Sembcorp **+S\$106m**) and **Tech** (AEM **+S\$81m**) took the largest institutional inflows; **Financials, REITs, Real Estate (ex-REIT) and Telecom** saw the largest outflows. ([SGX Market Update, 1 Oct 2026](https://www.sgx.com/research-education/market-updates/20261001-sti-reaches-record-high-september-consolidation))
- **Maritime / Shipping strength from the structural offshore & shipbuilding cycle** — rising offshore rates, sustained chartering demand and firm order books, with the US–Iran conflict adding an *energy-security* tailwind to offshore wind. **YZJ Shipbuilding** reversed 1H26 −S\$40m → 3Q26 **+S\$219m**; top ROEs — Nam Cheong 45.4%, Beng Kuang Marine 34.1%, YZJ 32.2%, Marco Polo 25.9%, ASL Marine 25.6% — on **2,128 ships ordered YTD 2026** (~2× the 10-yr average). ([Sector Sweep, 5 Oct 2026](https://www.sgx.com/research-education/market-updates/20261005-sector-sweep-singapores-maritime-sector-sees-stronger))
- **Tech (Semis) benefitted from AI boom** — the AI boom lifted the **FTSE ST All-Share Technology Index +1.7%** in Sep, led by **PC Partner (PCT)** and **AEM (AWX)**. Beneficiaries: **AEM +472% YTD**, **PC Partner +297% YTD**, **UMS (558) +142%**, **Frencken (E28) +92%**, **CSE Global (544) +28%**, plus InnoTek, iWOW Technology and Venture. ([SGX Market Update, 1 Oct 2026](https://www.sgx.com/research-education/market-updates/20261001-sti-reaches-record-high-september-consolidation))
- **REITs / Bank yields** — rising Treasury yields put pressure on defensive yield: **US 10-yr rose 4.75% → 5.28%** in Sep (Fed target 3.75–4.00%). **FTSE ST REIT Index −5.7%** in Sep, and the banks/REITs core — which had run to record valuations on the STI's all-time high — recorded the largest institutional outflows.
- **Small/mid-cap growth — the laggards are now leading the market** : the strongest ADT growth came from **Hiap Hoe +116%**, **iX Biopharma +89%**, **Keppel DC REIT +32%**, **StarHub +30%**, **Elite UK REIT +18%**. ([SGX, 23 Sep 2026](https://www.sgx.com/research-education/market-updates/20260923-singapore-stocks-reversed-1h26-institutional-outflows))

## Operations

- **Settlement** — SGX-ST cash equities settle **T+2** (trade date + two market days) through **CDP**, on a **delivery-versus-payment** basis; holdings are **scripless** (book-entry). ([SGX – Clearing Information](https://www.sgx.com/stock-exchange/clearing-information))
- **Dividends** — CDP captures entitlement and **credits cash dividends automatically**; most names pay **semi-annually**, REITs **quarterly**. See [Dividends](#dividends) for yields and tax. ([Company Announcements](https://www.sgx.com/stock-exchange/company-announcements))
- **Stamp duty** — **none on exchange trades**; the **0.2%** rate applies only to **physical share-transfer instruments** (e.g. private transfers), at the higher of price or NAV. ([IRAS – Stamp Duty](https://www.iras.gov.sg/quick-links/tax-rates/stamp-duty))
- **Transaction costs** — **brokerage + clearing fee + trading/access fee + 9% GST on fees + bid-ask spread** (tick-grid governed). Rates sit in SGX's fee schedule — *verify current figures, as the %/caps change* ([SGX fees](https://www.sgx.com/securities/trading)).
- **Short-selling regime** — **Ch. 8A** requires short-sell orders to be **marked** and **positions reported to MAS**; borrow is **hard on single names** (no listed single-stock futures to synthesise one). Operationally heavy for high-turnover delta-one / short overlays. ([SGX – Trading](https://www.sgx.com/securities/trading))
- **Split margining** — cash clears through **CDP** (funded, T+2, DvP) and derivatives through **SGX-DC** (initial + variation margin, 3 intra-day cycles), with **no cross-margin between the two**; margin nets only *within* SGX-DC — so a cash + derivative hedge funds in two separate pools, unlike JPX's single **JSCC**. ([SGX – Clearing Information](https://www.sgx.com/derivatives/clearing-information))

## Derivatives

**No single-stock derivatives.** SGX lists **no live single-stock futures or options** — Singapore single-stock futures were withdrawn, and US single-stock futures were delisted 1 Oct 2026. (SGX-ST Rules Ch. 18 still frames an "Exchange Options" structure, but nothing trades under it.) Retail single-name optionality comes only via third-party **structured warrants / CBBCs** (cash-settled; issuers include Macquarie, DBS, UOB, SocGen).

**Listed options** are therefore **index, commodity and FX only**:

- **Nikkei 225** index options — deepest equity-options book.
- **GIFT Nifty 50 / Bank / IT / Financials** options.
- **IODEX iron ore** options — the most liquid option on SGX.
- Coking coal, TSR20 rubber, FFA options; **USD/CNH, USD/INR** FX options.
- FTSE Taiwan / China H50 / MSCI Singapore index options — effectively zero volume. **No STI options**, and STI futures are near-dormant.

**Equity-index futures and options** (the core suite):

1. **FTSE China A50** — China A-shares (offshore); the flagship China proxy.
2. **Nikkei 225** — Japan; deepest options book (SGX–Nikkei since 1986).
3. **GIFT Nifty 50 / Bank / IT / Financials** — India (NSE IFSC).
4. **MSCI suite** (SG, Asia, Global, Country, Sector).
5. **FTSE Taiwan** — Taiwan.
6. **FTSE China H50** — HK-listed China large-cap.
7. **STI Index Futures** — Singapore benchmark; near-dormant.
8. **FTSE Asia ex-Japan ESG** futures.
9. **Dividend Index / Total Return Futures** — isolate or hedge the dividend and total-return component.

**Commodities & other** — Iron Ore & Steel, Freight, Rubber, Coal, Oil, Petrochemicals, Dairy, Energy, Metals; plus **Listed FX**, **Interest Rate** and **Cryptocurrency** derivatives.

## Dividends

### SGX cash-equity dividends

- **STI trailing yield about 3%** (Oct 2026) — compressed hard by the 2026 rally (STI was 3,833 in Apr 2025 → ~5,800 record in Sep 2026).
- **S-REITs average 5.5–6.5%** — CLAR 6.0–6.5%, MINT 6.2–6.4%, MLT 6.0%; highest: Sasseur 9.1%, Stoneweg Europe 8.9%, Elite UK 8.8%, NTT DC REIT 8.1%, Keppel Infra Trust 7.8%.
- **The three banks now yield *below* the REIT sector** — the price rally outran dividend growth.
- **Tax/mechanics** — no withholding tax, one-tier system; CDP credits dividends automatically; most names pay **semi-annually**, REITs **quarterly**.

### Index dividends & derivative coverage

- **Nikkei is the *only* index with a dedicated SGX dividend-point future.** SGX's product list shows a single dividend-index contract — the **Nikkei Stock Average Dividend Point Index Future** — alongside **Total Return Futures**. ([SGX – Dividend Index products](https://www.sgx.com/derivatives/products?code=dividendindex)) but very thinly traded. The other indices (A50, Nifty, MSCI, STI) have no listed dividend leg; hedging must be done OTC.

### Index dividend yields (context)

Deeper-dive note: the *index* dividend yield is what feeds the futures basis, not the individual stock yield. Rough levels for SGX-traded indices:

| Index | Approx. dividend yield | SGX derivative coverage |
| --- | --- | --- |
| **Nikkei 225** | ~2% | Futures/options **+ dividend-point future** |
| **FTSE China A50** | ~3% | Futures/options (basis only) |
| **STI** | ~3% | Futures (near-dormant) |
| **MSCI Singapore** | ~4% (bank/REIT heavy) | Futures/options |

## Comparison to HK / JP

### Market Structure

each group separates the same three functions: **trading venue** (matches orders), **clearing house / CCP** (novates, nets, margins), **depository / settlement** (holds securities, DvP, T+2).

- **SGX**
  - Trading: **SGX-ST** (cash), **SGX-DT** (derivatives)
  - Clearing: **CDP** (cash) + **SGX-DC** (derivatives); **SGX AsiaClear** (OTC)
  - Depository/settlement: **CDP** — cash clearing *and* depository in one entity
- **HKEX**
  - Trading: **SEHK** (cash), **HKFE** (derivatives), **LME** (metals)
  - Clearing: **HKSCC** (cash), **HKCC** (futures), **SEOCH** (stock options), **OTC Clear** (OTC)
  - Depository/settlement: **CCASS** (operated by HKSCC)
- **JPX**
  - Trading: **TSE** (cash), **OSE** (derivatives)
  - Clearing: **JSCC** — single CCP for both cash and derivatives
  - Depository/settlement: **JSCC** (via Japan Securities Settlement)

### Liquidity

**Scale** — Japan largest, then HK, then SGX:

- **JPX** — ~3,900 listings, ~USD 7.8tn market cap
- **HKEX** — ~2,700 listings, ~HKD 48.5tn (~USD 6.2tn) market cap
- **SGX** — ~600 listings, ~SGD 1.1tn market cap

**Depth** — the important part:

- **SGX** — thin and concentrated: ~65% of cap and ~74% of traded value sit in the 30 STI names; low turnover velocity and a near-untradeable median name. Effective liquidity = a handful of banks, REITs and Singtel.
- **HKEX** — deep but China-linked (mainland issuers + Stock Connect Southbound); high turnover, momentum-driven.
- **JPX** — deepest and broadest, with a large domestic retail day-trading component.

**Investor base** — the three markets have different participation profiles:

- **SGX** — institutional/foreign-dominated; small, concentrated retail; no large domestic pension force driving turnover → **hedging-oriented** flow, not speculative.
- **HKEX** — most heterogeneous: foreign institutions + mainland (China) money + active local retail → sustains high cash turnover and a deep single-stock derivatives market.
- **JPX** — large domestic retail base (margin-trading culture) + GPIF-scale pensions + heavy foreign flow → **widest participation** of the three.

### Trading Sessions

All times in SGT (HKT = SGT; JST = SGT + 1).

| Market | Continuous session (SGT) | Lunch |
| --- | --- | --- |
| **JPX** | 08:00–10:30, 11:30–14:30 | 10:30–11:30 |
| **SGX** | 09:00–12:00, 13:00–17:00 | 12:00–13:00 |
| **HKEX** | 09:30–12:00, 13:00–16:00 | 12:00–13:00 |

- Opens: **JPX first (08:00) → SGX (09:00) → HKEX (09:30)**.
- Closes: **JPX first (14:30) → HKEX (16:00) → SGX (17:00)**.
- All three break for lunch (SGX/HKEX 12:00–13:00, JPX 10:30–11:30 SGT). SGX closes 1 hr after HKEX and 2.5 hrs after JPX.

### Key Points

- **Costs** — HKEX is the expensive market (**0.1%/side stamp duty**); **SGX and JPX are stamp-duty-free** on trades.
- **Scripless** — SGX (CDP) and JPX are book-entry only; HKEX still permits physical certificates.
- **Depth** — JPX deepest cash + derivatives; HKEX deep but China-linked; **SGX thin and index-led**.

