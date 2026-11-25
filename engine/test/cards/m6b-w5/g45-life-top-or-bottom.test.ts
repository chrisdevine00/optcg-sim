/**
 * M6b wave 5, G45: the action "add 1 card from the top or bottom of your Life cards to your hand"
 * (OP09-104), the controller choosing the end. Planted on vanilla cards; each test fails with the
 * gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { projectEvents } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const move = (over: object = {}, to: object = { zone: 'hand' }) => ({
  do: {
    move: {
      what: { from: 'lifeTopOrBottom', owner: 'you', pick: { exactly: 1 }, ...over },
      to,
    },
  },
});
const mk = (life: string[], step: unknown = move()) => {
  const g = game({ leader: PLAIN_PURPLE, characters: [BLUE], life }, { leader: PLAIN_BLUE });
  g.state = withAbilities(g.state, BLUE, [main([step] as never)]);
  return g;
};

describe('G45 move from the top or bottom of Life to the hand', () => {
  it('validates, and refuses the nonsense', () => {
    main([move()] as never);
    const bad = (s: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [s] });
    expect(bad(move({ owner: 'opponent' }))).not.toEqual([]);
    expect(bad(move({ pick: { upTo: 1 } }))).not.toEqual([]);
    expect(bad(move({}, { zone: 'trash' }))).not.toEqual([]);
    expect(bad(move({}, { zone: 'deck', position: 'top' }))).not.toEqual([]);
    expect(bad(move({}, { zone: 'hand', faceUp: true }))).not.toEqual([]);
    expect(bad(move({ from: ['lifeTopOrBottom', 'hand'] }))).not.toEqual([]);
  });

  it('asks top or bottom and takes the top Life card', () => {
    const g = mk([V.c2, V.c3, V.c4]);
    run(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'top');
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c3, V.c4]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('takes the bottom Life card when asked for the bottom', () => {
    const g = mk([V.c2, V.c3, V.c4]);
    run(g);
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c2, V.c3]);
  });

  it('with one Life card there is nothing to choose; with none, nothing happens', () => {
    const one = mk([V.c2]);
    run(one);
    expect(dec(one)?.kind).toBe('main');
    expect(hand(one, 'p1')).toEqual([V.c2]);
    expect(one.life('p1')).toBe(0);

    const none = mk([]);
    run(none);
    expect(hand(none, 'p1')).toEqual([]);
    expect(none.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('is not damage: a [Trigger] on the card is not offered, and Life watchers fire', () => {
    const g = mk([PURPLE, V.c3]);
    g.state = withAbilities(g.state, PURPLE, [
      { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability,
    ]);
    const watcher = {
      id: 'w',
      kind: 'auto',
      when: [{ event: 'lifeRemoved', owner: 'you' }],
      effect: [{ do: { draw: 1 } }],
    } as Ability;
    g.state = withAbilities(g.state, BLUE, [main([move()] as never), watcher]);
    run(g);
    option(g, 'top');
    expect(g.eventsOfType('TriggerRevealed')).toHaveLength(0);
    // The Life card, and the watcher's draw.
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('is blind: the question does not depend on the cards, and the card moved stays unnamed', () => {
    const a = mk([V.c2, V.c3, V.c4]);
    const b = mk([V.c5, V.c6, V.c7]);
    run(a);
    run(b);
    expect(JSON.stringify(dec(a)?.options)).toBe(JSON.stringify(dec(b)?.options));
    option(a, 'bottom');
    // The other player sees a Life card go to the hand, not which one.
    const told = JSON.stringify(projectEvents(a.events, 'p2'));
    expect(told).not.toContain(V.c4);
    expect(told).not.toContain(V.c2);
  });
});
