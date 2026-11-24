/** OP14-049 Jinbe. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  hand,
  none,
  pick,
  play,
  V,
} from './helpers.ts';
import { COST8 } from './helpers-luffyace.ts';
import { canAttack, canPick, costTrash, effectTrash, FM_LEADER, mine } from './helpers-op14g2.ts';

const ID = 'OP14-049';

const start = (oppChars: string[] = [V.c7, COST8]) =>
  mine(
    FM_LEADER,
    { hand: [ID, BLUE, BLUE], characters: [V.c1], costArea: { active: 10, rested: 0 } },
    { characters: oppChars },
  );

describe('OP14-049 Jinbe', () => {
  it('[On Play]: rest 2 DON!!: draw 2 and return a Character with cost 7 or less (either side)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(hand(g, 'p1')).toHaveLength(4); // 2 BLUE + 2 drawn
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true); // cost 7: boundary in
    expect(canPick(g, g.find('p2', 'characters', COST8))).toBe(false); // cost 8: out
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true); // your own too
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([COST8]);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toContain(V.c7);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 }); // 8 to play + 2 rested for the cost
  });

  it('[On Play]: "up to 1": may return nothing but still draws 2', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(4);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('[On Play]: declining the cost draws nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('has no Rush until a card is trashed from your hand by an effect', () => {
    const g = start();
    play(g, ID);
    decline(g);
    const me = g.find('p1', 'characters', ID);
    expect(canAttack(g, me, g.leader('p2'))).toBe(false);
    effectTrash(g, V.c1);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(canAttack(g, me, g.leader('p2'))).toBe(true);
  });

  it('a cost-trash gives [Rush] (a cost is part of the effect, M6b-Q31 decided)', () => {
    const g = start();
    play(g, ID);
    decline(g);
    costTrash(g, V.c1);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });
});
