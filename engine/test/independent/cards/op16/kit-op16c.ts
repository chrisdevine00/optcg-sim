/**
 * Helpers for the OP-16 group-C independent card tests. Public API, frozen fixtures and the earlier
 * kits only. Answer helpers accept ONE named kind of prompt (see kit-op17b.ts) and fail on anything
 * else, so a missing or extra "up to" / "you may" prompt is caught.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, passBlock } from '../../helpers.ts';
import { kind } from '../kit.ts';
import {
  at,
  atMain,
  BLUE,
  cardIds,
  deck,
  hand,
  LD,
  mine,
  no,
  offeredIds,
  payHand,
  play,
  trash,
  unusable,
  yes,
} from '../op17/kit-op17b.ts';

export * from '../op17/kit-op17b.ts';

/** Leaders used as scenery (OP-16 group C). */
export const LD16 = {
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. Only a [DON!! x1][Opponent's Turn] boost. */
  wano: LD.neutral,
  /** OP16-080 Marshall.D.Teach: Black/Yellow, 5000, 4 Life, {Blackbeard Pirates}/{The Seven Warlords of the Sea}. [Opponent's Turn] own Characters +1 cost; [On your Opponent's Attack] [Once Per Turn] trash a [Trigger] card from hand (none in these hands). */
  teach: 'OP16-080',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla: no relevant type. */
  plain: LD.luffy,
  /** ST05-001 Shanks: Purple, 5000, 5 Life, no {Land of Wano}, no {Blackbeard Pirates}. */
  other: LD.rhp,
} as const;

/** Scenery Characters, vanilla unless noted. Stats are repeated where a test relies on them. */
export const SC16 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  wano1: 'OP01-010',
  /** ST09-006 Kouzuki Momonosuke: Yellow, cost 2, 4000, Counter +1000, {Land of Wano}/{Kouzuki Clan}. Named [Kouzuki Momonosuke]. */
  momo2: 'ST09-006',
  /** OP01-043 Shinobu: Green, cost 3, 5000, Counter +1000, {Land of Wano}. */
  wano3: 'OP01-043',
  /** OP12-023 Kawamatsu: Green, cost 5, 6000, Counter +2000, {Fish-Man}/{Land of Wano}/{The Akazaya Nine}. */
  wano5: 'OP12-023',
  /** P-064 Kouzuki Momonosuke: Yellow, cost 6, 8000, Counter +1000, {Land of Wano}/{Kouzuki Clan}. Named [Kouzuki Momonosuke]. */
  momo6: 'P-064',
  /** OP12-025 Kin'emon: Green, cost 6, 8000, Counter +1000, {Land of Wano}/{The Akazaya Nine}. */
  wano6: 'OP12-025',
  /** OP01-092 Urashima: Purple, cost 7, 9000, Counter +1000, {Land of Wano}. */
  wano7: 'OP01-092',
  /** OP16-086 Sanji: Black, cost 8, 9000, Counter +2000, {Land of Wano}/{Straw Hat Crew}. */
  wano8: 'OP16-086',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. No {Land of Wano}. */
  plain8: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter. [On Play] only: never played in these tests. */
  plain9: 'OP01-070',
  /** OP09-082 Avalo Pizarro: Black, cost 4, 6000, Counter +1000, {Blackbeard Pirates}, vanilla. */
  bb4: 'OP09-082',
  /** OP10-084 Sanjuan.Wolf: Black, cost 5, 7000, Counter +1000, {Blackbeard Pirates}/{Giant}, vanilla. */
  bb5: 'OP10-084',
  /** OP09-094 Peachbeard: Black, cost 3, 5000, Counter +1000, type "Peachbeard Pirates Blackbeard Pirates Allies" (includes, is not, {Blackbeard Pirates}). */
  bbAllies3: 'OP09-094',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  wb6: 'OP02-007',
  /** OP02-003 Atmos: Red, cost 4, 6000, Counter +1000, {Whitebeard Pirates}. */
  wb4: 'OP02-003',
  /** OP16-016 Ramba: Red, cost 6, 8000, Counter +1000, type "Whitebeard Pirates Allies" (includes "Whitebeard Pirates"). */
  wbAllies6: 'OP16-016',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, "Giant"/"Whitebeard Pirates Allies". */
  wbAllies7: 'OP02-020',
} as const;

/** p1 builds a Main Phase with the given extras; Leader defaults to the {Land of Wano} Leader. */
export function p1main(
  leader: string,
  spec: Parameters<typeof mine>[1] = {},
  p2: Parameters<typeof mine>[2] = {},
): TestGame {
  return mine(leader, spec, p2);
}

