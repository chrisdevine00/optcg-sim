/**
 * ST16-003 Charlotte Katakuri (Character, cost 3, 4000, Counter +1000, {FILM}/{Big Mom Pirates}).
 *
 * Card text: "If your Leader has the "FILM" type and you have 6 or more rested cards, this Character
 * gains +2000 power."
 *
 * Rules: a permanent effect (CR 8-1-3-3), always applied while its conditions hold, on both turns.
 * "Rested cards" are the cards you control that are rested: DON!! cards in the cost area, the Leader,
 * Characters (this one included) and a Stage (CR 6-2-4 lists these areas). Only my own cards count.
 * The bonus is a flat +2000, not +2000 per card.
 */
import { describe, expect, it } from 'vitest';
import { at, LDP, mine, SP, theirs } from './kit-prb02sta.ts';

const KA = 'ST16-003';

/** p1's Katakuri with `rested` rested DON!! (and 10 - rested active). */
function withRestedDon(rested: number, leader: string = LDP.film) {
  return mine(leader, { characters: [KA], costArea: { active: 10 - rested, rested } });
}

const pow = (g: ReturnType<typeof mine>) => g.power(at(g, 'p1', 'characters', KA));

describe('ST16-003 Katakuri: with a {FILM} Leader and 6+ rested cards, +2000 power', () => {
  it('printed values: cost 3, 4000 power, Counter +1000', () => {
    const g = withRestedDon(0);
    const i = at(g, 'p1', 'characters', KA);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([3, 4000, 1000]);
  });

  it('5 rested cards (5 rested DON!!): no bonus (4000)', () => {
    expect(pow(withRestedDon(5))).toBe(4000);
  });

  it('exactly 6 rested cards (6 rested DON!!): +2000 (6000)', () => {
    expect(pow(withRestedDon(6))).toBe(6000);
  });

  it('10 rested cards: still only +2000 (6000)', () => {
    expect(pow(withRestedDon(10))).toBe(6000);
  });

  it('without a {FILM} Leader the bonus never applies, even with 10 rested DON!!', () => {
    expect(pow(withRestedDon(10, LDP.neutral))).toBe(4000);
  });

  it('rested Leader, Stage and Characters count too: 6 rested cards with no rested DON!! give +2000', () => {
    const g = mine(
      { card: LDP.film, rested: true },
      {
        characters: [
          { card: KA, rested: true },
          { card: SP.c1p3, rested: true },
          { card: SP.c2p4, rested: true },
          { card: SP.c3p5, rested: true },
        ],
        stage: { card: SP.stage, rested: true },
        costArea: { active: 10, rested: 0 },
      },
    );
    expect(pow(g)).toBe(6000);
  });

  it('the same cards with one of them active (5 rested cards) give no bonus', () => {
    const g = mine(
      { card: LDP.film, rested: true },
      {
        characters: [
          { card: KA, rested: true },
          { card: SP.c1p3, rested: true },
          { card: SP.c2p4, rested: true },
          SP.c3p5,
        ],
        stage: { card: SP.stage, rested: true },
        costArea: { active: 10, rested: 0 },
      },
    );
    expect(pow(g)).toBe(4000);
  });

  it('Katakuri herself being rested counts as one of the 6 (5 rested DON!! + herself)', () => {
    const g = mine(LDP.film, {
      characters: [{ card: KA, rested: true }],
      costArea: { active: 5, rested: 5 },
    });
    expect(pow(g)).toBe(6000);
    const active = mine(LDP.film, { characters: [KA], costArea: { active: 5, rested: 5 } });
    expect(pow(active)).toBe(4000);
  });

  it("only my rested cards count: 10 rested cards on the opponent's side give nothing", () => {
    const g = mine(
      LDP.film,
      { characters: [KA], costArea: { active: 10, rested: 0 } },
      { costArea: { active: 0, rested: 10 } },
    );
    expect(pow(g)).toBe(4000);
  });

  it("it applies on the opponent's turn too (6 rested DON!! -> 6000)", () => {
    const g = theirs(LDP.film, { characters: [KA], costArea: { active: 4, rested: 6 } });
    expect(pow(g)).toBe(6000);
  });
});
