/** EB04-042 Alpha: [On Play] you may trash 3 cards from the top of your deck: give up to 1 of the opponent's Characters -1 cost during this turn. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mine, OTHER_LEADER } from './helpers-eb04g2.ts';

const ID = 'EB04-042';

const setup = (deck = [V.c1, V.c2, V.c3, V.c4, V.c5]) =>
  mine({ leader: OTHER_LEADER, hand: [ID], deck }, { characters: [V.c5, V.c1] });

describe('EB04-042 Alpha', () => {
  it('trash 3 from the top of the deck: an opposing Character gets -1 cost this turn', () => {
    const g = setup();
    play(g, ID);
    accept(g);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c3, V.c2, V.c1]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c4, V.c5]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(4);
  });

  it('the opposing Character is the only kind of target (your own are not offered)', () => {
    const g = mine(
      {
        leader: OTHER_LEADER,
        hand: [ID],
        deck: [V.c1, V.c2, V.c3, V.c4, V.c5],
        characters: [V.c4],
      },
      { characters: [V.c5] },
    );
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false);
    none(g);
  });

  it('"up to 1": the cost is paid and nothing is chosen', () => {
    const g = setup();
    play(g, ID);
    accept(g);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
    expect(ids(g, 'p1', 'trash')).toHaveLength(3);
  });

  it('the "you may" cost can be declined: the deck is untouched and no cost changes', () => {
    const g = setup();
    play(g, ID);
    decline(g);
    expect(ids(g, 'p1', 'deck')).toHaveLength(5);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('the cost change ends at the end of the turn', () => {
    const g = setup();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('with fewer than 3 cards in the deck the cost cannot be paid', () => {
    const g = setup([V.c1, V.c2]);
    play(g, ID);
    // The cost cannot be paid, so the effect is skipped without a prompt.
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'deck')).toHaveLength(2);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });
});
