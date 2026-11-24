/**
 * M6b wave 2 (audit m6b-runtime-audit §2): the single-card primitives.
 *  - G13 `nameIncludes` filter.
 *  - G15 `Num` count of distinct card names.
 *  - G16 `giveDon` `each` with an `upTo` pick: up to N targets, up to M each.
 *  - G17 `lookAtTop` take `to: 'play'`.
 *  - G18 `ko` of a Stage.
 *  - G19 `oneOf` cost ("A or B").
 * Planted on vanilla cards; each test fails with its gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { costIsSecret } from '../../../src/effects/eval.ts';
import { applyOp, withAbilities, withAlsoNamed, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  hand,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  trash,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, offered, run } from '../m6b-w1/probe.ts';

const ownChars = { from: 'characters', owner: 'you' } as const;
const power = (g: ReturnType<typeof game>, id: string): number | null => g.card(id).power;

describe('G13 nameIncludes', () => {
  it('matches a substring of the card name (case-sensitive), and an also-named name', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1, V.c2] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAlsoNamed(g.state, V.c2, ['Portgas D. Ace']);
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            power: {
              target: { ...ownChars, filter: { nameIncludes: 'lug' } },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: { ...ownChars, filter: { nameIncludes: 'Ace' } },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    expect(power(g, g.find('p1', 'characters', V.c1))).toBe(4000); // Blugori includes "lug"
    expect(power(g, g.find('p1', 'characters', V.c2))).toBe(6000); // also named "... Ace"
    expect(power(g, g.find('p1', 'characters', BLUE))).toBe(3000); // Mohji: neither
  });

  it('reads in a Leader condition, and the validator accepts only a string', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        conditions: [{ leader: { nameIncludes: 'Kaid' } }],
        effect: [{ do: { draw: 1 } }],
      },
      {
        id: 'b',
        kind: 'activate',
        when: 'activateMain',
        conditions: [{ leader: { nameIncludes: 'Ace' } }],
        effect: [{ do: { draw: 1 } }],
      },
    ] as Ability[]);
    const id = g.find('p1', 'characters', BLUE);
    expect(g.isLegal({ type: 'activate', card: id, ability: 'a', player: 'p1' })).toBe(true);
    expect(g.isLegal({ type: 'activate', card: id, ability: 'b', player: 'p1' })).toBe(false);
    const bad = { id: 'x', kind: 'trigger', effect: [{ do: { draw: 1 } }] };
    expect(errorsOf(bad)).toEqual([]);
    expect(
      errorsOf({
        ...bad,
        conditions: [{ leader: { nameIncludes: 3 } }],
      }),
    ).not.toEqual([]);
  });
});

describe('G15 Num count of distinct card names', () => {
  const distinct = { count: ownChars, distinctNames: true } as const;
  it('counts each name once however many cards carry it', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, BLUE, V.c1] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you' },
              amount: { mul: [distinct, 1000] },
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    expect(power(g, g.leader('p1'))).toBe(5000 + 2000); // 3 Characters, 2 names
  });

  it('as a condition: "5 different names" is not met by 4 names plus a copy', () => {
    const mk = (chars: string[]) => {
      const g = game({ leader: PLAIN_PURPLE, characters: chars }, { leader: PLAIN_BLUE });
      g.state = withAbilities(g.state, chars[0]!, [
        {
          id: 'a',
          kind: 'activate',
          when: 'activateMain',
          conditions: [{ cmp: [distinct, '>=', 3] }],
          effect: [{ do: { draw: 1 } }],
        },
      ] as Ability[]);
      return g;
    };
    const ok = mk([BLUE, V.c1, V.c2]);
    const legal = (g: ReturnType<typeof mk>) =>
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', BLUE),
        ability: 'a',
        player: 'p1',
      });
    expect(legal(ok)).toBe(true);
    expect(legal(mk([BLUE, BLUE, V.c1]))).toBe(false);
  });

  it('`distinctNames: false` is refused', () => {
    expect(
      errorsOf({
        id: 'x',
        kind: 'trigger',
        conditions: [{ cmp: [{ count: ownChars, distinctNames: false }, '>=', 1] }],
        effect: [{ do: { draw: 1 } }],
      }),
    ).not.toEqual([]);
  });
});

describe('G16 giveDon each with an upTo pick', () => {
  const give = (cap: number, per = 2): Ability =>
    main([
      {
        do: {
          giveDon: {
            n: per,
            state: 'rested',
            to: { ...ownChars, filter: { not: { isSelf: true } }, pick: { upTo: cap } },
            each: true,
          },
        },
      },
    ]);
  const mk = (rested: number, cap: number) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE, V.c1, V.c2, V.c3],
        costArea: { active: 0, rested },
      },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [give(cap)]);
    return g;
  };
  const given = (g: ReturnType<typeof mk>, card: string) =>
    g.card(g.find('p1', 'characters', card)).don;

  it('gives M to each of the N chosen targets', () => {
    const g = mk(4, 2);
    run(g);
    pick(g, [g.find('p1', 'characters', V.c1), g.find('p1', 'characters', V.c3)]);
    expect([given(g, V.c1), given(g, V.c2), given(g, V.c3)]).toEqual([2, 0, 2]);
    expect(don(g, 'p1')).toMatchObject({ rested: 0, given: 4 });
  });

  it('the pick caps the targets even when the DON!! would reach more (6 rested DON!!, 3 Characters, up to 2)', () => {
    const g = mk(6, 2);
    run(g);
    expect(expectDecision(g, 'choose').max).toBe(2);
    pick(g, [g.find('p1', 'characters', V.c1), g.find('p1', 'characters', V.c2)]);
    expect([given(g, V.c1), given(g, V.c2), given(g, V.c3)]).toEqual([2, 2, 0]);
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 4 });
  });

  it('"up to": fewer targets may be chosen', () => {
    const g = mk(4, 2);
    run(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect([given(g, V.c1), given(g, V.c2), given(g, V.c3)]).toEqual([0, 2, 0]);
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 2 });
  });

  it('the DON!! on hand cap the targets (3 rested DON!! reach one target of 2 each)', () => {
    const g = mk(3, 2);
    run(g);
    const d = expectDecision(g, 'choose');
    expect(d.max).toBe(1);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, given: 2 });
  });

  it('the validator accepts each with no pick or an upTo pick, and refuses other picks', () => {
    expectValid([give(2)]);
    const noPick = main([{ do: { giveDon: { n: 1, state: 'rested', to: ownChars, each: true } } }]);
    expect(errorsOf(noPick)).toEqual([]);
    const exactly = {
      ...noPick,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { ...ownChars, pick: { exactly: 2 } },
              each: true,
            },
          },
        },
      ],
    };
    expect(errorsOf(exactly)).not.toEqual([]);
  });
});

describe('G17 lookAtTop take to play', () => {
  const look = (rested?: true, filter = { category: ['Character'] } as never): Ability =>
    main([
      {
        do: {
          lookAtTop: {
            n: 3,
            take: [{ pick: { upTo: 2 }, filter, to: 'play', ...(rested ? { rested } : {}) }],
            rest: 'bottomAnyOrder',
          },
        },
      },
    ]);
  const mk = (ability: Ability, chars: string[] = [BLUE]) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: chars,
        deck: [V.c1, 'OP01-086', V.c3, V.c4, V.c5],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [ability]);
    return g;
  };

  it('plays the cards taken for free, puts the rest at the bottom, fires [On Play]', () => {
    const g = mk(look());
    g.state = withAbilities(g.state, V.c1, [
      { id: 'op', kind: 'auto', when: ['onPlay'], effect: [{ do: { draw: 1 } }] },
    ] as Ability[]);
    run(g);
    expectDecision(g, 'choose');
    // Characters only (the filter), and an Event could not be played anyway: two candidates.
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', V.c1), g.find('p1', 'deck', V.c3)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([BLUE, V.c1, V.c3].sort());
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 }); // played for free
    expect(g.eventsOfType('CardPlayed')).toHaveLength(2);
    // [On Play] of Blugori drew the next top card: the Event went to the bottom with the rest.
    expect(hand(g, 'p1')).toEqual([V.c4]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck[deck.length - 1]).toBe('OP01-086');
  });

  it('taking none plays none; `rested` places the card rested', () => {
    const g = mk(look());
    run(g);
    expectDecision(g, 'choose');
    g.act({ type: 'done' });
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    const r = mk(look(true));
    run(r);
    pick(r, [r.find('p1', 'deck', V.c1)]);
    expect(r.card(r.find('p1', 'characters', V.c1)).rested).toBe(true);
  });

  it('with the Character area full it asks which to trash, like any play (CR 3-7-6-1)', () => {
    const g = mk(look(), [BLUE, V.c2, V.c2, V.c2, V.c2]);
    run(g);
    pick(g, [g.find('p1', 'deck', V.c1)]);
    expect(dec(g)?.purpose).toBe('characterLimit');
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('validates; `rested` is only for a take that plays, and a play take picks upTo or exactly', () => {
    expectValid([look(true)]);
    const ab = (take: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { lookAtTop: { n: 3, take: [take], rest: 'bottomAnyOrder' } } }],
    });
    expect(errorsOf(ab({ pick: { upTo: 1 }, to: 'hand', rested: true }))).not.toEqual([]);
    expect(errorsOf(ab({ pick: { any: true }, to: 'play' }))).not.toEqual([]);
    expect(errorsOf(ab({ pick: { upTo: 1 }, to: 'play' }))).toEqual([]);
  });
});

describe('G18 ko of a Stage', () => {
  const STAGE = 'OP02-070';
  const mk = (extra: Ability[] = []) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, stage: STAGE, characters: [V.c1] },
    );
    g.state = withAbilities(g.state, STAGE, extra);
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { ko: { from: 'stage', owner: 'opponent', pick: { upTo: 1 } } } }]),
    ]);
    return g;
  };
  const stageIds = (g: ReturnType<typeof mk>) => g.zone('p2', 'stage').map((c) => c.card);

  it('K.O.s the Stage into its owner trash through the K.O. event', () => {
    const g = mk();
    run(g);
    pick(g, [g.find('p2', 'stage', STAGE)]);
    expect(stageIds(g)).toEqual([]);
    expect(trash(g, 'p2')).toEqual([STAGE]);
    expect(g.eventsOfType('KO')).toHaveLength(1);
  });

  it("fires the Stage's [On K.O.], not a 'Character is K.O.'d' watcher", () => {
    const g = mk([{ id: 'k', kind: 'auto', when: ['onKO'], effect: [{ do: { draw: 1 } }] }]);
    g.state = withAbilities(g.state, PLAIN_BLUE, [
      {
        id: 'w',
        kind: 'auto',
        when: [{ event: 'koed', filter: { not: { isSelf: true } } }],
        effect: [{ do: { draw: 1 } }],
      },
    ] as Ability[]);
    run(g);
    pick(g, [g.find('p2', 'stage', STAGE)]);
    expect(hand(g, 'p2')).toHaveLength(1); // the Stage's own [On K.O.] only
    // A Character K.O. does fire the watcher.
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p2', 'characters', V.c1),
      by: 'p1',
    }).state;
    expect(hand(g, 'p2')).toHaveLength(2);
  });

  it('"cannot be K.O.\'d" stops it', () => {
    const g = mk();
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeKOd',
        target: g.find('p2', 'stage', STAGE),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    run(g);
    pick(g, [g.find('p2', 'stage', STAGE)]);
    expect(stageIds(g)).toEqual([STAGE]);
    expect(g.eventsOfType('KOPrevented')).toHaveLength(1);
  });

  it('a K.O. replacement on the Stage is offered', () => {
    const g = mk([
      {
        id: 'r',
        kind: 'replacement',
        replaces: { ko: { from: 'stage', owner: 'you', filter: { isSelf: true } } },
        optional: true,
        instead: [],
      },
    ] as Ability[]);
    run(g);
    pick(g, [g.find('p2', 'stage', STAGE)]);
    expect(dec(g)?.purpose).toBe('replacement');
    g.act({ type: 'optional', accept: true });
    expect(stageIds(g)).toEqual([STAGE]);
  });

  it('a Stage remains outside Character-only actions', () => {
    expect(
      errorsOf({
        id: 'x',
        kind: 'trigger',
        effect: [{ do: { ko: { from: 'hand', owner: 'opponent' } } }],
      }),
    ).not.toEqual([]);
  });
});

describe('G19 oneOf cost', () => {
  const trashHand = {
    trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } },
  } as const;
  const orCost = [{ oneOf: [[trashHand], [{ restDon: 1 }]] }] as never;
  const mk = (hand: string[], active: number, cost: unknown[] = orCost) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], hand, costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { draw: 1 } }], cost as never)]);
    return g;
  };

  it('both payable: asks which, and pays only that alternative', () => {
    const a = mk([V.c1], 1);
    run(a);
    const d = expectDecision(a, 'choose', 'p1');
    expect(d.options).toHaveLength(2);
    option(a, '0'); // trash 1 card from the hand
    pick(a, [a.find('p1', 'hand', V.c1)]);
    expect(trash(a, 'p1')).toEqual([V.c1]);
    expect(don(a, 'p1')).toMatchObject({ active: 1, rested: 0 });
    const b = mk([V.c1], 1);
    run(b);
    option(b, '1'); // rest 1 DON!!
    expect(don(b, 'p1')).toMatchObject({ active: 0, rested: 1 });
    expect(trash(b, 'p1')).toEqual([]);
    expect(hand(b, 'p1')).toContain(V.c1);
  });

  it('only one payable: taken without asking; none payable: not offered', () => {
    const handOnly = mk([V.c1], 0);
    run(handOnly);
    // No choice of alternative: straight to choosing the card to trash.
    expect(dec(handOnly)?.options).toBeUndefined();
    pick(handOnly, [handOnly.find('p1', 'hand', V.c1)]);
    expect(dec(handOnly)?.kind).toBe('main');
    expect(trash(handOnly, 'p1')).toEqual([V.c1]);
    const donOnly = mk([], 1);
    run(donOnly);
    expect(don(donOnly, 'p1')).toMatchObject({ active: 0, rested: 1 });
    expect(offered(mk([], 0))).toBe(false);
  });

  it('with other costs, the DON!! a later cost needs are reserved from the alternative that is taken', () => {
    // restDon 1, then (rest 1 DON!! or trash a card): one active DON!! can only pay the trash branch.
    const g = mk([V.c1], 1, [{ restDon: 1 }, { oneOf: [[{ restDon: 1 }], [trashHand]] }]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
    expect(offered(mk([], 1, [{ restDon: 1 }, { oneOf: [[{ restDon: 1 }], [trashHand]] }]))).toBe(
      false,
    );
  });

  it('the alternative taken reserves DON!! from the costs that really follow it (give DON!! after a rest)', () => {
    const giveCost = {
      giveDon: {
        n: 1,
        state: 'active',
        to: { from: 'leader', owner: 'you', pick: { exactly: 1 } },
      },
    };
    const g = mk([V.c1], 2, [{ restDon: 1 }, { oneOf: [[giveCost], [trashHand]] }]);
    run(g);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1, given: 1 });
  });

  it('a hand alternative makes the cost secret (costIsSecret), so "not payable" leaks nothing', () => {
    expect(costIsSecret(orCost)).toBe(true);
    expect(costIsSecret([{ oneOf: [[{ restDon: 1 }], [{ restDon: 2 }]] }] as never)).toBe(false);
  });

  it('the validator accepts 2 or more alternatives, and refuses the rest', () => {
    expectValid([main([{ do: { draw: 1 } }], orCost)]);
    const bad = (cost: unknown[]) =>
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        cost,
        effect: [{ do: { draw: 1 } }],
      });
    expect(bad([{ oneOf: [[{ restDon: 1 }]] }])).not.toEqual([]); // one alternative is not a choice
    expect(bad([{ oneOf: [[{ restDon: 1 }], []] }])).not.toEqual([]); // an empty alternative
    expect(
      bad([{ oneOf: [[{ restDon: 1 }], [{ oneOf: [[{ restDon: 1 }], [{ restDon: 2 }]] }]] }]),
    ).not.toEqual([]);
    expect(bad([orCost[0], orCost[0]])).not.toEqual([]); // two "A or B" in one list
    const inReplacement = {
      id: 'r',
      kind: 'replacement',
      replaces: { damage: 'you' },
      optional: true,
      instead: [{ oneOf: [[{ restDon: 1 }], [{ restDon: 2 }]] }],
    };
    expect(errorsOf(inReplacement)).not.toEqual([]);
  });
});
