---
title: Markets and microstructure
description: Sessions, auctions, clearing, taxes, tickers, calendars and access across HK, JP, SG and AU.
---

The rules that decide what a trade costs and when it settles. None of this appears in a pricer, and
all of it binds an exotic book: a barrier is observed inside a session, a hedge is adjusted outside
one, and a fixing is defined by a window that exists specifically so the level cannot be gamed.

This section is reading-first. The microstructure drill rewards knowing the rules before practising
them.

## The four venues at a glance

Times are SGT. The ordering is the examinable fact: Japan opens first and closes first, Singapore
closes last.

| Venue | Continuous session (SGT) | Lunch | Close |
| --- | --- | --- | --- |
| JPX (TSE) | 08:00–10:30, 11:30–14:30 | 10:30–11:30 | 14:30 |
| SGX | 09:00–12:00, 13:00–17:00 | 12:00–13:00 | 17:16 |
| HKEX | 09:30–12:00, 13:00–16:00 | 12:00–13:00 | 16:10 |
| ASX | 08:00–14:00 | none | 14:00 |

ASX times are stated on an AEST basis and shift by an hour when daylight saving applies. That caveat
is carried in the data and the drill excludes ASX from session-time questions rather than guessing.

**Three institutions, not one.** Every venue here separates the trading venue, the clearing house or
CCP, and the depository, and the drills test all three separately. The [exchange
overview](../../reference/) carries the full table; the point that matters here is the clearing
arrangement, because that is what decides how a hedge funds. JPX has a single CCP, so a
cash-plus-futures hedge nets in one pool. SGX splits CDP from SGX-DC with no cross-margin, so the
same hedge funds twice. HKEX has four separate clearing entities and ASX two, so cross-margin relief
is limited or absent in both.

## SGX

The longest session in the region and the most structured close.

**The closing routine**, in order:

1. Pre-close opens at 17:00. Orders may be entered, modified and cancelled; nothing matches.
2. The phase ends at a **random point within 17:04–17:05**. The randomness exists so the closing
   price cannot be gamed in the final seconds.
3. **Non-cancel phase** 17:04–17:05 to 17:06: no entry, modification or cancellation.
4. **Closing auction** at 17:06 computes and matches the closing price.
5. **Trade at Close (TAC)** 17:06–17:16 transacts at that fixed price, so a large order can be worked
   without taking auction risk.
6. Market close at 17:16.

The same three-phase structure (pre-open, non-cancel, auction) runs at the open from 08:30 and at the
mid-day break from 12:00.

**Other facts that matter.**

- **Board lots are tiered** from 5 October 2026: 100 units up to SGD 10, 10 units to SGD 100, and 1
  unit above. Reviewed quarterly, and all resting orders are purged on transition day.
- **Settlement is T+2 through CDP**, delivery versus payment, scripless.
- **No stamp duty** on exchange trades, and no dividend withholding tax under the one-tier system.
- **Split margining**: cash clears through CDP, derivatives through SGX-DC, with **no cross-margin**
  between the two pools. A cash-plus-futures hedge therefore funds in two separate pools, which is a
  real drag that a single-CCP venue avoids.
- **Short selling** requires orders to be marked and positions reported to MAS, and borrow is hard on
  single names because there is no listed single-stock future to synthesise one.
- **No single-stock derivatives at all.** Listed options are index, commodity and FX only. This is
  the central structural fact for an exotic book, and it is treated in the exotics section.

**Market shape.** Around 600 listings and SGD 1.1–1.2tn of market cap. The thirty STI constituents
are roughly 65% of market cap and 74% of traded value; the three banks alone are about 38% of market
cap and close to half the index. Financials and REITs dominate. Only about 220 names average above
SGD 100k a day, so the tradeable universe is much smaller than the listing count suggests.

## HKEX

- **Closing Auction Session (CAS)** from 16:00 to 16:10 determines the close. It is the window that
  protects a closing fixing, and it is why a HK-linked structure can reference a close that is not
  easily manipulated.
- **Stamp duty of 0.1% per side** on stock trades. This is the largest single cost difference between
  these markets, and it is a recurring cost on a delta-hedging book: 10bp per side is **20bp a round
  trip**, before brokerage, clearing or the spread. It applies to the shares, not the futures.
- **Not scripless**: physical certificates are still permitted, which affects settlement mechanics.
- **Clearing is fragmented**: HKSCC for cash, HKCC for futures, SEOCH for stock options, OTC Clear
  for OTC. Unlike JPX there is no single CCP across cash and derivatives.
- **H-shares versus A-shares** are not fungible. Different investor bases, capital controls and
  settlement mean the two listings trade at a persistent spread, and any structure that fixes on one
  while hedging the other owns that basis.

## JPX

- **Single CCP**: JSCC clears both cash and derivatives, so a hedged book margins in one pool. This
  is the structural advantage over SGX's split arrangement.
- **Expiry is mid-month**, not month-end: the SQ is computed from the opening prices of the index
  constituents on the second Friday. Nikkei and TOPIX futures both settle there.
- **One closing auction, named Itayose.** Continuous trading stops at 15:30 JST and a single Itayose
  auction sets the close. There is no Trade at Close window and no random-end phase, so a Japanese
  close cannot be worked after the auction the way an SGX close can.
- **No stamp duty** on exchange trades.
- **TSE sessions** are 09:00–11:30 and 12:30–15:30 JST, which is 08:00–10:30 and 11:30–14:30 SGT.
  JST is SGT+1 year-round, so there is no daylight-saving complication.

## ASX

