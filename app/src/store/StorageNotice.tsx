import { useState } from 'react';
import { Link } from '../router.tsx';
import {
  DELETE_MODE_PATH,
  SAVED_FULL,
  SAVED_LOADED,
  memoryNotice,
  dismissStoreNotice,
  retryStashed,
  useStoreStatus,
} from './open.ts';

/**
 * The one storage notice (flows §Errors, G8): "Saving is off in this browser; Export keeps a copy"
 * when there is no IndexedDB, and "Saved games are full. Delete old reviews?" after a save hit the
 * quota or the 200-game cap. The game just finished is kept, not dropped: the full notice offers
 * "Save this game", and a delete saves it too. A polite status, never focus. The "off" notice waits
 * for a page (never shown on the board or in the tutorial); the "full" one can only follow a
 * finished game.
 */
export function StorageNotice({ onBoard }: { onBoard: boolean }) {
  const s = useStoreStatus();
  const [said, setSaid] = useState('');
  const off = s.kind === 'memory' && !s.dismissed && !onBoard;
  // M10-R5: the database opened late and was taken.
  const loaded = s.kind === 'indexeddb' && s.lateLoaded && !s.dismissed && !onBoard;
  if (!off && !loaded && !s.full && !said) return null;
  const save = async () => {
    const n = await retryStashed();
    setSaid(n > 0 ? 'Saved. Your game is in Reviews.' : '');
  };
  return (
    <div className="notice storage-notice" role="status" data-testid="storage-notice">
      {s.full ? (
        <>
          <span>
            {SAVED_FULL}
            {s.pending > 0 &&
              (s.pending === 1
                ? ' Your last game is kept until there is room.'
                : ` Your ${s.pending} last games are kept until there is room.`)}
          </span>
          <Link className="btn" to={DELETE_MODE_PATH}>
            Open saved games
          </Link>
          {s.pending > 0 && (
            <button type="button" className="btn primary" onClick={() => void save()}>
              {s.pending === 1 ? 'Save this game' : 'Save these games'}
            </button>
          )}
        </>
      ) : loaded ? (
        <>
          <span>{SAVED_LOADED}</span>
          <button type="button" className="btn" onClick={dismissStoreNotice}>
            Dismiss
          </button>
        </>
      ) : said && !off ? (
        <>
          <span>{said}</span>
          <button type="button" className="btn" onClick={() => setSaid('')}>
            Dismiss
          </button>
        </>
      ) : (
        <>
          <span>
            {memoryNotice(s)} <Link to="/settings">Settings → Data</Link>
          </span>
          <button type="button" className="btn" onClick={dismissStoreNotice}>
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
