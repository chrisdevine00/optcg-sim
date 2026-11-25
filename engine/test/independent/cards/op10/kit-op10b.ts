/**
 * Helpers for the OP-10 group-B independent card tests (OP10-036 to OP10-074). Public API, frozen
 * fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests repeat
 * the ones they rely on.
 *
 * Answer helpers accept exactly one named prompt kind: a test fails on the wrong prompt rather than
 * skipping it.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import { act, decision } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { choices, donChoices, kind } from '../kit.ts';
import { mine } from '../m4b/kit-a.ts';
import { inst, mustBeUnpayable, need } from '../op16/kit-op16b.ts';

export * from '../op14/kit-op14b.ts';

/** Leaders used as scenery. */
export const L10 = {
  /** EB01-040 Kyros: 5000, 4 Life, {Dressrosa}. Only an [Activate: Main]. */
  dressrosa: 'EB01-040',
  /** OP10-042 Usopp: 5000, 4 Life, {Straw Hat Crew}/{Dressrosa}. Named [Usopp]; {Dressrosa} Characters cost +1 (cost 2 or more). */
  usopp: 'OP10-042',
  /** OP06-042 Vinsmoke Reiju: 5000, 4 Life, {The Vinsmoke Family}/{GERMA 66}. Draws only when DON!! is returned. */
  germa: 'OP06-042',
  /** OP01-060 Donquixote Doflamingo: 5000, 5 Life, {Donquixote Pirates}. [DON!! x2][When Attacking] only. */
  dp: 'OP01-060',
  /** ST01-001 Monkey.D.Luffy: 5000, 5 Life, {Straw Hat Crew}. Vanilla. */
  luffy: 'ST01-001',
  /** ST09-001 Yamato: 5000, 5 Life, {Land of Wano}. No relevant type. */
  wano: 'ST09-001',
} as const;

/** Vanilla scenery Characters (no effect, no [Trigger]). */
export const C10 = {
  /** OP09-038 Rob Lucci: cost 4, 6000, Counter +1000, {CP9}/{ODYSSEY}. */
  lucci: 'OP09-038',
  /** OP01-023 Marco: cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  marco: 'OP01-023',
  /** OP02-060 Mohji: cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  mohji: 'OP02-060',
  /** ST05-007 Gordon: cost 1, 3000, Counter +1000, {FILM}. */
  gordon: 'ST05-007',
  /** OP01-012 Sai: cost 2, 4000, Counter +1000, {Happosui Army}. */
  sai: 'OP01-012',
  /** OP01-018 Hajrudin: cost 4, 6000, Counter +1000, {Giant}/{New Giant Pirates}. */
  hajrudin4: 'OP01-018',
  /** OP02-006 Kingdew: cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. */
  oars7: 'OP02-020',
  /** OP12-005 Shiki: cost 8, 10000, Counter +1000, {FILM}/{Golden Lion Pirates}. */
  shiki8: 'OP12-005',
  /** OP01-076 Bellamy: cost 2, 4000, Counter +1000, {Dressrosa}. */
  bellamyDr: 'OP01-076',
  /** OP10-054 Blue Gilly: cost 3, 5000, Counter +1000, {Dressrosa}. */
  gilly: 'OP10-054',
  /** EB03-030 Viola: cost 5, 6000, Counter +2000, {Dressrosa}. */
  viola: 'EB03-030',
  /** OP10-089 Nico Robin: cost 6, 8000, Counter +1000, {Straw Hat Crew}/{Dressrosa}. */
  robin: 'OP10-089',
  /** OP10-050 Hajrudin: cost 7, 9000, Counter +1000, {Giant}/{Dressrosa}/{New Giant Pirates}. */
  hajrudin7: 'OP10-050',
  /** OP12-082 Issho: cost 8, 10000, Counter +1000, {Navy}/{Dressrosa}. */
  issho8: 'OP12-082',
  /** EB05-041 Koala: cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. */
  koala2: 'EB05-041',
  /** OP05-012 Hack: cost 3, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}. */
  hack3: 'OP05-012',
  /** OP09-113 Morley: cost 4, 6000, Counter +1000, {Giant}/{Revolutionary Army}. */
  morley4: 'OP09-113',
  /** OP12-083 Inazuma: cost 5, 6000, Counter +2000, {Revolutionary Army}. */
  inazuma5: 'OP12-083',
  /** OP13-090 Hack: cost 6, 7000, Counter +2000, {Fish-Man}/{Revolutionary Army}/{Dressrosa}. */
  hack6: 'OP13-090',
  /** ST08-011 Monkey.D.Luffy: cost 3, 5000, Counter +1000, {Straw Hat Crew}. Named [Monkey.D.Luffy]. */
  luffyChar: 'ST08-011',
  /** OP05-035 Bellamy: cost 3, 5000, Counter +1000, {Donquixote Pirates}. */
  bellamyDp: 'OP05-035',
  /** OP12-111 Baby 5: cost 2, 4000, Counter +1000, {Donquixote Pirates}. */
  baby5: 'OP12-111',
  /** OP10-073 Buffalo: cost 4, 6000, Counter +1000, {Donquixote Pirates}. */
  buffalo4: 'OP10-073',
  /** OP10-068 Diamante: cost 5, 7000, Counter +1000, {Donquixote Pirates}. */
  diamante5: 'OP10-068',
  /** OP14-066 Diamante: cost 6, 8000, Counter +1000, {Donquixote Pirates}. */
  diamante6: 'OP14-066',
  /** OP12-076 Monet: cost 5, 6000, Counter +2000, {Donquixote Pirates}/{Punk Hazard}. */
  monet5: 'OP12-076',
  /** OP11-045 Vinsmoke Niji: cost 5, 6000, Counter +2000, {The Vinsmoke Family}/{GERMA 66}. */
  niji: 'OP11-045',
  /** OP06-063 Vinsmoke Sora: cost 1, {The Vinsmoke Family}/{Kingdom of GERMA} (a type that merely includes GERMA; has an effect, used only in a deck). */
  sora: 'OP06-063',
} as const;

