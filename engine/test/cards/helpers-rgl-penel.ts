/**
 * Helpers and vanilla constants for the M4b wave 2 R/G Luffy (OP13-001) and Purple Enel (OP15-058)
 * card tests. Kept apart from helpers.ts so parallel waves do not conflict.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';

/** OP13-001 Monkey.D.Luffy, Green/Red Leader, {Straw Hat Crew}, 5000 power, 4 Life. */
export const RGL = 'OP13-001';
/** OP15-058 Enel, Purple Leader, {Sky Island}, 5000 power, 5 Life, 6-card DON!! deck. */
export const ENEL = 'OP15-058';
/** Straw Hat Crew vanillas: Purple 6000 (cost 4), Purple 8000 (cost 6), Red 3000 (cost 1). */
export const SHC6 = 'OP09-063';
export const SHC8 = 'OP05-065';
export const SHC3 = 'OP04-007';
/** ST10-010 Trafalgar Law: printed [Blocker] (its [On Play] does not fire when placed by a scenario). */
export const BLOCKER = 'ST10-010';
/** East Blue vanilla, 4000 power (not a Straw Hat Crew). */
export const EAST_BLUE = 'OP03-035';
/** Purple 7000 cost 5 vanilla, and a rested-friendly 5000 cost 3 one. */
export const C5 = V.c5;
export { PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V };

/** Answer `order` decisions with the first legal order until none is pending. */
export function drainOrders(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** Pick the DON!! class `from` (cost area active, rested or given) `times` times. */
export function pickDon(g: TestGame, state: 'active' | 'rested', times = 1): void {
  for (let i = 0; i < times; i++) {
    const a = g
      .legal()
      .find(
        (x) =>
          x.type === 'pick' &&
          typeof x.choice === 'object' &&
          'from' in x.choice &&
          x.choice.from === (state === 'active' ? 'costActive' : 'costRested'),
      );
    if (!a) throw new Error(`no ${state} DON!! pick: ${JSON.stringify(g.legal())}`);
    g.act(a);
  }
}

/** The opponent (p2) attacks `target` with `attacker`; answers any "use [On Your Opponent's Attack]" with `useOpp`. */
export function oppAttacks(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  g.act({ type: 'attack', attacker, target });
}

/** p2 attacks p1's Leader with a 7000 vanilla; stops at the first decision after the attack. */
export function p2AttackBoard(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2chars: PlayerSpec['characters'] = [V.c7],
): TestGame {
  const g = game(p1, { leader: PLAIN_BLUE, characters: p2chars }, { turn: 4, activePlayer: 'p2' });
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
}

/** [Trigger] position: p2 attacks p1's Leader (top Life `top`) and the Trigger decision is open. */
export function damageWithP2(
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2chars: PlayerSpec['characters'] = [V.c7],
  leader: PlayerSpec['leader'] = PLAIN_PURPLE,
): TestGame {
  const g = game(
    { leader, life: [top, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: p2chars },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/** Counter position: p2's 7000 Character attacks p1's Leader; block passed; the counter step is open. */
export function counterStep(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2chars: PlayerSpec['characters'] = [V.c7],
): TestGame {
  const g = p2AttackBoard(p1, p2chars);
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  passBlock(g);
  expectDecision(g, 'counter', 'p1');
  return g;
}

/** Send `done` if the open decision's prompt contains `text` (a pick that reached its max has already closed). */
export function doneIf(g: TestGame, text: string): void {
  const d = dec(g);
  if (d?.kind === 'choose' && d.prompt.includes(text)) g.act({ type: 'done' });
}

/**
 * p2 (the active player, with a vanilla Leader) runs a planted [Activate: Main] on its Leader whose
 * effect is the one action `action` (an opponent's removal: K.O., bounce, ...). It is not one of the
 * 143 cards; it stands for "your opponent's effect".
 */
export function plantOpponentEffect(g: TestGame, action: Record<string, unknown>): void {
  g.state = withAbilities(g.state, PLAIN_BLUE, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: action }],
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
}
