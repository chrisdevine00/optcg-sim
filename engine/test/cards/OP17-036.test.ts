/** OP17-036 Withdraw Now and Allow Me to Save Face. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  none,
  PLAIN_BLUE,
  pick,
  play,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { OTHER_LEADER, SHANKS_CHAR, SHANKS_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-036';
const rested = (card: string) => ({ card, rested: true });

describe('OP17-036 Withdraw Now and Allow Me to Save Face', () => {
  const start = () =>
    game(
      { leader: OTHER_LEADER, hand: [ID], costArea: { active: 7, rested: 0 } },
      {
        leader: PLAIN_BLUE,
        characters: [V.c3, rested(V.c6), rested(V.c5), rested(V.c7)],
      },
    );

  it('[Main]: rest 6 DON!!, rest up to 1 Character, then K.O. up to 2 rested Characters with a cost of 6 or less', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    const c3 = g.find('p2', 'characters', V.c3);
    pick(g, [c3]);
    expect(g.card(c3).rested).toBe(true);
    // The Character just rested is now a K.O. candidate; the rested cost 7 is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [c3, g.find('p2', 'characters', V.c6)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5, V.c7]);
    expect(g.zone('p2', 'trash')).toHaveLength(2);
  });

  it('"up to": may rest nothing and K.O. only 1', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('declining the cost does nothing and keeps the DON!!', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').active).toBe(6);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(3);
  });

  it('the cost cannot be paid with fewer than 6 active DON!! after the Event cost', () => {
    const g = game(
      { leader: OTHER_LEADER, hand: [ID], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [rested(V.c6)] },
    );
    play(g, ID);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(don(g, 'p1').active).toBe(5);
  });

  describe('[Counter]', () => {
    const step = (leader: string, characters: string[] = []) =>
      counterStep({ leader, hand: [ID], characters, costArea: { active: 1, rested: 0 } });

    it('up to 1 of your [Shanks] gains +4000 power during this battle', () => {
      const g = step(SHANKS_LEADER, [SHANKS_CHAR, V.c1]);
      useCounter(g, ID);
      // The [Shanks] Leader and the [Shanks] Character, not the other Character.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(9000);
      endCounter(g);
      expect(g.life('p1')).toBe(3);
    });

    it('with no [Shanks] nothing gains power', () => {
      const g = step(OTHER_LEADER, [V.c1]);
      useCounter(g, ID);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expectDecision(g, 'counter', 'p1');
    });
  });
});
