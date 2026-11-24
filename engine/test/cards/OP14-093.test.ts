/** OP14-093 Mr.4(Babe). */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, V } from './helpers.ts';
import { BW5, BW8, BW_LEADER, COST8, ids, koByEffect, start, TBP4 } from './helpers-op14g4.ts';

const ID = 'OP14-093';
const run = (trash: string[]) => {
  const g = start({ leader: BW_LEADER, characters: [ID], trash });
  koByEffect(g, 'p1', ID);
  expectDecision(g, 'choose', 'p1');
  return g;
};

describe('OP14-093 Mr.4(Babe)', () => {
  it('has [Blocker]', () => {
    const g = start(
      { leader: BW_LEADER, characters: [ID] },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });

  it('[On K.O.] adds a Baroque Works Character from the trash to the hand', () => {
    const g = run([BW5, V.c1]);
    pick(g, [g.find('p1', 'trash', BW5)]);
    expect(hand(g, 'p1')).toEqual([BW5]);
  });

  it('cost 8 is the limit: a cost 8 Baroque Works Character is offered, a cost 8 non-Baroque one is not', () => {
    const g = run([BW8, COST8, TBP4]);
    // Offered: the cost 8 Baroque Works card and the K.O.'d Babe itself; not the cost 8 non-Baroque card.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'trash', BW8)]);
    expect(hand(g, 'p1')).toEqual([BW8]);
  });

  it("the K.O.'d Character itself (a cost 4 Baroque Works Character in the trash) can be returned", () => {
    // [Mr.4(Babe)] is in the trash after the K.O. and is a Baroque Works Character with cost 4.
    const g = run([V.c1]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', ID)]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": may add nothing', () => {
    const g = run([BW5]);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toContain(BW5);
  });
});
