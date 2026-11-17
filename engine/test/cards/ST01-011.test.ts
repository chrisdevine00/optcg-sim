/** ST01-011 Brook. */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  option,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';

describe('ST01-011 Brook', () => {
  const setup = (chars: string[] = []) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['ST01-011'],
        characters: chars,
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: give up to 2 rested DON!! cards to your Leader', () => {
    const g = setup([V.c3]);
    play(g, 'ST01-011');
    option(g, '2');
    // The 2 DON!! paid for Brook are rested and are the ones given.
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
    // The Leader, the other Character and Brook itself can receive them.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, given: 2 });
  });

  it('[On Play]: ...or to 1 of your Characters (both DON!! go to the same card)', () => {
    const g = setup([V.c3]);
    play(g, 'ST01-011');
    option(g, '2');
    const c3 = g.find('p1', 'characters', V.c3);
    pick(g, [c3]);
    expect(g.card(c3).don).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play]: it can give them to Brook itself', () => {
    const g = setup();
    play(g, 'ST01-011');
    option(g, '2');
    const me = g.find('p1', 'characters', 'ST01-011');
    pick(g, [me]);
    expect(g.card(me).don).toBe(2);
  });

  it('[On Play]: only rested DON!! are given: with extra active DON!! they stay in the cost area', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['ST01-011'],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'ST01-011');
    option(g, '2');
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 2 });
  });
});
