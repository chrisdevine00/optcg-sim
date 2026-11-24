/**
 * OP12-009 Jinbe (Character, Red, cost 3, 4000, Counter +1000, {Fish-Man} {The Sun Pirates}).
 *
 * Card text: "[On Play] You may reveal 2 Events from your hand: This Character gains [Rush] during
 * this turn. Then, this Character gains +1000 power until the end of your opponent's next End
 * Phase."
 *
 * Rules: the reveal is an optional cost, offered even when unpayable with accept illegal (DECISIONS
 * 2026-10-29); revealed cards stay in the hand; both effects follow the colon, so both need the
 * cost; [Rush] lets the Character attack the turn it is played; "until the end of your opponent's
 * next End Phase" created on my turn ends at the opponent's coming End Phase (engine convention).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canAcceptOptional,
  canAttackAnything,
  chr,
  decision,
  kind,
  kw,
  LD12,
  mine,
  need,
  no,
  noDefence,
  playRaw,
  revealCost,
  revealedByEffects,
  S12,
  sorted,
  yes,
} from './kit-op12a.ts';

const JIN = 'OP12-009';
const E = S12.event;

function board(hand: string[]) {
  return mine(LD12.luffy, { hand: [JIN, ...hand] });
}

function paid(hand: string[]) {
  const g = board(hand);
  playRaw(g, JIN);
  yes(g, 'p1');
  revealCost(g, 2);
  return g;
}

describe('OP12-009 Jinbe: [On Play] reveal 2 Events: [Rush], then +1000 until the end of the opponent next End Phase', () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = board([]);
    const c = g.card(g.find('p1', 'hand', JIN));
    expect([c.cost, c.power, c.counter]).toEqual([3, 4000, 1000]);
  });

  it('with 2 Events: the optional cost is offered; paying gives [Rush] and +1000 (5000), Events stay in hand', () => {
    const g = board([E, E, S12.sunny]);
    playRaw(g, JIN);
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(true);
    yes(g, 'p1');
    revealCost(g, 2);
    expect(kind(g)).toBe('main');
    expect(kw(g, chr(g, 'p1', JIN))).toContain('Rush');
    expect(g.power(chr(g, 'p1', JIN))).toBe(5000);
    expect(revealedByEffects(g)).toEqual([E, E]);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, E, S12.sunny].sort());
  });

  it('[Rush] lets Jinbe attack this turn, and the +1000 counts in the battle (5000 hits a 5000 Leader)', () => {
    const g = paid([E, E]);
    expect(canAttackAnything(g, chr(g, 'p1', JIN))).toBe(true);
    act(g, { type: 'attack', attacker: chr(g, 'p1', JIN), target: g.leader('p2') });
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('the +1000 lasts through the opponent turn and is gone at their End Phase', () => {
    const g = paid([E, E]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p1', JIN))).toBe(5000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p1', JIN))).toBe(4000);
  });

  it('[Rush] lasts only this turn', () => {
    const g = paid([E, E]);
    expect(kw(g, chr(g, 'p1', JIN))).toContain('Rush');
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(kw(g, chr(g, 'p1', JIN))).not.toContain('Rush');
  });

  it('declining the cost: no [Rush], no power, nothing revealed', () => {
    const g = board([E, E]);
    playRaw(g, JIN);
    no(g, 'p1');
    expect(kw(g, chr(g, 'p1', JIN))).not.toContain('Rush');
    expect(g.power(chr(g, 'p1', JIN))).toBe(4000);
    expect(revealedByEffects(g)).toEqual([]);
    expect(canAttackAnything(g, chr(g, 'p1', JIN))).toBe(false);
  });

  it('with only 1 Event the cost cannot be paid: accept is not available and nothing is gained', () => {
    const g = board([E, S12.sunny, S12.sai]);
    playRaw(g, JIN);
    if (decision(g)?.kind === 'optional') {
      expect(canAcceptOptional(g)).toBe(false);
      no(g, 'p1');
    }
    expect(kw(g, chr(g, 'p1', JIN))).not.toContain('Rush');
    expect(g.power(chr(g, 'p1', JIN))).toBe(4000);
  });

  it('with no Event at all nothing is gained either', () => {
    const g = board([S12.sunny, S12.sai]);
    playRaw(g, JIN);
    if (decision(g)?.kind === 'optional') {
      expect(canAcceptOptional(g)).toBe(false);
      no(g, 'p1');
    }
    expect(kind(g)).toBe('main');
    expect(g.power(chr(g, 'p1', JIN))).toBe(4000);
  });

  it('Events of any colour can be revealed', () => {
    const g = board([E, S12.iceAge]);
    playRaw(g, JIN);
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(true);
  });

  it('must not: the power bonus does not stack from other sources: exactly +1000 over the base', () => {
    const g = paid([E, E, E]);
    expect(g.power(chr(g, 'p1', JIN))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
