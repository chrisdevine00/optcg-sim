/**
 * The one component that renders an `Explanation` (learning-ui §2.3): claim, certainty chip, line,
 * outcome, evidence, next time, lesson and sources, in the reading order the verbosity sets. At
 * Learner verbosity the line and the outcome come before the evidence. "Show" buttons ask the
 * caller to light a step's cards on the board (or the restored board in review).
 */
import { useState } from 'react';
import { certaintyLabel, type Explanation, type ExplanationContext } from '@optcg/ai';

export type Verbosity = 'learner' | 'standard' | 'terse';

/** "L15-lethal-math" → "Lethal math (L15)". */
export function lessonName(id: string): string {
  const m = /^(L\d+)-(.*)$/.exec(id);
  if (!m) return id;
  const words = m[2]!.replace(/-/g, ' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} (${m[1]})`;
}

const SHAPE: Record<Explanation['certainty'], string> = {
  'any-hand': '✓',
  'needed-hidden-info': '◉',
  'search-incomplete': '◌',
};

const TIP: Record<Explanation['certainty'], string> = {
  'any-hand': 'This works against every hand they could have had, using only what you could see.',
  'needed-hidden-info':
    'This only works against the hand they actually held, which you couldn’t see. Shown to help you read hands, not as a mistake.',
  'search-incomplete':
    'The analysis ran out of time on this turn. It found no proof either way. Analyse deeper?',
};

/** The live coach speaks of the lists we know and of what you can see now (review L-04). */
const TIP_LIVE_ANY =
  'This line beats every hand their deck could be holding, judged from the cards you can see now and the sourced lists for their deck.';

export function CertaintyChip({
  certainty,
  context,
  id,
  caveat,
}: {
  certainty: Explanation['certainty'];
  context: ExplanationContext;
  id?: string;
  /** The Trigger caveat, when it applies (learning-ui §3.1). */
  caveat?: string | null;
}) {
  const live = context === 'coach' && certainty === 'any-hand';
  const tip = `${live ? TIP_LIVE_ANY : TIP[certainty]}${caveat ? ` ${caveat}` : ''}`;
  return (
    <p className={`chip outline why-certainty cert-${certainty}`} id={id} title={tip}>
      <span aria-hidden="true">{SHAPE[certainty]} </span>
      {certaintyLabel(certainty, context)}
    </p>
  );
}

export function ExplanationView({
  ex,
  context,
  verbosity = 'standard',
  idPrefix = 'ex',
  onShow,
  headingLevel = 3,
  extra,
  caveat,
}: {
  ex: Explanation;
  context: ExplanationContext;
  verbosity?: Verbosity;
  idPrefix?: string;
  /** Light the cards of line step `i` (0-based). Omitted: no Show buttons. */
  onShow?: (i: number) => void;
  headingLevel?: 2 | 3 | 4;
  /** Shown after the outcome (for example "Count it with me"). */
  extra?: React.ReactNode;
  /** The Trigger caveat for the certainty chip's tooltip. */
  caveat?: string | null;
}) {
  const [more, setMore] = useState(false);
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const learner = verbosity === 'learner';
  const terse = verbosity === 'terse';
  const open = learner || more;
  const evidence =
    ex.evidence.length > 0 ? (
      <section aria-label="Why it works" key="evidence">
        {learner && <p className="ex-sub">Why it works</p>}
        <ul className="why-evidence" aria-label="Why it works">
          {ex.evidence.map((x, i) => (
            <li key={i}>{x.text}</li>
          ))}
        </ul>
      </section>
    ) : null;
  const rest = (
    <>
      {ex.nextTime && (
        <p className="why-next">
          <b>Next time:</b> {ex.nextTime}
        </p>
      )}
      {ex.lessonId && <p className="subtle">Lesson: {lessonName(ex.lessonId)}</p>}
      {ex.sources.length > 0 && (
        <details>
          <summary>Sources</summary>
          <p className="subtle">{ex.sources.join(' · ')}</p>
        </details>
      )}
    </>
  );
  return (
    <section className="ex" aria-labelledby={`${idPrefix}-claim`} data-verbosity={verbosity}>
      <H id={`${idPrefix}-claim`} className="why-claim">
        {ex.claim}
      </H>
      {!terse && <CertaintyChip certainty={ex.certainty} context={context} caveat={caveat} />}
      {!terse && ex.line && ex.line.length > 0 && (
        <ol className="why-line ex-line" aria-label="The line">
          {ex.line.map((m, i) => (
            <li key={i}>
              <span className="ex-n" aria-hidden="true">
                {i + 1}.
              </span>
              <span className="ex-text">{m.text}</span>
              {onShow && (
                <button
                  type="button"
                  className="linkbtn ex-show"
                  aria-label={`Show step ${i + 1} on the board: ${m.text}`}
                  onClick={() => onShow(i)}
                >
                  Show
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {ex.outcome && (
        <p className="why-outcome">
          <span className="chip outline ex-outcome">{ex.outcome}</span>
        </p>
      )}
      {extra}
      {!terse && learner && evidence}
      {!terse && learner && rest}
      {!terse && !learner && (ex.evidence.length > 0 || ex.nextTime) && (
        <button
          type="button"
          className="linkbtn"
          aria-expanded={open}
          onClick={() => setMore(!more)}
        >
          {more ? 'Less' : 'More: why it works'}
        </button>
      )}
      {!terse && !learner && more && (
        <>
          {evidence}
          {rest}
        </>
      )}
      {terse && (
        <button
          type="button"
          className="linkbtn"
          aria-expanded={more}
          onClick={() => setMore(!more)}
        >
          {more ? 'Less' : 'More'}
        </button>
      )}
      {terse && more && (
        <>
          <CertaintyChip certainty={ex.certainty} context={context} />
          {evidence}
          {rest}
        </>
      )}
    </section>
  );
}
