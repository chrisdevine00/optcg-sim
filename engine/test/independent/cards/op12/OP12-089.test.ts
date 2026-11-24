/**
 * OP12-089 Hack (Character, Black, cost 4, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "If your Leader has the "Revolutionary Army" type, this Character gains [Blocker] and +4
 * cost. [On K.O.] If your Leader has the "Revolutionary Army" type, K.O. up to 1 of your opponent's
 * Characters with a base cost of 4 or less."
 *
 * Rules: "base cost" is the printed cost (CR 4-9-2), unaffected by cost modifiers; [On K.O.] fires on
 * any K.O. (battle too), CR 4-8-1 ("up to" allows 0); an attacker never loses a battle against a
 * Character, a rested Character can be attacked.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  chars,
  LDR,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  SCN,
  theirs,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-089';

/** p2's 6000-power Character attacks my rested Hack; the attacker wins and Hack is K.O.'d. */
function hackKod(leader: string, oppChars: string[], p2Leader: string = LDR.luffy) {
  const g = theirs(
    leader,
    { characters: [{ card: ID, rested: true } as never] },
    { characters: [SCN.c4, ...oppChars] },
    p2Leader,
  );
  attack(g, at(g, 'p2', 'characters', SCN.c4), at(g, 'p1', 'characters', ID));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP12-089 Hack: [Blocker] and +4 cost with a Revolutionary Army Leader', () => {
  it('Revolutionary Army Leader: [Blocker] and cost 8', () => {
    const g = mine(LDR.ra, { characters: [ID] });
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(8);
  });

  it('other Leader: no [Blocker], printed cost 4, power 5000', () => {
    const g = mine(LDR.luffy, { characters: [ID] });
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).not.toContain('Blocker');
    expect(c.cost).toBe(4);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(5000);
  });

  it('with the Leader it can block', () => {
    const g = theirs(LDR.ra, { characters: [ID] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });
});

describe('OP12-089 Hack: [On K.O.] with an RA Leader, K.O. up to 1 opposing Character with base cost 4 or less', () => {
  it('Hack is K.O.d in battle, then the opposing Characters with base cost <= 4 are offered (boundary 4 in, 5 out)', () => {
    const g = hackKod(LDR.ra, [SCN.c3, SCN.c5]);
    expect(chars(g, 'p1')).toEqual([]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c4].sort());
  });

  it('choosing one K.O.s it (and only it)', () => {
    const g = hackKod(LDR.ra, [SCN.c3, SCN.c5]);
    pickCards(g, [SCN.c3]);
    expect(trash(g, 'p2')).toEqual([SCN.c3]);
    expect(chars(g, 'p2')).toEqual([SCN.c4, SCN.c5].sort());
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = hackKod(LDR.ra, [SCN.c3]);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g, 'p2')).toEqual([SCN.c3, SCN.c4].sort());
  });

  it('"base cost": a Character whose current cost is 8 but whose base cost is 4 (Morley under an RA Leader) is a legal target', () => {
    const g = hackKod(LDR.ra, ['OP12-093'], LDR.ra);
    expect(g.card(at(g, 'p2', 'characters', 'OP12-093')).cost).toBe(8);
    expect(offeredIds(g)).toContain('OP12-093');
  });

  it('without a Revolutionary Army Leader nothing is offered: Hack is simply K.O.d', () => {
    const g = hackKod(LDR.luffy, [SCN.c3]);
    expect(chars(g, 'p1')).toEqual([]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g, 'p2')).toEqual([SCN.c3, SCN.c4].sort());
  });

  it("only the opponent's Characters are candidates, never my own", () => {
    const g = theirs(
      LDR.ra,
      { characters: [{ card: ID, rested: true } as never, SCN.c2] },
      { characters: [SCN.c4] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c4), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c4]);
  });
});
