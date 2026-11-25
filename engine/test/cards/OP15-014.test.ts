/** OP15-014 Bartolomeo (Character, cost 4, 6000). */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import {
  accept,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP15-014';
// {Dressrosa} Events: OP05-094 (cost 1), OP04-093 (cost 3), OP04-094 (cost 4); OP01-029 (cost 1) is
// not {Dressrosa}. Each gets a planted [Main] that draws 1.
const D1 = 'OP05-094';
const D3 = 'OP04-093';
const D4 = 'OP04-094';
const OTHER = 'OP01-029';
const draw1 = [{ do: { draw: 1 } }] as never;
const mainOf = (effect: unknown, cost?: unknown[]): Ability =>
  ({
    id: 'm',
    kind: 'activate',
    when: 'main',
    ...(cost ? { cost } : {}),
    effect,
  }) as unknown as Ability;

const mk = (me: object = {}, opp: object = {}, extra: object = {}) => {
  const g = game(
    {
      leader: PLAIN_BLUE,
      hand: [ID, D1, D3, D4, OTHER],
      costArea: { active: 5, rested: 0 },
      ...me,
    },
    { leader: PLAIN_PURPLE, characters: [V.c7], ...opp },
    extra,
  );
  for (const id of [D1, D3, D4, OTHER]) {
    try {
      g.state = withAbilities(g.state, id, [mainOf(draw1)]);
    } catch {
      // not in this game
    }
  }
  return g;
};
const cands = (g: ReturnType<typeof mk>): string[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
const playIt = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('OP15-014 Bartolomeo', () => {
  describe('[On Play] activate up to 1 {Dressrosa} Event with a base cost of 3 or less from your hand', () => {
    it('activates the chosen Event: trashed, its [Main] resolves, its printed cost is not paid', () => {
      const g = mk();
      playIt(g); // 4 DON!! for Bartolomeo; the Event's own cost is not paid
      expectDecision(g, 'choose', 'p1');
      expect(cands(g).sort()).toEqual([g.find('p1', 'hand', D1), g.find('p1', 'hand', D3)].sort());
      const before = hand(g, 'p1').length;
      pick(g, [g.find('p1', 'hand', D3)]);
      expect(trash(g, 'p1')).toEqual([D3]);
      expect(hand(g, 'p1').length).toBe(before); // left the hand, drew 1
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    });

    it('does not offer a {Dressrosa} Event with a base cost over 3 or an Event of another type', () => {
      const g = mk({ hand: [ID, D4, OTHER] });
      playIt(g);
      expectDecision(g, 'choose', 'p1');
      expect(cands(g)).toEqual([]);
      none(g);
      expect(trash(g, 'p1')).toEqual([]);
    });

    it('activates nothing when you choose none', () => {
      const g = mk();
      playIt(g);
      none(g);
      expect(trash(g, 'p1')).toEqual([]);
      expect(dec(g)?.kind).toBe('main');
    });

    it('pays the activation cost written on the Event, so an Event whose cost cannot be paid is not offered', () => {
      const g = mk({ costArea: { active: 4, rested: 0 } });
      g.state = withAbilities(g.state, D3, [mainOf(draw1, [{ restDon: 1 }])]);
      playIt(g); // all 4 active DON!! are rested for Bartolomeo
      expectDecision(g, 'choose', 'p1');
      expect(cands(g)).toEqual([g.find('p1', 'hand', D1)]); // D3 needs 1 more active DON!!
    });
  });

  describe("If this Character would be K.O.'d, you may trash 1 Event from your hand instead", () => {
    it('an effect K.O.: trash an Event and Bartolomeo stays', () => {
      const g = mk({ hand: [D1, V.c1], characters: [ID] });
      g.state = applyOp(g.state, {
        op: 'ko',
        card: g.find('p1', 'characters', ID),
        by: 'p2',
      }).state;
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', D1)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(trash(g, 'p1')).toEqual([D1]);
    });

    it('declining lets the K.O. happen', () => {
      const g = mk({ hand: [D1], characters: [ID] });
      g.state = applyOp(g.state, {
        op: 'ko',
        card: g.find('p1', 'characters', ID),
        by: 'p2',
      }).state;
      decline(g);
      expect(g.zone('p1', 'characters')).toEqual([]);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('a hand with no Event cannot pay it: asked anyway (the hand is secret) with accept unavailable', () => {
      const g = mk({ hand: [V.c1, V.c2], characters: [ID] });
      g.state = applyOp(g.state, {
        op: 'ko',
        card: g.find('p1', 'characters', ID),
        by: 'p2',
      }).state;
      expectDecision(g, 'optional', 'p1');
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
      expect(g.zone('p1', 'characters')).toEqual([]);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('battle K.O. is replaced too (no cause is named)', () => {
      const g = mk(
        { hand: [D1], characters: [{ card: ID, rested: true }] },
        { characters: [V.c7] },
        { activePlayer: 'p2', turn: 4 },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.find('p1', 'characters', ID),
      });
      passBlock(g);
      endCounter(g);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', D1)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    });
  });
});
