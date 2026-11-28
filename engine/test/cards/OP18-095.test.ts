/** OP18-095 I'm Late, I'm Very Late!! */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, PLAIN_BLUE, play, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { HK1, SPANDAM, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-095';
const SLEEPTIDS = 'OP18-093';
/** OP18-060 Saint Gunko: a {Celestial Dragons} Leader. */
const CD_LEADER_ID = 'OP18-060';
const main = (leader: string, deck: string[]) =>
  game({ leader, hand: [ID], deck, costArea: { active: 1, rested: 0 } }, { leader: PLAIN_BLUE });

describe("OP18-095 I'm Late, I'm Very Late!!", () => {
  it('[Main] with a {Celestial Dragons} Leader: adds up to 1 [Sleeptids] or {Holy Knights of God} card', () => {
    const g = main(CD_LEADER_ID, [BLUE, SLEEPTIDS, HK1, SPANDAM, BLUE, V.c1]);
    play(g, ID);
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'deck', SLEEPTIDS), g.find('p1', 'deck', HK1)].sort(),
    );
    pick(g, [g.find('p1', 'deck', HK1)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([HK1]);
    expect(zoneOf(g, 'p1', 'deck')[0]).toBe(V.c1);
  });

  it('a [Sleeptids] is taken as readily', () => {
    const g = main(CD_LEADER_ID, [SLEEPTIDS, BLUE, BLUE, BLUE, BLUE]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', SLEEPTIDS)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SLEEPTIDS]);
  });

  it('"up to 1": may add nothing', () => {
    const g = main(CD_LEADER_ID, [HK1, BLUE, BLUE, BLUE, BLUE]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('without a {Celestial Dragons} Leader nothing is looked at', () => {
    const g = main('ST04-001', [HK1, BLUE, BLUE, BLUE, BLUE]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(zoneOf(g, 'p1', 'deck')[0]).toBe(HK1);
  });

  it('[Trigger] activates the [Main] effect (with the same Leader condition)', () => {
    const g = trig(ID, { leader: CD_LEADER_ID, deck: [HK1, BLUE, BLUE, BLUE, BLUE] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', HK1)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([HK1]);
    const g2 = trig(ID, { deck: [HK1, BLUE, BLUE, BLUE, BLUE] });
    g2.act({ type: 'trigger', activate: true });
    expect(hand(g2, 'p1')).toEqual([]);
  });
});
