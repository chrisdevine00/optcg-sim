/** EB05-019 I Choose to Open This Country to the World!! I Want to Fight on Your Side!!! */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  none,
  pick,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { damageGame } from './helpers-hancock-rosi.ts';

const ID = 'EB05-019';
/** ST09-001 Yamato Leader ({Land of Wano}, 5000). */
const WANO_LEADER = 'ST09-001';
/** {Land of Wano} vanillas: Momonosuke 4000, Yamato 7000 (too strong for the Trigger). */
const WANO_4000 = 'ST09-006';
const WANO_5000 = 'ST09-011';
const WANO_7000 = 'ST09-013';

/** p2's 8000 Character attacks p1's Leader; p1 is at the Counter Step. */
const start = (p1: Parameters<typeof counterStep>[0] = { leader: WANO_LEADER }) =>
  counterStep({ hand: [ID], costArea: { active: 3, rested: 0 }, ...p1 }, {}, V.c6);

describe('EB05-019 I Choose to Open This Country to the World!!', () => {
  it('[Counter]: rest 1 of your cards: your {Land of Wano} type Leader gains +4000 power during this battle', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    // Rest the Leader (the pool also offers Characters, Stage and DON!!).
    pick(g, [g.leader('p1')]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 stops the 8000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: may go to a {Land of Wano} Character instead; a Character of another type is not a candidate', () => {
    const g = start({
      leader: PLAIN_BLUE,
      characters: [WANO_5000, V.c1],
    });
    useCounter(g, ID);
    accept(g);
    const wano = g.find('p1', 'characters', WANO_5000);
    // Cost: rest the other Character, so the Wano one is untouched.
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [wano]);
    expect(g.power(wano)).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('declining the optional cost gives no power', () => {
    const g = start();
    useCounter(g, ID);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('a Leader that is not {Land of Wano} and no Wano Character: the cost is paid but nothing gains power', () => {
    const g = start({ leader: PLAIN_BLUE, characters: [V.c1] });
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
  });

  describe('[Trigger]', () => {
    it('with the opponent at 3 Life or less: play up to 1 {Land of Wano} Character with 6000 power or less from your hand', () => {
      const g = damageGame(ID, { leader: WANO_LEADER, hand: [WANO_4000, WANO_7000, V.c1] });
      g.act({ type: 'trigger', activate: true });
      pick(g, [g.find('p1', 'hand', WANO_4000)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([WANO_4000]);
      expect(g.zone('p1', 'hand')).toHaveLength(2);
    });

    it('the 7000 power Wano Character and the non-Wano Character are not candidates', () => {
      const g = damageGame(ID, { leader: WANO_LEADER, hand: [WANO_7000, V.c1] });
      g.act({ type: 'trigger', activate: true });
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it('with the opponent at 4 Life the condition fails and nothing is played', () => {
      const g = damageGame(
        ID,
        { leader: WANO_LEADER, hand: [WANO_4000] },
        { life: [PURPLE, PURPLE, PURPLE, PURPLE] },
      );
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'main', 'p2');
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.zone('p1', 'hand')).toHaveLength(1);
    });
  });
});
