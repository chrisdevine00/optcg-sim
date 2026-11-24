/** OP14-083 Ms. Wednesday. */
import { describe, expect, it } from 'vitest';
import { none, pick, V } from './helpers.ts';
import {
  canActivate,
  canPick,
  game,
  idsOf,
  OTHER_LEADER,
  PLAIN_BLUE,
  plant,
} from './helpers-op14g3.ts';

const ID = 'OP14-083';

describe('OP14-083 Ms. Wednesday', () => {
  /** Opposing Characters V.c1 (cost 1) and V.c2 (cost 2), each reduced by 1 so V.c1 is a 0 cost Character. */
  const start = (reduce = true) => {
    const g = game(
      { leader: OTHER_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c2] },
    );
    if (reduce)
      plant(g, 'p1', {
        cost: {
          target: { from: 'characters', owner: 'opponent' },
          amount: -1,
          duration: 'thisTurn',
        },
      });
    return g;
  };
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });

  it("[Activate: Main] trash this Character: give up to 1 of your opponent's 0 cost Characters -3000 power", () => {
    const g = start();
    act(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // cost 1 now
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(0);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(4000);
  });

  it('a Character with a cost of 1 is out of range (exact 0)', () => {
    const g = start(false);
    act(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]); // the trash is a cost, paid anyway
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('"up to 1": the target may be left alone after the cost is paid', () => {
    const g = start();
    act(g);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('the -3000 ends with the turn', () => {
    const g = start();
    act(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('has no Once Per Turn and the cost (trashing itself) is always payable', () => {
    const g = start(false);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
  });
});
