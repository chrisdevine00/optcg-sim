/**
 * Helpers for the OP-18 group-C blind tests (OP18-001 .. OP18-040, Red and Green slice). Public API,
 * frozen fixtures and the earlier kits only. Scenery stats are noted next to each constant.
 */
import type { InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision, passBlock, play } from '../../helpers.ts';
import { donChoices, kind, LIGHTNING, need } from './kit-ga.ts';

export * from './kit-ga.ts';

/** Leaders used as scenery. */
export const LC = {
  /** OP04-001 Nefeltari Vivi: Blue/Red, 5000, 5 Life, {Alabasta}, named [Nefeltari Vivi]. Cannot attack. */
  vivi: 'OP04-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. */
  luffy: 'ST01-001',
  /** ST06-001 Sakazuki: Black, 5000, 5 Life, {Navy}. */
  navy: 'ST06-001',
  /** OP18-001 Karoo: Red/Blue, 5000, 4 Life, {Animal}/{Alabasta} (card under test elsewhere). */
  karoo: 'OP18-001',
  /** OP18-022 Monkey.D.Luffy: Green, 5000, 5 Life, {Water Seven}/{Straw Hat Crew} (card under test elsewhere). */
  luffyGreen: 'OP18-022',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Supernovas}/{Kid Pirates}. */
  kid: 'ST02-001',
  /** OP03-021 Kuro: Green, {East Blue}/{Black Cat Pirates}. */
  kuro: 'OP03-021',
  /** OP03-040 Nami: Blue, 5000, {East Blue}. Own text only concerns deck-out. */
  namiEB: 'OP03-040',
} as const;

/** Vanilla Characters. */
export const VC = {
  /** ST01-003 Karoo: Red, cost 1, 3000, Counter +1000, {Animal}/{Alabasta}. */
  karoo1: 'ST01-003',
  /** EB02-001 Karoo: Red, cost 5, 7000, Counter +1000, {Animal}/{Alabasta}. */
  karoo5: 'EB02-001',
  /** OP18-003 Sea Cat: Red, cost 5, 6000, Counter +2000, {Animal}/{Alabasta}. */
  seaCat: 'OP18-003',
  /** OP04-007 Sanji: Red, cost 1, 3000, Counter +1000, {Alabasta}/{Straw Hat Crew}. */
  sanji1: 'OP04-007',
  /** ST01-009 Nefeltari Vivi: Red, cost 2, 4000, Counter +1000, {Alabasta}, named [Nefeltari Vivi]. */
  vivi2: 'ST01-009',
  /** OP13-011 Nefeltari Cobra: Red, cost 5, 6000, Counter +2000, {Alabasta}. */
  cobra5: 'OP13-011',
  /** OP03-035 Momoo: Green, cost 2, 4000, Counter +1000, {Animal}/{East Blue}. */
  momoo2: 'OP03-035',
  /** OP03-046 Genzo: Blue, cost 2, 4000, Counter +1000, {East Blue}. */
  genzo2: 'OP03-046',
  /** OP03-061 Kiwi & Mozu: Purple, cost 2, 4000, Counter +1000, {Water Seven}/{The Franky Family}. */
  kiwi2: 'OP03-061',
  /** OP18-035 Michael & Hoichael: Green, cost 3, 5000, Counter +1000, {Water Seven}. */
  michael3: 'OP18-035',
  /** OP15-016 Fullbody: Red, cost 5, 6000, Counter +2000, {Navy}. */
  fullbody: 'OP15-016',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, no relevant type. */
  marco3: 'OP01-023',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  kingdew5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  thatch6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  oars7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. */
  shiki8: 'OP12-005',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai2: 'OP01-012',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin4: 'OP01-018',
  /** OP02-028 Usopp: Green, cost 3, 5000, Counter +1000. */
  usopp3: 'OP02-028',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000. */
  zoro4: 'OP02-043',
  /** OP02-039 Franky: Green, cost 5, 7000, Counter +1000. */
  franky5: 'OP02-039',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. */
  mohji1: 'OP02-060',
} as const;

/** The instance ids of a player's Characters, in field order. */
export function charIds(g: TestGame, who: PlayerId): InstanceId[] {
  return g.zone(who, 'characters').map((c) => c.instance);
}

/** p2 (the attacker) swings at p1's `target`, p1 does not block or counter; stops at the next decision. */
export function swingAt(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  attack(g, attacker, target);
  passBlock(g);
}

/** The decision must be a counter step owed by `who`. */
export function inCounter(g: TestGame, who: PlayerId = 'p1'): void {
  need(g, 'counter', who);
}

/** Pass the pending counter step. */
export function endCounter(g: TestGame): void {
  need(g, 'counter');
  act(g, { type: 'endCounter' });
}

/** After a battle declaration by p2 (or p1): pass block and counter, decline Life [Trigger]s. */
export function endBattle(g: TestGame): void {
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  while (kind(g) === 'trigger') act(g, { type: 'trigger', activate: false });
}

/** Describe the pending decision and its legal actions (debug aid for authoring only). */
export function dump(g: TestGame): string {
  const d = decision(g);
  return JSON.stringify({ d, legal: g.legal().slice(0, 12) });
}

/**
 * p2 plays OP09-077 Gum-Gum Lightning (needs a Purple Leader such as ST04-001 and the card in p2's
 * hand), pays DON!! -2 and targets `target` (K.O. up to 1 Character with 6000 power or less).
 * Stops at the first decision after the target is chosen.
 */
export function lightning(g: TestGame, target: InstanceId): void {
  play(g, g.find('p2', 'hand', LIGHTNING));
  need(g, 'optional', 'p2');
  act(g, { type: 'optional', accept: true });
  for (let i = 0; i < 4 && decision(g)?.kind === 'choose' && donChoices(g).length > 0; i++) {
    const want = donChoices(g)[0]!;
    act(g, { type: 'pick', choice: want });
  }
  need(g, 'choose', 'p2');
  act(g, { type: 'pick', choice: target });
  const d = decision(g);
  if (d?.kind === 'choose' && d.player === 'p2' && g.legal().some((a) => a.type === 'done')) {
    act(g, { type: 'done' });
  }
}
