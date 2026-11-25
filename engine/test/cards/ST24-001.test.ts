/** ST24-001 Capone"Gang"Bege. Playing it (cost 2) rests 2 DON!! first, and those count as rested. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, mk, pick, play, PLAIN_BLUE, trash, V } from './helpers-lfc.ts';

const ID = 'ST24-001';
const rested = (card: string) => ({ card, rested: true });

describe('ST24-001 Capone"Gang"Bege', () => {
  it('is a [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] with 6 rested cards (4 rested DON!! plus the 2 rested to pay): draws 1 and trashes 1 card from hand', () => {
    const g = mk({ hand: [ID, V.c1], costArea: { active: 6, rested: 4 } });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(2);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('boundary: 5 rested cards do nothing, 6 do; the Leader, Characters and DON!! all count', () => {
    const field = {
      leader: { card: PLAIN_BLUE, rested: true },
      characters: [rested(V.c2), rested(V.c3)],
      hand: [ID, V.c1],
    };
    // Leader + 2 Characters = 3 rested, plus the 2 DON!! rested to play the card = 5.
    const five = game({ ...field, costArea: { active: 10, rested: 0 } }, { leader: PLAIN_BLUE });
    play(five, ID);
    expect(hand(five, 'p1')).toHaveLength(1);
    expect(trash(five, 'p1')).toEqual([]);
    // One more rested DON!!: 6.
    const six = game({ ...field, costArea: { active: 9, rested: 1 } }, { leader: PLAIN_BLUE });
    play(six, ID);
    expect(hand(six, 'p1')).toHaveLength(2);
  });

  it("must not count itself (played active) nor the opponent's rested cards", () => {
    const g = mk(
      { hand: [ID, V.c1], costArea: { active: 7, rested: 1 } }, // 1 + 2 paid = 3
      { characters: [rested(V.c2)], costArea: { active: 0, rested: 5 } },
    );
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('the card is drawn before the trash is chosen, so the drawn card may be the one trashed', () => {
    const g = mk({ hand: [ID], deck: [V.c4, V.c5, V.c6], costArea: { active: 6, rested: 4 } });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c4]);
  });
});
