/** OP15-116 Gum-Gum Golden Rifle. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  PURPLE,
  V,
  accept,
  decline,
  endCounter,
  expectDecision,
  hand,
  pick,
  play,
  trash,
} from './helpers.ts';
import { mk } from './helpers-w4sa.ts';

const ID = 'OP15-116';
const SHC_LEADER = 'ST01-001'; // {Straw Hat Crew}, 5000 power
const OTHER_LEADER = 'ST03-001';

describe('OP15-116 Gum-Gum Golden Rifle', () => {
  const start = (leader = SHC_LEADER, life: string[] = [PURPLE, PURPLE, PURPLE]) =>
    mk({ leader, hand: [ID, V.c1, V.c2], life: life as never, deck: [V.c3, BLUE, BLUE, BLUE] });

  describe('[Main]', () => {
    it('trashes the top Life card, adds the deck top to Life, then trashes a card from hand', () => {
      const g = start();
      play(g, ID);
      // The Life card trashed is the top one; no [Trigger] is offered (it is not damage).
      expect(g.zone('p1', 'life')).toHaveLength(2);
      expect(trash(g, 'p1')).toContain(PURPLE);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(g.zone('p1', 'life')).toHaveLength(3);
      expect(g.zone('p1', 'deck')).toHaveLength(3);
      // The deck top (V.c3) is now the top Life card: the Life area holds it face down.
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(hand(g, 'p1')).toEqual([V.c2]);
      expect(trash(g, 'p1')).toContain(V.c1);
    });

    it('"up to 1": declining the add leaves Life at 2, and the hand card is still trashed', () => {
      const g = start();
      play(g, ID);
      decline(g);
      expect(g.zone('p1', 'life')).toHaveLength(2);
      expect(g.zone('p1', 'deck')).toHaveLength(4);
      pick(g, [g.find('p1', 'hand', V.c2)]);
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });

    it('with a Leader that is not {Straw Hat Crew} nothing happens at all (the Then is inside the guard)', () => {
      const g = start(OTHER_LEADER);
      play(g, ID);
      expect(g.zone('p1', 'life')).toHaveLength(3);
      expect(g.zone('p1', 'deck')).toHaveLength(4);
      expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('with no Life cards the trash does nothing, but the add and the hand trash still happen', () => {
      const g = start(SHC_LEADER, []);
      play(g, ID);
      accept(g);
      expect(g.zone('p1', 'life')).toHaveLength(1);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('a [Trigger] on the trashed Life card is not offered (not damage)', () => {
      // ST01-015 (an Event with a [Trigger]) is the top Life card: it is trashed, never offered.
      const g = start(SHC_LEADER, ['ST01-015', PURPLE, PURPLE]);
      play(g, ID);
      expect(g.zone('p1', 'life')).toHaveLength(2);
      expect(trash(g, 'p1')).toContain('ST01-015');
      expectDecision(g, 'optional', 'p1');
    });
  });

  describe('[Counter] your Leader gains +4000 during this battle', () => {
    it('lets the Leader hold off a 9000-power attacker (5000 + 4000), and no more', () => {
      const g = mk({ leader: SHC_LEADER, hand: [ID] }, { characters: [V.c7] });
      g.act({ type: 'endTurn' });
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.leader('p1'),
      });
      g.act({ type: 'block', blocker: null });
      g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
      expect(g.power(g.leader('p1'))).toBe(9000);
      endCounter(g);
      expect(g.zone('p1', 'life')).toHaveLength(3);
    });
  });
});
