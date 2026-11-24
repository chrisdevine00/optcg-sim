/**
 * Helpers for the OP-14 group-A independent card tests (OP14-002 .. OP14-034). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts). Scenery stats are noted next to each constant; tests
 * repeat the ones they rely on.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, cardIds, decision } from '../../helpers.ts';
import { canFinish, choices, kind } from '../kit.ts';

export * from '../op15/kit-op15a.ts';

/** Leaders used as scenery. */
export const LD14 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  luffy: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Kid Pirates}/{Supernovas}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** OP03-021 Kuro: Green, 5000, 5 Life, {East Blue}/{Black Cat Pirates}. [Activate: Main] only; named [Kuro]. */
  kuro: 'OP03-021',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. */
  shanks: 'ST05-001',
} as const;

/** Scenery cards of this group. Stats are the printed ones. */
export const S14 = {
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, Counter +1000, {Mountain Bandits}. Inert alone. */
  dadan: 'OP13-009',
  /** OP02-014 Whitey Bay: Red, cost 1, 2000, Counter +1000, {Whitebeard Pirates Allies}. Inert without DON!!. */
  whitey: 'OP02-014',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  komachiyo: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  oars: 'OP02-020',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000. Inert alone. */
  cobra: 'OP04-012',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. Vanilla. */
  mohji: 'OP02-060',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}. Vanilla. */
  zoroSn: 'OP02-043',
  /** OP01-039 Killer: Green, cost 2, 2000, Counter +1000, {Kid Pirates}/{Supernovas}. [Blocker]; [DON!! x1][On Block] only. */
  killer2: 'OP01-039',
  /** OP02-039 Franky: Green, cost 5, 7000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  frankyG5: 'OP02-039',
  /** OP02-028 Usopp: Green, cost 3, 5000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  usoppG3: 'OP02-028',
  /** OP03-023 Alvida: Green, cost 1, 3000, Counter +1000, {East Blue}/{Alvida Pirates}. Vanilla. */
  alvida: 'OP03-023',
  /** EB05-015 Tashigi: Green, cost 5, 7000, Counter +1000, {Navy}/{East Blue}. Vanilla (not a {Straw Hat Crew}). */
  tashigiG5: 'EB05-015',
  /** ST01-010 Franky: Red, cost 4, 6000, Counter +1000, {Straw Hat Crew}. Vanilla. */
  frankyR4: 'ST01-010',
  /** OP03-046 Genzo: Blue, cost 2, 4000, Counter +1000, {East Blue}. Vanilla. */
  genzo: 'OP03-046',
  /** OP12-067 Carmen: Purple, cost 3, 5000, Counter +1000, {East Blue}. Vanilla. */
  carmen: 'OP12-067',
  /** OP04-023 Kuro: Green, cost 6, 8000, Counter +1000, {East Blue}/{Black Cat Pirates}. Vanilla. */
  kuro6: 'OP04-023',
  /** OP05-021 Revolutionary Army HQ: Red Stage, cost 1 (only an [Activate: Main]). */
  stage: 'OP05-021',
  /** EB01-059 Kingdom Come: Yellow Event, cost 6. [Main] K.O. up to 1 Character; then trash Life down to 1. */
  kingdomCome: 'EB01-059',
  /** OP05-077 Gamma Knife: Purple Event, cost 2, [Main] DON!! -1: opposing Character -5000 this turn. */
  gammaKnife: 'OP05-077',
} as const;

/** Card ids in a zone, sorted. */
export function sorted(g: TestGame, who: PlayerId, zone: Parameters<typeof cardIds>[2]): CardId[] {
  return cardIds(g, who, zone).sort();
}

/** The effect found no candidate: the pending "up to" `choose` (if the engine asks one) has nothing to pick. */
export function settleEmpty(g: TestGame): void {
  if (kind(g) === 'choose' && choices(g).length === 0 && canFinish(g)) act(g, { type: 'done' });
}

/** p1 attacks p2's Leader with the Character `card`. */
export function swing(g: TestGame, card: CardId, nth = 0): void {
  act(g, {
    type: 'attack',
    attacker: g.find('p1', 'characters', card, nth),
    target: g.leader('p2'),
  });
}

/**
 * Answer an effect that gives up to N DON!! to one target: a count question (a `choose` with
 * purpose `mode`, options "0".."N") and a target question, in whichever order the engine asks
 * them. Anything else pending fails. Returns the number of questions answered.
 */
export function giveDonFlow(g: TestGame, count: number, target: InstanceId): number {
  let answered = 0;
  for (let i = 0; i < 3; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose') break;
    if (d.purpose === 'mode') {
      act(g, { type: 'pick', choice: { option: String(count) } });
    } else if (choices(g).includes(target)) {
      act(g, { type: 'pick', choice: target });
    } else {
      throw new Error(`Unexpected choose (${d.purpose}): ${d.prompt}`);
    }
    answered++;
  }
  return answered;
}

/** Rest state of an instance. */
export function isRestedInst(g: TestGame, i: InstanceId): boolean {
  return g.card(i).rested;
}

/** The kind of the pending decision, or null. */
export function pk(g: TestGame): string | null {
  return decision(g)?.kind ?? null;
}
