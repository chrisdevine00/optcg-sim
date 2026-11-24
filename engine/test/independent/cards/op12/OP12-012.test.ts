/**
 * OP12-012 Buggy (Character, Red, cost 2, 2000, Counter +1000, {Roger Pirates}).
 *
 * Card text: "[On Play] Up to 1 of your Characters with a type including "Roger Pirates" other than
 * [Buggy] gains [Blocker] until the end of your opponent's next End Phase."
 *
 * Rules: "type including X" is a substring match on any type ({Former Roger Pirates} qualifies);
 * "other than [Buggy]" excludes every card named Buggy, this one included; the Leader is not a
 * Character; "up to 1" may be 0; "until the end of your opponent's next End Phase" created on my
 * turn ends at the opponent's coming End Phase (engine convention); a Character with [Blocker] may
 * rest to become the new target of an attack (CR 10-1-4).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  blockers,
  chr,
  kind,
  kw,
  LD12,
  mine,
  need,
  none,
  offeredCardIds,
  pickInst,
  playRaw,
  S12,
} from './kit-op12a.ts';

const BUG = 'OP12-012';

function board(chars: (string | { card: string; rested?: boolean })[]) {
  return mine(LD12.luffy, { hand: [BUG], characters: chars });
}

describe('OP12-012 Buggy: [On Play] a {Roger Pirates} Character other than [Buggy] gains [Blocker]', () => {
  it('printed values: cost 2, 2000, Counter +1000', () => {
    const g = board([]);
    const c = g.card(g.find('p1', 'hand', BUG));
    expect([c.cost, c.power, c.counter]).toEqual([2, 2000, 1000]);
  });

  it('offers exactly the Characters with a type including "Roger Pirates" other than [Buggy]', () => {
    const g = board([S12.bullet, S12.shanksPurple, S12.buggyPurple, S12.sai]);
    playRaw(g, BUG);
    need(g, 'choose', 'p1');
    // Douglas Bullet {Former Roger Pirates} and Shanks {Roger Pirates}; the other [Buggy] and Sai are out
    expect(offeredCardIds(g)).toEqual([S12.bullet, S12.shanksPurple].sort());
  });

  it('the chosen Character gains [Blocker]', () => {
    const g = board([S12.bullet]);
    expect(kw(g, chr(g, 'p1', S12.bullet))).not.toContain('Blocker');
    playRaw(g, BUG);
    pickInst(g, [chr(g, 'p1', S12.bullet)]);
    expect(kw(g, chr(g, 'p1', S12.bullet))).toContain('Blocker');
    expect(kind(g)).toBe('main');
  });

  it('it can block during the opponent turn, and the effect is gone after their End Phase', () => {
    const g = board([S12.bullet]);
    playRaw(g, BUG);
    pickInst(g, [chr(g, 'p1', S12.bullet)]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(kw(g, chr(g, 'p1', S12.bullet))).toContain('Blocker');
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    expect(blockers(g)).toEqual([chr(g, 'p1', S12.bullet)]);
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    while (kind(g) === 'trigger') act(g, { type: 'trigger', activate: false });
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(kw(g, chr(g, 'p1', S12.bullet))).not.toContain('Blocker');
  });

  it('"up to 1": choosing nothing gives [Blocker] to nobody', () => {
    const g = board([S12.bullet]);
    playRaw(g, BUG);
    none(g);
    expect(kw(g, chr(g, 'p1', S12.bullet))).not.toContain('Blocker');
  });

  it('only one of two candidates gains [Blocker]', () => {
    const g = board([S12.bullet, S12.shanksPurple]);
    playRaw(g, BUG);
    pickInst(g, [chr(g, 'p1', S12.shanksPurple)]);
    expect(kw(g, chr(g, 'p1', S12.shanksPurple))).toContain('Blocker');
    expect(kw(g, chr(g, 'p1', S12.bullet))).not.toContain('Blocker');
  });

  it('a second [Buggy] on the field is not offered, and the Buggy just played is not either', () => {
    const g = board([BUG, S12.buggyPurple]);
    playRaw(g, BUG);
    // nothing but Buggies: no candidate, so no prompt (or an empty one)
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(kw(g, chr(g, 'p1', S12.buggyPurple))).not.toContain('Blocker');
    expect(kw(g, chr(g, 'p1', BUG, 1))).not.toContain('Blocker');
  });

  it('with no qualifying Character the play completes and Buggy itself has no [Blocker]', () => {
    const g = board([S12.sai]);
    playRaw(g, BUG);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(kw(g, chr(g, 'p1', BUG))).not.toContain('Blocker');
  });

  it('must not: the Leader is not a Character, even with a matching type', () => {
    const g = mine(LD12.rayleigh, { hand: [BUG], characters: [S12.sai] });
    playRaw(g, BUG);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(kw(g, g.leader('p1'))).not.toContain('Blocker');
  });
});
