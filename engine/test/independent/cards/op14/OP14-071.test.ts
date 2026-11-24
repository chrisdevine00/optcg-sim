/**
 * OP14-071 Pica (Character, Purple, cost 5, 6000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[End of Your Turn] If your Leader has the {Donquixote Pirates} type, add up to 1 DON!!
 * card from your DON!! deck and set it as active."
 *
 * Rules: [End of Your Turn] fires once at my End Phase only (CR 6-6-1-1, RL-09), "add up to N DON!!"
 * asks a count, the "If" is checked when the effect resolves.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  addDon,
  asksCount,
  backToMain,
  countOptions,
  donOf14,
  endTurn,
  kind,
  LD14,
  mine,
  need,
  onField,
  SC14,
  settleOrders,
} from './kit-op14c.ts';

const ID = 'OP14-071';

/** p1 (Main Phase, 6 active DON!!, DON!! deck 4) with Pica(s) and the given Leader. */
function game(o: { leader?: string; pica?: number; active?: number } = {}) {
  return mine(
    o.leader ?? LD14.dp,
    {
      characters: Array.from({ length: o.pica ?? 1 }, () => ID),
      costArea: { active: o.active ?? 6, rested: 0 },
    },
    { characters: [SC14.c3] },
  );
}

describe('OP14-071 Pica [End of Your Turn] add 1 active DON!!', () => {
  it('at the end of my turn I am asked how many DON!! to add (up to 1): 1 or none', () => {
    const g = game();
    endTurn(g);
    need(g, 'choose', 'p1');
    expect(countOptions(g).sort()).toEqual(['0', '1']);
  });

  it('adding 1: the DON!! comes from the DON!! deck and is ACTIVE', () => {
    const g = game();
    endTurn(g);
    addDon(g, 1);
    need(g, 'main', 'p2');
    expect(donOf14(g)).toMatchObject({ active: 7, rested: 0, deck: 3 });
  });

  it('"up to": adding none adds nothing', () => {
    const g = game();
    endTurn(g);
    addDon(g, 0);
    need(g, 'main', 'p2');
    expect(donOf14(g)).toMatchObject({ active: 6, deck: 4 });
  });

  it('the Leader must have {Donquixote Pirates}: with another Leader nothing is asked or added', () => {
    const g = game({ leader: LD14.plain });
    endTurn(g);
    need(g, 'main', 'p2');
    expect(onField(g)).toBe(6);
  });

  it('with an empty DON!! deck nothing can be added', () => {
    const g = game({ active: 10 });
    endTurn(g);
    if (asksCount(g)) addDon(g, 0);
    need(g, 'main', 'p2');
    expect(onField(g)).toBe(10);
    expect(donOf14(g).deck).toBe(0);
  });

  it('only MY End Phase: it does not fire at the end of the opponent’s turn', () => {
    const g = game();
    endTurn(g);
    addDon(g, 1);
    need(g, 'main', 'p2');
    const before = onField(g);
    endTurn(g);
    // p1's turn 5: Refresh and DON!! Phase happen; no End Phase effect prompt is owed at p2's end.
    need(g, 'main', 'p1');
    // Turn 5 DON!! Phase adds 2 (deck 3 -> 1); Pica added nothing at p2's End Phase.
    expect(onField(g)).toBe(before + 2);
  });

  it('two Picas: each fires once, so up to 2 DON!! are added in total', () => {
    const g = game({ pica: 2 });
    endTurn(g);
    for (let i = 0; i < 4 && kind(g) !== 'main'; i++) {
      if (kind(g) === 'order') settleOrders(g, 'p1');
      else if (asksCount(g)) addDon(g, 1);
      else act(g, { type: 'done' });
    }
    need(g, 'main', 'p2');
    expect(donOf14(g)).toMatchObject({ active: 8, deck: 2 });
  });

  it('a Pica that is rested still fires (no condition on its state)', () => {
    const g = mine(
      LD14.dp,
      { characters: [{ card: ID, rested: true }], costArea: { active: 6, rested: 0 } },
      {},
    );
    endTurn(g);
    addDon(g, 1);
    need(g, 'main', 'p2');
    expect(donOf14(g).active).toBe(7);
  });

  it('a Pica in hand does not fire', () => {
    const g = mine(LD14.dp, { hand: [ID], costArea: { active: 6, rested: 0 } }, {});
    endTurn(g);
    need(g, 'main', 'p2');
    expect(onField(g)).toBe(6);
    backToMain(g, 'p2');
  });
});
