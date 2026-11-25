/** ST24-005 X.Drake. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  dec,
  don,
  expectDecision,
  mk,
  none,
  option,
  pick,
  play,
  PLAIN_BLUE,
  SUPERNOVAS_LEADER,
  V,
} from './helpers-lfc.ts';

const ID = 'ST24-005';

describe('ST24-005 X.Drake', () => {
  const start = (leader: string, p2chars: string[]) =>
    mk({ leader, hand: [ID] }, { characters: p2chars });

  it('with a {Supernovas} Leader: rests an opposing Character with a cost of 5 or less (5 yes, 6 no)', () => {
    const g = start(SUPERNOVAS_LEADER, [V.c5, V.c6, V.c2]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });

  it('then sets 1 DON!! as active at the end of this turn (not before)', () => {
    const g = start(SUPERNOVAS_LEADER, [V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
    g.act({ type: 'endTurn' });
    expect(expectDecision(g, 'choose', 'p1').max).toBe(1);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
  });

  it('"up to 1": may rest nothing, and the DON!! is still set at the end of the turn', () => {
    const g = start(SUPERNOVAS_LEADER, [V.c5]);
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    g.act({ type: 'endTurn' });
    option(g, '1');
    expect(don(g, 'p1').active).toBe(6);
  });

  it('must not fire without a {Supernovas} Leader: no prompt, and no DON!! at the end of the turn either', () => {
    const g = start(PLAIN_BLUE, [V.c5]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('with no eligible Character the DON!! is still set active at the end of the turn', () => {
    const g = start(SUPERNOVAS_LEADER, [V.c6]);
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    g.act({ type: 'endTurn' });
    option(g, '1');
    expect(don(g, 'p1').active).toBe(6);
  });
});
