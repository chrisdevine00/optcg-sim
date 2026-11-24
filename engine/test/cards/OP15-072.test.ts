/** OP15-072 Hotori. */
import { describe, expect, it } from 'vitest';
import { don, payDon, pick, V } from './helpers.ts';
import { canActivate, KOTORI, mine, OTHER_LEADER, SATORI } from './helpers-op15g2.ts';

const ID = 'OP15-072';

describe('OP15-072 Hotori', () => {
  const start = (chars: string[], opp: string[] = [V.c3], active = 5) =>
    mine(OTHER_LEADER, { characters: [ID, ...chars] }, { characters: opp }, active);
  const run = (g: ReturnType<typeof mine>) => {
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'weaken' });
    payDon(g);
  };

  it('[Activate: Main] DON!! -2, rest this Character: with [Kotori] and [Satori] give up to 1 opposing Character -3000 power this turn', () => {
    const g = start([KOTORI, SATORI]);
    run(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(2000);
  });

  it('the penalty lasts this turn only', () => {
    const g = start([KOTORI, SATORI]);
    run(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('without [Kotori] the cost is paid but no power is given', () => {
    const g = start([SATORI]);
    run(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('without [Satori] no power is given either', () => {
    const g = start([KOTORI]);
    run(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('cannot be activated with 1 DON!! or while rested', () => {
    const h = start([KOTORI, SATORI], [V.c3], 1);
    expect(canActivate(h, h.find('p1', 'characters', ID), 'weaken')).toBe(false);
    const g = mine(OTHER_LEADER, { characters: [{ card: ID, rested: true }, KOTORI, SATORI] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'weaken')).toBe(false);
  });
});
