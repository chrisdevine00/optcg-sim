/** OP15-117 Heso!!. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, hand, pick, play, V } from './helpers.ts';
import { mine, names, offers, OTHER_LEADER, SI_LEADER, SI_SETO, trig } from './helpers-op15g3.ts';

const ID = 'OP15-117';

describe('OP15-117 Heso!!', () => {
  describe('[Main]', () => {
    const start = (leader: string, characters: string[], active = 1, rested = 1) =>
      mine({
        leader,
        hand: [ID],
        characters,
        deck: [V.c4, V.c5],
        costArea: { active, rested },
      });
    const givenTo = (g: ReturnType<typeof start>, id: string) => g.card(id).don ?? 0;

    it('draws 1 card, then gives up to 1 rested DON!! to 1 of your {Sky Island} Characters', () => {
      const g = start(OTHER_LEADER, [SI_SETO, V.c1]);
      play(g, ID);
      expect(hand(g, 'p1')).toEqual([V.c4]);
      const seto = g.find('p1', 'characters', SI_SETO);
      // The only {Sky Island} card is Seto: the Leader and the other Character are not offered.
      expect(offers(g, g.find('p1', 'characters', V.c1))).toBe(false);
      expect(offers(g, g.leader('p1'))).toBe(false);
      pick(g, [seto]);
      expect(givenTo(g, seto)).toBe(1);
      expect(don(g, 'p1').rested).toBe(1); // 2 rested (one paid the Event), 1 given
    });

    it('a {Sky Island} Leader is a legal target', () => {
      const g = start(SI_LEADER, []);
      play(g, ID);
      expect(offers(g, g.leader('p1'))).toBe(true);
      pick(g, [g.leader('p1')]);
      expect(givenTo(g, g.leader('p1'))).toBe(1);
    });

    it('the DON!! rested to pay for this Event is itself a rested DON!! that may be given', () => {
      const g = start(SI_LEADER, [SI_SETO], 1, 0);
      play(g, ID);
      expect(don(g, 'p1').rested).toBe(1);
      pick(g, [g.leader('p1')]);
      expect(givenTo(g, g.leader('p1'))).toBe(1);
      expect(don(g, 'p1').rested).toBe(0);
    });

    it('up to 1 DON!!: only 1 is given even with several rested', () => {
      const g = start(SI_LEADER, [], 1, 3);
      play(g, ID);
      pick(g, [g.leader('p1')]);
      expect(givenTo(g, g.leader('p1'))).toBe(1);
      expect(don(g, 'p1').rested).toBe(3);
    });

    it('with no {Sky Island} Leader or Character only the draw happens', () => {
      const g = start(OTHER_LEADER, [V.c1]);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(hand(g, 'p1')).toEqual([V.c4]);
      expect(don(g, 'p1').rested).toBe(2); // the paid DON!! and the one that started rested
    });
  });

  describe('[Trigger]', () => {
    it('with a {Sky Island} Leader draws 2 cards', () => {
      const g = trig(ID, { leader: SI_LEADER, deck: [V.c4, V.c5, V.c6] });
      g.act({ type: 'trigger', activate: true });
      expect(hand(g, 'p1')).toEqual([V.c4, V.c5]);
    });

    it('with a Leader of another type draws nothing', () => {
      const g = trig(ID, { leader: OTHER_LEADER, deck: [V.c4, V.c5, V.c6] });
      g.act({ type: 'trigger', activate: true });
      expect(hand(g, 'p1')).toEqual([]);
      expect(names(g, 'p1', 'trash')).toEqual([ID]);
    });
  });
});
