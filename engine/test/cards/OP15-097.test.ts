/** OP15-097 I Find It Embarrassing as a Human Being. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canAttack, donArea, fill, mine, OTHER_LEADER, trig } from './helpers-op15g3.ts';

const ID = 'OP15-097';

describe('OP15-097 I Find It Embarrassing as a Human Being', () => {
  describe('[Main]', () => {
    // The Event is trashed before its effect resolves, so it counts itself: 9 other cards make 10.
    const start = (trash: number, opp: string[]) =>
      mine(
        { leader: OTHER_LEADER, hand: [ID], trash: fill(trash, V.c1), ...donArea(1) },
        { characters: opp },
      );
    const oppCanAttack = (g: ReturnType<typeof start>, card: string) =>
      canAttack(g, g.find('p2', 'characters', card), g.leader('p1'));

    it("with 9 cards in the trash plus this Event (10), up to 1 opposing Character with base cost 5 or less cannot attack until the end of the opponent's next End Phase", () => {
      const g = start(9, [V.c5, V.c3]);
      play(g, ID);
      pick(g, [g.find('p2', 'characters', V.c5)]);
      g.act({ type: 'endTurn' });
      expect(oppCanAttack(g, V.c5)).toBe(false);
      expect(oppCanAttack(g, V.c3)).toBe(true);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      expect(oppCanAttack(g, V.c5)).toBe(true);
    });

    it('with 8 cards in the trash plus this Event (9) nothing is asked and nothing is restricted', () => {
      const g = start(8, [V.c5]);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      g.act({ type: 'endTurn' });
      expect(oppCanAttack(g, V.c5)).toBe(true);
    });

    it('the base cost bound is inclusive at 5: a base cost 6 Character is not a candidate', () => {
      const g = start(9, [V.c6, V.c5]);
      play(g, ID);
      expect(
        g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p2', 'characters', V.c6)),
      ).toBe(false);
      expect(
        g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p2', 'characters', V.c5)),
      ).toBe(true);
      none(g);
    });

    it('"up to 1": choosing none restricts nothing', () => {
      const g = start(9, [V.c5]);
      play(g, ID);
      none(g);
      g.act({ type: 'endTurn' });
      expect(oppCanAttack(g, V.c5)).toBe(true);
    });
  });

  describe('[Trigger]', () => {
    it('activates the [Main] effect: with 10 cards in the trash an attacker is locked (the Trigger card is in no area, so it does not count)', () => {
      const g = trig(ID, { leader: OTHER_LEADER, trash: fill(10, V.c1) }, [V.c5]);
      g.act({ type: 'trigger', activate: true });
      pick(g, [g.find('p2', 'characters', V.c5)]);
      expect(canAttack(g, g.find('p2', 'characters', V.c5), g.leader('p1'))).toBe(false);
    });

    it('with 9 cards in the trash the Trigger does nothing (the Trigger card is not in the trash while it resolves)', () => {
      const g = trig(ID, { leader: OTHER_LEADER, trash: fill(9, V.c1) }, [V.c5]);
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'main', 'p2');
      expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    });
  });
});
