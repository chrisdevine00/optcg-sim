/** OP09-093 Marshall.D.Teach (10 cost). */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB_LEADER,
  canActivate,
  canAttack,
  canPick,
  expectDecision,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-093';
const OPP_LEADER = 'OP09-081'; // an opposing Leader whose text can be negated
const start = (p1: object = {}) =>
  mk({ leader: BB_LEADER, hand: [ID], ...p1 }, { leader: OPP_LEADER, characters: [V.c5, V.c3] });

describe('OP09-093 Marshall.D.Teach', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[Activate: Main][Once Per Turn] played this turn: negates the Leader, then a Character that cannot attack', () => {
    const g = start();
    play(g, ID);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(true);
    pick(g, [g.leader('p2')]);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false); // the second pick is Characters only
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.leader('p2')).negated).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).negated).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBeFalsy();
    // The negated Character cannot attack on the opponent's next turn (end of turn first).
    g.act({ type: 'endTurn' });
    expect(canAttack(g, g.find('p2', 'characters', V.c5), g.leader('p1'))).toBe(false);
    expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(true);
  });

  it('"up to 1": the Leader may be skipped and only a Character chosen', () => {
    const g = start();
    play(g, ID);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBe(true);
  });

  it('choosing no Character restricts nothing', () => {
    const g = start();
    play(g, ID);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.leader('p2')]);
    none(g);
    g.act({ type: 'endTurn' });
    expect(canAttack(g, g.find('p2', 'characters', V.c5), g.leader('p1'))).toBe(true);
  });

  it('[Once Per Turn]: not offered again', () => {
    const g = start();
    play(g, ID);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    none(g);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('must not negate when it was not played this turn (the activation is spent)', () => {
    const g = start({ hand: [], characters: [ID] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('must not negate without a {Blackbeard Pirates} Leader', () => {
    const g = start({ leader: OTHER_LEADER });
    play(g, ID);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(g.card(g.find('p2', 'characters', V.c5)).negated).toBeFalsy();
  });
});
