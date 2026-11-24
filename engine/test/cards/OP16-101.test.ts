/** OP16-101 Mahoroba. */
import { describe, expect, it } from 'vitest';
import { game, hand, none, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { names, YAMATO_5 } from './helpers-op16g4.ts';
import { damageWith } from './triggers.ts';

const ID = 'OP16-101';

const start = (trashCards: string[], opp: string[] = [V.c2, V.c3]) =>
  game(
    {
      leader: PLAIN_BLUE,
      hand: [ID],
      characters: [V.c1],
      trash: trashCards,
      costArea: { active: 2, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: opp },
  );
const fill = (n: number) => Array.from({ length: n }, () => V.c1);

describe('OP16-101 Mahoroba', () => {
  describe('[Main]', () => {
    it('up to 1 of your Leader or Characters gains +3000 power during this turn', () => {
      const g = start([]);
      play(g, ID);
      pick(g, [g.find('p1', 'characters', V.c1)]);
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(6000);
      g.act({ type: 'endTurn' });
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
    });

    it('Then, with 10 or more cards in your trash (the Event included), K.O. a cost 2 or less Character', () => {
      const g = start(fill(9));
      play(g, ID);
      pick(g, [g.leader('p1')]);
      // Only the cost 2 Character is a candidate (the cost 3 one is not).
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
      pick(g, [g.find('p2', 'characters', V.c2)]);
      expect(names(g, 'p2', 'characters')).toEqual([V.c3]);
      expect(g.power(g.leader('p1'))).toBe(8000);
    });

    it('must not K.O. with 9 cards in the trash (8 plus the Event)', () => {
      const g = start(fill(8));
      play(g, ID);
      pick(g, [g.leader('p1')]);
      expect(names(g, 'p2', 'characters')).toEqual([V.c2, V.c3]);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    });

    it('"up to 1": the power step and the K.O. may each be skipped, and the K.O. does not depend on the power', () => {
      const g = start(fill(9));
      play(g, ID);
      none(g);
      pick(g, [g.find('p2', 'characters', V.c2)]);
      expect(names(g, 'p2', 'characters')).toEqual([V.c3]);
      expect(trash(g, 'p1')).toHaveLength(10);
    });
  });

  describe('[Trigger]', () => {
    it('adds up to 1 [Yamato] from your trash to your hand', () => {
      const g = damageWith(ID, { leader: PLAIN_BLUE, trash: [YAMATO_5, V.c1] });
      g.act({ type: 'trigger', activate: true });
      pick(g, [g.find('p1', 'trash', YAMATO_5)]);
      expect(hand(g, 'p1')).toEqual([YAMATO_5]);
    });

    it('with no [Yamato] in the trash nothing can be added', () => {
      const g = damageWith(ID, { leader: PLAIN_BLUE, trash: [V.c1] });
      g.act({ type: 'trigger', activate: true });
      expect(hand(g, 'p1')).toEqual([]);
    });
  });
});
