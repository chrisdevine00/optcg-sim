/** ST33-002 Sakazuki (Character). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  hand,
  pick,
  PURPLE,
  takeDamage,
  trash,
  V,
} from './helpers.ts';
import {
  attackLeader,
  canAccept,
  finishBattle,
  koedInBattle,
  NAVY,
  NAVY_LEADER,
  offers,
} from './helpers-stg2.ts';

const ID = 'ST33-002';

describe('ST33-002 Sakazuki', () => {
  describe('[When Attacking]', () => {
    const start = (oppHand: number, mine: string[] = [BLUE]) =>
      attackLeader({ leader: NAVY_LEADER, characters: [ID], hand: mine }, ID, {
        hand: Array.from({ length: oppHand }, () => PURPLE),
      });

    it('trash 1: with 6 cards in the opponent hand, they trash 1 (their choice)', () => {
      const g = start(6);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expectDecision(g, 'choose', 'p2');
      pick(g, [g.zone('p2', 'hand')[0]!.instance]);
      expect(hand(g, 'p2')).toHaveLength(5);
      expect(trash(g, 'p2')).toEqual([PURPLE]);
      expect(trash(g, 'p1')).toEqual([BLUE]);
    });

    it('with 5 cards in the opponent hand the cost is paid and they trash nothing', () => {
      const g = start(5);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(trash(g, 'p1')).toEqual([BLUE]);
      expect(hand(g, 'p2')).toHaveLength(5);
      expect(trash(g, 'p2')).toEqual([]);
      expectDecision(g, 'block', 'p2');
    });

    it('declining the cost trashes nothing for either player', () => {
      const g = start(7);
      decline(g);
      expect(hand(g, 'p1')).toEqual([BLUE]);
      expect(hand(g, 'p2')).toHaveLength(7);
    });

    it('with an empty hand the cost cannot be paid', () => {
      const g = start(7, []);
      expect(canAccept(g)).toBe(false);
      decline(g);
      expect(hand(g, 'p2')).toHaveLength(7);
    });
  });

  describe('[On K.O.]', () => {
    const start = (cards: string[]) => koedInBattle(ID, { leader: NAVY_LEADER, hand: cards }, {});

    it('plays up to 1 {Navy} Character with cost 4 or less from hand', () => {
      const g = start([NAVY.fullbody, NAVY.sengoku, V.c2]);
      expect(new Set(offers(g))).toEqual(new Set([g.find('p1', 'hand', NAVY.fullbody)]));
      pick(g, [g.find('p1', 'hand', NAVY.fullbody)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([NAVY.fullbody]);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('cost 5 and non-Navy Characters cannot be played; nothing to play ends the effect', () => {
      const g = start([NAVY.sengoku, V.c2]);
      expect(g.zone('p1', 'characters')).toEqual([]);
      expect(hand(g, 'p1').sort()).toEqual([NAVY.sengoku, V.c2].sort());
    });

    it('"up to 1": may be declined', () => {
      const g = start([NAVY.doberman]);
      g.act({ type: 'done' });
      expect(g.zone('p1', 'characters')).toEqual([]);
      expect(hand(g, 'p1')).toEqual([NAVY.doberman]);
    });
  });

  it('finishing the attack is unaffected when the effect does nothing', () => {
    const g = attackLeader({ leader: NAVY_LEADER, characters: [ID] }, ID);
    expect(canAccept(g)).toBe(false);
    decline(g);
    finishBattle(g);
    takeDamage(g);
    expect(g.life('p2')).toBe(2);
  });
});
