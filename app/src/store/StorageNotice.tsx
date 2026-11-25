import { Link } from '../router.tsx';
import {
  DELETE_MODE_PATH,
  SAVED_FULL,
  SAVING_OFF,
  dismissStoreNotice,
  useStoreStatus,
} from './open.ts';

/**
 * The one storage notice (flows §Errors, G8): "Saving is off in this browser; Export keeps a copy"
 * when there is no IndexedDB, and "Saved games are full. Delete old reviews?" after a save hit the
 * quota. A polite status, never focus. The "off" notice waits for a page (never shown on the board
 * or in the tutorial); the "full" one can only follow a finished game.
 */
export function StorageNotice({ onBoard }: { onBoard: boolean }) {
  const s = useStoreStatus();
  const off = s.kind === 'memory' && !s.dismissed && !onBoard;
  if (!off && !s.full) return null;
  return (
    <div className="notice storage-notice" role="status" data-testid="storage-notice">
      {s.full ? (
        <>
          <span>{SAVED_FULL}</span>
          <Link className="btn" to={DELETE_MODE_PATH}>
            Open saved games
          </Link>
        </>
      ) : (
        <>
          <span>
            {SAVING_OFF} <Link to="/settings">Settings → Data</Link>
          </span>
          <button type="button" className="btn" onClick={dismissStoreNotice}>
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
