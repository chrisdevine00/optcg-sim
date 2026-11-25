/**
 * M6b wave 5, G43: the `damageTaken` timing ("When you take damage", OP13-002). It fires when the
 * damage processing, [Trigger] included, has ended, once per damage, for the player who took it.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, withKeywords, type Ability } from '../../../src/testing.ts';
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
  takeDamage,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const watcher = (owner: 'you' | 'opponent', when: object[] = []): Ability =>
  ({
    id: 'w',
    kind: 'auto',
    when: [{ event: 'damageTaken', owner }, ...when],
    effect: [{ do: { draw: 1 } }],
  }) as Ability;

/** p2's turn: p2's Leader attacks p1's Leader. p1's V.c1 and p2's V.c2 may watch. */
const mk = (opts: { life?: string[]; w1?: Ability; w2?: Ability; attackChar?: boolean } = {}) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [V.c1, BLUE], life: opts.life ?? [BLUE, BLUE, BLUE] },
    { leader: PLAIN_BLUE, characters: [V.c2] },
    { activePlayer: 'p2', turn: 4 },
  );
  if (opts.w1) g.state = withAbilities(g.state, V.c1, [opts.w1]);
  if (opts.w2) g.state = withAbilities(g.state, V.c2, [opts.w2]);
  g.act({
    type: 'attack',
    attacker: g.leader('p2'),
    target: opts.attackChar ? g.find('p1', 'characters', BLUE) : g.leader('p1'),
  });
  return g;
};
const hit = (g: ReturnType<typeof mk>) => {
  passBlock(g);
  endCounter(g);
  takeDamage(g);
};

describe('G43 damageTaken', () => {
  it('validates', () => {
    expectValid([watcher('you')]);
    expect(errorsOf(watcher('you', [{ event: 'damageTaken', owner: 'both' }]))).not.toEqual([]);
    expect(errorsOf({ ...watcher('you'), when: [{ event: 'damageTaken' }] })).not.toEqual([]);
  });

  it('fires for the player who took battle damage, once', () => {
    const g = mk({ w1: watcher('you') });
    const before = hand(g, 'p1').length;
    hit(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1').length).toBe(before + 1 + 1); // the Life card, and the draw
    expect(dec(g)?.kind).toBe('main');
  });

  it('owner "opponent" watches the other player taking damage; "you" does not', () => {
    const g = mk({ w1: watcher('opponent'), w2: watcher('opponent') });
    const p1 = hand(g, 'p1').length;
    const p2 = hand(g, 'p2').length;
    hit(g);
    // p1 took the damage: p2's watcher of "your opponent takes damage" fires, p1's own does not.
    expect(hand(g, 'p2').length).toBe(p2 + 1);
    expect(hand(g, 'p1').length).toBe(p1 + 1);
  });

  it('does not fire when no damage was taken (an attack on a Character)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1, { card: BLUE, rested: true }] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [watcher('you')]);
    const before = hand(g, 'p1').length;
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.find('p1', 'characters', BLUE) });
    g.act({ type: 'block', blocker: null });
    endCounter(g);
    expect(hand(g, 'p1').length).toBe(before);
  });

  it('a Double Attack that takes 2 Life cards is one damage: it fires once', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1], life: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [watcher('you')]);
    g.state = withKeywords(g.state, PLAIN_BLUE, ['Double Attack']);
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    const before = hand(g, 'p1').length;
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(1);
    expect(hand(g, 'p1').length).toBe(before + 2 + 1); // two Life cards, one draw
  });

  it('effect damage fires it too', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1], life: [BLUE, BLUE] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, V.c1, [watcher('you')]);
    const before = hand(g, 'p1').length;
    g.state = applyOp(g.state, { op: 'damage', player: 'p1', n: 1, by: 'p2' }).state;
    takeDamage(g);
    expect(hand(g, 'p1').length).toBe(before + 1 + 1);
  });

  it('waits for the [Trigger] to resolve (rules-digest 106, QA-OP13 OP13-002)', () => {
    const g = mk({ life: [PURPLE, BLUE, BLUE], w1: watcher('you') });
    g.state = withAbilities(g.state, PURPLE, [
      { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability,
    ]);
    passBlock(g);
    endCounter(g);
    expect(dec(g)?.kind).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    const types = g.events.map((e) => (e.type === 'EffectActivated' ? `E:${e.ability}` : e.type));
    const watcherAt = types.indexOf('E:w');
    // The [Trigger] card is revealed, its effect resolves and it is trashed; only then the watcher.
    const trashedAt = g.events.findIndex(
      (e) => e.type === 'CardMoved' && e.card === PURPLE && e.to === 'trash',
    );
    expect(types.indexOf('TriggerRevealed')).toBeGreaterThan(-1);
    expect(trashedAt).toBeGreaterThan(types.indexOf('TriggerRevealed'));
    expect(watcherAt).toBeGreaterThan(trashedAt);
    expect(g.life('p1')).toBe(2);
  });

  it('a replacement that stops the damage means none was taken', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1, V.c3], life: [BLUE, BLUE] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [watcher('you')]);
    g.state = withAbilities(g.state, V.c3, [
      {
        id: 'r',
        kind: 'replacement',
        replaces: { damage: 'you' },
        optional: true,
        instead: [{ do: { draw: 1 } }],
      } as Ability,
    ]);
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    g.act({ type: 'optional', accept: true });
    expect(g.life('p1')).toBe(2);
    // One draw, from the replacement: the watcher did not fire.
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});
