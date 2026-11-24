/** OP11-059 Gum-Gum King Cobra. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, times, V } from './helpers.ts';
import { canPick, counterStep, mk, RED_LEADER, useCounter } from './helpers-op11g2.ts';

const ID = 'OP11-059';
/** p1 holds the Event plus `others` more cards in hand at the Counter Step. */
const under = (others: number, characters: string[] = [V.c3]) =>
  counterStep({
    leader: RED_LEADER,
    hand: [ID, ...times(others, V.c1)],
    characters,
    costArea: { active: 3, rested: 0 },
  });

describe('OP11-059 Gum-Gum King Cobra', () => {
  it('[Counter] with 4 or fewer other cards in hand: +2000 and then an additional +2000 to the same card (+4000)', () => {
    const g = under(4);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(5000 + 4000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('boundary: 5 other cards in hand (the Event has left the hand) gives only +2000', () => {
    const g = under(5);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(5000 + 2000);
  });

  it('the additional +2000 goes to the card chosen for the first (a Character), not to the Leader', () => {
    const g = under(0);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000 + 4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": choosing nothing gives no boost at all', () => {
    const g = under(0);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
    expectDecision(g, 'counter', 'p1');
  });

  it("[Trigger]: returns up to 1 Character with cost 2 or less to its owner's hand (3 is not eligible, either side)", () => {
    const g = mk(
      { life: [ID, V.c1, V.c1], characters: [V.c2, V.c3] },
      { characters: [V.c7, V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true); // cost 2 boundary
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(hand(g, 'p2')).toEqual([V.c1]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7]);
  });
});
