/**
 * M7 WP3: what the search skeleton may hold of a decision another player owes. A foreign Main
 * decision with an empty resolution stack is searchable (not opaque) and has exactly the public
 * shape the view shows (kind, player, generic prompt); every other foreign decision is opaque.
 * Copying the real decision verbatim fails this: its prompt is the owner's own text, and a
 * decision that is opaque by design (a damage prompt naming a Life card) would carry private text.
 */
import { project, projectForSearch, type GameState, type PlayerId } from '../../src/index.ts';
import { internals } from '../../src/testing.ts';

export interface ForeignCheck {
  /** 'main': a foreign Main with an empty stack; 'other': any other foreign decision; null: own or none. */
  kind: 'main' | 'other' | null;
  problems: string[];
}

export function checkForeignDecision(state: GameState, viewer: PlayerId): ForeignCheck {
  const s = internals(state);
  const dec = s.decision;
  if (!dec || dec.player === viewer) return { kind: null, problems: [] };
  const sk = projectForSearch(state, viewer).skeleton;
  const skDecision = (sk.state as { decision: unknown }).decision;
  const shown = project(state, viewer).decision;
  const top = s.stack[s.stack.length - 1];
  const main =
    dec.kind === 'main' && s.stack.length === 1 && top?.f === 'turn' && top.step === 'main';
  const problems: string[] = [];
  if (sk.opaque === main)
    problems.push(`opaque is ${sk.opaque} for a foreign ${main ? 'empty-stack main' : dec.kind}`);
  if (JSON.stringify(skDecision) !== JSON.stringify(shown))
    problems.push(
      `skeleton decision ${JSON.stringify(skDecision)} is not the view's ${JSON.stringify(shown)}`,
    );
  return { kind: main ? 'main' : 'other', problems };
}
