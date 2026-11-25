/** OP10-056 Mansherry. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { DR3, DR5, DR_LEADER, DR_STAGE, mk, PLAIN_STAGE } from './helpers-a10g2.ts';

const ID = 'OP10-056';

describe('OP10-056 Mansherry', () => {
  const start = (p1: Parameters<typeof mk>[0] = {}) =>
    mk(
      { leader: DR_LEADER, hand: [ID], characters: [DR5, DR3, V.c5], ...p1 },
      { characters: [V.c4, V.c5] },
    );

  it("[On Play] rest your {Dressrosa} Leader and return a {Dressrosa} Character with a cost of 4 or more: returns up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    // The only {Dressrosa} Character with a cost of 4 or more (cost 5) went back to your hand.
    expect(hand(g, 'p1')).toEqual([DR5]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([DR3, V.c5, ID]);
    expect(hand(g, 'p2')).toEqual([V.c4]);
    expectDecision(g, 'main', 'p1');
  });

  it('boundary: the opponent Character with cost 4 is a candidate, cost 5 is not', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('a {Dressrosa} Character with cost 3 and a non-{Dressrosa} Character with cost 5 are not returned by the cost', () => {
    const g = start({ characters: [DR3, V.c5] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g, 'p2')).toEqual([]);
    expect(g.zone('p1', 'characters')).toHaveLength(3);
  });

  it('rests a {Dressrosa} Stage when the Leader is not {Dressrosa}', () => {
    const g = start({ leader: 'ST01-001', stage: DR_STAGE });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p1', 'stage', DR_STAGE)).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([DR5]);
  });

  it('"up to 1": the costs are paid even if nothing is returned', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([DR5]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('"You may": declining pays nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(4);
  });

  it('must not be payable without an active {Dressrosa} Leader or Stage (the Character cost alone is not enough)', () => {
    const g = start({ leader: 'ST01-001', stage: PLAIN_STAGE });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'characters')).toHaveLength(4);
  });
});
