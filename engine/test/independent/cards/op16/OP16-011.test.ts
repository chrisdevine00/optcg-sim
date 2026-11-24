/**
 * OP16-011 Vista (Character, Red, cost 6, 8000, no Counter, {Whitebeard Pirates}, Slash).
 *
 * Card text: "[On Play] You may reveal 1 Character card with 8000 power from your hand: Draw 1 card.
 * [DON!! x1] [When Attacking] K.O. Up to 2 of your opponent's Characters with 2000 base power or
 * less."
 *
 * Rules: CR 8-3-1 (costs), CR 8-3-2-3 ([DON!! xX] is a state check, X or more given DON!!), "up to 2"
 * (CR 8-4-4-1), "base power" ignores effects (CR 4-9-2), CR 10-2-5 ([When Attacking]).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  charIds,
  choose,
  choices,
  deck,
  describeEightKCost,
  fill,
  gammaKnife,
  mayChooseNone,
  mine,
  need,
  none,
  noDefence,
  OL,
  OV,
  offeredIds,
  payHand,
  pickInst,
  playCard,
  RED,
  SC2,
  trash,
  yes,
  n,
  kind,
} from './kit-op16a.ts';

const VISTA = 'OP16-011';
const DECK = fill(RED, 6);

function playIt(extra: string[]) {
  const g = mine(OL.luffy, { hand: [VISTA, ...extra], deck: DECK });
  playCard(g, VISTA);
  return g;
}

describeEightKCost({
  id: VISTA,
  verb: 'reveal',
  start: playIt,
  happened: (g) => n(g, 'p1', 'deck') < DECK.length,
});

/** p1's Vista (with `don` DON!! given) attacks p2's Leader; stops at the first prompt. */
function swing(p2chars: string[], don = 1, extraMine: string[] = []) {
  const g = mine(
    OL.luffy,
    {
      characters: [{ card: VISTA, don }, ...extraMine],
      costArea: { active: 10 - don, rested: 0 },
    },
    { characters: p2chars },
  );
  attack(g, at(g, 'p1', 'characters', VISTA), g.leader('p2'));
  return g;
}

describe('OP16-011 Vista: [On Play] draw 1', () => {
  it('draws exactly 1 card and keeps the revealed card', () => {
    const g = playIt([OV.thatch]);
    yes(g);
    payHand(g, [OV.thatch]);
    expect(deck(g)).toHaveLength(DECK.length - 1);
    expect(g.zone('p1', 'hand').map((c) => c.card).sort()).toEqual([OV.thatch, RED].sort());
    expect(atMain(g)).toBe(true);
  });
});

describe('OP16-011 Vista: [DON!! x1] [When Attacking] K.O. up to 2 base-2000-or-less Characters', () => {
  it('with 1 DON!! given, the attack asks for up to 2 targets among base-2000-or-less Characters', () => {
    const g = swing([OV.dadan2, OV.cobra0, OV.komachiyo3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OV.cobra0, OV.dadan2].sort());
  });

  it('K.O.s both chosen Characters (2 targets) and they go to the opponent\'s trash', () => {
    const g = swing([OV.dadan2, OV.cobra0]);
    choose(g, [at(g, 'p2', 'characters', OV.dadan2), at(g, 'p2', 'characters', OV.cobra0)]);
    expect(charIds(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([OV.cobra0, OV.dadan2].sort());
  });

  it('K.O.s at most 2 even when 3 qualify', () => {
    const g = swing([OV.dadan2, OV.cobra0, OV.whiteyBay2]);
    need(g, 'choose');
    expect(decisionMax(g)).toBe(2);
    choose(g, [at(g, 'p2', 'characters', OV.dadan2), at(g, 'p2', 'characters', OV.cobra0)]);
    expect(charIds(g, 'p2')).toEqual([OV.whiteyBay2]);
  });

  it('"up to": one target is fine, and none is fine', () => {
    const one = swing([OV.dadan2, OV.cobra0]);
    expect(mayChooseNone(one)).toBe(true);
    choose(one, [at(one, 'p2', 'characters', OV.dadan2)]);
    expect(charIds(one, 'p2')).toEqual([OV.cobra0]);
    const zero = swing([OV.dadan2]);
    none(zero);
    expect(charIds(zero, 'p2')).toEqual([OV.dadan2]);
  });

  it('boundary: base 2000 qualifies, base 3000 does not', () => {
    const g = swing([OV.dadan2, OV.komachiyo3]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2]);
  });

  it('"base power": a 3000-base Character reduced below 2000 this turn is not a candidate', () => {
    const g = mine(
      OL.shanks,
      {
        hand: [SC2.gammaKnife],
        characters: [{ card: VISTA, don: 1 }],
        costArea: { active: 8, rested: 0 },
      },
      { characters: [OV.komachiyo3, OV.dadan2] },
    );
    gammaKnife(g, at(g, 'p2', 'characters', OV.komachiyo3));
    attack(g, at(g, 'p1', 'characters', VISTA), g.leader('p2'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2]);
  });

  it('[DON!! x1]: without a given DON!! the attack does not ask and K.O.s nothing', () => {
    const g = swing([OV.dadan2], 0);
    expect(kind(g)).toBe('block');
    noDefence(g);
    expect(charIds(g, 'p2')).toEqual([OV.dadan2]);
  });

  it('with 2 given DON!! it still works (x1 means 1 or more)', () => {
    const g = swing([OV.dadan2], 2);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2]);
  });

  it('only opposing Characters are candidates, never the Leader or my own Characters', () => {
    const g = swing([OV.dadan2], 1, [OV.whiteyBay2]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('the attack continues after the effect: an unblocked, uncountered Leader hit removes a Life', () => {
    const g = swing([OV.dadan2]);
    pickInst(g, [at(g, 'p2', 'characters', OV.dadan2)]);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });
});

function decisionMax(g: ReturnType<typeof swing>): number | undefined {
  return need(g, 'choose').max;
}
