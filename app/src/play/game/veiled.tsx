/**
 * The veiled hotseat panel (review M3-35, M3-39). When a seat owes its own effect decision while
 * its hand is veiled, the other player may be looking, so this panel is a pure function of public
 * information. The type boundary enforces it: `VeiledProps` holds a `PublicView` (made only by the
 * session's `publicView`), the seat's name, and callbacks. It has no access to private legal
 * answers, the private view, the controller or the session, so nothing on screen can vary with
 * hidden cards. Whether "Use" can be paid is checked only after the press, by the controller.
 */
import type { ReactNode } from 'react';
import { SCRIPTS } from '@optcg/cards';
import type { PublicView } from '../../session/index.ts';

export interface VeiledProps {
  /** Only what both players may see (session.publicView). */
  readonly view: PublicView;
  readonly seatName: string;
  /**
   * Whether Use will show the hand first (review M3-41): from the public log and the public
   * script only, so it is the same for any hidden cards. Null when the public log cannot tell.
   */
  readonly usesHand: boolean | null;
  /** Show the hand (a sticky reveal); the full private decision follows. */
  readonly onShow: () => void;
  /** Optional decisions: answer yes. The controller checks payability after the press. */
  readonly onUse: () => void;
  /** Optional decisions: answer no. Always allowed. */
  readonly onSkip: () => void;
}

export interface VeiledContent {
  title: string;
  body: ReactNode;
  /** Footer buttons: optional decisions get Use and Skip, both always enabled. */
  foot: { use: () => void; skip: () => void } | null;
}

const HIDDEN_ZONE = /"(from|zone|in)":"(hand|deck|life)"|lookAt|reveal|"handSize"|"lifeCount"/;

/**
 * Does the ability read a zone the other player cannot see (its cost, condition or effect)?
 * Judged from the script's public shape (card text is public). An unknown ability counts as yes.
 */
export function readsHiddenZone(source: { card: string; ability: string } | undefined): boolean {
  if (!source) return true;
  const ability = SCRIPTS[source.card]?.abilities.find((a) => a.id === source.ability);
  if (!ability) return true;
  return HIDDEN_ZONE.test(JSON.stringify(ability));
}

/**
 * Can this veiled decision be answered as it is? From public facts only: optional decisions can
 * (Use and Skip; Use on an ability that reads a hidden zone asks for the reveal first), choices
 * and orders cannot (their candidates come from the seat's own legal answers).
 */
export function veiledAnswerable(view: PublicView): boolean {
  return view.decision?.kind === 'optional';
}

export function veiledContent(p: VeiledProps): VeiledContent {
  const d = p.view.decision;
  const answerable = veiledAnswerable(p.view);
  return {
    title: `${p.seatName}: your decision`,
    body: (
      <div className="veiled-ask">
        <p className="dec-lead">
          <b>{p.seatName}, it is your move.</b>{' '}
          {answerable
            ? 'Use or Skip, or show your hand first. Only you should look.'
            : 'Show your hand to answer. Only you should look.'}
        </p>
        {d && <p className="dec-lead">{d.prompt}</p>}
        {answerable && p.usesHand === true && (
          <p className="subtle" data-testid="veiled-uses-hand">
            This effect uses your hand, so Use shows your hand first.
          </p>
        )}
        {answerable && p.usesHand === false && (
          <p className="subtle" data-testid="veiled-uses-hand">
            Use answers now; your hand stays hidden.
          </p>
        )}
        <button type="button" className="btn small" id="show-hand" onClick={p.onShow}>
          Show my hand <kbd>R</kbd>
        </button>
      </div>
    ),
    foot: answerable ? { use: p.onUse, skip: p.onSkip } : null,
  };
}
