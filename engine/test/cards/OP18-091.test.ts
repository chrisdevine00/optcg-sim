/** OP18-091 Brogy. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, hand, none, pick, trash, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { mine, STAGE2 } from './helpers-op18-g3.ts';

const ID = 'OP18-091';
const start = (trashCards = [V.c2, V.c3, V.c1, STAGE2], handCards = [BLUE]) => {
  const g = mine({ characters: [ID], hand: handCards, trash: trashCards }, {});
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP18-091 Brogy', () => {
  it('gains +12 cost on the field (base cost 4, so 16)', () => {
    const g = mine({ characters: [ID] }, {});
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(16);
  });

  it('[When Attacking] you may trash 1 card from your hand: add up to 1 Character card with a cost of 2 or less from your trash to your hand', () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(candidates(g).sort()).toEqual(
      // the card just trashed as the cost is itself a Character with a cost of 1
      [
        g.find('p1', 'trash', V.c2),
        g.find('p1', 'trash', V.c1),
        g.find('p1', 'trash', BLUE),
      ].sort(),
    );
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1')).toContain(BLUE);
  });

  it('a Character with a cost of 3 or a Stage is not a candidate; "up to 1" allows none', () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(candidates(g)).not.toContain(g.find('p1', 'trash', V.c3));
    expect(candidates(g)).not.toContain(g.find('p1', 'trash', STAGE2));
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('declining keeps the hand and the trash', () => {
    const g = start();
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p1')).toHaveLength(4);
  });

  it('with no card in hand the cost cannot be paid', () => {
    const g = start(undefined, []);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });
});
