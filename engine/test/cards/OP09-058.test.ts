/** OP09-058 Special Muggy Ball (Event, cost 2). */
import { describe, expect, it } from 'vitest';
import {
  addCost,
  canPick,
  damageGame,
  dec,
  expectDecision,
  hand,
  idsOf,
  mk,
  OTHER_LEADER,
  pick,
  play,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-058';

describe('OP09-058 Special Muggy Ball: [Main]', () => {
  it('your opponent chooses 1 of their Characters with a cost of 6 or less and returns it to their hand', () => {
    const g = mk({ hand: [ID], characters: [V.c1] }, { characters: [V.c6, V.c7, V.c2] });
    play(g, ID);
    expectDecision(g, 'choose', 'p2'); // the opponent chooses
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true); // cost 6: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // cost 7
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(hand(g, 'p2')).toEqual([V.c2]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c6, V.c7]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([V.c1]); // yours is never a target
    expectDecision(g, 'main', 'p1');
  });

  it('"1", not "up to 1": the opponent must choose and cannot stop at 0', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c6, V.c2] });
    play(g, ID);
    expectDecision(g, 'choose', 'p2');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('with a single eligible Character it is returned', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c6, V.c7] });
    play(g, ID);
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(hand(g, 'p2')).toEqual([V.c6]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c7]);
  });

  it('with no eligible Character (only cost 7) nothing happens and nothing is asked', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c7] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p2')).toEqual([]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c7]);
  });

  it('the cost is the current cost: a cost-6 Character with +1 cost (7) is not eligible', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c6, V.c7] });
    addCost(g, 'p2', V.c6, 1);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c6, V.c7]);
  });
});

describe('OP09-058 Special Muggy Ball: [Trigger]', () => {
  const start = () =>
    damageGame(
      ID,
      { leader: OTHER_LEADER, characters: [V.c2, V.c4] },
      { characters: [V.c3, V.c5] },
    );

  it("returns up to 1 Character with a cost of 3 or less to its owner's hand: an opposing one", () => {
    const g = start();
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false); // cost 4
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(hand(g, 'p2')).toEqual([V.c3]);
  });

  it('...or one of your own, which returns to your hand', () => {
    const g = start();
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([V.c4]);
  });

  it('"up to 1": may return nothing', () => {
    const g = start();
    g.act({ type: 'trigger', activate: true });
    g.act({ type: 'done' });
    expect(hand(g, 'p2')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
