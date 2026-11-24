/**
 * M6b wave 3: numbers and conditions.
 *  - G23 `Num` division (floor): "for every 5 cards in your trash".
 *  - G26 per-turn history conditions: a Character K.O.'d this turn, an Event activated this turn.
 *  - G28 `[On K.O.]` qualified by the K.O. cause (`koCause`).
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, internals, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  endCounter,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  times,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const EVENT4 = 'ST01-015'; // an Event, base cost 4
const EVENT1 = 'ST01-014'; // an Event, base cost 1

const rawPerm = (apply: object[]): Ability => ({ id: 'p', kind: 'permanent', apply }) as Ability;
const perm = (apply: object[]): Ability => {
  const ab = rawPerm(apply);
  expectValid([ab]);
  return ab;
};
const selfPower = (amount: object) => ({
  power: { target: { from: 'self', owner: 'you' }, amount },
});

describe('G23 Num division (floor)', () => {
  const gains = (trashed: number, amount: object): number | null => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], trash: times(trashed, V.c1) },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [perm([selfPower(amount)])]);
    return g.card(g.find('p1', 'characters', BLUE)).power;
  };
  const per5 = { mul: [{ div: [{ trash: 'you' }, 5] }, 1000] };

  it('"+1000 power for every 5 cards in your trash" rounds down', () => {
    expect(gains(0, per5)).toBe(3000);
    expect(gains(4, per5)).toBe(3000);
    expect(gains(5, per5)).toBe(4000);
    expect(gains(9, per5)).toBe(4000);
    expect(gains(12, per5)).toBe(5000);
  });

  it('counts a selector, and a division by 1 is the number itself', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE],
        trash: [...times(5, EVENT1), ...times(7, V.c1)],
      },
      { leader: PLAIN_BLUE },
    );
    const events = { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } };
    g.state = withAbilities(g.state, BLUE, [
      perm([selfPower({ mul: [{ div: [events, 5] }, 1000] })]),
    ]);
    expect(g.card(g.find('p1', 'characters', BLUE)).power).toBe(4000); // 5 Events: one group
    g.state = withAbilities(g.state, BLUE, [perm([selfPower({ div: [{ trash: 'you' }, 1] })])]);
    expect(g.card(g.find('p1', 'characters', BLUE)).power).toBe(3000 + 12);
  });

  it('works in a condition and in a cost change', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], trash: times(10, V.c1) },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      perm([
        {
          cost: { target: { from: 'self', owner: 'you' }, amount: { div: [{ trash: 'you' }, 4] } },
        },
      ]),
    ]);
    expect(g.card(g.find('p1', 'characters', BLUE)).cost).toBe(1 + 2); // floor(10 / 4) = 2
  });

  it('the validator takes a whole divisor of 1 or more', () => {
    const ok = (div: unknown) => errorsOf(rawPerm([selfPower({ mul: [{ div }, 1000] })]));
    expect(ok([{ trash: 'you' }, 5])).toEqual([]);
    expect(ok([{ trash: 'you' }, 0])).not.toEqual([]);
    expect(ok([{ trash: 'you' }, 2.5])).not.toEqual([]);
    expect(ok([{ trash: 'you' }, -1])).not.toEqual([]);
    expect(ok([{ trash: 'you' }])).not.toEqual([]);
    expect(ok([5, { trash: 'you' }])).not.toEqual([]);
  });
});

describe('G26 history conditions', () => {
  const rawWhen = (conditions: object[]): Ability =>
    ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      conditions,
      effect: [{ do: { draw: 1 } }],
    }) as Ability;
  const when = (conditions: object[]): Ability => {
    const ab = rawWhen(conditions);
    expectValid([ab]);
    return ab;
  };
  const legal = (g: ReturnType<typeof game>) =>
    g.isLegal({
      type: 'activate',
      card: g.find('p1', 'characters', BLUE),
      ability: 'a',
      player: 'p1',
    } as never);
  const ko = (g: ReturnType<typeof game>, who: 'p1' | 'p2', card: string, by: 'p1' | 'p2') => {
    g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card), by }).state;
  };
  const make = (condition: object) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [{ card: PURPLE, rested: true }] },
    );
    g.state = withAbilities(g.state, BLUE, [when([condition])]);
    return g;
  };

  it('"an opponent’s Character has been K.O.\'d this turn": false before, true after', () => {
    const g = make({ koedThisTurn: 'opponent' });
    expect(legal(g)).toBe(false);
    ko(g, 'p2', PURPLE, 'p1');
    expect(legal(g)).toBe(true);
  });

  it('either player’s doing, and only that player’s Characters', () => {
    const opp = make({ koedThisTurn: 'opponent' });
    ko(opp, 'p1', V.c1, 'p1'); // my own Character, by my effect
    expect(legal(opp)).toBe(false);
    const mine = make({ koedThisTurn: 'you' });
    ko(mine, 'p1', V.c1, 'p2'); // by the opponent's effect
    expect(legal(mine)).toBe(true);
    const battle = make({ koedThisTurn: 'opponent' });
    battle.act({
      type: 'attack',
      attacker: battle.find('p1', 'characters', BLUE),
      target: battle.find('p2', 'characters', PURPLE),
    });
    passBlock(battle);
    endCounter(battle);
    expect(battle.zone('p2', 'characters')).toHaveLength(0); // the 3000 hit the 3000: K.O.'d
    g_expectCond(battle, true);
  });

  const g_expectCond = (g: ReturnType<typeof game>, v: boolean) => {
    const ids = g.legal().filter((a) => a.type === 'activate' && a.ability === 'a');
    expect(ids.length > 0).toBe(v);
  };

  it('a K.O. that is prevented does not count', () => {
    const g = make({ koedThisTurn: 'opponent' });
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeKOd',
        target: g.find('p2', 'characters', PURPLE),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    ko(g, 'p2', PURPLE, 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(legal(g)).toBe(false);
  });

  it('only this turn: it is empty on the next turn', () => {
    const g = make({ koedThisTurn: 'opponent' });
    ko(g, 'p2', PURPLE, 'p1');
    expect(legal(g)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(legal(g)).toBe(false);
  });

  it('"activated an Event with a base cost of 3 or more": the Event’s printed cost counts', () => {
    const play = (event: string, cond: object) => {
      const g = game(
        {
          leader: PLAIN_PURPLE,
          characters: [BLUE],
          hand: [event],
          costArea: { active: 5, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, event, [
        { id: 'm', kind: 'activate', when: 'main', effect: [{ do: { draw: 1 } }] } as Ability,
      ]);
      g.state = withAbilities(g.state, BLUE, [when([cond])]);
      expect(legal(g)).toBe(false);
      g.act({ type: 'playCard', card: g.find('p1', 'hand', event) });
      return legal(g);
    };
    const three = { eventsActivatedThisTurn: 'you', baseCost: { gte: 3 } };
    expect(play(EVENT4, three)).toBe(true);
    expect(play(EVENT1, three)).toBe(false);
    expect(play(EVENT1, { eventsActivatedThisTurn: 'you' })).toBe(true); // any Event
    expect(play(EVENT4, { eventsActivatedThisTurn: 'opponent' })).toBe(false);
  });

  it('is kept only in a game where a card reads it, so other games are unchanged', () => {
    const plain = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    ko(plain, 'p2', PURPLE, 'p1');
    expect(internals(plain.state).hist).toBeUndefined();
    const reading = make({ koedThisTurn: 'opponent' });
    ko(reading, 'p2', PURPLE, 'p1');
    expect(internals(reading.state).hist).toBeDefined();
  });

  it('the validator takes a player, and a base cost comparison only on Events', () => {
    expectValid([when([{ koedThisTurn: 'opponent' }])]);
    expectValid([{ ...when([{ eventsActivatedThisTurn: 'you', baseCost: { gte: 3 } }]), id: 'b' }]);
    expect(errorsOf(rawWhen([{ koedThisTurn: 'both' }]))).not.toEqual([]);
    expect(errorsOf(rawWhen([{ koedThisTurn: 'you', baseCost: { gte: 3 } }]))).not.toEqual([]);
    expect(
      errorsOf(rawWhen([{ eventsActivatedThisTurn: 'you', baseCost: { over: 3 } }])),
    ).not.toEqual([]);
  });
});

describe('G28 [On K.O.] qualified by the K.O. cause', () => {
  const onKO = (koCause?: 'opponentEffect' | 'effect'): Ability => {
    const ab = {
      id: 'k',
      kind: 'auto',
      when: ['onKO'],
      ...(koCause ? { conditions: [{ koCause }] } : {}),
      effect: [{ do: { draw: 1 } }],
    } as Ability;
    expectValid([ab]);
    return ab;
  };

  /** p2's Character with the [On K.O.]; returns how many cards its controller drew. */
  const koOf = (
    cause: 'opponentEffect' | 'effect' | undefined,
    how: { who: 'p2'; by: 'p1' | 'p2' } | 'battle',
  ): number => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c5] },
      { leader: PLAIN_BLUE, characters: [{ card: PURPLE, rested: true }] },
    );
    g.state = withAbilities(g.state, PURPLE, [onKO(cause)]);
    const before = hand(g, 'p2').length;
    if (how === 'battle') {
      g.act({
        type: 'attack',
        attacker: g.find('p1', 'characters', V.c5),
        target: g.find('p2', 'characters', PURPLE),
      });
      passBlock(g);
      endCounter(g);
    } else {
      g.state = applyOp(g.state, {
        op: 'ko',
        card: g.find('p2', 'characters', PURPLE),
        by: how.by,
      }).state;
    }
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    return hand(g, 'p2').length - before;
  };

  it('"by your opponent’s effect": the opponent’s effect only, not your own, not a battle', () => {
    expect(koOf('opponentEffect', { who: 'p2', by: 'p1' })).toBe(1);
    expect(koOf('opponentEffect', { who: 'p2', by: 'p2' })).toBe(0);
    expect(koOf('opponentEffect', 'battle')).toBe(0);
  });

  it('"by an effect": either player’s effect, not a battle', () => {
    expect(koOf('effect', { who: 'p2', by: 'p1' })).toBe(1);
    expect(koOf('effect', { who: 'p2', by: 'p2' })).toBe(1);
    expect(koOf('effect', 'battle')).toBe(0);
  });

  it('an unqualified [On K.O.] is unchanged', () => {
    expect(koOf(undefined, 'battle')).toBe(1);
    expect(koOf(undefined, { who: 'p2', by: 'p1' })).toBe(1);
  });

  it('is checked again when it resolves, from the K.O. that triggered it', () => {
    // The same ability, triggered by an effect, with the cause kept until it resolves.
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, PURPLE, [onKO('opponentEffect')]);
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } },
          },
        ],
      } as Ability,
    ]);
    const before = hand(g, 'p2').length;
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
    expect(hand(g, 'p2').length).toBe(before + 1);
  });

  it('the validator: koCause only in an [On K.O.] auto, with a known cause', () => {
    expectValid([onKO('opponentEffect'), { ...onKO('effect'), id: 'k2' }]);
    const bad = (cond: object, when: unknown[] = ['onKO']) =>
      errorsOf({ id: 'k', kind: 'auto', when, conditions: [cond], effect: [{ do: { draw: 1 } }] });
    expect(bad({ koCause: 'battle' })).not.toEqual([]);
    expect(bad({ koCause: 'opponentEffect' }, ['onPlay'])).not.toEqual([]);
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        conditions: [{ koCause: 'effect' }],
        effect: [{ do: { draw: 1 } }],
      }),
    ).not.toEqual([]);
  });
});
