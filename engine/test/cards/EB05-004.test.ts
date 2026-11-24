/** EB05-004 Baby 5. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { battle } from './helpers-hancock-rosi.ts';
import { EVENTS } from './helpers-luffyace.ts';

const ID = 'EB05-004';

describe('EB05-004 Baby 5', () => {
  describe('[On Play] You may reveal 2 Event cards from your hand: draw 2 cards', () => {
    const start = (extra: string[]) =>
      game(
        { leader: PLAIN_PURPLE, hand: [ID, ...extra], costArea: { active: 4, rested: 0 } },
        { leader: PLAIN_BLUE },
      );

    it('reveals 2 Events (they stay in hand) and draws 2', () => {
      const g = start([...EVENTS, V.c1]);
      play(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
      const revealed = g.eventsOfType('CardRevealed').map((e) => e.card);
      expect(revealed).toEqual(expect.arrayContaining([EVENTS[0], EVENTS[1]]));
      // Hand: 2 Events + c1 + 2 drawn.
      expect(hand(g, 'p1')).toHaveLength(5);
      expect(hand(g, 'p1')).toEqual(expect.arrayContaining([EVENTS[0], EVENTS[1]]));
    });

    it('declining draws nothing', () => {
      const g = start([...EVENTS]);
      play(g, ID);
      decline(g);
      expect(hand(g, 'p1')).toHaveLength(2);
    });

    it('cannot be paid with only 1 Event in hand', () => {
      const g = start([EVENTS[0], V.c1]);
      play(g, ID);
      // The cost cannot be paid: the ability is not offered.
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      expect(hand(g, 'p1')).toHaveLength(2);
    });
  });

  describe('[On K.O.] Play up to 1 Character card with 6000 power or less from your hand rested', () => {
    const koed = (handCards: string[]) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }], hand: handCards },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', ID));
      return g;
    };

    it('plays a Character of 6000 power or less from your hand, rested', () => {
      const g = koed([V.c4, V.c5]);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c4)]);
      const c = g.find('p1', 'characters', V.c4);
      expect(g.card(c).rested).toBe(true);
      expect(hand(g, 'p1')).toEqual([V.c5]);
    });

    it('a 7000 power Character is not a candidate', () => {
      const g = koed([V.c5]);
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(hand(g, 'p1')).toEqual([V.c5]);
    });

    it('"up to": may play nothing', () => {
      const g = koed([V.c4]);
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(hand(g, 'p1')).toEqual([V.c4]);
    });
  });
});
