/** OP18-050 Mr.3 & Miss.Goldenweek. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play } from './helpers.ts';
import { BW_L, candidates, mine, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-050';
const C8 = 'EB02-004'; // cost 8
const start = (leader: string) => {
  const g = mine(
    { leader, hand: [ID], costArea: { active: 5, rested: 0 } },
    { characters: [V.c7, C8, V.c3] },
  );
  play(g, ID);
  return g;
};

describe('OP18-050 Mr.3 & Miss.Goldenweek', () => {
  it('has [Blocker]', () => {
    const g = start(BW_L);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] with a {Baroque Works} Leader: an opponent Character with a cost of 7 or less cannot attack', () => {
    const g = start(BW_L);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c7), g.find('p2', 'characters', V.c3)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.card(g.find('p2', 'characters', V.c7)).cannotAttack).toBe(true);
    expect(g.card(g.find('p2', 'characters', C8)).cannotAttack).toBeFalsy();
  });

  it("lasts through the opponent's next turn and ends at the end of it", () => {
    const g = start(BW_L);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c7)).cannotAttack).toBe(true);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c7)).cannotAttack).toBeFalsy();
  });

  it('without a {Baroque Works} Leader nothing happens', () => {
    const g = start(PLAIN_PURPLE);
    expect(g.card(g.find('p2', 'characters', V.c7)).cannotAttack).toBeFalsy();
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": may choose nothing', () => {
    const g = start(BW_L);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c7)).cannotAttack).toBeFalsy();
  });
});
