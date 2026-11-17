/**
 * M4b wave 1: one-shot actions and steps the runtime did not have (effect-dsl.md §4.6, §4.10). Every
 * script is planted on a vanilla card and checked by the script validator, so a probe is also a
 * legal script. See `engine/test/cards/m4b/README` in the DECISIONS entry for what each shape means.
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { validateScript, type CardScript, type Step } from '@optcg/cards';
import { withAbilities, withKeywords, type Ability } from '../../../src/testing.ts';
import {
  accept,
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';

/** An [Activate: Main] on the probe card, validated as a script first. */
function main(effect: Step[], extra: Partial<Ability> = {}): Ability {
  const ab = { id: 'a', kind: 'activate', when: 'activateMain', effect, ...extra } as Ability;
  const script = {
    cardId: 'OP02-060',
    textHash: 'x',
    verified: { source: 't', date: '2026-11-16' },
    abilities: [ab],
  } as unknown as CardScript;
  expect(validateScript(script)).toEqual([]);
  return ab;
}
const run = (g: ReturnType<typeof game>, who = BLUE) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', who), ability: 'a' });

describe('forEach', () => {
  const draws = (chars: string[]) => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, ...chars] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        { forEach: { count: { from: 'characters', owner: 'you' } }, do: [{ do: { draw: 1 } }] },
      ]),
    ]);
    run(g);
    return g.zone('p1', 'hand').length;
  };
  it('runs its steps once per counted card, and not at all for none', () => {
    expect(draws([])).toBe(1);
    expect(draws([V.c1, V.c2])).toBe(3);
  });
  it('a choice inside it is asked on every run (one target each)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c4] },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          forEach: { count: { from: 'characters', owner: 'you' } },
          do: [
            {
              do: {
                power: {
                  target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
                  amount: -1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ]),
    ]);
    run(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });
});

describe('skipRefresh', () => {
  it('the card stays rested through its owner next Refresh Phase and untaps the one after (CR 6-2-4)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [{ card: V.c3, rested: true }] },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: { state: 'rested' },
              pick: { upTo: 1 },
            },
          },
        },
      ]),
    ]);
    run(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    g.act({ type: 'endTurn' });
    expect(g.zone('p2', 'characters')[0]!.rested).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.zone('p2', 'characters')[0]!.rested).toBe(false);
  });
});

describe('cost, playCost and giveDon', () => {
  it('a cost modifier changes the card for its duration', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            cost: {
              target: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
              amount: 2,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    expect(g.card(g.find('p1', 'characters', BLUE)).cost).toBe(3);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', BLUE)).cost).toBe(3);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', BLUE)).cost).toBe(1);
  });

  it('"the next time you play [X] the cost will be reduced" is spent by one matching play only', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE],
        hand: [V.c2, V.c2, V.c3],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            playCost: {
              next: { all: [{ category: ['Character'] }, { name: 'Dobon' }] },
              from: 'hand',
              amount: -1,
              window: 'thisTurn',
              uses: 1,
            },
          },
        },
      ]),
    ]);
    run(g);
    const don = () => project(g.state, 'p1').don.p1.active;
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c3) });
    expect(don()).toBe(3); // Solitaire is not Dobon: full price (3)
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c2, 0) });
    expect(don()).toBe(2); // Dobon costs 2 - 1
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c2, 0) });
    expect(don()).toBe(0); // the discount was spent: full price (2)
  });

  it('gives rested DON!! to a chosen card; with `each` every target gets one', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 0, rested: 3 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
            },
          },
        },
      ]),
    ]);
    run(g);
    option(g, '2');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(project(g.state, 'p1').don.p1.rested).toBe(1);

    const each = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 0, rested: 3 } },
      { leader: PLAIN_BLUE },
    );
    each.state = withAbilities(each.state, BLUE, [
      main([
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              each: true,
              to: { from: ['leader', 'characters'], owner: 'you' },
            },
          },
        },
      ]),
    ]);
    run(each);
    expect(each.card(each.leader('p1')).don).toBe(1);
    expect(each.card(each.find('p1', 'characters', BLUE)).don).toBe(1);
    expect(each.card(each.find('p1', 'characters', V.c1)).don).toBe(1);
    // Fewer DON!! than targets: the player picks which ones.
    const few = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 0, rested: 1 } },
      { leader: PLAIN_BLUE },
    );
    few.state = withAbilities(few.state, BLUE, [
      main([
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              each: true,
              to: { from: ['leader', 'characters'], owner: 'you' },
            },
          },
        },
      ]),
    ]);
    run(few);
    pick(few, [few.find('p1', 'characters', V.c1)]);
    expect(few.card(few.find('p1', 'characters', V.c1)).don).toBe(1);
    expect(few.card(few.leader('p1')).don).toBe(0);
  });
});

