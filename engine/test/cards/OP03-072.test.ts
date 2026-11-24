/** OP03-072 Gum-Gum Jet Gatling. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  accept,
  addMost,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  hand,
  option,
  pick,
  V,
} from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { LUFFY_LEADER } from './helpers-st29old.ts';

const ID = 'OP03-072';
const start = (handCards = [ID, BLUE]) =>
  counterStep({ leader: LUFFY_LEADER, hand: handCards, characters: [V.c3] }, {}, V.c5);

describe('OP03-072 Gum-Gum Jet Gatling', () => {
  it('[Counter]: you may trash 1 card from your hand: a Leader or Character gains +3000 power during this battle', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('may be applied to a Character', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(8000);
  });

  it('declining the optional cost gives nothing', () => {
    const g = start();
    useCounter(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger]: adds up to 1 DON!! card from your DON!! deck, set as active', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, costArea: { active: 4, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    const d = expectDecision(g, 'choose', 'p1'); // "up to 1" asks a count: 1 or 0
    expect(d.options).toHaveLength(2);
    addMost(g);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 5, rested: 0 });
  });

  it('[Trigger]: the count may be 0 ("up to 1")', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, costArea: { active: 4, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options![1]!.id);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });

  it('[Trigger]: with no DON!! left in the DON!! deck nothing is added', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, costArea: { active: 10, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 10, rested: 0 });
  });
});
