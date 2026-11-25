/**
 * OP09-011 Hongo (Character, Red, cost 3, 3000, Counter +2000, {Red-Haired Pirates}).
 *
 * Card text: "[Activate: Main] You may rest this Character: If your Leader has the "Red-Haired
 * Pirates" type, give up to 1 of your opponent's Characters −2000 power during this turn."
 *
 * Rules: the cost (rest this Character) needs it ACTIVE; the "If" comes after the colon, so it is a
 * condition on the effect, not on the activation: with a Leader of another type the activation is
 * still possible, the cost is paid and nothing happens (decision 2026-11-24, M4b-5); "up to 1" may
 * be 0 (CR 8-4-4-1); only opposing Characters; "during this turn" ends in the End Phase (CR
 * 6-6-1-3). Resting by cost needs no "can attack" status (summoning sickness only bars attacking).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
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
  offeredAbilities,
  offeredIds,
  pickInst,
  S9,
  settleEmpty,
  useAbility,
  type Place,
} from './kit-op09a.ts';

const HONGO = 'OP09-011';

function board(o: { leader?: string; own?: Place[]; p2?: Place[] } = {}): TestGame {
  return mine(
    o.leader ?? L9.rhp,
    { characters: o.own ?? [HONGO] },
    { characters: o.p2 ?? [S9.c4] },
  );
}

describe('OP09-011 Hongo: [Activate: Main] rest this Character: with a {Red-Haired Pirates} Leader, up to 1 opposing Character −2000', () => {
  it('printed values: cost 3, 3000, Counter +2000', () => {
    const g = board();
    const h = at(g, 'p1', 'characters', HONGO);
    expect(g.card(h).cost).toBe(3);
    expect(g.power(h)).toBe(3000);
    expect(g.card(h).counter).toBe(2000);
  });

  it('with a {Red-Haired Pirates} Leader: rests Hongo and the chosen opposing Character gets −2000', () => {
    const g = board({ p2: [S9.c4, S9.c5] });
    const h = at(g, 'p1', 'characters', HONGO);
    useAbility(g, h);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c4, S9.c5].sort());
    const t = at(g, 'p2', 'characters', S9.c5);
    pickInst(g, [t]);
    expect(atMain(g)).toBe(true);
    expect(g.card(h).rested).toBe(true);
    expect(g.power(t)).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(6000);
  });

  it('only opposing Characters are offered, not their Leader nor my own cards', () => {
    const g = board({ own: [HONGO, S9.c2] });
    useAbility(g, at(g, 'p1', 'characters', HONGO));
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', S9.c4)]);
  });

  it('"up to 1": I may choose nobody; the cost is still paid (Hongo is rested)', () => {
    const g = board();
    const h = at(g, 'p1', 'characters', HONGO);
    useAbility(g, h);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.card(h).rested).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(6000);
  });

  it('the Leader condition is on the effect: with a non-{Red-Haired Pirates} Leader the cost is paid and nothing happens', () => {
    const g = board({ leader: L9.luffy });
    const h = at(g, 'p1', 'characters', HONGO);
    expect(offeredAbilities(g, h)).toHaveLength(1);
    useAbility(g, h);
    settleEmpty(g);
    expect(kind(g)).toBe('main');
    expect(g.card(h).rested).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(6000);
  });

  it('the cost needs Hongo active: a rested Hongo has no activation', () => {
    const g = board({ own: [{ card: HONGO, rested: true }] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HONGO))).toEqual([]);
  });

  it('once rested it cannot be used again the same turn', () => {
    const g = board();
    const h = at(g, 'p1', 'characters', HONGO);
    useAbility(g, h);
    pickInst(g, [at(g, 'p2', 'characters', S9.c4)]);
    expect(offeredAbilities(g, h)).toEqual([]);
  });

  it('a Hongo played this turn can still be rested for its cost (it only could not attack)', () => {
    const g = board({ own: [{ card: HONGO, playedThisTurn: true }] });
    const h = at(g, 'p1', 'characters', HONGO);
    expect(offeredAbilities(g, h)).toHaveLength(1);
    useAbility(g, h);
    pickInst(g, [at(g, 'p2', 'characters', S9.c4)]);
    expect(g.power(at(g, 'p2', 'characters', S9.c4))).toBe(4000);
  });

  it('two Hongo each give −2000 to the same Character (−4000 in total)', () => {
    const g = board({ own: [HONGO, HONGO] });
    const [a, b] = g.zone('p1', 'characters').map((c) => c.instance);
    const t = at(g, 'p2', 'characters', S9.c4);
    useAbility(g, a!);
    pickInst(g, [t]);
    useAbility(g, b!);
    pickInst(g, [t]);
    expect(g.power(t)).toBe(2000);
  });

  it('"during this turn": the −2000 is gone on the opponent’s next turn', () => {
    const g = board();
    const t = at(g, 'p2', 'characters', S9.c4);
    useAbility(g, at(g, 'p1', 'characters', HONGO));
    pickInst(g, [t]);
    expect(g.power(t)).toBe(4000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(t)).toBe(6000);
  });

  it('with no opposing Character the activation still works as a cost-only use and ends cleanly', () => {
    const g = board({ p2: [] });
    const h = at(g, 'p1', 'characters', HONGO);
    expect(offeredAbilities(g, h)).toHaveLength(1);
    useAbility(g, h);
    settleEmpty(g);
    expect(kind(g)).toBe('main');
    expect(g.card(h).rested).toBe(true);
  });
});
