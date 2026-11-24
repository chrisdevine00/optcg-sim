/** EB05-054 Charlotte Brulee: [Trigger] Play up to 2 {Big Mom Pirates} type Character cards with 4000 power from your hand. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { BMP, BMP6, TRIG, TRIG5, ids, triggerHit } from './helpers-robin.ts';

const BRULEE = 'EB05-054';

describe('EB05-054 Charlotte Brulee', () => {
  // TRIG (OP17-107) and BMP (OP03-103) are 4000 power Big Mom Pirates; TRIG5 is 5000; BMP6 is 6000.
  const hit = (hand: string[]) => {
    const g = triggerHit(BRULEE, { hand });
    g.act({ type: 'trigger', activate: true });
    return g;
  };

  it('[Trigger] plays up to 2 {Big Mom Pirates} Characters with 4000 power from hand', () => {
    const g = hit([TRIG, BMP, TRIG5, BMP6, V.c2]);
    // Only the two 4000 power Big Mom Pirates cards are candidates (not 5000, 6000 or another type).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', TRIG), g.find('p1', 'hand', BMP)]);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([BMP, TRIG].sort());
    expect(ids(g, 'p1', 'hand').sort()).toEqual([BMP6, TRIG5, V.c2].sort());
  });

  it('[Trigger] "up to 2": a single card is fine', () => {
    const g = hit([TRIG, BMP]);
    pick(g, [g.find('p1', 'hand', BMP)]);
    expect(ids(g, 'p1', 'characters')).toEqual([BMP]);
    expect(ids(g, 'p1', 'hand')).toEqual([TRIG]);
  });

  it('[Trigger] may play nothing', () => {
    const g = hit([TRIG]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] with no 4000 power Big Mom Pirates card in hand nothing is played', () => {
    const g = hit([TRIG5, BMP6, V.c2]);
    none(g);
    expectDecision(g, 'main', 'p2');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('does not play itself: Brulee goes to the hand when not activated', () => {
    const g = triggerHit(BRULEE, { hand: [TRIG] });
    g.act({ type: 'trigger', activate: false });
    expect(ids(g, 'p1', 'hand').sort()).toEqual([BRULEE, TRIG].sort());
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
