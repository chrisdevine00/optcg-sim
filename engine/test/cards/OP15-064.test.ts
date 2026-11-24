/** OP15-064 Kotori. */
import { describe, expect, it } from 'vitest';
import { don, payDon, pick, V } from './helpers.ts';
import { canActivate, HOTORI, mine, OTHER_LEADER, SATORI } from './helpers-op15g2.ts';

const ID = 'OP15-064';

describe('OP15-064 Kotori', () => {
  const start = (chars: string[], opp: string[] = [V.c3], active = 5) =>
    mine(OTHER_LEADER, { characters: [ID, ...chars] }, { characters: opp }, active);
  const run = (g: ReturnType<typeof mine>) => {
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'rest' });
    payDon(g);
  };

  it('[Activate: Main] DON!! -2, rest this Character: with [Satori] and [Hotori] rest up to 1 opposing Character with 5000 power or less', () => {
    const g = start([SATORI, HOTORI]);
    run(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('5000 is in range, 6000 is not', () => {
    const g = start([SATORI, HOTORI], [V.c3, V.c4]);
    run(g);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('without [Hotori] the cost is still paid but nothing is rested', () => {
    const g = start([SATORI]);
    run(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('without [Satori] nothing is rested either', () => {
    const g = start([HOTORI]);
    run(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('cannot be activated with fewer than 2 DON!! or while rested', () => {
    const g = mine(OTHER_LEADER, { characters: [{ card: ID, rested: true }, SATORI, HOTORI] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'rest')).toBe(false);
    const h = start([SATORI, HOTORI], [V.c3], 1);
    expect(canActivate(h, h.find('p1', 'characters', ID), 'rest')).toBe(false);
  });
});
