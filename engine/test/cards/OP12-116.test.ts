/** OP12-116 We'll Ring the Bell Waiting for You!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import {
  cardsIn,
  finishOrder,
  mk,
  NOLAND,
  offered,
  RA_LEADER,
  SHANDIAN5,
  SHANDIAN6,
  SHANDIAN_EVENT,
} from './helpers-op12g3.ts';

const ID = 'OP12-116';
/** Top 5: two Shandian Characters, [Mont Blanc Noland], a Shandian Event, a vanilla; then 3 more. */
const deck = [SHANDIAN5, V.c1, SHANDIAN6, NOLAND, SHANDIAN_EVENT, SHANDIAN5, V.c2, V.c3];

describe("OP12-116 We'll Ring the Bell Waiting for You!!", () => {
  it('[Main] looks at 5, adds up to 2 {Shandian Warrior} Characters or [Mont Blanc Noland], the rest go to the bottom', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    // Offered: the two Shandian Characters and Noland. Not the Event, not the vanilla, not the 6th card.
    expect(offered(g).sort()).toEqual(
      [
        g.find('p1', 'deck', SHANDIAN5),
        g.find('p1', 'deck', SHANDIAN6),
        g.find('p1', 'deck', NOLAND),
      ].sort(),
    );
    pick(g, [g.find('p1', 'deck', SHANDIAN6), g.find('p1', 'deck', NOLAND)]);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([SHANDIAN6, NOLAND].sort());
    const d = cardsIn(g, 'p1', 'deck');
    expect(d).toHaveLength(6);
    expect(d.slice(0, 3)).toEqual([SHANDIAN5, V.c2, V.c3]);
    expect(d.slice(3).sort()).toEqual([SHANDIAN5, V.c1, SHANDIAN_EVENT].sort());
  });

  it('a Shandian Warrior Event is not a Character: it cannot be taken', () => {
    const g = mk({ hand: [ID], deck: [SHANDIAN_EVENT, V.c1, V.c2, V.c3, V.c4, V.c5] });
    play(g, ID);
    expect(offered(g)).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('"a total of up to 2": may take just 1, or none', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', NOLAND)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([NOLAND]);
    const h = mk({ hand: [ID], deck });
    play(h, ID);
    none(h);
    finishOrder(h);
    expect(hand(h, 'p1')).toHaveLength(0);
    expect(cardsIn(h, 'p1', 'deck')).toHaveLength(8);
  });

  it('never more than 2 even when 3 qualify (the 6th card is not looked at either)', () => {
    const g = mk({
      hand: [ID],
      deck: [SHANDIAN5, SHANDIAN6, NOLAND, V.c1, V.c2, SHANDIAN5],
    });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', SHANDIAN5), g.find('p1', 'deck', SHANDIAN6)]);
    // Two taken: the pick closes and nothing else can be added.
    finishOrder(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expectDecision(g, 'main', 'p1');
  });

  it('[Trigger] draws 1 card', () => {
    const g = damageGame(ID, { leader: RA_LEADER, deck: [V.c2, V.c3] }, {});
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toContain(V.c2);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3]);
  });
});