- Continuous trading 10:00–16:00 AEST, with a **closing auction** at the close.
- **No stamp duty** on exchange trades.
- **CHESS** is the depository, with ASX Clear for cash and ASX Clear (Futures) for derivatives.
- **The daylight-saving caveat is the point.** During AEDT the session in SGT terms moves an hour
  earlier. The site carries this as an explicit unverified flag and does not ask session-time
  questions about ASX as a result — an answer that is right for half the year is worse than no
  question.

## Tickers and liquidity

Asian names trade under codes that are not mnemonics, which is why recall is drilled at all. But the
level that matters for a book is the last one: **what listed hedge exists**.

| Level | The question it answers |
| --- | --- |
| Name | Which company is this code? |
| Sector | What does it do? |
| Size | Which market-cap band? |
| Index | Is it in the STI, and roughly what weight? |
| Liquidity | How much trades per day? |
| Hedgeability | Can this position be hedged at all on-exchange? |
| Exit | How many days does the unwind take? |

Market cap and liquidity are different questions and the second decides whether a trade is possible.
A name can be small and heavily traded, or large and illiquid.

**Days to unwind.** The step from a turnover figure to a decision:

$$
\text{days} = \frac{\text{position}}{\text{turnover} \times \text{participation}}
$$

Taking 20% of a S$50m turnover as daily capacity gives S$10m a day, so a S$100m position needs ten
sessions to unwind. Above a few days the exit itself becomes a risk — the market can move against the
unwind, and the hedge is no longer something you can lift when you want to. That is the number that
decides whether a name is hedgeable at the size the client wants, not the market-cap band.

**The SGX anchor set.** D05 DBS, O39 OCBC and U11 UOB are the liquid core, with Z74 Singtel and the
large S-REITs. Together the top thirty names are about two thirds of market cap and three quarters of
traded value. If a name is not in that set, assume it cannot be hedged at size: there is no listed
single-stock derivative and borrow is hard.

**Which names matter for exotics.** Those where retail demand and borrow availability meet: the
Singapore banks and large S-REITs; in Hong Kong the H-share and China large-cap complex underneath
HSI-linked structures; in Japan the Nikkei-heavy exporters whose volatility drives autocallables.

## Calendars, access and central banks

**Holidays.** The Asian calendar is not one calendar, and the drills test that directly.

| Holiday | Market | Fixed or moving |
| --- | --- | --- |
| New Year | All four | Fixed on 1 January; Japan is shut for the first three business days |
| Lunar New Year | Hong Kong, Singapore | Moves with the lunar calendar, late Jan to mid-Feb |
| Ching Ming | Hong Kong | Early April, close to fixed |
| Golden Week | Japan | Late April to early May, fixed but clustered |
| Obon | Japan | Mid-August, fixed |
| Mid-Autumn | Hong Kong | September or October; the holiday is the day *after* the festival |
| Deepavali | Singapore | October or November, set by the Hindu calendar |
| Australia Day | Australia | 26 January, fixed |

Singapore is the awkward one: its holiday list mixes lunar, Islamic and Hindu dates, so it cannot be
derived from the lunar calendar alone. Japan's early-January closure is longer than the other three,
which matters for any structure observing in the first week of the year. A structure with observations
inside a holiday period has fewer valid dates than its term suggests, which is why the calendar is
worth drilling rather than looking up when needed.

**Access.** Stock Connect northbound lets offshore money buy mainland shares through Hong Kong;
southbound is the mirror. QFII is a separate licence-based route used for larger or more complex
mandates, and it reaches a wider set of onshore instruments than Connect does. The H-share and
A-share relationship is a persistent basis, not a fungibility.

Northbound trades settle on the mainland calendar, which differs from Hong Kong's. Around mainland
holidays the two legs can settle on different days, leaving a hedge unpaired — a funding gap as well
as a price gap. CNH is the offshore renminbi and trades freely; CNY is onshore and managed within a
band, so the two normally trade at a persistent spread.

**Offshore access.** The same rule decides which hedges survive the afternoon. Japan and India have
offshore listings, so their indices keep trading when the home market is shut: the Nikkei on SGX, and
the GIFT Nifty — the NSE IFSC contract — also on SGX. Onshore China does not, which is why the
offshore A50 exists on SGX while the CSI 300 sits on CFFEX and is not accessible to most offshore
participants. Hong Kong and Australia have no offshore listing at all, so their hedges are confined
to home hours.

**Policy instruments.** The regional central banks do not operate the same way:

| Central bank | Instrument |
| --- | --- |
| Fed | Federal funds target range |
| BOJ | Overnight call rate, targeted directly |
| PBoC | A set of administered rates: 7-day reverse repo, MLF, LPR |
| RBA | Cash rate target |
| RBI | Repo rate; INR is a managed float |
| HKMA | Operates the HKD linked exchange rate, so HKD rates follow USD |
| MAS | **The S$NEER band, not an interest rate** |

Singapore is the distinctive case: MAS targets a trade-weighted currency band, so SGD rates are
largely imported from the US and the forward points follow the rate differential rather than local
policy. Hong Kong is the other special case: the peg forces HIBOR to track USD rates, and when spot
approaches the weak-side limit the HKMA drains liquidity so HKD rates spike rather than the peg
breaking. A HKD-funded book carries that spillover as a real cost.

The differential, not either rate alone, is what drives forward points. A structure paying a coupon
linked to a short SGD rate is therefore partly a USD rates position.

## Practise this

- [Microstructure](../../quiz/microstructure)
- [Tickers](../../quiz/tickers)
- [Market knowledge](../../quiz/market-knowledge)

Raw per-venue tables: [SGX](../../reference/sgx), [HKEX](../../reference/hkex),
[JPX](../../reference/jpx), [ASX](../../reference/asx).

The [exchange overview](../../reference/) puts all four venues on one SGT clock, with the pairwise
session overlaps and the auctions side by side. That is the page to use when the question is "is
anywhere still open", rather than "what are this exchange's rules".