describe('restrictions', () => {
  it('"cannot activate [Blocker]" when the selected Character attacks (ST21-003 shape)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, { card: V.c2 }] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            select: {
              from: 'characters',
              owner: 'you',
              filter: { name: 'Dobon' },
              pick: { upTo: 1 },
              bind: 's',
            },
          },
        },
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'you', filter: { ref: 's' } },
              what: 'cannotActivateBlockerAgainstIt',
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ]);
    g.state = withKeywords(g.state, PURPLE, ['Blocker']);
    run(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    // PURPLE is a Blocker; the attack by the selected Character cannot be blocked by it...
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c2), target: g.leader('p2') });
    expectDecision(g, 'block', 'p2');
    expect(g.legal().some((a) => a.type === 'block' && a.blocker !== null)).toBe(false);
    // ...and the restriction is not the Unblockable keyword.
    expect(g.card(g.find('p1', 'characters', V.c2)).keywords).not.toContain('Unblockable');
  });

  it('"cannot draw cards using your own effects" stops that player effect draws only', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: { restrict: { target: 'you', what: 'cannotDrawByOwnEffects', duration: 'thisTurn' } },
        },
        { do: { draw: 2 } },
        { do: { draw: 1, player: 'opponent' } },
      ]),
    ]);
    run(g);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'hand')).toHaveLength(1);
  });

  it('"cannot play Character cards with a base cost of 5 or more" bars hand plays and effect plays', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE],
        hand: [V.c5, V.c1],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            restrict: {
              target: 'you',
              what: {
                cannotPlay: { all: [{ category: ['Character'] }, { baseCost: { gte: 5 } }] },
              },
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            play: {
              what: { from: 'hand', owner: 'you', filter: { cost: { gte: 5 } }, pick: { upTo: 1 } },
            },
          },
        },
      ]),
    ]);
    run(g);
    none(g); // the effect play: nothing it may choose (a hidden area is asked anyway)
    const plays = g.legal().filter((a) => a.type === 'playCard');
    expect(plays).toHaveLength(1);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});

describe('rest cards and DON!!', () => {
  it('"rest up to a total of 2 of your opponent\'s Characters or DON!! cards" mixes both (OP12-037)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c3], costArea: { active: 3, rested: 0 } },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            rest: { from: ['characters', 'donCostArea'], owner: 'opponent', pick: { upTo: 2 } },
          },
        },
      ]),
    ]);
    run(g);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c3) });
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    expect(g.zone('p2', 'characters')[0]!.rested).toBe(true);
    expect(project(g.state, 'p1').don.p2.rested).toBe(1);
  });

  it('"rest any number of your DON!!; for every one rested this way +2000" (OP13-001)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      {
        id: 'opp',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [
          {
            if: { cmp: [{ donOnField: 'you', state: 'active' }, '<=', 5] },
            then: [
              {
                may: [
                  {
                    do: {
                      rest: {
                        from: 'donCostArea',
                        owner: 'you',
                        pick: { any: true },
                        bind: 'rested',
                      },
                    },
                  },
                ],
                label: 'rest',
              },
              {
                ifDid: 'rest',
                then: [
                  {
                    do: {
                      power: {
                        target: { from: 'leader', owner: 'you' },
                        amount: { mul: [{ refCount: 'rested' }, 2000] },
                        duration: 'battle',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    accept(g);
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    g.act({ type: 'done' });
    expectDecision(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000 + 4000);
    expect(project(g.state, 'p1').don.p1.rested).toBe(2);
  });
});

describe('activate onPlay, trashLifeUntil and the Life moves', () => {
  it('"activate this card\'s [On Play] effect" runs it, and its conditions are checked', () => {
    const mk = (cond: boolean) => {
      const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
      g.state = withAbilities(g.state, BLUE, [
        {
          id: 'op',
          kind: 'auto',
          when: ['onPlay'],
          conditions: [{ cmp: [{ hand: 'you' }, cond ? '>=' : '>', cond ? 0 : 5] }],
          effect: [{ do: { draw: 2 } }],
        },
        main([{ do: { activate: { ability: 'onPlay', of: 'self' } } }]),
      ]);
      run(g);
      return g.zone('p1', 'hand').length;
    };
    expect(mk(true)).toBe(2);
    expect(mk(false)).toBe(0);
  });

  it('trashes Life cards from the top until the count is reached', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [V.c1, V.c2, V.c3, V.c4] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { trashLifeUntil: 1 } }])]);
    run(g);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c4]);
    expect(g.zone('p1', 'trash')).toHaveLength(3);
  });

  it("adds the top of the opponent's Life cards to the owner's hand, with no [Trigger] (QA-GR)", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, life: [V.c2, V.c3] },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            move: {
              what: { from: 'lifeTop', owner: 'opponent', pick: { upTo: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ]),
    ]);
    run(g);
    accept(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'life').map((c) => c.card)).toEqual([V.c3]);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([V.c2]);
  });

  it('moves a hand card to the top of Life, and a trash card there face-up (OP06-106, OP14-104)', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE],
        hand: [V.c3],
        trash: [V.c2],
        life: [V.c1],
      },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            move: {
              what: { from: 'hand', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top' },
            },
          },
        },
        {
          do: {
            move: {
              what: { from: 'trash', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top', faceUp: true },
            },
          },
        },
      ]),
    ]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    const life = g.zone('p1', 'life');
    expect(life.map((c) => c.card)).toEqual([V.c2, V.c3, V.c1]);
    expect(life.map((c) => c.faceUp)).toEqual([true, false, false]);
  });
});

