/** EB03-018 Tashigi. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  passBlock,
  payDon,
  pick,
  trash,
  V,
} from './helpers.ts';
import { canAcceptNow, koBy, mine, OTHER_LEADER, plant, theirs } from './helpers-lfa.ts';

const ID = 'EB03-018';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };
const tashigi = (g: ReturnType<typeof mine>) => g.find('p1', 'characters', ID);
const chars = (g: ReturnType<typeof mine>) => g.zone('p1', 'characters').map((c) => c.card);

describe('EB03-018 Tashigi', () => {
  describe("[Opponent's Turn] cannot be K.O.'d by your opponent's effects and gains [Blocker]", () => {
    it("on the opponent's turn an effect of the opponent cannot K.O. her", () => {
      const g = theirs(OTHER_LEADER, { characters: [ID] });
      koBy(g, 'p1', ID, 'p2');
      expect(chars(g)).toEqual([ID]);
    });

    it("on the opponent's turn she has [Blocker] and can block an attack on the Leader", () => {
      const g = theirs(OTHER_LEADER, { characters: [ID] }, { characters: [V.c7] });
      expect(g.card(tashigi(g)).keywords).toContain('Blocker');
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.leader('p1'),
      });
      expect(g.legal().some((a) => a.type === 'block' && a.blocker === tashigi(g))).toBe(true);
    });

    it('must not protect or block on your own turn: an opposing effect K.O.s her and she has no [Blocker]', () => {
      const g = mine(OTHER_LEADER, { characters: [ID] });
      expect(g.card(tashigi(g)).keywords).not.toContain('Blocker');
      koBy(g, 'p1', ID, 'p2');
      expect(chars(g)).toEqual([]);
    });

    it("must not stop your own effect or a battle K.O. on the opponent's turn", () => {
      const own = theirs(OTHER_LEADER, { characters: [ID] });
      koBy(own, 'p1', ID, 'p1');
      expect(chars(own)).toEqual([]);
      const battle = theirs(
        OTHER_LEADER,
        { characters: [{ card: ID, rested: true }] },
        { characters: [V.c7] },
      );
      battle.act({
        type: 'attack',
        attacker: battle.find('p2', 'characters', V.c7),
        target: battle.find('p1', 'characters', ID),
      });
      passBlock(battle);
      battle.act({ type: 'endCounter' });
      expect(chars(battle)).toEqual([]);
    });
  });

  describe('[End of Your Turn] you may rest 1 DON!! and trash 1 card from your hand: set this Character as active', () => {
    const start = (p1 = {}, active = 2) =>
      mine(
        OTHER_LEADER,
        { characters: [{ card: ID, rested: true }], hand: [V.c1, V.c2], ...p1 },
        {},
        active,
        0,
      );

    it('paying both costs sets her active', () => {
      const g = start();
      g.act({ type: 'endTurn' });
      expectDecision(g, 'optional', 'p1');
      accept(g);
      payDon(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(g.card(tashigi(g)).rested).toBe(false);
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('declining leaves her rested and keeps the hand and DON!!', () => {
      const g = start();
      g.act({ type: 'endTurn' });
      decline(g);
      expect(g.card(tashigi(g)).rested).toBe(true);
      expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    });

    it('with no active DON!! the cost cannot be paid', () => {
      const g = start({}, 0);
      g.act({ type: 'endTurn' });
      expectDecision(g, 'optional', 'p1');
      expect(canAcceptNow(g)).toBe(false);
      expect(g.card(tashigi(g)).rested).toBe(true);
    });

    it('with an empty hand the cost cannot be paid', () => {
      const g = start({ hand: [] });
      g.act({ type: 'endTurn' });
      expectDecision(g, 'optional', 'p1');
      expect(canAcceptNow(g)).toBe(false);
      expect(g.card(tashigi(g)).rested).toBe(true);
    });

    it("must not fire at the end of the opponent's turn", () => {
      const g = theirs(OTHER_LEADER, { characters: [{ card: ID, rested: true }], hand: [V.c1] });
      g.act({ type: 'endTurn' });
      expect(dec(g)?.kind).not.toBe('optional');
      expect(trash(g, 'p1')).toEqual([]);
    });
  });

  it('a real K.O. effect of the opponent (an activated ability) is stopped too', () => {
    const g = theirs(OTHER_LEADER, { characters: [ID] });
    plant(g, 'p2', koOne);
    expect(chars(g)).toEqual([ID]);
  });
});
