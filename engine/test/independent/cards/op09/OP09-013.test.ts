/**
 * OP09-013 Yasopp (Character, Red, cost 5, 6000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] Up to 1 of your Leader gains +1000 power until the end of your opponent's next
 * turn. [DON!! x1] [When Attacking] Give up to 1 of your opponent's Characters −1000 power during
 * this turn."
 *
 * Rules: "until the end of your opponent's next turn" lasts through the opponent's whole next turn
 * and ends at its End Phase (RL-11, QA-OP09 OP09-093); "up to 1" may be 0 (CR 8-4-4-1); [DON!! x1]
 * needs at least 1 DON!! given to this Character (RL-13; each given DON!! is +1000 on my turn);
 * [When Attacking] reaches only opposing Characters; "during this turn" ends in the End Phase.
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, noDefence } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  canFinish,
  choices,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  play,
  S9,
  settleEmpty,
  type Place,
} from './kit-op09a.ts';

const YASOPP = 'OP09-013';

function played(own: Place[] = []): TestGame {
  const g = mine(L9.luffy, { hand: [YASOPP], characters: own }, { characters: [S9.c3] });
  play(g, g.find('p1', 'hand', YASOPP));
  return g;
}

function attacker(given: number): TestGame {
  return mine(
    L9.luffy,
    { characters: [{ card: YASOPP, don: given }], costArea: { active: 10 - given, rested: 0 } },
    { characters: [S9.c4, S9.c5] },
  );
}

describe('OP09-013 Yasopp: [On Play] Leader +1000 until the end of the opponent’s next turn; [DON!! x1] [When Attacking] opposing Character −1000', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = played();
    need(g, 'choose', 'p1');
    const y = at(g, 'p1', 'characters', YASOPP);
    expect(g.card(y).cost).toBe(5);
    expect(g.power(y)).toBe(6000);
    expect(g.card(y).counter).toBe(1000);
  });

  it('[On Play]: my Leader gains +1000 (5000 → 6000); only my Leader is offered', () => {
    const g = played([S9.c2]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', S9.c2))).toBe(4000);
  });

  it('"up to 1": I may choose nothing and the Leader stays at 5000', () => {
    const g = played();
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the +1000 lasts through the opponent’s whole next turn and ends with it', () => {
    const g = played();
    pickInst(g, [g.leader('p1')]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it matters in battle on the opponent’s turn: a 5000 attacker no longer connects with my 6000 Leader', () => {
    const g = played();
    pickInst(g, [g.leader('p1')]);
    endTurn(g);
    need(g, 'main', 'p2');
    attack(g, at(g, 'p2', 'characters', S9.c3), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('[DON!! x1] [When Attacking]: with 1 DON!! given, an opposing Character gets −1000; the Leader and my cards are not offered', () => {
    const g = attacker(1);
    attack(g, at(g, 'p1', 'characters', YASOPP), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c4, S9.c5].sort());
    const t = at(g, 'p2', 'characters', S9.c5);
    pickInst(g, [t]);
    expect(g.power(t)).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', YASOPP))).toBe(7000);
  });

  it('boundary: with no DON!! given, attacking asks nothing and changes nothing', () => {
    const g = attacker(0);
    attack(g, at(g, 'p1', 'characters', YASOPP), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(g.power(at(g, 'p2', 'characters', S9.c5))).toBe(7000);
  });

  it('"up to 1" at the attack: I may choose nobody', () => {
    const g = attacker(1);
    attack(g, at(g, 'p1', 'characters', YASOPP), g.leader('p2'));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(at(g, 'p2', 'characters', S9.c5))).toBe(7000);
  });

  it('"during this turn": the −1000 outlasts the battle and is gone on the opponent’s turn', () => {
    const g = attacker(1);
    const t = at(g, 'p2', 'characters', S9.c4);
    attack(g, at(g, 'p1', 'characters', YASOPP), g.leader('p2'));
    pickInst(g, [t]);
    noDefence(g);
    expect(g.power(t)).toBe(5000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(t)).toBe(6000);
  });

  it('with no opposing Character the attack simply goes on', () => {
    const g = mine(
      L9.luffy,
      { characters: [{ card: YASOPP, don: 1 }], costArea: { active: 9, rested: 0 } },
      { characters: [] },
    );
    attack(g, at(g, 'p1', 'characters', YASOPP), g.leader('p2'));
    settleEmpty(g);
    expect(kind(g)).toBe('block');
  });

  it('must not happen: the [When Attacking] part does not fire when Yasopp is played, and the Leader boost does not repeat', () => {
    const g = played();
    pickInst(g, [g.leader('p1')]);
    expect(g.power(at(g, 'p2', 'characters', S9.c3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});
