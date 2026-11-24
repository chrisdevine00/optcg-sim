/** EB05-012 Camie. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ID = 'EB05-012';

const start = (opp: Parameters<typeof game>[1]['characters']) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 3, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );

describe('EB05-012 Camie', () => {
  it("[On Play]: rests up to 1 of your opponent's Characters with a cost of 6 or less", () => {
    const g = start([V.c6, V.c2]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('cost 7 is not a candidate: only the cost 6 and cost 2 Characters can be picked', () => {
    const g = start([V.c7, V.c6, V.c2]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    expect(
      g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p2', 'characters', V.c7)),
    ).toBe(false);
    none(g);
  });

  it('"up to": it may rest nothing', () => {
    const g = start([V.c6]);
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });

  it('with no opponent Character of cost 6 or less nothing is asked', () => {
    const g = start([V.c7]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(false);
  });

  it("does not offer your own Characters or the opponent's Leader", () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], characters: [V.c1], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, ID);
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(choices).toEqual([g.find('p2', 'characters', V.c3)]);
  });
});
