/**
 * OP09-015 Lucky.Roux (Character, Red, cost 4, 5000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.) [On K.O.] If your Leader has the "Red-Haired Pirates" type, K.O. up to
 * 1 of your opponent's Characters with a base power of 6000 or less."
 *
 * Rules: [On K.O.] activates when this Character is K.O.'d (in battle or by an effect, CR 10-2-?);
 * the Leader condition has no colon, so it is a condition on the effect; BASE power ignores
 * modifiers (CR 4-9); "up to 1" may be 0 (CR 8-4-4-1); only opposing Characters; K.O.'ing a
 * Character that has "cannot be K.O.'d by effects" does not K.O. it (RL-14).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, passBlock, passCounter } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  canFinish,
  chars,
  choices,
  kind,
  L9,
  need,
  none,
  offeredIds,
  opponentKOs,
  pickInst,
  S9,
  SC2,
  theirs,
  trash,
  type Place,
} from './kit-op09a.ts';

const ROUX = 'OP09-015';
const SHANKS_PERM = 'OP09-004'; // opposing Characters of its controller get −1000

/**
 * p2's turn. p1 (Leader `leader`) has Roux and `own`; p2 has a 6000 attacker (c4) plus `p2chars`.
 * p2 attacks my Leader with the attacker; I block with Roux, who is K.O.'d (5000 < 6000).
 */
function roux(leader: string, p2chars: Place[] = [], own: Place[] = []): TestGame {
  const g = theirs(leader, { characters: [ROUX, ...own] }, { characters: [S9.c4, ...p2chars] });
  attack(g, at(g, 'p2', 'characters', S9.c4), g.leader('p1'));
  expect(blockers(g)).toContain(at(g, 'p1', 'characters', ROUX));
  act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ROUX) });
  passCounter(g);
  return g;
}

describe('OP09-015 Lucky.Roux: [Blocker]; [On K.O.] with a {Red-Haired Pirates} Leader, K.O. up to 1 opposing Character with base power 6000 or less', () => {
  it('printed values: cost 4, 5000, Counter +1000, has [Blocker]', () => {
    const g = theirs(L9.rhp, { characters: [ROUX] }, {});
    const r = at(g, 'p1', 'characters', ROUX);
    expect(g.card(r).cost).toBe(4);
    expect(g.power(r)).toBe(5000);
    expect(g.card(r).counter).toBe(1000);
    expect(g.card(r).keywords).toContain('Blocker');
  });

  it('blocks and is K.O.d: with a {Red-Haired Pirates} Leader I K.O. the chosen opposing Character', () => {
    const g = roux(L9.rhp, [S9.c3]);
    need(g, 'choose', 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ROUX]);
    pickInst(g, [at(g, 'p2', 'characters', S9.c3)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([S9.c4]);
    expect(trash(g, 'p2')).toEqual([S9.c3]);
  });

  it('the attacker itself (6000 base, rested after attacking) is a legal target', () => {
    const g = roux(L9.rhp);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c4]);
    pickInst(g, [at(g, 'p2', 'characters', S9.c4)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('boundary: base power 6000 is offered, 7000 is not', () => {
    const g = roux(L9.rhp, [S9.c5, S9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c3, S9.c4].sort());
  });

  it('BASE power: a 7000-base Character lowered to 6000 (Shanks on my side, −1000) is still not offered', () => {
    const g = roux(L9.rhp, [S9.c5], [SHANKS_PERM]);
    // c4 itself (6000 base) is at 5000 now; the 7000-base Character is at 6000 current.
    need(g, 'choose', 'p1');
    expect(g.power(at(g, 'p2', 'characters', S9.c5))).toBe(6000);
    expect(offeredIds(g)).toEqual([S9.c4]);
  });

  it('"up to 1": I may K.O. nobody', () => {
    const g = roux(L9.rhp, [S9.c3]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('only opposing Characters are offered, never my own cards or their Leader', () => {
    const g = roux(L9.rhp, [], [S9.c2]);
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).toEqual([at(g, 'p2', 'characters', S9.c4)]);
    expect(offered).not.toContain(g.leader('p2'));
  });

  it('the Leader condition: with a Leader that is not {Red-Haired Pirates} nothing happens', () => {
    const g = roux(L9.luffy, [S9.c3]);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(trash(g)).toEqual([ROUX]);
  });

  it('[On K.O.] also fires when an effect K.O.s it (Gum-Gum Lightning)', () => {
    const g = theirs(
      L9.rhp,
      { characters: [ROUX] },
      { hand: [SC2.lightning], characters: [S9.c3] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', ROUX));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.c3)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([ROUX]);
  });

  it('must not happen: when Roux blocks and survives (a weaker attacker) no K.O. effect fires', () => {
    const g = theirs(L9.rhp, { characters: [ROUX] }, { characters: [S9.c2, S9.c3] });
    attack(g, at(g, 'p2', 'characters', S9.c2), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ROUX) });
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([ROUX]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    void passBlock;
  });
});
