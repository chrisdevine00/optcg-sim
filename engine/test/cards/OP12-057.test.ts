/** OP12-057 Ice Block Pheasant Peck. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { counterGame, damageWith, NAVY_LEADER, offered } from './helpers-op12g2.ts';

const ID = 'OP12-057';

describe('OP12-057 Ice Block Pheasant Peck', () => {
  describe('[Counter] up to 1 Leader or Character +4000 during this battle, then trash 1 card from your hand', () => {
    const start = () =>
      counterGame(ID, { leader: NAVY_LEADER, hand: [ID, V.c1, V.c2], characters: [V.c3] });

    it('gives +4000 power during the battle to the chosen Leader, then trashes 1 card', () => {
      const g = start();
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(9000);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(trash(g, 'p1')).toEqual(expect.arrayContaining([ID, V.c1]));
      expect(trash(g, 'p1')).toHaveLength(2);
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('may boost a Character instead (Leader or Character cards are the candidates)', () => {
      const g = start();
      const cands = offered(g);
      expect(cands).toContain(g.leader('p1'));
      expect(cands).toContain(g.find('p1', 'characters', V.c3));
      expect(cands).toHaveLength(2);
      pick(g, [g.find('p1', 'characters', V.c3)]);
      expect(g.power(g.find('p1', 'characters', V.c3))).toBe(9000);
    });

    it('"Then" is not "If you do": choosing no target still trashes 1 card', () => {
      const g = start();
      none(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c2)]);
      expect(trash(g, 'p1')).toEqual(expect.arrayContaining([ID, V.c2]));
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });

    it('the boost lasts for the battle only', () => {
      const g = start();
      pick(g, [g.leader('p1')]);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      while (g.decider === 'p1' && g.legal().some((a) => a.type === 'endCounter')) {
        g.act({ type: 'endCounter' });
      }
      // The 7000 attack does not beat the 9000 Leader: no damage; then the boost is gone.
      expect(g.life('p1')).toBe(3);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('with an empty hand after the Counter, nothing is trashed', () => {
      const g = counterGame(ID, { leader: NAVY_LEADER, hand: [ID] });
      pick(g, [g.leader('p1')]);
      expect(dec(g)?.kind).not.toBe('choose');
      expect(trash(g, 'p1')).toEqual([ID]);
    });
  });

  describe('[Trigger] You may trash 1 card from your hand: draw 1 card', () => {
    it('trashes 1 card and draws 1', () => {
      const g = damageWith(ID, { hand: [V.c1, V.c2] });
      g.act({ type: 'trigger', activate: true });
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(trash(g, 'p1')).toEqual(expect.arrayContaining([ID, V.c1]));
      expect(hand(g, 'p1')).toHaveLength(2);
      expect(hand(g, 'p1')).toContain(V.c2);
    });

    it('declining the Trigger does nothing: the Event is simply added to the hand', () => {
      const g = damageWith(ID, { hand: [V.c1] });
      g.act({ type: 'trigger', activate: false });
      expect(trash(g, 'p1')).toEqual([]);
      expect(hand(g, 'p1').sort()).toEqual([ID, V.c1].sort());
      expect(g.zone('p1', 'deck')).toHaveLength(10);
    });

    it('with an empty hand the cost cannot be paid: the Trigger cannot be activated', () => {
      const g = damageWith(ID, { hand: [] });
      expect(g.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
      g.act({ type: 'trigger', activate: false });
      expect(hand(g, 'p1')).toEqual([ID]);
    });
  });
});
