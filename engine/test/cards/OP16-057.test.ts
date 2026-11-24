/** OP16-057 Captain Buggy's Our Savior!! */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, dec, hand, none, pick, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { counterStep, endCounter, useCounter } from './helpers-luffyace.ts';
import { IMPEL_LEADER, MR3_G, PRISONER } from './helpers-op16g2.ts';

const ID = 'OP16-057';

describe("OP16-057 Captain Buggy's Our Savior!!", () => {
  const start = (chars: string[]) =>
    counterStep(
      { leader: IMPEL_LEADER, hand: [ID], characters: chars, costArea: { active: 1, rested: 0 } },
      {},
      V.c6,
    );

  it('[Counter] with 2 or more [Prisoner of Impel Down] cards: your Leader gains +4000 power during this battle', () => {
    const g = start([PRISONER, PRISONER]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('or one of your Characters', () => {
    const g = start([PRISONER, PRISONER]);
    useCounter(g, ID);
    const target = g.find('p1', 'characters', PRISONER, 0);
    pick(g, [target]);
    expect(g.power(target)).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with only 1 [Prisoner of Impel Down] the Counter does nothing', () => {
    const g = start([PRISONER, MR3_G]);
    useCounter(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    if (dec(g)?.kind === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may give the +4000 to none', () => {
    const g = start([PRISONER, PRISONER]);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger] draws 2 cards and trashes 1 card from your hand', () => {
    const g = damageGame(ID, { leader: IMPEL_LEADER, deck: [BLUE, PURPLE, BLUE, BLUE] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(PURPLE);
  });
});
