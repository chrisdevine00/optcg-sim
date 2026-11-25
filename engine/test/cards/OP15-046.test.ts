/** OP15-046 Sabo (Character, cost 7, 9000, [Blocker]). */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP15-046';
const REBECCA = 'OP15-039'; // a {Dressrosa} Leader whose text is inert here
// {Dressrosa} Events of any cost: OP05-094 (1), OP04-093 (3), OP04-094 (4), OP15-020 (7); OP01-029 is
// not {Dressrosa}. Each gets a planted [Main] that draws 1.
const D1 = 'OP05-094';
const D4 = 'OP04-094';
const D7 = 'OP15-020';
const OTHER = 'OP01-029';
const draw1 = [{ do: { draw: 1 } }] as never;
const mainOf = (effect: unknown, cost?: unknown[]): Ability =>
  ({
    id: 'm',
    kind: 'activate',
    when: 'main',
    ...(cost ? { cost } : {}),
    effect,
  }) as unknown as Ability;

const mk = (me: object = {}) => {
  const g = game(
    {
      leader: REBECCA,
      hand: [ID, D1, D4, D7, OTHER],
      costArea: { active: 10, rested: 0 },
      ...me,
    },
    { leader: PLAIN_PURPLE, characters: [V.c2] },
  );
  for (const id of [D1, D4, D7, OTHER]) {
    try {
      g.state = withAbilities(g.state, id, [mainOf(draw1)]);
    } catch {
      // not in this game
    }
  }
  return g;
};
const cands = (g: ReturnType<typeof mk>): string[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
const playIt = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('OP15-046 Sabo', () => {
  describe('[On Play] if your Leader has the {Dressrosa} type, activate up to 1 {Dressrosa} type Event from your hand', () => {
    it('offers every {Dressrosa} Event whatever its cost, not other Events', () => {
      const g = mk();
      playIt(g);
      expectDecision(g, 'choose', 'p1');
      expect(cands(g).sort()).toEqual(
        [g.find('p1', 'hand', D1), g.find('p1', 'hand', D4), g.find('p1', 'hand', D7)].sort(),
      );
    });

    it('trashes the chosen Event, runs its [Main], and pays no printed cost', () => {
      const g = mk();
      playIt(g); // 7 DON!! for Sabo
      const before = hand(g, 'p1').length;
      pick(g, [g.find('p1', 'hand', D7)]);
      expect(trash(g, 'p1')).toEqual([D7]);
      expect(hand(g, 'p1').length).toBe(before); // left the hand, drew 1
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
    });

    it('with a Leader that is not {Dressrosa} it does nothing and asks nothing', () => {
      const g = mk({ leader: PLAIN_BLUE });
      playIt(g);
      expect(dec(g)?.kind).toBe('main');
      expect(trash(g, 'p1')).toEqual([]);
    });

    it('activates nothing when you choose none', () => {
      const g = mk();
      playIt(g);
      none(g);
      expect(trash(g, 'p1')).toEqual([]);
    });

    it('an Event whose activation cost cannot be paid is not offered', () => {
      const g = mk({ costArea: { active: 7, rested: 0 } });
      g.state = withAbilities(g.state, D4, [mainOf(draw1, [{ restDon: 1 }])]);
      playIt(g); // 7 DON!! spent: none left for D4's rest cost
      expectDecision(g, 'choose', 'p1');
      expect(cands(g).sort()).toEqual([g.find('p1', 'hand', D1), g.find('p1', 'hand', D7)].sort());
    });
  });

  it('is a [Blocker] (keyword of the data)', () => {
    const g = mk({ characters: [{ card: ID, rested: false }], hand: [] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
