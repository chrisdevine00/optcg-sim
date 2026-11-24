/** OP13-005 Inazuma. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick, play, V } from './helpers.ts';
import { LUFFY_LEADER, mk } from './helpers-op13g1.ts';

const ID = 'OP13-005';

describe('OP13-005 Inazuma', () => {
  it('[On Play]: gives up to 1 rested DON!! card to your Leader', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    // The 4 DON!! that paid for Inazuma are the rested ones; one of them goes to the Leader.
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 3, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": the Leader may be skipped', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    none(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 4, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('gives exactly 1 (not more) when several DON!! are rested', () => {
    const g = mk({ hand: [ID], costArea: { active: 4, rested: 6 } });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 9, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('adds to DON!! the Leader already holds', () => {
    const g = mk({
      hand: [ID],
      leader: { card: LUFFY_LEADER, don: 2 },
      costArea: { active: 6, rested: 0 },
    });
    expect(g.power(g.leader('p1'))).toBe(7000);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ given: 3 });
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('goes to your Leader only: no Character and not the opponent', () => {
    const g = mk({ hand: [ID], characters: [V.c3] });
    play(g, ID);
    // The only candidate is the Leader.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(0);
  });

  it('must not fire without being played: Inazuma placed on the field gives nothing', () => {
    const g = mk({ characters: [ID], costArea: { active: 3, rested: 3 } });
    expect(don(g, 'p1')).toMatchObject({ given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'main', 'p1');
  });
});
