/**
 * OP09-061 Monkey.D.Luffy (Leader, Purple/Black, 5000, 4 Life, Strike, {Straw Hat Crew}/{The Four
 * Emperors}).
 *
 * Card text: "[DON!! x1] All of your Characters gain +1 cost.
 * [Your Turn] [Once Per Turn] When 2 or more DON!! cards on your field are returned to your DON!!
 * deck, add up to 1 DON!! card from your DON!! deck and set it as active, and add up to 1
 * additional DON!! card and rest it."
 *
 * Rules: CR 8-3-2-3 ([DON!! xX]: X or more given DON!!, valid on either turn), CR 1-3-6-2 (cost
 * modifiers), CR 8-3-2-4 ([Your Turn]), CR 10-2-13 ([Once Per Turn]), CR 8-3-1-6 (DON!! −N),
 * CR 4-8-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack } from '../../helpers.ts';
import { canFinish, myTurn, side, theirTurn } from '../kit.ts';
import {
  activateCounter,
  answerCount,
  asksCount,
  BLUE,
  countOptions,
  donOf,
  need,
  put,
  RED,
  returnDon,
  SW,
  yes,
  LW,
} from './kit-w5a.ts';

const ID = 'OP09-061';

/** p1's side with this Leader and `don` DON!! given to it. */
function withLeader(don: number, spec: Partial<PlayerSpec> = {}): PlayerSpec {
  return { ...side(ID, BLUE, spec), leader: { card: ID, don } };
}

function mine(
  o: {
    given?: number;
    hand?: string[];
    active?: number;
    donDeck?: number;
    characters?: PlayerSpec['characters'];
  } = {},
) {
  return myTurn(
    withLeader(o.given ?? 0, {
      hand: o.hand ?? [],
      characters: o.characters ?? [SW.marco],
      costArea: { active: o.active ?? 8, rested: 0 },
      ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
    }),
    side(LW.luffy, RED, { characters: [SW.marco] }),
  );
}

/** Play Gum-Gum Lightning (DON!! -2), choose no K.O. target. Stops at what follows. */
function lightning(g: ReturnType<typeof mine>) {
  put(g, SW.lightning);
  yes(g, 'p1');
  returnDon(g, 2, 'costActive');
  need(g, 'choose', 'p1');
  expect(canFinish(g)).toBe(true);
  act(g, { type: 'done' });
}

describe('OP09-061 Monkey.D.Luffy: [DON!! x1] all my Characters gain +1 cost', () => {
  it('with 1 DON!! given to the Leader, my Character (printed cost 3) has cost 4', () => {
    const g = mine({ given: 1 });
    expect(g.card(g.find('p1', 'characters', SW.marco)).cost).toBe(4);
  });

  it('with no DON!! given the bonus is off: cost 3', () => {
    const g = mine({ given: 0 });
    expect(g.card(g.find('p1', 'characters', SW.marco)).cost).toBe(3);
  });

  it('with 2 DON!! given it is still +1, not +2 ("X or more")', () => {
    const g = mine({ given: 2 });
    expect(g.card(g.find('p1', 'characters', SW.marco)).cost).toBe(4);
  });

  it("the opponent's Characters are not changed", () => {
    const g = mine({ given: 1 });
    expect(g.card(g.find('p2', 'characters', SW.marco)).cost).toBe(3);
  });

  it('given DON!! stay on through the opponent turn, so the bonus holds there too (it is not [Your Turn])', () => {
    const g = theirTurn(withLeader(1, { characters: [SW.marco] }), side(LW.luffy, RED, {}));
    expect(g.card(g.find('p1', 'characters', SW.marco)).cost).toBe(4);
  });

  it('it applies to every Character, whatever its cost (cost 7 becomes 8)', () => {
    const g = mine({ given: 1, characters: [SW.oars] });
    expect(g.card(g.find('p1', 'characters', SW.oars)).cost).toBe(8);
  });
});

