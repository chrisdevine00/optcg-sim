/**
 * M6b wave 5, G41: turn all of your Life cards face-down (EB03-051) and count the face-up ones
 * (EB03-051, PRB02-018: "If you have a face-up Life card"). Planted on vanilla cards; each test
 * fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { withAbilities } from '../../../src/testing.ts';
import { BLUE, game, hand, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

type Life = (string | { card: string; faceUp: boolean })[];
const mk = (life: Life, effect: unknown[], oppLife?: Life) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], life },
    { leader: PLAIN_BLUE, characters: [PURPLE], ...(oppLife ? { life: oppLife } : {}) },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
  return g;
};
const down = { do: { turnLifeFaceDown: 'all' } };
const faceUps = (g: ReturnType<typeof mk>, p: 'p1' | 'p2' = 'p1') =>
  g.zone(p, 'life').map((c) => c.faceUp);

describe('G41 turn all of your Life cards face-down', () => {
  it('validates, and refuses another form', () => {
    main([down] as never);
    for (const bad of [1, true, 'top', { n: 2 }])
      expect(
        errorsOf({
          id: 'a',
          kind: 'activate',
          when: 'activateMain',
          effect: [{ do: { turnLifeFaceDown: bad } }],
        }),
      ).not.toEqual([]);
  });

  it('turns every face-up Life card face-down and leaves the face-down ones alone', () => {
    const g = mk([{ card: V.c2, faceUp: true }, V.c3, { card: V.c4, faceUp: true }], [down]);
    expect(faceUps(g)).toEqual([true, false, true]);
    const before = project(g.state, 'p2').zones.p1.life.map((c) => c.handle);
    run(g);
    expect(faceUps(g)).toEqual([false, false, false]);
    // The order is kept; the cards that turned have fresh handles, the one that did not keeps its own.
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c2, V.c3, V.c4]);
    for (const viewer of ['p1', 'p2'] as const) {
      const after = project(g.state, viewer).zones.p1.life;
      expect(after.every((c) => c.card === null && c.faceUp === false)).toBe(true);
      expect(after[0]!.handle).not.toBe(before[0]);
      expect(after[1]!.handle).toBe(before[1]);
      expect(after[2]!.handle).not.toBe(before[2]);
    }
    // The event says how many, and names no card.
    expect(g.eventsOfType('LifeTurnedFaceDown')).toMatchObject([{ player: 'p1', count: 2 }]);
    expect(JSON.stringify(project(g.state, 'p2'))).not.toContain(V.c2);
  });

  it('with no face-up Life card it does nothing: no event, and "if you do" reads it as not done', () => {
    const ifDid = [
      { do: { turnLifeFaceDown: 'all' }, label: 'turned' },
      { ifDid: 'turned', then: [{ do: { draw: 1 } }] },
    ];
    const none = mk([V.c2, V.c3], ifDid);
    run(none);
    expect(none.eventsOfType('LifeTurnedFaceDown')).toHaveLength(0);
    expect(hand(none, 'p1')).toHaveLength(0);
    const some = mk([{ card: V.c2, faceUp: true }, V.c3], ifDid);
    run(some);
    expect(hand(some, 'p1')).toHaveLength(1);
  });

  it('only your own Life: the opponent’s face-up cards stay face up', () => {
    const g = mk([{ card: V.c2, faceUp: true }], [down], [{ card: PURPLE, faceUp: true }]);
    run(g);
    expect(faceUps(g, 'p2')).toEqual([true]);
  });
});

describe('G41 lifeFaceUp as a count', () => {
  const cond = (n: unknown, op: string, k: number) => ({
    if: { cmp: [n, op, k] },
    then: [{ do: { draw: 1 } }],
  });
  const drew = (life: Life, step: unknown, oppLife?: Life) => {
    const g = mk(life, [step], oppLife);
    const before = hand(g, 'p1').length;
    run(g);
    return hand(g, 'p1').length - before;
  };

  it('validates', () => {
    main([cond({ lifeFaceUp: 'you' }, '>=', 1)] as never);
    main([cond({ lifeFaceUp: 'opponent' }, '=', 0)] as never);
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [cond({ lifeFaceUp: 'both' }, '>=', 1)],
      }),
    ).not.toEqual([]);
  });

  it('"if you have a face-up Life card" reads the face-up cards, not the Life count', () => {
    const up = { card: V.c2, faceUp: true };
    const step = cond({ lifeFaceUp: 'you' }, '>=', 1);
    expect(drew([up, V.c3], step)).toBe(1);
    expect(drew([V.c2, V.c3], step)).toBe(0);
    expect(drew([], step)).toBe(0);
  });

  it('counts each face-up card, and reads either player', () => {
    const up = { card: V.c2, faceUp: true };
    expect(drew([up, up, V.c3], cond({ lifeFaceUp: 'you' }, '=', 2))).toBe(1);
    expect(
      drew([V.c2], cond({ lifeFaceUp: 'opponent' }, '>=', 1), [{ card: PURPLE, faceUp: true }]),
    ).toBe(1);
    expect(drew([V.c2], cond({ lifeFaceUp: 'opponent' }, '>=', 1))).toBe(0);
  });

  it('after turning them all face-down the count is 0 (EB03-051: check, then turn)', () => {
    const up = { card: V.c2, faceUp: true };
    const g = mk(
      [up, V.c3],
      [
        cond({ lifeFaceUp: 'you' }, '>=', 1),
        down,
        { if: { cmp: [{ lifeFaceUp: 'you' }, '=', 0] }, then: [{ do: { draw: 1 } }] },
      ],
    );
    const before = hand(g, 'p1').length;
    run(g);
    expect(hand(g, 'p1').length - before).toBe(2);
  });
});
