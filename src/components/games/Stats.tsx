import { useEffect, useState } from 'react';
import { CATEGORY_LABELS, type Category } from '../../lib/types';
import { createLocalStore, type DailyResult } from '../../lib/storage';
import { formatDuration } from '../../lib/scoring';
import { weakEntries, type SrsEntry } from '../../lib/srs';

/**
 * Progress view. Reads from localStorage on mount only, so the static build does
 * not attempt to touch a store that is not there.
 *
 * No streak is shown: streaks were excluded by decision. What is shown instead is
 * what the trader can actually act on: per-category accuracy, personal bests,
 * recent history, and the concepts that keep being missed.
 */
export function Stats() {
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<DailyResult[]>([]);
  const [weak, setWeak] = useState<SrsEntry[]>([]);
  const [parityBest, setParityBest] = useState<ReturnType<ReturnType<typeof createLocalStore>['getParityBest']>>(null);

  useEffect(() => {
    const store = createLocalStore();
    setHistory(store.recentDaily(60));
    setWeak(weakEntries(store.getSrs()));
    setParityBest(store.getParityBest());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <p className="tt-citation">Loading your progress from this browser…</p>;
  }

  if (history.length === 0) {
    return (
      <div className="tt-card">
        <p style={{ marginTop: 0 }}>No history yet in this browser.</p>
        <p className="tt-citation">
          Progress is stored locally. It will not follow you to another device, and clearing site data
          will clear it. Use export on the About page if you want a backup.
        </p>
      </div>
    );
  }

  // Aggregate per category across all history.
  const byCategory = new Map<Category, { correct: number; total: number }>();
  for (const day of history) {
    for (const answer of day.answers) {
      const entry = byCategory.get(answer.category) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (answer.correct) entry.correct += 1;
      byCategory.set(answer.category, entry);
    }
  }

  const totalCorrect = history.reduce((s, d) => s + d.score.correct, 0);
  const totalQuestions = history.reduce((s, d) => s + d.score.total, 0);

  return (
    <div>
      <h2>Progress</h2>

      <p className="tt-mono" style={{ fontSize: '1.2rem' }}>
        {totalCorrect} / {totalQuestions} across {history.length} set{history.length === 1 ? '' : 's'}
        {totalQuestions > 0 ? ` · ${Math.round((totalCorrect / totalQuestions) * 100)}%` : ''}
      </p>

      <h3>By category</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', paddingRight: '1.5rem' }}>Category</th>
            <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Correct</th>
            <th style={{ textAlign: 'right' }}>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {[...byCategory.entries()]
            .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
            .map(([category, s]) => (
              <tr key={category}>
                <td style={{ textAlign: 'left', paddingRight: '1.5rem' }}>{CATEGORY_LABELS[category]}</td>
                <td className="tt-mono" style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                  {s.correct} / {s.total}
                </td>
                <td className="tt-mono" style={{ textAlign: 'right' }}>
                  {Math.round((s.correct / s.total) * 100)}%
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {parityBest ? (
        <>
          <h3>Personal bests</h3>
          <p className="tt-mono">
            Put-call parity: {parityBest.score}/{parityBest.total} in {formatDuration(parityBest.elapsedMs)}
          </p>
        </>
      ) : null}

      {weak.length > 0 ? (
        <>
          <h3>Concepts to revisit</h3>
          <p className="tt-citation">
            Ordered by how often they have been missed. These are the questions the review round
            draws from first.
          </p>
          <ul>
            {weak.slice(0, 12).map((entry) => (
              <li key={entry.signature} className="tt-mono" style={{ marginBottom: '0.3rem' }}>
                {entry.signature} — missed {entry.lapses}x, box {entry.box}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>Recent sets</h3>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', paddingRight: '1.5rem' }}>Date</th>
            <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Score</th>
            <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Accuracy</th>
            <th style={{ textAlign: 'right' }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {history.slice(0, 20).map((day) => (
            <tr key={day.dateKey}>
              <td className="tt-mono" style={{ textAlign: 'left', paddingRight: '1.5rem' }}>{day.dateKey}</td>
              <td className="tt-mono" style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                {day.score.correct} / {day.score.total}
              </td>
              <td className="tt-mono" style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                {day.score.accuracy}%
              </td>
              <td className="tt-mono" style={{ textAlign: 'right' }}>{formatDuration(day.score.elapsedMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