/** Scripted scenery. */
export const X10 = {
  /** OP04-096 Corrida Coliseum: {Dressrosa} Stage, cost 1. Its text only affects attack timing with a {Dressrosa} Leader. */
  coliseum: 'OP04-096',
  /** OP09-077 Gum-Gum Lightning: Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. */
  lightning: 'OP09-077',
  /** EB05-012 Camie: cost 3, 0 power. [On Play] Rest up to 1 of your opponent's Characters with a cost of 6 or less. */
  camie: 'EB05-012',
  /** OP17-056 Rocks Pirates: blue Event, cost 0 (only used as an Event card in hand or trash). */
  blueEvent: 'OP17-056',
  /** OP17-055 There's No Authority...: blue Event, cost 0. */
  blueEvent2: 'OP17-055',
  /** EB04-040 Flame Dragon Torch: purple Event, cost 1. */
  purpleEvent: 'EB04-040',
  /** OP07-076 Slow-Slow Beam Sword: purple Event, cost 2. */
  purpleEvent2: 'OP07-076',
  /** OP10-044 Cub: cost 1, 2000, {Dressrosa}/{The Tontattas}. */
  cub: 'OP10-044',
  /** OP10-043 Moocy: cost 2, 2000, {Animal}/{Dressrosa}. */
  moocy: 'OP10-043',
} as const;

/** The pending decision as one line, for failure messages. */
export function what(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'no decision';
  return `${d.kind}/${d.purpose} for ${d.player} max=${d.max} min=${d.min}: ${d.prompt} | opts=${(d.options ?? []).map((o) => o.id + ':' + o.label)}`;
}

/**
 * Play `card` from the deciding player's hand with a raw action, paying the cost from active DON!!
 * only while the engine asks for the play cost. Any other prompt is left pending for the test.
 */
