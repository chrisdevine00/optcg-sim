/** OP11-008 Doll. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, none, pick, play, trash, V } from './helpers.ts';
import { mk, NAVY_LEADER, pw, RED_LEADER } from './helpers-op11g1.ts';

const ID = 'OP11-008';
const start = (leader: string, hand = [ID, V.c1]) =>
  mk({ leader, hand }, { characters: [V.c4, V.c7] });

describe('OP11-008 Doll', () => {
  it('[On Play]: trash 1 card; with a {Navy} Leader, an opponent Character gets -6000 power this turn', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(pw(g, 'p2', V.c7)).toBe(3000);
    expect(pw(g, 'p2', V.c4)).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(pw(g, 'p2', V.c7)).toBe(9000);
  });

  it('declining the cost trashes nothing and lowers nothing', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(pw(g, 'p2', V.c7)).toBe(9000);
    expect(dec(g)?.kind).toBe('main');
  });

  it('without a {Navy} Leader the card is still trashed (the cost) and nothing is lowered', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(dec(g)?.kind).toBe('main');
    expect(pw(g, 'p2', V.c7)).toBe(9000);
  });

  it('"up to 1": may choose nobody after paying', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(pw(g, 'p2', V.c7)).toBe(9000);
  });

  it('with an empty hand the prompt is still asked (no hidden-zone gate) but only "no" is legal', () => {
    const g = start(NAVY_LEADER, [ID]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(pw(g, 'p2', V.c7)).toBe(9000);
  });

  it('has [Blocker]', () => {
    const g = start(NAVY_LEADER);
    expect(g.card(g.find('p1', 'hand', ID)).keywords).toContain('Blocker');
  });
});
