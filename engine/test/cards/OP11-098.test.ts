/** OP11-098 Blue Hole (Event, cost 3). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  expectDecision,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { canPick, damageGame, idsOf, mk } from './helpers-op11g3.ts';

const ID = 'OP11-098';

describe('OP11-098 Blue Hole', () => {
  const start = (deck: string[] = [V.c1, V.c2, V.c3, V.c4]) =>
    mk({ hand: [ID], deck }, { characters: [V.c1, V.c2, V.c3] });

  it('[Main]: trash 3 cards from the top of your deck: K.O. up to 1 opposing Character with cost 2 or less', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual(expect.arrayContaining([V.c1, V.c2, V.c3]));
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c4]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // cost 2 is the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // cost 3
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c3]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('the cost is optional: declining trashes nothing and K.O.s nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('"up to 1": the K.O. may be declined after the cost is paid', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('with fewer than 3 cards in the deck the cost cannot be paid', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('[Trigger]: up to 1 of your Leader or Character cards gains +1000 power during this turn', () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE, characters: [V.c2] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger] power lasts through the turn and may target the Leader', () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});
