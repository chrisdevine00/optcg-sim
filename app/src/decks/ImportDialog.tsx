/**
 * Import a deck list (flows F17 step 4): paste or drop a file, see a line-by-line report, fix or
 * drop each problem line, then import. Nothing changes until "Import N cards".
 */
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { parseDeckText, type Card } from '@optcg/cards';
import { deckIssues, type DeckFormat } from '@optcg/engine';
import { sanitizeJsonDeck } from './keys.ts';

const BLOCKING = new Set(['unknownCard', 'syntax', 'extraLeader']);

export function ImportDialog({
  cards,
  leader,
  format,
  draft,
  onDraft,
  onImport,
  onClose,
}: {
  /** The text from the last time the dialog was open: Esc never loses a pasted list (M6-16). */
  draft: string;
  onDraft: (text: string) => void;
  cards: ReadonlyMap<string, Card>;
  /** The deck's current Leader: used when the list has none. */
  leader: string | null;
  format: Exclude<DeckFormat, 'free'>;
  onImport: (deck: { leader: string; main: string[] }) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setTextState] = useState(draft);
  const setText = (t: string) => {
    setTextState(t);
    onDraft(t);
  };
  useEffect(() => {
    const d = ref.current!;
    // No close() on cleanup: StrictMode's second run would fire `close` and unmount the dialog.
    if (!d.open) d.showModal();
    // The paste box is where the dialog starts (M6-16); showModal would pick Close.
    d.querySelector<HTMLTextAreaElement>('#import-text')?.focus();
  }, []);

  const lookup = (id: string) => cards.get(id);
  const byName = useMemo(() => {
    const m = new Map<string, Card[]>();
    for (const c of cards.values()) {
      const k = c.name.toLowerCase();
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return (n: string) => m.get(n.toLowerCase()) ?? [];
  }, [cards]);
  // Parsing is cheap; it runs on every edit so the report is always current.
  // A JSON entry the parser would clamp or ignore is named first and left out (review M6-11).
  const json = useMemo(() => sanitizeJsonDeck(text), [text]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsed = useMemo(() => parseDeckText(json.text, lookup, byName), [json, cards, byName]);
  const useLeader = parsed.leader ?? leader;
  const issues = useMemo(
    () => (useLeader ? deckIssues({ leader: useLeader, main: parsed.main }, lookup, format) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useLeader, parsed.main, format, cards],
  );
  const problems = parsed.lines.filter((l) => BLOCKING.has(l.status));
  const read = parsed.lines.length;
  const okCount = read - problems.length;
  const skipped = json.problems;
  const problemCount = problems.length + skipped.length;
  const blocker = problems[0]
    ? `Fix or drop line ${problems[0].line} first`
    : !useLeader
      ? 'Add a Leader line (1xOP17-039) first'
      : parsed.main.length === 0
        ? 'Paste a list first'
        : null;

  const lines = text.split(/\r?\n/);
  const setLine = (n: number, to: string | null) => {
    const next = lines.slice();
    if (to === null) next.splice(n - 1, 1);
    else next[n - 1] = to;
    setText(next.join('\n'));
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) void f.text().then(setText);
  };
  const lineNote = (id: string | undefined): string[] =>
    id ? issues.filter((i) => i.cards.includes(id)).map((i) => i.message) : [];

  const summary =
    read === 0 && skipped.length === 0
      ? 'Nothing read yet.'
      : `${read} lines read · ${okCount} OK · ${problemCount} problem${problemCount === 1 ? '' : 's'}`;

  return (
    <dialog
      ref={ref}
      className="deck-dialog"
      aria-labelledby="import-title"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="deck-dialog-head">
        <h2 id="import-title">Import a deck</h2>
        <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="deck-dialog-body import-body">
        <div className="field" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <label htmlFor="import-text">Paste a list, or drop a .txt or .json file</label>
          <textarea
            id="import-text"
            className="input import-text"
            value={text}
            spellCheck={false}
            onChange={(e) => setText(e.target.value)}
            placeholder={'1xOP17-039\n4xOP17-040\n4 Nami OP01-016'}
          />
          <p className="hint">
            Formats: 4xOP01-016 · 4 OP01-016 · 4 Name OP01-016, or this app’s JSON.
          </p>
        </div>
        <div className="import-report">
          <p className="import-summary" role="status">
            {summary}
            {read > 0 && problems[0]
              ? `: line ${problems[0].line}, ${firstSentence(problems[0].message ?? '')}`
              : skipped[0]
                ? `: ${skipped[0].charAt(0).toLowerCase()}${skipped[0].slice(1)}`
                : ''}
          </p>
          {skipped.length > 0 && (
            <ul className="import-skipped" aria-label="Entries skipped">
              {skipped.map((m) => (
                <li key={m} className="bad">
                  <span className="danger">{m}</span>
                </li>
              ))}
            </ul>
          )}
          <ol className="import-lines">
            {parsed.lines.map((l) => {
              const bad = BLOCKING.has(l.status);
              const notes = [
                ...(l.status === 'nameMismatch' && l.message ? [l.message] : []),
                ...(bad ? [] : lineNote(l.id)),
              ];
              return (
                <li key={l.line} className={bad ? 'bad' : notes.length ? 'warn' : ''}>
                  <span className="import-n">Line {l.line}</span>
                  <span>
                    {bad ? (
                      <>
                        <span className="danger">{l.message}</span>
                        <span className="import-fixes">
                          {l.suggestion && (
                            <button
                              type="button"
                              className="btn small"
                              onClick={() => setLine(l.line, `${l.count ?? 1}x${l.suggestion}`)}
                            >
                              Use {l.suggestion}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => setLine(l.line, null)}
                          >
                            Drop line
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">✓ </span>
                        <span className="num">
                          {l.status === 'leader' ? 'Leader ' : `${l.count} × `}
                          {l.id}
                        </span>{' '}
                        {cards.get(l.id!)?.name}
                        {notes.map((n) => (
                          <span key={n} className="import-note">
                            {n}
                          </span>
                        ))}
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div className="deck-dialog-foot">
        <span className="muted small">Nothing changes until you import.</span>
        <span className="spacer" />
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        {blocker && <span className="danger small">{blocker}</span>}
        <button
          type="button"
          className="btn primary"
          disabled={!!blocker}
          onClick={() => onImport({ leader: useLeader!, main: parsed.main })}
        >
          Import {parsed.main.length} cards
        </button>
      </div>
    </dialog>
  );
}

/** "Unknown card ID OP17-999. The name..." → "unknown card ID OP17-999" (for the summary line). */
function firstSentence(m: string): string {
  const one = m.split(/\.\s/)[0]!.replace(/\.$/, '');
  return one.charAt(0).toLowerCase() + one.slice(1);
}
