/** Export a deck list (flows F17 step 5): three text formats or JSON; Copy or Download. */
import { useEffect, useRef, useState } from 'react';
import { exportDeckJson, exportDeckText, type Card, type DeckTextFormat } from '@optcg/cards';

type Fmt = DeckTextFormat | 'json';
const LABEL: Record<Fmt, string> = {
  limitless: '4 Name OP01-016 (Limitless)',
  compact: '4xOP01-016',
  count: '4 OP01-016',
  json: 'JSON (this app)',
};

export function ExportDialog({
  name,
  deck,
  cards,
  onClose,
}: {
  name: string;
  deck: { leader: string; main: string[] };
  cards: ReadonlyMap<string, Card>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [fmt, setFmt] = useState<Fmt>('limitless');
  const [copied, setCopied] = useState('');
  useEffect(() => {
    const d = ref.current!;
    // No close() on cleanup: StrictMode's second run would fire `close` and unmount the dialog.
    if (!d.open) d.showModal();
  }, []);
  const text =
    fmt === 'json'
      ? exportDeckJson(deck, name)
      : exportDeckText(deck, fmt, (id) => cards.get(id)?.name ?? '');
  const copy = () => {
    void navigator.clipboard?.writeText(text).then(
      () => setCopied('Copied to the clipboard.'),
      () => setCopied('Copy failed: select the text and copy it.'),
    );
  };
  const download = () => {
    const blob = new Blob([text], { type: fmt === 'json' ? 'application/json' : 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name.replace(/[^\w.-]+/g, '_') || 'deck'}.${fmt === 'json' ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <dialog
      ref={ref}
      className="deck-dialog narrow"
      aria-labelledby="export-title"
      onClose={onClose}
    >
      <div className="deck-dialog-head">
        <h2 id="export-title">Export “{name}”</h2>
        <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="deck-dialog-body">
        <fieldset className="field">
          <legend>Format</legend>
          <div className="export-formats">
            {(Object.keys(LABEL) as Fmt[]).map((f) => (
              <label key={f} className="check">
                <input
                  type="radio"
                  name="export-format"
                  checked={fmt === f}
                  onChange={() => {
                    setFmt(f);
                    setCopied('');
                  }}
                />
                {LABEL[f]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="sr-only" htmlFor="export-text">
          Deck list
        </label>
        <textarea id="export-text" className="input import-text" readOnly value={text} />
        <p className="small muted" role="status">
          {copied}
        </p>
      </div>
      <div className="deck-dialog-foot">
        <span className="spacer" />
        <button type="button" className="btn" onClick={download}>
          Download
        </button>
        <button type="button" className="btn primary" onClick={copy}>
          Copy
        </button>
      </div>
    </dialog>
  );
}
