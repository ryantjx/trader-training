---
title: Exotic options
description: The payoffs, the surface conventions, the delta conventions, and what can actually be hedged.
---

This is the core of the desk, and the section the rest of the manual serves. Asian exotics are sold
overwhelmingly as retail and private-bank structured products, priced off a dealer-controlled OTC
volatility surface, and hedged with a narrow set of listed index futures plus an opaque single-stock
borrow market.

Three demands follow from that:

1. **Recall the conventions** — fixings, observation rules, resetting barriers, protected windows.
2. **Be fluent in the vol arithmetic** that turns vega and skew into money.
3. **Judge what can actually be hedged**, and where.

## The payoffs to know by heart

### Autocallables

The dominant structure across Hong Kong, Japan and Singapore retail flow.

- **Worst-of autocallable.** Multiple underlyings. Coupon paid while all are above the coupon barrier.
  Redeems early the first time **all** are at or above the autocall level on an observation date.
  Principal at risk if **any** closes below the knock-in at maturity.
- **Snowball** (China). No coupon barrier; knock-in around 75% of initial, autocall around 103%, high
  conditional coupon. Economically short a knock-in put and short a call spread.
- **Phoenix.** A snowball with a coupon barrier added, so the coupon is conditional.

Two behavioural facts to carry: autocallables **cap upside and concentrate downside**, and the desk's
gamma **flips sign around the knock-in**.

The worst-of feature makes correlation a first-order risk. The desk holding the other side is short
correlation and pays for it in worst-of spread.

### Accumulators and decumulators

Daily-buy structures. An accumulator buys a fixed quantity each day while the price is inside a range;
below the strike the buyer takes **double** quantity down to a knock-in, and a knock-out above ends the
structure early. A decumulator is the mirror.

The seller is short a strip of put spreads and short a knock-out call: short gamma, short vol. The
payoff is asymmetric by construction, which is why the structure is sold rather than bought.

### Barriers

- Single versus double; knock-in versus knock-out; a one-touch pays on any touch, a no-touch is a
  digital that requires the barrier never to be touched.
- **Reset barriers** are Asia's distinguishing convention: if the barrier is breached on a reset date
  it is **re-fixed** rather than killing the option. The reset schedule is part of the term sheet and
  part of the risk.
- **Parisian and window barriers** trigger after a sustained or cumulative breach rather than an
  instantaneous touch, which smooths delta near the barrier.

Delta is discontinuous at a plain barrier, which is why barrier-heavy books are marked on a
spot-level convention (see below).

### Cliquets and lookbacks

A cliquet locks in a series of periodic returns subject to a local cap and floor, converting a volatile
path into a smoothed coupon. It marks to **forward vol**, so the desk is long forward vol and short
spot vol — effectively short gamma.

Lookbacks have fixed versus floating strike conventions, and the difference is material.

### Dispersion, worst-of and correlation

A dispersion trade is long single-name vol, short index vol and therefore short correlation. It is
hard to run in Asia for exactly the reason in the hedge-gap section: single-name vol must be sourced
OTC.

A worst-of always trades below the average of its components, and the gap widens as correlation falls.

### Range accruals, digitals and TRS

A range accrual pays a coupon for each day the underlying fixes inside a range, so the fixing
convention is part of the payoff. A digital creates pin risk around the strike. A total-return swap
has a dividend leg and a financing leg that must be handled separately.

### Quanto

A quanto converts the payoff at a fixed FX rate rather than a floating one, and the quanto adjustment
to vol can be large. The USD-quoted Nikkei is the canonical example.

## The volatility surface

### Skew

Asian index skew is pronounced and downward-sloping: out-of-the-money puts trade at higher implied vol
than equivalent calls, driven by demand for downside protection and by leveraged retail structures
whose dealers are structurally short downside gamma.

What matters more than the shape is **which convention you are quoting in**:

| Convention | What is held fixed | Where it is used |
| --- | --- | --- |
| Sticky strike | Vol against the strike | Pricing and most vanilla books |
| Sticky delta (moneyness) | Vol against delta | Exotics whose payoff references moneyness |
| Sticky local vol | Vol at a fixed **spot level** | Barrier-heavy books, because a barrier is a spot level |

The drill is: given a spot move and a stated convention, say whether ATM vol rises or falls and which
way the skew rotates. With downward skew and sticky strike, a fall in spot **raises** ATM vol, because
a higher strike becomes the new at-the-money point. Under sticky delta, ATM vol is roughly unchanged.
Under sticky local vol, the vol at the barrier is unchanged while the skew slides through the fixed
strikes.

This one distinction moves the mark-to-market of an autocallable book more than almost any other
modelling choice.

### Term structure and forward vol

Front versus back richness, the behaviour into known events, and the **roll-down** of long-dated vega as
it becomes short-dated. A cliquet marks to the back of the curve even though it is short-dated, which
is why forward vol is drilled separately.

### Basis and cross-market vol

The same underlying trades in more than one venue, and each venue has its own surface: A50 on SGX
versus CSI 300 onshore, Nikkei on SGX versus OSE, H-shares versus A-shares, Nifty on SGX versus NSE.
Hedging in one venue while marking in another leaves a basis that no single-venue model shows. It is a
first-order risk for an Asian exotic book and a quotable cost, not a rounding error.

## Delta conventions

The same option has several deltas, and the same "25-delta put" can mean three different strikes.

