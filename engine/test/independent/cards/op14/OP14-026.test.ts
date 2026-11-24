/**
 * OP14-026 Kouzuki Oden (Character, cost 4, 5000, Counter +2000, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[Opponent's Turn] If this Character is rested, this Character gains +2000 power."
 *
 * Rules: [Opponent's Turn] limits the effect to the opponent's turn; the condition is the Character's
 * own rest state, checked live. In battle the attacker wins when its power is equal to or greater
 * than the defender's (CR 7-1-4); only a rested Character can be attacked (RL-17).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  chr,
  kind,
  LD14,
  mine,
  need,
  passBlock,
  passCounter,
  S14,
  theirs,
  trash,
} from './kit-op14a.ts';

const ODEN = 'OP14-026';

function defend(odenRested: boolean, p2chars: string[] = [S14.hajrudin]) {
  return theirs(
    LD14.luffy,
    {
      characters: [
        { card: ODEN, rested: odenRested },
        { card: S14.marco, rested: true },
      ],
    },
    { characters: p2chars },
  );
}

describe("OP14-026 Oden: [Opponent's Turn] +2000 power while rested", () => {
  it('printed values: cost 4, 5000, Counter +2000', () => {
    const g = defend(false);
    const o = at(g, 'p1', 'characters', ODEN);
    expect(g.card(o).cost).toBe(4);
    expect(g.power(o)).toBe(5000);
    expect(g.card(o).counter).toBe(2000);
  });

  it("on the opponent's turn a RESTED Oden has 7000 power", () => {
    const g = defend(true);
    expect(g.power(at(g, 'p1', 'characters', ODEN))).toBe(7000);
  });

  it("on the opponent's turn an ACTIVE Oden stays at 5000", () => {
    const g = defend(false);
    expect(g.power(at(g, 'p1', 'characters', ODEN))).toBe(5000);
  });

  it('on my own turn a rested Oden has no bonus (5000)', () => {
    const g = mine(LD14.luffy, { characters: [{ card: ODEN, rested: true }] });
    expect(g.power(at(g, 'p1', 'characters', ODEN))).toBe(5000);
  });

  it('it gives the bonus to itself only: another rested Character of mine and my Leader are unchanged', () => {
    const g = defend(true);
    expect(g.power(chr(g, 'p1', S14.marco))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('battle: a 6000 attacker does not K.O. the rested Oden (7000)', () => {
    const g = defend(true);
    attack(g, at(g, 'p2', 'characters', S14.hajrudin), at(g, 'p1', 'characters', ODEN));
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toContain(ODEN);
    expect(trash(g)).toEqual([]);
  });

  it('boundary: a 7000 attacker ties with 7000 and K.O.s the rested Oden (attacker wins on equal power)', () => {
    const g = defend(true, [S14.kingdew]);
    attack(g, at(g, 'p2', 'characters', S14.kingdew), at(g, 'p1', 'characters', ODEN));
    passBlock(g);
    passCounter(g);
    expect(trash(g)).toEqual([ODEN]);
  });

  it('the control: the same 6000 attacker K.O.s a rested Marco (5000)', () => {
    const g = defend(true);
    attack(g, at(g, 'p2', 'characters', S14.hajrudin), chr(g, 'p1', S14.marco));
    passBlock(g);
    passCounter(g);
    expect(trash(g)).toEqual([S14.marco]);
  });

  it('the Counter value still adds on top: a Counter +1000 on a rested Oden makes it 8000 in the battle', () => {
    const g = theirs(
      LD14.luffy,
      { hand: [S14.komachiyo], characters: [{ card: ODEN, rested: true }] },
      { characters: [S14.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', S14.kingdew), at(g, 'p1', 'characters', ODEN));
    passBlock(g);
    need(g, 'counter', 'p1');
    g.act({
      type: 'counter',
      card: g.find('p1', 'hand', S14.komachiyo),
      target: at(g, 'p1', 'characters', ODEN),
    });
    expect(g.power(at(g, 'p1', 'characters', ODEN))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(chars(g)).toContain(ODEN);
  });
});
