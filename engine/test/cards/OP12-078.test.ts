/** OP12-078 Brochette Blow. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play } from './helpers.ts';
import { mk, V } from './helpers-op12g3.ts';

const ID = 'OP12-078';

/** p1 holds the Event with `mine` active DON!!; p2 has `theirs` DON!! and a cost-4 Character. */
const start = (mine: number, theirs: number) =>
  mk(
    { hand: [ID], costArea: { active: mine, rested: 0 } },
    { costArea: { active: theirs, rested: 0 }, characters: [V.c4] },
  );

describe('OP12-078 Brochette Blow', () => {
  it("[Main] with DON!! equal to the opponent's: draws 1, then gives up to 1 Character -3000 power", () => {
    const g = start(5, 5);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
  });

  it('fewer DON!! than the opponent also qualifies', () => {
    const g = start(4, 9);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
  });

  it('boundary: one more DON!! than the opponent: nothing draws and, "Then" being inside the guard, no power change', () => {
    const g = start(6, 5);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it("the Event's own rested DON!! still count as on the field (5 vs 5 after paying 3)", () => {
    const g = start(5, 5);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('"up to 1": may choose no Character (the card is still drawn); the Leader is not a target; lasts this turn', () => {
    const g = start(5, 5);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    const h = start(5, 5);
    play(h, ID);
    pick(h, [h.find('p2', 'characters', V.c4)]);
    h.act({ type: 'endTurn' });
    expect(h.power(h.find('p2', 'characters', V.c4))).toBe(6000);
  });
});
