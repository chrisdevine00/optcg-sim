/** OP15-095 Gum-Gum Storm. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, pick, play, V } from './helpers.ts';
import {
  counterStep,
  donArea,
  fill,
  mine,
  OTHER_LEADER,
  SHC_C4,
  SHC_LEADER,
  useCounter,
} from './helpers-op15g3.ts';

const ID = 'OP15-095';

describe('OP15-095 Gum-Gum Storm', () => {
  describe('[Main]', () => {
    // The Event is trashed before its effect resolves (CR 2-7-3, 8-4-2), so it counts itself: 14 other cards make 15.
    const start = (trash: number, leader = SHC_LEADER) =>
      mine({
        leader,
        hand: [ID],
        characters: [SHC_C4, V.c4],
        trash: fill(trash, V.c1),
        ...donArea(2),
      });

    it('rest 1 DON!!: with 14 cards in the trash plus this Event (15), a {Straw Hat Crew} Leader or Character gains +3000 this turn', () => {
      const g = start(14);
      play(g, ID);
      accept(g);
      expect(don(g, 'p1').rested).toBe(2);
      const usopp = g.find('p1', 'characters', SHC_C4);
      pick(g, [usopp]);
      expect(g.power(usopp)).toBe(9000);
      g.act({ type: 'endTurn' });
      expect(g.power(usopp)).toBe(6000);
    });

    it('the Leader is a legal target when it is {Straw Hat Crew}', () => {
      const g = start(14);
      play(g, ID);
      accept(g);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(8000);
    });

    it('a Character that is not {Straw Hat Crew} is not a candidate', () => {
      const g = start(14);
      play(g, ID);
      accept(g);
      const picks = g.legal().filter((a) => a.type === 'pick');
      expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).not.toContain(
        g.find('p1', 'characters', V.c4),
      );
    });

    it('with 13 cards in the trash plus this Event (14) the effect does nothing (the DON!! is still rested)', () => {
      const g = start(13);
      play(g, ID);
      accept(g);
      expectDecision(g, 'main', 'p1');
      expect(g.power(g.find('p1', 'characters', SHC_C4))).toBe(6000);
      expect(don(g, 'p1').rested).toBe(2);
    });

    it('the cost is optional: declining rests no DON!! and gives no power', () => {
      const g = start(14);
      play(g, ID);
      decline(g);
      expect(don(g, 'p1').rested).toBe(1);
      expect(g.power(g.find('p1', 'characters', SHC_C4))).toBe(6000);
    });

    it('a Leader of another type gives no {Straw Hat Crew} Leader target, but the Character is still one', () => {
      const g = start(14, OTHER_LEADER);
      play(g, ID);
      accept(g);
      const picks = g.legal().filter((a) => a.type === 'pick');
      expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).not.toContain(g.leader('p1'));
    });
  });

  describe('[Counter]', () => {
    it('with 14 cards in the trash plus this Event (15) a Leader or Character gains +4000 power during this battle (any type)', () => {
      const g = counterStep(
        { leader: OTHER_LEADER, hand: [ID], trash: fill(14, V.c1), ...donArea(1) },
        {},
      );
      expect(g.power(g.leader('p1'))).toBe(5000);
      useCounter(g, ID);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(9000);
    });

    it('with 13 cards in the trash plus this Event (14) the Counter adds nothing', () => {
      const g = counterStep(
        { leader: OTHER_LEADER, hand: [ID], trash: fill(13, V.c1), ...donArea(1) },
        {},
      );
      useCounter(g, ID);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });
});
