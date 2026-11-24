/** EB05-008 Luffy, Now's Your Chance. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { counterStep, SHC, SHC_LEADER, useCounter } from './helpers-luffyace.ts';

const ID = 'EB05-008';
/** Red Events (Fiery Doll, Cross Fire) and a blue Event. */
const RED_EVENTS = ['OP03-019', 'OP03-017'] as const;
const OTHER_EVENT = 'OP03-054';

describe("EB05-008 Luffy, Now's Your Chance", () => {
  describe('[Main]', () => {
    const start = (hand: string[], opp: Parameters<typeof game>[1]['characters']) =>
      game(
        { leader: SHC_LEADER, hand: [ID, ...hand], costArea: { active: 3, rested: 0 } },
        { leader: PLAIN_BLUE, characters: opp },
      );

    it("you may give 1 active DON!! to your Leader and reveal 2 red Events: give up to 1 of your opponent's rested Characters -7000 power during this turn", () => {
      const g = start([...RED_EVENTS], [{ card: V.c7, rested: true }, V.c6]);
      play(g, ID);
      accept(g);
      // Cost: give the DON!! to the Leader (the only candidate), reveal both red Events.
      while (g.legal().some((a) => a.type === 'pick')) {
        const d = g.legal().find((a) => a.type === 'pick')!;
        g.act(d);
        if (g.eventsOfType('CardRevealed').length >= 2) break;
      }
      expect(g.card(g.leader('p1')).don).toBe(1);
      expect(don(g, 'p1').active).toBe(1); // 3 - 1 to play - 1 given
      const target = g.find('p2', 'characters', V.c7, 0);
      // The active Character is not a candidate: only the rested one.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
      pick(g, [target]);
      expect(g.power(target)).toBe(2000);
      expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
      expect(hand(g, 'p1')).toEqual(expect.arrayContaining([...RED_EVENTS]));
      g.act({ type: 'endTurn' });
      expect(g.power(target)).toBe(9000);
    });

    it('declining the optional cost gives no DON!!, reveals nothing and applies no power', () => {
      const g = start([...RED_EVENTS], [{ card: V.c7, rested: true }]);
      play(g, ID);
      decline(g);
      expect(g.card(g.leader('p1')).don).toBe(0);
      expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    });

    it('cannot be paid with only 1 red Event, or with a non-red Event instead', () => {
      const g = start([RED_EVENTS[0], OTHER_EVENT], [{ card: V.c7, rested: true }]);
      play(g, ID);
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
      expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    });

    it('cannot be paid with no active DON!! left after playing the card', () => {
      const g = game(
        { leader: SHC_LEADER, hand: [ID, ...RED_EVENTS], costArea: { active: 1, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [{ card: V.c7, rested: true }] },
      );
      play(g, ID);
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
      expectDecision(g, 'main', 'p1');
    });

    it('with no rested opposing Character the cost may be paid and nothing is lowered', () => {
      const g = start([...RED_EVENTS], [V.c6]);
      play(g, ID);
      accept(g);
      while (g.legal().some((a) => a.type === 'pick'))
        g.act(g.legal().find((a) => a.type === 'pick')!);
      expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
    });
  });

  describe('[Counter]', () => {
    it('with no Characters of cost 5 or more: your Leader gains +4000 power during this battle', () => {
      const g = counterStep(
        {
          leader: SHC_LEADER,
          hand: [ID],
          characters: [SHC.franky4],
          costArea: { active: 1, rested: 0 },
        },
        {},
        V.c6,
      );
      useCounter(g, ID);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(9000);
      endCounter(g);
      expect(g.life('p1')).toBe(3); // 9000 beats the 8000 attacker
    });

    it('may give the +4000 to one of your Characters instead', () => {
      const g = counterStep(
        {
          leader: SHC_LEADER,
          hand: [ID],
          characters: [SHC.franky4],
          costArea: { active: 1, rested: 0 },
        },
        {},
        V.c6,
      );
      useCounter(g, ID);
      const franky = g.find('p1', 'characters', SHC.franky4);
      pick(g, [franky]);
      expect(g.power(franky)).toBe(10000);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('with a Character of cost 5 or more the Counter does nothing', () => {
      const g = counterStep(
        {
          leader: SHC_LEADER,
          hand: [ID],
          characters: [SHC.nami5],
          costArea: { active: 1, rested: 0 },
        },
        {},
        V.c6,
      );
      useCounter(g, ID);
      if (g.legal().some((a) => a.type === 'pick')) none(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.power(g.find('p1', 'characters', SHC.nami5))).toBe(7000);
    });
  });
});
