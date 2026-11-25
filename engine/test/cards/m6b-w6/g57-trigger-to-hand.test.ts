/**
 * M6b wave 6, G57: a [Trigger] that ends "... and add this card to your hand" (OP12-109 Pacifista,
 * OP12-113 Roronoa Zoro, ST20-003 Charlotte Brulee). `move` of `self` to your hand, only from a
 * [Trigger]: the card stays in the [Trigger] slot while the effect resolves and then goes to the
 * hand instead of the trash (CR 10-1-5-3). Planted on vanilla cards; each test fails with the gap
 * reverted.
 */
import { describe, expect, it } from 'vitest';
import { projectEvents } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
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
  trash,
  V,
} from '../helpers.ts';
import { errorsOf } from '../m6b-w1/probe.ts';

const addSelf = (over: object = {}, to: object = { zone: 'hand' }) => ({
  do: { move: { what: { from: 'self', owner: 'you', pick: { exactly: 1 }, ...over }, to } },
});
const koSmall = {
  do: {
    ko: { from: 'characters', owner: 'opponent', filter: { cost: { lte: 1 } }, pick: { upTo: 1 } },
  },
};
const trig = (effect: unknown[]): Ability =>
  ({ id: 't', kind: 'trigger', effect }) as unknown as Ability;

/** p1's top Life card is PURPLE with the [Trigger]; p2 attacks p1's Leader. */
const mk = (effect: unknown[] = [koSmall, addSelf()]) => {
  const g = game(
    { leader: PLAIN_PURPLE, life: [PURPLE, BLUE, BLUE] },
    { leader: PLAIN_BLUE, characters: [V.c1, V.c3] },
    { activePlayer: 'p2', turn: 4 },
  );
  g.state = withAbilities(g.state, PURPLE, [trig(effect)]);
  g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  return g;
};

describe('G57 [Trigger]: add this card to your hand', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (e: unknown, kind = 'trigger') =>
      errorsOf(
        kind === 'trigger'
          ? { id: 't', kind: 'trigger', effect: [e] }
          : { id: 'a', kind: 'auto', when: ['onPlay'], effect: [e] },
      );
    expect(bad(addSelf())).toEqual([]);
    // Only a [Trigger] moves "this card" out of its resolving slot.
    expect(bad(addSelf(), 'auto')).not.toEqual([]);
    expect(bad(addSelf({ owner: 'opponent' }))).not.toEqual([]);
    expect(bad(addSelf({ pick: { upTo: 1 } }))).not.toEqual([]);
    expect(bad(addSelf({ filter: { cost: { lte: 1 } } }))).not.toEqual([]);
    expect(bad(addSelf({ from: ['self', 'hand'] }))).not.toEqual([]);
    expect(bad(addSelf({}, { zone: 'trash' }))).not.toEqual([]);
    expect(bad(addSelf({}, { zone: 'deck', position: 'bottom' }))).not.toEqual([]);
    expect(bad(addSelf({}, { zone: 'hand', faceUp: true }))).not.toEqual([]);
  });

  it('K.O.s, then the card goes to the hand and not to the trash', () => {
    const g = mk();
    expect(dec(g)?.kind).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    // "Up to 1": the cost 1 Character is chosen.
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1) });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c3]);
    expect(hand(g, 'p1')).toContain(PURPLE);
    expect(trash(g, 'p1')).not.toContain(PURPLE);
    expect(g.life('p1')).toBe(2);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('is a [Trigger] effect only: declining it adds the card to the hand as for any damage', () => {
    const g = mk();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toContain(PURPLE);
    expect(g.eventsOfType('TriggerRevealed')).toHaveLength(0);
  });

  it('a card with other steps after it still resolves them; the card is in the hand by then', () => {
    const g = mk([addSelf(), { do: { draw: 1 } }]);
    const before = hand(g, 'p1').length;
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(before + 2);
    expect(hand(g, 'p1')).toContain(PURPLE);
  });

  it('the other player saw the [Trigger] revealed, and sees the card go to a hand without a handle', () => {
    const g = mk();
    g.act({ type: 'trigger', activate: true });
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1) });
    const told = projectEvents(g.events, 'p2');
    const moved = told.find(
      (e) => e.type === 'CardMoved' && e.from === 'resolving' && e.to === 'hand',
    );
    expect(moved).toBeDefined();
    expect(moved!.card).toBe(PURPLE); // revealed as the [Trigger]: nothing new is told
    expect(moved!.newInstance).toBeUndefined(); // but where it is in the hand is not
  });

  it('if the effect already put the card elsewhere, nothing moves and nothing breaks', () => {
    const g = mk([{ do: { play: { what: { from: 'self', owner: 'you' } } } }, addSelf()]);
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PURPLE]);
    expect(hand(g, 'p1')).not.toContain(PURPLE);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });
});