describe('lookAtTop to Life, the trash, and several cards', () => {
  const look = (rest: 'trash' | 'bottomAnyOrder', to: 'hand' | 'lifeTop', upTo: number): Ability =>
    main([
      {
        do: {
          lookAtTop: {
            n: 3,
            take: [{ pick: { upTo }, to, ...(to === 'hand' ? { reveal: true as const } : {}) }],
            rest,
          },
        },
      },
    ]);

  it('"look at 3, add up to 1 card to the top of your Life, trash the rest"', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], deck: [V.c1, V.c2, V.c3, V.c4] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [look('trash', 'lifeTop', 1)]);
    run(g);
    pick(g, [g.find('p1', 'deck', V.c2)]);
    expect(g.zone('p1', 'life').map((c) => c.card)[0]).toBe(V.c2);
    expect(g.life('p1')).toBe(4);
    expect(
      g
        .zone('p1', 'trash')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c3].sort());
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c4]);
  });

  it('"reveal up to a total of 2 ... and add them to your hand"', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], deck: [V.c1, V.c2, V.c3, V.c4] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [look('bottomAnyOrder', 'hand', 2)]);
    run(g);
    pick(g, [g.find('p1', 'deck', V.c1), g.find('p1', 'deck', V.c3)]);
    expect(
      g
        .zone('p1', 'hand')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c3].sort());
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c4, V.c2]);
  });
});

describe('reveal the top Life card', () => {
  it('+1000 power per 1 cost on the revealed card (OP15-119), and both players see it', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: [V.c5, V.c1] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        { do: { reveal: { from: 'lifeTop', n: 1, bind: 'r' } } },
        {
          do: {
            power: {
              target: { from: 'self', owner: 'you' },
              amount: { mul: [{ refStat: 'r', stat: 'cost' }, 1000] },
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(3000 + 5000);
    const e = g.eventsOfType('CardRevealed').find((x) => x.from === 'life');
    expect(e?.card).toBe(V.c5);
    // The card stays in Life, face-down.
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });
});

describe('play from the trash, rested, and this card from a [Trigger]', () => {
  it('plays a Character from the trash rested', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], trash: [V.c2] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            play: { what: { from: 'trash', owner: 'you', pick: { upTo: 1 } }, rested: true },
          },
        },
      ]),
    ]);
    run(g);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    const played = g.zone('p1', 'characters').find((c) => c.card === V.c2);
    expect(played?.rested).toBe(true);
  });

  it('"[Trigger] Play this card" plays the Life card that was revealed', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [V.c2, V.c3] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c2, [
      {
        id: 't',
        kind: 'trigger',
        effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
      },
    ]);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});

describe('"if you do" after an action, top-or-bottom placement, activate conditions', () => {
  it('a labelled action lets "if you do" read whether it did something (OP08-098)', () => {
    const mk = (hand: string[]) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE], hand, life: [V.c1, V.c2] },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, BLUE, [
        main([
          {
            do: {
              play: {
                what: {
                  from: 'hand',
                  owner: 'you',
                  filter: { cost: { lte: 2 } },
                  pick: { upTo: 1 },
                },
              },
            },
            label: 'played',
          },
          { ifDid: 'played', then: [{ do: { draw: 1 } }] },
        ]),
      ]);
      return g;
    };
    const yes = mk([V.c2]);
    run(yes);
    pick(yes, [yes.find('p1', 'hand', V.c2)]);
    expect(yes.zone('p1', 'characters')).toHaveLength(2);
    expect(yes.zone('p1', 'hand')).toHaveLength(1); // drew
    const no = mk([V.c5]);
    run(no);
    none(no);
    expect(no.zone('p1', 'hand')).toHaveLength(1); // V.c5 only: nothing played, nothing drawn
  });

  it('places cards from the hand at the top or the bottom of the deck, as chosen (OP11-054)', () => {
    const mk = (where: 'top' | 'bottom') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE], hand: [V.c1, V.c2], deck: [V.c3, V.c4] },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, BLUE, [
        main([
          {
            do: {
              move: {
                what: { from: 'hand', owner: 'you', pick: { exactly: 2 } },
                to: { zone: 'deck', position: 'topOrBottom' },
              },
            },
          },
        ]),
      ]);
      run(g);
      pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
      g.act({ type: 'pick', choice: { option: where } });
      return g.zone('p1', 'deck').map((c) => c.card);
    };
    expect(mk('top').slice(0, 2).sort()).toEqual([V.c1, V.c2].sort());
    expect(mk('bottom').slice(-2).sort()).toEqual([V.c1, V.c2].sort());
  });

  it('an [Activate: Main] with a condition is not offered while the condition fails', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { draw: 1 } }], { conditions: [{ cmp: [{ hand: 'you' }, '>=', 1] }] }),
    ]);
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});
