/**
 * OP15-011 Pearl (Character, Red, cost 4, 4000, Counter +1000, {Krieg Pirates}/{East Blue}).
 *
 * Card text: "[Opponent's Turn] If your Leader has the {East Blue} type, this Character gains [Blocker]
 * and +2000 power. [On K.O.] If your Leader has the {East Blue} type, K.O. up to 1 of your
 * opponent's Characters with 6000 base power or less."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-17 ([On K.O.] after a K.O. in battle), CR 8-4-4-1 ("up
 * to"), base power ignores DON!! and other modifiers.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from './kit-op15a.ts';
import {
  at,
  chars,
  kw,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  SCN,
  theirs,
  trash,
} from './kit-op15a.ts';

const PEARL = 'OP15-011';

type P = string | { card: string; don?: number; rested?: boolean };

describe("OP15-011 Pearl: [Opponent's Turn] [Blocker] and +2000 with an {East Blue} Leader", () => {
  it("on my opponent's turn with an {East Blue} Leader: [Blocker] and 6000 power", () => {
    const g = theirs(LD15.eastBlue, { characters: [PEARL] });
    const p = at(g, 'p1', 'characters', PEARL);
    expect(kw(g, p)).toContain('Blocker');
    expect(g.power(p)).toBe(6000);
  });

  it('on my own turn it has neither: no [Blocker], 4000', () => {
    const g = mine(LD15.eastBlue, { characters: [PEARL] });
    const p = at(g, 'p1', 'characters', PEARL);
    expect(kw(g, p)).not.toContain('Blocker');
    expect(g.power(p)).toBe(4000);
  });

  it("on my opponent's turn without an {East Blue} Leader: no [Blocker], 4000", () => {
    const g = theirs(LD15.luffy, { characters: [PEARL] });
    const p = at(g, 'p1', 'characters', PEARL);
    expect(kw(g, p)).not.toContain('Blocker');
    expect(g.power(p)).toBe(4000);
  });

  it('the granted [Blocker] really blocks an attack on my Leader', () => {
    const g = theirs(LD15.eastBlue, { characters: [PEARL] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', PEARL)]);
  });

  it('without the Leader type the Character cannot block', () => {
    const g = theirs(LD15.luffy, { characters: [PEARL] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('the +2000 matters: a rested Pearl (6000) survives a 5000 attacker; at 4000 it would not', () => {
    const withType = theirs(
      LD15.eastBlue,
      { characters: [{ card: PEARL, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(
      withType,
      at(withType, 'p2', 'characters', SCN.c3),
      at(withType, 'p1', 'characters', PEARL),
    );
    passBlock(withType);
    passCounter(withType);
    expect(chars(withType)).toEqual([PEARL]);
    const without = theirs(
      LD15.luffy,
      { characters: [{ card: PEARL, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(
      without,
      at(without, 'p2', 'characters', SCN.c3),
      at(without, 'p1', 'characters', PEARL),
    );
    passBlock(without);
    passCounter(without);
    expect(chars(without)).toEqual([]);
  });
});

/** p2 attacks the rested Pearl with a 7000 Character (Pearl has 6000 on that turn); Pearl is K.O.d. */
function koPearl(leader: string, p2chars: P[]) {
  const g = theirs(
    leader,
    { characters: [{ card: PEARL, rested: true }] },
    {
      characters: [SCN.c5, ...p2chars],
      costArea: {
        active: 10 - p2chars.reduce((n, c) => n + (typeof c === 'string' ? 0 : (c.don ?? 0)), 0),
        rested: 0,
      },
    },
  );
  attack(g, at(g, 'p2', 'characters', SCN.c5), at(g, 'p1', 'characters', PEARL));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP15-011 Pearl: [On K.O.] K.O. up to 1 Character with 6000 base power or less', () => {
  it('with an {East Blue} Leader it offers exactly the opposing Characters with 6000 base power or less', () => {
    const g = koPearl(LD15.eastBlue, [SCN.c3, SCN.c4, SCN.c6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c4].sort());
  });

  it('K.O.s the chosen Character; Pearl itself is in the trash', () => {
    const g = koPearl(LD15.eastBlue, [SCN.c3, SCN.c4]);
    pickInst(g, [at(g, 'p2', 'characters', SCN.c4)]);
    need(g, 'main', 'p2');
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([SCN.c3, SCN.c5].sort());
    expect(trash(g, 'p2')).toEqual([SCN.c4]);
    expect(trash(g)).toEqual([PEARL]);
  });

  it('"base" power: a 6000 base Character with 1 DON!! given (7000 now) is still a target', () => {
    const g = koPearl(LD15.eastBlue, [{ card: SCN.c4, don: 1 }]);
    expect(offeredIds(g)).toEqual([SCN.c4]);
  });

  it('an 8000 base Character is never offered', () => {
    const g = koPearl(LD15.eastBlue, [SCN.c6, SCN.c3]);
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it('"up to 1": may choose nothing, and then nothing is K.O.d', () => {
    const g = koPearl(LD15.eastBlue, [SCN.c3]);
    none(g);
    need(g, 'main', 'p2');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('without an {East Blue} Leader nothing happens when Pearl is K.O.d', () => {
    const g = koPearl(LD15.luffy, [SCN.c3]);
    need(g, 'main', 'p2');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(trash(g)).toEqual([PEARL]);
  });
});
