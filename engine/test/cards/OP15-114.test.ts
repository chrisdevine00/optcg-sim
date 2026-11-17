/** OP15-114 Wyper: [On Play] turn a Life card face-up: -2000 to all opposing Characters, K.O. those at 0 or less; [Activate: Main] give a rested DON!!. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { HOLLY, ids, KAL, WEAK } from './helpers-kalgara.ts';

describe('OP15-114 Wyper', () => {
  describe('[On Play]', () => {
    const position = (life = [V.c2, V.c3, V.c4]) =>
      game(
        { leader: KAL, hand: ['OP15-114'], life, costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [WEAK, V.c1, V.c5] },
      );

    it('turns the top Life card face-up, gives -2000 to every opposing Character and K.O.s those at 0 or less', () => {
      const g = position();
      play(g, 'OP15-114');
      accept(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      expect(g.life('p1')).toBe(3);
      expect(ids(g.zone('p2', 'characters')).sort()).toEqual([V.c1, V.c5].sort());
      expect(g.power(g.find('p2', 'characters', V.c1))).toBe(1000);
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(5000);
      expect(ids(g.zone('p2', 'trash'))).toEqual([WEAK]);
    });

    it('the -2000 lasts the turn and then ends', () => {
      const g = position();
      play(g, 'OP15-114');
      accept(g);
      g.act({ type: 'endTurn' });
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    });

    it('declining the Life cost does nothing', () => {
      const g = position();
      play(g, 'OP15-114');
      decline(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
      expect(g.zone('p2', 'characters')).toHaveLength(3);
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    });

    it('cannot be paid when the top Life card is already face-up', () => {
      const g = game(
        {
          leader: KAL,
          hand: ['OP15-114'],
          life: [{ card: V.c2, faceUp: true }, V.c3],
          costArea: { active: 5, rested: 0 },
        },
        { leader: PLAIN_BLUE, characters: [WEAK] },
      );
      play(g, 'OP15-114');
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.zone('p2', 'characters')).toHaveLength(1);
    });

    it('does not touch your own Characters', () => {
      const g = game(
        {
          leader: KAL,
          hand: ['OP15-114'],
          characters: [WEAK],
          life: [V.c2],
          costArea: { active: 5, rested: 0 },
        },
        { leader: PLAIN_BLUE, characters: [V.c1] },
      );
      play(g, 'OP15-114');
      accept(g);
      expect(g.power(g.find('p1', 'characters', WEAK))).toBe(2000);
    });
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const position = () =>
      game(
        {
          leader: KAL,
          characters: ['OP15-114', HOLLY, V.c1],
          costArea: { active: 0, rested: 2 },
        },
        { leader: PLAIN_BLUE },
      );

    it('gives 1 rested DON!! to a {Sky Island} Leader or Character of your choice', () => {
      const g = position();
      g.act({
        type: 'activate',
        card: g.find('p1', 'characters', 'OP15-114'),
        ability: 'give-don',
      });
      expectDecision(g, 'choose', 'p1');
      // Leader, Wyper and Holly are {Sky Island}; the purple vanilla is not.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
      pick(g, [g.find('p1', 'characters', HOLLY)]);
      expect(g.card(g.find('p1', 'characters', HOLLY)).don).toBe(1);
    });

    it('is once per turn', () => {
      const g = position();
      g.act({
        type: 'activate',
        card: g.find('p1', 'characters', 'OP15-114'),
        ability: 'give-don',
      });
      pick(g, [g.leader('p1')]);
      expect(g.card(g.leader('p1')).don).toBe(1);
      expect(
        g.isLegal({
          type: 'activate',
          card: g.find('p1', 'characters', 'OP15-114'),
          ability: 'give-don',
          player: 'p1',
        }),
      ).toBe(false);
    });

    it('gives nothing when no DON!! card is rested', () => {
      const g = game(
        { leader: KAL, characters: ['OP15-114'], costArea: { active: 2, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      g.act({
        type: 'activate',
        card: g.find('p1', 'characters', 'OP15-114'),
        ability: 'give-don',
      });
      expect(g.card(g.leader('p1')).don).toBe(0);
    });
  });
});
