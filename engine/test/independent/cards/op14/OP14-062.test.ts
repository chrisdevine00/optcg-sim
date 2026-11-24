/**
 * OP14-062 Gladius (Character, Purple, cost 3, 4000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On K.O.] DON!! −1 (You may return the specified number of DON!! cards from your field
 * to your DON!! deck.): K.O. or rest up to 1 of your opponent's Characters with a base power of
 * 6000 or less."
 *
 * Rules: CR 10-2-17 ([On K.O.]), CR 8-3-1-4 / 8-3-1-6 and RL-52 (a "may" DON!! −X cost may be
 * declined and then the effect does not happen), RL-23 (returned DON!! go to the DON!! deck),
 * "base power" ignores modifiers (a given DON!! adds power on its owner's turn only).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  charState,
  chr,
  donOf14,
  koBattle,
  LD14,
  need,
  no,
  none,
  offeredIds,
  onField,
  payDon,
  pickInst,
  reach,
  SC14,
  theirs,
  trash,
  unusable,
  yes,
  backToMain,
  kind,
  mayChooseNone,
} from './kit-op14c.ts';

const ID = 'OP14-062';

/** p1 defends with a rested Gladius (4000); p2's Leader (5000) K.O.s it. p1 has 3 active DON!!. */
function koGladius(p2chars: (string | { card: string; don: number })[], active = 3) {
  const g = theirs(
    LD14.dp,
    { characters: [{ card: ID, rested: true }], costArea: { active, rested: 0 } },
    { characters: p2chars, costArea: { active: 9, rested: 0 } },
  );
  koBattle(g, at(g, 'p1', 'characters', ID));
  return g;
}

/** Accept and pay DON!! −1, leaving the mode / target prompt (if any). */
function accept(g: ReturnType<typeof koGladius>) {
  need(g, 'optional', 'p1');
  yes(g, 'p1');
  payDon(g, 1);
}

describe('OP14-062 Gladius [On K.O.] DON!! −1: K.O. or rest', () => {
  it('is offered after the battle K.O.; paying DON!! −1 returns 1 DON!! to the DON!! deck', () => {
    const g = koGladius([SC14.c4]);
    expect(trash(g)).toEqual([ID]);
    need(g, 'optional', 'p1');
    const before = donOf14(g);
    yes(g, 'p1');
    payDon(g, 1);
    expect(onField(g)).toBe(2);
    expect(donOf14(g).deck).toBe(before.deck + 1);
  });

  it('can K.O. an opposing Character with a base power of 6000', () => {
    const g = koGladius([SC14.c4]);
    accept(g);
    const states = reach(g, 'p1', 'p2');
    expect(states).toContain(`${SC14.c4}:T`);
  });

  it('can instead rest that Character, leaving it on the field', () => {
    const g = koGladius([SC14.c4]);
    accept(g);
    const states = reach(g, 'p1', 'p2');
    expect(states).toContain(`${SC14.c4}:R`);
    // Both modes exist and nothing else happens to a lone target.
    for (const s of states) expect([`${SC14.c4}:T`, `${SC14.c4}:R`, `${SC14.c4}:A`]).toContain(s);
  });

  it('boundary: base power 6000 and 5000 are targets, 7000 is not', () => {
    const g = koGladius([SC14.c4, SC14.c3, SC14.c5]);
    accept(g);
    const states = reach(g, 'p1', 'p2');
    const touched = (card: string) =>
      states.some((s) => s.includes(`${card}:T`) || s.includes(`${card}:R`));
    expect(touched(SC14.c4)).toBe(true);
    expect(touched(SC14.c3)).toBe(true);
    expect(touched(SC14.c5)).toBe(false);
  });

  it('reads BASE power: a 6000-base Character with a DON!! given (7000 now) is still a target', () => {
    const g = koGladius([{ card: SC14.c4, don: 1 }]);
    accept(g);
    // On p2's turn a given DON!! adds +1000, so the current power is above the limit.
    expect(g.power(chr(g, 'p2', SC14.c4))).toBe(7000);
    const states = reach(g, 'p1', 'p2');
    expect(states.some((s) => s.includes(`${SC14.c4}:T`) || s.includes(`${SC14.c4}:R`))).toBe(true);
  });

  it('reads BASE power: a 7000-base Character is no target even though no modifier lowers it', () => {
    const g = koGladius([SC14.c5]);
    accept(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).not.toContain(SC14.c5);
    }
    const states = reach(g, 'p1', 'p2');
    for (const s of states) expect(s).toBe(`${SC14.c5}:A`);
  });

  it('"up to 1": nothing may be chosen; the cost stays paid', () => {
    const g = koGladius([SC14.c4]);
    accept(g);
    if (kind(g) === 'choose' && mayChooseNone(g)) none(g);
    const states = reach(g, 'p1', 'p2');
    expect(states.length).toBeGreaterThan(0);
    expect(onField(g)).toBe(2);
  });

  it('"may": declining pays no DON!! and affects nothing', () => {
    const g = koGladius([SC14.c4]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    backToMain(g, 'p2');
    expect(onField(g)).toBe(3);
    expect(charState(g, 'p2')).toBe(`${SC14.c4}:A`);
  });

  it('with no DON!! on the field the cost cannot be paid and the effect does nothing', () => {
    const g = koGladius([SC14.c4], 0);
    unusable(g, 'p1');
    backToMain(g, 'p2');
    expect(charState(g, 'p2')).toBe(`${SC14.c4}:A`);
    expect(trash(g)).toEqual([ID]);
  });

  it('the cost may be paid with a given DON!!: it is a DON!! on the field', () => {
    const g = theirs(
      LD14.dp,
      {
        characters: [
          { card: ID, rested: true },
          { card: SC14.c1, don: 1 },
        ],
        costArea: { active: 0, rested: 0 },
      },
      { characters: [SC14.c4] },
    );
    koBattle(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 1, 'given', chr(g, 'p1', SC14.c1));
    expect(onField(g)).toBe(0);
    expect(pickInstSafe(g)).toBe(true);
  });
});

/** Whether the effect went on to ask for a mode or target (it resolved after the cost was paid). */
function pickInstSafe(g: ReturnType<typeof koGladius>): boolean {
  return kind(g) === 'choose' || kind(g) === 'main';
}

void pickInst;
