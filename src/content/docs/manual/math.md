---
title: Math and units
description: The arithmetic a trader does in their head, and the unit conventions that make it safe.
---

The drills in this section are timed and calculator-free. The objective is not to be able to do
arithmetic — it is to produce a defensible number in a few seconds and to know its order of magnitude
before computing, which is what a desk actually asks for.

Almost every error in this material is a unit error rather than an algebra error. So the rule is:
**write the unit before you write the number.**

## Greeks and PnL

### Gamma

Gamma is the change in delta per unit change in the underlying. It is what makes PnL scale with the
*square* of a move:

$$
\text{Gamma PnL} = \tfrac{1}{2}\,\Gamma\,(\Delta S)^2
$$

where $\Gamma$ is the gamma, $\Delta S$ is the move, and the result is in currency. The whole
difficulty is that $\Delta S$ must be expressed in the same units the gamma is quoted in.

**Worked example.** Gamma is 100,000 per 1 percentage point of spot, and the underlying moves 5%.

- The move is 5 units of 1pp, and gamma scales with the square: $5^2 = 25$.
- Delta changes by $5 \times 100{,}000 = 500{,}000$.
- PnL is the average delta times the move: $\tfrac{1}{2} \times 500{,}000 \times 5\% = 12{,}500$.

The shortcut worth carrying is that with gamma per 1pp,

$$
\text{PnL} = \frac{\Gamma}{200} \times (\text{move in pp})^2
$$

so with $\Gamma = 100{,}000$ the coefficient is 500 and a 5pp move gives $500 \times 25 = 12{,}500$.

### Delta, vega and theta

Delta PnL is the linear term, $\Delta \times \Delta S$. Vega PnL is vega times the change in vol
points, with vega conventionally quoted per vol point:

$$
\text{Vega PnL} = \text{Vega} \times \Delta\sigma
$$

Theta is quoted per day, so the term is theta times the number of days held. A full overnight
attribution is the sum of the four terms, and the reason to drill it is that the terms have different
signs and the net can be small even when every component is large.

### Anchors

- Expected move $\approx \sigma S \sqrt{T}$
- ATM straddle $\approx 0.8\,\sigma S\sqrt{T}$
- One-day move $\approx$ annual vol $/ 16$
- One-week move $\approx$ annual vol $/ 7$

The last two come from the same place: one year contains about 256 trading days, and
$\sqrt{256} = 16$.

## FX

### Conversion

For a quote written USD/XXX, the number is how many XXX one USD buys. So a USD amount is
**multiplied** by the rate to get XXX, and an XXX amount is **divided**. Writing the units out is the
check:

$$
\text{USD} \times \frac{\text{XXX}}{\text{USD}} = \text{XXX}
$$

**Example.** Convert USD 500,000 to JPY at USD/JPY 152.40: $500{,}000 \times 152.40 = 76{,}200{,}000$
yen.

### Triangulation

A cross rate comes from two USD legs, and the only question is which goes on top. To get SGD/JPY from
USD/SGD and USD/JPY:

$$
\text{SGD/JPY} = \frac{\text{USD/JPY}}{\text{USD/SGD}} = \frac{152.40}{1.31} \approx 116.3
$$

The check is to write the units: JPY per USD divided by SGD per USD gives JPY per SGD.

### Pips

For most pairs a pip is the fourth decimal; for yen pairs it is the second. Pip value on a notional is
$\text{notional} \times \text{pip size}$, expressed in the quote currency. On USD 1m of a
four-decimal pair, one pip is 100 units of the quote currency.

### Onshore versus offshore

CNY is the onshore renminbi, managed within a band; CNH is the offshore version, which trades freely.
They normally trade at a persistent spread, and Asia flow often prices the offshore leg first.

## Basis points and money

The most frequently used mental calculation on a floor:

$$
\text{Money} = N \times \frac{b}{10{,}000}
$$

for notional $N$ and $b$ basis points, and in reverse $b = \text{Money} / N \times 10{,}000$.

**Anchor table.** The relationship is linear in notional, so one row gets you the rest:

| Notional | 1bp |
| --- | --- |
| USD 1m | 100 |
| USD 10m | 1,000 |
| USD 100m | 10,000 |
| USD 1bn | 100,000 |
| USD 10bn | 1,000,000 |

**Regional anchors.** 1bp on SGD 100m is about SGD 10,000; 1bp on JPY 10bn about JPY 1,000,000; 1bp
on HKD 1bn about HKD 100,000.

The distinction the drill enforces: a basis point **of notional** is a cost or a fee, and a basis
point **of price** is a move. Mixing them produces an answer that is wrong by the ratio of notional to
market value, which is usually a large factor.

## Spot, forward and forward points

