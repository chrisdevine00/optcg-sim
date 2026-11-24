/** OP15-087 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { donArea, fill, mine, names, OTHER_LEADER } from './helpers-op15g3.ts';

const ID = 'OP15-087';

describe('OP15-087 Nico Robin', () => {
  const withTrash = (n: number) =>
    game({ leader: PLAIN_BLUE, characters: [ID], trash: fill(n, V.c1) }, { leader: PLAIN_BLUE });
  const blocker = (g: ReturnType<typeof withTrash>) =>
    g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');

  it('has [Blocker] with exactly 10 cards in the trash', () => {
    expect(blocker(withTrash(10))).toBe(true);
  });

  it('has no [Blocker] with 9 cards in the trash (the boundary)', () => {
    expect(blocker(withTrash(9))).toBe(false);
  });

  it("counts only your own trash: 10 cards in the opponent's trash give nothing", () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID], trash: fill(9, V.c1) },
      { leader: PLAIN_BLUE, trash: fill(10, V.c1) },
    );
    expect(blocker(g)).toBe(false);
  });

  it('[On Play] draws 2 cards and then trashes 2 cards from the hand (chosen by you)', () => {
    const g = mine({
      leader: OTHER_LEADER,
      hand: [ID, V.c2],
      deck: [V.c1, V.c3, V.c4],
      ...donArea(5),
    });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // The hand is [V.c2, V.c1, V.c3]: the drawn cards are candidates too.
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(names(g, 'p1', 'trash').sort()).toEqual([V.c1, V.c2].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });
});
