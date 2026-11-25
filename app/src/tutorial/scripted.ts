/**
 * The tutorial's opponent: an `AiPort` that plays a short script instead of searching (PROMPT.md
 * "Guided tutorial"; flows G2 "Scripted Rookie"). It chooses only from the actions the engine
 * offers its seat (`view.actions`), so it can never play an illegal move, and it never reads
 * anything its own seat could not see.
 *
 * The script is the same in every step except for what it does on its own Main Phase:
 *
 *  - `none`: it ends its turn at once (no step gives it a turn that matters);
 *  - `attack-leader`: it attacks the player's Leader with its Leader, once, then ends its turn.
 *
 * It never blocks, never plays a Counter, never uses a [Trigger]: "no block, no counter" (t4) and a
 * Life card that goes to the hand are what the steps teach.
 */
import { minimal } from '@optcg/ai';
import type { AiTier } from '@optcg/ai';
import type { Action, PlayerView, SearchView } from '@optcg/engine';
import type { AiPort } from '../play/game/controller.ts';
import type { AiDecision } from '../play/game/ai-client.ts';

export type OpponentScript = 'attack-leader' | 'none';

/** The one action the script takes from the legal ones its seat is offered. */
export function scriptedAction(view: PlayerView | SearchView, script: OpponentScript): Action {
  const legal = view.actions.filter((a) => a.type !== 'concede');
  const kind = view.decision?.kind;
  const pick = (f: (a: Action) => boolean): Action | undefined => legal.find(f);
  const me = view.player;
  const foe = me === 'p1' ? 'p2' : 'p1';
  let chosen: Action | undefined;
  switch (kind) {
    case 'block':
      chosen = pick((a) => a.type === 'block' && a.blocker === null);
      break;
    case 'counter':
      chosen = pick((a) => a.type === 'endCounter');
      break;
    case 'trigger':
      chosen = pick((a) => a.type === 'trigger' && !a.activate);
      break;
    case 'mulligan':
      chosen = pick((a) => a.type === 'mulligan' && !a.redraw);
      break;
    case 'chooseFirst':
      chosen = pick((a) => a.type === 'chooseFirst' && a.goFirst);
      break;
    case 'main': {
      if (script === 'attack-leader') {
        const from = view.zones[me].leader[0]?.handle;
        const to = view.zones[foe].leader[0]?.handle;
        chosen = pick((a) => a.type === 'attack' && a.attacker === from && a.target === to);
      }
      chosen ??= pick((a) => a.type === 'endTurn');
      break;
    }
    default:
      break;
  }
  // Anything else (an effect's own question): the first legal answer, the way a forced move goes.
  return chosen ?? legal[0] ?? view.actions[0]!;
}

export class ScriptedOpponent implements AiPort {
  private n = 1;
  constructor(private readonly script: OpponentScript) {}

  planTurn() {
    return { id: this.n++, result: Promise.resolve() };
  }

  decide(view: PlayerView | SearchView, _tier: AiTier, _seed: number) {
    const action = scriptedAction(view, this.script);
    const decision: AiDecision = {
      action,
      explanation: minimal(
        'tutorial-script',
        'This opponent follows a fixed script for the lesson; it is not choosing.',
      ),
      alternatives: [],
      ms: 0,
    };
    return { id: this.n++, result: Promise.resolve(decision) };
  }

  reveal() {}
  cancel() {}
  reset() {}
  terminate() {}
}
