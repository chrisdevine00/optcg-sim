/** OP09-035 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, mk } from './helpers-a09g2.ts';

const ID = 'OP09-035';
const R = (card: string) => ({ card, rested: true });
const opp = [V.c5, V.c6, V.c4];

describe('OP09-035 Portgas.D.Ace', () => {
  it('[On Play] with 2 rested Characters: rests an opposing Character with cost 5 or less', () => {
    const g = mk({ hand: [ID], characters: [R(V.c1), R(V.c2)] }, { characters: opp });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // boundary: cost 5
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // cost 6
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('with only 1 rested Character it does nothing (Ace enters active and does not count herself)', () => {
    const g = mk({ hand: [ID], characters: [R(V.c1), V.c2] }, { characters: opp });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = mk({ hand: [ID], characters: [R(V.c1), R(V.c2)] }, { characters: opp });
    play(g, ID);
    none(g);
    for (const c of opp) expect(g.card(g.find('p2', 'characters', c)).rested).toBe(false);
  });

  it("the opponent's rested Characters do not count toward the condition", () => {
    const g = mk({ hand: [ID], characters: [R(V.c1)] }, { characters: [R(V.c5), R(V.c4)] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
  });

  it('only 1 Character can be rested', () => {
    const g = mk({ hand: [ID], characters: [R(V.c1), R(V.c2)] }, { characters: opp });
    play(g, ID);
    expect(() =>
      pick(g, [g.find('p2', 'characters', V.c5), g.find('p2', 'characters', V.c4)]),
    ).toThrow(/can be picked now/);
  });
});
