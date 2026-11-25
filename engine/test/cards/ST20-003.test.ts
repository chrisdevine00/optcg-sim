/** ST20-003 Charlotte Brulee (Character, cost 3, 3000, [Trigger]). */
import { describe, expect, it } from 'vitest';
import { project, type ProjectedView } from '@optcg/engine';
import { dec, hand, option, V } from './helpers.ts';
import { atTrigger, trigGame } from './helpers-w6c2.ts';

const ID = 'ST20-003';

describe('ST20-003 Charlotte Brulee [Trigger]', () => {
  /** p1's Life: Brulee on top, then V.c1 and V.c2; p2's Life is the default three. */
  const start = (
    p1: object = { life: [ID, V.c1, V.c2] },
    p2: object = { life: [V.c4, V.c5, V.c6] },
  ) => {
    const g = trigGame(ID, p1, p2);
    atTrigger(g);
    return g;
  };
  const act = (g: ReturnType<typeof start>, activate = true) =>
    g.act({ type: 'trigger', activate });
  const life = (g: ReturnType<typeof start>, p: 'p1' | 'p2') =>
    g.zone(p, 'life').map((c) => c.card);

  it('looks at your own top Life card and puts it at the bottom, then Brulee goes to your hand', () => {
    const g = start();
    act(g);
    expect(dec(g)!.kind).toBe('choose');
    option(g, 'you');
    option(g, 'bottom');
    expect(life(g, 'p1')).toEqual([V.c2, V.c1]);
    expect(hand(g, 'p1')).toContain(ID);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(ID);
  });

  it('at the top it stays where it was', () => {
    const g = start();
    act(g);
    option(g, 'you');
    option(g, 'top');
    expect(life(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(hand(g, 'p1')).toContain(ID);
  });

  it("looks at your opponent's top Life card and puts it back at the bottom of their Life", () => {
    const g = start();
    act(g);
    option(g, 'opponent');
    option(g, 'bottom');
    expect(life(g, 'p2')).toEqual([V.c5, V.c6, V.c4]);
    expect(life(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(hand(g, 'p1')).toContain(ID);
  });

  it('"up to 1": looking at none still adds Brulee to your hand', () => {
    const g = start();
    act(g);
    option(g, 'none');
    expect(life(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(life(g, 'p2')).toEqual([V.c4, V.c5, V.c6]);
    expect(hand(g, 'p1')).toContain(ID);
  });

  it('declining the [Trigger]: the card goes to the hand as for any Life card and nothing is looked at', () => {
    const g = start();
    act(g, false);
    expect(hand(g, 'p1')).toContain(ID);
    expect(g.eventsOfType('CardsLooked')).toHaveLength(0);
  });

  it('only you see the card you look at, and you remember where it went', () => {
    const g = start();
    act(g);
    option(g, 'you');
    const looking = (p: 'p1' | 'p2') => (project(g.state, p) as unknown as ProjectedView).looking;
    expect(looking('p1').map((c) => c.card)).toEqual([V.c1]);
    expect(looking('p2')).toEqual([]);
    option(g, 'bottom');
    const known = (p: 'p1' | 'p2') => (project(g.state, p) as unknown as ProjectedView).known;
    expect(known('p1')['p1.life.1']).toBe(V.c1);
    expect(known('p2')['p1.life.1']).toBeUndefined();
  });

  it('with no other Life card left on either side, Brulee still goes to your hand', () => {
    const g = trigGame(ID, { life: [ID] }, { life: [] });
    atTrigger(g);
    act(g);
    expect(hand(g, 'p1')).toContain(ID);
  });
});
