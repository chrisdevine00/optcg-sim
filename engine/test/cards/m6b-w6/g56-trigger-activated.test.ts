/**
 * M6b wave 6, G56: the timing `triggerActivated` ("when your opponent activates an Event or
 * [Trigger]", OP11-102 Camie; "when a [Trigger] activates", OP13-106 Conney). It fires when a Life
 * card's [Trigger] is activated, not when the card is only added to the hand, and resolves after the
 * [Trigger] has. Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, withKeywords, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const watcher = (by: string, extra: Partial<Ability> = {}): Ability =>
  ({
    id: 'w',
    kind: 'auto',
    when: [{ event: 'triggerActivated', by }],
    effect: [{ do: { draw: 1 } }],
    ...extra,
  }) as Ability;
const trigger = { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability;

/** p2's Leader attacks p1's Leader. p1's V.c1 and p2's V.c2 may watch; p1's Life cards are PURPLE. */
const mk = (w1?: Ability, w2?: Ability, life: string[] = [PURPLE, PURPLE, BLUE]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [V.c1], life },
    { leader: PLAIN_BLUE, characters: [V.c2] },
    { activePlayer: 'p2', turn: 4 },
  );
  g.state = withAbilities(g.state, PURPLE, [trigger]);
  if (w1) g.state = withAbilities(g.state, V.c1, [w1]);
  if (w2) g.state = withAbilities(g.state, V.c2, [w2]);
  g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  return g;
};

describe('G56 a [Trigger] activates', () => {
  it('validates, and refuses the nonsense', () => {
    expectValid([watcher('you'), { ...watcher('any'), id: 'x' }]);
    expect(errorsOf(watcher('both'))).not.toEqual([]);
    expect(errorsOf({ ...watcher('you'), when: [{ event: 'triggerActivated' }] })).not.toEqual([]);
  });

  it('fires for the watcher of the player whose [Trigger] activated, after the [Trigger] resolved', () => {
    const g = mk(watcher('you'));
    const before = hand(g, 'p1').length;
    expect(dec(g)?.kind).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    // The [Trigger] drew a card; the watcher drew another.
    expect(hand(g, 'p1').length).toBe(before + 2);
    const names = g.events.map((e) => (e.type === 'EffectActivated' ? `E:${e.ability}` : e.type));
    expect(names.indexOf('E:w')).toBeGreaterThan(names.indexOf('E:t'));
    expect(g.eventsOfType('TriggerRevealed')).toHaveLength(1);
  });

  it('`by: opponent` watches the other player’s [Trigger], and `you` does not fire for it', () => {
    const g = mk(watcher('you'), watcher('opponent'));
    const p1 = hand(g, 'p1').length;
    const p2 = hand(g, 'p2').length;
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p2').length).toBe(p2 + 1); // p2's watcher of "your opponent's [Trigger]"
    expect(hand(g, 'p1').length).toBe(p1 + 2); // the [Trigger] and p1's own watcher
    const only = mk(undefined, watcher('you'));
    const q2 = hand(only, 'p2').length;
    only.act({ type: 'trigger', activate: true });
    expect(hand(only, 'p2').length).toBe(q2); // "you" is p2's own [Trigger]: none
  });

  it('`by: any` is either player’s [Trigger]', () => {
    const g = mk(watcher('any'), watcher('any'));
    const p1 = hand(g, 'p1').length;
    const p2 = hand(g, 'p2').length;
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p2').length).toBe(p2 + 1);
    expect(hand(g, 'p1').length).toBe(p1 + 2);
  });

  it('does not fire when the Life card is only added to the hand, [Trigger] or not', () => {
    const g = mk(watcher('any'), watcher('any'));
    const p1 = hand(g, 'p1').length;
    const p2 = hand(g, 'p2').length;
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1').length).toBe(p1 + 1);
    expect(hand(g, 'p2').length).toBe(p2);
    expect(g.eventsOfType('TriggerRevealed')).toHaveLength(0);
    const plain = mk(watcher('any'), undefined, [BLUE, BLUE, BLUE]);
    const q1 = hand(plain, 'p1').length;
    plain.act({ type: 'trigger', activate: false });
    expect(hand(plain, 'p1').length).toBe(q1 + 1);
  });

  it('a shared Once Per Turn fires once for two Triggers in a turn (Camie)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1], life: [PURPLE, PURPLE, BLUE] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, PURPLE, [trigger]);
    g.state = withAbilities(g.state, V.c1, [watcher('you', { oncePerTurn: true })]);
    g.state = withKeywords(g.state, PLAIN_BLUE, ['Double Attack']);
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    const before = hand(g, 'p1').length;
    g.act({ type: 'trigger', activate: true });
    g.act({ type: 'trigger', activate: true });
    // Two [Trigger] draws, and one watcher draw.
    expect(hand(g, 'p1').length).toBe(before + 3);
  });

  it('without Once Per Turn it fires for each [Trigger]', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1], life: [PURPLE, PURPLE, BLUE] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, PURPLE, [trigger]);
    g.state = withAbilities(g.state, V.c1, [watcher('you')]);
    g.state = withKeywords(g.state, PLAIN_BLUE, ['Double Attack']);
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    const before = hand(g, 'p1').length;
    g.act({ type: 'trigger', activate: true });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1').length).toBe(before + 4);
  });
});
