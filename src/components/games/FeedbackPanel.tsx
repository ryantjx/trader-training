import type { MarkResult } from '../../lib/marking';
import { formatNumber } from '../../lib/money';
import type { Question, Response } from '../../lib/types';

export interface FeedbackPanelProps {
  question: Question;
  response: Response;
  result: MarkResult;
  /** Called when the trader continues to the next question. */
  onNext: () => void;
  isLast: boolean;
}

/**
 * The component that makes this a trainer rather than a quiz.
 *
 * A right/wrong flag teaches nothing. What changes behaviour is: the correct
 * answer, the method, the rule of thumb to memorise, and where the fact came
 * from. All four are shown, every time, for correct answers as well as wrong
 * ones, because getting the right answer by the wrong route is worth correcting.
 */
export function FeedbackPanel({ question, response, result, onNext, isLast }: FeedbackPanelProps) {
  const className = result.correct ? 'tt-feedback-correct' : 'tt-feedback-wrong';

  const submitted = (() => {
    if (response.kind === 'numeric') {
      return response.value === null ? 'no answer' : formatNumber(response.value, question.kind === 'numeric' ? question.decimals : 2);
    }
    if (response.kind === 'choice') {
      const option = question.kind === 'choice' ? question.options.find((o) => o.id === response.optionId) : undefined;
      return option?.label ?? 'no answer';
    }
    if (response.kind === 'text') {
      return response.text.trim() === '' ? 'no answer' : response.text.trim();
    }
    return response.kind === 'ordering' ? `position ${response.order.join(', ')}` : 'no answer';
  })();

  const expected = (() => {
    if (question.kind === 'numeric') {
      return `${formatNumber(question.answer, question.decimals)}${question.unit ? ` ${question.unit}` : ''}`;
    }
    if (question.kind === 'choice') {
      return question.options.find((o) => o.id === question.answerId)?.label ?? '';
    }
    if (question.kind === 'text') {
      return result.expectedText ?? question.answer;
    }
    return question.answerOrder.join(' → ');
  })();

  // Spellings the marker also accepts. Shown only for free text, where the
  // trader cannot see the option set and so cannot know how strict the match is.
  const alsoAccepted =
    question.kind === 'text' ? question.accept.filter((a) => a !== question.answer) : [];

  return (
    <div className={`tt-card ${className}`} role="status">
      <p style={{ marginTop: 0, fontWeight: 600 }}>
        {result.correct ? 'Correct' : 'Not quite'}
      </p>

      {!result.correct ? (
        <p style={{ marginBottom: '0.5rem' }}>
          You gave <span className="tt-mono">{submitted}</span>. The answer is{' '}
          <span className="tt-mono">{expected}</span>.
        </p>
      ) : (
        <p style={{ marginBottom: '0.5rem' }}>
          Answer: <span className="tt-mono">{expected}</span>
        </p>
      )}

      <p style={{ marginBottom: '0.5rem' }}>{question.explain}</p>

      {alsoAccepted.length > 0 ? (
        <p className="tt-citation" style={{ marginBottom: '0.5rem' }}>
          Also accepted: {alsoAccepted.join(' · ')}
        </p>
      ) : null}

      {question.anchor ? <p className="tt-anchor">Rule of thumb: {question.anchor}</p> : null}
      {question.citation ? <p className="tt-citation">Source: {question.citation}</p> : null}

      <div style={{ marginTop: '1rem' }}>
        <button type="button" onClick={onNext} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          {isLast ? 'See results' : 'Next question'}
        </button>
      </div>
    </div>
  );
}
