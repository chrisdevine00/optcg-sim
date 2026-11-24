/**
 * M6b wave 4, G30: the top Life card to the trash, as an effect (`move` from `lifeTop`), as a cost
 * (`trashLife`) and as a replacement payload. It is not damage, so no [Trigger] is offered, and it
 * fires the Life watchers like any Life move. Planted on vanilla cards; each test fails with the
 * gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents } from '@optcg/engine';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, trash, V } from '../helpers.ts';
import { errorsOf, expectValid, main, offered, run } from '../m6b-w1/probe.ts';

const lifeMove = (owner: 'you' | 'opponent' | 'any', pick: object | undefined) => ({
  do: {
    move: {
      what: { from: 'lifeTop', owner, ...(pick ? { pick } : {}) },
      to: { zone: 'trash' },
    },
  },
});

/** An [Activate: Main] that is not checked as valid: for the shapes the validator must refuse. */
const raw = (effect: unknown[], cost?: unknown[]) => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  effect,
  ...(cost ? { cost } : {}),
});

const two = (extra: object = {}) =>
  game(
    { leader: PLAIN_PURPLE, characters: [BLUE], ...extra },
    { leader: PLAIN_BLUE, characters: [PURPLE] },
  );

describe('G30 Life to trash as an effect', () => {
  it('validates: to the trash only, a pick of 1, "any" only with exactly 1', () => {
    for (const owner of ['you', 'opponent'] as const)
      for (const pick of [{ upTo: 1 }, { exactly: 1 }])
        expectValid([main([lifeMove(owner, pick)] as never)]);
    expectValid([main([lifeMove('any', { exactly: 1 })] as never)]);
    expect(errorsOf(raw([lifeMove('any', { upTo: 1 })]))).not.toEqual([]);
    expect(errorsOf(raw([lifeMove('opponent', undefined)]))).not.toEqual([]);
    const toDeck = {
      do: {
        move: {
          what: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'top' },
        },
      },
    };
    expect(errorsOf(raw([toDeck]))).not.toEqual([]);
    // "any" to a hand would silently read as "you": refused.
    const anyHand = {
      do: {
        move: {
          what: { from: 'lifeTop', owner: 'any', pick: { exactly: 1 } },
          to: { zone: 'hand' },
        },
      },
    };
    expect(errorsOf(raw([anyHand]))).not.toEqual([]);
  });

  it("trashes the top card of your opponent's Life, face up, and fires no [Trigger]", () => {
    const g = two();
    // The opponent's top Life card has a [Trigger] that would draw a card, if it were activated.
    g.state = withAbilities(g.state, PURPLE, [
      { id: 't', kind: 'trigger', effect: [{ do: { draw: 1 } }] } as Ability,
    ]);
    g.state = withAbilities(g.state, BLUE, [main([lifeMove('opponent', { exactly: 1 })] as never)]);
    const before = hand(g, 'p2').length;
    run(g);
    expect(g.life('p2')).toBe(2);
    expect(trash(g, 'p2')).toEqual([PURPLE]);
    expect(dec(g)?.kind).toBe('main'); // no trigger decision
    expect(hand(g, 'p2')).toHaveLength(before);
    expect(g.events.some((e) => e.type === 'TriggerRevealed')).toBe(false);
  });

  it('"up to 1" is asked and may be declined; "exactly 1" is not asked', () => {
    const mk = (pick: object) => {
      const g = two();
      g.state = withAbilities(g.state, BLUE, [main([lifeMove('opponent', pick)] as never)]);
      run(g);
      return g;
    };
    const opt = mk({ upTo: 1 });
    expect(dec(opt)?.kind).toBe('optional');
    opt.act({ type: 'optional', accept: false });
    expect(opt.life('p2')).toBe(3);
    const yes = mk({ upTo: 1 });
    yes.act({ type: 'optional', accept: true });
    expect(yes.life('p2')).toBe(2);
    expect(dec(mk({ exactly: 1 }))?.kind).toBe('main');
  });

  it('your own Life, and each player at once (OP11-102)', () => {
    const own = two();
    own.state = withAbilities(own.state, BLUE, [main([lifeMove('you', { exactly: 1 })] as never)]);
    run(own);
    expect([own.life('p1'), own.life('p2')]).toEqual([2, 3]);
    const both = two();
    both.state = withAbilities(both.state, BLUE, [
      main([lifeMove('any', { exactly: 1 })] as never),
    ]);
    run(both);
    expect([both.life('p1'), both.life('p2')]).toEqual([2, 2]);
    expect(trash(both, 'p1')).toEqual([BLUE]);
    expect(trash(both, 'p2')).toEqual([PURPLE]);
  });

  it('with no Life card there is nothing to trash and nothing is asked', () => {
    const g0 = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE, life: [] });
    g0.state = withAbilities(g0.state, BLUE, [main([lifeMove('opponent', { upTo: 1 })] as never)]);
    run(g0);
    expect(dec(g0)?.kind).toBe('main');
    expect(g0.life('p2')).toBe(0);
  });

  it('is a Life removal: the watchers fire', () => {
    const g2 = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g2.state = withAbilities(g2.state, V.c1, [
      {
        id: 'w',
        kind: 'auto',
        when: [{ event: 'lifeRemoved', owner: 'any' }],
        effect: [{ do: { draw: 1 } }],
      } as Ability,
    ]);
    g2.state = withAbilities(g2.state, BLUE, [
      main([lifeMove('opponent', { exactly: 1 })] as never),
    ]);
    const before = hand(g2, 'p1').length;
    run(g2);
    expect(hand(g2, 'p1')).toHaveLength(before + 1);
  });
});

