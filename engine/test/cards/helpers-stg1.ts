/**
 * Constants and helpers for the block 5 starter-deck group 1 card tests (ST-30, ST-31, ST-32,
 * ST-34). Every Character below is a vanilla (no effect text) unless noted.
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import { withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';

export { dec, expectDecision, hand, trash };

/** Leaders (their text is inert in these positions). */
export const SLASH_LEADER = 'ST05-001'; // Purple, <Slash>, [Activate: Main] only
export const BMP_LEADER = 'ST07-001'; // Yellow, <Special>, {Big Mom Pirates}, [When Attacking] only
export const NONSLASH_LEADER = PLAIN_BLUE; // ST03-001 Crocodile, <Special>, not {Big Mom Pirates}
export const SHC_LEADER = 'ST01-001'; // Red, <Strike>, {Straw Hat Crew}

/** 6000-power vanilla Characters (cost 4): Atmos <Slash>, [Portgas.D.Ace], [Monkey.D.Luffy]. */
export const ATMOS = 'OP02-003';
export const ACE6 = 'P-119';
export const LUFFY6 = 'P-022';
/** A 6000-power vanilla that is none of the above (Scratchmen Apoo, cost 4). */
export const P6000 = V.c4;
/** 5000 and 7000 vanillas: the boundaries around 6000 (Solitaire cost 3, Babanuki cost 5). */
export const P5000 = V.c3;
export const P7000 = V.c5;
/** [Monkey.D.Luffy] with 5000 base power (cost 3). */
export const LUFFY5 = 'ST08-011';
/** {Straw Hat Crew} vanillas: Sanji cost 1, Jinbe cost 2. */
export const SHC1 = 'OP04-007';
export const SHC2 = 'ST21-005';
/** Cost 1 vanilla that is not {Straw Hat Crew}: Blugori <Slash>. */
export const NON_SHC1 = V.c1;
/** An Event that is only hand fodder here: Green Star Rafflesia. */
export const EVENT = 'OP01-028';

export const donArea = (active: number, rested = 0) => ({ costArea: { active, rested } });
export const ids = (g: TestGame, p: PlayerId, zone: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, zone).map((c) => c.card);

/** Answer every pending "order the rest at the bottom" decision with its first legal order. */
export function orderAll(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** The choices currently offered as picks. */
export const offeredPicks = (g: TestGame): unknown[] =>
  g.legal().flatMap((a) => (a.type === 'pick' ? [a.choice] : []));

/**
 * A battle K.O.: p2's attacker `atk` (a 9000 vanilla by default) attacks p1's rested `victim` and
 * is neither blocked nor countered. Stops at the first decision after the K.O.
 */
export function koInBattle(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  victim: string,
  atk: string = V.c7,
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    p1,
    { leader: PLAIN_BLUE, ...p2, characters: [atk, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', atk),
    target: g.find('p1', 'characters', victim),
  });
  passBlock(g);
  endCounter(g);
  return g;
}

/** p2 runs a planted effect (it stands for "your opponent's effect") on its own turn. */
export function plantP2(g: TestGame, action: Record<string, unknown>): void {
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

/** A name-keyed K.O. of one of p1's Characters, as an opponent's effect. */
export const koByName = (name: string) => ({
  ko: { from: 'characters', owner: 'opponent', filter: { name } },
});

/** `leader` gets a planted [Activate: Main] returning `n` DON!! to the DON!! deck. */
export function plantReturnDon(g: TestGame, leader: string, n = 1): void {
  g.state = withAbilities(g.state, leader, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { returnDon: { n } } }],
    } as unknown as Ability,
  ]);
}

/** True when `card` has `ability` available to activate right now. */
export const canActivate = (g: TestGame, card: InstanceId, ability: string): boolean =>
  g.isLegal({ type: 'activate', card, ability, player: g.decider });

export const canAttack = (
  g: TestGame,
  attacker: InstanceId,
  target: InstanceId,
  player: PlayerId = 'p1',
): boolean => g.isLegal({ type: 'attack', attacker, target, player });
