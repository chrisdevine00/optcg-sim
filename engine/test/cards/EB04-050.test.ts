/** EB04-050 I'll Whip You Into Shape. ♡ (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, expectDecision, none, pick, V } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canHit, canPick, mk, SWORD7, SWORD_LEADER } from './helpers-w4sb.ts';

const ID = 'EB04-050';
const play = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('EB04-050 I’ll Whip You Into Shape. ♡', () => {
  it('[Main]: a {SWORD} Character can also attack active Characters this turn', () => {
    const g = mk({ hand: [ID], characters: [SWORD7, V.c4] }, { characters: [V.c1] });
    const sword = g.find('p1', 'characters', SWORD7);
    const active = g.find('p2', 'characters', V.c1);
    expect(canHit(g, sword, active)).toBe(false);
    play(g);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false); // not {SWORD}
    pick(g, [sword]);
    expect(canHit(g, sword, active)).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', V.c4), active)).toBe(false);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('a {SWORD} Leader is eligible', () => {
    const g = mk({ hand: [ID], leader: SWORD_LEADER }, { characters: [V.c1] });
    play(g);
    pick(g, [g.leader('p1')]);
    expect(canHit(g, g.leader('p1'), g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('"up to 1": choosing nothing grants nothing', () => {
    const g = mk({ hand: [ID], characters: [SWORD7] }, { characters: [V.c1] });
    play(g);
    none(g);
    expect(canHit(g, g.find('p1', 'characters', SWORD7), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });

  it('the grant ends with the turn', () => {
    const g = mk({ hand: [ID], characters: [SWORD7] }, { characters: [V.c1] });
    play(g);
    pick(g, [g.find('p1', 'characters', SWORD7)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canHit(g, g.find('p1', 'characters', SWORD7), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });

  it('[Counter]: your Leader gains +3000 power during this battle, so a 7000 attack fails', () => {
    const g = counterStep(
      { leader: SWORD_LEADER, hand: [ID], costArea: { active: 3, rested: 0 } },
      {},
      V.c5,
    );
    expectDecision(g, 'counter', 'p1');
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 8000 stops the 7000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000); // the boost ended with the battle
    expect(dec(g)?.kind).toBe('main');
  });

  it('[Counter] is not an attack grant: the Counter use asks nothing', () => {
    const g = counterStep(
      { leader: SWORD_LEADER, hand: [ID], costArea: { active: 3, rested: 0 } },
      {},
      V.c5,
    );
    useCounter(g, ID);
    expect(dec(g)?.kind).toBe('counter');
  });
});
