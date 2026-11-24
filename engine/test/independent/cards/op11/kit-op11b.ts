/**
 * Helpers for the OP-11 group-B independent card tests (OP11-037 .. OP11-070, 25 cards). Public
 * API, frozen fixtures and the earlier kits only. Scenery stats are noted next to each constant;
 * tests repeat the ones they rely on.
 *
 * Answer helpers accept exactly one named prompt kind and throw on any other, so a missing or
 * extra "up to" / "you may" prompt fails the test. Use raw `g.act` when asserting whether a prompt
 * appears.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, kind } from '../kit.ts';
import {
  atMain,
  BLUE,
  deck,
  hand,
  minus,
  need,
  none,
  offeredIds,
  pickCards,
  settleOrders,
  tail,
} from '../op16/kit-op16b.ts';

export * from '../op16/kit-op16b.ts';

/** Leaders used as scenery. None has text that fires unless a test makes it. */
export const L11 = {
  /** ST01-001 Monkey.D.Luffy: Red (single colour), 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  mono: 'ST01-001',
  /** OP01-002 Trafalgar Law: Green/Red (multicoloured), 5000, 4 Life. [Activate: Main] only. */
  multi: 'OP01-002',
  /** OP06-042 Vinsmoke Reiju: Blue/Purple, 5000, {The Vinsmoke Family}/{GERMA 66}. Only fires on a DON!! return in own turn. */
  vinsmoke: 'OP06-042',
  /** EB01-021 Hannyabal: Blue/Purple, 5000, {Impel Down}. Only an [End of Your Turn]. */
  impel: 'EB01-021',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, {Big Mom Pirates}. Only a [DON!! x1][When Attacking]. */
  bmp: 'OP03-099',
  /** ST03-001 Crocodile: Blue, 5000, {Baroque Works}/{Seven Warlords}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** OP03-022 Arlong: Green, 5000, {Fish-Man}/{Arlong Pirates}/{East Blue}. Only a [DON!! x2][When Attacking]. */
  fish: 'OP03-022',
  /** OP11-040 Monkey.D.Luffy (under test elsewhere): Blue/Purple, 6000, 3 Life. */
  luffy40: 'OP11-040',
  /** OP11-041 Nami (under test elsewhere): Blue/Yellow, 5000, 4 Life. */
  nami41: 'OP11-041',
  /** OP11-062 Charlotte Katakuri (under test elsewhere): Purple, 5000, 5 Life, {Big Mom Pirates}. */
  katakuri62: 'OP11-062',
} as const;

