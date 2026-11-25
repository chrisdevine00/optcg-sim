/**
 * Helpers for the OP-09 group-D independent card tests (OP09-019 .. OP09-118, 22 cards). Public API,
 * frozen fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts), so a missing or extra "up to" / "you may" prompt is
 * caught. Cards are played with raw actions (`playRaw`, `activateCounter`), never with a helper that
 * could answer a pending target choice.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision, passBlock, result, takeDamage } from '../../helpers.ts';
import {
  activateCounter,
  atMain,
  kind,
  need,
  theirs,
  offeredAbilities,
} from '../op14/kit-op14d.ts';

export * from '../op14/kit-op14d.ts';
export { asksDonCount, donCountOptions, takeDon } from '../op16/kit-op16b.ts';

/** Leaders used as scenery (no effect that fires unless a test makes it). */
export const L9 = {
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  rhp: 'ST05-001',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla (also the default opposing Leader). */
  luffy: 'ST01-001',
  /** OP09-022 Leader: Green/Purple, 5000, 4 Life, {ODYSSEY}. Characters are played rested; its [Activate: Main] is unused. */
  ody: 'OP09-022',
  /** OP09-042 Leader: Blue, 5000, 5 Life, {The Four Emperors}/{Cross Guild}. [Activate: Main] only. */
  cg: 'OP09-042',
  /** OP09-081 Marshall.D.Teach: Black, 5000, 5 Life, {Blackbeard Pirates}/{The Four Emperors}. Negates its own [On Play]s; [Activate: Main] only. */
  bb: 'OP09-081',
  /** OP02-049 Leader: Blue, 5000, 5 Life, {Revolutionary Army}/{Impel Down}. [End of Your Turn] only. */
  ra: 'OP02-049',
} as const;

/** Scenery Characters. Stats are repeated where a test relies on them. */
export const C9 = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. Vanilla. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  c7: 'OP02-020',
  /** OP02-014 Whitey Bay: Red, cost 1, 2000, Counter +1000. Inert without DON!!. */
  w2000: 'OP02-014',
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, Counter +1000, {Mountain Bandits}. Inert alone. */
  dadan2000: 'OP13-009',
  /** OP01-104 Speed: Purple, cost 2, 3000, Counter +1000, "[Trigger] Play this card." */
  speed: 'OP01-104',
  /** OP01-009 Carrot: Red, cost 2, 3000, Counter +1000, {Minks}, "[Trigger] Play this card." */
  carrot: 'OP01-009',
  /** OP03-026 Arlong Pirates Character: Green, cost 4, 3000, has a [Trigger] (and an [On Play] that never fires on the field). */
  trig4: 'OP03-026',
  /** OP09-072 Franky: Purple, cost 4, 5000, Counter +1000, [Blocker], {Straw Hat Crew}. */
  franky: 'OP09-072',
  /** OP13-118 Monkey.D.Luffy: Green, cost 6, 7000, no Counter, [Double Attack], {Straw Hat Crew}. */
  doubleAtk: 'OP13-118',
  /** OP09-063 Purple, cost 4, 6000, Counter +1000, {Straw Hat Crew}. Vanilla. */
  shc4: 'OP09-063',
  /** OP04-007 Red, cost 1, 3000, Counter +1000, {Alabasta}/{Straw Hat Crew}. Vanilla. */
  shc1: 'OP04-007',
  /** OP02-028 Green, cost 3, 5000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  shc3: 'OP02-028',
  /** EB05-041 Black, cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. Vanilla. */
  ra2: 'EB05-041',
  /** OP05-012 Red, cost 3, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}. Vanilla. */
  ra3: 'OP05-012',
  /** OP09-113 Yellow, cost 4, 6000, Counter +1000, {Giant}/{Revolutionary Army}. Vanilla. */
  ra4: 'OP09-113',
  /** OP12-083 Black, cost 5, 6000, Counter +2000, {Revolutionary Army}. Vanilla. */
  ra5: 'OP12-083',
  /** OP09-082 Black, cost 4, 6000, Counter +1000, {Blackbeard Pirates}. Vanilla. */
  bb4: 'OP09-082',
  /** OP10-084 Black, cost 5, 7000, Counter +1000, {Blackbeard Pirates}/{Giant}. Vanilla. */
  bb5: 'OP10-084',
  /** OP09-006 Red, cost 5, 7000, Counter +1000, {Red-Haired Pirates}. Vanilla. */
  rhp5: 'OP09-006',
  /** OP09-016 Red, cost 4, 6000, Counter +1000, {Red-Haired Pirates}. Vanilla. */
  rhp4: 'OP09-016',
  /** P-016 Red, cost 8, 10000, Counter +1000, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. Vanilla. */
  rhpMulti: 'P-016',
  /** OP09-055 Blue, cost 5, 7000, Counter +1000, {Former Baroque Works}/{Cross Guild}. Vanilla. */
  cg5: 'OP09-055',
  /** OP12-055 Blue, cost 5, 6000, Counter +2000, {Cross Guild}. Vanilla. */
  cg5b: 'OP12-055',
  /** OP12-049 Blue, cost 6, 7000, Counter +2000, {The Four Emperors}/{Cross Guild}. Vanilla. */
  cg6: 'OP12-049',
} as const;

