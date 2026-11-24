/** OP11-063 Little Sadi. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, none, pick, play, payDon, V } from './helpers.ts';
import { canPick, cardsOf, IMPEL_LEADER, mk, RED_LEADER } from './helpers-op11g2.ts';

const ID = 'OP11-063';
const start = (leader: string, p2: string[] = [V.c3, V.c4]) =>
  mk({ leader, hand: [ID], costArea: { active: 5, rested: 0 } }, { characters: p2 });
const restedOf = (g: ReturnType<typeof mk>, c: string) =>
  g.card(g.find('p2', 'characters', c)).rested;

describe('OP11-063 Little Sadi', () => {
  it('[On Play] DON!! -1 with an {Impel Down} Leader: rests up to 1 opposing Character with cost 3 or less', () => {
    const g = start(IMPEL_LEADER);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(restedOf(g, V.c3)).toBe(true);
    expect(restedOf(g, V.c4)).toBe(false);
    // 5 DON!! in the cost area: 2 spent on Sadi, then 1 returned to the DON!! deck.
    expect(don(g, 'p1')).toMatchObject({ deck: 6 });
  });

  it('with a Leader that is not {Impel Down}: the DON!! -1 is still paid but nothing is rested', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 6 });
    expect(restedOf(g, V.c3)).toBe(false);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });

  it('declining the optional DON!! -1: no DON!! returned and nothing rested', () => {
    const g = start(IMPEL_LEADER);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 5 });
    expect(restedOf(g, V.c3)).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start(IMPEL_LEADER);
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(restedOf(g, V.c3)).toBe(false);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });

  it("the opponent's Characters only: your own Characters are not offered", () => {
    const g = mk(
      { leader: IMPEL_LEADER, hand: [ID], characters: [V.c1], costArea: { active: 5, rested: 0 } },
      { characters: [V.c2] },
    );
    play(g, ID);
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
  });
});
