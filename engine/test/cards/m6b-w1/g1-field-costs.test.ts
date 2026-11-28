/**
 * M6b wave 1, G1: costs that act on your own field Characters (PLAN §2a M6b-2; audit m6b-runtime-audit
 * §2 G1 and §5.1). A trash, return-to-hand, bottom-of-deck or K.O. cost goes through a `remove` or
 * `ko` frame with the cause `cost`. Planted on vanilla cards; each test fails with G1 reverted.
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import type { Cost } from '@optcg/cards';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE, pick, trash, V } from '../helpers.ts';
import { errorsOf, main, offered, run } from './probe.ts';

const drawOne = [{ do: { draw: 1 } }] as const;
const pickOne = { exactly: 1 } as const;
const notSelf = { not: { isSelf: true } } as const;

const trashCost: Cost = {
  trash: { from: 'characters', owner: 'you', filter: notSelf, pick: pickOne },
};
const koCost: Cost = { ko: { from: 'characters', owner: 'you', filter: notSelf, pick: pickOne } };

/** p1: probe BLUE and Blugori (with 1 DON!! given); the cost is on BLUE. */
function mk(cost: Cost[], chars: (string | { card: string; don?: number })[] = []) {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: [BLUE, { card: V.c1, don: 1 }, ...chars],
      costArea: { active: 2, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main([...drawOne], cost)]);
  return g;
}

const onKOdraw = (n: number): Ability => ({
  id: 'k',
  kind: 'auto',
  when: ['onKO'],
  effect: [{ do: { draw: n } }],
});

describe('G1 trash cost from your own Characters', () => {
  it('trashes the chosen Character with the cause `cost`, returns its given DON!!, is not a K.O.', () => {
    const g = mk([trashCost], [V.c2]);
    g.state = withAbilities(g.state, V.c1, [onKOdraw(2)]);
    run(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE, V.c2]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    // The effect after the colon resolved; the trash cost is not a K.O. (RL-15): no [On K.O.].
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.eventsOfType('KO')).toHaveLength(0);
    const moved = g
      .eventsOfType('CardMoved')
      .find((e) => e.card === V.c1 && e.from === 'characters');
    expect(moved).toBeDefined();
    expect((moved!.cause as { kind: string }).kind).toBe('cost');
    // Last-known information and the given DON!!: it was a Character with 1 DON!! given.
    expect((moved!.lki as { don: number }).don).toBe(1);
    expect(queries.don(g.state, 'p1')).toMatchObject({ given: 0, rested: 1 });
  });

  it('is not offered when no Character matches (CR 8-3-1-3)', () => {
    const g = mk([trashCost]);
    g.state = withAbilities(
      applyOp(g.state, { op: 'trashFromField', card: g.find('p1', 'characters', V.c1), by: 'p1' })
        .state,
      BLUE,
      [main([...drawOne], [trashCost])],
    );
    expect(offered(g)).toBe(false);
  });

  it('is not an opponent effect: a Character that cannot be removed by opponent effects can pay it', () => {
    const g = mk([trashCost]);
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeRemoved',
        target: g.find('p1', 'characters', V.c1),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    run(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});

describe('G1 move cost from your own Characters', () => {
  it('returns a Character to your hand; the paying card itself may be the one returned (OP09-030)', () => {
    const selfCost: Cost = {
      move: { from: 'characters', owner: 'you', filter: { isSelf: true }, pick: pickOne },
      to: { zone: 'hand' },
    };
    const g = mk([selfCost]);
    run(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c1]);
    // BLUE is back in the hand, and the effect resolved afterwards (one card drawn).
    expect(hand(g, 'p1')).toContain(BLUE);
    expect(hand(g, 'p1')).toHaveLength(2);
    const moved = g
      .eventsOfType('CardMoved')
      .find((e) => e.card === BLUE && e.from === 'characters');
    expect((moved!.cause as { kind: string }).kind).toBe('cost');
  });

  it('puts a Character at the bottom of your deck', () => {
    const bottom: Cost = {
      move: { from: 'characters', owner: 'you', filter: notSelf, pick: pickOne },
      to: { zone: 'deck', position: 'bottom' },
    };
    const g = mk([bottom]);
    const deckBefore = g.zone('p1', 'deck').length;
    run(g);
    const deck = g.zone('p1', 'deck');
    expect(deck).toHaveLength(deckBefore + 1 - 1); // one card was drawn by the effect
    expect(deck.at(-1)!.card).toBe(V.c1);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE]);
  });
});

describe('G1 K.O. cost', () => {
  it('K.O.s your own Character: a real K.O. with the cause `cost`, so its [On K.O.] fires (OP15-049 shape)', () => {
    const g = mk([koCost]);
    g.state = withAbilities(g.state, V.c1, [onKOdraw(2)]);
    run(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    const ko = g.eventsOfType('KO');
    expect(ko).toHaveLength(1);
    expect((ko[0]!.cause as { kind: string }).kind).toBe('cost');
    // 1 card for the effect and 2 for the [On K.O.].
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('a Character that cannot be K.O.d by effects cannot pay it: the effect does not resolve (RL-16)', () => {
    const g = mk([{ restDon: 1 }, koCost]);
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeKOd',
        scope: 'effect',
        target: g.find('p1', 'characters', V.c1),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p1',
      },
    }).state;
    run(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE, V.c1]);
    // The earlier cost stays paid, the draw after the colon does not happen.
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.eventsOfType('KOPrevented')).toHaveLength(1);
    expect(g.eventsOfType('EffectDeclined')).toHaveLength(1);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('protection in battle only does not stop a K.O. cost (it is an effect, RL-16)', () => {
    const g = mk([koCost]);
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeKOd',
        scope: 'battle',
        target: g.find('p1', 'characters', V.c1),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p1',
      },
    }).state;
    run(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});

describe('G1 validation', () => {
  const ab = (cost: unknown) => ({
    id: 'a',
    kind: 'activate',
    when: 'activateMain',
    cost: [cost],
    effect: [{ do: { draw: 1 } }],
  });

  it('accepts the field shapes it implements', () => {
    expect(errorsOf(ab(trashCost))).toEqual([]);
    expect(errorsOf(ab(koCost))).toEqual([]);
    expect(
      errorsOf(
        ab({
          move: { from: 'characters', owner: 'you', pick: pickOne },
          to: { zone: 'deck', position: 'top' },
        }),
      ),
    ).toEqual([]);
  });

  it('rejects what it does not: opponent cards, mixed zones, Life, several cards to a deck, K.O. on a Leader', () => {
    const bad = (cost: unknown) => expect(errorsOf(ab(cost)).length).toBeGreaterThan(0);
    bad({ trash: { from: 'characters', owner: 'opponent', pick: pickOne } });
    bad({ trash: { from: ['hand', 'characters'], owner: 'you', pick: pickOne } });
    bad({ trash: { from: 'leader', owner: 'you', pick: pickOne } });
    // A K.O. cost on your own Stage is allowed since OP-18 wave G2 (engine/test/cards/m6b-op18).
    bad({ ko: { from: 'leader', owner: 'you', pick: pickOne } });
    bad({ ko: { from: 'characters', owner: 'opponent', pick: pickOne } });
    bad({
      move: { from: 'characters', owner: 'you', pick: pickOne },
      to: { zone: 'life' },
    });
    bad({
      move: { from: 'characters', owner: 'you', pick: { exactly: 2 } },
      to: { zone: 'deck', position: 'bottom' },
    });
    bad({
      move: { from: 'characters', owner: 'you', pick: pickOne },
      to: { zone: 'deck', position: 'topOrBottom' },
    });
  });
});
