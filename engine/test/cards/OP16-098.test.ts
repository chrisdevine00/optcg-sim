/** OP16-098 Yamato (cost 6). */
import { describe, expect, it } from 'vitest';
import { game, hand, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { names, YAMATO_5, YAMATO_6, YAMATO_8 } from './helpers-op16g4.ts';

const ID = 'OP16-098';
const YAMATO_97 = 'OP16-097'; // black [Yamato], cost 8 ([On Play] only)

describe('OP16-098 Yamato', () => {
  it('[On Play] draws 1 and trashes 1 card from your hand', () => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        hand: [ID, V.c5],
        deck: [V.c1, V.c2],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([V.c5]);
  });

  describe('[Activate: Main]', () => {
    const start = (tr: string[]) =>
      game({ leader: PLAIN_BLUE, characters: [ID], trash: tr }, { leader: PLAIN_BLUE });
    const act = (g: ReturnType<typeof start>) =>
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'swap' });

    it('trash this Character: play a black [Yamato] with cost 8 from the trash', () => {
      const g = start([YAMATO_8, V.c1]);
      act(g);
      pick(g, [g.find('p1', 'trash', YAMATO_8)]);
      expect(names(g, 'p1', 'characters')).toEqual([YAMATO_8]);
      expect(names(g, 'p1', 'trash')).toContain(ID);
    });

    it('a second black cost 8 [Yamato] is just as valid (OP16-097)', () => {
      const g = start([YAMATO_97]);
      act(g);
      pick(g, [g.find('p1', 'trash', YAMATO_97)]);
      expect(names(g, 'p1', 'characters')).toEqual([YAMATO_97]);
    });

    it('must not play a cost 5 or cost 6 [Yamato] or a non-[Yamato]: the cost is still paid', () => {
      const g = start([YAMATO_5, V.c7]);
      act(g);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      expect(names(g, 'p1', 'characters')).toEqual([]);
      expect(names(g, 'p1', 'trash')).toContain(ID);
    });

    it('this card, once in the trash with cost 6, is not a legal target ("a cost of 8")', () => {
      const g = start([YAMATO_6]);
      act(g);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    });
  });
});
