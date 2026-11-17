/**
 * M4b wave 1: activation costs and replacement payloads the runtime did not have: lifeToHand,
 * turnLifeFaceUp, mill, rest (cards and DON!!), move (CR 8-3-1, 8-1-3-4; effect-dsl.md §4.5).
 * Planted on vanilla cards.
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import type { Cost } from '@optcg/cards';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  game,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';

const costed = (cost: Cost[]): Ability => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  cost,
  effect: [{ do: { draw: 1 } }],
});
const activate = (g: ReturnType<typeof game>) =>
  g.legal().some((a) => a.type === 'activate' && a.ability === 'a')
    ? g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' })
    : null;

describe('lifeToHand cost', () => {
  it('adds the top Life card to the hand without damage, so no [Trigger] decision (CR 10-1-5)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [V.c2, V.c3, V.c4] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [costed([{ lifeToHand: { from: 'top', n: 1 } }])]);
    activate(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p1')).toBe(2);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual(expect.arrayContaining([V.c2]));
    expect(g.zone('p1', 'hand')).toHaveLength(2);
  });

  it('is not payable with no Life cards: the ability is not offered (CR 8-3-1-3)', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE], life: [] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [costed([{ lifeToHand: { from: 'top', n: 1 } }])]);
    expect(activate(g)).toBeNull();
  });

  it('"top or bottom" asks which, and takes that card', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [V.c2, V.c3, V.c4] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      costed([{ lifeToHand: { from: 'topOrBottom', n: 1 } }]),
    ]);
    activate(g);
    option(g, 'bottom');
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(V.c4);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c2, V.c3]);
  });
});

describe('turnLifeFaceUp cost', () => {
  it('turns the top Life card face-up for both players, and is not payable when it already is', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [V.c2, V.c3] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [costed([{ turnLifeFaceUp: 1 }])]);
    expect(project(g.state, 'p2').zones.p1.life[0]!.card).toBeNull();
    activate(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(project(g.state, 'p2').zones.p1.life[0]!.card).toBe(V.c2);
    expect(project(g.state, 'p2').zones.p1.life[1]!.card).toBeNull();

    const up = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [{ card: V.c2, faceUp: true }, V.c3] },
      { leader: PLAIN_BLUE },
    );
    up.state = withAbilities(up.state, BLUE, [costed([{ turnLifeFaceUp: 1 }])]);
    expect(activate(up)).toBeNull();
  });
});

describe('mill cost', () => {
  it('trashes N cards from the top of the deck, and needs N cards in it', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], deck: [V.c1, V.c2, V.c3, V.c4] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [costed([{ mill: 3 }])]);
    activate(g);
    expect(
      g
        .zone('p1', 'trash')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2, V.c3].sort());
    const short = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], deck: [V.c1, V.c2] },
      { leader: PLAIN_BLUE },
    );
    short.state = withAbilities(short.state, BLUE, [costed([{ mill: 3 }])]);
    expect(activate(short)).toBeNull();
  });
});

describe('rest cost', () => {
  const restTwo = (from: string[]): Cost => ({
    rest: { from: from as never, owner: 'you', pick: { exactly: 2 } },
  });

  it('"rest 2 of your Characters": only active Characters count', () => {
    const mk = (rested: boolean) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1, { card: V.c2, rested }] },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, BLUE, [costed([restTwo(['characters'])])]);
      return g;
    };
    // BLUE itself may be one of the two: three active Characters, so the player chooses.
    const g = mk(false);
    activate(g);
    pick(g, [g.find('p1', 'characters', V.c1), g.find('p1', 'characters', V.c2)]);
    expect(g.zone('p1', 'characters').filter((c) => c.rested)).toHaveLength(2);
    // One active Character and one rested one: two cannot be rested.
    const one = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, { card: V.c2, rested: true }] },
      { leader: PLAIN_BLUE },
    );
    one.state = withAbilities(one.state, BLUE, [costed([restTwo(['characters'])])]);
    expect(activate(one)).toBeNull();
  });

  it('"rest 2 of your cards" can rest DON!! in the cost area together with a card (Laboon)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [costed([restTwo(['characters', 'donCostArea'])])]);
    activate(g);
    expectDecision(g, 'choose');
    // The card, then one DON!!.
    g.act({ type: 'pick', choice: g.find('p1', 'characters', BLUE) });
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    expect(g.zone('p1', 'characters')[0]!.rested).toBe(true);
    expect(g.state && project(g.state, 'p1').don.p1.rested).toBe(1);
    expect(project(g.state, 'p1').don.p1.active).toBe(2);
  });
});

describe('move cost and the replacements that pay with the new costs', () => {
  const protect = (cost: Cost[], optional = true): Ability => ({
    id: 'r',
    kind: 'replacement',
    replaces: { leaveField: { from: 'characters', owner: 'you' }, cause: 'opponentEffect' },
    optional,
    instead: cost,
  });
  const bounce: Ability = {
    id: 'b',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          move: {
            what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
            to: { zone: 'hand' },
          },
        },
      },
    ],
  };
  const setup = (trash: string[]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [PURPLE], trash },
      { leader: PLAIN_BLUE, characters: [BLUE] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, PURPLE, [
      protect([
        {
          move: { from: 'trash', owner: 'you', pick: { exactly: 3 } },
          to: { zone: 'deck', position: 'bottom' },
        },
      ]),
    ]);
    g.state = withAbilities(g.state, BLUE, [bounce]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', BLUE), ability: 'b' });
    pick(g, [g.find('p1', 'characters', PURPLE)]);
    return g;
  };

  it('"place 3 cards from your trash at the bottom of your deck instead" (OP17-095 shape)', () => {
    const g = setup([V.c1, V.c2, V.c3, V.c4]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c4]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-3)
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('declining lets the removal happen; too few cards in the trash makes it impossible (CR 8-1-3-4-5)', () => {
    const g = setup([V.c1, V.c2, V.c3, V.c4]);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(PURPLE);
    const few = setup([V.c1, V.c2]);
    expect(dec(few)?.kind).toBe('main');
    expect(few.zone('p1', 'characters')).toHaveLength(0);
  });

  it('"add 1 card from the top of your Life cards to your hand instead" for a K.O. (OP12-061 shape)', () => {
    const koWith = (life: number) => {
      const g = game(
        {
          leader: PLAIN_PURPLE,
          characters: [PURPLE],
          life: Array.from({ length: life }, () => V.c2),
        },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, PLAIN_PURPLE, [
        {
          id: 'shield',
          kind: 'replacement',
          oncePerTurn: true,
          replaces: { ko: { from: 'characters', owner: 'you', filter: { name: 'Gordon' } } },
          optional: true,
          instead: [{ lifeToHand: { from: 'top', n: 1 } }],
        },
      ]);
      return g;
    };
    const g = koWith(2);
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', PURPLE),
      by: 'p2',
    }).state;
    expectDecision(g, 'optional', 'p1');
    g.act({ type: 'optional', accept: true });
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.life('p1')).toBe(1);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    // Once Per Turn: the second K.O. goes through.
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', PURPLE),
      by: 'p2',
    }).state;
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    // No Life cards: not offered.
    const none = koWith(0);
    none.state = applyOp(none.state, {
      op: 'ko',
      card: none.find('p1', 'characters', PURPLE),
      by: 'p2',
    }).state;
    expect(none.zone('p1', 'characters')).toHaveLength(0);
  });
});
