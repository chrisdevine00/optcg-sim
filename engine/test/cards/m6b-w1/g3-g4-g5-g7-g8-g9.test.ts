/**
 * M6b wave 1 (audit m6b-runtime-audit §2): G3 `attribute` filter, G4 `mill` action, G5 `activate`
 * of the card's own [On K.O.] / [Counter], G7 `giveDon` cost, G8 `turnLifeFaceDown` cost, G9
 * `returnDon` of active DON!! only. Planted on vanilla cards; each test fails with its gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, queries } from '@optcg/engine';
import type { Cost } from '@optcg/cards';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from '../helpers.ts';
import { EVENT_RED } from '../../support/game.ts';
import { errorsOf, main, offered, run } from './probe.ts';

describe('G3 attribute filter', () => {
  it('selects Characters by printed attribute (Mohji Wisdom, Blugori Slash, Dobon Strike)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1, V.c2] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { any: [{ attribute: 'Slash' }, { attribute: 'Wisdom' }] },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
  });

  it('reads the Leader too: "if your Leader has the <Strike> attribute"', () => {
    const mk = (attribute: 'Strike' | 'Slash') => {
      const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
      g.state = withAbilities(g.state, BLUE, [
        main([{ if: { leader: { attribute } }, then: [{ do: { draw: 1 } }] }]),
      ]);
      run(g);
      return hand(g, 'p1').length;
    };
    expect(mk('Strike')).toBe(1); // ST04-001 is Strike
    expect(mk('Slash')).toBe(0);
  });

  it('rejects an attribute that does not exist', () => {
    const ab = (attribute: string) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ if: { leader: { attribute } }, then: [{ do: { draw: 1 } }] }],
    });
    expect(errorsOf(ab('Slash'))).toEqual([]);
    expect(errorsOf(ab('Fire')).length).toBeGreaterThan(0);
  });
});

describe('G4 mill action', () => {
  const deck5 = [V.c1, V.c2, V.c3, V.c4, V.c5];

  it('trashes the top N cards face-up, in order, and leaves the rest (CR 3-3)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], deck: deck5 },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { mill: { player: 'you', n: 3 } } }])]);
    run(g);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c4, V.c5]);
    const moved = g.eventsOfType('CardMoved').filter((e) => e.to === 'trash');
    expect(moved).toHaveLength(3);
    expect(moved.every((e) => e.revealed === true)).toBe(true);
  });

  it('N is a number expression: "as many as your Characters"', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], deck: deck5 },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        { do: { mill: { player: 'you', n: { count: { from: 'characters', owner: 'you' } } } } },
      ]),
    ]);
    run(g);
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it("mills the opponent's deck, and an effect clamps to the deck it finds", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, deck: [V.c3, V.c4, V.c5] },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { mill: { player: 'opponent', n: 2 } } }]),
    ]);
    run(g);
    expect(trash(g, 'p2')).toHaveLength(2);
    expect(g.zone('p2', 'deck')).toHaveLength(1);
    expect(trash(g, 'p1')).toHaveLength(0);
    expect(queries.result(g.state)).toBeNull();

    const short = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, deck: [V.c3, V.c4] },
    );
    short.state = withAbilities(short.state, BLUE, [
      main([{ do: { mill: { player: 'opponent', n: 5 } } }]),
    ]);
    run(short);
    expect(trash(short, 'p2')).toHaveLength(2);
    expect(short.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('emptying a deck loses at once, not at the next draw (RL-26, CR 9-1-2)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, deck: [V.c3, V.c4] },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { mill: { player: 'opponent', n: 5 } } }]),
    ]);
    run(g);
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'deck out' });
  });

  it('validates its fields', () => {
    const ab = (mill: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { mill } }],
    });
    expect(errorsOf(ab({ player: 'you', n: 2 }))).toEqual([]);
    expect(errorsOf(ab({ player: 'you', n: 'two' })).length).toBeGreaterThan(0);
    expect(errorsOf(ab({ n: 2 })).length).toBeGreaterThan(0);
  });
});

describe('G5 activate the own [On K.O.] / [Counter] from a [Trigger]', () => {
  const onKO: Ability = { id: 'k', kind: 'auto', when: ['onKO'], effect: [{ do: { draw: 2 } }] };
  const trigger = (ability: 'onKO' | 'counter'): Ability => ({
    id: 't',
    kind: 'trigger',
    effect: [{ do: { activate: { ability, of: 'self' } } }],
  });
  /** p2 attacks p1's Leader; p1's top Life card is `card` with these abilities. */
  function hit(card: string, abilities: Ability[]) {
    const g = game(
      { leader: PLAIN_PURPLE, life: [card, V.c3] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, card, abilities);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    return g;
  }

  it('"[Trigger] Activate this card\'s [On K.O.] effect" runs the [On K.O.] ability', () => {
    const g = hit(V.c2, [trigger('onKO'), onKO]);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([V.c2]);
  });

  it('without the activate step the [On K.O.] does not run (it is not on the field)', () => {
    const g = hit(V.c2, [{ id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] }, onKO]);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  const counterEvent: Ability = {
    id: 'c',
    kind: 'activate',
    when: 'counter',
    effect: [
      {
        do: {
          power: {
            target: { from: 'leader', owner: 'you' },
            amount: 2000,
            duration: 'battle',
          },
        },
      },
    ],
  };

  it('"[Trigger] Activate this card\'s [Counter] effect": its "during this battle" effect applies in a battle', () => {
    const g = hit(EVENT_RED, [trigger('counter'), counterEvent]);
    g.act({ type: 'trigger', activate: true });
    // The battle ends in the same step, so the modifier is read from the events: it was made (+2000).
    expect(g.eventsOfType('PowerModified').map((e) => e.amount)).toEqual([2000]);
  });

  it('... and does nothing when no battle is going on (effect damage)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [EVENT_RED, V.c3] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, EVENT_RED, [trigger('counter'), counterEvent]);
    const step = applyOp(g.state, { op: 'damage', player: 'p1', n: 1, by: 'p2' });
    g.state = step.state;
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(g.eventsOfType('PowerModified')).toHaveLength(0);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });
});

