/** OP09-023 Adio. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, don, expectDecision, option, pick, play, V } from './helpers.ts';
import { canPick, finishBattle, mk, mkOdyssey, p2Attacks, setMost } from './helpers-a09g1.ts';

const ID = 'OP09-023';

describe('OP09-023 Adio', () => {
  it('[On Play]: with an {ODYSSEY} Leader, sets up to 3 of your DON!! cards as active', () => {
    const g = mkOdyssey({ hand: [ID], costArea: { active: 9, rested: 1 } });
    // cost 9: Adio's 9 DON!! are rested to pay, so all 10 are rested when [On Play] resolves
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
    expectDecision(g, 'choose', 'p1');
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });

  it('"up to 3" asks a count: 1 may be chosen, 0 too', () => {
    const one = mkOdyssey({ hand: [ID], costArea: { active: 9, rested: 1 } });
    play(one, ID);
    expectDecision(one, 'choose', 'p1');
    option(one, '1');
    expect(don(one, 'p1')).toMatchObject({ active: 1, rested: 9 });

    const zero = mkOdyssey({ hand: [ID], costArea: { active: 9, rested: 1 } });
    play(zero, ID);
    option(zero, '0');
    expect(don(zero, 'p1')).toMatchObject({ active: 0, rested: 10 });
  });

  it('must not set DON!! without an {ODYSSEY} Leader', () => {
    const g = mk({ hand: [ID], costArea: { active: 9, rested: 1 } });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
  });

  const oppAttack = (extra: object = {}) =>
    p2Attacks(
      { leader: 'ST01-001', characters: [ID, V.c1], costArea: { active: 3, rested: 0 }, ...extra },
      V.c4,
      [V.c4, V.c5],
    );

  it("[On Your Opponent's Attack] [Once Per Turn]: rest 1 DON!!: up to 1 of your Leader or Characters gains +2000 power during this battle", () => {
    const g = oppAttack();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    finishBattle(g);
    expect(g.power(g.leader('p1'))).toBe(5000); // the battle ended
  });

  it('declining pays nothing; with no active DON!! only "no" is legal', () => {
    const g = oppAttack();
    decline(g);
    expect(don(g, 'p1').rested).toBe(0);
    expectDecision(g, 'block', 'p1');

    const poor = oppAttack({ costArea: { active: 0, rested: 3 } });
    if (dec(poor)?.kind === 'optional') {
      expect(poor.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(poor);
    }
    expect(don(poor, 'p1').rested).toBe(3);
  });

  it('is Once Per Turn: a second attack in the same turn does not offer it again', () => {
    const g = oppAttack();
    accept(g);
    pick(g, [g.leader('p1')]);
    finishBattle(g);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c5),
      target: g.leader('p1'),
    });
    expect(dec(g)?.kind).toBe('block');
  });
});
