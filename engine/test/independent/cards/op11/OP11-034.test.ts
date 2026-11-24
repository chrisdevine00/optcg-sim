/**
 * OP11-034 Hatchan (Character, Green, cost 4, 5000, Counter +1000, {Fish-Man}/{Former Arlong
 * Pirates}/{Fish-Man Island}).
 *
 * Card text: "[Activate: Main] You may rest this Character: If your Leader has the "Fish-Man" or
 * "Merfolk" type, up to 1 of your opponent's Characters with a cost of 3 or less cannot be rested
 * until the end of your opponent's next turn."
 *
 * Rules: a Character that "cannot be rested" cannot attack (attacking rests it), cannot activate
 * [Blocker] and cannot be rested by effects (rules-digest 57, QA-GR). The duration runs through the
 * opponent's next turn. Resting this Character is the cost. "Up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  canAttackAnything,
  chr,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  useAbility,
} from './kit-op11a.ts';

const HATCHAN = 'OP11-034';
/** OP09-071 Nico Robin: cost 2, 2000, [Blocker]. */
const BLOCKER2 = 'OP09-071';

function board(leader: string, p2: string[] = [N11.marco, N11.hajrudin]) {
  return mine(leader, { characters: [HATCHAN, N11.navy3] }, { characters: p2 });
}

function activate(g: ReturnType<typeof board>) {
  useAbility(g, chr(g, 'p1', HATCHAN));
  if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
}

describe('OP11-034 Hatchan: [Activate: Main] rest this: an opposing Character with cost 3 or less cannot be rested', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = board(L11.fishLeader);
    const h = chr(g, 'p1', HATCHAN);
    expect(g.card(h).cost).toBe(4);
    expect(g.power(h)).toBe(5000);
    expect(g.card(h).counter).toBe(1000);
  });

  it('with a Fish-Man Leader: the chosen Character cannot attack on the opponent’s next turn, the other can', () => {
    const g = board(L11.fishLeader);
    activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    expect(g.card(chr(g, 'p1', HATCHAN)).rested).toBe(true);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, chr(g, 'p2', N11.marco))).toBe(false);
    expect(canAttackAnything(g, chr(g, 'p2', N11.hajrudin))).toBe(true);
  });

  it('with a Merfolk Leader it works too', () => {
    const g = board(L11.shirahoshi);
    activate(g);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    act(g, { type: 'endTurn' });
    expect(canAttackAnything(g, chr(g, 'p2', N11.marco))).toBe(false);
  });

  it('with any other Leader the target can still attack', () => {
    const g = board(L11.luffy);
    if (offeredAbilities(g, chr(g, 'p1', HATCHAN)).length) {
      activate(g);
      if (kind(g) === 'choose') none(g);
    }
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('boundary: cost 3 is offered, cost 4 is not; my Characters are never offered', () => {
    const g = board(L11.fishLeader, [N11.marco, N11.hajrudin, N11.sai]);
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco, N11.sai].sort());
  });

  it('"up to 1": choosing no one still rests Hatchan and restricts nothing', () => {
    const g = board(L11.fishLeader);
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p1', HATCHAN)).rested).toBe(true);
    act(g, { type: 'endTurn' });
    expect(canAttackAnything(g, chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('lasts until the end of the opponent’s next turn only: the turn after, it can attack again', () => {
    const g = board(L11.fishLeader);
    activate(g);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('it also covers the rest of my turn: a [Blocker] with cost 2 cannot block (blocking rests it)', () => {
    const g = mine(
      L11.fishLeader,
      { characters: [HATCHAN, N11.navy3] },
      { characters: [BLOCKER2, N11.marco] },
    );
    activate(g);
    pickInst(g, [chr(g, 'p2', BLOCKER2)]);
    attack(g, chr(g, 'p1', N11.navy3), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('an effect of mine cannot rest it either: Praline\u2019s [On Play] leaves the protected Character active', () => {
    const g = mine(
      L11.fishLeader,
      { hand: ['OP11-029'], characters: [HATCHAN] },
      { characters: [N11.komachiyo] },
    );
    activate(g);
    pickInst(g, [chr(g, 'p2', N11.komachiyo)]);
    playRaw(g, 'OP11-029');
    if (kind(g) === 'choose' && offeredIds(g).length) pickInst(g, [chr(g, 'p2', N11.komachiyo)]);
    else if (kind(g) === 'choose') none(g);
    expect(g.card(chr(g, 'p2', N11.komachiyo)).rested).toBe(false);
  });

  it('a rested Hatchan cannot use it', () => {
    const g = mine(
      L11.fishLeader,
      { characters: [{ card: HATCHAN, rested: true }] },
      { characters: [N11.marco] },
    );
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HATCHAN))).toEqual([]);
  });
});
