/** OP16-041 Buggy (Leader). */
import { describe, expect, it } from 'vitest';
import { project, projectEvents } from '../../src/index.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { BLUE, expectDecision, game, hand, none, pick, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { activate, canPick, IMPEL_4, IMPEL_5, koBy as koByOnly, PRISONER } from './helpers-w3s.ts';
import { acceptUse, declineUse } from './helpers-w57.ts';

const ID = 'OP16-041';

/** The removal, then yes to the optional use ("This effect can be activated when ...", W57-R5). */
const koBy = (...a: Parameters<typeof koByOnly>) => {
  koByOnly(...a);
  acceptUse(a[0], ID);
};

describe('OP16-041 Buggy', () => {
  const start = (opts: { don?: number; hand?: string[]; chars?: string[]; opp?: string[] } = {}) =>
    game(
      {
        leader: { card: ID, don: opts.don ?? 1 },
        hand: opts.hand ?? [PRISONER],
        characters: opts.chars ?? [IMPEL_4],
      },
      { leader: PLAIN_BLUE, characters: opts.opp ?? [PURPLE] },
    );
  const onField = (g: ReturnType<typeof start>) => g.zone('p1', 'characters').map((c) => c.card);

  it('[DON!! x1]: when your {Impel Down} Character is K.O.’d, play up to 1 [Prisoner of Impel Down] from your hand', () => {
    const g = start();
    koBy(g, 'p1', IMPEL_4, 'p2');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', PRISONER))).toBe(true);
    pick(g, [g.find('p1', 'hand', PRISONER)]);
    expect(onField(g)).toEqual([PRISONER]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('any removal counts: returned to the hand by an opponent’s effect, and a battle K.O.', () => {
    const g = start();
    g.state = withAbilities(g.state, PURPLE, [
      {
        id: 'b',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              move: {
                what: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
                to: { zone: 'hand' },
              },
            },
          },
        ],
      } as Ability,
    ]);
    g.act({ type: 'endTurn' });
    activate(g, g.find('p2', 'characters', PURPLE), 'b');
    acceptUse(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PRISONER)]);
    expect(onField(g)).toEqual([PRISONER]);
    expect(hand(g, 'p1')).toEqual([IMPEL_4]);
  });

  it('W57-R5: "can be activated" is optional: declining plays nothing and does not spend the Once Per Turn', () => {
    const g = start({ hand: [PRISONER, PRISONER], chars: [IMPEL_4, IMPEL_5] });
    koByOnly(g, 'p1', IMPEL_4, 'p2');
    declineUse(g, ID);
    expect(onField(g)).toEqual([IMPEL_5]);
    koBy(g, 'p1', IMPEL_5, 'p2');
    pick(g, [g.find('p1', 'hand', PRISONER)]);
    expect(onField(g)).toEqual([PRISONER]);
  });

  it('"up to 1": nothing needs to be played', () => {
    const g = start();
    koBy(g, 'p1', IMPEL_4, 'p1');
    none(g);
    expect(onField(g)).toEqual([]);
    expect(hand(g, 'p1')).toEqual([PRISONER]);
  });

  it('only a Character of type {Impel Down}: another type does nothing', () => {
    const g = start({ chars: [BLUE] });
    koBy(g, 'p1', BLUE, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(onField(g)).toEqual([]);
  });

  it('only your own Characters: an opposing {Impel Down} Character removed does nothing', () => {
    const g = start({ opp: [IMPEL_4] });
    koBy(g, 'p2', IMPEL_4, 'p1');
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([PRISONER]);
  });

  it('needs [DON!! x1]: with no DON!! given to the Leader nothing happens', () => {
    const g = start({ don: 0 });
    koBy(g, 'p1', IMPEL_4, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(onField(g)).toEqual([]);
    expect(hand(g, 'p1')).toEqual([PRISONER]);
  });

  it('only [Prisoner of Impel Down]: other cards in hand are not offered', () => {
    const g = start({ hand: [PRISONER, V.c1] });
    koBy(g, 'p1', IMPEL_4, 'p2');
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'hand', PRISONER)]);
  });

  it('no leak (ADR 0005): a non-empty hand with no [Prisoner] still asks the pick, at max 0; an empty hand asks nothing', () => {
    const h = start({ hand: [V.c1] });
    koBy(h, 'p1', IMPEL_4, 'p2');
    const d = expectDecision(h, 'choose', 'p1');
    expect(d).toMatchObject({ min: 0, max: 0 });
    expect(canPick(h, h.find('p1', 'hand', V.c1))).toBe(false);
    none(h);
    expectDecision(h, 'main', 'p1');
    const e = start({ hand: [] });
    koBy(e, 'p1', IMPEL_4, 'p2');
    expectDecision(e, 'main', 'p1');
  });

  it('[Once Per Turn]: a second removal in the same turn does not trigger it again', () => {
    const g = start({ hand: [PRISONER, PRISONER], chars: [IMPEL_4, IMPEL_5] });
    koBy(g, 'p1', IMPEL_4, 'p2');
    pick(g, [g.find('p1', 'hand', PRISONER)]);
    koBy(g, 'p1', IMPEL_5, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(onField(g)).toEqual([PRISONER]);
    expect(hand(g, 'p1')).toEqual([PRISONER]);
  });

  it('leak test (ADR 0005, W3C-R1): same public state, hands differ only in a [Prisoner]: the opponent sees the same view and events', () => {
    const seen = (handCards: string[]) => {
      const g = start({ hand: handCards });
      koBy(g, 'p1', IMPEL_4, 'p2');
      return JSON.stringify([project(g.state, 'p2'), projectEvents(g.events, 'p2')]);
    };
    expect(seen([PRISONER])).toEqual(seen([V.c1]));
  });
});
