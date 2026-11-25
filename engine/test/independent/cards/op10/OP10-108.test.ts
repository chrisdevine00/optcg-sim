/**
 * OP10-108 Scratchmen Apoo (Character, Yellow, cost 1, 1000, Counter +1000, {On-Air Pirates}/
 * {Supernovas}).
 *
 * Card text: "If you have a yellow "Supernovas" type Character other than [Scratchmen Apoo], this
 * Character gains [Blocker]."
 *
 * Rules: a permanent effect, checked continuously (CR 8-1-3-3); "you have" means your own field;
 * "other than [Scratchmen Apoo]" excludes every card with that name; colour and type both needed.
 */
import { describe, expect, it } from 'vitest';
import { act, at, attack, blockers, kw, LD10, mine, SC10, SC14, theirs } from './kit-op10c.ts';

const ID = 'OP10-108';
const APOO_RED = SC10.nova3r; // OP14-008 Scratchmen Apoo: Red, {On-Air Pirates}/{Supernovas}
const RED_NOVA = SC10.nova4r; // P-022 Monkey.D.Luffy: Red, {Supernovas}
const YELLOW_RA = SC10.ra4; // OP09-113 Morley: Yellow, {Giant}/{Revolutionary Army}

const blocker = (chars: string[]) => {
  const g = mine(LD10.plain, { characters: [ID, ...chars] });
  return kw(g, at(g, 'p1', 'characters', ID)).includes('Blocker');
};

describe('OP10-108 Scratchmen Apoo: with another yellow {Supernovas} Character, gains [Blocker]', () => {
  it('with a yellow {Supernovas} Character (Urouge) it has [Blocker]', () => {
    expect(blocker([SC10.nova5])).toBe(true);
  });

  it('alone it has no [Blocker]', () => {
    expect(blocker([])).toBe(false);
  });

  it('a red {Supernovas} Character does not count (colour)', () => {
    expect(blocker([RED_NOVA])).toBe(false);
  });

  it('a yellow Character that is not {Supernovas} does not count (type)', () => {
    expect(blocker([YELLOW_RA])).toBe(false);
  });

  it('"other than [Scratchmen Apoo]": a second yellow [Scratchmen Apoo] does not count', () => {
    expect(blocker([ID])).toBe(false);
  });

  it('a red [Scratchmen Apoo] is neither yellow nor allowed by name', () => {
    expect(blocker([APOO_RED])).toBe(false);
  });

  it('a rested yellow {Supernovas} Character still counts', () => {
    const g = mine(LD10.plain, { characters: [ID, { card: SC10.nova5, rested: true }] });
    expect(kw(g, at(g, 'p1', 'characters', ID))).toContain('Blocker');
  });

  it("the opponent's yellow {Supernovas} Character does not count", () => {
    const g = mine(LD10.plain, { characters: [ID] }, { characters: [SC10.nova5] });
    expect(kw(g, at(g, 'p1', 'characters', ID))).not.toContain('Blocker');
  });

  it('with the condition met, Apoo is offered as a blocker; without it, he is not', () => {
    const on = theirs(LD10.plain, { characters: [ID, SC10.nova5] }, { characters: [SC14.c4] });
    attack(on, on.find('p2', 'characters', SC14.c4), on.leader('p1'));
    expect(blockers(on)).toContain(at(on, 'p1', 'characters', ID));
    const off = theirs(LD10.plain, { characters: [ID, RED_NOVA] }, { characters: [SC14.c4] });
    attack(off, off.find('p2', 'characters', SC14.c4), off.leader('p1'));
    expect(blockers(off)).not.toContain(at(off, 'p1', 'characters', ID));
    void act;
  });
});
