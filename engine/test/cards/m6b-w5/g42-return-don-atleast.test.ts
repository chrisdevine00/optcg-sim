/**
 * M6b wave 5, G42: the cost "return 1 or more DON!! cards from your field to your DON!! deck"
 * (OP09-065, 068, 070, 073, 076, 119). The player chooses how many, then which, and one
 * `donReturned` fires for the whole number. Planted on vanilla cards; each test fails with the gap
 * reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  hand,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, main, offered, run } from '../m6b-w1/probe.ts';

const cost = (atLeast: number) => [{ returnDon: { atLeast } }];
const draw = [{ do: { draw: 1 } }];
const mk = (
  area: { active: number; rested: number },
  atLeast = 1,
  chars: Parameters<typeof game>[0]['characters'] = [BLUE],
) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: chars, costArea: area },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main(draw as never, cost(atLeast) as never)]);
  return g;
};

describe('G42 return n or more DON!! (variable count cost)', () => {
  it('validates, and refuses the nonsense', () => {
    main(draw as never, cost(1) as never);
    for (const bad of [0, -1, 1.5, 'x'])
      expect(
        errorsOf({
          id: 'a',
          kind: 'activate',
          when: 'activateMain',
          cost: [{ returnDon: { atLeast: bad } }],
          effect: draw,
        }),
      ).not.toEqual([]);
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        cost: [{ returnDon: { atLeast: 1, n: 2 } }],
        effect: draw,
      }),
    ).not.toEqual([]);
    // A replacement's payload has no place to ask how many.
    expect(
      errorsOf({
        id: 'r',
        kind: 'replacement',
        replaces: { ko: { from: 'self', owner: 'you' } },
        optional: true,
        instead: [{ returnDon: { atLeast: 1 } }],
      }),
    ).not.toEqual([]);
  });

  it('is payable only while the field holds that many DON!!', () => {
    expect(offered(mk({ active: 0, rested: 0 }))).toBe(false);
    expect(offered(mk({ active: 1, rested: 0 }))).toBe(true);
    expect(offered(mk({ active: 1, rested: 0 }, 2))).toBe(false);
    expect(offered(mk({ active: 1, rested: 1 }, 2))).toBe(true);
    // Given DON!! count as DON!! on the field.
    expect(offered(mk({ active: 0, rested: 0 }, 1, [{ card: BLUE, don: 1 }]))).toBe(true);
  });

  it('asks how many (fewest first), then returns exactly that many', () => {
    const g = mk({ active: 4, rested: 0 });
    run(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['1', '2', '3', '4']);
    option(g, '3');
    expect(don(g, 'p1')).toMatchObject({ active: 1, deck: 6 + 3 });
    expect(hand(g, 'p1')).toHaveLength(1); // the effect resolved
  });

  it('the least is the first answer, and returns just that', () => {
    const g = mk({ active: 4, rested: 0 });
    run(g);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 3 });
  });

  it('one DON!! on the field: nothing to choose, it is returned', () => {
    const g = mk({ active: 1, rested: 0 });
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 0 });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('with several places it then asks which DON!!, unless every DON!! goes', () => {
    // Active, rested and one given to the Character: 3 DON!! in all.
    const all = mk({ active: 1, rested: 1 }, 1, [{ card: BLUE, don: 1 }]);
    run(all);
    option(all, '3');
    expect(dec(all)?.kind).toBe('main');
    expect(don(all, 'p1')).toMatchObject({ active: 0, rested: 0 });
    expect(all.card(all.find('p1', 'characters', BLUE)).don).toBe(0);

    const some = mk({ active: 1, rested: 1 }, 1, [{ card: BLUE, don: 1 }]);
    run(some);
    option(some, '2');
    const d = expectDecision(some, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    some.act({ type: 'pick', choice: { from: 'costRested' } });
    some.act({
      type: 'pick',
      choice: { from: 'given', card: some.find('p1', 'characters', BLUE) },
    });
    expect(don(some, 'p1')).toMatchObject({ active: 1, rested: 0 });
    expect(some.card(some.find('p1', 'characters', BLUE)).don).toBe(0);
  });

  it('fires donReturned once, with the whole number', () => {
    const g = mk({ active: 3, rested: 0 }, 1, [BLUE, V.c1]);
    const watcher = {
      id: 'w',
      kind: 'auto',
      when: [{ event: 'donReturned', owner: 'you', min: 2 }],
      effect: [{ do: { draw: 1 } }],
    } as Ability;
    g.state = withAbilities(g.state, V.c1, [watcher]);
    run(g);
    option(g, '3');
    expect(g.eventsOfType('DonReturned').filter((e) => e.to === 'donDeck')).toHaveLength(1);
    expect(g.eventsOfType('DonReturned')[0]).toMatchObject({ count: 3 });
    expect(hand(g, 'p1')).toHaveLength(2); // the effect, and the watcher
  });

  it('a count of 1 does not fire a "2 or more" watcher', () => {
    const g = mk({ active: 3, rested: 0 }, 1, [BLUE, V.c1]);
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'w',
        kind: 'auto',
        when: [{ event: 'donReturned', owner: 'you', min: 2 }],
        effect: [{ do: { draw: 1 } }],
      } as Ability,
    ]);
    run(g);
    option(g, '1');
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('paid next to another cost that needs active DON!! (they are kept for it)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      main(draw as never, [{ returnDon: { atLeast: 1 } }, { restDon: 2 }] as never),
    ]);
    run(g);
    // 3 active DON!!, 2 of them reserved for the later rest cost: only 1 can be returned, so nothing is asked.
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2, deck: 7 + 1 });
  });
});
