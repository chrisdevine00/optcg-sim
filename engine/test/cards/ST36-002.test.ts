/** ST36-002 Killer. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, expectDecision, game, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { idsOf, KID_LEADER, SUPERNOVAS_LEADER, triggerGame } from './helpers-stg2.ts';

const ID = 'ST36-002';

describe('ST36-002 Killer', () => {
  describe('[Your Turn] [On Play]', () => {
    const start = (leader: string) =>
      game(
        { leader, hand: [ID], deck: [PURPLE, BLUE], costArea: { active: 4, rested: 0 } },
        { leader: PLAIN_BLUE },
      );

    it('with a {Kid Pirates} Leader: adds up to 1 card from the top of the deck to the top of Life', () => {
      const g = start(KID_LEADER);
      play(g, ID);
      accept(g);
      expect(g.zone('p1', 'life')).toHaveLength(4);
      expect(g.zone('p1', 'life')[0]!.card).toBe(PURPLE);
      expect(idsOf(g, 'p1', 'deck')).toEqual([BLUE]);
    });

    it('"up to 1": may be declined', () => {
      const g = start(KID_LEADER);
      play(g, ID);
      g.act({ type: 'optional', accept: false });
      expect(g.zone('p1', 'life')).toHaveLength(3);
    });

    it('with a Leader that is not {Kid Pirates} ({Supernovas} alone is not enough) nothing is added', () => {
      const g = start(SUPERNOVAS_LEADER);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(g.zone('p1', 'life')).toHaveLength(3);
      expect(idsOf(g, 'p1', 'deck')).toHaveLength(2);
    });
  });

  describe('[Trigger]', () => {
    it('if your opponent has 3 or less Life cards, play this card; on the opponent turn its On Play adds no Life', () => {
      const g = triggerGame(ID, { leader: KID_LEADER, deck: [PURPLE, BLUE] });
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'main', 'p2'); // [Your Turn]: no "add to Life" prompt on the opponent turn
      expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
      expect(g.zone('p1', 'life')).toHaveLength(1); // [Your Turn]: nothing added
      expect(idsOf(g, 'p1', 'deck')).toHaveLength(2);
      expect(g.zone('p1', 'hand')).toEqual([]);
    });

    it('with exactly 3 Life cards the opponent still qualifies', () => {
      const g = triggerGame(ID, { leader: KID_LEADER }, { life: [V.c1, V.c1, V.c1] });
      g.act({ type: 'trigger', activate: true });
      expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('with 4 Life cards the opponent does not: the card is not played', () => {
      const g = triggerGame(ID, { leader: KID_LEADER }, { life: [V.c1, V.c1, V.c1, V.c1] });
      g.act({ type: 'trigger', activate: true });
      expect(idsOf(g, 'p1', 'characters')).toEqual([]);
      expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
    });

    it('not activating the Trigger adds the card to hand', () => {
      const g = triggerGame(ID, { leader: KID_LEADER });
      g.act({ type: 'trigger', activate: false });
      expect(idsOf(g, 'p1', 'hand')).toEqual([ID]);
      expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    });
  });
});
