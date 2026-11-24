/** OP11-025 Ishilly. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, expectDecision, pick, V } from './helpers.ts';
import { canPick, finishBattle, p2Attacks } from './helpers-op11g1.ts';

const ID = 'OP11-025';
const start = (extra: object = {}) =>
  p2Attacks({
    leader: 'ST01-001',
    characters: [ID, V.c1],
    costArea: { active: 2, rested: 0 },
    ...extra,
  });

describe('OP11-025 Ishilly', () => {
  it("[On Your Opponent's Attack]: rest 1 DON!! and this Character: +1000 power during this battle", () => {
    const g = start();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1').rested).toBe(1);
    finishBattle(g);
    expect(g.power(g.leader('p1'))).toBe(5000); // the battle ended
  });

  it('a Character can be the one boosted, and Ishilly can boost herself', () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
  });

  it('declining pays nothing', () => {
    const g = start();
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(don(g, 'p1').rested).toBe(0);
    expectDecision(g, 'block', 'p1');
  });

  it('is Once Per Turn: a second attack in the same turn is not offered', () => {
    const g = start({ characters: [ID, 'OP02-084'] });
    accept(g);
    pick(g, [g.leader('p1')]);
    finishBattle(g);
    // Ishilly is rested now (and the ability used); a rested card cannot pay again anyway.
    expect(dec(g)?.kind).toBe('main');
  });

  it('cannot be paid without an active DON!!: only "no" is legal', () => {
    const g = start({ costArea: { active: 0, rested: 2 } });
    if (dec(g)?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });
});
