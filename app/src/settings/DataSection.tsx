/**
 * Settings → Data (M8 WP5, flows F20): where saved games live and what the player can do with them.
 * Keep my saved games (asks the browser for persistent storage, only when pressed), Export
 * everything, Import a file (untrusted: validated, 50 MB cap, conflicts asked about), Delete all.
 * Native controls only; every result is spoken politely through `say`. Nothing is sent anywhere.
 */
import { useEffect, useRef, useState } from 'react';
import { importWithProgress } from '../progress/store.ts';
import { download } from '../tutorial/timing.ts';
import { conflictsOf, exportEverything, exportFileName, readImportFile } from '../store/data.ts';
import { getStore, type ImportReport } from '../store/index.ts';
import {
  memoryNotice,
  persistence,
  rehydrateStore,
  reportStoreError,
  requestPersistence,
  settleStore,
  useStoreStatus,
} from '../store/open.ts';
import { StoreQuotaError, type ExportBundle } from '../store/types.ts';
import { MAX_IMPORT_BYTES } from '../store/validate.ts';

interface Pending {
  bundle: ExportBundle;
  skipped: string[];
  conflicts: string[];
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function reportWords(r: ImportReport, skipped: number): string {
  const parts = [
    `Imported ${plural(r.added + r.replaced + r.keptBoth, 'game')}`,
    ...(r.replaced ? [`${r.replaced} replaced`] : []),
    ...(r.keptBoth ? [`${r.keptBoth} kept alongside the ones you had`] : []),
    ...(r.skipped ? [`${r.skipped} left out because saved games are full`] : []),
  ];
  return (
    parts.join(', ') +
    '.' +
    (skipped
      ? ` ${plural(skipped, 'item')} in the file could not be read and ${skipped === 1 ? 'was' : 'were'} left out.`
      : '')
  );
}

export function DataSection({
  say,
  onChanged,
}: {
  say: (words: string) => void;
  onChanged: () => void;
}) {
  const status = useStoreStatus();
  const [count, setCount] = useState<number | null>(null);
  const [persisted, setPersisted] = useState<'unsupported' | 'persisted' | 'not-persisted'>(
    'unsupported',
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const askRef = useRef<HTMLHeadingElement>(null);
  const [version, setVersion] = useState(0);
  const delRef = useRef<HTMLButtonElement>(null);
  const sureRef = useRef<HTMLButtonElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    let live = true;
    void getStore()
      .listGames()
      .then(
        (g) => live && setCount(g.length),
        () => live && setCount(null),
      );
    void persistence().then((p) => live && setPersisted(p));
    return () => {
      live = false;
    };
  }, [version]);

  useEffect(() => {
    if (pending) askRef.current?.focus();
  }, [pending]);

  // Focus follows the inline confirm: onto "Delete for good", and back to "Delete all" when it closes.
  useEffect(() => {
    if (confirming) sureRef.current?.focus();
    else if (touched.current) delRef.current?.focus();
  }, [confirming]);

  const refresh = () => setVersion((v) => v + 1);

  const keep = async () => {
    const ok = await requestPersistence();
    setPersisted(ok ? 'persisted' : 'not-persisted');
    say(
      ok
        ? 'Your browser will keep your saved games.'
        : 'Your browser did not agree to keep them. They stay until you or the browser clear site data.',
    );
  };

