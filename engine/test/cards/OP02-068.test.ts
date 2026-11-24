/** OP02-068 Gum-Gum Rain. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  hand,
  none,
  pick,
  takeDamage,
  V,
} from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canPick, cardsIn, LUFFY_LEADER } from './helpers-st29old.ts';

const ID = 'OP02-068';
const start = (handCards = [ID, BLUE]) =>
  counterStep({ leader: LUFFY_LEADER, hand: handCards, characters: [V.c3] }, {}, V.c5);

describe('OP02-068 Gum-Gum Rain', () => {
  it('[Counter]: you may trash 1 card from your hand: a Leader or Character gains +3000 power during this battle', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 8000 stops the 7000 attacker
    expect(cardsIn(g, 'p1', 'trash').sort()).toEqual([BLUE, ID].sort());
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('may go to a Character instead of the Leader', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(8000);
  });

  it('declining the optional cost keeps the card and gives no power', () => {
    const g = start();
    useCounter(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no other card in hand the cost cannot be paid', () => {
    const g = start([ID]);
    useCounter(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger]: returns up to 1 Character with a cost of 2 or less (either side) to its owner’s hand', () => {
    const g = damageGame(
      ID,
      { leader: LUFFY_LEADER, characters: [V.c2, V.c3] },
      { characters: [V.c1, V.c4] },
    );
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true); // 2 is allowed, own side too
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsIn(g, 'p2', 'hand')).toContain(V.c1);
    expect(cardsIn(g, 'p2', 'characters')).not.toContain(V.c1);
    takeDamage(g);
  });

  it('[Trigger]: "up to 1" may return nothing', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, characters: [V.c2] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([V.c2]);
  });
});
