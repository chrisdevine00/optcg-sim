/** OP14-059 Please Take Me with You!! I Can Be of Great Help to You!!. */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, none, pick, play, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { canPick, FM_LEADER, fill, JINBE_LEADER, mine } from './helpers-op14g2.ts';

const ID = 'OP14-059';

const start = (leader: string, handCards: string[]) =>
  mine(leader, { hand: [ID, ...handCards], costArea: { active: 3, rested: 0 } });

describe('OP14-059 Please Take Me with You!! I Can Be of Great Help to You!!', () => {
  it('[Main]: with [Jinbe] as Leader and 2 cards in hand, draws 2', () => {
    const g = start(JINBE_LEADER, fill(2, BLUE));
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('[Main]: with 3 cards in hand (after the Event is played) it does nothing', () => {
    const g = start(JINBE_LEADER, fill(3, BLUE));
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('[Main]: with an empty hand, draws 2', () => {
    const g = start(JINBE_LEADER, []);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('[Main]: without [Jinbe] as Leader it does nothing', () => {
    const g = start(FM_LEADER, []);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  describe('[Trigger]', () => {
    const hit = () =>
      damageGame(ID, { leader: FM_LEADER, characters: [V.c4, V.c5] }, { characters: [V.c3] });

    it('returns up to 1 Character with cost 4 or less to its owner’s hand (either side)', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(true); // cost 4: boundary in
      expect(canPick(g, g.find('p1', 'characters', V.c5))).toBe(false); // cost 5: out
      expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(cardsOf(g, 'p2', 'hand')).toContain(V.c3);
    });

    it('"up to 1": may return nothing', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      none(g);
      expect(cardsOf(g, 'p1', 'characters')).toHaveLength(2);
    });
  });
});
