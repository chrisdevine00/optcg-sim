/** OP10-023 Issho. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, mk, NAVY_L, PLAIN_LEADER, rested } from './helpers-a10g1.ts';

const ID = 'OP10-023';
const p2 = (...cards: string[]) => ({ characters: cards });

describe('OP10-023 Issho', () => {
  it('[On Play]: with a {Navy} Leader, rests up to 2 opponent Characters with a cost of 5 or less', () => {
    const g = mk({ leader: NAVY_L, hand: [ID] }, p2(V.c5, V.c3, V.c1));
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5), g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('boundary: cost 5 can be rested, cost 6 cannot', () => {
    const g = mk({ leader: NAVY_L, hand: [ID] }, p2(V.c5, V.c6));
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('"up to 2": 1 or none may be chosen', () => {
    const g = mk({ leader: NAVY_L, hand: [ID] }, p2(V.c5, V.c3));
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    const h = mk({ leader: NAVY_L, hand: [ID] }, p2(V.c5));
    play(h, ID);
    none(h);
    expect(h.card(h.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('must not rest anything without a {Navy} Leader', () => {
    const g = mk({ leader: PLAIN_LEADER, hand: [ID] }, p2(V.c5));
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('an already rested Character is not a useful target but the effect still resolves on the others', () => {
    const g = mk({ leader: NAVY_L, hand: [ID] }, { characters: [rested(V.c5), V.c3] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });
});
