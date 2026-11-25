/**
 * M6b wave 7, G64: look at Life cards and place them back (EB02-053 Myskina Olga, OP10-116 Damned
 * Punk and ST20-003 Charlotte Brulee: "look at up to 1 card from the top of your or your opponent's
 * Life cards and place it at the top or bottom of the Life cards"; OP13-105 Kouzuki Momonosuke:
 * "look at all of your Life cards and place them back in your Life area in any order"). The cards
 * never leave their owner's Life, keep their face state, and only the controller sees and remembers
 * them. Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, type ProjectedView } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, none, option, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const look1 = (owner = 'any') => ({ do: { lookAtLife: { owner, n: 1, place: 'topOrBottom' } } });
const lookAll = { do: { lookAtLife: { owner: 'you', n: 'all', place: 'anyOrder' } } };

const mk = (effect: unknown[], extra: object = {}) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], life: [V.c3, V.c1, V.c2], ...extra },
    { leader: PLAIN_BLUE, life: [V.c6, V.c4, V.c5] },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
  return g;
};
const lifeOf = (g: ReturnType<typeof mk>, p: 'p1' | 'p2') => g.zone(p, 'life').map((c) => c.card);
const view = (g: ReturnType<typeof mk>, p: 'p1' | 'p2') =>
  project(g.state, p) as unknown as ProjectedView;
const watcher = {
  id: 'w',
  kind: 'auto',
  when: [{ event: 'lifeRemoved', owner: 'any' }],
  effect: [{ do: { draw: 1 } }],
} as unknown as Ability;

describe('G64 look at Life cards and place them back', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (a: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [{ do: a }] });
    expect(bad({ lookAtLife: { owner: 'any', n: 1, place: 'topOrBottom' } })).toEqual([]);
    expect(bad({ lookAtLife: { owner: 'opponent', n: 1, place: 'topOrBottom' } })).toEqual([]);
    expect(bad({ lookAtLife: { owner: 'you', n: 'all', place: 'anyOrder' } })).toEqual([]);
    // Looking at all of the opponent's Life, in an order, or a count that is not 1 or all.
    expect(bad({ lookAtLife: { owner: 'opponent', n: 'all', place: 'anyOrder' } })).not.toEqual([]);
    expect(bad({ lookAtLife: { owner: 'any', n: 'all', place: 'anyOrder' } })).not.toEqual([]);
    expect(bad({ lookAtLife: { owner: 'you', n: 2, place: 'topOrBottom' } })).not.toEqual([]);
    expect(bad({ lookAtLife: { owner: 'you', n: 1, place: 'anyOrder' } })).not.toEqual([]);
    expect(bad({ lookAtLife: { owner: 'you', n: 1 } })).not.toEqual([]);
  });

  it('your own top card goes to the bottom: it never leaves the Life area', () => {
    const g = mk([look1()]);
    g.state = withAbilities(g.state, PLAIN_PURPLE, [watcher]);
    const handBefore = hand(g, 'p1').length;
    run(g);
    option(g, 'you');
    // While it waits for the end, only the looker sees the card.
    expect(view(g, 'p1').looking.map((c) => c.card)).toEqual([V.c3]);
    expect(view(g, 'p2').looking).toEqual([]);
    option(g, 'bottom');
    expect(lifeOf(g, 'p1')).toEqual([V.c1, V.c2, V.c3]);
    // It moved inside Life: nothing was removed, so the Life watcher did not draw.
    expect(hand(g, 'p1')).toHaveLength(handBefore);
    expect(g.eventsOfType('CardMoved').filter((e) => e.from === 'life')).toHaveLength(0);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('"top" puts it back where it was', () => {
    const g = mk([look1()]);
    run(g);
    option(g, 'you');
    option(g, 'top');
    expect(lifeOf(g, 'p1')).toEqual([V.c3, V.c1, V.c2]);
  });

  it('your opponent’s Life: their card goes to the end you choose, in their Life', () => {
    const g = mk([look1()]);
    run(g);
    option(g, 'opponent');
    option(g, 'bottom');
    expect(lifeOf(g, 'p2')).toEqual([V.c4, V.c5, V.c6]);
    expect(lifeOf(g, 'p1')).toEqual([V.c3, V.c1, V.c2]);
  });

  it('"up to 1": looking at none changes nothing', () => {
    const g = mk([look1()]);
    run(g);
    option(g, 'none');
    expect(lifeOf(g, 'p1')).toEqual([V.c3, V.c1, V.c2]);
    expect(lifeOf(g, 'p2')).toEqual([V.c6, V.c4, V.c5]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.eventsOfType('CardsLooked')).toHaveLength(0);
  });

  it('with only one Life area that has cards, only it is offered; with none, nothing happens', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [] },
      { leader: PLAIN_BLUE, life: [V.c6, V.c4] },
    );
    g.state = withAbilities(g.state, BLUE, [main([look1()] as never)]);
    run(g);
    const d = dec(g)!;
    expect(d.options!.map((o) => o.id)).toEqual(['opponent', 'none']);
    option(g, 'none');
    const empty = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [] },
      { leader: PLAIN_BLUE, life: [] },
    );
    empty.state = withAbilities(empty.state, BLUE, [main([look1()] as never)]);
    run(empty);
    expect(dec(empty)?.kind).toBe('main');
  });

  it('a single Life card has no other end to choose: it is looked at and stays', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [V.c3] },
      { leader: PLAIN_BLUE, life: [V.c6] },
    );
    g.state = withAbilities(g.state, BLUE, [main([look1('you')] as never)]);
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c3]);
    expect(g.eventsOfType('CardsLooked')).toHaveLength(1);
  });

  it('the card keeps its face state', () => {
    const g = mk([look1()], { life: [{ card: V.c3, faceUp: true }, V.c1, V.c2] });
    run(g);
    option(g, 'you');
    option(g, 'bottom');
    const life = g.zone('p1', 'life');
    expect(life.map((c) => c.card)).toEqual([V.c1, V.c2, V.c3]);
    expect(life.map((c) => c.faceUp)).toEqual([false, false, true]);
  });

  it('the looker remembers the card where it went; the other player does not', () => {
    const g = mk([look1()]);
    run(g);
    option(g, 'you');
    option(g, 'bottom');
    expect(view(g, 'p1').known['p1.life.2']).toBe(V.c3);
    expect(view(g, 'p2').known['p1.life.2']).toBeUndefined();
  });

  it('the other player is told a look happened and the end it went to, and no card', () => {
    const g = mk([look1()]);
    run(g);
    option(g, 'you');
    option(g, 'bottom');
    const told = projectEvents(g.events, 'p2');
    expect(told.some((e) => e.type === 'CardsLooked' && e.zone === 'life')).toBe(true);
    expect(told.some((e) => e.type === 'LifeCardPlaced' && e.position === 'bottom')).toBe(true);
    expect(JSON.stringify(told)).not.toContain(V.c3);
    // Their own view of the decision gives away nothing about the cards either.
    expect(JSON.stringify(view(g, 'p2').zones.p1.life)).not.toContain(V.c3);
  });

  it('whose Life and which end do not depend on the cards: two positions ask the same', () => {
    const a = mk([look1()]);
    const b = mk([look1()], { life: [V.c7, V.c5, V.c4] });
    run(a);
    run(b);
    expect(dec(a)!.prompt).toBe(dec(b)!.prompt);
    expect(dec(a)!.options!.map((o) => o.id)).toEqual(dec(b)!.options!.map((o) => o.id));
    option(a, 'you');
    option(b, 'you');
    expect(dec(a)!.prompt).toBe(dec(b)!.prompt);
    expect(JSON.stringify(view(a, 'p2'))).toBe(JSON.stringify(view(b, 'p2')));
  });

  it('all of your Life cards, back in an order you choose (OP13-105)', () => {
    const g = mk([lookAll]);
    run(g);
    // All three are being looked at; the order is asked from the top, the last card is the one left.
    expect(
      view(g, 'p1')
        .looking.map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2, V.c3].sort());
    expect(view(g, 'p2').looking).toEqual([]);
    const d1 = dec(g)!;
    expect(d1.kind).toBe('order');
    g.act({ type: 'order', first: g.find('p1', 'life', V.c2) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c3) });
    expect(lifeOf(g, 'p1')).toEqual([V.c2, V.c3, V.c1]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.eventsOfType('CardMoved').filter((e) => e.from === 'life')).toHaveLength(0);
    const v = view(g, 'p1').known;
    expect([v['p1.life.0'], v['p1.life.1'], v['p1.life.2']]).toEqual([V.c2, V.c3, V.c1]);
    expect(Object.keys(view(g, 'p2').known).filter((k) => k.startsWith('p1.life'))).toEqual([]);
    expect(JSON.stringify(projectEvents(g.events, 'p2'))).not.toContain(V.c2);
  });

  it('with no Life cards, "all of your Life cards" does nothing', () => {
    const g = mk([lookAll], { life: [] });
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    void none;
  });
});