export function playRaw(g: TestGame, card: CardId): InstanceId {
  const player: PlayerId = g.decider;
  const i = g.find(player, 'hand', card);
  act(g, { type: 'playCard', card: i });
  for (let k = 0; k < 20; k++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== player || d.purpose !== 'cost') return i;
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay) return i;
    act(g, { type: 'pick', choice: pay });
  }
  return i;
}

/** Pick exactly this instance in the pending `choose`, without `done`. */
export function pickRaw(g: TestGame, i: InstanceId): void {
  need(g, 'choose');
  act(g, { type: 'pick', choice: i });
}

/** `done` on a pending `choose` that allows it, without swallowing a later prompt. */
export function doneRaw(g: TestGame): void {
  need(g, 'choose');
  act(g, { type: 'done' });
}

/** Sorted instances the pending `choose` offers; [] if none is pending. */
export function offeredInsts(g: TestGame): InstanceId[] {
  const d = decision(g);
  return d?.kind === 'choose' ? [...choices(g)].sort() : [];
}

/** Sorted card ids of a zone. */
export function zoneIds(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): string[] {
  return g
    .zone(who, zone)
    .map((c) => c.card)
    .sort();
}

/** True when an `optional` is pending for `who` and "use" is a legal answer. */
export function useOffered(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return (
    d?.kind === 'optional' &&
    d.player === who &&
    g.legal().some((a) => a.type === 'optional' && a.accept)
  );
}

/** Expect the game to be waiting on the Main Phase of `who` with nothing else pending. */
export function expectMain(g: TestGame, who: PlayerId = 'p1'): void {
  const d = decision(g);
  expect(d?.kind, what(g)).toBe('main');
  expect(d?.player).toBe(who);
}

/** Counts offered by a pending count question (a `choose` with purpose `mode`), as strings. */
export function countIds(g: TestGame, who: PlayerId = 'p1'): string[] {
  const d = need(g, 'choose', who);
  expect(d.purpose).toBe('mode');
  return (d.options ?? []).map((o) => o.id);
}

