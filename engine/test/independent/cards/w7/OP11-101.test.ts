/**
 * OP11-101 Capone"Gang"Bege (Character, Yellow, cost 2, 1000, Counter +1000, Ranged, {Firetank
 * Pirates}/{Supernovas}, [Blocker]).
 *
 * Card text: "[Blocker]
 * [Once Per Turn] If your "Supernovas" type Character other than [Capone"Gang"Bege] would be
 * removed from the field by your opponent's effect, you may add it to the top of your Life cards
 * face-down instead."
 *
 * Rules: CR 8-1-3 (replacement effects: optional "you may"; the replaced event does not happen),
 * "removed from the field" covers K.O., return to hand, trash and Life placement (CR 3-1-6: a
 * different card afterwards), a K.O. in battle is not "by an effect", "other than [Name]" excludes by
 * NAME (a second card named [Capone"Gang"Bege] is excluded too), the exact type "Supernovas",
 * [Once Per Turn] is once per turn of the game (either player's turn), DON!! given to a Character
 * that leaves the field return to the cost area, rules-digest 107 (placed in Life face-down unless
 * told otherwise), 136 (Life count is public). A replaced Character is not K.O.'d, so no [On K.O.].
 * Scenery (printed): OP10-019 Divine Departure (Red Event, cost 1, "You may rest 5 DON!!: K.O. up to 1
 * Character with 8000 power or less"), OP14-008 Apoo (Supernovas, cost 3, 5000), OP10-101 Urouge (Supernovas, 5,
 * 7000), OP17-100 Capone"Gang"Bege (Supernovas, cost 7, same NAME), OP01-023 Marco (not
 * Supernovas), OP10-079 God Thread (Event, cost 5, "K.O. up to 1 ... cost 5 or less", then add
 * a DON!!), OP12-060 Boeuf Burst (Event, cost 3, needs a multicoloured Leader: "return up to 1
 * Character cost 4 or less to hand"), OP01-002 Law (multicoloured Leader), OP02-007 Thatch (8000).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision, endTurn, noDefence } from '../../helpers.ts';
import { myTurn, side, theirTurn } from '../kit.ts';
import {
  anomalies,
  asksOption,
  BLUE,
  blockers,
  donTotal,
  handOf,
  kw,
  L7,
  lifeFaces,
  lifeOf,
  need,
  no,
  ofZone,
  optionIds,
  pickCards,
  pickOption,
  put,
  RED,
  S7,
  yes,
} from './kit-w7a.ts';

const ID = 'OP11-101';
const GT = 'OP10-079';
const BOEUF = 'OP12-060';
const MERMAN = 'OP11-116';
const DEPARTURE = 'OP10-019';
const [A, B] = [S7.c1, S7.c2];

/** p2's turn 4. p1 holds Bege and `chars`; p2 holds `hand` with plenty of DON!!. */
function start(
  chars: PlayerSpec['characters'],
  hand: CardId[] = [GT],
  p1: Partial<PlayerSpec> = {},
) {
  return theirTurn(
    side(L7.luffy, BLUE, { characters: [ID, ...(chars ?? [])], life: [A, B], ...p1 }),
    side(L7.crocodile, RED, { hand, costArea: { active: 10, rested: 0 } }),
  );
}

/** p2 plays God Thread on `target` (p1's Character) and answers its DON!! count with none. */
function koWith(
  g: ReturnType<typeof start>,
  target: CardId,
  answerOptional: 'yes' | 'no' | 'none' = 'none',
) {
  put(g, GT);
  need(g, 'choose', 'p2');
  pickCards(g, [target]);
  if (answerOptional === 'yes') yes(g, 'p1');
  if (answerOptional === 'no') no(g, 'p1');
  settleCount(g);
}

/** God Thread's second half: p2 adds no DON!! (a count question for p2). */
function settleCount(g: ReturnType<typeof start>) {
  while (
    decision(g)?.kind === 'choose' &&
    decision(g)?.player === 'p2' &&
    optionIds(g).includes('0')
  ) {
    g.act({ type: 'pick', choice: { option: '0' } });
  }
}

describe('OP11-101 Capone"Gang"Bege: [Blocker]', () => {
  it('has the [Blocker] keyword and can block an attack on my Leader', () => {
    const g = start([], []);
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
  });

  it('is offered as a blocker when the opponent attacks my Leader', () => {
    const g = theirTurn(
      side(L7.luffy, BLUE, { characters: [ID], life: [A, B] }),
      side(L7.crocodile, RED, {}),
    );
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
    noDefence(g);
  });
});

