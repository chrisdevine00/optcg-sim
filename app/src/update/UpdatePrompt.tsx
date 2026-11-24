import { useSyncExternalStore } from 'react';
import { applyUpdate, subscribeUpdates, waitingUpdate } from './updates.ts';

/**
 * "A new version is ready" (ARCHITECTURE §5). Rendered by the page shell only, never on the game
 * screen, so it cannot interrupt a game; the player chooses when to reload.
 */
export function UpdatePrompt() {
  const w = useSyncExternalStore(subscribeUpdates, waitingUpdate, () => null);
  if (!w) return null;
  return (
    <div className="notice update-prompt" role="status">
      <span>A new version of the app is ready, with the latest cards and fixes.</span>
      <button type="button" className="btn" onClick={applyUpdate}>
        Reload to update
      </button>
    </div>
  );
}