  const exportAll = async () => {
    setBusy(true);
    try {
      await settleStore();
      const text = await exportEverything(getStore());
      download(exportFileName(), text, 'application/json');
      say(
        text.length > MAX_IMPORT_BYTES
          ? 'Exported everything to a file. It is larger than the 50 MB that Import accepts, so delete some old games, or export single games from Reviews, to import it again.'
          : 'Exported everything to a file.',
      );
    } catch {
      say('The export failed. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };

  const pick = async (file: File | undefined) => {
    setProblems([]);
    if (!file) return;
    setBusy(true);
    try {
      const parsed = await readImportFile(file);
      if (!parsed.ok) {
        say(parsed.error);
        setProblems([parsed.error]);
        return;
      }
      const conflicts = await conflictsOf(getStore(), parsed.bundle);
      if (conflicts.length === 0) await finish(parsed.bundle, parsed.skipped, 'replace');
      else setPending({ bundle: parsed.bundle, skipped: parsed.skipped, conflicts });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const finish = async (bundle: ExportBundle, skipped: string[], how: 'replace' | 'keep-both') => {
    setPending(null);
    try {
      const r = await importWithProgress(getStore(), bundle, how);
      await rehydrateStore();
      setProblems(skipped);
      say(reportWords(r, skipped.length));
      refresh();
      onChanged();
    } catch (e) {
      reportStoreError(e);
      say(
        e instanceof StoreQuotaError
          ? 'Saved games are full, so nothing was imported. Delete old reviews first.'
          : 'The import failed. Nothing was changed.',
      );
    }
    fileRef.current?.focus();
  };

  const cancelImport = () => {
    setPending(null);
    say('Import cancelled. Nothing was changed.');
    fileRef.current?.focus();
  };

  const deleteAll = async () => {
    setConfirming(false);
    try {
      await settleStore();
      await getStore().deleteAll();
      await rehydrateStore();
      say('Deleted every saved game, review and log.');
      refresh();
      onChanged();
    } catch {
      say('Deleting failed. Nothing was changed.');
    }
  };

  return (
    <section aria-labelledby="set-data">
      <h2 id="set-data">Data</h2>
      <p className="subtle">
        Saved games, their reviews, the tutorial log and your lethal progress live in this browser
        only. Nothing is sent anywhere. Progress is included in Export and Import. Decks and the
        settings above are kept separately.
      </p>
      {status.kind === 'memory' && (
        <p className="set-warn" role="note">
          {memoryNotice(status)}
        </p>
      )}
      <p data-testid="data-count">
        {count === null
          ? 'Saved games: not available.'
          : count === 0
            ? 'No saved games yet.'
            : `${plural(count, 'saved game')} in this browser.`}
      </p>

      <div className="set-row set-check">
        <div>
          <p>
            <button
              type="button"
              className="btn"
              aria-describedby="set-keep-hint"
              aria-disabled={persisted !== 'not-persisted' || undefined}
              onClick={() => persisted === 'not-persisted' && void keep()}
            >
              Keep my saved games
            </button>
          </p>
          <p className="subtle" id="set-keep-hint">
            {persisted === 'persisted'
              ? 'Your browser has agreed to keep them.'
              : persisted === 'unsupported'
                ? 'This browser cannot be asked to keep them. Export is the way to keep a copy.'
                : 'Asks the browser not to clear them when it is short of space. It may say no.'}
          </p>
        </div>
      </div>

      <p>
        <button type="button" className="btn" disabled={busy} onClick={() => void exportAll()}>
          Export everything
        </button>
      </p>

      <div className="set-row">
        <label htmlFor="set-import">Import a file</label>
        <input
          id="set-import"
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-describedby="set-import-hint"
          disabled={busy}
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </div>
      <p className="subtle" id="set-import-hint">
        An OPTCG Sim export, up to 50 MB. It is checked first, and anything in it that is not
        recognised is left out.
      </p>

      {pending && (
        <div
          className="set-ask"
          role="group"
          aria-labelledby="set-import-q"
          onKeyDown={(e) => e.key === 'Escape' && cancelImport()}
        >
          <h3 id="set-import-q" tabIndex={-1} ref={askRef}>
            {plural(pending.conflicts.length, 'game')} in this file{' '}
            {pending.conflicts.length === 1 ? 'is' : 'are'} already saved here
          </h3>
          <p className="subtle">
            Replace puts the file’s copy over yours. Keep both saves the file’s copy next to yours.
          </p>
          <span className="set-btns">
            <button
              type="button"
              className="btn"
              onClick={() => void finish(pending.bundle, pending.skipped, 'replace')}
            >
              Replace {pending.conflicts.length}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void finish(pending.bundle, pending.skipped, 'keep-both')}
            >
              Keep both
            </button>
            <button type="button" className="btn" onClick={cancelImport}>
              Cancel
            </button>
          </span>
        </div>
      )}

      {problems.length > 0 && (
        <ul className="set-list" aria-label="Left out of the import">
          {problems.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}

      <p>
        {confirming ? (
          <span className="set-btns">
            <button type="button" className="btn" ref={sureRef} onClick={() => void deleteAll()}>
              Delete for good<span className="sr-only">: every saved game, review and log</span>
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn"
            ref={delRef}
            onClick={() => {
              touched.current = true;
              setConfirming(true);
            }}
          >
            Delete all saved games
          </button>
        )}
      </p>
      {confirming && (
        <p className="subtle">
          This deletes every saved game, review, tutorial run and lethal progress in this browser.
          It cannot be undone; Export first to keep a copy.
        </p>
      )}
    </section>
  );
}
