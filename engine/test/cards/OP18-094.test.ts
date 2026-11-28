/** OP18-094 Hee Hee Hee!! I Smell Adventure!! */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, PLAIN_BLUE, PLAIN_PURPLE, play, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-094';
/** OP17-088 Elbaph vanilla; OP17-089 Jaguar.D.Saul is {Elbaph} too. */
const ELB = 'OP17-088';
const ELB2 = 'OP17-089';
const main = (deck: string[]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], deck, costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP18-094 Hee Hee Hee!! I Smell Adventure!!', () => {
  it('[Main] looks at 5 and adds up to 1 {Elbaph} card; the rest go to the bottom', () => {
    const g = main([BLUE, ELB, ELB2, BLUE, BLUE, V.c1]);
    play(g, ID);
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'deck', ELB), g.find('p1', 'deck', ELB2)].sort(),
    );
    pick(g, [g.find('p1', 'deck', ELB)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([ELB]);
    expect(zoneOf(g, 'p1', 'deck')[0]).toBe(V.c1); // the 6th card was not looked at
  });

  it('only the top 5 are looked at: an {Elbaph} card in 6th place is not offered', () => {
    const g = main([BLUE, BLUE, BLUE, BLUE, BLUE, ELB]);
    play(g, ID);
    expect(candidates(g)).toEqual([]);
  });

  it('"up to 1": may add nothing', () => {
    const g = main([ELB, BLUE, BLUE, BLUE, BLUE]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] draws 1 card', () => {
    const g = trig(ID, { deck: [BLUE, V.c1] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(zoneOf(g, 'p1', 'trash')).toEqual([ID]);
  });
});
