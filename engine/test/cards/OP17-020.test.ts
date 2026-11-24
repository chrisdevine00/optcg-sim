/** OP17-020 Shanks (Leader). */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, option, PLAIN_BLUE, pick, trash, V } from './helpers.ts';

const SHANKS = 'OP17-020';
const rested = (card: string) => ({ card, rested: true });

describe('OP17-020 Shanks', () => {
  const start = (p1: { hand?: string[]; active?: number } = {}) =>
    game(
      {
        leader: SHANKS,
        hand: p1.hand ?? [V.c1],
        costArea: { active: p1.active ?? 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [rested(V.c5), V.c3] },
    );
  const use = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'hold' });
  const skipped = (g: ReturnType<typeof start>, card: string) => {
    g.act({ type: 'endTurn' }); // p2's Refresh Phase
    return g.card(g.find('p2', 'characters', card)).rested;
  };

  it('pay with a DON!!: the opponent rested Character stays rested through their Refresh Phase', () => {
    const g = start();
    use(g);
    expectDecision(g, 'choose', 'p1');
    option(g, '1'); // rest 1 DON!!
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(skipped(g, V.c5)).toBe(true);
  });

  it('pay by trashing a card from hand instead', () => {
    const g = start();
    use(g);
    option(g, '0');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1').active).toBe(1);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(skipped(g, V.c5)).toBe(true);
  });

  it('only one alternative payable: no choice is asked (no DON!!, only the hand)', () => {
    const g = start({ active: 0 });
    use(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('only rested Characters can be chosen: the active one is not a candidate', () => {
    const g = start();
    use(g);
    option(g, '1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
  });

  it('[Once Per Turn]: a second activation is not offered; with nothing to pay it is not offered at all', () => {
    const g = start({ hand: [V.c1, V.c2], active: 2 });
    use(g);
    option(g, '1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
    const none = start({ hand: [], active: 0 });
    expect(none.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});
