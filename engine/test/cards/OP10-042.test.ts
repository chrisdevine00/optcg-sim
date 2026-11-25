/** OP10-042 Usopp (Leader). */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { dec, expectDecision, hand, pick, V } from './helpers.ts';
import { DR, koedInBattle, mk, OPP, plantOpponentEffect } from './helpers-a10g1.ts';

const ID = 'OP10-042';
const HAND5 = [V.c1, V.c2, V.c3, V.c4, V.c5];
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };
const BOUNCE = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
    to: { zone: 'hand' },
  },
};

/** p2's planted effect `action` hits p1's `target` (a lone candidate is taken without a pick). */
const remove = (g: ReturnType<typeof mk>, target: string, action: object = KO) => {
  const id = g.find('p1', 'characters', target);
  plantOpponentEffect(g, action as Record<string, unknown>);
  if (dec(g)?.kind === 'choose') pick(g, [id]);
};
/** p2's turn; p2's planted effect `action` hits p1's `target` (a Dressrosa Character by default). */
const hit = (
  handCards: string[],
  target: string = DR.c3,
  action: object = KO,
  chars: string[] = [],
) => {
  const g = mk({ leader: ID, characters: [target, ...chars], hand: handCards }, {}, OPP);
  remove(g, target, action);
  return g;
};
const handSize = (g: ReturnType<typeof hit>) => g.zone('p1', 'hand').length;

describe('OP10-042 Usopp', () => {
  it('your "Dressrosa" Characters with a cost of 2 or more gain +1 cost; a cost-1 Character and other types do not', () => {
    const g = mk({ leader: ID, characters: [DR.c1, DR.c2, DR.c3, DR.c5, V.c2] });
    const cost = (c: string) => g.card(g.find('p1', 'characters', c)).cost;
    expect(cost(DR.c1)).toBe(1);
    expect(cost(DR.c2)).toBe(3);
    expect(cost(DR.c3)).toBe(4);
    expect(cost(DR.c5)).toBe(6);
    expect(cost(V.c2)).toBe(2);
  });

  it("must not raise the opponent's Dressrosa Characters", () => {
    const g = mk({ leader: ID }, { characters: [DR.c2] });
    expect(g.card(g.find('p2', 'characters', DR.c2)).cost).toBe(2);
  });

  it("[Opponent's Turn] [Once Per Turn]: when your Dressrosa Character is K.O.'d by the opponent's effect, with 5 or less cards in hand, draws 1 card", () => {
    const g = hit(HAND5);
    expect(handSize(g)).toBe(6);
    expectDecision(g, 'main', 'p2');
  });

  it('boundary: 5 cards in hand draws, 6 does not', () => {
    expect(handSize(hit(HAND5))).toBe(6);
    const six = hit([...HAND5, V.c6]);
    expect(handSize(six)).toBe(6);
    const four = hit(HAND5.slice(1));
    expect(handSize(four)).toBe(5);
  });

  it('a removal that is not a K.O. counts (returned to the hand); the hand is counted after the Character returned', () => {
    // 4 cards + the returned Character = 5: draws. 5 + 1 = 6: does not.
    const g = hit(HAND5.slice(1), DR.c3, BOUNCE);
    expect(handSize(g)).toBe(6);
    expect(hand(g, 'p1')).toContain(DR.c3);
    const h = hit(HAND5, DR.c3, BOUNCE);
    expect(handSize(h)).toBe(6);
    expect(hand(h, 'p1')).toContain(DR.c3);
  });

  it('a K.O. in battle counts ("K.O.\'d" has any cause)', () => {
    const g = koedInBattle(DR.c3, { leader: ID, hand: HAND5 });
    expect(g.zone('p1', 'hand')).toHaveLength(6);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([DR.c3]);
  });

  it('[Once Per Turn]: a second removal in the same turn draws nothing; an effect that is both a removal and a K.O. draws once', () => {
    const g = hit(HAND5, DR.c3, KO, [DR.c2]);
    expect(handSize(g)).toBe(6);
    remove(g, DR.c2);
    expect(handSize(g)).toBe(6);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([DR.c2, DR.c3]); // top first
  });

  it('must not draw when the removed Character is not a Dressrosa Character', () => {
    const g = hit(HAND5, V.c3);
    expect(handSize(g)).toBe(5);
  });

  it('must not draw on your own turn', () => {
    const g = mk({ leader: ID, characters: [DR.c3], hand: HAND5 });
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', DR.c3),
      by: 'p2',
    }).state;
    expect(handSize(g as never)).toBe(5);
  });

  it('with 6 cards in hand the ability still uses its Once Per Turn: a later removal that turn draws nothing', () => {
    const g = hit([...HAND5, V.c6], DR.c3, KO, [DR.c2]);
    expect(handSize(g)).toBe(6);
    // The opponent makes you trash 2 (hand 4), then removes another Dressrosa Character: the
    // Once Per Turn was spent by the first removal, so there is no draw even with 5 or less.
    plantOpponentEffect(g, {
      trashFromHand: { from: 'hand', owner: 'opponent', chooser: 'opponent', pick: { exactly: 2 } },
    });
    pick(
      g,
      g
        .zone('p1', 'hand')
        .slice(0, 2)
        .map((c) => c.instance),
    );
    expect(handSize(g)).toBe(4);
    remove(g, DR.c2);
    expect(handSize(g)).toBe(4);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(DR.c2);
  });
});
