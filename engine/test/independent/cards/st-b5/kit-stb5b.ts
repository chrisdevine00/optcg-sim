/**
 * Helpers for the ST-32 to ST-36 (block 5 starter decks) group-B independent card tests. Public API,
 * frozen fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests
 * repeat the ones they rely on.
 *
 * Answer helpers accept exactly one named prompt kind (`yes` / `no` need an `optional`, `payHand`
 * a cost `choose`, ...) and fail on anything else. Cards are played with the raw `playCard`
 * action (`raw`), never with a helper that could answer a pending target choice (OP16-R6).
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, kind } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LDB = {
  /** ST05-001 Shanks: Purple, 5000, 5 Life, Slash, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  slash: 'ST05-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, Strike, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  strike: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, Special, {Kid Pirates}/{Supernovas}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST06-001 Sakazuki: Black, 5000, 5 Life, Special, {Navy}. [Activate: Main] only. */
  navy: 'ST06-001',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, 5 Life, Strike, {Big Mom Pirates}. Only a [DON!! x1] [When Attacking]. */
  bmp: 'OP03-099',
} as const;

/** The cards under test. */
export const T = {
  kinemon: 'ST32-001',
  oden: 'ST32-002',
  rayleigh: 'ST32-004',
  zoro: 'ST32-005',
  koby: 'ST33-001',
  sakazuki: 'ST33-002',
  smoker: 'ST33-003',
  garp: 'ST33-005',
  katakuri: 'ST34-001',
  cracker: 'ST34-002',
  tamago: 'ST34-005',
  hack: 'ST35-001',
  lindbergh: 'ST35-002',
  karasu: 'ST35-003',
  koala: 'ST35-004',
  kuma: 'ST35-005',
  cavendish: 'ST36-001',
  killer: 'ST36-002',
  apoo: 'ST36-003',
  barto: 'ST36-004',
} as const;

/** Vanilla scenery Characters, by (cost, power). Distinct names unless noted. */
export const SB = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  c1p3: 'OP02-060',
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, Counter +1000, {Mountain Bandits}. Inert alone. */
  c1p2: 'OP13-009',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0, Counter +1000, {Alabasta}. Inert alone. */
  c2p0: 'OP04-012',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  c2p4: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  c3p5: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  c4p6: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  c5p7: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  c6p8: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  c7p9: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. */
  c8p10: 'OP12-005',
} as const;

/** Scenery with a type the cards under test look for. All vanilla (no text). */
export const TY = {
  /** ST06-009 Fullbody: Black, cost 2, 4000, Counter +1000, Strike, {Navy}. */
  navy2: 'ST06-009',
  /** ST06-011 Momonga: Black, cost 4, 6000, Counter +1000, Slash, {Navy}. */
  navy4: 'ST06-011',
  /** OP06-049 Sengoku: Blue, cost 5, 7000, Counter +1000, Strike, {Navy}. */
  blueNavy5: 'OP06-049',
  /** OP12-052 Fullbody: Blue, cost 4, 6000, Counter +1000, Strike, {Navy}. */
  blueNavy4: 'OP12-052',
  /** OP12-045 Jango: Blue, cost 6, 8000, Counter +1000, Slash, {Navy}. */
  blueNavy8000: 'OP12-045',
  /** OP05-044 John Giant: Blue, cost 8, 10000, Counter +1000, {Giant}/{Navy}. */
  blueNavy10000: 'OP05-044',
  /** ST02-006 Koby: Green, cost 4, 6000, Counter +1000, {Navy}. Not blue. */
  greenNavy: 'ST02-006',
  /** EB05-041 Koala: Black, cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. */
  ra4000: 'EB05-041',
  /** OP06-016 Raise Max: Red, cost 1, 2000, Counter +1000, {Revolutionary Army}. Only an [Activate: Main]. */
  ra2000: 'OP06-016',
  /** OP05-012 Hack: Red, cost 3, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}. */
  ra5000: 'OP05-012',
  /** OP12-083 Inazuma: Black, cost 5, 6000, Counter +2000, {Revolutionary Army}. */
  ra6000: 'OP12-083',
  /** OP10-101 Urouge: Yellow, cost 5, 7000, Counter +1000, {Fallen Monk Pirates}/{Supernovas}. */
  supernovas: 'OP10-101',
  /** OP10-105 Cavendish: Yellow, cost 6, 8000, Counter +1000, {Beautiful Pirates}/{Supernovas}/{Dressrosa}. */
  supernovas2: 'OP10-105',
} as const;

