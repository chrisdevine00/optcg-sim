/**
 * M6b wave 6, G55: `Pick.totalPower`, "K.O. up to 2 of your opponent's Characters with a total
 * power of 4000 or less" (OP09-018). The chosen cards' current power adds up to the bound, as
 * `totalCost` does for cost. Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities } from '../../../src/testing.ts';
import { BLUE, dec, game, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const koTotal = (totalPower: unknown = { lte: 4000 }, upTo = 2) => ({
  do: {
    ko: {
      from: 'characters',
      owner: 'opponent',
      pick: { upTo, totalPower },
    },
  },
});

/** p2 has Characters of power 3000, 3000 and 4000 (V.c1, V.c1, V.c2); p1's probe is BLUE. */
const mk = (effect: unknown = koTotal(), chars: string[] = [V.c1, V.c1, V.c2]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE] },
    { leader: PLAIN_BLUE, characters: chars },
  );
  g.state = withAbilities(g.state, BLUE, [main([effect] as never)]);
  return g;
};
const picks = (g: ReturnType<typeof mk>) => g.legal().filter((a) => a.type === 'pick');
const lower = (g: ReturnType<typeof mk>, nth: number, by: number) => {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'power',
      target: g.find('p2', 'characters', V.c1, nth),
      amount: -by,
      duration: { kind: 'thisTurn', turn: 3 },
      controller: 'p1',
    },
  }).state;
};

describe('G55 a total power bound on a pick', () => {
  it('validates, and refuses the nonsense', () => {
    main([koTotal()] as never);
    main([koTotal({ lte: { sum: [4000, 1000] } })] as never);
    const bad = (e: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [e] });
    expect(bad(koTotal({ gte: 1000 }))).not.toEqual([]);
    expect(bad(koTotal({ lte: 'lots' }))).not.toEqual([]);
    expect(
      bad({
        do: {
          ko: {
            from: 'characters',
            owner: 'opponent',
            pick: { upTo: 2, totalPower: { lte: 4000 }, totalCost: { lte: 3 } },
          },
        },
      }),
    ).not.toEqual([]);
    expect(
      bad({
        do: {
          ko: {
            from: 'characters',
            owner: 'opponent',
            pick: { exactly: 2, totalPower: { lte: 4000 } },
          },
        },
      }),
    ).not.toEqual([]);
    // A cost's pick is always `exactly`, so it has no total to speak of.
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        cost: [
          {
            trash: {
              from: 'hand',
              owner: 'you',
              pick: { upTo: 2, totalPower: { lte: 4000 } },
            },
          },
        ],
        effect: [],
      }),
    ).not.toEqual([]);
  });

  it('a single card within the bound can be chosen; a second one that goes over cannot', () => {
    const g = mk();
    run(g);
    expect(dec(g)?.kind).toBe('choose');
    expect(picks(g)).toHaveLength(3); // each alone is within 4000
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1, 0) });
    // 3000 + 3000 and 3000 + 4000 are over 4000: nothing more can be added.
    expect(picks(g)).toHaveLength(0);
    g.act({ type: 'done' });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1, V.c2]);
  });

  it('two cards whose powers fit together are both K.O.’d (current power counts)', () => {
    const g = mk();
    lower(g, 0, 1000);
    lower(g, 1, 1000);
    run(g);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1, 0) });
    expect(picks(g)).toHaveLength(1); // the other 2000; the 4000 card would make 6000
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1, 1) });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
  });

  it('a card over the bound on its own is never offered', () => {
    const g = mk(koTotal({ lte: 3000 }));
    run(g);
    const chosen = picks(g).map((a) => (a.type === 'pick' ? a.choice : ''));
    expect(chosen).toHaveLength(2);
    expect(chosen).not.toContain(g.find('p2', 'characters', V.c2));
  });

  it('power below 0 counts as 0, so a card cannot pay for another', () => {
    const g = mk();
    lower(g, 0, 5000); // 3000 - 5000: never below 0
    run(g);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1, 0) });
    // 0 + 3000 and 0 + 4000 both fit within 4000.
    expect(picks(g)).toHaveLength(2);
  });

  it('the number is read when asked: a Num works as the bound', () => {
    const g = mk(koTotal({ lte: { count: { from: 'characters', owner: 'you' } } }));
    // One Character of yours: 1 power at most. Nothing fits.
    run(g);
    expect(picks(g)).toHaveLength(0);
  });

  it('nothing is chosen when the first card already goes over, and no one is K.O.’d', () => {
    const g = mk(koTotal({ lte: 1000 }));
    run(g);
    expect(picks(g)).toHaveLength(0);
    g.act({ type: 'done' });
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });
});
