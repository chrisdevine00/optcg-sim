/**
 * EB03-004 Carina (Character, Red, cost 3, 2000, Counter +1000, {FILM}/{Grantesoro}).
 *
 * Card text: "[Blocker] [Opponent's Turn] If your Leader is multicolored and you have no Characters
 * with 6000 base power or more, this Character gains +4000 power."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-3-2 (conditions are checked continuously), "base power" is the
 * printed power before any effect (CR 2-? / RL-33), [Opponent's Turn] works only on the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  chr,
  kind,
  LA,
  mine,
  need,
  noDefence,
  SA,
  theirs,
  useCounter,
  inst,
} from './kit-eb03a.ts';

const CARINA = 'EB03-004';

/** p2's turn; p1 holds Carina and `others`; p1's Leader is `leader`. */
function board(leader: string, others: string[] = [], p2Chars: string[] = []) {
  return theirs(leader, { characters: [CARINA, ...others] }, { characters: p2Chars });
}

describe('EB03-004 Carina: printed values and [Blocker]', () => {
  it('cost 3, 2000 power, Counter +1000, [Blocker]', () => {
    const g = mine(LA.croc, { characters: [CARINA] });
    const c = chr(g, 'p1', CARINA);
    expect(g.card(c).cost).toBe(3);
    expect(g.power(c)).toBe(2000);
    expect(g.card(c).counter).toBe(1000);
    expect(g.card(c).keywords).toContain('Blocker');
  });
});

describe("EB03-004 Carina: [Opponent's Turn] multicolored Leader and no 6000+ base power Character: +4000", () => {
  it("multicolored Leader, no other Character: 2000 -> 6000 on the opponent's turn", () => {
    const g = board(LA.vivi);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(6000);
  });

  it('a single-color Leader gives no bonus', () => {
    const g = board(LA.croc);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(2000);
  });

  it('another multicolored Leader (Red/Yellow, Purple/Red) works too', () => {
    const r = board('EB04-001');
    expect(r.power(chr(r, 'p1', CARINA))).toBe(6000);
    const g = board(LA.sugar);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(6000);
  });

  it("[Opponent's Turn]: on my own turn there is no bonus", () => {
    const g = mine(LA.vivi, { characters: [CARINA] });
    expect(g.power(chr(g, 'p1', CARINA))).toBe(2000);
  });

  it('boundary: a Character with 5000 base power does not stop the bonus', () => {
    const g = board(LA.vivi, [SA.marco]);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(6000);
  });

  it('boundary: a Character with exactly 6000 base power removes the bonus', () => {
    const g = board(LA.vivi, [SA.hajrudin]);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(2000);
    expect(g.power(chr(g, 'p1', SA.hajrudin))).toBe(6000);
  });

  it('a Character with more than 6000 base power removes the bonus too', () => {
    const g = board(LA.vivi, [SA.thatch]);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(2000);
  });

  it('"you have": the opponent\'s 6000+ Characters do not count', () => {
    const g = board(LA.vivi, [], [SA.thatch, SA.hajrudin]);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(6000);
  });

  it('base power is meant: a 5000 base Character raised to 7000 during a battle keeps the bonus', () => {
    const g = theirs(
      LA.vivi,
      {
        characters: [CARINA, SA.marco],
        hand: [SA.boost2000],
        costArea: { active: 2, rested: 0 },
        life: [SA.mohji, SA.mohji, SA.mohji, SA.mohji],
      },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    act(g, { type: 'block', blocker: null });
    expect(kind(g)).toBe('counter');
    useCounter(g, inst(g, 'p1', 'hand', SA.boost2000), chr(g, 'p1', SA.marco));
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: chr(g, 'p1', SA.marco) });
    expect(g.power(chr(g, 'p1', SA.marco))).toBe(7000);
    expect(g.power(chr(g, 'p1', CARINA))).toBe(6000);
  });
});

describe('EB03-004 Carina: blocking', () => {
  it('with the bonus (6000) Carina blocks the 5000 Leader attack and survives', () => {
    const g = board(LA.vivi);
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', CARINA)]);
    act(g, { type: 'block', blocker: chr(g, 'p1', CARINA) });
    noDefence(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CARINA]);
    expect(g.life('p1')).toBe(4);
  });

  it("without the bonus (single-color Leader) a 2000 Carina that blocks a 5000 attacker is K.O.'d", () => {
    const g = board(LA.croc);
    attack(g, g.leader('p2'), g.leader('p1'));
    act(g, { type: 'block', blocker: chr(g, 'p1', CARINA) });
    noDefence(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('a rested Carina cannot block', () => {
    const g = theirs(LA.vivi, { characters: [{ card: CARINA, rested: true }] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
