/**
 * OP09-014 Limejuice (Character, Red, cost 3, 3000, Counter +2000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] Your opponent cannot activate up to 1 [Blocker] Character that has 4000 power
 * or less during this turn."
 *
 * Rules: [Blocker] is activated by the defender in the Block Step (CR 10-1-4); the target must be an
 * opposing Character that HAS [Blocker] and has 4000 power or less (current power) when chosen;
 * "up to 1" may be 0 (CR 8-4-4-1); "during this turn" ends in the End Phase (CR 6-6-1-3) and covers
 * every attack of the turn; other Blockers can still block.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, endTurn, noDefence } from '../../helpers.ts';
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
  type Place,
} from './kit-op09a.ts';

const LIME = 'OP09-014';
const SHANKS_PERM = 'OP09-004'; // my permanent: all opposing Characters −1000

function played(p2chars: Place[], own: Place[] = [S9.c3]): TestGame {
  const g = mine(L9.luffy, { hand: [LIME], characters: own }, { characters: p2chars });
  play(g, g.find('p1', 'hand', LIME));
  return g;
}

describe('OP09-014 Limejuice: [On Play] the opponent cannot activate up to 1 [Blocker] Character with 4000 power or less this turn', () => {
  it('printed values: cost 3, 3000, Counter +2000', () => {
    const g = played([]);
    if (kind(g) === 'choose') none(g);
    const l = at(g, 'p1', 'characters', LIME);
    expect(g.card(l).cost).toBe(3);
    expect(g.power(l)).toBe(3000);
    expect(g.card(l).counter).toBe(2000);
  });

  it('offers only opposing [Blocker] Characters with 4000 power or less (4000 yes; 5000, 7000 and non-Blockers no)', () => {
    const g = played([S9.vasco, S9.heat, S9.roux, S9.law7, S9.c1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.vasco, S9.heat].sort());
  });

  it('the chosen Blocker cannot block my attack; the attack reaches the Leader', () => {
    const g = played([S9.vasco]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.vasco)]);
    expect(atMain(g)).toBe(true);
    attack(g, at(g, 'p1', 'characters', S9.c3), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });

  it('control: without the effect (declined) the same Blocker can block', () => {
    const g = played([S9.vasco]);
    need(g, 'choose', 'p1');
    none(g);
    attack(g, at(g, 'p1', 'characters', S9.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([at(g, 'p2', 'characters', S9.vasco)]);
  });

  it('"up to 1": only the chosen one is barred; another eligible Blocker can still block', () => {
    const g = played([S9.vasco, S9.heat]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.vasco)]);
    attack(g, at(g, 'p1', 'characters', S9.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([at(g, 'p2', 'characters', S9.heat)]);
  });

  it('an opposing Blocker with more than 4000 power can still block', () => {
    const g = played([S9.vasco, S9.roux]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.vasco]);
    pickInst(g, [at(g, 'p2', 'characters', S9.vasco)]);
    attack(g, at(g, 'p1', 'characters', S9.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([at(g, 'p2', 'characters', S9.roux)]);
  });

  it('the limit is on CURRENT power: a 5000 Blocker at 4000 (my Shanks, −1000) is offered, a 7000 one at 6000 is not', () => {
    const g = played([S9.roux, S9.law7], [S9.c3, SHANKS_PERM]);
    need(g, 'choose', 'p1');
    expect(g.power(at(g, 'p2', 'characters', S9.roux))).toBe(4000);
    expect(offeredIds(g)).toEqual([S9.roux]);
  });

  it('"up to 1": I may choose nobody', () => {
    const g = played([S9.vasco]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
  });

  it('with no eligible Blocker (only a non-Blocker) nothing is asked or changed', () => {
    const g = played([S9.c1]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
  });

  it('it lasts for the whole turn: a second attack of mine is also unblockable by it, but not on my next turn', () => {
    const g = played([S9.vasco], [S9.c3, S9.c4]);
    const v = at(g, 'p2', 'characters', S9.vasco);
    pickInst(g, [v]);
    attack(g, at(g, 'p1', 'characters', S9.c3), g.leader('p2'));
    noDefence(g);
    attack(g, at(g, 'p1', 'characters', S9.c4), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    attack(g, at(g, 'p1', 'characters', S9.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([v]);
    act(g, { type: 'block', blocker: v });
  });

  it('must not happen: my own Blockers are never offered', () => {
    const g = played([S9.vasco], [S9.c3, S9.heat]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', S9.vasco)]);
  });
});