/**
 * Battle K.O. of one of p1's rested Characters during p2's turn: p2's Leader (5000) attacks it.
 * p1 does not block or counter. The Character must be at most 4000 power to lose... callers pass
 * a Character with power below 5000, or give the attacker more power through `attackerChar`.
 * Stops at the first decision p1 or p2 owes after the damage step.
 */
export function theyKo(
  g: TestGame,
  target: InstanceId,
  attacker: InstanceId = g.leader('p2'),
): void {
  attack(g, attacker, target);
  // p1 (defender): the Leader [On your Opponent's Attack] may be asked and cannot be paid.
  if (kind(g) === 'optional') unusable(g, 'p1');
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

/** A deck whose top cards are `top` (top first), then ten plain cards. */
export function deckOf(top: string[]): string[] {
  return [...top, ...Array.from({ length: 10 }, () => BLUE)];
}

/** Play `card` from p1's hand, paying with active DON!! (nothing else is answered). */
export function playIt(g: TestGame, card: string): void {
  play(g, g.find('p1', 'hand', card));
}

/**
 * "[On Play] You may trash 1 Character card with a cost of 8 or more from your hand: Draw 2 cards."
 * (OP16-083 Kouzuki Oden, OP16-092 Nico Robin.)
 */
export function describeTrash8Draw2(id: string): void {
  const BIG = SC16.wano8; // Character, cost 8
  const HUGE = SC16.plain9; // Character, cost 9
  const start = (cards: string[]) => {
    const g = p1main(LD16.wano, {
      hand: [id, ...cards],
      deck: deckOf([SC16.wano1, SC16.wano3, SC16.wano5]),
    });
    playIt(g, id);
    return g;
  };
  describe(`${id} [On Play] you may trash 1 Character with cost 8+ from hand: draw 2`, () => {
    it('yes: trash the cost-8 Character, then draw exactly 2', () => {
      const g = start([BIG, BLUE]);
      yes(g, 'p1');
      payHand(g, [BIG]);
      expect(atMain(g)).toBe(true);
      expect(trash(g)).toEqual([BIG]);
      expect(hand(g)).toEqual([BLUE, SC16.wano1, SC16.wano3].sort());
    });

    it('boundary: cost 8 and cost 9 are offered, cost 7 and a cost-8 Event are not', () => {
      const g = start([BIG, HUGE, SC16.wano7, 'OP16-116']);
      yes(g, 'p1');
      expect(offeredIds(g)).toEqual([BIG, HUGE].sort());
    });

    it('a hand with only a cost-7 Character cannot pay: the effect is not usable and nothing is drawn', () => {
      const g = start([SC16.wano7]);
      unusable(g, 'p1');
      expect(atMain(g)).toBe(true);
      expect(hand(g)).toEqual([SC16.wano7]);
      expect(trash(g)).toEqual([]);
    });

    it('an empty hand cannot pay either', () => {
      const g = start([]);
      unusable(g, 'p1');
      expect(atMain(g)).toBe(true);
      expect(hand(g)).toEqual([]);
    });

    it('declining ("you may"): nothing is trashed and nothing is drawn', () => {
      const g = start([BIG, BLUE]);
      no(g, 'p1');
      expect(atMain(g)).toBe(true);
      expect(hand(g)).toEqual([BIG, BLUE].sort());
      expect(trash(g)).toEqual([]);
      expect(deck(g)).toHaveLength(13);
    });

    it('the cost is exactly one card: with two eligible Characters only the chosen one is trashed', () => {
      const g = start([BIG, HUGE]);
      yes(g, 'p1');
      payHand(g, [HUGE]);
      expect(trash(g)).toEqual([HUGE]);
      expect(hand(g)).toContain(BIG);
      expect(hand(g)).toHaveLength(3);
    });

    it('the deck loses exactly 2 cards, from the top', () => {
      const g = start([BIG]);
      yes(g, 'p1');
      payHand(g, [BIG]);
      expect(deck(g)).toHaveLength(11);
      expect(deck(g)[0]).toBe(SC16.wano5); // the third card of the known top three
    });

    it('the trash cost is a trash, not a play: the Character stays off the field', () => {
      const g = start([BIG]);
      yes(g, 'p1');
      payHand(g, [BIG]);
      expect(cardIds(g, 'p1', 'characters')).toEqual([id]);
    });

    it('the effect belongs to [On Play]: a copy that stays in hand does nothing', () => {
      const g = p1main(LD16.wano, { hand: [id, BIG], deck: deckOf([BLUE, BLUE]) });
      expect(atMain(g)).toBe(true);
      expect(hand(g)).toEqual([id, BIG].sort());
      expect(trash(g)).toEqual([]);
      expect(at(g, 'p1', 'hand', id)).toBeTruthy();
    });
  });
}
