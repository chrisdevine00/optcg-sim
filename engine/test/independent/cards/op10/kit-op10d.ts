/**
 * Helpers for the OP-10 group-D independent card tests. Public API, frozen fixtures and the
 * earlier kits only. Every answer helper accepts ONE named kind of prompt and fails on anything
 * else, so a missing or extra "up to" / "you may" prompt is caught. Cards are played with raw
 * actions (`playRaw`), never with a helper that could answer a target choice.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision, passBlock } from '../../helpers.ts';
import { canFinish, choices, donChoices, kind } from '../kit.ts';
import { need, theirs } from '../op14/kit-op14d.ts';

export * from '../op14/kit-op14d.ts';
export { asksDonCount, donCountOptions, takeDon, put, answerMay } from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LD10 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Only an [Activate: Main]. */
  supernovas: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Kid Pirates}/{Supernovas}. Only an [Activate: Main]. */
  supernovas2: 'ST02-001',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** OP09-022 Lim: Green/Purple, 5000, 4 Life, {ODYSSEY}. Only an [Activate: Main] and "Characters are played rested". */
  odyssey: 'OP09-022',
  /** OP10-002 Caesar Clown: Blue/Red, 5000, 4 Life, {Punk Hazard}/{Scientist}. [DON!! x2] [When Attacking] only. */
  caesar: 'OP10-002',
  /** OP10-001 Smoker: Green/Red, 5000, 4 Life, {Navy}/{Punk Hazard}. A Leader that is not [Caesar Clown]. */
  smoker: 'OP10-001',
} as const;

/** Scenery Characters. Stats repeated where a test relies on them. */
export const SC10 = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  c7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. */
  c8: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter, {The Seven Warlords of the Sea}. [On Play] only: never played here. */
  c9: 'OP01-070',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, no Counter. */
  c10: 'OP17-118',
  /** ST03-011 Buggy: Blue, cost 1, 3000, Counter +1000, {Buggy's Delivery}/{The Seven Warlords of the Sea}. Vanilla. */
  wl1: 'ST03-011',
  /** ST03-006 Jinbe: Blue, cost 2, 4000, Counter +1000, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}. Vanilla. */
  wl2: 'ST03-006',
  /** ST03-002 Edward Weevil: Blue, cost 3, 5000, Counter +1000, {The Seven Warlords of the Sea}. Vanilla. */
  wl3: 'ST03-002',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, Counter +1000, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}. Vanilla. */
  wl4: 'OP02-054',
  /** OP02-055 Dracule Mihawk: Blue, cost 6, 8000, Counter +1000, {The Seven Warlords of the Sea}. Vanilla. */
  wl6: 'OP02-055',
  /** OP04-060 Crocodile: Purple, cost 8, 9000, no Counter, {Baroque Works}/{The Seven Warlords of the Sea}. Not played here. */
  wl8: 'OP04-060',
  /** OP14-009 Trafalgar Law: Red, cost 9, 10000, {Supernovas}/{The Seven Warlords of the Sea}. Not played here. */
  wl9: 'OP14-009',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {Straw Hat Crew}/{Supernovas}/{FILM}. Vanilla. */
  sn4: 'OP02-043',
  /** OP10-101 Urouge: Yellow, cost 5, 7000, Counter +1000, {Fallen Monk Pirates}/{Supernovas}. Vanilla. */
  sn5: 'OP10-101',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, Counter +1000, {On-Air Pirates}/{Supernovas}. Vanilla. */
  sn3: 'OP14-008',
  /** OP10-105 Cavendish: Yellow, cost 6, 8000, Counter +1000, {Beautiful Pirates}/{Supernovas}/{Dressrosa}. Vanilla. */
  sn6dr: 'OP10-105',
  /** OP17-100 Capone"Gang"Bege: Yellow, cost 7, 8000, Counter +2000, {Supernovas}/{Firetank Pirates}. Vanilla. */
  sn7: 'OP17-100',
  /** EB05-041 Koala: Black, cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. Vanilla. */
  dr2: 'EB05-041',
  /** OP10-054 Blue Gilly: Blue, cost 3, 5000, Counter +1000, {Dressrosa}. Vanilla. */
  dr3: 'OP10-054',
  /** OP04-087 Trafalgar Law: Black, cost 5, 7000, Counter +1000, {Heart Pirates}/{Dressrosa}. Vanilla. */
  dr5: 'OP04-087',
  /** OP10-089 Nico Robin: Black, cost 6, 8000, Counter +1000, {Straw Hat Crew}/{Dressrosa}. Vanilla. */
  dr6: 'OP10-089',
  /** OP10-050 Hajrudin: Blue, cost 7, 9000, Counter +1000, {Giant}/{Dressrosa}/{New Giant Pirates}. Vanilla. */
  dr7: 'OP10-050',
  /** OP12-082 Issho: Black, cost 8, 10000, Counter +1000, {Navy}/{Dressrosa}. Vanilla. */
  dr8: 'OP12-082',
  /** OP09-038 Rob Lucci: Green, cost 4, 6000, Counter +1000, {CP9}/{ODYSSEY}. Vanilla. */
  od4: 'OP09-038',
  /** OP10-024 Edward.Newgate: Green, cost 5, ODYSSEY Character with an effect. Only ever sits in a deck here. */
  od5: 'OP10-024',
  /** OP09-023 Adio: Green, cost 9, ODYSSEY Character. Only ever sits in a deck here. */
  od9: 'OP09-023',
  /** OP10-033 Nami: Green, cost 2, ODYSSEY Character. Only ever sits in a deck here. */
  od2: 'OP10-033',
  /** OP10-037 Lim: Green, cost 1, ODYSSEY Character. Only ever sits in a deck here. */
  od1: 'OP10-037',
} as const;

