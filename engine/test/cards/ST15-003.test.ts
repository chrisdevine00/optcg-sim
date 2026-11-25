/** ST15-003 Kingdew. */
import { describe, expect, it } from 'vitest';
import { dec, pick, V } from './helpers.ts';
import { finishBattle, mk, plantLeaderEffect } from './helpers-prbst.ts';
import { koBy } from './helpers-w3s.ts';

const ID = 'ST15-003';

describe('ST15-003 Kingdew', () => {
  const opp = { turn: 4, activePlayer: 'p2' } as const;
  const start = (extra: object = opp, p1 = {}, p2 = {}) =>
    mk({ characters: [ID], ...p1 }, p2, extra);

  it('has [Blocker] (printed)', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[Opponent's Turn] K.O.'d by an effect: your Leader gains +2000 power during this turn", () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    pick(g, [g.leader('p1')]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it("also when K.O.'d by an effect that is played as a real opponent effect", () => {
    const g = start();
    plantLeaderEffect(g, { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it("must not fire: K.O.'d in battle gives nothing", () => {
    const g = start(opp, { characters: [{ card: ID, rested: true }] }, { characters: [V.c7] });
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    finishBattle(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('main');
  });

  it("must not fire: on your own turn (it is an [Opponent's Turn] effect)", () => {
    const g = start({});
    koBy(g, 'p1', ID, 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('main');
  });

  it('the +2000 ends with the turn', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    pick(g, [g.leader('p1')]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
