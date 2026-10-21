/**
 * Per-venue notes for the market reference pages.
 *
 * The facts table above is generated from `sessions.json`, so it cannot drift
 * from the quiz data. What it cannot carry is the interpretation: which detail
 * on the page actually binds an exotic book. That lives here, one entry per
 * venue, because the same paragraph repeated on four pages was telling the
 * reader nothing.
 */
export interface VenueNote {
  /** The one thing about this venue that matters most for a derivatives book. */
  headline: string;
  /** Structured points, in the order a trader would ask about them. */
  points: { label: string; detail: string }[];
  /** What this venue implies for hedging, specifically. */
  hedging: string;
}

export const VENUE_NOTES: Record<string, VenueNote> = {
  sgx: {
    headline:
      'An offshore index-and-commodity derivatives venue with a thin, concentrated cash market.',
    points: [
      {
        label: 'Close is the long one',
        detail:
          'SGX closes at 17:16 SGT, after JPX at 14:30 and HKEX at 16:10. That makes the SGX window the only regional session still open for part of the Asian afternoon, and the reason the SGX Nikkei contract is the hedge leg outside Tokyo hours.',
      },
      {
        label: 'Three non-cancel windows',
        detail:
          'At the open, the mid-day break and the close. No entry, modification or cancellation inside them, and each follows a phase that ends at a random point in a one-minute window. The randomness is the mechanism: it makes the auction price impossible to game in the final seconds.',
      },
      {
        label: 'Trade at Close',
        detail:
          '17:06 to 17:16, transacting at the fixed closing price. It exists so a large order can be worked at a known price rather than taking closing-auction risk — directly relevant to unwind a hedge without moving the close.',
      },
      {
        label: 'Split margining',
        detail:
          'Cash clears through CDP, derivatives through SGX-DC, with no cross-margin between the pools. A cash-plus-futures hedge therefore funds twice. JPX, with a single CCP, does not have this drag.',
      },
      {
        label: 'No single-stock derivatives',
        detail:
          'Listed options are index, commodity and FX only. There is no listed single-stock future or option to hedge a single-name book, and no listed borrow to synthesise one.',
      },
      {
        label: 'Concentration',
        detail:
          'Thirty STI names are roughly two thirds of market cap and three quarters of traded value, and the three banks are close to half the index. A "diversified" Singapore basket is less diversified than its name count suggests.',
      },
    ],
    hedging:
      'Index delta is hedgeable and deep; single-name delta depends on borrow, which is hard; single-name vega and gamma must go OTC. The closing window and Trade at Close are the two mechanisms that let a hedge be adjusted or worked at a known price near the close.',
  },
  hkex: {
    headline: 'Deep but China-linked, and the only one of the four that taxes the hedge.',
    points: [
      {
        label: 'Stamp duty is the cost',
        detail:
          '0.1% per side on stock trades. On a delta-hedging book that rebalances, this is a recurring cost and not a one-off: it is the largest single cost difference between these markets, and it is why cash hedging in Hong Kong is expensive relative to futures.',
      },
      {
        label: 'Closing Auction Session',
        detail:
          '16:00 to 16:10 determines the close. It is the window that protects a closing fixing from being influenced in thin trade, and it is the relevant window for any structure observing the Hong Kong close.',
      },
      {
        label: 'Fragmented clearing',
        detail:
          'HKSCC for cash, HKCC for futures, SEOCH for stock options, OTC Clear for OTC. Unlike JPX there is no single CCP spanning cash and derivatives, so cross-margining across the hedge is not automatic.',
      },
      {
        label: 'Not scripless',
        detail:
          'Physical certificates are still permitted, which affects settlement mechanics and is a structural difference from SGX and JPX.',
      },
      {
        label: 'H-shares are not A-shares',
        detail:
          'Different investor bases, capital controls and settlement mean the two listings trade at a persistent spread rather than converging. A structure that fixes on the A-share close while hedging the H-share owns that basis.',
      },
    ],
    hedging:
      'Index futures are liquid and are the practical hedge; the cash leg is taxed at 0.1% per side, so rebalancing through shares is expensive. Single-name options exist on HKEX (unlike SGX), but the single-name vol for the structures actually sold is still largely OTC.',
  },
  jpx: {
    headline: 'The deepest market of the four, and the only one with a single CCP across cash and derivatives.',
    points: [
      {
        label: 'Single CCP',
        detail:
          'JSCC clears both cash and derivatives. A hedged book margins in one pool, which is the structural advantage over SGX\u2019s split arrangement and a real funding difference on a large hedge.',
      },
      {
        label: 'Mid-month expiry',
        detail:
          'The SQ is computed from the opening prices of the index constituents on the second Friday, so Japanese futures expire mid-month rather than at month end. The roll date is a risk-management fact, not a detail.',
      },
      {
        label: 'No stamp duty',
        detail:
          'Exchange trades are stamp-duty-free, which makes the cash leg materially cheaper than Hong Kong\u2019s.',
      },
      {
        label: 'Session ends early in SGT terms',
        detail:
          'The 09:00-11:30 and 12:30-15:30 JST sessions are 08:00-10:30 and 11:30-14:30 SGT. JST is SGT+1 year-round, so there is no daylight-saving shift — but Tokyo is shut before the rest of the region has finished, which is why offshore listings matter.',
      },
      {
        label: 'Dividend season',
        detail:
          'The April dividend season coincides with Golden Week, which makes late April a dense period for dividend-sensitive structures and a period of thin liquidity in between holidays.',
      },
    ],
    hedging:
      'Nikkei and TOPIX futures are deep, but only the Nikkei has an offshore listing. A TOPIX hedge can only be adjusted inside the Tokyo session. The single CCP makes the funding cleaner than SGX, and the dividend season is a real event risk for anything with an April observation.',
  },
  asx: {
    headline: 'A clean, stamp-duty-free market with one unresolved complication: daylight saving.',
    points: [
      {
        label: 'Daylight saving is the caveat',
        detail:
          'The SGT times encoded here assume AEST (UTC+10). During AEDT (UTC+11) the whole session moves an hour earlier in SGT terms. That is why the microstructure drill excludes ASX from session-time questions rather than asking a question that is right for half the year.',
      },
      {
        label: 'Closing auction',
        detail:
          'The close is determined by auction, as at HKEX and SGX, so a closing fixing is protected in the same way. The session itself has no lunch break, unlike the other three.',
      },
      {
        label: 'Closing auction and index futures',
        detail:
          'SPI 200 futures expire on the third Thursday, which is a different convention from every other contract in the region and a common source of roll-date error.',
      },
      {
        label: 'Clearing and settlement',
        detail:
          'ASX Clear for cash and ASX Clear (Futures) for derivatives, with CHESS as the depository. No stamp duty on exchange trades.',
      },
    ],
    hedging:
      'Index futures are the hedge and the market is clean, but the DST shift means a hedge rolled on a fixed SGT clock will be mistimed for part of the year. Any session-dependent observation should be defined in local time, not SGT.',
  },
};
