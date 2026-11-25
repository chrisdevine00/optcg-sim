/**
 * An oracle for "the DON!! you end the turn with": replay a Main Phase line through the engine's
 * own reducer (no search code) and read the active DON!! at the first state of the next turn, with
 * the end-of-turn effects resolved and none of the next turn run.
 */
import {
  actionFromView,
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { strip } from './hint-positions.ts';

/** Null when the line cannot be replayed on this state (a card the state does not have). */
export function engineEndOfTurnDon(
  state: GameState,
  me: PlayerId,
  line: readonly Action[],
): number | null {
  let s = state;
  const pending = [...line];
  const settleOwn = (): void => {
    // Resolve what the engine asks of me between steps (a trigger, a follow-up) with its first option.
    for (let i = 0; i < 50; i++) {
      const d = queries.decision(s);
      if (!d || queries.result(s) || (d.kind === 'main' && d.player === me)) return;
      s = reduce(s, legalActions(s)[0]!).state;
    }
  };
  while (pending.length > 0) {
    const v = projectForSearch(s, me);
    const first = pending[0]!;
    const window = first.type === 'pick' ? pending.filter((a) => a.type === 'pick') : [first];
    const k = window.findIndex((a) => v.actions.some((x) => strip(x) === strip(a)));
    if (k < 0) return null;
    const a = window[k]!;
    pending.splice(pending.indexOf(a), 1);
    const turn = queries.turn(s).number;
    s = reduce(s, actionFromView(s, me, a)).state;
    if (a.type === 'endTurn') {
      for (let i = 0; i < 50 && queries.turn(s).number === turn && queries.decision(s); i++)
        s = reduce(s, legalActions(s)[0]!).state;
      return queries.don(s, me).active;
    }
    if (pending[0]?.type !== 'pick') settleOwn();
  }
  return null;
}
