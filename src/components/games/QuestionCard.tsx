import { hasResponse } from '../../lib/responses';
import type { Question, Response } from '../../lib/types';

/** Split a prompt on newlines so multi-line question data renders as rows. */
function PromptLines({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="tt-prompt">
      {lines.map((line, i) => (
        <div key={i} className={/^[A-Za-z].*:\s/.test(line) ? 'tt-mono' : undefined}>
          {line || '\u00a0'}
        </div>
      ))}
    </div>
  );
}

export interface QuestionCardProps {
  question: Question;
  response: Response;
  onChange: (response: Response) => void;
  /** Locked once the answer has been submitted. */
  locked: boolean;
  onSubmit: () => void;
  /** Remaining seconds, or null when untimed. */
  secondsLeft: number | null;
}

export function QuestionCard({
  question,
  response,
  onChange,
  locked,
  onSubmit,
  secondsLeft,
}: QuestionCardProps) {
  const hasAnswer = hasResponse(question, response);

  return (
    <div className="tt-card">
      <PromptLines text={question.prompt} />

      {question.context ? (
        <p className="tt-anchor" style={{ marginTop: '0.75rem' }}>{question.context}</p>
      ) : null}

      <div style={{ marginTop: '1rem' }}>
        {question.kind === 'numeric' ? (
          <NumericEntry
            value={response.kind === 'numeric' ? response.value : null}
            onChange={(v) => onChange({ kind: 'numeric', value: v })}
            disabled={locked}
            decimals={question.decimals}
            unit={question.unit}
            placeholder={question.placeholder}
            onSubmit={onSubmit}
          />
        ) : null}

        {question.kind === 'choice' ? (
          <ChoiceEntry
            options={question.options}
            selected={response.kind === 'choice' ? response.optionId : null}
            onChange={(id) => onChange({ kind: 'choice', optionId: id })}
            disabled={locked}
          />
        ) : null}

        {question.kind === 'ordering' ? (
          <OrderingEntry
            items={question.items}
            order={response.kind === 'ordering' ? response.order : question.items.map((i) => i.id)}
            onChange={(order) => onChange({ kind: 'ordering', order })}
            disabled={locked}
          />
        ) : null}

        {question.kind === 'text' ? (
          <TextEntry
            value={response.kind === 'text' ? response.text : ''}
            onChange={(text) => onChange({ kind: 'text', text })}
            disabled={locked}
            placeholder={question.placeholder}
            onSubmit={onSubmit}
          />
        ) : null}
      </div>

      <div className="tt-row" style={{ marginTop: '1.25rem' }}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={locked || !hasAnswer}
          style={{ padding: '0.5rem 1rem', cursor: locked || !hasAnswer ? 'not-allowed' : 'pointer' }}
        >
          {locked ? 'Answered' : 'Submit answer'}
        </button>

        {secondsLeft !== null && !locked ? (
          <span className="tt-timer" aria-live="off">
            {secondsLeft > 0 ? `${secondsLeft}s left` : 'Time'}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function NumericEntry({
  value,
  onChange,
  disabled,
  decimals,
  unit,
  placeholder,
  onSubmit,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
  decimals: number;
  unit?: string;
  placeholder?: string;
  onSubmit: () => void;
}) {
  // Kept as a string locally by the parent passing the parsed number back; the
  // input below renders from the numeric value, which is enough because the
  // drills never need to preserve trailing zeros mid-typing.
  return (
    <label className="tt-numeric" style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: '0.35rem' }}>
        Your answer{unit ? ` (in ${unit})` : ''} — {decimals} decimal place{decimals === 1 ? '' : 's'}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value === null ? '' : String(value)}
        disabled={disabled}
        placeholder={placeholder ?? (decimals === 0 ? '0' : `0.${'0'.repeat(decimals)}`)}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (raw === '' || raw === '-') {
            onChange(null);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value !== null && !disabled) onSubmit();
        }}
        style={{ padding: '0.4rem 0.6rem', minWidth: '12rem', fontSize: '1rem' }}
      />
    </label>
  );
}

function ChoiceEntry({
  options,
  selected,
  onChange,
  disabled,
}: {
  options: { id: string; label: string }[];
  selected: string | null;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup">
      {options.map((option) => (
        <label
          key={option.id}
          style={{ display: 'block', padding: '0.4rem 0', cursor: disabled ? 'default' : 'pointer' }}
        >
          <input
            type="radio"
            name="tt-choice"
            checked={selected === option.id}
            disabled={disabled}
            onChange={() => onChange(option.id)}
            style={{ marginRight: '0.6rem' }}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function TextEntry({
  value,
  onChange,
  disabled,
  placeholder,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  onSubmit: () => void;
}) {
  // No local state: the draft lives in the response object, so the answer
  // survives a re-render and is what the marker sees. Spelling aid is off,
  // because a browser autocorrect would hide the recall error being tested.
  return (
    <label className="tt-numeric" style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: '0.35rem' }}>
        Your answer — type the full name
      </span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder ?? 'Company name'}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim() !== '' && !disabled) onSubmit();
        }}
        autoComplete="off"
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={false}
        style={{ padding: '0.4rem 0.6rem', minWidth: '18rem', fontSize: '1rem' }}
      />
    </label>
  );
}

function OrderingEntry({
  items,
  order,
  onChange,
  disabled,
}: {
  items: { id: string; label: string }[];
  order: string[];
  onChange: (order: string[]) => void;
  disabled: boolean;
}) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    const a = next[index] as string;
    const b = next[target] as string;
    next[index] = b;
    next[target] = a;
    onChange(next);
  };

  return (
    <ol style={{ paddingLeft: '1.2rem' }}>
      {order.map((id, index) => (
        <li key={id} style={{ marginBottom: '0.4rem' }}>
          <span>{byId.get(id)?.label}</span>
          {!disabled ? (
            <span style={{ marginLeft: '0.75rem', whiteSpace: 'nowrap' }}>
              <button type="button" onClick={() => move(index, -1)} aria-label="Move up" style={{ marginRight: '0.25rem' }}>
                ↑
              </button>
              <button type="button" onClick={() => move(index, 1)} aria-label="Move down">
                ↓
              </button>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
