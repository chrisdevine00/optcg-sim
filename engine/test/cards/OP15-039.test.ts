/** OP15-039 Rebecca (Leader). */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { canActivate, canAttack } from './helpers-op16g1.ts';
import { DR, EVENT, mk, PLAIN3, REBECCA } from './helpers-op15g1.ts';

const act = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'activate' });

describe('OP15-039 Rebecca', () => {
  const start = (characters: string[], hand: string[] = [DR.c3, DR.c5, PLAIN3, EVENT]) =>
    mk({ leader: REBECCA, characters, hand });

  it('this Leader cannot attack', () => {
    const g = start([DR.c2], []);
    expect(canAttack(g, g.leader('p1'), g.leader('p2'))).toBe(false);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === g.leader('p1'))).toBe(false);
  });

  it('[Activate: Main]: rests this Leader and returns a {Dressrosa} Character of your choice, then plays a cost-3 {Dressrosa} Character from hand', () => {
    const g = start([DR.c2, DR.c7, V.c1]);
    expect(canActivate(g, g.leader('p1'), 'activate')).toBe(true);
    act(g);
    // only the two {Dressrosa} Characters can be returned
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', DR.c2)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    // the cost-5 Dressrosa, the cost-3 non-Dressrosa, the returned cost-2 and the Event are not candidates
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', DR.c3)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([DR.c7, V.c1, DR.c3]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(DR.c2);
  });

  it('the returned Character is in hand when the play is chosen: a cost-3 Dressrosa can replace itself', () => {
    const g = start([DR.c3], []);
    act(g);
    pick(g, [g.find('p1', 'hand', DR.c3)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([DR.c3]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('"up to 1": the cost is paid and nothing may be played', () => {
    const g = start([DR.c2]);
    act(g);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expectDecision(g, 'main', 'p1');
  });

  it('cannot be activated without a {Dressrosa} Character to return, or with the Leader rested', () => {
    const noDr = start([PLAIN3]);
    expect(canActivate(noDr, noDr.leader('p1'), 'activate')).toBe(false);
    const empty = start([]);
    expect(canActivate(empty, empty.leader('p1'), 'activate')).toBe(false);
    const g = mk({ leader: { card: REBECCA, rested: true }, characters: [DR.c2], hand: [DR.c3] });
    expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
  });
});