/** Event ids used as scenery. */
export const E9 = {
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. Has a [Trigger]. */
  lightning: 'OP09-077',
  /** OP09-116: Yellow Event, cost 1, {Revolutionary Army}; [Counter] +2000; [Trigger] play a {Revolutionary Army} Character cost 4 or less from hand. */
  miracles: 'OP09-116',
} as const;

/** The opposing Leader's life and the pending decision's owner, for a quick look. */
export function owner(g: TestGame): PlayerId | null {
  return decision(g)?.player ?? null;
}

/** The game result's winner, or null while the game is on. */
export function winner(g: TestGame): PlayerId | null {
  const r = result(g);
  return r && 'winner' in r ? r.winner : null;
}

/**
 * p1 defends: p2's Character `attacker` (default Hajrudin 6000) attacks p1's Leader, p1 passes the
 * Block Step. Leaves the game at p1's Counter Step. p1 has 4 active DON!! and 4 Life by default.
 */
export function counterSpot(
  leader: string,
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  attacker: CardId = C9.c4,
  target: 'leader' | InstanceId = 'leader',
): TestGame {
  const g = theirs(
    leader,
    { costArea: { active: 4, rested: 0 }, life: [C9.c1, C9.c1, C9.c1, C9.c1], ...spec },
    { characters: [attacker], ...p2 },
  );
  const aim = target === 'leader' ? g.leader('p1') : target;
  attack(g, g.find('p2', 'characters', attacker), aim);
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

/** Activate the [Counter] of the Event `id` in p1's hand (raw: nothing else is answered). */
export function useEvent(g: TestGame, id: CardId): void {
  activateCounter(g, g.find('p1', 'hand', id));
}

/** True if the Event `id` in p1's hand can be activated now (any timing). */
export function playable(g: TestGame, id: CardId): boolean {
  expect(g.decider).toBe('p1');
  const inst = g.find('p1', 'hand', id);
  return g.legal().some((a) => (a.type === 'playCard' || a.type === 'activate') && a.card === inst);
}

/** Activate the single [Activate: Main] on a card (raw); then say yes if a "you may" is asked. */
export function activateAndAccept(g: TestGame, card: InstanceId): void {
  const [ability] = offeredAbilities(g, card);
  if (!ability) throw new Error('no ability offered');
  const who = g.decider;
  act(g, { type: 'activate', card, ability });
  const d = decision(g);
  if (d?.kind === 'optional' && d.player === who) act(g, { type: 'optional', accept: true });
}

/** End the Counter Step (p1) and take any damage without a [Trigger]. */
export function endCounter(g: TestGame): void {
  act(g, { type: 'endCounter' });
  takeDamage(g);
}

export { atMain, kind, attack, passBlock, expect };
