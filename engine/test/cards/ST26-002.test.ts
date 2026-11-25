/** ST26-002 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, donPick, mk, payDonMinus } from './helpers-st2627.ts';

const ID = 'ST26-002';
/** Playing Chopper (cost 3) leaves `5 - 3` active; DON!! -2 then returns 2 of the field's DON!!. */
const start = (oppChars: string[], active = 5, oppDon = { active: 3, rested: 1 }) =>
  mk({ hand: [ID], costArea: { active, rested: 0 } }, { characters: oppChars, costArea: oppDon });
/** Play Chopper, accept DON!! -2 and pay it, up to the target pick. */
const go = (g: ReturnType<typeof start>) => {
  play(g, ID);
  accept(g);
  payDonMinus(g);
};

describe('ST26-002 Tony Tony.Chopper', () => {
  it('[On Play] DON!! -2: rests an opposing Character with a cost of 1 or less', () => {
    const g = start([V.c1, V.c2]);
    go(g);
    expect(don(g, 'p1').deck).toBe(7);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // cost 2
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
  });

  it("or rests one of the opponent's active DON!! cards (the cost filter does not apply to DON!!)", () => {
    const g = start([V.c2]);
    go(g);
    const dp = donPick(g);
    expect(dp).toBeDefined();
    g.act(dp!);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2 });
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing, and the DON!! -2 is still paid', () => {
    const g = start([V.c1]);
    go(g);
    none(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
  });

  it('declining the DON!! -2: nothing is returned and no target is asked', () => {
    const g = start([V.c1]);
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1').deck).toBe(5);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it("only the opponent's cards are candidates: your own Character is never offered", () => {
    const g = mk(
      { hand: [ID], characters: [V.c1], costArea: { active: 5, rested: 0 } },
      { characters: [V.c1], costArea: { active: 1, rested: 0 } },
    );
    go(g);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(donPick(g)).toBeDefined();
  });

  it('with only rested opposing Characters and rested DON!! there is nothing to rest and no prompt', () => {
    const g = mk(
      { hand: [ID], costArea: { active: 5, rested: 0 } },
      { characters: [{ card: V.c1, rested: true }], costArea: { active: 0, rested: 2 } },
    );
    go(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1').deck).toBe(7);
  });
});
