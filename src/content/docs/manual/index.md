---
title: The manual
description: What each drill tests, the method behind it, and why a desk cares.
---

This is the reading half of the site. The quizzes are the practice; this is the reasoning, so that a
drill is attempted with the convention already fixed rather than guessed at.

## How the two halves fit

Every quiz page now opens with a short brief — what is being tested, why a desk cares, and the
formula or convention to hold in your head — and links here for the full treatment. Use them in
either order:

- **Read, then drill.** Slower, and better for a topic you have not met on a desk.
- **Drill, then read.** Faster, and better for something you once knew. The feedback after each
  question already gives the method, so the manual is for the parts that need more than a
  paragraph.

## Coverage and provenance

The material covers the Asian exotic-options desk as it is usually run: HSI and HSCEI, Nikkei 225,
TOPIX, FTSE China A50, GIFT Nifty and the MSCI suite; the OTC structures sold on top of them; and
the cash-market rules that decide what can actually be hedged.

- **Data snapshot: 2026-10-17.** Levels are frozen in the repository, never fetched. Conversion
  questions supply the rate inside the question so they cannot go stale.
- **Where a figure is unverified, the site says so** rather than guessing. The ASX daylight-saving
  caveat and the illustrative FX levels are the two current examples.
- **Conventions are stated, not assumed.** Where a market convention differs from the Western
  default — driftless delta, resetting barriers, split margining — the manual states which
  convention it is using.

## Reading order

| Section | Covers | Pairs with |
| --- | --- | --- |
| [Math and units](math/) | Greeks, FX, basis points, forwards, vol arithmetic, parity | Greeks · Basis points · FX · Forwards · Vol · Parity |
| [Markets and microstructure](markets/) | Sessions, auction phases, clearing, taxes, tickers, calendars, access | Microstructure · Tickers · Market knowledge |
| [Listed derivatives](listed/) | Contract specifications, expiry, offshore access, dividends | Listed derivatives |
| [Exotic options](exotics/) | Payoffs, skew and term structure, delta conventions, the hedge gap | Exotic options · Vol surface |
| [Glossary](glossary/) | Every abbreviation the questions use | All |

If you only have ten minutes, read **Math and units** first. Almost every other drill depends on the
unit conventions it fixes, and the arithmetic is the part that decays fastest.

## A note on units

The single most common source of error in options arithmetic is not the algebra but the unit. Two
conventions recur throughout this site and are always stated explicitly in the question:

- **Gamma and vega are quoted per 1 percentage point** (1pp), not per 1.00 of the underlying or of
  vol. The two differ by a factor of one hundred.
- **A basis point of notional and a basis point of price are different quantities.** One is a cost;
  the other is a move.

Where a question says "in dollars" or "in index points" rather than naming a currency, that is
deliberate: the arithmetic is the same and the unit is the point being tested.
