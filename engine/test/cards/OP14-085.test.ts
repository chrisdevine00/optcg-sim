/** OP14-085 Miss.Goldenweek(Marianne). */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { game, koedInBattle, OTHER_LEADER, PLAIN_BLUE, plantOn } from './helpers-op14g3.ts';

const ID = 'OP14-085';

describe('OP14-085 Miss.Goldenweek(Marianne)', () => {
  const ko = (hnd: string[], deck = [V.c4, V.c5, V.c6]) =>
    koedInBattle(ID, { leader: OTHER_LEADER, hand: hnd, deck });

  it('[On K.O.] draw 2 cards and trash 2 cards from your hand', () => {
    const g = ko([V.c1]);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c4, V.c5].sort());
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c5)]);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c1, V.c5].sort());
  });

  it('the drawn cards can be trashed', () => {
    const g = ko([V.c1]);
    pick(g, [g.find('p1', 'hand', V.c4), g.find('p1', 'hand', V.c5)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('the trash is mandatory and exactly 2 (no "done" before 2 are picked)', () => {
    const g = ko([V.c1]);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    g.act({ type: 'pick', choice: g.find('p1', 'hand', V.c1) });
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('with an empty hand it draws 2 and trashes both', () => {
    const g = ko([]);
    // Exactly 2 cards in hand and exactly 2 to trash: still picked by the player, any order.
    pick(g, [g.find('p1', 'hand', V.c4), g.find('p1', 'hand', V.c5)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toContain(V.c4);
  });

  it('is an [On K.O.] only: returned to your hand by an effect it draws nothing', () => {
    const g = game(
      { leader: OTHER_LEADER, characters: [ID, V.c1], deck: [V.c4, V.c5, V.c6] },
      { leader: PLAIN_BLUE },
    );
    plantOn(g, g.find('p1', 'characters', V.c1), [
      {
        do: {
          move: {
            what: {
              from: 'characters',
              owner: 'you',
              filter: { name: 'Miss.Goldenweek(Marianne)' },
            },
            to: { zone: 'hand' },
          },
        },
      },
    ]);
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(dec(g)?.kind).toBe('main');
  });
});
