/** OP09-072 Franky. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  PLAIN_PURPLE,
  trash,
} from './helpers.ts';
import { PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP09-072 Franky', () => {
  const start = (handCards: string[], active = 6) =>
    game(
      { leader: PLAIN_PURPLE, hand: ['OP09-072', ...handCards], costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[Blocker] is a printed keyword', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: ['OP09-072'] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', 'OP09-072')).keywords).toContain('Blocker');
  });

  it('[On Play] DON!! -2, you may trash 1 card from your hand: draws 2 cards', () => {
    const g = start([BLUE]);
    play(g, 'OP09-072');
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(don(g, 'p1').deck).toBe(6); // 4 + the 2 returned
  });

  it('may be declined: nothing is returned or trashed', () => {
    const g = start([BLUE]);
    play(g, 'OP09-072');
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('with no card in hand to trash the cost cannot be paid', () => {
    const g = start([]);
    play(g, 'OP09-072');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    g.act({ type: 'optional', accept: false });
    expectDecision(g, 'main', 'p1');
  });

  it('DON!! -2 may return the rested DON!! just used to pay for the Character', () => {
    const g = start([BLUE], 4);
    play(g, 'OP09-072');
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2, deck: 8 });
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
  });
});
