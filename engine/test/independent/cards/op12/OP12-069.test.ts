/**
 * OP12-069 Crocodile (Character, Purple, cost 6, 8000, no Counter, {Baroque Works}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] DON!! −1: If your Leader's type includes
 * "Baroque Works", up to 1 of your Leader or Character cards gains +2000 power during this battle."
 *
 * Rules: [On Your Opponent's Attack] (CR 10-2-?) can be used when the opponent declares an attack,
 * before the Block Step; DON!! −1 returns 1 DON!! from my field to my DON!! deck and is optional;
 * the condition after the colon is read on resolution; [Once Per Turn] (CR 8-3-1-?) allows one use
 * per turn; "up to 1" may be none; "during this battle" ends with the battle.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  chars,
  decision,
  don,
  kind,
  LB,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  passBlock,
  pickInst,
  SB,
  theirs,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const CROC = 'OP12-069';

function attacked(
  leader: string,
  mineDon = 3,
  ownChars: string[] = [CROC],
  attackers: string[] = [SB.hajrudin],
): TestGame {
  const g = theirs(
    leader,
    { characters: ownChars, costArea: { active: mineDon, rested: 0 } },
    { characters: attackers },
  );
  attack(g, g.find('p2', 'characters', attackers[0]!), g.leader('p1'));
  return g;
}

const pay = (g: TestGame) => {
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
};

describe("OP12-069 Crocodile: [On Your Opponent's Attack] [Once Per Turn] DON!! -1: Baroque Works Leader: +2000", () => {
  it('is offered when the opponent attacks; paying returns 1 DON!! to the DON!! deck', () => {
    const g = attacked(LB.croc);
    pay(g);
    expect(don(g)).toMatchObject({ deck: 8, active: 2 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CROC, LB.croc].sort());
  });

  it("+2000 to my Leader during the battle turns a 6000 attacker's win into a loss (7000 vs 6000)", () => {
    const g = attacked(LB.croc);
    pay(g);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('can boost Crocodile instead of the Leader (8000 + 2000)', () => {
    const g = attacked(LB.croc);
    pay(g);
    pickInst(g, [g.find('p1', 'characters', CROC)]);
    expect(g.power(g.find('p1', 'characters', CROC))).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost ends with the battle (Leader back to 5000)', () => {
    const g = attacked(LB.croc);
    pay(g);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the target may be left empty; DON!! -1 is still paid and no power changes', () => {
    const g = attacked(LB.croc);
    pay(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(don(g)).toMatchObject({ deck: 8, active: 2 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the optional DON!! -1 keeps all DON!! and gives nothing', () => {
    const g = attacked(LB.croc);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(don(g)).toMatchObject({ deck: 7, active: 3 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not: with a Leader whose type is not Baroque Works nobody gets +2000 even if DON!! -1 is paid', () => {
    const g = attacked(LB.luffy);
    if (kind(g) === 'optional') {
      act(g, { type: 'optional', accept: true });
      if (kind(g) === 'choose') none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', CROC))).toBe(8000);
  });

  it('cost: with no DON!! on my field the effect cannot be used', () => {
    const g = attacked(LB.croc, 0);
    const d = decision(g);
    if (d?.kind === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = attacked(LB.croc, 4, [CROC], [SB.hajrudin, SB.marco]);
    pay(g);
    need(g, 'choose', 'p1');
    none(g);
    noDefence(g);
    need(g, 'main', 'p2');
    attack(g, g.find('p2', 'characters', SB.marco), g.leader('p1'));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([CROC]);
  });

  it('[Once Per Turn] is not used up by declining: the next attack of the same turn offers it again', () => {
    const g = attacked(LB.croc, 4, [CROC], [SB.hajrudin, SB.marco]);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    noDefence(g);
    need(g, 'main', 'p2');
    attack(g, g.find('p2', 'characters', SB.marco), g.leader('p1'));
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('must not: when I attack myself nothing is offered to me (the Block Step goes to the opponent)', () => {
    const g = mine(LB.croc, { characters: [CROC, SB.marco] }, { characters: [SB.mohji] });
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(don(g)).toMatchObject({ deck: 0, active: 10 });
  });
});
