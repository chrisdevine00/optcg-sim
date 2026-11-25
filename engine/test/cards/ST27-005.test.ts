/** ST27-005 Marshall.D.Teach. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, V } from './helpers.ts';
import {
  activate,
  BP4,
  BP_EVENT,
  BP_LEADER,
  canPick,
  koByBattle,
  mk,
  offeredAb,
} from './helpers-st2627.ts';

const ID = 'ST27-005';
const me = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);
const start = (mine: string[] = [], opp: string[] = [V.c3, V.c4]) =>
  mk({ leader: BP_LEADER, characters: [ID, ...mine] }, { characters: opp });

describe('ST27-005 Marshall.D.Teach', () => {
  it('[Activate: Main] rests this Character: K.O. up to 1 Character with a cost of 3 or less', () => {
    const g = start();
    activate(g, me(g), 'ko');
    expect(g.card(me(g)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3 inclusive
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // cost 4
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c4]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c3]);
  });

  it('either side: your own Character with a cost of 3 or less is a candidate too', () => {
    const g = start([V.c2]);
    activate(g, me(g), 'ko');
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c2]);
  });

  it('"up to 1": may K.O. nothing, and the cost is still paid', () => {
    const g = start();
    activate(g, me(g), 'ko');
    none(g);
    expect(g.card(me(g)).rested).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('a rested Teach cannot activate (the cost needs an active Character)', () => {
    const g = mk(
      { leader: BP_LEADER, characters: [{ card: ID, rested: true }] },
      { characters: [V.c1] },
    );
    expect(offeredAb(g, me(g), 'ko')).toBe(false);
  });

  it('[On K.O.] adds up to 1 black card from your trash to your hand (Teach himself, a black Event, not a purple card)', () => {
    const g = koByBattle({ leader: BP_LEADER, trash: [BP4, V.c1, BP_EVENT] }, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', BP4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', BP_EVENT))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', ID))).toBe(true); // Teach is black and in the trash
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'trash', BP4)]);
    expect(hand(g, 'p1')).toEqual([BP4]);
  });

  it('[On K.O.] "up to 1" may add nothing', () => {
    const g = koByBattle({ leader: BP_LEADER, trash: [BP4] }, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(dec(g)?.kind).not.toBe('choose');
  });
});
