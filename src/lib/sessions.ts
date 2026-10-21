/**
 * Session data and SGT formatting.
 *
 * Every time on the site is displayed in **SGT (UTC+8)**, because the desk is
 * in Singapore and a single clock is what makes cross-venue comparison possible:
 * "JPX closes at 14:30 SGT" is a usable fact, "JPX closes at 15:30" is not,
 * because the reader has to know which clock it is on.
 *
 * Local times are kept alongside the SGT times rather than derived at render
 * time. They are the source of truth from the exchange rulebooks, and having
 * both makes the offset check explicit: a local time plus the offset must equal
 * the SGT time, and a test asserts exactly that for every venue.
 */
import sessionsData from '../data/sessions.json';

export interface Session {
  open: string;
  close: string;
}

export interface Venue {
  id: string;
  name: string;
  market: string;
  currency: string;
  /** Local timezone abbreviation, e.g. JST. */
  timezone: string;
  /** UTC offset in hours, standard time. */
  utcOffset: number;
  continuousSgt: Session[];
  continuousLocal: Session[];
  lunchSgt: Session[];
  auctionsSgt: { name: string; time: string }[];
  nonCancelSgt: string[];
  preOpenSgt: {
    start: string;
    end: string;
    randomEnd: string | null;
    note: string;
  } | null;
  tradeAtCloseSgt: string | null;
  marketCloseSgt: string;
  marketCloseLocal: string;
  halfDayCloseSgt: string | null;
  settlement: string;
  settlementMethod: string;
  clearingHouse: string;
  depository: string;
  scripless: boolean;
  stampDuty: string;
  dstNote: string | null;
}

export const SESSIONS = sessionsData as {
  asOf: string;
  displayTimezone: string;
  source: string;
  venues: Venue[];
};

export const VENUES: Venue[] = SESSIONS.venues;

export function venueById(id: string): Venue | undefined {
  return VENUES.find((venue) => venue.id === id);
}

/** "09:00–12:00 and 13:00–17:00" */
export function formatSessions(sessions: Session[]): string {
  return sessions.map((s) => `${s.open}–${s.close}`).join(' and ');
}

/** Total continuous trading minutes in a day, ignoring auctions. */
export function sessionMinutes(sessions: Session[]): number {
  return sessions.reduce((total, s) => total + (toMinutes(s.close) - toMinutes(s.open)), 0);
}

/** "HH:MM" -> minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Minutes since midnight -> "HH:MM", wrapping past midnight. */
export function toClock(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Convert a local time to SGT, using the venue's standard offset. Used by the
 * overview's offset check; the data itself is not derived this way.
 */
export function localToSgt(venue: Venue, hhmm: string): string {
  return toClock(toMinutes(hhmm) + (8 - venue.utcOffset) * 60);
}

/** The overlap between two venues' continuous sessions, in SGT. */
export function overlap(venue: Venue, other: Venue): minutesOverlap[] {
  const out: minutesOverlap[] = [];
  for (const a of venue.continuousSgt) {
    for (const b of other.continuousSgt) {
      const start = Math.max(toMinutes(a.open), toMinutes(b.open));
      const end = Math.min(toMinutes(a.close), toMinutes(b.close));
      if (end > start) out.push({ start: toClock(start), end: toClock(end) });
    }
  }
  return out;
}

interface minutesOverlap {
  start: string;
  end: string;
}

/** Every venue open at a given SGT time, used for the session grid. */
export function venuesOpenAt(hhmm: string): Venue[] {
  const t = toMinutes(hhmm);
  return VENUES.filter((venue) =>
    venue.continuousSgt.some((s) => t >= toMinutes(s.open) && t < toMinutes(s.close)),
  );
}
