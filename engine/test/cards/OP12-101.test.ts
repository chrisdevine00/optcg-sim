/** OP12-101 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, trash } from './helpers.ts';
import {
  activate,
  damageWith,
  mine,
  OTHER_LEADER,
  offeredAb,
  SUPERNOVAS_LEADER,
} from './helpers-lfa.ts';

const ID = 'OP12-101';
const AB = 'boost';
const bonney = (g: ReturnType<typeof mine>) => g.find('p1', 'characters', ID);

describe('OP12-101 Jewelry Bonney', () => {
  describe("[Activate: Main] you may rest this Character: your {Supernovas} Leader gains +1000 power until the end of your opponent's next turn", () => {
    it('rests Bonney and raises a {Supernovas} Leader from 5000 to 6000', () => {
      const g = mine(SUPERNOVAS_LEADER, { characters: [ID] });
      activate(g, bonney(g), AB);
      expect(g.card(bonney(g)).rested).toBe(true);
      expect(g.power(g.leader('p1'))).toBe(6000);
    });

    it("lasts through the opponent's next turn and ends after it", () => {
      const g = mine(SUPERNOVAS_LEADER, { characters: [ID] });
      activate(g, bonney(g), AB);
      g.act({ type: 'endTurn' });
      expect(g.power(g.leader('p1'))).toBe(6000);
      g.act({ type: 'endTurn' });
      expectDecision(g, 'main', 'p1');
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('must not raise a Leader that is not {Supernovas}: Bonney is still rested as the cost', () => {
      const g = mine(OTHER_LEADER, { characters: [ID] });
      activate(g, bonney(g), AB);
      expect(g.card(bonney(g)).rested).toBe(true);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('is not offered while Bonney is rested', () => {
      const g = mine(SUPERNOVAS_LEADER, { characters: [{ card: ID, rested: true }] });
      expect(offeredAb(g, bonney(g), AB)).toBe(false);
    });

    it("it only raises your Leader, not a Character, and not the opponent's Leader", () => {
      const g = mine(SUPERNOVAS_LEADER, { characters: [ID] });
      activate(g, bonney(g), AB);
      expect(g.power(g.leader('p2'))).toBe(5000);
      expect(g.power(bonney(g))).toBe(1000);
    });
  });

  describe('[Trigger] if your Leader has the {Supernovas} type, play this card', () => {
    it('with a {Supernovas} Leader it is played', () => {
      const g = damageWith(ID, { leader: SUPERNOVAS_LEADER });
      g.act({ type: 'trigger', activate: true });
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('with another Leader the activated [Trigger] fails: the card goes to the trash, not played, not in hand', () => {
      const g = damageWith(ID, { leader: OTHER_LEADER });
      g.act({ type: 'trigger', activate: true });
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(hand(g, 'p1')).toEqual([]);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('not activating adds it to the hand', () => {
      const g = damageWith(ID, { leader: SUPERNOVAS_LEADER });
      g.act({ type: 'trigger', activate: false });
      expect(hand(g, 'p1')).toEqual([ID]);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });
  });
});
