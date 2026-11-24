/** OP11-083 Caribou. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { canBlockWith } from './helpers-op11g3.ts';

const ID = 'OP11-083';

describe('OP11-083 Caribou', () => {
  it('[On Play]: trash 2 cards from your hand (you choose)', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [ID, V.c1, V.c2, V.c3], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c3].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('with exactly 2 cards in hand both are trashed', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [ID, V.c1, V.c2], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it('with 1 card in hand that card is trashed (as many as possible)', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [ID, V.c1], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    while (g.legal().some((a) => a.type === 'pick'))
      g.act(g.legal().find((a) => a.type === 'pick')!);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('with an empty hand nothing is trashed', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('has [Blocker]', () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
