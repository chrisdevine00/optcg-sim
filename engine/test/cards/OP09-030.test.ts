/** OP09-030 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk, ODY } from './helpers-a09g1.ts';

const ID = 'OP09-030';

describe('OP09-030 Trafalgar Law', () => {
  it('[On Play]: return 1 of your Characters to your hand: play up to 1 {ODYSSEY} Character with cost 3 or less other than [Trafalgar Law] from your hand', () => {
    const g = mk({ hand: [ID, ODY.c3, V.c3], characters: [V.c1] });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(hand(g, 'p1').sort()).toEqual([ODY.c3, V.c1, V.c3].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', ODY.c3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, ODY.c3]);
  });

  it('only an {ODYSSEY} Character of cost 3 or less is offered: not cost 4, not another type, and not another [Trafalgar Law]', () => {
    const g = mk({ hand: [ID, ODY.c3, ODY.c4, V.c2, ID], characters: [V.c1] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(canPick(g, g.find('p1', 'hand', ODY.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ODY.c4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p1', 'hand', V.c2))).toBe(false); // not {ODYSSEY}
    expect(canPick(g, g.find('p1', 'hand', ID))).toBe(false); // another [Trafalgar Law]
  });

  it('Law may return himself: he goes to the hand and still cannot be played back by his own effect', () => {
    const g = mk({ hand: [ID, ODY.c3] });
    play(g, ID);
    accept(g);
    // Law is the only Character, so he is the one returned (a lone candidate is taken without a pick)
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(canPick(g, g.find('p1', 'hand', ID))).toBe(false);
    pick(g, [g.find('p1', 'hand', ODY.c3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ODY.c3]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('a Character just returned may be played back (the cost is paid first)', () => {
    const g = mk({ hand: [ID], characters: [ODY.c3] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', ODY.c3)]);
    pick(g, [g.find('p1', 'hand', ODY.c3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, ODY.c3]);
  });

  it('may be declined: nothing is returned or played', () => {
    const g = mk({ hand: [ID, ODY.c3], characters: [V.c1] });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c1, ID]);
    expect(hand(g, 'p1')).toEqual([ODY.c3]);
  });

  it('"up to 1": the returned Character stays in the hand when you play nothing', () => {
    const g = mk({ hand: [ID, ODY.c3], characters: [V.c1] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1').sort()).toEqual([ODY.c3, V.c1].sort());
  });
});
