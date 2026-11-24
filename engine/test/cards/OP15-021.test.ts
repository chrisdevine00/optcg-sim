/** OP15-021 Just Watch Me, Ace!!! */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, none, pick, play, times, V } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { BOBBY, EVENT, mk } from './helpers-op15g1.ts';

const ID = 'OP15-021';

describe('OP15-021 Just Watch Me, Ace!!!', () => {
  const hand = (trash: string[], active = 1) => {
    const g = mk({ hand: [ID], trash, costArea: { active, rested: 0 } });
    return { g, id: g.find('p1', 'hand', ID) };
  };

  it('in hand: costs 3 less (4 to 1) with 4 or more Events in your trash', () => {
    const { g, id } = hand(times(4, EVENT));
    expect(g.card(id).cost).toBe(1);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(true);
  });

  it('boundary: 3 Events (or 3 Events and other cards) give no discount', () => {
    const a = hand(times(3, EVENT));
    expect(a.g.card(a.id).cost).toBe(4);
    expect(a.g.isLegal({ type: 'playCard', card: a.id, player: 'p1' })).toBe(false);
    const b = hand([...times(3, EVENT), BOBBY, V.c1]);
    expect(b.g.card(b.id).cost).toBe(4);
  });

  it("[Main]: gives up to 1 of your opponent's Characters -3000 power this turn", () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4, V.c1] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('[Main]: "up to 1" may choose nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    expectDecision(g, 'main', 'p1');
  });

  it('[Counter]: the same effect during a battle; -3000 stops a 7000 attacker against a 5000 Leader', () => {
    const g = counterStep(
      { leader: 'ST01-001', hand: [ID], costArea: { active: 4, rested: 0 } },
      {},
      V.c5,
    );
    useCounter(g, ID, 'main');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});
