/** ST27-003 Kuzan. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { BP4, BP5, BP6, BP_EVENT, BP_LEADER, canPick, koByBattle } from './helpers-st2627.ts';

const ID = 'ST27-003';
const ko = (trash: string[]) => koByBattle({ leader: BP_LEADER, trash }, ID);

describe('ST27-003 Kuzan', () => {
  it('[On K.O.] plays up to 1 {Blackbeard Pirates} Character with cost 5 or less from the trash, rested', () => {
    const g = ko([BP4, BP5, BP6, V.c3, BP_EVENT]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', BP4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', BP5))).toBe(true); // cost 5 inclusive
    expect(canPick(g, g.find('p1', 'trash', BP6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'trash', V.c3))).toBe(false); // not {Blackbeard Pirates}
    expect(canPick(g, g.find('p1', 'trash', BP_EVENT))).toBe(false); // not a Character
    expect(canPick(g, g.find('p1', 'trash', ID))).toBe(false); // Kuzan himself (cost 6)
    pick(g, [g.find('p1', 'trash', BP5)]);
    const played = g.find('p1', 'characters', BP5);
    expect(g.card(played).rested).toBe(true);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(BP5);
  });

  it('"up to 1": may play nothing', () => {
    const g = ko([BP4]);
    none(g);
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(BP4);
  });

  it('with no eligible card there is nothing to play', () => {
    const g = ko([BP6, V.c3, BP_EVENT]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.zone('p1', 'characters')).toEqual([]);
  });

  it('plays the card only when Kuzan is K.O.d: another K.O. does not touch the trash', () => {
    const g = koByBattle({ leader: BP_LEADER, trash: [BP4] }, V.c3);
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(BP4);
  });
});