describe('G30 Life to trash as a cost', () => {
  const costed = (life: number) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], life: Array(life).fill(BLUE) },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { draw: 1 } }], [{ trashLife: 1 }] as never),
    ]);
    return g;
  };

  it('validates: a whole number of 1 or more', () => {
    expectValid([main([{ do: { draw: 1 } }], [{ trashLife: 2 }] as never)]);
    expect(errorsOf(raw([{ do: { draw: 1 } }], [{ trashLife: 0 }]))).not.toEqual([]);
    expect(errorsOf(raw([{ do: { draw: 1 } }], [{ trashLife: 'a' }]))).not.toEqual([]);
  });

  it('pays by trashing the top Life card; not offered with no Life', () => {
    const g = costed(3);
    expect(offered(g)).toBe(true);
    const before = hand(g, 'p1').length;
    run(g);
    expect(g.life('p1')).toBe(2);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
    expect(offered(costed(0))).toBe(false);
  });

  it('a cost trashes a card without a [Trigger]', () => {
    const g = costed(3);
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { draw: 1 } }], [{ trashLife: 1 }] as never),
    ]);
    run(g);
    expect(g.events.some((e) => e.type === 'TriggerRevealed')).toBe(false);
  });
});

describe('G30 Life to trash as a replacement payload (ST20-002)', () => {
  const mk = (life: number) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], life: Array(life).fill(V.c2) },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'r',
        kind: 'replacement',
        replaces: {
          ko: { from: 'characters', owner: 'you', filter: { isSelf: true } },
          cause: 'effect',
        },
        optional: true,
        oncePerTurn: true,
        instead: [{ trashLife: 1 }],
      } as Ability,
    ]);
    expectValid([
      {
        id: 'r',
        kind: 'replacement',
        replaces: {
          ko: { from: 'characters', owner: 'you', filter: { isSelf: true } },
          cause: 'effect',
        },
        optional: true,
        instead: [{ trashLife: 1 }],
      } as Ability,
    ]);
    return g;
  };
  const ko = (g: ReturnType<typeof mk>) =>
    (g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', V.c1),
      by: 'p2',
    }).state);

  it('K.O. by an effect: accepting trashes a Life card and the Character stays', () => {
    const g = mk(3);
    ko(g);
    expect(dec(g)?.kind).toBe('optional');
    g.act({ type: 'optional', accept: true });
    expect(g.life('p1')).toBe(2);
    expect(g.zone('p1', 'characters').some((c) => c.card === V.c1)).toBe(true);
  });

  it('with no Life card the replacement cannot be applied, so the K.O. happens', () => {
    const g = mk(0);
    ko(g);
    expect(g.zone('p1', 'characters').some((c) => c.card === V.c1)).toBe(false);
  });
});

describe('G30 hidden information', () => {
  // Two positions that differ only in the card under the top of p2's Life: the other player's
  // projection (view and events) must be the same after the top card is trashed, whichever way.
  const pos = (second: string, build: (g: ReturnType<typeof game>) => void) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE], life: [PURPLE, second, PURPLE] },
    );
    build(g);
    return g;
  };
  const seen = (g: ReturnType<typeof game>, viewer: 'p1' | 'p2') =>
    JSON.stringify([project(g.state, viewer), projectEvents(g.events, viewer)]);

  it("trashing the opponent's top Life card reveals that card only", () => {
    const run1 = (second: string) => {
      const g = pos(second, (x) => {
        x.state = withAbilities(x.state, BLUE, [
          main([lifeMove('opponent', { upTo: 1 })] as never),
        ]);
      });
      run(g);
      g.act({ type: 'optional', accept: true });
      return g;
    };
    const a = run1(V.c3);
    const b = run1(V.c4);
    expect(seen(a, 'p1')).toBe(seen(b, 'p1'));
    expect(seen(a, 'p2')).toBe(seen(b, 'p2'));
    expect(JSON.stringify(project(a.state, 'p1'))).not.toContain(V.c3);
  });

  it('paying with your own Life leaves the other cards of it hidden from the opponent', () => {
    const run1 = (second: string) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE], life: [BLUE, second, BLUE] },
        { leader: PLAIN_BLUE, characters: [PURPLE] },
      );
      g.state = withAbilities(g.state, BLUE, [
        main([{ do: { draw: 1 } }], [{ trashLife: 1 }] as never),
      ]);
      run(g);
      return g;
    };
    const a = run1(V.c3);
    const b = run1(V.c4);
    expect(seen(a, 'p2')).toBe(seen(b, 'p2'));
    // Whether the cost can be paid depends on the Life count only, so the prompts are the same.
    expect(JSON.stringify(project(a.state, 'p2').actions)).toBe(
      JSON.stringify(project(b.state, 'p2').actions),
    );
  });
});
