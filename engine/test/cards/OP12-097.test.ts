/** OP12-097 Captains Assembled. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { cardsIn, mk, offered, orderAll, RA2, RA5, RA_LEADER } from './helpers-op12g3.ts';

const ID = 'OP12-097';

describe('OP12-097 Captains Assembled', () => {
  it('[Main] looks at 3, reveals up to 1 Revolutionary Army card and adds it, trashes the rest', () => {
    const g = mk({ hand: [ID], deck: [RA5, V.c1, V.c2, V.c3] });
    play(g, ID);
    expect(offered(g)).toEqual([g.find('p1', 'deck', RA5)]);
    pick(g, [g.find('p1', 'deck', RA5)]);
    expect(hand(g, 'p1')).toEqual([RA5]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c1, V.c2].sort());
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3]);
  });

  it('[Captains Assembled] itself is not a legal pick; only the top 3 are looked at', () => {
    const g = mk({ hand: [ID], deck: [V.c1, ID, V.c2, RA2, V.c3] });
    play(g, ID);
    // The top 3 are V.c1, [Captains Assembled] and V.c2: no legal pick; [Koala] is the 4th.
    expect(offered(g)).toHaveLength(0);
    none(g);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([RA2, V.c3]);
    expect(trash(g, 'p1')).toHaveLength(4);
  });

  it('"up to 1": may take nothing; all 3 are trashed', () => {
    const g = mk({ hand: [ID], deck: [RA5, RA2, V.c2, V.c3] });
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(trash(g, 'p1')).toHaveLength(4);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3]);
  });

  it('works whatever the Leader (there is no Leader condition)', () => {
    const g = mk({ leader: 'ST01-001', hand: [ID], deck: [RA2, V.c1, V.c2] });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', RA2)]);
    expect(hand(g, 'p1')).toEqual([RA2]);
  });

  it("[Trigger] activates this card's [Main] effect", () => {
    const g = damageGame(ID, { leader: RA_LEADER, deck: [RA5, V.c1, V.c2, V.c3] }, {});
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', RA5)]);
    expect(hand(g, 'p1')).toEqual([RA5]);
    expect(trash(g, 'p1')).toContain(V.c1);
    orderAll(g);
    expect(dec(g)?.kind).not.toBe('trigger');
  });
});
