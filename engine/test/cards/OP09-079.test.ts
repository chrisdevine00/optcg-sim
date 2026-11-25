/** OP09-079 Gum-Gum Jump Rope (Event, cost 2). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  canPick,
  damageGame,
  decline,
  don,
  expectDecision,
  hand,
  mk,
  none,
  option,
  OTHER_LEADER,
  payDon,
  pick,
  play,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-079';

describe('OP09-079 Gum-Gum Jump Rope: [Main]', () => {
  const start = (theirs = [V.c5, V.c6]) =>
    mk({ hand: [ID], donDeck: 0, costArea: { active: 10, rested: 0 } }, { characters: theirs });

  it("DON!! -2: rests up to 1 of your opponent's Characters with a cost of 5 or less, then draws 1 card", () => {
    const g = start();
    play(g, ID); // costs 2 DON!!
    accept(g);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // cost 5: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(don(g, 'p1').deck).toBe(2); // 2 DON!! returned to the DON!! deck
  });

  it('"Then, draw 1" is not "If you do": nobody rested still draws', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('the draw happens even when the opponent has no eligible Character', () => {
    const g = start([V.c6]);
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('declining the DON!! -2: no DON!! returned, no rest, no draw', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').deck).toBe(0);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
    expectDecision(g, 'main', 'p1');
  });
});

describe('OP09-079 Gum-Gum Jump Rope: [Trigger]', () => {
  it('adds up to 1 DON!! card from your DON!! deck and sets it as active', () => {
    const g = damageGame(ID, {
      leader: OTHER_LEADER,
      donDeck: 7,
      costArea: { active: 2, rested: 1 },
    });
    g.act({ type: 'trigger', activate: true });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
  });

  it('"up to 1": may add none', () => {
    const g = damageGame(ID, {
      leader: OTHER_LEADER,
      donDeck: 8,
      costArea: { active: 2, rested: 0 },
    });
    g.act({ type: 'trigger', activate: true });
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toEqual(['1', '0']);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });
});
