/**
 * OP09-003 Shachi & Penguin (Character, Red, cost 4, 5000, Counter +1000, {Heart Pirates}).
 *
 * Card text: "[When Attacking] Give up to 1 of your opponent's Characters −2000 power during this
 * turn."
 *
 * Rules: [When Attacking] activates when this Character declares an attack (CR 7-1-1-3, 10-2-...);
 * "up to 1" may be 0 (CR 8-4-4-1); only the opponent's Characters (not their Leader, not my own
 * cards); "during this turn" ends in the End Phase (CR 6-6-1-3, RL-09); a Character at 0 power or
 * below stays on the field (CR 4-12-2); an attacker wins a battle on a tie (CR 7-1-4).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, noDefence, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  allOf,
  at,
  canFinish,
  choices,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pending,
  pickInst,
  play,
  S9,
  settleEmpty,
  type Place,
} from './kit-op09a.ts';

const SP = 'OP09-003';

function board(p2chars: Place[] = [S9.c4], own: Place[] = [SP]): TestGame {
  return mine(L9.luffy, { characters: own }, { characters: p2chars });
}

describe('OP09-003 Shachi & Penguin: [When Attacking] up to 1 opposing Character −2000 this turn', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = board();
    const c = at(g, 'p1', 'characters', SP);
    expect(g.card(c).cost).toBe(4);
    expect(g.power(c)).toBe(5000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('when it attacks, I choose an opposing Character and it gets −2000', () => {
    const g = board([S9.c4, S9.c5]);
    attack(g, at(g, 'p1', 'characters', SP), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c4, S9.c5].sort());
    const target = at(g, 'p2', 'characters', S9.c5);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(6000);
  });

  it('only Characters of the opponent: neither their Leader nor my own cards are offered', () => {
    const g = board([S9.c4], [SP, S9.c3]);
    attack(g, at(g, 'p1', 'characters', SP), g.leader('p2'));
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).toEqual([at(g, 'p2', 'characters', S9.c4)]);
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(g.leader('p1'));
  });

  it('"up to 1": I may choose nobody; nothing changes', () => {
    const g = board([S9.c4]);
    attack(g, at(g, 'p1', 'characters', SP), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(6000);
  });

  it('boundary: attacking a rested 6000 Character, −2000 on it makes my 5000 attacker K.O. it; without it the target survives', () => {
    const g = board([{ card: S9.c4, rested: true }]);
    const sp = at(g, 'p1', 'characters', SP);
    const t = at(g, 'p2', 'characters', S9.c4);
    attack(g, sp, t);
    pickInst(g, [t]);
    expect(g.power(t)).toBe(4000);
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SP]);

    // Same position, effect declined: 5000 against 6000, the target survives.
    const h = board([{ card: S9.c4, rested: true }]);
    attack(h, at(h, 'p1', 'characters', SP), at(h, 'p2', 'characters', S9.c4));
    none(h);
    noDefence(h);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"during this turn": the −2000 lasts after the battle ends and is gone on the next turn', () => {
    const g = board([S9.c4]);
    const t = at(g, 'p2', 'characters', S9.c4);
    attack(g, at(g, 'p1', 'characters', SP), g.leader('p2'));
    pickInst(g, [t]);
    noDefence(g);
    expect(g.power(t)).toBe(4000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(t)).toBe(6000);
  });

  it('a 2000-power Character goes to 0 power and stays on the field (CR 4-12-2)', () => {
    const g = board([S9.limBlocker]);
    const t = at(g, 'p2', 'characters', S9.limBlocker);
    attack(g, at(g, 'p1', 'characters', SP), g.leader('p2'));
    pickInst(g, [t]);
    expect(g.power(t)).toBe(0);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([S9.limBlocker]);
  });

  it('with no opposing Character the attack goes on: nothing to choose', () => {
    const g = board([]);
    attack(g, at(g, 'p1', 'characters', SP), g.leader('p2'));
    settleEmpty(g);
    expect(kind(g), pending(g)).toBe('block');
  });

  it('two copies each trigger on their own attack and the reductions add up (−4000)', () => {
    const g = board([S9.c5], [SP, SP]);
    const [a, b] = allOf(g, 'p1', SP);
    const t = at(g, 'p2', 'characters', S9.c5);
    attack(g, a!, g.leader('p2'));
    pickInst(g, [t]);
    noDefence(g);
    attack(g, b!, g.leader('p2'));
    pickInst(g, [t]);
    expect(g.power(t)).toBe(3000);
  });

  it('must not happen: playing it (no attack) asks nothing, and a blocked attack still applied the effect', () => {
    const g = mine(L9.luffy, { hand: [SP] }, { characters: [S9.c4] });
    play(g, g.find('p1', 'hand', SP));
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(6000);

    const h = board([S9.c4, S9.vasco]);
    const t = at(h, 'p2', 'characters', S9.c4);
    attack(h, at(h, 'p1', 'characters', SP), h.leader('p2'));
    pickInst(h, [t]);
    // The Block Step comes after the effect: p2 may block with the Blocker; the −2000 stays.
    act(h, { type: 'block', blocker: at(h, 'p2', 'characters', S9.vasco) });
    expect(h.power(t)).toBe(4000);
    void passBlock;
  });
});
