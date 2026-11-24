/** OP11-028 Lord of the Coast. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk, trigGame } from './helpers-op11g1.ts';

const ID = 'OP11-028';
const rest = (card: string) => ({ card, rested: true });

describe('OP11-028 Lord of the Coast', () => {
  it("[On Play]: a rested opponent Character does not become active in the opponent's next Refresh Phase", () => {
    const g = mk({ hand: [ID] }, { characters: [rest(V.c1), rest(V.c2), V.c3] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // active: not eligible
    pick(g, [g.find('p2', 'characters', V.c1)]);
    g.act({ type: 'endTurn' }); // p2's turn: Refresh Phase
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' }); // p2's second turn: only the next Refresh was skipped
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('"up to 1": may choose nobody, and with no rested Character nothing is asked', () => {
    const g = mk({ hand: [ID] }, { characters: [rest(V.c1)] });
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    const h = mk({ hand: [ID] }, { characters: [V.c3] });
    play(h, ID);
    expect(dec(h)?.kind).toBe('main');
  });

  it('[Trigger]: K.O. a rested Character with cost 3 or less', () => {
    const g = trigGame(ID, {}, [rest(V.c3), rest(V.c4), V.c2, rest(V.c1)]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // active
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).not.toContain(V.c3);
  });

  it('[Trigger] "up to 1": may K.O. nobody', () => {
    const g = trigGame(ID, {}, [rest(V.c1)]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(ids(g, 'p2', 'characters')).toContain(V.c1);
  });
});