/** Vanilla scenery Characters (no effect, no [Trigger]) with the stats tests rely on. */
export const C11 = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, {Happosui Army}. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000, {Giant}/{New Giant Pirates}. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  c7: 'OP02-020',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, {Rocks Pirates}. */
  c10: 'OP17-118',
  /** OP04-007 Sanji: Red, cost 1, 3000, Counter +1000, {Alabasta}/{Straw Hat Crew}. */
  shc1: 'OP04-007',
  /** OP02-033 Jinbe: Green, cost 2, 4000, Counter +1000, {FILM}/{Fish-Man}/{Straw Hat Crew}. */
  shc2: 'OP02-033',
  /** OP02-028 Usopp: Green, cost 3, 5000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  shc3: 'OP02-028',
  /** OP11-003 Usopp: Red, cost 5, 6000, Counter +2000, {Straw Hat Crew}. */
  shc5: 'OP11-003',
  /** OP05-065 San-Gorou: Purple, cost 6, 8000, Counter +1000, {Straw Hat Crew}. */
  shc6: 'OP05-065',
  /** ST02-002 Vito: Green, cost 3, 5000, Counter +1000, {Firetank Pirates}. */
  fire3: 'ST02-002',
  /** OP11-052 Charlotte Lola: Blue, cost 5, 7000, Counter +1000, {Firetank Pirates}/{Former Rolling Pirates}. */
  fire5: 'OP11-052',
  /** OP11-045 Vinsmoke Niji: Blue, cost 5, 6000, Counter +2000, {The Vinsmoke Family}/{GERMA 66}. */
  germa5: 'OP11-045',
  /** OP11-026 Scaled Neptunian: Green, cost 6, 8000, Counter +1000, {Neptunian}. */
  nep6: 'OP11-026',
  /** OP11-033 Bird Neptunian: Green, cost 6, 7000, Counter +2000, {Neptunian}. */
  nep6b: 'OP11-033',
  /** OP11-032 Surume: Green, cost 5, 6000, Counter +2000, {Animal}/{Fish-Man Island}. */
  fmi5: 'OP11-032',
  /** OP11-113 Ryuboshi: Yellow, cost 5, 7000, Counter +1000, {Merfolk}/{Fish-Man Island}. */
  fmi5b: 'OP11-113',
  /** OP03-101 Camie: Yellow, cost 1, 3000, Counter +1000, {Merfolk}. */
  merfolk1: 'OP03-101',
  /** ST03-006 Jinbe: Blue, cost 2, 4000, Counter +1000, {Fish-Man}/{Seven Warlords}/{Sun Pirates}. */
  fishman2: 'ST03-006',
  /** OP11-078 Decuplets: Purple, cost 5, 6000, Counter +2000, {Big Mom Pirates}. */
  bmpP5: 'OP11-078',
  /** OP08-065 Charlotte Smoothie: Purple, cost 7, 9000, Counter +1000, {Big Mom Pirates}. */
  bmpP7: 'OP08-065',
  /** ST07-006 Charlotte Flampe: Yellow, cost 2, 4000, Counter +1000, {Big Mom Pirates}. */
  bmpY2: 'ST07-006',
  /** OP03-106 Charlotte Opera: Yellow, cost 4, 6000, Counter +1000, {Big Mom Pirates}. */
  bmpY4: 'OP03-106',
  /** ST07-002 Charlotte Anana: Yellow, cost 1, 3000, Counter +1000, {Big Mom Pirates}. Same name as OP11-065. */
  anana: 'ST07-002',
  /** ST05-007 Gordon: Purple, cost 1, 3000, Counter +1000, {FILM}. */
  purple1: 'ST05-007',
  /** OP11-064 Saldeath: Purple, cost 6, 8000, Counter +1000, {Impel Down}. */
  impel6: 'OP11-064',
  /** OP02-084 Blugori: Purple, cost 1, 3000, Counter +1000, {Animal}/{Impel Down}. */
  impel1: 'OP02-084',
  /** OP04-012 Nefeltari Cobra: cost 2, power 0, Counter +1000. Inert alone. */
  cobra0: 'OP04-012',
} as const;

/** Events and other scripted scenery. */
export const E11 = {
  /** OP09-077 Gum-Gum Lightning: Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. Use `opponentKOs`. */
  lightning: 'OP09-077',
  /** OP11-059 Gum-Gum King Cobra (under test elsewhere): Blue Event {Straw Hat Crew}, cost 1. */
  cobra59: 'OP11-059',
  /** OP11-061 Gum-Gum Jet Culverin (under test elsewhere): Blue Event {Straw Hat Crew}, cost 3. */
  culverin61: 'OP11-061',
  /** OP11-060 Let's Crash This Wedding!!! (under test elsewhere): Blue Event {Straw Hat Crew}, cost 1. */
  wedding60: 'OP11-060',
  /** OP11-037 Ancient Weapon Poseidon (under test elsewhere): Green Event {Fish-Man Island}, cost 1. */
  poseidon37: 'OP11-037',
} as const;

/** One-line description of the pending decision, for scratch debugging. */
export function dbg(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'no decision';
  const legal = g
    .legal()
    .map((a) => JSON.stringify(a))
    .slice(0, 14);
  return `${d.kind}/${d.purpose} for ${d.player} max=${d.max}: ${d.prompt} | opts=${(d.options ?? []).map((o) => o.id + ':' + o.label)} | legal=${legal.join(' ')}`;
}

/** Rested flag of an instance. */
export function isRested(g: TestGame, i: InstanceId): boolean {
  return g.card(i).rested;
}

/** The "use" question of an effect, if one is pending: answer it. Returns whether one was asked. */
export function answerIfAsked(g: TestGame, use: boolean, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  if (d?.kind !== 'optional' || d.player !== who) return false;
  act(g, { type: 'optional', accept: use });
  return true;
}

/**
 * After an effect with no candidates: the pick may be asked empty or not asked. Either way answer
 * it once (with `done`) and require the Main Phase afterwards. Throws if the pick offers a card.
 */
export function settleNoCandidates(g: TestGame, mustAsk = false): void {
  if (kind(g) === 'choose') {
    expect(choices(g)).toHaveLength(0);
    if (!canFinish(g)) throw new Error('empty choose without done');
    act(g, { type: 'done' });
  } else if (mustAsk) {
    // A prompt must not depend on hidden cards: the pick is asked at max 0 (DECISIONS, hidden-gate).
    throw new Error(`Expected the empty pick to be asked, got ${dbg(g)}`);
  }
  settleOrders(g);
  if (kind(g) !== 'main') throw new Error(`Expected Main, got ${dbg(g)}`);
}

