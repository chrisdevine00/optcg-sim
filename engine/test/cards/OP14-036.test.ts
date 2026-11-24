/** OP14-036 Strive to Surpass me, Roronoa Zoro!!!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  takeDamage,
  expectDecision,
  hand,
  pick,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { canPick, FM_LEADER, isRested } from './helpers-op14g2.ts';

const ID = 'OP14-036';

describe('OP14-036 Strive to Surpass me, Roronoa Zoro!!!', () => {
  const step = () =>
    counterStep({
      leader: FM_LEADER,
      hand: [ID],
      characters: [V.c1],
      costArea: { active: 1, rested: 0 },
    });

  it('[Counter]: rest 1 of your cards: a Leader or Character gains +4000 during this battle', () => {
    const g = step();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1)]); // the cost
    pick(g, [g.leader('p1')]); // the target
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(isRested(g, g.find('p1', 'characters', V.c1))).toBe(true);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000); // battle only
  });

  it('[Counter]: declining the cost gives nothing and rests nothing', () => {
    const g = step();
    useCounter(g, ID);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(isRested(g, g.find('p1', 'characters', V.c1))).toBe(false);
  });

  it('[Counter]: the +4000 may go to a Character (up to 1: either target)', () => {
    const g = step();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(7000);
  });

  describe('[Trigger]', () => {
    const hit = () =>
      damageGame(
        ID,
        { leader: FM_LEADER, characters: [V.c1], costArea: { active: 1, rested: 0 } },
        { characters: [V.c5, V.c6] },
      );

    it('you may rest 1 of your cards: rests an opposing Character with 7000 base power or less', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      pick(g, [g.find('p1', 'characters', V.c1)]); // the cost
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // 7000: boundary in
      expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // 8000: out
      pick(g, [g.find('p2', 'characters', V.c5)]);
      expect(isRested(g, g.find('p2', 'characters', V.c5))).toBe(true);
    });

    it('not activating adds the card to hand and rests nothing', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: false });
      expect(hand(g, 'p1')).toContain(ID);
      expect(isRested(g, g.find('p2', 'characters', V.c5))).toBe(false);
    });
  });
});
