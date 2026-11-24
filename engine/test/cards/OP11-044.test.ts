/** OP11-044 Vinsmoke Judge. */
import { describe, expect, it } from 'vitest';
import { pick, trash, hand, V } from './helpers.ts';
import { activate, GERMA, mk, offeredAb } from './helpers-op11g2.ts';

const ID = 'OP11-044';
const start = (hand_: string[] = [V.c1, V.c2], characters: string[] = [ID, GERMA, V.c3]) =>
  mk({ hand: hand_, characters });

describe('OP11-044 Vinsmoke Judge', () => {
  it('[Activate: Main]: trashing 1 card gives every {GERMA 66} Character +1000 power this turn (Judge himself included, others not)', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'power');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', GERMA))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("only your own Characters: the opponent's {GERMA 66} Character is not boosted", () => {
    const g = mk({ hand: [V.c1], characters: [ID] }, { characters: [GERMA] });
    activate(g, g.find('p1', 'characters', ID), 'power');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.power(g.find('p2', 'characters', GERMA))).toBe(6000);
  });

  it('[Once Per Turn]: not offered again after it is used', () => {
    const g = start();
    const judge = g.find('p1', 'characters', ID);
    expect(offeredAb(g, judge, 'power')).toBe(true);
    activate(g, judge, 'power');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(offeredAb(g, judge, 'power')).toBe(false);
    expect(g.power(judge)).toBe(9000);
  });

  it('must not be usable with an empty hand (the trash cost cannot be paid)', () => {
    const g = start([]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'power')).toBe(false);
  });

  it('with no other {GERMA 66} Character only Judge is boosted; a Character of another type is not', () => {
    const g = start([V.c1], [ID, V.c4]);
    activate(g, g.find('p1', 'characters', ID), 'power');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
  });
});
