/**
 * M6b OP-18 wave, gaps G3 to G6 (docs/research/m6b-audit/OP-18.md), planted on vanilla cards:
 * - G3: a hand card to the top or bottom of your Life, face-up (OP18-099 to OP18-101);
 * - G4: "all of your Life cards" as a cost, to the hand or the trash (OP18-020, OP18-117);
 * - G5: a permanent reduction of the cost of playing cards from your hand (OP18-097);
 * - G6: activate the [Trigger] of a revealed card in your hand (OP18-105).
 * Each fails with its gap reverted (the validator rejects the shape, or the runtime ignores it).
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { game, hand, option, pick, PLAIN_BLUE, PLAIN_PURPLE, trash, V } from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const act = (effect: unknown, cost?: unknown): Ability =>
  ({
    id: 'p',
    kind: 'activate',
    when: 'activateMain',
    ...(cost ? { cost } : {}),
    effect,
  }) as unknown as Ability;
const run = (g: ReturnType<typeof game>, ab: Ability) => {
  expectValid([ab]);
  g.state = withAbilities(g.state, PLAIN_PURPLE, [ab]);
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'p' });
};
const lifeCards = (g: ReturnType<typeof game>) => g.zone('p1', 'life');

describe('G3: a hand card to the top or bottom of Life, face-up', () => {
  const toLife = act([
    {
      do: {
        move: {
          what: { from: 'hand', owner: 'you', pick: { upTo: 1 } },
          to: { zone: 'life', position: 'topOrBottom', faceUp: true },
        },
      },
    },
  ]);
  it('the controller picks the end: bottom', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [V.c3], life: [V.c1, V.c1] },
      { leader: PLAIN_BLUE },
    );
    run(g, toLife);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    option(g, 'bottom');
    expect(lifeCards(g).map((c) => c.card)).toEqual([V.c1, V.c1, V.c3]);
    expect(lifeCards(g)[2]!.faceUp).toBe(true);
    expect(hand(g, 'p1')).toEqual([]);
  });
  it('and top', () => {
    const g = game({ leader: PLAIN_PURPLE, hand: [V.c3], life: [V.c1] }, { leader: PLAIN_BLUE });
    run(g, toLife);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    option(g, 'top');
    expect(lifeCards(g).map((c) => c.card)).toEqual([V.c3, V.c1]);
  });
});

describe('G4: all of your Life cards as a cost', () => {
  it('to the hand: every Life card, then the effect', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [V.c1, V.c2, V.c3], deck: [V.c4] },
      { leader: PLAIN_BLUE },
    );
    run(g, act([{ do: { draw: 1 } }], [{ lifeToHand: { from: 'top', n: 'all' } }]));
    expect(lifeCards(g)).toEqual([]);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
  });
  it('to the trash; with no Life it is still payable', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [V.c1, V.c2], deck: [V.c4] },
      { leader: PLAIN_BLUE },
    );
    run(g, act([{ do: { draw: 1 } }], [{ trashLife: 'all' }]));
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    const z = game({ leader: PLAIN_PURPLE, life: [], deck: [V.c4] }, { leader: PLAIN_BLUE });
    run(z, act([{ do: { draw: 1 } }], [{ trashLife: 'all' }]));
    expect(hand(z, 'p1')).toEqual([V.c4]);
  });
  it('"all" is not accepted from the top or bottom', () => {
    expect(
      errorsOf(act([], [{ lifeToHand: { from: 'topOrBottom', n: 'all' } }])).length,
    ).toBeGreaterThan(0);
  });
});

describe('G5: a permanent play-cost reduction for cards in your hand', () => {
  const discount: Ability = {
    id: 'd',
    kind: 'permanent',
    apply: [
      {
        playCost: {
          target: {
            from: 'hand',
            owner: 'you',
            filter: { all: [{ category: ['Character'] }, { cost: { gte: 2 } }] },
          },
          amount: -1,
        },
      },
    ],
  } as unknown as Ability;
  const canPlay = (g: ReturnType<typeof game>, id: string) =>
    g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', id));
  it('a cost 3 Character plays for 2; a cost 1 is not reduced (the filter reads the cost before)', () => {
    expectValid([discount]);
    const g = game(
      { leader: PLAIN_PURPLE, hand: [V.c3, V.c1], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    expect(canPlay(g, V.c3)).toBe(false);
    g.state = withAbilities(g.state, PLAIN_PURPLE, [discount]);
    expect(canPlay(g, V.c3)).toBe(true);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c3) });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
    const h = game(
      { leader: PLAIN_PURPLE, hand: [V.c1], costArea: { active: 0, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    h.state = withAbilities(h.state, PLAIN_PURPLE, [discount]);
    expect(canPlay(h, V.c1)).toBe(false);
  });
  it('only cards in your hand: the validator refuses a field target', () => {
    const bad = {
      ...discount,
      apply: [{ playCost: { target: { from: 'characters', owner: 'you' }, amount: -1 } }],
    };
    expect(errorsOf(bad).length).toBeGreaterThan(0);
  });
});

describe('G6: activate the [Trigger] of a revealed hand card', () => {
  const drawTrigger = {
    id: 'trigger',
    kind: 'trigger',
    effect: [{ do: { draw: 1 } }],
  } as unknown as Ability;
  const reveal = act([
    {
      do: {
        select: { from: 'hand', owner: 'you', pick: { upTo: 1 }, reveal: true, bind: 'r' },
      },
    },
    {
      do: {
        activate: { ability: 'trigger', of: { from: 'hand', owner: 'you', filter: { ref: 'r' } } },
      },
    },
  ]);
  it("the revealed card's [Trigger] runs and the card stays in the hand", () => {
    const g = game({ leader: PLAIN_PURPLE, hand: [V.c3], deck: [V.c4] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, V.c3, [drawTrigger]);
    run(g, reveal);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1').sort()).toEqual([V.c3, V.c4].sort());
    expect(g.events.some((e) => e.type === 'CardRevealed')).toBe(true);
  });
  it('a card with no [Trigger] does nothing', () => {
    const g = game({ leader: PLAIN_PURPLE, hand: [V.c2], deck: [V.c4] }, { leader: PLAIN_BLUE });
    run(g, reveal);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });
});
