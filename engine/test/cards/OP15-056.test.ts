/** OP15-056 Would You Let Me Eat the Flame-Flame Fruit?. */
import { describe, expect, it } from 'vitest';
import { hand, play, V } from './helpers.ts';
import { damageWithP2 } from './helpers-rgl-penel.ts';
import { DRESSROSA_LEADER, LUCY, mine } from './helpers-op15g2.ts';

const ID = 'OP15-056';

describe('OP15-056 Would You Let Me Eat the Flame-Flame Fruit?', () => {
  const start = (leader: string) => mine(leader, { hand: [ID], deck: [V.c1, V.c2, V.c3] }, {}, 7);

  it('[Main] draw 2, then your [Lucy] Leader gains [Double Attack] and +3000 power this turn', () => {
    const g = start(LUCY);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    const l = g.card(g.leader('p1'));
    expect(l.keywords).toContain('Double Attack');
    expect(l.power).toBe(8000);
  });

  it('the boost ends with the turn', () => {
    const g = start(LUCY);
    play(g, ID);
    g.act({ type: 'endTurn' });
    const l = g.card(g.leader('p1'));
    expect(l.keywords).not.toContain('Double Attack');
    expect(l.power).toBe(5000);
  });

  it('with another {Dressrosa} Leader (not [Lucy]) it only draws 2', () => {
    const g = start(DRESSROSA_LEADER);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    const l = g.card(g.leader('p1'));
    expect(l.keywords).not.toContain('Double Attack');
    expect(l.power).toBe(5000);
  });

  it('[Trigger] draw 2 cards', () => {
    const g = damageWithP2(ID, { deck: [V.c1, V.c2, V.c3] }, [V.c7], LUCY);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });

  it('declining the [Trigger] adds the card to hand without drawing', () => {
    const g = damageWithP2(ID, { deck: [V.c1, V.c2, V.c3] }, [V.c7], LUCY);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
