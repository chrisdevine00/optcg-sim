/**
 * M6b wave 8 fix round, W8-R2 (docs/reviews/m6b-wave8.md): the mutants the first two suites let
 * through. OP12-041 "base cost", the [Your Turn] clause of EB03-031 and PRB02-005, M6b-Q92 (an
 * optional-cost Event stays a candidate), the `exclude` in `payable`, `f.acted`. Planted on printed
 * cards; each test fails with its mutant.
 */
import { describe, expect, it } from 'vitest';
import { internals, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  dec,
  don,
  game,
  accept,
  hand,
  none,
  payDon,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from '../helpers.ts';
import { setCostMod } from '../helpers-sabo.ts';
import { EVENT_RED } from '../../support/game.ts';

const SANJI = 'OP12-041';
const SHC = 'OP01-029'; // Event, cost 1, {Straw Hat Crew}
const draw1 = [{ do: { draw: 1 } }] as never;
const mainOf = (effect: unknown, extra: object = {}): Ability =>
  ({ id: 'm', kind: 'activate', when: 'main', ...extra, effect }) as unknown as Ability;

const sanji = (me: object = {}) => {
  const g = game(
    { leader: SANJI, hand: [SHC, V.c4], costArea: { active: 3, rested: 0 }, ...me },
    { leader: PLAIN_PURPLE, characters: [V.c2], costArea: { active: 5, rested: 0 } },
  );
  g.state = withAbilities(g.state, SHC, [mainOf(draw1)]);
  return g;
};
const use = (g: ReturnType<typeof sanji>) =>
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'activate-event' });
const cands = (g: ReturnType<typeof sanji>): string[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

describe('OP12-041 "base cost of 3 or less"', () => {
  it('a base-cost-1 Event whose current cost is 6 is still a candidate', () => {
    const g = sanji();
    setCostMod(g, g.find('p1', 'hand', SHC), 5, 'p1');
    use(g);
    expect(cands(g)).toEqual([g.find('p1', 'hand', SHC)]);
  });
});

describe('OP12-041 boundary and "up to 1" (W8-R5)', () => {
  const THREE = 'OP10-061'; // {Straw Hat Crew} Event, cost 3
  const FOUR = 'ST21-017'; // {Straw Hat Crew} Event, cost 4
  const mk = () => {
    const g = sanji({ hand: [SHC, THREE, FOUR] });
    for (const id of [THREE, FOUR]) g.state = withAbilities(g.state, id, [mainOf(draw1)]);
    return g;
  };
  it('base cost 3 is a candidate and base cost 4 is not', () => {
    const g = mk();
    use(g);
    expect(cands(g).sort()).toEqual(
      [g.find('p1', 'hand', SHC), g.find('p1', 'hand', THREE)].sort(),
    );
  });
  it('"up to 1": choosing none with candidates activates nothing', () => {
    const g = mk();
    use(g);
    none(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });
});

describe('M6b-Q92 an Event whose written cost cannot be paid', () => {
  it('an optional cost (DON!! -2) stays a candidate: offered, picked, the cost declined, the Event trashed', () => {
    const g = sanji({ costArea: { active: 2, rested: 0 } });
    g.state = withAbilities(g.state, SHC, [mainOf(draw1, { cost: [{ donMinus: 2 }] })]);
    use(g); // Sanji's own DON!! -1 leaves 1 DON!!
    expect(cands(g)).toEqual([g.find('p1', 'hand', SHC)]);
    pick(g, [g.find('p1', 'hand', SHC)]);
    expect(dec(g)?.kind).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    g.act({ type: 'optional', accept: false });
    expect(trash(g, 'p1')).toEqual([SHC]);
  });

  it('a non-optional cost the Event cannot pay is not offered; the Event itself is not the card it would trash', () => {
    const trashOne = {
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    };
    // Only the Event in hand: its own cost would have to trash itself (`exclude`): not offered.
    const lone = sanji({ hand: [SHC] });
    lone.state = withAbilities(lone.state, SHC, [mainOf(draw1, trashOne)]);
    use(lone);
    expect(cands(lone)).toEqual([]);
    // With another card in hand the cost can be paid: offered.
    const two = sanji({ hand: [SHC, V.c4] });
    two.state = withAbilities(two.state, SHC, [mainOf(draw1, trashOne)]);
    use(two);
    expect(cands(two)).toEqual([two.find('p1', 'hand', SHC)]);
  });
});

describe('"if you do" after an activation (f.acted)', () => {
  const ab = {
    id: 'activate-event',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          activate: {
            ability: 'main',
            of: {
              from: 'hand',
              owner: 'you',
              filter: { type: 'Straw Hat Crew' },
              pick: { upTo: 1 },
            },
          },
        },
        label: 'x',
      },
      { if: { did: 'x' }, then: [{ do: { draw: 1 } }] },
    ],
  } as unknown as Ability;
  const run = (choose: boolean) => {
    const g = sanji({ hand: [SHC] });
    g.state = withAbilities(g.state, SANJI, [ab]);
    use(g);
    if (choose) pick(g, [g.find('p1', 'hand', SHC)]);
    else none(g);
    return hand(g, 'p1').length;
  };
  it('draws one more when an Event was activated, none when nothing was', () => {
    // Start with SHC alone: it leaves (-1), its [Main] draws (+1), "if you do" draws (+1).
    expect(run(true)).toBe(2);
    expect(run(false)).toBe(1);
  });
});

