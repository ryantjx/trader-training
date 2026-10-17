import { useEffect, useState } from 'react';
import { createLocalStore } from '../../lib/storage';

/**
 * Export and import of local progress.
 *
 * This exists because progress lives in localStorage, which is fragile: a
 * browser wipe loses everything. It is also the natural seam if a leaderboard is
 * ever added, since the exported payload is the whole stored state.
 */
export function ProgressTransfer() {
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [payload, setPayload] = useState('');

  useEffect(() => {
    setPayload(createLocalStore().export());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="tt-card">
      <h3 style={{ marginTop: 0 }}>Back up your progress</h3>
      <p className="tt-citation">
        Progress is stored only in this browser. Copy the text below to keep a backup, or paste a
        previous backup and restore it.
      </p>

      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={8}
        spellCheck={false}
        style={{ width: '100%', fontFamily: 'var(--tt-mono)', fontSize: '0.8rem' }}
      />

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(payload);
            setMessage('Copied to the clipboard.');
          }}
          style={{ padding: '0.4rem 0.9rem', cursor: 'pointer' }}
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => {
            const ok = createLocalStore().import(payload);
            setMessage(ok ? 'Progress restored.' : 'That payload could not be read.');
          }}
          style={{ padding: '0.4rem 0.9rem', cursor: 'pointer' }}
        >
          Restore from this text
        </button>
        <button
          type="button"
          onClick={() => {
            createLocalStore().clear();
            setPayload(createLocalStore().export());
            setMessage('All local progress cleared.');
          }}
          style={{ padding: '0.4rem 0.9rem', cursor: 'pointer' }}
        >
          Clear progress
        </button>
      </div>

      {message ? <p className="tt-anchor">{message}</p> : null}
    </div>
  );
}
