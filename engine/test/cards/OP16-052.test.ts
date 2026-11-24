/** OP16-052 Monkey.D.Luffy (Blue, cost 2). */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, V } from './helpers.ts';
import { mine } from './helpers-op16g2.ts';

const ID = 'OP16-052';

describe('OP16-052 Monkey.D.Luffy', () => {
  const start = (rested: number) =>
    mine({ characters: [ID, V.c1], costArea: { active: 5, rested } });
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'give' });
  const canAct = (g: ReturnType<typeof start>) =>
    g.isLegal({
      type: 'activate',
      card: g.find('p1', 'characters', ID),
      ability: 'give',
      player: 'p1',
    });

  it('[Activate: Main] [Once Per Turn] gives up to 1 rested DON!! to your Leader', () => {
    const g = start(2);
    act(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.zone('p1', 'characters').every((c) => c.don === 0)).toBe(true);
    expect(dec(g)?.kind).toBe('main');
  });

  it('or to 1 of your Characters', () => {
    const g = start(2);
    act(g);
    const target = g.find('p1', 'characters', V.c1);
    pick(g, [target]);
    expect(g.card(target).don).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('gives exactly 1 DON!! even with several rested', () => {
    const g = start(4);
    act(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('"up to 1": may give none', () => {
    const g = start(2);
    act(g);
    none(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('with no rested DON!! nothing is given', () => {
    const g = start(0);
    act(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('is Once Per Turn', () => {
    const g = start(3);
    act(g);
    pick(g, [g.leader('p1')]);
    expect(canAct(g)).toBe(false);
  });
});
