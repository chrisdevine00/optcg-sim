/** OP09-085 Gecko Moria. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  dec,
  expectDecision,
  idsOf,
  mk,
  none,
  pick,
  play,
  TB,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-085';
const start = (trash: string[] = [TB.c1, TB.c2, TB.c3, TB.c4, V.c1, V.c2]) =>
  mk({ hand: [ID], trash }, {}, undefined, 4);

describe('OP09-085 Gecko Moria', () => {
  it('[On Play] plays a {Thriller Bark Pirates} Character with cost 2 or less from the trash, rested', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', TB.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', TB.c2))).toBe(true); // cost 2: boundary
    expect(canPick(g, g.find('p1', 'trash', TB.c3))).toBe(false); // cost 3
    expect(canPick(g, g.find('p1', 'trash', TB.c4))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false); // not {Thriller Bark Pirates}
    pick(g, [g.find('p1', 'trash', TB.c2)]);
    const played = g.find('p1', 'characters', TB.c2);
    expect(g.card(played).rested).toBe(true);
    expect(idsOf(g, 'p1', 'trash')).not.toContain(TB.c2);
  });

  it('"up to 1": may play nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(6);
  });

  it('must not offer a card from the hand or the deck, nor an Event or non-Character', () => {
    const g = mk({ hand: [ID, TB.c1], deck: [TB.c2, V.c1], trash: [V.c3] }, {}, undefined, 4);
    play(g, ID);
    // Nothing legal to pick: the effect resolves without a target (or offers only "done").
    if (dec(g)?.kind === 'choose') none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('must not play from the opponent trash', () => {
    const g = mk({ hand: [ID] }, { trash: [TB.c1] }, undefined, 4);
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([TB.c1]);
  });
});
