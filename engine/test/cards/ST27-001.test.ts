/** ST27-001 Avalo Pizarro. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, V } from './helpers.ts';
import {
  activate,
  BP_LEADER,
  FULLALEAD,
  koByBattle,
  mk,
  NOT_BP_LEADER,
  offeredAb,
} from './helpers-st2627.ts';

const ID = 'ST27-001';
const start = (
  leader: string,
  stage: string | { card: string; rested: boolean } | null = FULLALEAD,
) => mk({ leader, characters: [ID], ...(stage ? { stage } : {}) });
const me = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

describe('ST27-001 Avalo Pizarro', () => {
  it('[Activate: Main] rests a [Fullalead]: with a {Blackbeard Pirates} Leader this Character gains +4000 power', () => {
    const g = start(BP_LEADER);
    expect(g.power(me(g))).toBe(1000);
    activate(g, me(g), 'boost');
    expect(g.card(g.find('p1', 'stage', FULLALEAD)).rested).toBe(true);
    expect(g.power(me(g))).toBe(5000);
    expectDecision(g, 'main', 'p1');
  });

  it('the +4000 lasts this turn only, and the ability is usable again next turn', () => {
    const g = start(BP_LEADER);
    activate(g, me(g), 'boost');
    expect(offeredAb(g, me(g), 'boost')).toBe(false);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(me(g))).toBe(1000);
    expect(offeredAb(g, me(g), 'boost')).toBe(true);
  });

  it('with a Leader that is not {Blackbeard Pirates} the [Fullalead] is rested and nothing happens', () => {
    const g = start(NOT_BP_LEADER);
    expect(offeredAb(g, me(g), 'boost')).toBe(true);
    activate(g, me(g), 'boost');
    expect(g.card(g.find('p1', 'stage', FULLALEAD)).rested).toBe(true);
    expect(g.power(me(g))).toBe(1000);
    expect(offeredAb(g, me(g), 'boost')).toBe(false);
  });

  it('cannot be activated without an active [Fullalead] (rested, absent, or another Stage)', () => {
    const rested = start(BP_LEADER, { card: FULLALEAD, rested: true });
    expect(offeredAb(rested, me(rested), 'boost')).toBe(false);
    const none = start(BP_LEADER, null);
    expect(offeredAb(none, me(none), 'boost')).toBe(false);
    const other = start(BP_LEADER, 'OP07-117');
    expect(offeredAb(other, me(other), 'boost')).toBe(false);
  });

  it('[On K.O.] draws 1 card', () => {
    const g = koByBattle({ leader: BP_LEADER, deck: [V.c4, V.c5, V.c6] }, ID);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p1', 'characters')).toEqual([]);
  });
});