describe('OP11-101 Capone"Gang"Bege: [Once Per Turn] a {Supernovas} Character removed by the opponent\'s effect goes to the top of my Life instead', () => {
  it("printed effect: accepting puts the K.O.'d Apoo on top of my Life face-down, not in the trash", () => {
    const g = start([S7.sn3]);
    koWith(g, S7.sn3, 'yes');
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([S7.sn3, A, B]);
    expect(lifeFaces(g, 'p1')).toEqual([false, false, false]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(anomalies(g)).toBe(0);
  });

  it("declining: the Character is K.O.'d as usual, my Life is unchanged", () => {
    const g = start([S7.sn3]);
    koWith(g, S7.sn3, 'no');
    expect(ofZone(g, 'p1', 'trash')).toEqual([S7.sn3]);
    expect(lifeOf(g, 'p1')).toEqual([A, B]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('Bege itself is not protected ("other than"): K.O.\'d without a question', () => {
    const g = start([S7.sn3]);
    put(g, GT);
    pickCards(g, [ID]);
    expect(decision(g)?.kind).not.toBe('optional');
    settleCount(g);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    expect(lifeOf(g, 'p1')).toEqual([A, B]);
  });

  it('another card NAMED Capone"Gang"Bege (OP17-100, a {Supernovas} Character) is excluded too: K.O.\'d without a question', () => {
    const g = theirTurn(
      side(L7.luffy, BLUE, { characters: [ID, S7.bege7], life: [A, B] }),
      side(L7.crocodile, RED, { hand: [DEPARTURE], costArea: { active: 6, rested: 0 } }),
    );
    put(g, DEPARTURE);
    // Divine Departure: "You may rest 5 of your DON!! cards: K.O. up to 1 ... 8000 power or less."
    yes(g, 'p2');
    need(g, 'choose', 'p2');
    pickCards(g, [S7.bege7]);
    expect(decision(g)?.kind).not.toBe('optional');
    expect(ofZone(g, 'p1', 'trash')).toEqual([S7.bege7]);
    expect(lifeOf(g, 'p1')).toEqual([A, B]);
  });

  it('the same removal on Apoo (cost 3, 5000) is replaced: the name filter is what separates the two', () => {
    const g = theirTurn(
      side(L7.luffy, BLUE, { characters: [ID, S7.sn3], life: [A, B] }),
      side(L7.crocodile, RED, { hand: [DEPARTURE], costArea: { active: 6, rested: 0 } }),
    );
    put(g, DEPARTURE);
    yes(g, 'p2');
    pickCards(g, [S7.sn3]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(lifeOf(g, 'p1')[0]).toBe(S7.sn3);
  });

  it("a Character that is not {Supernovas} (Marco) is K.O.'d without a question", () => {
    const g = start([S7.c3]);
    put(g, GT);
    pickCards(g, [S7.c3]);
    expect(decision(g)?.kind).not.toBe('optional');
    settleCount(g);
    expect(ofZone(g, 'p1', 'trash')).toEqual([S7.c3]);
    expect(lifeOf(g, 'p1')).toEqual([A, B]);
  });

  it('[Once Per Turn]: a second {Supernovas} removal in the same turn is not replaced', () => {
    const g = start([S7.sn3, S7.sn5], [GT, GT]);
    koWith(g, S7.sn3, 'yes');
    expect(lifeOf(g, 'p1')[0]).toBe(S7.sn3);
    put(g, GT);
    pickCards(g, [S7.sn5]);
    expect(decision(g)?.kind).not.toBe('optional');
    settleCount(g);
    expect(ofZone(g, 'p1', 'trash')).toEqual([S7.sn5]);
    expect(g.life('p1')).toBe(3);
  });

  it("after a declined replacement the Character is K.O.'d (whether a decline spends the [Once Per Turn] is not asserted)", () => {
    // Whether a declined use spends the [Once Per Turn] is not settled by the rules on file; only
    // the first K.O. (declined) is asserted here.
    const g = start([S7.sn3, S7.sn5], [GT, GT]);
    koWith(g, S7.sn3, 'no');
    expect(ofZone(g, 'p1', 'trash')).toEqual([S7.sn3]);
  });

  it("a K.O. in battle is not an effect: the {Supernovas} Character is K.O.'d and nothing is asked", () => {
    const g = theirTurn(
      side(L7.luffy, BLUE, { characters: [ID, { card: S7.sn3, rested: true }], life: [A, B] }),
      side(L7.crocodile, RED, { characters: [S7.c6] }),
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', S7.c6),
      target: g.find('p1', 'characters', S7.sn3),
    });
    noDefence(g);
    expect(decision(g)?.kind).not.toBe('optional');
    expect(ofZone(g, 'p1', 'trash')).toEqual([S7.sn3]);
    expect(lifeOf(g, 'p1')).toEqual([A, B]);
  });

  it('returning the Character to the hand is a removal too: it goes to the top of my Life instead', () => {
    const g = theirTurn(
      side(L7.luffy, BLUE, { characters: [ID, S7.sn3], life: [A, B] }),
      side(L7.law, RED, { hand: [BOEUF], costArea: { active: 3, rested: 0 } }),
    );
    put(g, BOEUF);
    need(g, 'choose', 'p2');
    const bounce = (decision(g)?.options ?? []).find((o) => /return/i.test(o.label));
    expect(bounce).toBeTruthy();
    g.act({ type: 'pick', choice: { option: bounce!.id } });
    pickCards(g, [S7.sn3]);
    yes(g, 'p1');
    expect(lifeOf(g, 'p1')).toEqual([S7.sn3, A, B]);
    expect(handOf(g, 'p1')).toEqual([]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
  });

  it("the replaced Character is not K.O.'d and the DON!! given to it return: my DON!! total is unchanged", () => {
    const g = start([{ card: S7.sn3, don: 2 }], [GT], { costArea: { active: 1, rested: 0 } });
    const before = donTotal(g, 'p1');
    koWith(g, S7.sn3, 'yes');
    expect(donTotal(g, 'p1')).toBe(before);
    expect(lifeOf(g, 'p1')[0]).toBe(S7.sn3);
  });

  it('without Bege on the field nothing is replaced', () => {
    const g = theirTurn(
      side(L7.luffy, BLUE, { characters: [S7.sn3], life: [A, B] }),
      side(L7.crocodile, RED, { hand: [GT], costArea: { active: 5, rested: 0 } }),
    );
    put(g, GT);
    pickCards(g, [S7.sn3]);
    expect(decision(g)?.kind).not.toBe('optional');
    settleCount(g);
    expect(ofZone(g, 'p1', 'trash')).toEqual([S7.sn3]);
  });

  it('my OWN removal effect is not "your opponent\'s effect": my Merman Combat on my own Apoo is not replaced (face-up, no question)', () => {
    const g = myTurn(
      side(L7.luffy, BLUE, {
        characters: [ID, S7.sn3],
        life: [A, B],
        hand: [MERMAN],
        costArea: { active: 6, rested: 0 },
      }),
      side(L7.crocodile, RED, {}),
    );
    put(g, MERMAN);
    need(g, 'choose', 'p1');
    pickCards(g, [S7.sn3]);
    expect(decision(g)?.kind).not.toBe('optional');
    if (asksOption(g, 'p1')) pickOption(g, 'top');
    expect(lifeOf(g, 'p1')).toEqual([S7.sn3, A, B]);
    expect(lifeFaces(g, 'p1')).toEqual([true, false, false]);
  });

  it("the opponent's Merman Combat on my Apoo: accepting makes the Life card face-DOWN (the replacement), declining leaves their face-up placement", () => {
    const run = (accept: boolean) => {
      const g = theirTurn(
        side(L7.luffy, BLUE, { characters: [ID, S7.sn3], life: [A, B] }),
        side(L7.crocodile, RED, { hand: [MERMAN], costArea: { active: 6, rested: 0 } }),
      );
      put(g, MERMAN);
      need(g, 'choose', 'p2');
      pickCards(g, [S7.sn3]);
      for (let i = 0; i < 4 && decision(g)?.kind !== 'main'; i++) {
        const d = decision(g);
        if (d?.kind === 'optional') (accept ? yes : no)(g, 'p1');
        else if (asksOption(g, 'p2')) pickOption(g, 'top');
        else break;
      }
      return g;
    };
    const taken = run(true);
    expect(lifeOf(taken, 'p1')).toEqual([S7.sn3, A, B]);
    expect(lifeFaces(taken, 'p1')[0]).toBe(false);
    const declined = run(false);
    expect(lifeOf(declined, 'p1')).toEqual([S7.sn3, A, B]);
    expect(lifeFaces(declined, 'p1')[0]).toBe(true);
  });

  it("[Once Per Turn] renews each turn: replaced again in the opponent's next turn", () => {
    const g = start([S7.sn3, S7.sn5], [GT, GT]);
    koWith(g, S7.sn3, 'yes');
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    put(g, GT);
    pickCards(g, [S7.sn5]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    settleCount(g);
    expect(lifeOf(g, 'p1')[0]).toBe(S7.sn5);
    expect(ofZone(g, 'p1', 'trash')).toEqual([]);
  });
});