/** Answer a pending count question with exactly `n`. */
export function answerCount(g: TestGame, n: number, who: PlayerId = 'p1'): void {
  const ids = countIds(g, who);
  if (!ids.includes(String(n))) throw new Error(`count ${n} not offered: ${ids}`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

// ---------------------------------------------------------------------------------------------
// "[On Play] You may rest 1 of your {Dressrosa} Leader or Stage cards: Return up to 1 of your
// opponent's Characters with a cost of 1 or less to the owner's hand." (OP10-044 Cub, OP10-048 Sai)
// ---------------------------------------------------------------------------------------------

/** A non-{Dressrosa} Stage: OP03-020 Striker, cost 1, {Whitebeard Pirates}. */
export const STAGE_OTHER = 'OP03-020';

export function describeRestBounce(cfg: { id: CardId; cost: number }): void {
  const { id, cost } = cfg;
  const start = (
    spec: Partial<PlayerSpec> = {},
    p2: Partial<PlayerSpec> = {},
    leader: string | { card: string; rested: boolean } = L10.dressrosa,
  ) => mine(leader, { hand: [id], ...spec }, { characters: [C10.mohji], ...p2 });
  const leaderRested = (g: TestGame) => g.card(g.leader('p1')).rested;
  describe(`${id} [On Play] rest my {Dressrosa} Leader or Stage: return up to 1 opposing Character with cost 1 or less`, () => {
    it(`printed cost ${cost}; with the Leader rested as the cost the cost-1 Character returns to its owner's hand`, () => {
      const g = start();
      expect(g.card(g.find('p1', 'hand', id)).cost).toBe(cost);
      playRaw(g, id);
      need(g, 'optional', 'p1');
      act(g, { type: 'optional', accept: true });
      need(g, 'choose', 'p1');
      pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
      expectMain(g);
      expect(leaderRested(g)).toBe(true);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
      expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.mohji]);
      expect(zoneIds(g, 'p1', 'characters')).toEqual([id]);
    });

    it('only opposing Characters with a cost of 1 or less are offered: a cost-2 Character and the Leader are not', () => {
      const g = start({}, { characters: [C10.mohji, C10.sai, C10.gordon] });
      playRaw(g, id);
      act(g, { type: 'optional', accept: true });
      need(g, 'choose', 'p1');
      expect(offeredInsts(g).map((i) => g.card(i).card)).toEqual([C10.gordon, C10.mohji].sort());
    });

    it('"up to 1": at most one Character returns even when two qualify', () => {
      const g = start({}, { characters: [C10.mohji, C10.gordon] });
      playRaw(g, id);
      act(g, { type: 'optional', accept: true });
      pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
      expectMain(g);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.gordon]);
      expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.mohji]);
    });

    it('"up to 1": choosing nobody still pays the cost (the Leader is rested) and returns nothing', () => {
      const g = start();
      playRaw(g, id);
      act(g, { type: 'optional', accept: true });
      need(g, 'choose', 'p1');
      doneRaw(g);
      expectMain(g);
      expect(leaderRested(g)).toBe(true);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
    });

    it('declining ("you may"): the Leader stays active and nothing returns', () => {
      const g = start();
      playRaw(g, id);
      need(g, 'optional', 'p1');
      act(g, { type: 'optional', accept: false });
      expectMain(g);
      expect(leaderRested(g)).toBe(false);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
    });

    it('with a Character whose cost is 2 or more only, the effect returns nothing', () => {
      const g = start({}, { characters: [C10.sai] });
      playRaw(g, id);
      act(g, { type: 'optional', accept: true });
      if (kind(g) === 'choose') {
        expect(offeredInsts(g)).toEqual([]);
        doneRaw(g);
      }
      expectMain(g);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.sai]);
    });

    it('a non-{Dressrosa} Leader and no Stage: the cost cannot be paid, nothing returns', () => {
      const g = start({}, {}, L10.luffy);
      playRaw(g, id);
      mustBeUnpayable(g, 'p1');
      expectMain(g);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
      expect(leaderRested(g)).toBe(false);
    });

    it('a rested {Dressrosa} Leader cannot be rested again: the cost cannot be paid', () => {
      const g = start({}, {}, { card: L10.dressrosa, rested: true });
      playRaw(g, id);
      mustBeUnpayable(g, 'p1');
      expectMain(g);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
    });

    it('a {Dressrosa} Stage pays the cost with a non-{Dressrosa} Leader: the Stage is rested, the Leader is not', () => {
      const g = start({ stage: X10.coliseum }, {}, L10.luffy);
      playRaw(g, id);
      need(g, 'optional', 'p1');
      act(g, { type: 'optional', accept: true });
      if (decision(g)?.kind === 'choose' && decision(g)?.purpose === 'cost') {
        pickRaw(g, g.zone('p1', 'stage')[0]!.instance);
      }
      need(g, 'choose', 'p1');
      pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
      expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
      expect(leaderRested(g)).toBe(false);
      expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.mohji]);
    });

    it('a Stage without the {Dressrosa} type does not pay the cost', () => {
      const g = start({ stage: STAGE_OTHER }, {}, L10.luffy);
      playRaw(g, id);
      mustBeUnpayable(g, 'p1');
      expect(g.zone('p1', 'stage')[0]!.rested).toBe(false);
      expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
    });

    it('with a {Dressrosa} Leader and Stage the cost is a choice of the two: resting the Stage leaves the Leader active', () => {
      const g = start({ stage: X10.coliseum });
      playRaw(g, id);
      act(g, { type: 'optional', accept: true });
      const d = need(g, 'choose', 'p1');
      expect(d.purpose).toBe('cost');
      expect(offeredInsts(g)).toEqual([g.leader('p1'), g.zone('p1', 'stage')[0]!.instance].sort());
      pickRaw(g, g.zone('p1', 'stage')[0]!.instance);
      need(g, 'choose', 'p1');
      pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
      expect(leaderRested(g)).toBe(false);
      expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    });
  });
}
