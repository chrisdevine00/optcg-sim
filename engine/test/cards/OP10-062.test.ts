/** OP10-062 Violet. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  none,
  payDon,
  pick,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { B_EVENT1, canPick, DP_LEADER, koBy, mk, P_EVENT2, P_EVENT6 } from './helpers-a10g2.ts';

const ID = 'OP10-062';

describe('OP10-062 Violet', () => {
  const start = (leader = DP_LEADER, trash = [P_EVENT2, P_EVENT6, B_EVENT1, V.c1]) =>
    mk({ leader, characters: [ID], trash, costArea: { active: 3, rested: 0 } });
  const koViolet = (g: ReturnType<typeof mk>) => koBy(g, 'p1', ID, 'p2');

  it('[On K.O.] DON!! -1: with a {Donquixote Pirates} Leader, adds up to 1 purple Event from your trash to your hand', () => {
    const g = start();
    koViolet(g);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'trash', P_EVENT6)]);
    expect(hand(g, 'p1')).toEqual([P_EVENT6]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
    expectDecision(g, 'main', 'p1');
  });

  it('only purple Events are candidates (cost does not matter); not other colours or Characters', () => {
    const g = start();
    koViolet(g);
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p1', 'trash', P_EVENT2))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', P_EVENT6))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', B_EVENT1))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false);
  });

  it('"up to 1": may add nothing (the DON!! is still returned)', () => {
    const g = start();
    koViolet(g);
    accept(g);
    payDon(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('with a Leader without the {Donquixote Pirates} type the DON!! is still paid but nothing is added', () => {
    const g = start(PLAIN_PURPLE);
    koViolet(g);
    accept(g);
    payDon(g);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('"You may": declining returns no DON!! and adds nothing', () => {
    const g = start();
    koViolet(g);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, deck: 7 });
  });

  it('must not be payable with no DON!! on the field; has [Blocker]', () => {
    const g = mk({
      leader: DP_LEADER,
      characters: [ID],
      trash: [P_EVENT2],
      costArea: { active: 0, rested: 0 },
    });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    koViolet(g);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([]);
  });
});
