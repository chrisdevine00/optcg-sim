/**
 * Positions for the hint tests: decisions the player owes, taken from seeded Rookie-versus-Rookie
 * games between two sourced lists (so the cards, the effects and the prompts are real).
 */
import {
  projectForSearch,
  type Action,
  type GameState,
  type PlayerId,
  type SearchView,
} from '@optcg/engine';
import { metaDecks } from '../support.ts';
import { playMatch } from './match.ts';

export interface HintPosition {
  seed: number;
  state: GameState;
  player: PlayerId;
  kind: 'main' | 'defence' | 'choice';
  view: SearchView;
  own: string[];
  leader: string;
  opponentLeader: string;
}

/** Up to `want` positions per kind, spread over the games. */
export function gatherPositions(
  want: Record<'main' | 'defence' | 'choice', number>,
  seeds: number[],
): HintPosition[] {
  const decks = metaDecks();
  const out: HintPosition[] = [];
  const have = { main: 0, defence: 0, choice: 0 };
  for (const seed of seeds) {
    const a = decks[seed % decks.length]!;
    const b = decks[(seed * 3 + 1) % decks.length]!;
    let n = 0;
    playMatch({
      seed,
      decks: { p1: a, p2: b },
      tiers: { p1: 'rookie', p2: 'rookie' },
      cap: 400,
      onDecision: (d) => {
        n++;
        const kind = d.view.decision?.kind ?? '';
        const group =
          kind === 'main'
            ? 'main'
            : kind === 'block' || kind === 'counter'
              ? 'defence'
              : kind === 'choose' || kind === 'optional' || kind === 'trigger'
                ? 'choice'
                : null;
        if (!group || have[group] >= want[group]) return;
        if (n % (group === 'main' ? 7 : 3) !== 0) return;
        const deck = d.player === 'p1' ? a : b;
        const opp = d.player === 'p1' ? b : a;
        out.push({
          seed,
          state: d.before,
          player: d.player,
          kind: group,
          view: projectForSearch(d.before, d.player),
          own: deck.main,
          leader: deck.leader,
          opponentLeader: opp.leader,
        });
        have[group]++;
      },
    });
    if (have.main >= want.main && have.defence >= want.defence && have.choice >= want.choice) break;
  }
  return out;
}

export const strip = ({ intentId: _i, ...a }: Action) => JSON.stringify(a);
