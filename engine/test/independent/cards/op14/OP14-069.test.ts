/**
 * OP14-069 Donquixote Doflamingo (Character, Purple, cost 10, 10000, no Counter,
 * {Donquixote Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[On Play] DON!! −3: Choose one:
 * • If your Leader has the {Donquixote Pirates} type, K.O. up to 1 of your opponent's Characters
 *   with a cost of 8 or less.
 * • Up to 3 of your opponent's Characters with a cost of 7 or less cannot be rested until the end of
 *   your opponent's next End Phase."
 *
 * Rules: RL-52 / CR 8-3-1-4 (a "may" DON!! −X cost may be declined and then nothing happens),
 * "choose one" (CR 8-3-2-2), "cannot be rested" (rules-digest 57: stops every rest, so the Character
 * cannot attack or block while it lasts), RL-11 ("until the end of your opponent's next End Phase":
 * through the opponent's next turn, gone after its End Phase).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  canAttackAnything,
  chars,
  charState,
  chr,
  decision,
  donOf14,
  endTurn,
  kind,
  LD14,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  onField,
  payDon,
  playRaw,
  reachablePickSets,
  SC14,
  yes,
} from './kit-op14c.ts';

const ID = 'OP14-069';
const FRANKY = 'OP09-072'; // Purple, cost 4, 5000, [Blocker]

type G = ReturnType<typeof mine>;

/** p1 plays Doflamingo with 10 active DON!!, accepts DON!! −3 and stops at the "choose one". */
function toModes(p2chars: string[], leader: string = LD14.dp): G {
  const g = mine(
    leader,
    { hand: [ID], costArea: { active: 10, rested: 0 } },
    { characters: p2chars },
  );
  playRaw(g, ID);
  yes(g, 'p1');
  payDon(g, 3, 'costRested');
  need(g, 'choose', 'p1');
  return g;
}

/** Choose the mode whose text matches. */
function mode(g: G, text: RegExp): void {
  const d = decision(g)!;
  const o = d.options!.find((x) => text.test(x.label));
  if (!o) throw new Error(`no mode ${text} in ${d.options?.map((x) => x.label)}`);
  act(g, { type: 'pick', choice: { option: o.id } });
}
const KO_MODE = /K\.O\./;
const LOCK_MODE = /cannot be rested/;

describe('OP14-069 Doflamingo [On Play] DON!! −3: choose one', () => {
  it('is offered on play; paying DON!! −3 returns 3 DON!! to the DON!! deck, then 2 modes are offered', () => {
    const g = toModes([SC14.c3]);
    expect(onField(g)).toBe(7);
    expect(donOf14(g).deck).toBe(3);
    expect(decision(g)!.options).toHaveLength(2);
  });

  it('mode 1 (Leader {Donquixote Pirates}): K.O.s a Character with cost 8, not cost 9', () => {
    const g = toModes([SC14.c8, SC14.c9, SC14.c3]);
    mode(g, KO_MODE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c8, SC14.c3].sort());
    act(g, { type: 'pick', choice: at(g, 'p2', 'characters', SC14.c8) });
    expect(charState(g, 'p2')).toBe(
      `${SC14.c3}:A,${SC14.c9}:A,${SC14.c8}:T`.split(',').sort().join(','),
    );
  });

  it('mode 1: "up to 1" may K.O. nothing; at most one is K.O.d', () => {
    const g = toModes([SC14.c8, SC14.c3]);
    mode(g, KO_MODE);
    expect(mayChooseNone(g)).toBe(true);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(chars(g, 'p2')).toEqual([SC14.c3, SC14.c8].sort());
  });

  it('mode 1 needs a {Donquixote Pirates} Leader: with another Leader no Character is K.O.d', () => {
    const g = toModes([SC14.c3], LD14.plain);
    mode(g, KO_MODE);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      if (mayChooseNone(g)) none(g);
    }
    expect(chars(g, 'p2')).toEqual([SC14.c3]);
    expect(onField(g)).toBe(7);
  });

  it('mode 2: up to 3 Characters with cost 7 or less are offered (cost 8 is not), and at most 3 are chosen', () => {
    const g = toModes([SC14.c7, SC14.c1, SC14.c3, SC14.c4, SC14.c8]);
    mode(g, LOCK_MODE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(SC14.c8);
    expect(offeredIds(g)).toHaveLength(4);
    const sets = reachablePickSets(g);
    const sizes = [...sets].map((s) => s.split('+').filter(Boolean).length);
    expect(Math.max(...sizes)).toBe(3);
  });

  it('mode 2 works with any Leader (no {Donquixote Pirates} condition on it)', () => {
    const g = toModes([SC14.c3], LD14.plain);
    mode(g, LOCK_MODE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c3]);
  });

  it('mode 2: a locked Character cannot attack on their next turn, an unlocked one can', () => {
    const g = toModes([SC14.c3, SC14.c8]);
    mode(g, LOCK_MODE);
    act(g, { type: 'pick', choice: at(g, 'p2', 'characters', SC14.c3) });
    if (kind(g) === 'choose') act(g, { type: 'done' });
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, chr(g, 'p2', SC14.c3))).toBe(false);
    expect(canAttackAnything(g, chr(g, 'p2', SC14.c8))).toBe(true);
  });

  it('mode 2: a locked [Blocker] cannot block (blocking rests it) during my turn', () => {
    const g = toModes([FRANKY]);
    mode(g, LOCK_MODE);
    act(g, { type: 'pick', choice: at(g, 'p2', 'characters', FRANKY) });
    if (kind(g) === 'choose') act(g, { type: 'done' });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('mode 2 lasts until the end of the opponent’s next End Phase: gone on their following turn', () => {
    const g = toModes([SC14.c3]);
    mode(g, LOCK_MODE);
    act(g, { type: 'pick', choice: at(g, 'p2', 'characters', SC14.c3) });
    if (kind(g) === 'choose') act(g, { type: 'done' });
    endTurn(g); // p1 -> p2 (turn 4)
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, chr(g, 'p2', SC14.c3))).toBe(false);
    endTurn(g); // p2 -> p1 (turn 5)
    need(g, 'main', 'p1');
    endTurn(g); // p1 -> p2 (turn 6)
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, chr(g, 'p2', SC14.c3))).toBe(true);
  });

  it('declining the DON!! −3 does nothing: no DON!! returned, no mode, the Character stays', () => {
    const g = mine(
      LD14.dp,
      { hand: [ID], costArea: { active: 10, rested: 0 } },
      { characters: [SC14.c3] },
    );
    playRaw(g, ID);
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(onField(g)).toBe(10);
    expect(chars(g)).toEqual([ID]);
    expect(chars(g, 'p2')).toEqual([SC14.c3]);
  });
});
