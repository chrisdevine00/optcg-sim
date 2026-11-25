/** ST22-012 Marco. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { dec, endCounter, hand, passBlock, pick, trash } from './helpers.ts';
import { deckOf, mk, V, WB4, FORMER3 } from './helpers-lfb.ts';

const ID = 'ST22-012';

describe('ST22-012 Marco', () => {
  describe('replacement', () => {
    /** p2 owns Marco; p1's effects and attacks hit it. */
    const start = (p2Hand: string[] = [V.c1, V.c2]) =>
      mk(
        { characters: [V.c7] },
        { characters: [{ card: ID, rested: true }], hand: p2Hand as never },
      );
    type G = ReturnType<typeof start>;
    const marco = (g: G) => g.find('p2', 'characters', ID);
    const asked = (g: G) => dec(g)?.kind === 'optional' && dec(g)?.purpose === 'replacement';
    const alive = (g: G) => g.zone('p2', 'characters').some((c) => c.card === ID);
    const koEffect = (g: G, by: 'p1' | 'p2' = 'p1') =>
      (g.state = applyOp(g.state, { op: 'ko', card: marco(g), by }).state);

    it("K.O.'d by the opponent's effect: you may trash 1 card from your hand instead", () => {
      const g = start();
      koEffect(g);
      expect(asked(g)).toBe(true);
      g.act({ type: 'optional', accept: true });
      pick(g, [g.find('p2', 'hand', V.c1)]);
      expect(alive(g)).toBe(true);
      expect(trash(g, 'p2')).toEqual([V.c1]);
      expect(hand(g, 'p2')).toEqual([V.c2]);
    });

    it("declining lets it be K.O.'d and costs nothing", () => {
      const g = start();
      koEffect(g);
      g.act({ type: 'optional', accept: false });
      expect(alive(g)).toBe(false);
      expect(hand(g, 'p2')).toHaveLength(2);
    });

    it('is Once Per Turn: a second K.O. the same turn is not replaced', () => {
      const g = start();
      koEffect(g);
      g.act({ type: 'optional', accept: true });
      pick(g, [g.find('p2', 'hand', V.c1)]);
      koEffect(g);
      expect(asked(g)).toBe(false);
      expect(alive(g)).toBe(false);
    });

    it('must not fire: your own effect, a K.O. in battle, or an empty hand', () => {
      const own = start();
      koEffect(own, 'p2');
      expect(asked(own)).toBe(false);
      expect(alive(own)).toBe(false);

      const battle = start();
      battle.act({
        type: 'attack',
        attacker: battle.find('p1', 'characters', V.c7),
        target: marco(battle),
      });
      passBlock(battle);
      endCounter(battle);
      expect(asked(battle)).toBe(false);
      expect(alive(battle)).toBe(false);

      const empty = start([]);
      koEffect(empty);
      if (asked(empty)) {
        expect(empty.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        empty.act({ type: 'optional', accept: false });
      }
      expect(alive(empty)).toBe(false);
    });
  });

  describe('[When Attacking]', () => {
    const start = (top: string) =>
      mk({ characters: [ID], deck: [top, V.c1, V.c2] as never }, { leader: 'ST03-001' });

    it("a revealed {Whitebeard Pirates} card: this Character gains +1000 power until the end of your opponent's next turn", () => {
      const g = start(WB4);
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: WB4 });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
      passBlock(g);
      endCounter(g);
      // Not a battle-only bonus: it outlasts the battle.
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
      expect(deckOf(g, 'p1')[0]).toBe(WB4);
    });

    it('a type that includes "Whitebeard Pirates" counts (Former Whitebeard Pirates)', () => {
      const g = start(FORMER3);
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    });

    it('must not fire: another type is only revealed, no bonus', () => {
      const g = start(V.c4);
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: V.c4 });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    });
  });
});
