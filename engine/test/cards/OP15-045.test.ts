/** OP15-045 Sai. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { DR, EVENT, mk } from './helpers-op15g1.ts';

const ID = 'OP15-045';

describe('OP15-045 Sai', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: trash 1 Event from your hand: draw 2 cards', () => {
    const g = mk({ hand: [ID, EVENT, DR.c2] });
    play(g, ID);
    accept(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1); // only the Event
    pick(g, [g.find('p1', 'hand', EVENT)]);
    expect(trash(g, 'p1')).toEqual([EVENT]);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('"You may": declining trashes nothing and draws nothing', () => {
    const g = mk({ hand: [ID, EVENT] });
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([EVENT]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('without an Event in hand the cost cannot be paid (a Character does not count)', () => {
    const g = mk({ hand: [ID, DR.c2, V.c1] });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('with several Events in hand only the chosen one is trashed', () => {
    const g = mk({ hand: [ID, EVENT, EVENT] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT, 1)]);
    expect(trash(g, 'p1')).toEqual([EVENT]);
    expect(hand(g, 'p1')).toHaveLength(3); // 1 Event kept + 2 drawn
  });
});
