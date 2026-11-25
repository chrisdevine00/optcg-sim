/** OP09-036 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, mk } from './helpers-a09g2.ts';
import { donPick } from './helpers-st2627.ts';

const ID = 'OP09-036';
const R = (card: string) => ({ card, rested: true });

describe('OP09-036 Monkey.D.Luffy', () => {
  it('[On Play] with 2 rested Characters: rests an opposing Character with cost 6 or less', () => {
    const g = mk(
      { hand: [ID], characters: [R(V.c1), R(V.c2)] },
      { characters: [V.c6, V.c7], costArea: { active: 3, rested: 0 } },
    );
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true); // boundary: cost 6
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // cost 7
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 0 });
  });

  it("or rests one of the opponent's active DON!! cards (the cost limit does not apply to DON!!)", () => {
    const g = mk(
      { hand: [ID], characters: [R(V.c1), R(V.c2)] },
      { characters: [V.c7], costArea: { active: 3, rested: 0 } },
    );
    play(g, ID);
    const dp = donPick(g);
    expect(dp).toBeDefined();
    g.act(dp!);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 1 });
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(false);
  });

  it('with only 1 rested Character it does nothing', () => {
    const g = mk(
      { hand: [ID], characters: [R(V.c1), V.c2] },
      { characters: [V.c6], costArea: { active: 3, rested: 0 } },
    );
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 0 });
  });

  it('"up to 1": may rest nothing', () => {
    const g = mk(
      { hand: [ID], characters: [R(V.c1), R(V.c2)] },
      { characters: [V.c6], costArea: { active: 3, rested: 0 } },
    );
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 0 });
  });

  it('with only rested opposing cards (Characters and DON!!) there is nothing to rest', () => {
    const g = mk(
      { hand: [ID], characters: [R(V.c1), R(V.c2)] },
      { characters: [R(V.c6)], costArea: { active: 0, rested: 2 } },
    );
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
  });
});