describe('[Your Turn] on EB03-031 and PRB02-005, reached by a planted [Counter] that plays them', () => {
  const counterPlays = {
    id: 'c',
    kind: 'activate',
    when: 'counter',
    effect: [{ do: { play: { what: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } } }],
  } as unknown as Ability;
  /** p2 attacks p1's Leader; p1 plays `card` from the Counter Step through the planted Event. */
  const opponentsTurn = (card: string, p1: object = {}) => {
    const g = game(
      {
        leader: SANJI,
        hand: [EVENT_RED, card],
        costArea: { active: 3, rested: 0 },
        ...p1,
      },
      { leader: PLAIN_BLUE, characters: [V.c7], costArea: { active: 5, rested: 0 } },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, EVENT_RED, [counterPlays]);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.leader('p1'),
    });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', EVENT_RED), ability: 'c' });
    pick(g, [g.find('p1', 'hand', card)]);
    return g;
  };

  it('PRB02-005 played on the opponent’s turn sets nothing up', () => {
    const g = opponentsTurn('PRB02-005');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain('PRB02-005');
    expect(internals(g.state).delayed).toHaveLength(0);
  });

  it('EB03-031 played on the opponent’s turn does not offer its DON!! -1', () => {
    const g = opponentsTurn('EB03-031', { trash: [SHC] });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain('EB03-031');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(3); // no DON!! returned
  });
});

describe('OP15-119 "when your opponent activates an Event" (official OP15 Q&A rows, W8-R7)', () => {
  const LUFFY = 'OP15-119';
  const opp = { leader: PLAIN_PURPLE, characters: [LUFFY], life: [V.c1, V.c2] };
  const D1 = 'OP05-094'; // a {Dressrosa} Event, cost 1

  it('Sabo’s [On Play] activating an Event from the hand: yes, the opponent is asked', () => {
    const g = game(
      { leader: 'OP15-039', hand: ['OP15-046', D1], costArea: { active: 10, rested: 0 } },
      opp,
    );
    g.state = withAbilities(g.state, D1, [mainOf(draw1)]);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', 'OP15-046') });
    pick(g, [g.find('p1', 'hand', D1)]);
    expect(dec(g)).toMatchObject({ kind: 'optional', player: 'p2' });
  });

  it('Reiju activating the [Main] of an Event in the trash: no, the opponent is asked nothing', () => {
    const g = game(
      {
        leader: 'PRB01-001',
        hand: ['EB03-031', V.c4],
        trash: [SHC],
        costArea: { active: 7, rested: 0 },
      },
      opp,
    );
    g.state = withAbilities(g.state, SHC, [mainOf(draw1)]);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', 'EB03-031') });
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'trash', SHC)]);
    expect(dec(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });
});
