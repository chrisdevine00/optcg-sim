/** EB02-007 Cloven Rose Blizzard. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play } from './helpers.ts';
import { boost, canPick, ids, mk, trigGame, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-007';
const start = (p2chars: (string | { card: string; don: number })[] = [V.c1, V.c2]) =>
  mk({ hand: [ID], characters: [V.c2, V.c3, V.c4, V.c5] }, { characters: p2chars });

describe('EB02-007 Cloven Rose Blizzard', () => {
  it('[Main] gives up to a total of 3 Leader/Characters +1000 power this turn, then K.O.s a 3000-power Character', () => {
    const g = start();
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(3);
    pick(g, [g.leader('p1'), g.find('p1', 'characters', V.c2), g.find('p1', 'characters', V.c3)]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
    // The K.O. choice: the 3000-power Character only (the 4000-power one is not offered).
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('at most 3 cards in total gain the power (5 candidates): the other two stay as they were', () => {
    const g = start();
    play(g, ID);
    pick(g, [
      g.find('p1', 'characters', V.c2),
      g.find('p1', 'characters', V.c3),
      g.find('p1', 'characters', V.c4),
    ]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c5))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(6000);
  });

  it('"3000 power or less" is the current power: a Character boosted to 4000 this turn is not offered', () => {
    const g = start([V.c1]);
    boost(g, g.find('p2', 'characters', V.c1), 1000);
    play(g, ID);
    none(g);
    // No Character of the opponent qualifies (public board), so no K.O. choice is asked.
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('"Then" is sequential: with nobody boosted the K.O. is still offered, and "up to 1" may be declined', () => {
    const g = start();
    play(g, ID);
    none(g);
    expectDecision(g, 'choose', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
  });

  it('[Trigger] K.O.s up to 1 Character with 4000 power or less (5000 is not offered)', () => {
    const g = trigGame(ID, {}, [V.c2, V.c3]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c2]);
  });
});