/** Make p1's Main Phase decision pending (the usual start state). */
export function mainOf(g: TestGame, who: PlayerId = 'p1'): void {
  need(g, 'main', who);
}

/**
 * The pending decision as `{kind, purpose, max, min}` for assertions about whether a prompt is
 * asked (the shared helpers can answer an empty pick; this only reads).
 */
export function peek(g: TestGame) {
  const d = decision(g);
  return d ? { kind: d.kind, purpose: d.purpose, max: d.max, min: d.min, player: d.player } : null;
}

/** True when a `choose` is pending that the owner may leave (done legal). */
export function mayDone(g: TestGame): boolean {
  return kind(g) === 'choose' && canFinish(g);
}

/** Instance ids a pending `choose` offers, sorted. */
export function offeredInst(g: TestGame): InstanceId[] {
  return [...choices(g)].sort();
}

/** Answer a pending DON!! class cost pick with `n` DON!! of the given class (strict). */
export function payDonFrom(
  g: TestGame,
  n: number,
  from: 'costActive' | 'costRested' = 'costActive',
): void {
  for (let i = 0; i < n; i++) {
    need(g, 'choose');
    const want = donChoices(g).find((o) => o.from === from);
    if (!want) throw new Error(`No ${from} DON!! offered`);
    act(g, { type: 'pick', choice: want });
  }
}

/**
 * p1 defends on p2's turn with `hand` and `active` DON!!: p2 attacks `target` (default p1's
 * Leader) with `attacker` (default p2's Leader), p1 passes the Block Step. Leaves the Counter Step
 * pending for p1. `p2chars` are p2's Characters (already able to attack).
 */
export function defend(o: {
  leader?: string;
  hand: CardId[];
  active?: number;
  rested?: number;
  life?: CardId[];
  chars?: (CardId | { card: CardId; rested?: boolean; don?: number })[];
  deck?: CardId[];
  p2chars?: (CardId | { card: CardId; rested?: boolean })[];
  p2leader?: string;
  p2life?: CardId[];
  p2hand?: CardId[];
  attackerCard?: CardId;
  targetCard?: CardId;
}): TestGame {
  const g = theirs(
    o.leader ?? LD10.neutral,
    {
      hand: o.hand,
      costArea: { active: o.active ?? 3, rested: o.rested ?? 0 },
      ...(o.life ? { life: o.life } : {}),
      ...(o.chars ? { characters: o.chars } : {}),
      ...(o.deck ? { deck: o.deck } : {}),
    },
    {
      ...(o.p2chars ? { characters: o.p2chars } : {}),
      ...(o.p2life ? { life: o.p2life } : {}),
      ...(o.p2hand ? { hand: o.p2hand } : {}),
    },
    o.p2leader,
  );
  const attacker = o.attackerCard ? g.find('p2', 'characters', o.attackerCard) : g.leader('p2');
  const target = o.targetCard ? g.find('p1', 'characters', o.targetCard) : g.leader('p1');
  attack(g, attacker, target);
  passBlock(g);
  expect(kind(g)).toBe('counter');
  return g;
}