describe('G7 giveDon cost', () => {
  const give = (n: number, from: string | string[] = 'leader'): Cost => ({
    giveDon: {
      n,
      state: 'active',
      to: { from: from as never, owner: 'you', pick: { exactly: 1 } },
    },
  });
  const mk = (active: number, cost: Cost[], chars: string[] = [BLUE]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: chars, costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { draw: 1 } }], cost)]);
    return g;
  };

  it('gives N active DON!! from the cost area to your Leader', () => {
    const g = mk(3, [give(2)]);
    run(g);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 1, rested: 0, given: 2 });
    expect(g.eventsOfType('DonGiven')[0]).toMatchObject({ count: 2, by: 'cost', rested: false });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('asks which card when there are several, and gives to that one', () => {
    const g = mk(1, [give(1, ['leader', 'characters'])], [BLUE, V.c1]);
    run(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('needs N active DON!!, counting other costs that rest DON!!', () => {
    expect(offered(mk(1, [give(2)]))).toBe(false);
    expect(offered(mk(2, [give(2)]))).toBe(true);
    expect(offered(mk(2, [{ restDon: 1 }, give(2)]))).toBe(false);
    expect(offered(mk(3, [{ restDon: 1 }, give(2)]))).toBe(true);
  });

  it('validates: active DON!! to your own Leader or Character, to exactly one card', () => {
    const ab = (giveDon: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ giveDon }],
      effect: [{ do: { draw: 1 } }],
    });
    const to = { from: 'leader', owner: 'you', pick: { exactly: 1 } };
    expect(errorsOf(ab({ n: 1, state: 'active', to }))).toEqual([]);
    expect(errorsOf(ab({ n: 1, state: 'rested', to })).length).toBeGreaterThan(0);
    expect(
      errorsOf(ab({ n: 1, state: 'active', to: { ...to, owner: 'opponent' } })).length,
    ).toBeGreaterThan(0);
    expect(
      errorsOf(ab({ n: 1, state: 'active', to: { ...to, from: 'hand' } })).length,
    ).toBeGreaterThan(0);
    expect(
      errorsOf(ab({ n: 1, state: 'active', to: { ...to, pick: { exactly: 2 } } })).length,
    ).toBeGreaterThan(0);
  });
});

describe('G8 turnLifeFaceDown cost', () => {
  const mk = (life: (string | { card: string; faceUp: boolean })[]) => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE], life }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { draw: 1 } }], [{ turnLifeFaceDown: 1 }]),
    ]);
    return g;
  };

  it('turns the top face-up Life card face-down: hidden from both players, under a fresh handle', () => {
    const g = mk([{ card: V.c2, faceUp: true }, V.c3]);
    const before = project(g.state, 'p2').zones.p1.life[0]!;
    expect(before.card).toBe(V.c2);
    run(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    for (const viewer of ['p1', 'p2'] as const) {
      const after = project(g.state, viewer).zones.p1.life[0]!;
      expect(after.card).toBeNull();
      expect(after.faceUp).toBe(false);
      expect(after.handle).not.toBe(before.handle);
    }
    // The event names no card.
    const ev = g.eventsOfType('LifeTurnedFaceDown')[0]!;
    expect(ev).toMatchObject({ player: 'p1', count: 1 });
    expect(JSON.stringify(project(g.state, 'p2'))).not.toContain(V.c2);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('is not payable when the top Life card is already face-down, or there is none', () => {
    expect(offered(mk([V.c2, V.c3]))).toBe(false);
    expect(offered(mk([]))).toBe(false);
    expect(dec(mk([{ card: V.c2, faceUp: true }]))?.kind).toBe('main');
    expect(offered(mk([{ card: V.c2, faceUp: true }]))).toBe(true);
  });
});

describe('G9 returnDon of active cost-area DON!! only', () => {
  const mk = (cost: Cost, active: number, rested: number) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE, { card: V.c1, don: 1 }],
        costArea: { active, rested },
      },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { draw: 1 } }], [cost])]);
    return g;
  };
  const active2: Cost = { returnDon: { n: 2, state: 'active' } };

  it('returns active DON!! only, asking nothing; rested and given DON!! stay', () => {
    const g = mk(active2, 2, 1);
    const deck = queries.don(g.state, 'p1').deck;
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(queries.don(g.state, 'p1')).toMatchObject({
      active: 0,
      rested: 1,
      given: 1,
      deck: deck + 2,
    });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('rested DON!! do not count: one active DON!! cannot pay for two, though two DON!! of any kind could', () => {
    expect(offered(mk(active2, 1, 3))).toBe(false);
    expect(offered(mk({ returnDon: 2 }, 1, 3))).toBe(true);
    expect(offered(mk(active2, 2, 0))).toBe(true);
  });

  it('validates the object form', () => {
    const ab = (returnDon: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ returnDon }],
      effect: [{ do: { draw: 1 } }],
    });
    expect(errorsOf(ab({ n: 2, state: 'active' }))).toEqual([]);
    expect(errorsOf(ab({ n: 2, state: 'rested' })).length).toBeGreaterThan(0);
    expect(errorsOf(ab({ n: 2 })).length).toBeGreaterThan(0);
  });
});