/** The Counter-Step actions that use `card` (an Event in hand), if any. */
export function counterActionFor(g: TestGame, card: InstanceId) {
  return g.legal().find((a) => (a.type === 'activate' || a.type === 'counter') && a.card === card);
}

/**
 * "Look at n cards from the top of your deck; reveal up to 1 card matching X and add it to your
 * hand. Then place (or trash) the rest." Standard tests. `start(topFirst)` begins the effect with
 * p1's deck being `topFirst` followed by filler, leaving the engine at its candidate pick.
 */
export function describeLook(cfg: {
  id: string;
  n: number;
  start: (deckTop: CardId[]) => TestGame;
  /** Two cards that qualify. */
  match: [CardId, CardId];
  /** A card that does not qualify. */
  miss: CardId;
  /** Further cards that must not be offered, with the reason (printed in the test name). */
  notOffered?: { card: CardId; why: string }[];
  /** Where the rest goes. */
  rest: 'bottom' | 'trash';
}): void {
  const { id, n, start, match, miss, rest } = cfg;
  const beyond = match[0];
  const pad = Array.from({ length: n - 3 }, () => miss);
  const top = (): CardId[] => [match[0], miss, match[1], ...pad];
  const below = (): CardId[] => [beyond, ...Array.from({ length: 8 }, () => BLUE)];
  const begin = (t: CardId[]) => start([...t, ...below()]);
  const total = n + 9;
  const finish = (g: TestGame) => {
    settleOrders(g);
    expect(atMain(g)).toBe(true);
  };
  const restOf = (g: TestGame, looked: CardId[]) => {
    if (rest === 'bottom') {
      expect(deck(g)[0]).toBe(beyond);
      expect(tail(deck(g), looked.length)).toEqual([...looked].sort());
    } else {
      expect(deck(g)[0]).toBe(beyond);
      expect(deck(g)).toHaveLength(total - n);
      expect(
        g
          .zone('p1', 'trash')
          .map((c) => c.card)
          .sort(),
      ).toEqual(expect.arrayContaining([...looked].sort()));
    }
  };
  describe(`${id} look at ${n}, add up to 1, ${rest === 'bottom' ? 'rest to the bottom' : 'trash the rest'}`, () => {
    it('offers exactly the qualifying cards of the top; the pick goes to hand and the rest is placed', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([...match].sort());
      pickCards(g, [match[1]]);
      finish(g);
      expect(hand(g)).toContain(match[1]);
      expect(hand(g).filter((c) => c === match[1])).toHaveLength(1);
      restOf(g, minus(top(), [match[1]]));
      if (rest === 'bottom') expect(deck(g)).toHaveLength(total - 1);
    });

    it('the chosen card is revealed (CR 11-2-1) and the others are not', () => {
      const g = begin(top());
      pickCards(g, [match[1]]);
      finish(g);
      expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === match[1])).toBe(true);
      expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === miss)).toBe(false);
    });

    it('"up to 1": may add nothing; every looked-at card is placed', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      none(g);
      finish(g);
      expect(hand(g)).not.toContain(match[0]);
      expect(hand(g)).not.toContain(match[1]);
      restOf(g, top());
    });

    it('adds at most 1 card even when two qualify', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      pickCards(g, [match[0]]);
      finish(g);
      const added = hand(g).filter((c) => c === match[0] || c === match[1]);
      expect(added).toHaveLength(1);
    });

    it(`only the top ${n} are looked at: a qualifying card in position ${n + 1} is not offered`, () => {
      const g = begin(Array.from({ length: n }, () => miss));
      settleNoCandidates(g, true);
      expect(deck(g)[0]).toBe(beyond);
      expect(hand(g)).not.toContain(beyond);
    });

    for (const { card, why } of cfg.notOffered ?? []) {
      it(`${why}: ${card} is not offered but the real match is`, () => {
        const g = begin([card, match[0], ...Array.from({ length: n - 2 }, () => miss)]);
        need(g, 'choose', 'p1');
        expect(offeredIds(g)).toEqual([match[0]]);
      });
    }

    it('with no qualifying card in the top, nothing is added and all looked-at cards are placed', () => {
      const g = begin(Array.from({ length: n }, () => miss));
      settleNoCandidates(g, true);
      expect(hand(g).filter((c) => c === miss)).toHaveLength(0);
      restOf(
        g,
        Array.from({ length: n }, () => miss),
      );
    });
  });
}
