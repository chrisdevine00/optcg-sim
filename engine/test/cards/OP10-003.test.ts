/** OP10-003 Sugar (Leader). */
import { describe, expect, it } from 'vitest';
import { expectDecision, don, option, passBlock, play, V } from './helpers.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { DP, mk, OPP } from './helpers-a10g1.ts';

const ID = 'OP10-003';
/** [Counter] Your Leader gains +3000 power during this battle (cost 1). */
const COUNTER_EVENT = 'OP12-038';
/** An unscripted Event given a [Main] that does nothing, to play on your own turn. */
const MAIN_EVENT = 'ST02-017';

describe('OP10-003 Sugar', () => {
  const endOfTurn = (chars: string[], p2chars: string[] = []) =>
    mk(
      { leader: ID, characters: chars, costArea: { active: 3, rested: 2 } },
      { characters: p2chars },
    );

  it('[End of Your Turn]: with a {Donquixote Pirates} Character of 6000 power or more, sets up to 1 DON!! as active', () => {
    const g = endOfTurn([DP.p6]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
  });

  it('"up to 1": none may be set', () => {
    const g = endOfTurn([DP.p6]);
    g.act({ type: 'endTurn' });
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('boundary: 5000 power is not enough; a 6000 Character that is not {Donquixote Pirates} does not count', () => {
    const g = endOfTurn([DP.p5, V.c4]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it("only your own Characters count: an opponent's {Donquixote Pirates} 7000 does not", () => {
    const g = endOfTurn([], [DP.p7]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  /** p2 attacks p1's Leader; p1 holds `events` Counter Events and is at the Counter Step. */
  const counterStep = (events: string[]) => {
    const g = mk(
      { leader: ID, hand: events, costArea: { active: 5, rested: 0 } },
      { characters: [V.c7] },
      OPP,
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    expectDecision(g, 'counter', 'p1');
    return g;
  };
  const counter = (g: ReturnType<typeof counterStep>, nth = 0) =>
    g.act({ type: 'activate', card: g.find('p1', 'hand', COUNTER_EVENT, nth), ability: 'counter' });

  it("[Opponent's Turn] [Once Per Turn]: when you activate an Event, adds up to 1 DON!! from the DON!! deck and sets it as active", () => {
    const g = counterStep([COUNTER_EVENT]);
    const before = don(g, 'p1');
    counter(g);
    if (
      g
        .legal()
        .some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice)
    )
      option(g, '1');
    const after = don(g, 'p1');
    // The Event costs 1 (rested); the added DON!! is active.
    expect(after.active).toBe(before.active - 1 + 1);
    expect(after.rested).toBe(before.rested + 1);
    expect(after.deck).toBe(before.deck - 1);
  });

  it('[Once Per Turn]: a second Event in the same turn adds nothing', () => {
    const g = counterStep([COUNTER_EVENT, COUNTER_EVENT]);
    counter(g, 0);
    if (
      g
        .legal()
        .some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice)
    )
      option(g, '1');
    expectDecision(g, 'counter', 'p1');
    const mid = don(g, 'p1');
    counter(g, 0);
    expect(don(g, 'p1')).toMatchObject({
      active: mid.active - 1,
      rested: mid.rested + 1,
      deck: mid.deck,
    });
  });

  it('must not add DON!! when you activate an Event on your own turn', () => {
    const g = mk({ leader: ID, hand: [MAIN_EVENT], costArea: { active: 5, rested: 0 } });
    g.state = withAbilities(g.state, MAIN_EVENT, [
      { id: 'm', kind: 'activate', when: 'main', effect: [{ do: { draw: 0 } }] } as Ability,
    ]);
    const before = don(g, 'p1');
    play(g, MAIN_EVENT);
    const after = don(g, 'p1');
    expect(after.deck).toBe(before.deck);
    expect(after.active + after.rested).toBe(before.active + before.rested);
  });

  it('must not add DON!! when only the opponent activates an Event', () => {
    const g = mk(
      { leader: ID, characters: [V.c7], costArea: { active: 5, rested: 0 } },
      { hand: [COUNTER_EVENT], costArea: { active: 3, rested: 0 } },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: g.leader('p2') });
    passBlock(g);
    const before = don(g, 'p1');
    g.act({ type: 'activate', card: g.find('p2', 'hand', COUNTER_EVENT), ability: 'counter' });
    expect(don(g, 'p1')).toEqual(before);
  });
});