/** Raw `playCard` action: any prompt that follows stays pending. */
export function raw(g: TestGame, card: CardId, who: PlayerId = g.decider): InstanceId {
  const i = g.find(who, 'hand', card);
  act(g, { type: 'playCard', card: i });
  return i;
}

/**
 * Pay the play cost of a card just played with `raw`: answers `costActive` DON!! picks while the
 * pending decision is a `choose` with purpose `cost`, and nothing else.
 */
export function payPlay(g: TestGame): void {
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.purpose !== 'cost') return;
    const pay = g
      .legal()
      .find(
        (a) =>
          a.type === 'pick' &&
          typeof a.choice === 'object' &&
          a.choice !== null &&
          'from' in a.choice &&
          a.choice.from === 'costActive',
      );
    if (!pay) return;
    g.act(pay);
  }
}

/** Play a card from the deciding player's hand with a raw action, then pay any DON!! pick. */
export function playRaw(g: TestGame, card: CardId, who: PlayerId = g.decider): InstanceId {
  const i = raw(g, card, who);
  payPlay(g);
  return i;
}

/** Power of the nth Character with this card id of `who` (current, from `derive`). */
export function pw(g: TestGame, who: PlayerId, card: CardId, nth = 0): number | null {
  return g.power(g.find(who, 'characters', card, nth));
}

/** Current cost of the nth Character with this card id of `who`. */
export function ct(g: TestGame, who: PlayerId, card: CardId, nth = 0): number | null {
  return g.card(g.find(who, 'characters', card, nth)).cost;
}

/** Number of Characters `who` has. */
export function nChars(g: TestGame, who: PlayerId): number {
  return g.zone(who, 'characters').length;
}

/**
 * Answer a pending "choose how to pay" question (a `choose` with purpose `mode`) with the option
 * whose label matches `which`: `leader` is "rest 1 of your cards", `don` is "rest 1 DON!!". If no
 * such question is pending the engine resolved the only possibility itself and nothing is done.
 */
export function restVia(g: TestGame, which: 'leader' | 'don'): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.purpose !== 'mode' || !d.options) return;
  const o = d.options.find((x) => (which === 'don' ? /DON/.test(x.label) : /cards?/.test(x.label)));
  if (!o) throw new Error(`No ${which} option among ${d.options.map((x) => x.label)}`);
  act(g, { type: 'pick', choice: { option: o.id } });
}

/** Labels of the options of the pending `choose` (empty when none). */
export function optionLabels(g: TestGame): string[] {
  return (decision(g)?.options ?? []).map((o) => o.label);
}

/** Say yes at the pending `optional`, then pay a hand cost with `cards` (a `choose` with purpose cost). */
export function mayPayHand(g: TestGame, cards: CardId[], who: PlayerId = 'p1'): void {
  need(g, 'optional', who);
  act(g, { type: 'optional', accept: true });
  const d = need(g, 'choose', who);
  expect(d.purpose).toBe('cost');
  for (const c of cards) {
    const hit = choices(g).find((i) => g.card(i).card === c);
    if (!hit) throw new Error(`${c} is not a cost candidate`);
    act(g, { type: 'pick', choice: hit });
  }
  if (kind(g) === 'choose' && decision(g)?.purpose === 'cost' && canFinish(g)) {
    act(g, { type: 'done' });
  }
}
