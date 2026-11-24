/** OP16-037 Mr.3(Galdino) (Green). */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { mine, mineOther } from './helpers-op16g2.ts';

const ID = 'OP16-037';

describe('OP16-037 Mr.3(Galdino)', () => {
  it("[On Play] with an {Impel Down} Leader: rests up to 1 of your opponent's Characters with a cost of 5 or less", () => {
    const g = mine({ hand: [ID] }, { characters: [V.c5, V.c6] });
    play(g, ID);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).toEqual([
      g.find('p2', 'characters', V.c5),
    ]); // cost 6 is not a candidate
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });

  it('"up to 1": may rest none', () => {
    const g = mine({ hand: [ID] }, { characters: [V.c5] });
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('without an {Impel Down} Leader nothing happens', () => {
    const g = mineOther({ hand: [ID] }, { characters: [V.c5] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('the Leader type is read as the effect resolves, not the Character type', () => {
    // Mr.3 itself is {Impel Down}, but the Leader here is not: still nothing.
    const g = mineOther({ hand: [ID], characters: [ID] }, { characters: [V.c1] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });
});
