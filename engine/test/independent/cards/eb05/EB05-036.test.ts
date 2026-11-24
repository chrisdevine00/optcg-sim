/**
 * EB05-036 Tsuru (Character, Purple, cost 4, 0 power, Counter +1000, {Navy}).
 *
 * Card text: "[On Play] If your Leader has the {Navy} type, draw 1 card, and add up to 1 DON!! card
 * as rested from your DON!! deck."
 *
 * Rules: CR 8-3-3 (nothing happens when the "if" fails), RD 15 / CR 8-4-4-1 ("up to" may choose
 * 0), the type is read from the Leader, not from other cards on the field, "has the {Navy} type"
 * is satisfied by a multi-type Leader that includes it.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import { BLUE, CH, don, drive, hand, LD, mine, outcomes, playCard } from './kit-b.ts';

const ID = 'EB05-036';

function go(leader: string, o: { active?: number; characters?: string[] } = {}) {
  const g = mine(leader, {
    hand: [ID],
    deck: [CH.thatch, ...fill(BLUE, 14)],
    characters: o.characters ?? [],
    costArea: { active: o.active ?? 6, rested: 0 },
  });
  playCard(g, ID);
  drive(g, 'p1', {});
  return g;
}

describe('EB05-036 Tsuru [On Play]: Navy Leader: draw 1 and add up to 1 rested DON!!', () => {
  it('Navy Leader: draws the top card and adds 1 DON!! as rested', () => {
    const g = go(LD.navy);
    expect(hand(g)).toEqual([CH.thatch]);
    expect(g.zone('p1', 'deck')).toHaveLength(14);
    expect(don(g).rested).toBe(4 + 1);
    expect(don(g).active).toBe(2);
    expect(don(g).deck).toBe(4 - 1);
  });

  it('draws exactly 1 card (not 2)', () => {
    const g = go(LD.navy);
    expect(hand(g)).toHaveLength(1);
  });

  it('a Leader with {Donquixote Pirates}/{Navy} (OP05-022) includes {Navy}: it works', () => {
    const g = go(LD.donqNavy);
    expect(hand(g)).toHaveLength(1);
    expect(don(g).deck).toBe(3);
  });

  it('CR 8-3-3: a non-Navy Leader (ST01-001): nothing is drawn and no DON!! is added', () => {
    const g = go(LD.shc);
    expect(hand(g)).toEqual([]);
    expect(don(g).deck).toBe(4);
    expect(don(g).rested).toBe(4);
  });

  it('the Leader is what counts: a Navy Character on my field does not satisfy the condition', () => {
    const g = go(LD.shc, { characters: ['OP11-094'] });
    expect(hand(g)).toEqual([]);
    expect(don(g).deck).toBe(4);
  });

  it('the added DON!! arrives rested, so my active DON!! are unchanged', () => {
    const g = go(LD.navy, { active: 8 });
    expect(don(g).active).toBe(4);
    expect(don(g).rested).toBe(4 + 1);
  });

  it('with an empty DON!! deck the card is still drawn and nothing is added', () => {
    const g = go(LD.navy, { active: 10 });
    expect(hand(g)).toEqual([CH.thatch]);
    expect(don(g).deck).toBe(0);
    expect(don(g).active + don(g).rested).toBe(10);
  });

  // DISAGREEMENT B-1: the engine always adds the DON!!; "up to 1" (RD 15) allows adding none.
  it('"up to 1": adding no DON!! is a reachable outcome', () => {
    const g = mine(LD.navy, {
      hand: [ID],
      deck: [CH.thatch, ...fill(BLUE, 14)],
      costArea: { active: 6, rested: 0 },
    });
    playCard(g, ID);
    const rested = outcomes(g, 'p1', (x) => String(don(x).rested));
    expect(rested.has('4')).toBe(true);
    expect(rested.has('5')).toBe(true);
  });
});
