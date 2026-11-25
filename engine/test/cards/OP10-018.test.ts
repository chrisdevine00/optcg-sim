/** OP10-018 Ten-Layer Igloo. */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, none, pick, trash, V } from './helpers.ts';
import { canPick, counterGame, finish, pw, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-018';

describe('OP10-018 Ten-Layer Igloo', () => {
  it('[Counter]: +3000 to your Leader during this battle, then -2000 to an opponent Character this turn', () => {
    const g = counterGame(ID, {}, { characters: [V.c3] });
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    pick(g, [g.find('p2', 'characters', V.c7)]); // the attacker: 9000 -> 7000
    expect(pw(g, 'p2', V.c7)).toBe(7000);
    expect(pw(g, 'p2', V.c3)).toBe(5000);
    endCounter(g);
    finish(g);
    // 8000 vs 7000: the Leader survives, so no damage.
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000); // the +3000 ended with the battle
    expect(pw(g, 'p2', V.c7)).toBe(7000); // the -2000 lasts the turn
    expect(trash(g, 'p1')).toContain(ID);
  });

  it('the -2000 may be given to the opponent Leader, and can be declined ("up to 1")', () => {
    const g = counterGame(ID);
    pick(g, [g.leader('p1')]);
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false); // only the opponent's cards
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    const h = counterGame(ID);
    pick(h, [h.leader('p1')]);
    none(h);
    expect(pw(h, 'p2', V.c7)).toBe(9000);
  });

  it('"Then" is not "if you do": with the +3000 declined the -2000 is still asked', () => {
    const g = counterGame(ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(pw(g, 'p2', V.c7)).toBe(7000);
  });

  it('the +3000 can go to a Character of yours, and only to yours', () => {
    const g = counterGame(ID, { characters: [V.c2] });
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(pw(g, 'p1', V.c2)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger]: up to 1 of your Leader or Character cards gains +1000 power during this turn', () => {
    const g = trigGame(ID, {});
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(dec(g)?.kind).not.toBe('choose');
    void finish;
  });
});
