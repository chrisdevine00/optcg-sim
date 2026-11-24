/** OP16-021 Moby Dick (Stage). */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { orderAll } from './helpers-hancock-rosi.ts';
import { ACE_LEADER, canActivate, idsIn, offers, RED_LEADER, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-021';

describe('OP16-021 Moby Dick', () => {
  describe('[On Play]', () => {
    const start = (leader: string) =>
      game(
        {
          leader,
          hand: [ID],
          deck: [V.c1, WB8, PURPLE, BLUE, BLUE],
          costArea: { active: 1, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );

    it('with a {Whitebeard Pirates} Leader: look at 3, add up to 1 to your hand, the rest to the bottom in any order', () => {
      const g = start(ACE_LEADER);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      // Any of the 3 cards looked at may be taken (no filter); the 4th card is not looked at.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
      pick(g, [g.find('p1', 'deck', WB8)]);
      orderAll(g);
      expect(hand(g, 'p1')).toEqual([WB8]);
      const deck = g.zone('p1', 'deck').map((c) => c.card);
      expect(deck.slice(0, 2)).toEqual([BLUE, BLUE]);
      expect(deck.slice(2).sort()).toEqual([V.c1, PURPLE].sort());
    });

    it('"up to 1": you may add nothing; all 3 go to the bottom', () => {
      const g = start(ACE_LEADER);
      play(g, ID);
      none(g);
      orderAll(g);
      expect(hand(g, 'p1')).toEqual([]);
      expect(g.zone('p1', 'deck')).toHaveLength(5);
    });

    it('with a Leader that is not {Whitebeard Pirates}: nothing happens', () => {
      const g = start(RED_LEADER);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(hand(g, 'p1')).toEqual([]);
      expect(g.zone('p1', 'deck')).toHaveLength(5);
    });
  });

  describe('[Activate: Main]', () => {
    const start = (rested: number, chars: Parameters<typeof game>[0]['characters'] = [V.c1]) =>
      game(
        { leader: ACE_LEADER, stage: ID, characters: chars, costArea: { active: 0, rested } },
        { leader: PLAIN_BLUE },
      );
    const activate = (g: ReturnType<typeof start>) =>
      g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'give-don' });

    it('you may trash this Stage: give up to 1 rested DON!! card to your Leader', () => {
      const g = start(2);
      activate(g);
      expect(offers(g, g.leader('p1'))).toBe(true);
      expect(offers(g, g.find('p1', 'characters', V.c1))).toBe(true);
      pick(g, [g.leader('p1')]);
      expect(g.card(g.leader('p1')).don).toBe(1);
      expect(idsIn(g, 'p1', 'stage')).toEqual([]);
      expect(idsIn(g, 'p1', 'trash')).toEqual([ID]);
    });

    it('or to 1 of your Characters', () => {
      const g = start(1);
      activate(g);
      pick(g, [g.find('p1', 'characters', V.c1)]);
      expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(1);
      expect(g.card(g.leader('p1')).don).toBe(0);
    });

    it('with no rested DON!! the Stage is still trashed (the cost) and nothing is given', () => {
      const g = start(0);
      activate(g);
      expect(idsIn(g, 'p1', 'stage')).toEqual([]);
      expect(g.card(g.leader('p1')).don).toBe(0);
      expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(0);
    });

    it('is available as an [Activate: Main] on the Stage', () => {
      const g = start(1);
      expect(canActivate(g, g.find('p1', 'stage', ID), 'give-don')).toBe(true);
    });
  });
});
