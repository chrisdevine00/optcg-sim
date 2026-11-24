/** OP11-010 Hibari. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import {
  canHit,
  canPick,
  finishBattle,
  mk,
  NAVY_LEADER,
  pw,
  RED_LEADER,
} from './helpers-op11g1.ts';

const ID = 'OP11-010';

describe('OP11-010 Hibari', () => {
  it('[On Play]: an opponent Character gets -2000 power this turn', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4, V.c1] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(pw(g, 'p2', V.c4)).toBe(4000);
    expect(pw(g, 'p2', V.c1)).toBe(3000);
    g.act({ type: 'endTurn' });
    expect(pw(g, 'p2', V.c4)).toBe(6000);
  });

  it('[On Play] "up to 1": may choose nobody', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    none(g);
    expect(pw(g, 'p2', V.c4)).toBe(6000);
  });

  it('[When Attacking]: +1000 power, then a {Navy} Leader can also attack active Characters this turn', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] }, { characters: [V.c4] });
    const active = g.find('p2', 'characters', V.c4);
    expect(canHit(g, g.leader('p1'), active)).toBe(false);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(pw(g, 'p1', ID)).toBe(7000);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'leader', NAVY_LEADER))).toBe(true);
    pick(g, [g.leader('p1')]);
    finishBattle(g);
    expect(canHit(g, g.leader('p1'), active)).toBe(true);
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(true); // the usual target stays legal
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canHit(g, g.leader('p1'), active)).toBe(false);
  });

  it('"up to 1": the Leader grant may be declined', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] }, { characters: [V.c4] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    none(g);
    finishBattle(g);
    expect(canHit(g, g.leader('p1'), g.find('p2', 'characters', V.c4))).toBe(false);
    expect(pw(g, 'p1', ID)).toBe(7000);
  });

  it('a Leader without the {Navy} type is not eligible: the +1000 still applies, no choice is offered', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c4] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(pw(g, 'p1', ID)).toBe(7000);
    expect(dec(g)?.kind).toBe('block');
    finishBattle(g);
    expect(canHit(g, g.leader('p1'), g.find('p2', 'characters', V.c4))).toBe(false);
  });
});
