/**
 * M4b fix round 1 (engine half): planted scripts for the runtime changes that real cards reach
 * only through several steps. Each test fails with its fix reverted.
 */
import { describe, expect, it } from 'vitest';
import { validateScript, type CardScript, type Step } from '@optcg/cards';
import { project, projectEvents } from '../../../src/index.ts';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  none,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from '../helpers.ts';

function main(effect: Step[]): Ability {
  const ab = { id: 'a', kind: 'activate', when: 'activateMain', effect } as Ability;
  const script = {
    cardId: 'OP02-060',
    textHash: 'x',
    verified: { source: 't', date: '2026-11-16' },
    abilities: [ab],
  } as unknown as CardScript;
  expect(validateScript(script)).toEqual([]);
  return ab;
}
const run = (g: ReturnType<typeof game>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });

describe('M4b-03: "give up to N DON!!" lets the player give 0 to N', () => {
  const give = (n: number, rested: number, targets: string[] = []) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, ...targets], costArea: { active: 0, rested } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            giveDon: {
              n,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ]),
    ]);
    run(g);
    return g;
  };
  const don = (g: ReturnType<typeof game>) => g.card(g.leader('p1')).don;

  it('with several DON!! the count is asked first (most first), then the target', () => {
    const g = give(3, 3);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['3', '2', '1', '0']);
    option(g, '2');
    pick(g, [g.leader('p1')]);
    expect(don(g)).toBe(2);
    expect(g.card(g.find('p1', 'characters', BLUE)).don).toBe(0);
    expectDecision(g, 'main', 'p1');
  });

  it('"None" gives nothing and leaves the DON!! rested for a later cost', () => {
    const g = give(3, 3);
    option(g, '0');
    expect(don(g)).toBe(0);
    expectDecision(g, 'main', 'p1');
  });

  it('with one DON!! to give, the target choice itself may be left with `done`', () => {
    const g = give(1, 2);
    expectDecision(g, 'choose', 'p1');
    none(g);
    expect(don(g)).toBe(0);
    const h = give(1, 2);
    pick(h, [h.leader('p1')]);
    expect(don(h)).toBe(1);
  });

  it('only as many as are available can be chosen', () => {
    const g = give(4, 2);
    expect(expectDecision(g, 'choose', 'p1').options?.map((o) => o.id)).toEqual(['2', '1', '0']);
  });

  it('nothing is asked when there is no DON!! to give', () => {
    const g = give(2, 0);
    expect(dec(g)?.kind).toBe('main');
  });
});

describe('M4b-05 (engine): a pick with nothing to pick asks no decision when nothing is hidden', () => {
  const lookOnly = (deck: string[]) => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE], deck }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [{ pick: { upTo: 1 }, to: 'hand', filter: { name: 'Nobody' } }],
              rest: 'trash',
            },
          },
        },
      ]),
    ]);
    run(g);
    return g;
  };

  it('an empty deck: nothing was looked at, so there is no choice', () => {
    const g = lookOnly([]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('cards looked at but none eligible: still asked (max 0), so the opponent cannot tell', () => {
    const g = lookOnly([V.c1, V.c2, V.c3, V.c4]);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    none(g);
    expect(g.zone('p1', 'trash')).toHaveLength(3);
  });

  it('a hand pick over an empty hand is skipped (the size is public); a non-empty hand is asked', () => {
    const trash = (hand: string[]) => {
      const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE, hand });
      g.state = withAbilities(g.state, BLUE, [
        main([
          {
            do: {
              trashFromHand: {
                from: 'hand',
                owner: 'opponent',
                chooser: 'opponent',
                pick: { exactly: 1 },
              },
            },
          },
        ]),
      ]);
      run(g);
      return g;
    };
    expect(dec(trash([]))?.kind).toBe('main');
    // A non-empty hand is still asked (the choice is hidden from the other player): a hidden pool.
    expect(dec(trash([V.c1]))?.kind).toBe('choose');
    expect(dec(trash([V.c1, V.c2]))?.kind).toBe('choose');
  });
});

describe('M4b-08: the owner orders cards placed at the bottom of their deck (OP06-058)', () => {
  const start = () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP06-058'],
        characters: [],
        costArea: { active: 7, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c6, V.c1] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', 'OP06-058') });
    pick(g, [g.find('p2', 'characters', V.c6), g.find('p2', 'characters', V.c1)]);
    return g;
  };
  const answer = (g: ReturnType<typeof game>, card: string) => {
    const first = g.legal().find((a) => a.type === 'order' && g.card(a.first).card === card);
    g.act(first!);
  };

  it('the other player (p2) is asked for the order, not the one who used the card', () => {
    const g = start();
    const d = expectDecision(g, 'order', 'p2');
    expect(d.options).toHaveLength(2);
  });

  it('the first named card is placed above the second, whichever it is', () => {
    const a = start();
    answer(a, V.c6);
    expect(
      a
        .zone('p2', 'deck')
        .slice(-2)
        .map((c) => c.card),
    ).toEqual([V.c6, V.c1]);
    const b = start();
    answer(b, V.c1);
    expect(
      b
        .zone('p2', 'deck')
        .slice(-2)
        .map((c) => c.card),
    ).toEqual([V.c1, V.c6]);
    expect(b.zone('p2', 'characters')).toHaveLength(0);
  });

  it('p1 cannot learn the order: events and views are identical for both answers', () => {
    const a = start();
    const b = start();
    const evA = a.events.length;
    const evB = b.events.length;
    answer(a, V.c6);
    answer(b, V.c1);
    const seen = (g: ReturnType<typeof game>, from: number) =>
      JSON.stringify(projectEvents(g.events.slice(from), 'p1'));
    expect(seen(a, evA)).toBe(seen(b, evB));
    expect(JSON.stringify(project(a.state, 'p1'))).toBe(JSON.stringify(project(b.state, 'p1')));
    expect(JSON.stringify(project(a.state, 'p2'))).toBe(JSON.stringify(project(b.state, 'p2')));
  });

  it('one card each (one yours, one theirs): nothing to order', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP06-058'],
        characters: [V.c5],
        costArea: { active: 7, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c6] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', 'OP06-058') });
    pick(g, [g.find('p1', 'characters', V.c5), g.find('p2', 'characters', V.c6)]);
    expectDecision(g, 'main', 'p1');
  });
});
