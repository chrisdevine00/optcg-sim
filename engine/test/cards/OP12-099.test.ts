/** OP12-099 Kalgara: [Your Turn] when a Life card is removed, draw 1, then no own-effect draws this turn. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  takeDamage,
  V,
  BLUE,
  pick,
} from './helpers.ts';
import { GENBO, KAL } from './helpers-kalgara.ts';

const KALGARA = 'OP12-099';

const hit = (g: ReturnType<typeof game>, attacker: string, target: string) => {
  g.act({ type: 'attack', attacker, target });
  passBlock(g);
  endCounter(g);
  takeDamage(g);
};

describe('OP12-099 Kalgara', () => {
  it("draws 1 when your opponent's Life card is removed on your turn", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [KALGARA], deck: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_BLUE, life: [PURPLE, PURPLE, PURPLE] },
    );
    hit(g, g.leader('p1'), g.leader('p2'));
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('then the second removal in the same turn draws nothing (own effects cannot draw)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [KALGARA, V.c5], deck: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_BLUE, life: [PURPLE, PURPLE, PURPLE] },
    );
    hit(g, g.leader('p1'), g.leader('p2'));
    expect(hand(g, 'p1')).toHaveLength(1);
    hit(g, g.find('p1', 'characters', V.c5), g.leader('p2'));
    expect(g.life('p2')).toBe(1);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('draws when a card is removed from your own Life (the Leader of OP08-098 takes one to hand)', () => {
    const g = game(
      {
        leader: { card: KAL, don: 1 },
        characters: [KALGARA],
        hand: [GENBO],
        life: [V.c2, V.c3, V.c4],
        deck: [BLUE, BLUE],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    pick(g, [g.find('p1', 'hand', GENBO)]);
    expect(g.life('p1')).toBe(2);
    // Hand: the Life card (V.c2) and the Kalgara draw (BLUE).
    expect(hand(g, 'p1').sort()).toEqual([BLUE, V.c2].sort());
  });

  it("does not draw on the opponent's turn ([Your Turn])", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [KALGARA], life: [V.c2, V.c3], deck: [BLUE, BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    hit(g, g.find('p2', 'characters', V.c7), g.leader('p1'));
    expect(g.life('p1')).toBe(1);
    expect(hand(g, 'p1')).toEqual([V.c2]); // the damage card only
  });

  it('the Draw Phase is not an effect: it still draws after the restriction', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [KALGARA], deck: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_BLUE, life: [PURPLE, PURPLE, PURPLE] },
    );
    hit(g, g.leader('p1'), g.leader('p2'));
    expect(hand(g, 'p1')).toHaveLength(1);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    // p1's next turn: Draw Phase draws 1 (the restriction ended with the turn).
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});
