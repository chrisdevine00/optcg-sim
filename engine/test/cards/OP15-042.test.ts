/** OP15-042 Kyros. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { KYROS_LEADER, mk, REBECCA_OLD } from './helpers-op15g1.ts';

const ID = 'OP15-042';

describe('OP15-042 Kyros', () => {
  const start = (leader: string, handCards: string[] = [V.c1, V.c2]) =>
    mk({ leader, hand: [ID, ...handCards] });

  it('[On Play]: trash 1 card from your hand: with a [Rebecca] Leader, gains [Rush] this turn', () => {
    const g = start(REBECCA_OLD);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('"If your Leader is [Rebecca]" is after the colon: another Leader still pays the cost but gets no [Rush]', () => {
    const g = start(KYROS_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('"You may": declining trashes nothing and gives no [Rush]', () => {
    const g = start(REBECCA_OLD);
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
    expectDecision(g, 'main', 'p1');
  });

  it('with an empty hand the cost cannot be paid: accepting is not legal', () => {
    const g = start(REBECCA_OLD, []);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('[On K.O.]: adds this Character card from your trash to your hand', () => {
    const g = mk({ characters: [ID] });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('[On K.O.] is mandatory and returns only Kyros (the rest of the trash stays)', () => {
    const g = mk({ characters: [ID], trash: [V.c1] });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
