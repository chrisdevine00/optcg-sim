/** ST23-001 Uta. */
import { describe, expect, it } from 'vitest';
import { play } from './helpers.ts';
import { mk, RED8, V } from './helpers-lfb.ts';

const ID = 'ST23-001';

describe('ST23-001 Uta', () => {
  const start = (mine: Parameters<typeof mk>[0] = {}, theirs: Parameters<typeof mk>[1] = {}) =>
    mk({ hand: [ID], costArea: { active: 2, rested: 0 }, ...mine }, theirs);
  const cost = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'hand', ID)).cost;
  const canPlay = (g: ReturnType<typeof start>) =>
    g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' });

  it('has [Blocker]', () => {
    const g = start({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('in the hand it costs 4 less while you have a Character with 10000 power or more', () => {
    const g = start({ characters: [RED8] });
    expect(cost(g)).toBe(2);
    expect(canPlay(g)).toBe(true);
    play(g, ID);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
  });

  it('boundary: a Character with 9000 power is not enough, the cost stays 6', () => {
    const g = start({ characters: [V.c7] });
    expect(cost(g)).toBe(6);
    expect(canPlay(g)).toBe(false);
  });

  it('power is current power: 9000 plus 1 given DON!! reaches 10000 and counts', () => {
    const g = start({ characters: [{ card: V.c7, don: 1 }], costArea: { active: 2, rested: 0 } });
    expect(g.power(g.find('p1', 'characters', V.c7))).toBe(10000);
    expect(cost(g)).toBe(2);
  });

  it("a rested Character counts; an opponent's Character with 10000 power does not", () => {
    const rested = start({ characters: [{ card: RED8, rested: true }] });
    expect(cost(rested)).toBe(2);
    const theirs = start({}, { characters: [RED8] });
    expect(cost(theirs)).toBe(6);
  });

  it('the reduction applies only in the hand', () => {
    const g = start({ characters: [ID, RED8] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(6);
  });
});
