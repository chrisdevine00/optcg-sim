/** EB05-023 Osome. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { EVENT_A, EVENT_B } from './helpers-eb05g2.ts';
import { donArea } from './helpers-luffyace.ts';

const OSOME = 'EB05-023';
const start = (handCards: string[]) =>
  game({ leader: PLAIN_BLUE, hand: handCards, ...donArea(1) }, { leader: PLAIN_BLUE });

describe('EB05-023 Osome', () => {
  it('[On Play] may trash 2 Events from hand: draw 3', () => {
    const g = start([OSOME, EVENT_A, EVENT_B, V.c1]);
    play(g, OSOME);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT_A), g.find('p1', 'hand', EVENT_B)]);
    expect(trash(g, 'p1').sort()).toEqual([EVENT_A, EVENT_B].sort());
    expect(hand(g, 'p1')).toHaveLength(4); // V.c1 + 3 drawn
    expectDecision(g, 'main', 'p1');
  });

  it('only Events can pay the cost (a non-Event is not offered)', () => {
    const g = start([OSOME, EVENT_A, EVENT_B, V.c1]);
    play(g, OSOME);
    accept(g);
    expect(g.isLegal({ type: 'pick', choice: g.find('p1', 'hand', V.c1), player: 'p1' })).toBe(
      false,
    );
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.length).toBeGreaterThan(0);
    for (const a of picks) expect([EVENT_A, EVENT_B]).toContain(g.card(a.choice as string).card);
  });

  it('declining the cost draws nothing and trashes nothing', () => {
    const g = start([OSOME, EVENT_A, EVENT_B]);
    play(g, OSOME);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('with fewer than 2 Events in hand the cost cannot be paid: no draw', () => {
    const g = start([OSOME, EVENT_A, V.c1]);
    play(g, OSOME);
    expectDecision(g, 'optional', 'p1'); // the engine still asks, but the cost cannot be paid
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([]);
  });
});
