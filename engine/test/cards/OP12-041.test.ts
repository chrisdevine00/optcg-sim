/** OP12-041 Sanji (Leader). */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  pick,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP12-041';
// Events: OP01-029 and OP01-030 (cost 1, Straw Hat Crew), OP01-089 (cost 3, Baroque Works), OP01-027
// (cost 4, Beautiful Pirates); each gets a planted [Main] that draws 1.
const SHC = 'OP01-029';
const SHC2 = 'OP01-030';
const BW = 'OP01-089';
const draw1 = [{ do: { draw: 1 } }] as never;
const mainOf = (effect: unknown, cost?: unknown[]): Ability =>
  ({
    id: 'm',
    kind: 'activate',
    when: 'main',
    ...(cost ? { cost } : {}),
    effect,
  }) as unknown as Ability;

const mk = (me: object = {}, opp: object = {}) => {
  const g = game(
    { leader: ID, hand: [SHC, SHC2, BW, V.c4], costArea: { active: 3, rested: 0 }, ...me },
    { leader: PLAIN_PURPLE, characters: [V.c2], costArea: { active: 5, rested: 0 }, ...opp },
  );
  for (const id of [SHC, SHC2, BW, 'OP01-027']) {
    try {
      g.state = withAbilities(g.state, id, [mainOf(draw1)]);
    } catch {
      // not in this game
    }
  }
  return g;
};
const use = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'activate-event' });
const cands = (g: ReturnType<typeof mk>): string[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

describe('OP12-041 Sanji', () => {
  describe('[Activate: Main] [Once Per Turn] DON!! -1: activate a "Straw Hat Crew" Event, base cost 3 or less, from your hand', () => {
    it('returns 1 DON!!, trashes the chosen Event without paying its cost, and runs its [Main]', () => {
      const g = mk();
      use(g);
      // DON!! -1 is asked first only if it is a choice; all 3 are active, so it goes at once.
      expectDecision(g, 'choose', 'p1');
      expect(cands(g).sort()).toEqual(
        [g.find('p1', 'hand', SHC), g.find('p1', 'hand', SHC2)].sort(),
      );
      const before = hand(g, 'p1').length;
      pick(g, [g.find('p1', 'hand', SHC)]);
      expect(trash(g, 'p1')).toEqual([SHC]);
      expect(hand(g, 'p1').length).toBe(before); // the Event left, its [Main] drew 1
      // 3 DON!! - 1 returned; the Event's printed cost (1) was not paid.
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
    });

    it('does not offer an Event of another type or with a base cost over 3', () => {
      const g = mk({ hand: [BW, 'OP01-027', V.c4] });
      use(g);
      expectDecision(g, 'choose', 'p1');
      expect(cands(g)).toEqual([]);
      none(g);
      expect(trash(g, 'p1')).toEqual([]);
    });

    it('pays the activation cost written on the Event (DON!! -1) on top of its own DON!! -1', () => {
      const g = mk();
      g.state = withAbilities(g.state, SHC, [mainOf(draw1, [{ donMinus: 1 }])]);
      use(g);
      pick(g, [g.find('p1', 'hand', SHC)]);
      expect(dec(g)?.kind).toBe('optional'); // DON!! -N is a "you may" cost
      g.act({ type: 'optional', accept: true });
      expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(1); // 3 - 1 - 1
    });

    it('is Once Per Turn', () => {
      const g = mk();
      use(g);
      pick(g, [g.find('p1', 'hand', SHC)]);
      expect(g.legal().some((a) => a.type === 'activate' && a.card === g.leader('p1'))).toBe(false);
    });

    it('counts as activating an Event for "when you activate an Event" and the history', () => {
      const g = mk({ characters: [V.c1] });
      g.state = withAbilities(g.state, V.c1, [
        {
          id: 'w',
          kind: 'auto',
          when: [{ event: 'eventActivated', by: 'you' }],
          effect: [
            {
              do: {
                power: {
                  target: { from: 'self', owner: 'you' },
                  amount: 1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        } as unknown as Ability,
      ]);
      const base = g.power(g.find('p1', 'characters', V.c1));
      use(g);
      pick(g, [g.find('p1', 'hand', SHC)]);
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(base! + 1000);
    });
  });

  describe("[When Attacking] if your DON!! on the field is equal to or less than your opponent's, add up to 1 DON!! and rest it", () => {
    const attack = (g: ReturnType<typeof mk>) =>
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

    it('equal DON!!: adds 1 rested DON!! (asked: up to 1)', () => {
      const g = mk({ costArea: { active: 5, rested: 0 } });
      attack(g);
      expectDecision(g, 'choose', 'p1');
      g.act({ type: 'pick', choice: { option: dec(g)!.options![0]!.id } });
      expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 1 });
    });

    it('fewer DON!!: adds as well', () => {
      const g = mk({ costArea: { active: 2, rested: 1 } });
      attack(g);
      g.act({ type: 'pick', choice: { option: dec(g)!.options![0]!.id } });
      expect(don(g, 'p1').rested).toBe(2);
    });

    it('more DON!! than the opponent: nothing', () => {
      const g = mk({ costArea: { active: 6, rested: 0 } });
      attack(g);
      expect(dec(g)?.kind).not.toBe('choose');
      expect(don(g, 'p1').rested).toBe(0);
    });
  });
});