A forward is spot adjusted for the interest-rate differential over the period. With spot $S$, quote
currency rate $r_q$, base currency rate $r_b$ and time $t$ in years:

$$
F = S \times \frac{1 + r_q t}{1 + r_b t}
$$

or in continuous convention, $F = S e^{(r_q - r_b)t}$. Forward points are $F - S$, usually quoted in
pips and scaled to the tenor.

**Worked example.** Spot USD/SGD 1.31, SGD one-year rate 2.5%, USD one-year rate 4.0%:

$$
F = 1.31 \times \frac{1.025}{1.040} \approx 1.2911
$$

so USD/SGD trades at a forward discount of about 189 points.

**The direction rule.** The higher-yielding currency trades at a forward discount, and the
lower-yielding one at a premium. That is what makes covered interest parity hold: no risk-free profit
is available from borrowing one currency, converting, and lending the other.

Rolling a hedge forward by one month costs the forward points for that tenor. Small per roll, material
over a year, and it belongs in the cost of the hedge rather than in unexplained PnL.

## Vega, vol-to-price and strike from delta

### Vega

$$
\text{Vega PnL} = \text{Vega} \times \Delta\sigma
$$

with vega per vol point. A vega of 10,000 loses 10,000 for each point of vol sold, whether that is
20% to 19% or 45% to 44%.

### Price move to vol points

At $k$% annualised vol, a move of $x$% is about $x/k$ vol points. At 20 vol a 1% move is about 5
points; at 10 vol it is about 10 points. This is the cheapest sanity check on a vol mark that exists,
and it is worth doing whenever a mark looks wrong.

### Strike from delta

With $\Delta$ as a positive-magnitude delta and $\Phi^{-1}$ the inverse standard normal CDF:

$$
K \approx S \exp\!\left(\pm\, \Phi^{-1}(\Delta)\,\sigma\sqrt{T}\right)
$$

negative for a put and positive for a call. The two numbers worth memorising are
$\Phi^{-1}(0.25) \approx 0.67$ and $\Phi^{-1}(0.10) \approx 1.28$.

**Worked example.** Spot 100, vol 20%, one year, so $\sigma\sqrt{T} = 0.20$. The 25-delta put sits
about $0.67 \times 0.20 = 13.4\%$ below spot, near 86.6; the 10-delta put about 25.6% below, near
74.4. At three months $\sigma\sqrt{T} = 0.10$ and the same deltas sit near 93.3 and 87.2.

**Tenor halves the wing distance when you quarter it.** That single relationship is what makes a
25-delta strike quotable without a model.

### Breakeven vol

The realised vol needed to pay for the decay of a long-gamma position is

$$
\sigma_{be} = \sqrt{\frac{2\Theta}{\Gamma}}
$$

per unit time, and more directly the PnL of running a gamma book over horizon $t$ is

$$
\text{PnL} \approx \tfrac{1}{2}\,\Gamma\,S^2\left(\sigma_{\text{realised}}^2 - \sigma_{\text{implied}}^2\right)t
$$

so the book makes money only if realised vol exceeds implied by enough to cover the decay.

### Forward vol

For multi-period payoffs the input is the vol between two future dates, implied by two spot vols:

$$
\sigma_{t_1 \to t_2}^2 = \frac{\sigma_{0 \to t_2}^2 t_2 - \sigma_{0 \to t_1}^2 t_1}{t_2 - t_1}
$$

A cliquet marks to this, which is why a short-dated structure can be exposed to the back of the curve.

## Put-call parity

$$
C - P = S - K - \text{carry}
$$

or, in the trader's shorthand, $C = (S - K) + P + \text{Rev/Con}$. The carry term is positive for a
conversion (long stock, short call, long put, financed) and negative for a reversal. Given any four of
the five values, the fifth is determined, and the competitive quiz marks it to the penny.

Two conditions the drill enforces, because a parity question with an impossible price teaches the
wrong thing:

$$
\max(0, S - K) \le C \le S \qquad \max(0, K - S) \le P \le K
$$

Neither the call nor the put can be negative, and neither can breach its no-arbitrage bound.

## Practise this

- [Greeks and PnL](../../quiz/greeks)
- [Put-Call Parity](../../quiz/put-call-parity)
- [Basis points and money](../../quiz/basis-points)
- [FX](../../quiz/fx)
- [Forwards](../../quiz/forwards)
- [Vol and strikes](../../quiz/vol)

Terms used above: [gamma](../glossary/#gamma),
[vega](../glossary/#vega), [theta](../glossary/#theta),
[breakeven vol](../glossary/#breakeven-vol),
[forward vol](../glossary/#forward-vol),
[forward points](../glossary/#forward-points),
[Rev/Con](../glossary/#revcon).
