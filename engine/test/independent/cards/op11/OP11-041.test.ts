/**
 * OP11-041 Nami (Blue/Yellow Leader, 5000, 4 Life, {Straw Hat Crew}).
 *
 * Card text: "[Your Turn] [Once Per Turn] This effect can be activated when a card is removed from your
 * or your opponent's Life cards. If you have 7 or less cards in your hand, draw 1 card.
 * [DON!! x1] [On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand: This
 * Leader gains +2000 power during this turn."
 *
 * Rules: the draw happens in my turn only, once per turn, for any removal from either Life area
 * (CR 10-2-?). "7 or less" includes 7 and is checked when the effect resolves. The second effect
 * needs 1 DON!! on this Leader and an optional hand cost; it lasts until the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  C11,
  canUse,
  deck,
  fill,
  hand,
  kind,
  L11,
  mine,
  need,
  no,
  noDefence,
  passBlock,
  passCounter,
  payHand,
  playCard,
  side,
  theirTurn,
  trash,
  unusable,
  yes,
  answerIfAsked,
  RED,
  takeDon,
} from './kit-op11b.ts';

const NAMI = L11.nami41;

/** My turn: Nami's Leader hits the opposing Leader; `handSize` cards in my hand. */
function hit(handSize: number, extraAttacker = false) {
  const g = mine(
    NAMI,
    {
      hand: fill(BLUE, handSize),
      characters: extraAttacker ? [C11.c3] : [],
      deck: [C11.c1, ...fill(BLUE, 14)],
    },
    {},
  );
  attack(g, g.leader('p1'), g.leader('p2'));
  noDefence(g);
  return g;
}

describe('OP11-041 Nami: [Your Turn] [Once Per Turn] when a Life card is removed, draw 1 with 7 or less cards in hand', () => {
  it('draws 1 when my attack removes an opposing Life card (hand 3)', () => {
    const g = hit(3);
    expect(g.life('p2')).toBe(3);
    expect(hand(g)).toHaveLength(4);
    expect(hand(g)).toContain(C11.c1);
    expect(deck(g)).toHaveLength(14);
  });

  it('boundary: with exactly 7 cards in hand it draws (to 8)', () => {
    const g = hit(7);
    expect(hand(g)).toHaveLength(8);
  });

  it('boundary: with 8 cards in hand it does not draw', () => {
    const g = hit(8);
    expect(g.life('p2')).toBe(3);
    expect(hand(g)).toHaveLength(8);
    expect(deck(g)).toHaveLength(15);
  });

  it('[Once Per Turn]: a second Life removal in the same turn does not draw again', () => {
    const g = hit(2, true);
    expect(hand(g)).toHaveLength(3);
    expect(kind(g)).toBe('main');
    attack(g, at(g, 'p1', 'characters', C11.c3), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
    expect(hand(g)).toHaveLength(3);
  });

  it('it does not draw when my own Life card is removed on the OPPONENT turn', () => {
    const g = theirTurn(
      side(NAMI, BLUE, { hand: fill(BLUE, 2), deck: [C11.c1, ...fill(BLUE, 14)] }),
      side(L11.mono, RED, {}),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toHaveLength(3);
    expect(deck(g)).toHaveLength(15);
  });

  it('it also fires for a card removed from MY OWN Life in my turn (a cost paid by Charlotte Brulee)', () => {
    const g = mine(NAMI, {
      hand: ['OP11-069', BLUE],
      deck: [C11.c1, ...fill(BLUE, 14)],
      costArea: { active: 5, rested: 0 },
    });
    playCard(g, 'OP11-069');
    yes(g);
    if (kind(g) === 'choose') takeDon(g, 0);
    expect(g.life('p1')).toBe(3);
    // the Life card entered the hand (cost) and Nami drew 1: hand = BLUE + Life card + drawn card
    expect(hand(g)).toHaveLength(3);
    expect(deck(g)).toHaveLength(14);
  });
});

describe("OP11-041 Nami: [DON!! x1] [On Your Opponent's Attack] [Once Per Turn] trash 1 from hand: Leader +2000 this turn", () => {
  function defend(o: { don?: number; handCards?: string[]; attackers?: string[] } = {}) {
    const attackers = o.attackers ?? [C11.c4];
    const g = theirTurn(
      side(NAMI, BLUE, {
        leader: { card: NAMI, don: o.don ?? 1 },
        hand: o.handCards ?? [BLUE, C11.c3],
        costArea: { active: 0, rested: 0 },
      }),
      side(L11.mono, RED, { characters: attackers, costArea: { active: 10, rested: 0 } }),
    );
    attack(g, at(g, 'p2', 'characters', attackers[0]!), g.leader('p1'));
    return g;
  }

  it('with 1 DON!! on the Leader: trashing a card gives +2000 (7000) and the 6000 attack fails', () => {
    const g = defend();
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [C11.c3]);
    expect(trash(g)).toEqual([C11.c3]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without it the same 6000 attack connects on the 5000 Leader', () => {
    const g = defend();
    no(g);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with no DON!! given to the Leader the effect is not offered', () => {
    const g = defend({ don: 0 });
    expect(kind(g)).toBe('block');
    expect(canUse(g)).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = defend({ handCards: [] });
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts for the whole turn, not only this battle', () => {
    const g = defend({ attackers: [C11.c4, C11.c2] });
    yes(g);
    payHand(g, [C11.c3]);
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('[Once Per Turn]: not offered again on the second attack of the same turn', () => {
    const g = defend({ attackers: [C11.c4, C11.c2], handCards: [BLUE, C11.c3, C11.c5] });
    yes(g);
    payHand(g, [C11.c3]);
    passBlock(g);
    passCounter(g);
    attack(g, at(g, 'p2', 'characters', C11.c2), g.leader('p1'));
    expect(canUse(g)).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('a declined activation does not use up the [Once Per Turn]', () => {
    const g = defend({ attackers: [C11.c4, C11.c2] });
    no(g);
    passBlock(g);
    passCounter(g);
    attack(g, at(g, 'p2', 'characters', C11.c2), g.leader('p1'));
    expect(canUse(g)).toBe(true);
  });

  it('the draw clause is [Your Turn] only: a Life card lost on the opponent turn does not draw even with the DON!! on the Leader', () => {
    const g = defend();
    no(g);
    passBlock(g);
    passCounter(g);
    // 2 cards in hand + the Life card taken by the hit, and nothing drawn
    expect(hand(g)).toHaveLength(3);
    expect(deck(g)).toHaveLength(15);
    answerIfAsked(g, false);
  });
});
