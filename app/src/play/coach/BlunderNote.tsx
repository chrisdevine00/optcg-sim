/**
 * The blunder warning's inline note (learning-ui §2.8): the claim and the better move, directly
 * above the commit control. No dialog. Its text is the commit control's accessible description.
 */
import { actionKey } from '@optcg/ai';
import type { G } from '../game/ui.ts';
import { KIND_WORDS } from './blunder.ts';
import { stagedText } from './HintSection.tsx';

export const BLUNDER_NOTE_ID = 'blunder-note';

/** "Commit anyway" replaces the primary button's label when that button commits the held action. */
export function blunderCommitLabel(g: G): string | undefined {
  const n = g.ctl.blunder.note;
  return n && n.action.type === 'endTurn' ? 'Commit anyway' : undefined;
}

export function BlunderNote({ g }: { g: G }) {
  const guard = g.ctl.blunder;
  const n = guard.note;
  // A hidden marker while the warning is on: its state, for tests and for support.
  const marker =
    guard.status === 'off' ? null : (
      <span hidden data-testid="blunder-status" data-blunder={guard.status} />
    );
  if (!n || !g.mine) return marker;
  const { warning } = n;
  const better = warning.better;
  const k = better ? actionKey(better) : null;
  const betterLegal = k !== null && g.ctl.actions().some((a) => actionKey(a) === k);
  const primaryRelabelled = blunderCommitLabel(g) !== undefined;
  return (
    <>
      {marker}
      <div className="blunder-note" role="group" aria-label="Warning before you commit">
        <p id={BLUNDER_NOTE_ID}>
          <b>{warning.explanation.claim}</b>
          {warning.explanation.outcome ? ` ${warning.explanation.outcome}` : ''}
          {betterLegal && better ? ` Instead: ${stagedText(g, better)}.` : ''}
        </p>
        <div className="coach-actions">
          {betterLegal && (
            <button type="button" className="btn small primary" onClick={() => guard.useBetter()}>
              Use the better choice
            </button>
          )}
          {!primaryRelabelled && (
            <button type="button" className="btn small" onClick={() => guard.commitAnyway()}>
              Commit anyway
            </button>
          )}
          <button type="button" className="btn small" onClick={() => guard.muteKind()}>
            Don’t warn me about this
            <span className="sr-only"> ({KIND_WORDS[warning.kind] ?? warning.kind})</span>
          </button>
        </div>
      </div>
    </>
  );
}
