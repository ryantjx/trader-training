---
title: Listed derivatives
description: Contract specifications, expiry conventions, offshore access and the dividend leg.
---

The index future is the only genuinely liquid on-exchange hedge in the region. Its specification is
therefore the unit of every hedge calculation: notional, lot count, roll date and — for anything
traded outside home hours — whether an offshore listing exists at all.

## Why this section exists

An exotic book is short vol and gamma on a single name or a basket, and it hedges the delta with index
futures. That mismatch is the defining constraint. To size the hedge you need the point value; to roll
it you need the expiry convention; to trade it outside the home session you need the offshore listing.
Each of those is a fact, and each is drilled.

## Contract specifications

| Contract | Venue | Multiplier | Expiry convention |
| --- | --- | --- | --- |
| HSI futures | HKFE | HKD 50 per index point | Business day before the last business day of the month |
| MHI futures (mini-HSI) | HKFE | HKD 10 per index point | Same as HSI |
| Nikkei 225 futures | OSE | JPY 1,000 per index point | SQ, second Friday |
| Nikkei 225 futures | SGX-DT | JPY 500 per index point (also listed in USD) | SQ, second Friday |
| TOPIX futures | OSE | JPY 10,000 per index point | SQ, second Friday |
| FTSE China A50 futures | SGX-DT | USD 1 per index point | Last business day of the month |
| ASX SPI 200 futures | ASX 24 | AUD 25 per index point | Third Thursday |

Tick sizes are deliberately absent from the site's data. They differ by contract and by exchange and
would have to be verified against each specification; rather than invent them, no tick-value drill is
generated.

**The arithmetic.** Point value × index level = notional; points × multiplier × lots = money. The
TOPIX multiplier looks large only because the index level is roughly a tenth of the Nikkei's, so the
notional is comparable. This is why the point value must be learnt per contract rather than inferred
from the index level.

## Expiry conventions

Three different rules, and confusing them is a real operational error:

- **Japan — mid-month.** The SQ is computed from the opening prices of the index constituents on the
  second Friday. Not month-end.
- **Hong Kong — late month, but not the last day.** The business day before the last business day.
- **A50 — last business day of the month.**
- **Australia — third Thursday.**

A hedge is only a hedge if it is rolled before it settles. The roll date is therefore a risk
management fact, not a detail.

## Offshore access

| Underlying | Listings | Consequence |
| --- | --- | --- |
| Nikkei 225 | OSE and SGX | The SGX contract trades when Tokyo is shut, so it is the hedge leg outside Japanese hours |
| TOPIX | OSE only | Only hedgeable inside the Tokyo session |
| FTSE China A50 | SGX only | The standard offshore China proxy; onshore CSI 300 is not accessible to most offshore participants |
| MSCI Singapore | SGX | Futures are the usable leg; the options are effectively zero volume |
| GIFT Nifty | SGX (NSE IFSC contract) | The offshore India proxy, tradeable outside Indian hours |

The examinable asymmetry: Japan and India have offshore listings, while onshore China does not.
Offshore access is what makes a hedge tradeable outside home hours, and it is why the SGX Nikkei
contract exists at all in an Asian book.

## Dividends and total return

Index futures price off the index level net of expected dividends, so the dividend assumption is part
of the basis. Two structural facts:

- **The only listed dividend leg in the region** is the SGX Nikkei Stock Average Dividend Point Index
  Future, and it is thinly traded. A50, Nifty, MSCI and STI have **no listed dividend leg**, so
  dividend risk on those indices is hedged OTC with dividend swaps or priced into the structure.
- **A price index and a total-return index are different underlyings** for a total-return swap. The
  dividend leg has to be handled separately, and where it cannot be hedged it is a modelled
  assumption rather than a hedged risk.

Japan's April dividend season and Hong Kong's ex-dividend clustering are the two calendar effects that
matter most, and both coincide with holidays: Golden Week sits inside the Japanese dividend season,
which makes it a dense period for dividend-sensitive structures.

## Commodities and FX on SGX

The same venue that lists the Asian index suite also lists iron ore (IODEX) and steel, freight, rubber,
coal, petrochemicals, dairy, and listed FX in USD/CNH and USD/INR. Iron ore options are the most liquid
option on the exchange, and the listed FX cover is what makes part of the regional quanto exposure
hedgeable at all.

## Practise this

- [Listed derivatives](../../quiz/listed)

Related: the [exotics section](../exotics/) covers what these contracts can and
cannot hedge.
