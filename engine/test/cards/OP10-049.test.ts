/** OP10-049 Sabo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { C8, mk, raiseCost, runMine } from './helpers-a10g2.ts';

const ID = 'OP10-049';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const bounceOne = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
    to: { zone: 'hand' },
  },
};
/** Another Character named [Sabo] (Red, cost 4, {Revolutionary Army}); unscripted. */
const OTHER_SABO = 'EB02-002';
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

/** p2's turn; p2 runs `action` on `target`. */
const byOpponent = (target: string, action: Record<string, unknown> = koOne) => {
  const g = mk(
    { characters: [ID, V.c7, C8, OTHER_SABO], costArea: { active: 0, rested: 0 } },
    {},
    { turn: 4, activePlayer: 'p2' },
  );
  plantOpponentEffect(g, action);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP10-049 Sabo', () => {
  it("your other Character with a base cost of 7 or less about to be K.O.'d by the opponent's effect: you may return this Character to the hand instead", () => {
    const g = byOpponent(V.c7);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toContain(V.c7);
    expect(chars(g)).not.toContain(ID);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('also covers a return to the hand by the opponent (removal from the field)', () => {
    const g = byOpponent(V.c7, bounceOne);
    accept(g);
    expect(chars(g)).toContain(V.c7);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('declining lets the Character go', () => {
    const g = byOpponent(V.c7);
    decline(g);
    expect(chars(g)).not.toContain(V.c7);
    expect(chars(g)).toContain(ID);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('boundary: base cost 8 is not protected, even when its current cost is lowered to 7', () => {
    const g = mk(
      { characters: [ID, C8], costArea: { active: 0, rested: 0 } },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    raiseCost(g, g.find('p1', 'characters', C8), -1);
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', C8)]);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(C8);
    expect(chars(g)).toContain(ID);
  });

  it('a Character with a printed cost of 7 and one with a lowered current cost are protected by base cost', () => {
    const g = byOpponent(OTHER_SABO);
    // [Sabo] named Characters are excluded: another [Sabo] is not protected.
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(OTHER_SABO);
  });

  it('[Sabo] himself is not protected ("other than [Sabo]")', () => {
    const g = byOpponent(ID);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(ID);
  });

  it('must not apply to your own effect', () => {
    const g = mk({ characters: [ID, V.c7] });
    runMine(g, { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    pick(g, [g.find('p1', 'characters', V.c7)]);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(V.c7);
    expect(chars(g)).toContain(ID);
  });

  it('no Once Per Turn is printed: after declining, the next removal the same turn is offered again', () => {
    const g = mk(
      { characters: [ID, V.c7, V.c5], costArea: { active: 0, rested: 0 } },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', V.c7)]);
    decline(g);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toContain(V.c5);
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
