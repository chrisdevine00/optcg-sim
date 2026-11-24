/** OP12-096 Ursa Shock. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { C8, cardsIn, mk, offered, RA_LEADER } from './helpers-op12g3.ts';

const ID = 'OP12-096';
/** [Karasu] (cost 5, +3 cost with a Revolutionary Army Leader = 8 now; its [When Attacking] is inert). */
const KARASU = 'OP12-085';

const start = (mine: string[] = [], theirs: string[] = [V.c4, V.c5, V.c6, V.c7]) =>
  mk({ hand: [ID], characters: mine }, { characters: theirs });

describe('OP12-096 Ursa Shock', () => {
  it('[Main] without a cost-8 Character: K.O.s up to 1 opposing Character with cost 4 or less (5 is out)', () => {
    const g = start([V.c1]);
    play(g, ID);
    expect(offered(g)).toEqual([g.find('p2', 'characters', V.c4)]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c5, V.c6, V.c7].sort());
    expect(trash(g, 'p2')).toEqual([V.c4]);
  });

  it('with a Character of cost 8 or more: cost 6 or less (7 is out)', () => {
    const g = start([C8]);
    play(g, ID);
    expect(offered(g).sort()).toEqual(
      [
        g.find('p2', 'characters', V.c4),
        g.find('p2', 'characters', V.c5),
        g.find('p2', 'characters', V.c6),
      ].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(trash(g, 'p2')).toEqual([V.c6]);
  });

  it('boundary: a Character of cost 7 does not unlock cost 6', () => {
    const g = start([V.c7]);
    play(g, ID);
    expect(offered(g)).toEqual([g.find('p2', 'characters', V.c4)]);
  });

  it('the cost-8 check reads current cost: Karasu (5 +3) unlocks it', () => {
    const g = start([KARASU]);
    expect(g.card(g.find('p1', 'characters', KARASU)).cost).toBe(8);
    play(g, ID);
    expect(offered(g)).toHaveLength(3);
  });

  it('"up to 1": may K.O. nothing; with no eligible target nothing is asked', () => {
    const g = start([], [V.c4]);
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
    const h = start([], [V.c5, V.c6]);
    play(h, ID);
    expect(dec(h)?.kind).toBe('main');
    expect(cardsIn(h, 'p2', 'characters')).toHaveLength(2);
  });

  it('[Trigger] draws 1 card and trashes 1 card from the top of the deck', () => {
    const g = damageGame(ID, { leader: RA_LEADER, deck: [V.c2, V.c3, V.c4] }, {});
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toContain(V.c2);
    expect(trash(g, 'p1')).toContain(V.c3);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c4]);
    expectDecision(g, 'main', 'p2');
  });

  it('[Trigger] declined: the card goes to the hand and nothing else happens', () => {
    const g = damageGame(ID, { leader: RA_LEADER, deck: [V.c2, V.c3, V.c4] }, {});
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c2, V.c3, V.c4]);
  });
});
