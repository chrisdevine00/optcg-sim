/** EB03-031 Vinsmoke Reiju (Character, cost 5, 5000). */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  accept,
  dec,
  decline,
  don,
  expectDecision,
  game,
  hand,
  none,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  payDon,
  pick,
  trash,
  V,
} from './helpers.ts';

const ID = 'EB03-031';
const SANJI = 'PRB01-001'; // a Leader named [Sanji]
// Events in the trash: OP01-029 (cost 1), OP15-020 (cost 7), OP05-058 (cost 8); each gets a planted
// [Main] that draws 1.
const E1 = 'OP01-029';
const E7 = 'OP15-020';
const E8 = 'OP05-058';
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
      leader: SANJI,
      hand: [ID, V.c4],
      trash: [E1, E7, E8],
      costArea: { active: 7, rested: 0 },
      ...me,
    },
    { leader: PLAIN_PURPLE, characters: [V.c2] },
  );
  for (const id of [E1, E7, E8]) {
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

describe('EB03-031 Vinsmoke Reiju', () => {
  describe('[Your Turn] [On Play] DON!! -1: if your Leader is [Sanji], activate the [Main] effect of up to 1 Event with a cost of 7 or less in your trash', () => {
    it('pays DON!! -1, runs the chosen Event’s [Main] and leaves the card in the trash', () => {
      const g = mk();
      playIt(g); // 5 DON!! for Reiju, 2 active left
      expectDecision(g, 'optional', 'p1'); // the DON!! -1 is a cost: asked
      accept(g);
      payDon(g);
      expectDecision(g, 'choose', 'p1');
      const before = hand(g, 'p1').length;
      pick(g, [g.find('p1', 'trash', E7)]);
      expect(hand(g, 'p1').length).toBe(before + 1); // its [Main] drew 1
      expect(trash(g, 'p1').sort()).toEqual([E1, E7, E8].sort()); // all still there
      expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(6); // 7 - 1 returned
    });

    it('offers Events of cost 7 or less only (printed cost, in the trash)', () => {
      const g = mk();
      playIt(g);
      accept(g);
      payDon(g);
      expect(cands(g).sort()).toEqual(
        [g.find('p1', 'trash', E1), g.find('p1', 'trash', E7)].sort(),
      );
    });

    it('declining the cost does nothing', () => {
      const g = mk();
      playIt(g);
      decline(g);
      expect(dec(g)?.kind).toBe('main');
      expect(hand(g, 'p1')).toEqual([V.c4]);
      expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(7);
    });

    it('choosing none activates nothing (the DON!! -1 stays paid)', () => {
      const g = mk();
      playIt(g);
      accept(g);
      payDon(g);
      none(g);
      expect(dec(g)?.kind).toBe('main');
      expect(trash(g, 'p1').sort()).toEqual([E1, E7, E8].sort());
    });

    it('with a Leader that is not [Sanji] the cost is paid for nothing', () => {
      const g = mk({ leader: PLAIN_BLUE });
      playIt(g);
      accept(g);
      payDon(g);
      expect(dec(g)?.kind).toBe('main');
      expect(hand(g, 'p1')).toEqual([V.c4]);
      expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(6);
    });

    it('is not an Event activation for watchers (official EB03 Q&A)', () => {
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
      playIt(g);
      accept(g);
      payDon(g);
      pick(g, [g.find('p1', 'trash', E1)]);
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(base);
      expect(g.events.some((e) => e.type === 'EventActivated')).toBe(false);
    });

    it('an Event whose own activation cost cannot be paid is not offered', () => {
      const g = mk({ costArea: { active: 5, rested: 1 } });
      g.state = withAbilities(g.state, E1, [mainOf(draw1, [{ restDon: 2 }])]);
      playIt(g); // 5 active spent; the DON!! -1 takes the rested one; none is active for E1
      accept(g);
      payDon(g);
      expect(cands(g)).toEqual([g.find('p1', 'trash', E7)]);
    });
  });
});
