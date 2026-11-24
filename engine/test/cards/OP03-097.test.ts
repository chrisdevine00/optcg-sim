/** OP03-097 Six King Pistol. */
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
  V,
} from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canPick, cardsIn, LUFFY_LEADER } from './helpers-st29old.ts';

const ID = 'OP03-097';
const start = (handCards = [ID, BLUE]) =>
  counterStep({ leader: LUFFY_LEADER, hand: handCards, characters: [V.c3] }, {}, V.c5);

describe('OP03-097 Six King Pistol', () => {
  it('[Counter]: you may trash 1 card from your hand: a Leader or Character gains +3000 power during this battle', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(cardsIn(g, 'p1', 'trash').sort()).toEqual([BLUE, ID].sort());
  });

  it('declining the optional cost gives nothing; with no other card the cost cannot be paid', () => {
    const g = start();
    useCounter(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    const h = start([ID]);
    useCounter(h, ID);
    expect(h.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('[Trigger]: draws 1 card, then K.O.s up to 1 opposing Character with a cost of 1 or less', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER }, { characters: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(1); // the draw is already done
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // 1 is allowed
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsIn(g, 'p2', 'characters')).not.toContain(V.c1);
    expect(cardsIn(g, 'p2', 'characters')).toContain(V.c2);
  });

  it('[Trigger]: "up to 1" may K.O. nothing; the card is still drawn', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER }, { characters: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toContain(V.c1);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('[Trigger]: the draw happens even with no K.O. target ("Then" is not "If you do")', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});
