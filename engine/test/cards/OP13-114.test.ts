/** OP13-114 S-Snake. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  none,
  pick,
  play,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { canAccept, mine, names, rep, skipOptional, trig } from './helpers-op13g4.ts';

const ID = 'OP13-114';

describe('OP13-114 S-Snake', () => {
  describe('[On Play]', () => {
    const run = (life: Parameters<typeof mine>[0]['life'] = rep(3, BLUE)) => {
      const g = mine({ leader: PLAIN_PURPLE, hand: [ID], life }, { characters: [V.c3, V.c1] }, 4);
      play(g, ID);
      return g;
    };

    it('turn 1 Life face-up: an opposing Character gets -2000 power this turn', () => {
      const g = run();
      accept(g);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      expect(g.life('p1')).toBe(3);
    });

    it('declining the Life cost does nothing', () => {
      const g = run();
      decline(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
      expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    });

    it('cannot be paid when the top Life card is already face-up (no prompt)', () => {
      const g = run([{ card: BLUE, faceUp: true }, BLUE]);
      expect(dec(g)?.kind).toBe('main');
    });

    it('"up to 1": may choose no target; the Life card is still turned', () => {
      const g = run();
      accept(g);
      none(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    });

    it('the -2000 can take a Character to 0 or below without K.O. (1000 -> -1000)', () => {
      const g = run();
      accept(g);
      pick(g, [g.find('p2', 'characters', V.c1)]);
      expect(g.power(g.find('p2', 'characters', V.c1))).toBe(1000);
      expect(names(g, 'p2', 'characters')).toContain(V.c1);
    });
  });

  it('[When Attacking] the same effect', () => {
    const g = mine(
      { leader: PLAIN_PURPLE, characters: [ID], life: rep(3, BLUE) },
      { characters: [V.c3] },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  describe('[Trigger]', () => {
    const fire = () => {
      const g = trig(ID, { leader: PLAIN_PURPLE, hand: [V.c1, V.c2], life: [ID, PURPLE, PURPLE] });
      skipOptional(g);
      g.act({ type: 'trigger', activate: true });
      return g;
    };

    it('trash 1 from hand: plays this card', () => {
      const g = fire();
      if (dec(g)?.kind === 'optional') accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(names(g, 'p1', 'characters')).toEqual([ID]);
      expect(names(g, 'p1', 'trash')).toEqual([V.c1]);
      expect(names(g, 'p1', 'hand')).toEqual([V.c2]);
    });

    it('choosing not to activate adds the card to the hand instead', () => {
      const g = trig(ID, { leader: PLAIN_PURPLE, hand: [V.c1, V.c2], life: [ID, PURPLE, PURPLE] });
      skipOptional(g);
      g.act({ type: 'trigger', activate: false });
      expect(names(g, 'p1', 'characters')).toEqual([]);
      expect(names(g, 'p1', 'hand')).toContain(ID);
    });

    it('with an empty hand the cost cannot be paid: activating is not offered', () => {
      const g = trig(ID, { leader: PLAIN_PURPLE, hand: [], life: [ID, PURPLE, PURPLE] });
      skipOptional(g);
      expect(g.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
      expect(canAccept(g)).toBe(false);
      void expectDecision;
    });
  });
});
