/**
 * OP17-068 Sasaki (Character, Purple, cost 3, 4000, Counter +2000, {Animal Kingdom Pirates}).
 *
 * Card text: "[When Attacking] You may trash 2 cards from your hand: If your Leader has the {Animal
 * Kingdom Pirates} type, add up to 2 DON!! cards as rested from your DON!! deck."
 *
 * Rules: CR 8-3-1 (cost: all or nothing, CR 8-3-1-3), CR 8-3-3 (text after a failed "if" does not
 * resolve), CR 4-8-1 / 8-4-4-1 / RD 15 ("up to" allows fewer), CR 6-4 (DON!! deck holds what is left),
 * RD 89 ([When Attacking] activates in the Attack Step).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  don,
  fill,
  hand,
  kind,
  LD,
  mine,
  need,
  no,
  outcomes,
  passBlock,
  payHand,
  SCN,
  trash,
  unusable,
  yes,
} from './kit-op17b.ts';
import { takeMost } from '../../helpers.ts';

const SASAKI = 'OP17-068';

function attacking(leader: string, handCards: string[], donDeck?: number) {
  const g = mine(leader, {
    characters: [SASAKI],
    hand: handCards,
    costArea: { active: donDeck === undefined ? 3 : 10 - donDeck, rested: 0 },
    ...(donDeck !== undefined ? { donDeck } : {}),
  });
  attack(g, at(g, 'p1', 'characters', SASAKI), g.leader('p2'));
  return g;
}

describe('OP17-068 Sasaki: [When Attacking] trash 2: if the Leader is {Animal Kingdom Pirates}, add up to 2 rested DON!!', () => {
  it('trashing 2 cards adds 2 DON!! as RESTED from the DON!! deck', () => {
    const g = attacking(LD.akp, [SCN.c2, SCN.c3, BLUE]);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    takeMost(g);
    expect(don(g)).toMatchObject({ active: 3, rested: 2, deck: 5 });
    expect(trash(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(hand(g)).toEqual([BLUE]);
    expect(kind(g)).toBe('block');
  });

  it('the cost is exactly 2 cards of my choice', () => {
    const g = attacking(LD.akp, [SCN.c2, SCN.c3, BLUE]);
    yes(g);
    need(g, 'choose');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('a Leader without the {Animal Kingdom Pirates} type: the cost may be paid but no DON!! is added', () => {
    const g = attacking(LD.neutral, [SCN.c2, SCN.c3]);
    if (kind(g) === 'optional') {
      yes(g);
      payHand(g, [SCN.c2, SCN.c3]);
    }
    expect(don(g)).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });

  it('declining the cost: nothing trashed, no DON!! added', () => {
    const g = attacking(LD.akp, [SCN.c2, SCN.c3]);
    no(g);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(don(g)).toMatchObject({ rested: 0, deck: 7 });
    expect(kind(g)).toBe('block');
  });

  it('CR 8-3-1-3: with only 1 card in hand the cost cannot be paid (boundary is 2)', () => {
    const g = attacking(LD.akp, [SCN.c2]);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([SCN.c2]);
    expect(don(g)).toMatchObject({ rested: 0, deck: 7 });
    expect(kind(g)).toBe('block');
  });

  it('with exactly 2 cards in hand the cost can be paid', () => {
    const g = attacking(LD.akp, [SCN.c2, SCN.c3]);
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    takeMost(g);
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ rested: 2 });
  });

  it('with only 1 DON!! left in the DON!! deck, 1 is added (as many as possible)', () => {
    const g = attacking(LD.akp, [SCN.c2, SCN.c3], 1);
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    takeMost(g);
    expect(don(g)).toMatchObject({ rested: 1, deck: 0 });
  });

  it("only when Sasaki attacks: another Character's attack asks nothing", () => {
    const g = mine(LD.akp, {
      characters: [SASAKI, SCN.c3],
      hand: [SCN.c2, SCN.c4],
      costArea: { active: 3, rested: 0 },
    });
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(kind(g)).toBe('block');
    passBlock(g);
    expect(hand(g)).toEqual([SCN.c2, SCN.c4].sort());
  });

  it('"up to 2": adding fewer DON!! (0 or 1) after paying is a reachable outcome', () => {
    const g = attacking(LD.akp, [SCN.c2, SCN.c3]);
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    void fill;
    const added = outcomes(g, 'p1', (x) => String(don(x).rested));
    expect(added.has('0') || added.has('1')).toBe(true);
  });
});
