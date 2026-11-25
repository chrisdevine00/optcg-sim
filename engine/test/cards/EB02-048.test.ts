/** EB02-048 Brook. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, pick, play } from './helpers.ts';
import { canPick, ids, koByEffect, LABOON2, LABOON4, mk, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-048';

describe('EB02-048 Brook', () => {
  it('[On Play] adds a [Laboon] from the trash to the hand (not any other card)', () => {
    const g = mk({ hand: [ID], trash: [BLUE, LABOON4, V.c4] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', LABOON4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', BLUE))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', V.c4))).toBe(false);
    pick(g, [g.find('p1', 'trash', LABOON4)]);
    expect(hand(g, 'p1')).toEqual([LABOON4]);
    expect(ids(g, 'p1', 'trash')).toEqual([BLUE, V.c4]);
  });

  it('[On Play] "up to 1": only one of two [Laboon] cards, or none', () => {
    const g = mk({ hand: [ID], trash: [LABOON2, LABOON4] });
    play(g, ID);
    pick(g, [g.find('p1', 'trash', LABOON2)]);
    expect(hand(g, 'p1')).toEqual([LABOON2]);
    expect(ids(g, 'p1', 'trash')).toEqual([LABOON4]);
    const h = mk({ hand: [ID], trash: [LABOON2] });
    play(h, ID);
    none(h);
    expect(hand(h, 'p1')).toEqual([]);
  });

  it('[On Play] with no [Laboon] in the trash nothing happens', () => {
    const g = mk({ hand: [ID], trash: [BLUE] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[On K.O.] plays a [Laboon] with cost 4 or less from the hand', () => {
    const g = mk({ characters: [ID], hand: [LABOON4, LABOON2, BLUE] });
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', LABOON4))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', LABOON2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', BLUE))).toBe(false);
    pick(g, [g.find('p1', 'hand', LABOON4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([LABOON4]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[On K.O.] must not play a card that is not named [Laboon]; the prompt is asked at max 0 and may be declined', () => {
    const g = mk({ characters: [ID], hand: [V.c4, V.c3] });
    koByEffect(g, 'p1', ID);
    const d = dec(g);
    expect(d?.kind).toBe('choose');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
