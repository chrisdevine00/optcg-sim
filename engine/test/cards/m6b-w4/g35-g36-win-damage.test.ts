/**
 * M6b wave 4, G35 (`winGame`) and G36 (`damage`). Planted on vanilla cards; each test fails with the
 * gap reverted. Damage is the real thing: the Life card goes to the hand unless its [Trigger] is
 * activated, and an effect that damages a player with no Life card defeats them (RL-22).
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, queries } from '@optcg/engine';
import { withAbilities, withKeywords, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const raw = (effect: unknown[]) => ({ id: 'a', kind: 'activate', when: 'activateMain', effect });
const dmg = (player: 'you' | 'opponent', n: unknown = 1) => ({ do: { damage: { player, n } } });

describe('G36 damage', () => {
  const mk = (
    p1Life: string[] = [BLUE, BLUE, BLUE],
    p2Life: string[] = [PURPLE, PURPLE, PURPLE],
  ) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: p1Life },
      { leader: PLAIN_BLUE, life: p2Life },
    );
    return g;
  };
  const withDamage = (g: ReturnType<typeof mk>, player: 'you' | 'opponent', n: unknown = 1) => {
    g.state = withAbilities(g.state, BLUE, [main([dmg(player, n)] as never)]);
    return g;
  };

  it('validates: a player and a number', () => {
    expectValid([main([dmg('you'), dmg('opponent', { life: 'you' })] as never)]);
    expect(errorsOf(raw([{ do: { damage: { player: 'both', n: 1 } } }]))).not.toEqual([]);
    expect(errorsOf(raw([{ do: { damage: { player: 'you' } } }]))).not.toEqual([]);
    expect(errorsOf(raw([{ do: { damage: { player: 'you', n: 'one' } } }]))).not.toEqual([]);
  });

  it('"deal 1 damage to your opponent": they may add the Life card to their hand', () => {
    const g = withDamage(mk(), 'opponent');
    run(g);
    expectDecision(g, 'trigger', 'p2');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toEqual([PURPLE]);
    expectDecision(g, 'main', 'p1');
  });

  it('"you take 1 damage": your own Life card, your decision', () => {
    const g = withDamage(mk(), 'you');
    run(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toContain(BLUE);
  });

  it('the Life card’s [Trigger] can be activated', () => {
    const g = withDamage(mk(), 'opponent');
    g.state = withAbilities(g.state, PURPLE, [
      { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability,
    ]);
    run(g);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p2')).toHaveLength(1); // the draw
    expect(trash(g, 'p2')).toEqual([PURPLE]); // the Life card, once its [Trigger] is done
  });

  it('N damage is N Life cards, one decision each', () => {
    const g = withDamage(mk(), 'opponent', 2);
    run(g);
    g.act({ type: 'trigger', activate: false });
    expectDecision(g, 'trigger', 'p2');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p2')).toBe(1);
  });

  it('the amount is a number read when it resolves', () => {
    const g = withDamage(mk(), 'opponent', { life: 'you' });
    run(g);
    g.act({ type: 'trigger', activate: false });
    g.act({ type: 'trigger', activate: false });
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p2')).toBe(0);
  });

  it('at 0 Life the damage defeats the player (RL-22)', () => {
    const g = withDamage(mk([BLUE], []), 'opponent');
    run(g);
    expect(queries.result(g.state)).toMatchObject({ winner: 'p1' });
    const me = withDamage(mk([], [PURPLE]), 'you');
    run(me);
    expect(queries.result(me.state)).toMatchObject({ winner: 'p2' });
  });

  it('the effect goes on after the damage is dealt', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [main([dmg('opponent'), { do: { draw: 1 } }] as never)]);
    const before = hand(g, 'p1').length;
    run(g);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('shows the other player nothing of the Life card, [Trigger] or not', () => {
    const play = (top: string, trigger: boolean) => {
      const g = withDamage(mk(undefined, [top, PURPLE, PURPLE]), 'opponent');
      if (trigger)
        g.state = withAbilities(g.state, top, [
          { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability,
        ]);
      run(g);
      return g;
    };
    const a = play(V.c3, true); // has a [Trigger]
    const b = play(V.c4, false); // has none
    const seen = (g: ReturnType<typeof mk>) =>
      JSON.stringify([project(g.state, 'p1'), projectEvents(g.events, 'p1')]);
    expect(seen(a)).toBe(seen(b));
    expect(dec(a)?.kind).toBe('trigger');
  });
});

describe('G35 winGame', () => {
  it('validates', () => {
    expectValid([main([{ do: { winGame: true } }] as never)]);
    expect(errorsOf(raw([{ do: { winGame: false } }]))).not.toEqual([]);
  });

  it('"you win the game" ends the game for its controller at once', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { winGame: true } }, { do: { draw: 1 } }] as never),
    ]);
    const before = hand(g, 'p1').length;
    run(g);
    expect(queries.result(g.state)).toMatchObject({ winner: 'p1' });
    expect(hand(g, 'p1')).toHaveLength(before); // nothing after the win resolves
    expect(g.legal()).toEqual([]);
  });

  it('is the opponent’s win when their effect says so', () => {
    const g = game(
      { leader: PLAIN_PURPLE },
      { leader: PLAIN_BLUE, characters: [BLUE] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { winGame: true } }] as never)]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', BLUE), ability: 'a' });
    expect(queries.result(g.state)).toMatchObject({ winner: 'p2' });
  });

  // OP09-118 Gol.D.Roger: "When your opponent activates [Blocker], if either you or your opponent
  // has 0 Life cards, you win the game."
  const roger = {
    id: 'win',
    kind: 'auto',
    when: [{ event: 'blockerActivated', by: 'opponent' }],
    conditions: [
      {
        any: [{ cmp: [{ life: 'you' }, '=', 0] }, { cmp: [{ life: 'opponent' }, '=', 0] }],
      },
    ],
    effect: [{ do: { winGame: true } }],
  } as Ability;
  const blocked = (p2Life: string[]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      { leader: PLAIN_BLUE, characters: [V.c1], life: p2Life },
    );
    g.state = withKeywords(withAbilities(g.state, V.c7, [roger]), V.c1, ['Blocker']);
    expectValid([roger]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: g.leader('p2') });
    g.act({ type: 'block', blocker: g.find('p2', 'characters', V.c1) });
    return g;
  };

  it('the Roger shape: a Blocker activated while a player has 0 Life wins', () => {
    expect(queries.result(blocked([]).state)).toMatchObject({ winner: 'p1' });
  });

  it('... and not while both players have Life cards', () => {
    expect(queries.result(blocked([PURPLE, PURPLE]).state)).toBeNull();
  });
});
