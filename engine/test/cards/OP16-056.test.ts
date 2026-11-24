/** OP16-056 Mr.3(Galdino) (Blue, cost 4). */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, none, pick, V } from './helpers.ts';
import { COST10, COST8 } from './helpers-luffyace.ts';
import { mine } from './helpers-op16g2.ts';

const ID = 'OP16-056';

describe('OP16-056 Mr.3(Galdino)', () => {
  const start = (opp: string[]) =>
    mine({ characters: [ID], deck: Array(6).fill(BLUE) }, { characters: opp });
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });
  const canAttack = (g: ReturnType<typeof start>, card: string) =>
    g.isLegal({
      type: 'attack',
      attacker: g.find('p2', 'characters', card),
      target: g.leader('p1'),
      player: 'p2',
    });

  it("[Activate: Main] trash this Character: draw 2; up to 1 of your opponent's Characters with a cost of 9 or less cannot attack until the end of your opponent's next End Phase", () => {
    const g = start([COST8, V.c3]);
    act(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    pick(g, [g.find('p2', 'characters', COST8)]);
    expect(g.card(g.find('p2', 'characters', COST8)).cannotAttack).toBe(true);
    g.act({ type: 'endTurn' });
    expect(canAttack(g, COST8)).toBe(false);
    expect(canAttack(g, V.c3)).toBe(true);
  });

  it("the restriction ends with the opponent's End Phase", () => {
    const g = start([COST8]);
    act(g);
    pick(g, [g.find('p2', 'characters', COST8)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', COST8)).cannotAttack).toBeFalsy();
  });

  it('a Character with a cost of 10 is not a candidate', () => {
    const g = start([COST10]);
    act(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('"up to 1": may choose none; the draw happens anyway', () => {
    const g = start([V.c3]);
    act(g);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.card(g.find('p2', 'characters', V.c3)).cannotAttack).toBeFalsy();
  });
});