| Convention | Definition | Where used |
| --- | --- | --- |
| Spot delta | $\partial V / \partial S$ | Local vol surfaces, most pricing |
| Forward delta | $\partial V / \partial F$ | FX and futures-referenced books |
| Driftless delta | Spot delta with no drift and no discounting | Single-stock convention in parts of Asia |

An exotic's mark moves if the convention is changed after the trade, so the convention belongs in the
trade record and not in a conversation.

**Delta shape matters as much as delta level.** A knock-in barrier's delta is discontinuous at the
barrier; a worst-of's delta is the delta of whichever name is currently worst, so it jumps between
names; an autocallable's delta changes sign around the autocall level.

## Product economics and conventions

**Observation, averaging and fixing.** These determine the payoff and are pure convention, which is
where mispricing and disputes originate.

- **Averaging**: arithmetic versus geometric, the length of the window, and whether fixings before the
  trade date are included.
- **Fixing source**: the official close, the exchange close, an intraday window average, or a central
  bank reference such as the PBoC CNY fix or the MAS S$NEER basis.
- **H-share structures referencing the A-share close**: a cross-market basis that is invisible in a
  single-venue model.
- **Observation timing**: close-to-close versus intraday, the exact local close in SGT, and whether a
  holiday shifts the observation.

**Protected trading windows.** These exist so a barrier or a fixing cannot be gamed in a thin hour:
Hong Kong's CAS closing window, SGX's Trade at Close, the ASX closing auction. The window changes both
the observation price and the hedging opportunity.

**Disruption events.** Market disruption, change in law, increased cost of hedging, and the standard
fallback: postpone the observation, then determine the price by dealer poll.

**Dividends, borrow and corporate actions.** Japan's April dividend season, Hong Kong's ex-dividend
clustering, price versus total-return indices, and the early-exercise decision on an in-the-money
American call before an ex-dividend date. The only listed dividend leg in the region is the SGX Nikkei
dividend-point future, so dividend risk elsewhere is OTC or modelled.

**Tax, regulation and issuance.** The Asian retail market is shaped by rules as much as by payoffs:
Hong Kong's listed structured-product regime and 0.1% stamp duty on the shares that hedge it;
Japan's FIEA disclosure and suitability rules; Singapore's private-bank distribution and issuer credit
risk; China's licence-constrained hedging and the CNH/CNY split; and the suitability classification
that decides whether a retail investor may be sold an autocallable at all.

**Where each product is sold.** China: snowballs, autocallables and fixed-coupon notes. Hong Kong:
accumulators, CBBCs and derivative warrants. Japan: Nikkei-linked autocallables, cliquets and FX
structures. Singapore: index autocallables and total-return swaps sold to private banks. Taiwan:
worst-of autocallables and principal-protected notes.

## The Asia exotics hedge gap

The defining constraint on an Asian exotic book is what can and cannot be hedged on-exchange. This is
the single most useful table in the manual.

| Risk | Where it is managed | Consequence for the book |
| --- | --- | --- |
| **Index delta** (HSI, Nikkei, TOPIX, A50, GIFT Nifty, MSCI) | On-exchange index futures on HKFE, OSE and SGX | Cheap and deep; the practical hedge leg |
| **Index gamma and vega** | Index options on HKFE, OSE and SGX | Liquid only in front tenors and near the money |
| **Single-stock delta** | Borrow, and OTC swap or repo | Hard to borrow; no listed single-stock futures or options on SGX or HKEX |
| **Single-stock vega and gamma** | OTC options, dealer to dealer | Wider spreads, dealer dependence, no central clearing, harder marks |
| **Dividend and total return** | SGX Nikkei dividend-point future (thin), plus OTC | Most indices have no listed dividend leg |
| **Correlation and dispersion** | Effectively OTC only | No listed correlation product; the desk holds it until it can be offset |
| **Barrier and reset risk** | OTC only, plus a delta/gamma hedge with index futures | A reset or window barrier cannot be hedged statically |
| **Quanto and FX** | Listed USD/CNH and USD/INR futures and options on SGX, plus OTC | Some listed cover; the rest is OTC |

The examinable conclusions:

- **No listed single-stock vanilla on SGX or HKEX** means a barrier, digital, autocallable, cliquet or
  dispersion book cannot be delta- or vega-hedged with exchange-traded single-name options.
- **No single-stock futures** means no listed borrow or repo leg, so delta-one and dividend-stripping
  hedges lose their exchange-traded financing leg.
- **Split margining on SGX** (CDP for cash, SGX-DC for derivatives, no cross-margin) is a funding drag
  that JPX's single CCP avoids.
- **Concentration** makes dispersion and worst-of behave badly: Singapore's banks and REITs trade as
  one factor, so a "diversified" Asian worst-of basket is less diversified than its component count
  suggests.
- **The hedge leg is index, but the risk is single-name.** That mismatch is why the OTC vol market, not
  the listed one, sets the price.

## Practise this

- [Exotic options](../../quiz/exotic)
- [Vol surface and skew](../../quiz/vol-surface)
- [Listed derivatives](../../quiz/listed)

Terms used above: [KO](../glossary/#ko), [KI](../glossary/#ki),
[sticky strike](../glossary/#sticky-strike),
[sticky local vol](../glossary/#sticky-local-vol),
[reset barrier](../glossary/#reset-barrier),
[dispersion](../glossary/#dispersion),
[quanto](../glossary/#quanto).
