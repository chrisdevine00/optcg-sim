/** OP14-082 Oinkchuck. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, pick, V } from './helpers.ts';
import {
  canPick,
  game,
  idsOf,
  koedInBattle,
  koNow,
  OTHER_LEADER,
  PLAIN_BLUE,
  TBP4,
  TBP8,
  trig,
} from './helpers-op14g3.ts';

const ID = 'OP14-082';
/** OP06-087 Cerberus (cost 2, {Thriller Bark Pirates}, [Blocker]) and OP06-085 Kumacy (cost 2). */
const TBP2 = 'OP06-087';
const TBP2B = 'OP06-089';

describe('OP14-082 Oinkchuck', () => {
  describe('[On K.O.] all of your {Thriller Bark Pirates} Characters gain +4 cost', () => {
    const ko = () =>
      koedInBattle(
        ID,
        { leader: OTHER_LEADER, characters: [TBP4, V.c1] },
        { characters: [TBP2] }, // an opposing {Thriller Bark Pirates} Character is not yours
      );

    it('your {Thriller Bark Pirates} Characters get +4 cost; others and the opponent’s do not', () => {
      const g = ko();
      expect(g.card(g.find('p1', 'characters', TBP4)).cost).toBe(8);
      expect(g.card(g.find('p1', 'characters', V.c1)).cost).toBe(1);
      expect(g.card(g.find('p2', 'characters', TBP2)).cost).toBe(2);
    });

    it("K.O.'d on the opponent's turn: it lasts to the end of that turn (their next End Phase)", () => {
      const g = ko();
      expect(g.card(g.find('p1', 'characters', TBP4)).cost).toBe(8);
      while (dec(g)?.kind !== 'main') g.act({ type: 'endCounter' });
      expect(g.card(g.find('p1', 'characters', TBP4)).cost).toBe(8);
      g.act({ type: 'endTurn' });
      expect(g.card(g.find('p1', 'characters', TBP4)).cost).toBe(4);
    });

    it("K.O.'d on your own turn: it lasts through the opponent's next turn and ends at its End Phase", () => {
      const g = game(
        { leader: OTHER_LEADER, characters: [ID, TBP4] },
        { leader: PLAIN_BLUE, characters: [V.c1] },
      );
      koNow(g, 'p1', ID, 'p2');
      expect(g.card(g.find('p1', 'characters', TBP4)).cost).toBe(8);
      g.act({ type: 'endTurn' });
      expect(g.card(g.find('p1', 'characters', TBP4)).cost).toBe(8);
      g.act({ type: 'endTurn' });
      expect(g.card(g.find('p1', 'characters', TBP4)).cost).toBe(4);
    });

    it('with no other {Thriller Bark Pirates} Character nothing is asked', () => {
      const g = koedInBattle(ID, { leader: OTHER_LEADER, characters: [V.c1] });
      expect(dec(g)?.kind).not.toBe('choose');
      expect(g.card(g.find('p1', 'characters', V.c1)).cost).toBe(1);
    });
  });

  describe('[Trigger] play up to 1 {Thriller Bark Pirates} Character with a cost of 2 or less from your trash rested', () => {
    const start = (trash: string[]) => {
      const g = trig(ID, { leader: OTHER_LEADER, trash });
      expectDecision(g, 'trigger', 'p1');
      g.act({ type: 'trigger', activate: true });
      return g;
    };

    it('plays it rested', () => {
      const g = start([TBP2, TBP4, V.c1]);
      expect(canPick(g, g.find('p1', 'trash', TBP4))).toBe(false);
      expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false);
      pick(g, [g.find('p1', 'trash', TBP2)]);
      const played = g.find('p1', 'characters', TBP2);
      expect(g.card(played).rested).toBe(true);
      expect(idsOf(g, 'p1', 'trash')).toContain(TBP4);
    });

    it('cost 2 is the boundary: cost 4 and cost 8 are out; "up to 1" may play nothing', () => {
      const g = start([TBP4, TBP8]);
      expect(dec(g)?.kind).not.toBe('choose'); // no candidate: nothing is asked
      expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    });

    it('only one card is played', () => {
      const g = start([TBP2, TBP2B]);
      pick(g, [g.find('p1', 'trash', TBP2)]);
      expect(idsOf(g, 'p1', 'characters')).toEqual([TBP2]);
    });
  });
});
