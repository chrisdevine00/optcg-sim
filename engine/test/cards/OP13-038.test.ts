/** OP13-038 Gum-Gum Elephant Gun. */
import { describe, expect, it } from 'vitest';
import { don, none, pick, play } from './helpers.ts';
import { canPick, expectDecision, mk, settle, triggerGame, V } from './helpers-op13g2.ts';

const ID = 'OP13-038';

// The Event costs 2: with 2 active and 4 rested, 6 are rested after paying.
const start = (p2Chars = [V.c1, V.c5, V.c6]) =>
  mk({ hand: [ID], costArea: { active: 2, rested: 4 } }, { characters: p2Chars });

describe('OP13-038 Gum-Gum Elephant Gun', () => {
  it("[Main]: rests up to 1 of the opponent's Characters with a cost of 5 or less (boundary 5)", () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('then sets up to 2 DON!! as active at the end of this turn, not before', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
    g.act({ type: 'endTurn' });
    settle(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
  });

  it('"Then" is not "if you do": the DON!! are set active even when nothing was rested', () => {
    const g = start();
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    settle(g);
    expect(don(g, 'p1').active).toBe(2);
  });

  it('with no legal target nothing is asked and the DON!! still come back', () => {
    const g = start([V.c6]);
    play(g, ID);
    g.act({ type: 'endTurn' });
    settle(g);
    expect(don(g, 'p1').active).toBe(2);
  });

  it('[Trigger]: rests up to 1 opposing Character with a cost of 5 or less and sets no DON!!', () => {
    const g = triggerGame(ID, { costArea: { active: 0, rested: 3 } }, [V.c4, V.c6]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(don(g, 'p1').active).toBe(0);
  });
});