describe('OP09-061 Monkey.D.Luffy: the +1 cost is for Characters on the field only', () => {
  it('a Character card in my hand keeps its printed cost (only Characters in the Character area gain +1)', () => {
    const g = mine({ given: 1, hand: [SW.marco], characters: [] });
    expect(g.card(g.find('p1', 'hand', SW.marco)).cost).toBe(3);
  });

  it('playing a Character from hand costs its printed cost: Marco (3) rests 3 DON!!, and then it has cost 4 on the field', () => {
    const g = mine({ given: 1, hand: [SW.marco], characters: [], active: 8 });
    const marco = put(g, SW.marco);
    expect(donOf(g)).toMatchObject({ active: 5, rested: 3 });
    expect(g.card(marco).cost).toBe(4);
  });
});

describe('OP09-061 Monkey.D.Luffy: [Your Turn][Once Per Turn] 2+ DON!! returned: add 1 active and 1 additional rested', () => {
  it('returning 2 DON!! (Gum-Gum Lightning) adds 1 DON!! set active and 1 additional DON!! rested', () => {
    const g = mine({ hand: [SW.lightning], active: 6 });
    lightning(g);
    // 6 active: 2 rested for the Event, 2 returned: 2 active, 2 rested, 6 in the DON!! deck.
    expect(asksCount(g)).toBe(true);
    expect(countOptions(g)).toEqual(['1', '0']);
    answerCount(g, 1);
    if (asksCount(g)) answerCount(g, 1);
    need(g, 'main', 'p1');
    expect(donOf(g)).toMatchObject({ active: 3, rested: 3, deck: 4 });
  });

  it('"up to 1" each: adding none changes nothing', () => {
    const g = mine({ hand: [SW.lightning], active: 6 });
    lightning(g);
    answerCount(g, 0);
    if (asksCount(g)) answerCount(g, 0);
    need(g, 'main', 'p1');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 2, deck: 6 });
  });

  it('with an empty DON!! deck before the return, the 2 returned DON!! supply both adds', () => {
    const g = mine({ hand: [SW.lightning], active: 10, donDeck: 0 });
    lightning(g);
    answerCount(g, 1);
    if (asksCount(g)) answerCount(g, 1);
    need(g, 'main', 'p1');
    expect(donOf(g)).toMatchObject({ active: 7, rested: 3, deck: 0 });
  });

  it('returning only 1 DON!! (Gamma Knife, DON!! -1) does not trigger it', () => {
    const g = mine({ hand: [SW.gammaKnife], active: 6 });
    put(g, SW.gammaKnife);
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    need(g, 'main', 'p1');
    expect(donOf(g)).toMatchObject({ active: 3, rested: 2, deck: 5 });
  });

  it('[Once Per Turn]: a second return of 2 DON!! in the same turn adds nothing', () => {
    const g = mine({ hand: [SW.lightning, SW.lightning], active: 10 });
    lightning(g);
    answerCount(g, 1);
    if (asksCount(g)) answerCount(g, 1);
    need(g, 'main', 'p1');
    const afterFirst = donOf(g);
    lightning(g);
    need(g, 'main', 'p1');
    const afterSecond = donOf(g);
    expect(afterSecond.deck).toBe(afterFirst.deck + 2);
    expect(afterSecond.active + afterSecond.rested).toBe(afterFirst.active + afterFirst.rested - 2);
  });

  it("[Your Turn] only: on the opponent's turn a DON!! -2 return of mine adds nothing", () => {
    const g = theirTurn(
      withLeader(0, { hand: [SW.giant, BLUE], costArea: { active: 6, rested: 0 } }),
      side(LW.luffy, RED, { costArea: { active: 5, rested: 0 } }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    act(g, { type: 'block', blocker: null, player: 'p1' });
    activateCounter(g, g.find('p1', 'hand', SW.giant));
    yes(g, 'p1');
    returnDon(g, 2, 'costActive');
    // "trash 1 card from your hand": the filler. Then the "up to 1" power target: none.
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BLUE) });
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    need(g, 'counter', 'p1');
    // 6 active: 1 rested for the Event, 2 returned: 3 active, 1 rested; nothing was added.
    expect(donOf(g)).toMatchObject({ active: 3, rested: 1, deck: 6 });
  });
});
