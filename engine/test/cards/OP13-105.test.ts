/** OP13-105 Kouzuki Momonosuke (Character, cost 3, 0 power). */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, type ProjectedView } from '@optcg/engine';
import { dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE, play, V } from './helpers.ts';

const ID = 'OP13-105';

describe('OP13-105 Kouzuki Momonosuke [On Play]: look at all your Life cards, place them in any order', () => {
  const start = (life: (string | { card: string; faceUp: boolean })[] = [V.c3, V.c1, V.c2]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID], life, costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, life: [V.c6, V.c4, V.c5] },
    );
  const mine = (g: ReturnType<typeof start>) => g.zone('p1', 'life').map((c) => c.card);
  const view = (g: ReturnType<typeof start>, p: 'p1' | 'p2') =>
    project(g.state, p) as unknown as ProjectedView;

  it('asks an order for each Life card from the top, and puts them back in that order', () => {
    const g = start();
    play(g, ID);
    expect(dec(g)!.kind).toBe('order');
    g.act({ type: 'order', first: g.find('p1', 'life', V.c2) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c3) });
    expect(mine(g)).toEqual([V.c2, V.c3, V.c1]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p1')).toBe(3);
  });

  it('only you see the cards while you look, and you remember where each went', () => {
    const g = start();
    play(g, ID);
    expect(
      view(g, 'p1')
        .looking.map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2, V.c3].sort());
    expect(view(g, 'p2').looking).toEqual([]);
    g.act({ type: 'order', first: g.find('p1', 'life', V.c1) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c2) });
    const known = view(g, 'p1').known;
    expect([known['p1.life.0'], known['p1.life.1'], known['p1.life.2']]).toEqual([
      V.c1,
      V.c2,
      V.c3,
    ]);
    expect(Object.keys(view(g, 'p2').known).filter((k) => k.startsWith('p1.life'))).toEqual([]);
    expect(JSON.stringify(projectEvents(g.events, 'p2'))).not.toContain(V.c1);
  });

  it('the cards never leave the Life area: no Life card is removed and none is drawn', () => {
    const g = start();
    const before = hand(g, 'p1').length;
    play(g, ID);
    g.act({ type: 'order', first: g.find('p1', 'life', V.c3) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c1) });
    expect(g.eventsOfType('CardMoved').filter((e) => e.from === 'life')).toHaveLength(0);
    expect(hand(g, 'p1')).toHaveLength(before - 1); // only the played Momonosuke left the hand
  });

  it('a face-up Life card keeps its face state', () => {
    const g = start([{ card: V.c3, faceUp: true }, V.c1, V.c2]);
    play(g, ID);
    g.act({ type: 'order', first: g.find('p1', 'life', V.c1) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c2) });
    expect(g.zone('p1', 'life').map((c) => [c.card, c.faceUp])).toEqual([
      [V.c1, false],
      [V.c2, false],
      [V.c3, true],
    ]);
  });

  it("your opponent's Life is not looked at", () => {
    const g = start();
    play(g, ID);
    g.act({ type: 'order', first: g.find('p1', 'life', V.c3) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c1) });
    expect(g.zone('p2', 'life').map((c) => c.card)).toEqual([V.c6, V.c4, V.c5]);
    expect(view(g, 'p1').looking).toEqual([]);
  });

  it('with no Life cards nothing is asked and nothing happens', () => {
    const g = start([]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });
});
