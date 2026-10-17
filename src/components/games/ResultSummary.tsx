import { CATEGORY_LABELS } from '../../lib/types';
import { formatDuration, type SessionScore } from '../../lib/scoring';

export interface ResultSummaryProps {
  dateKey: string;
  score: SessionScore;
  onRestart: () => void;
  /** Optional extra line, used by the standalone games. */
  footnote?: string;
}

export function ResultSummary({ dateKey, score, onRestart, footnote }: ResultSummaryProps) {
  return (
    <div className="tt-card">
      <h2 style={{ marginTop: 0 }}>Set complete</h2>
      <p className="tt-citation" style={{ marginTop: 0 }}>
        {dateKey}
      </p>

      <p className="tt-mono" style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
        {score.correct} / {score.total} · {score.accuracy}%
      </p>

      <p className="tt-mono">
        {formatDuration(score.elapsedMs)} total · {formatDuration(score.meanMs)} per question
      </p>

      {score.byCategory.length > 0 ? (
        <table style={{ marginTop: '1rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingRight: '1.5rem' }}>Category</th>
              <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Correct</th>
              <th style={{ textAlign: 'right' }}>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {score.byCategory.map((c) => (
              <tr key={c.category}>
                <td style={{ textAlign: 'left', paddingRight: '1.5rem' }}>{CATEGORY_LABELS[c.category]}</td>
                <td className="tt-mono" style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                  {c.correct} / {c.total}
                </td>
                <td className="tt-mono" style={{ textAlign: 'right' }}>
                  {c.accuracy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {footnote ? <p className="tt-anchor">{footnote}</p> : null}

      <p className="tt-citation">
        The categories are ranked separately on the stats page, because recall and arithmetic are
        different skills and a single blended number hides which one is failing.
      </p>

      <div style={{ marginTop: '1rem' }}>
        <button type="button" onClick={onRestart} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Play again
        </button>
      </div>
    </div>
  );
}
