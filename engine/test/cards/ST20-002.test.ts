/** ST20-002 Charlotte Cracker. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  endCounter,
  expectDecision,
  hand,
  passBlock,
  pick,
  play,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { KO_EVENT, mk } from './helpers-st1821.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'ST20-002';

/** p2's turn: p2 plays Impact Dial (K.O. a Character of cost 4 or less) against p1's Cracker. */
const start = (life: string[] = [BLUE, BLUE, BLUE], events = 1): TestGame =>
  mk(
    { characters: [ID], life },
    {
      hand: Array.from({ length: events }, () => KO_EVENT),
      life: [PURPLE, PURPLE, PURPLE],
      costArea: { active: 10, rested: 0 },
    },
    { turn: 4, activePlayer: 'p2' },
  );
const target = (g: TestGame): void => {
  play(g, KO_EVENT);
  pick(g, [g.find('p1', 'characters', ID)]);
};

describe('ST20-002 Charlotte Cracker', () => {
  it("would be K.O.'d by an effect: trashing the top Life card instead keeps Cracker on the field", () => {
    const g = start();
    target(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.life('p1')).toBe(2);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    // Not damage: no [Trigger] decision, and the Life card is trashed (not added to the hand).
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });

  it("declining the replacement: Cracker is K.O.'d and the Life is untouched", () => {
    const g = start();
    target(g);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
  });

  it('[Once Per Turn]: a second K.O. by an effect in the same turn is not replaced', () => {
    const g = start([BLUE, BLUE, BLUE], 2);
    target(g);
    accept(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    // Impact Dial also added a Life card to p2's hand; play the second one.
    target(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.life('p1')).toBe(2);
  });

  it('a battle K.O. is not "by an effect": no replacement is offered and Cracker is K.O.\'d', () => {
    const g = mk(
      { characters: [{ card: ID, rested: true }], life: [BLUE, BLUE, BLUE] },
      { characters: [V.c6], life: [PURPLE, PURPLE, PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c6),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.life('p1')).toBe(3);
  });

  it('with no Life cards the replacement is not offered and the K.O. happens', () => {
    const g = start([]);
    target(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('[Trigger]: you may trash 1 card from your hand to play this card', () => {
    const g = mk(
      { hand: [V.c1], life: [ID, BLUE, BLUE] },
      { characters: [V.c4], life: [PURPLE, PURPLE, PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.life('p1')).toBe(2);
  });
});
