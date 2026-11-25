/**
 * ST28-004 Kouzuki Momonosuke (Yellow Character, cost 6, 7000, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[Your Turn] If you have 2 or less Life cards, your Leader gains +1000 power.
 * [Activate: Main] [Once Per Turn] You may return 2 total of your currently given DON!! cards to
 * your cost area rested: This Character gains [Rush] and +1000 power during this turn."
 *
 * Rules: the [Your Turn] effect is a continuous effect on the owner's turn only; "2 or less" counts
 * 0, 1 and 2 Life. Given DON!! add +1000 to their host on the owner's turn (rules-digest 82). The
 * cost needs 2 DON!! that are currently GIVEN (active or rested cost-area DON!! do not count); the
 * 2 may come from the Leader, this Character or other Characters in any split. The DON!! return to
 * the cost area RESTED (they are not sent to the DON!! deck). Rush lets a Character attack on the
 * turn it is played; the effects last this turn only.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId } from '@optcg/engine';
import { act, attack, canAttack } from '../../helpers.ts';
import {
  at,
  atMain,
  BLUE,
  dons,
  donChoices,
  kind,
  LD14,
  mine,
  need,
  offeredAbilities,
  pwr,
  SC14,
  theirs,
  toMyNextMain,
} from './kit-lfd.ts';

const MOM = 'ST28-004';

interface Setup {
  /** DON!! given to the Leader. */
  leaderDon?: number;
  /** DON!! given to Momonosuke. */
  momDon?: number;
  /** DON!! given to a second Character (a 3000 vanilla). */
  otherDon?: number;
  life?: number;
  playedThisTurn?: boolean;
  active?: number;
  rested?: number;
}

function game(s: Setup = {}) {
  const given = (s.leaderDon ?? 0) + (s.momDon ?? 0) + (s.otherDon ?? 0);
  const active = s.active ?? 10 - given - (s.rested ?? 0);
  const chars: (CardId | { card: CardId; don?: number; playedThisTurn?: boolean })[] = [
    { card: MOM, don: s.momDon ?? 0, playedThisTurn: s.playedThisTurn ?? false },
  ];
  if (s.otherDon !== undefined) chars.push({ card: SC14.c2, don: s.otherDon });
  return mine(
    { card: LD14.neutral, don: s.leaderDon ?? 0 },
    {
      characters: chars,
      life: Array.from({ length: s.life ?? 4 }, () => BLUE),
      costArea: { active, rested: s.rested ?? 0 },
    },
  );
}

function mom(g: ReturnType<typeof game>): InstanceId {
  return at(g, 'p1', 'characters', MOM);
}

function activate(g: ReturnType<typeof game>): void {
  const a = g.legal().find((x) => x.type === 'activate' && x.card === mom(g));
  if (!a) throw new Error('Momonosuke has no legal activation');
  act(g, a as never);
}

function canActivate(g: ReturnType<typeof game>): boolean {
  return g.legal().some((x) => x.type === 'activate' && x.card === mom(g));
}

describe('ST28-004 Kouzuki Momonosuke: [Your Turn] with 2 or less Life, the Leader gains +1000', () => {
  it('with 2 Life on my turn the Leader has 5000 + 1000', () => {
    const g = game({ life: 2 });
    expect(pwr(g, g.leader('p1'))).toBe(6000);
  });

  it('boundary: 3 Life gives nothing (5000), 1 and 0 Life still give +1000', () => {
    expect(pwr(game({ life: 3 }), game({ life: 3 }).leader('p1'))).toBe(5000);
    for (const life of [1, 0]) {
      const g = game({ life });
      expect(pwr(g, g.leader('p1'))).toBe(6000);
    }
  });

  it('only on my turn: on the opponent’s turn the Leader stays 5000 even with 2 Life', () => {
    const g = theirs(LD14.neutral, {
      characters: [MOM],
      life: [BLUE, BLUE],
    });
    expect(pwr(g, g.leader('p1'))).toBe(5000);
  });

  it('only the Leader gains power: Momonosuke herself stays 7000', () => {
    const g = game({ life: 2 });
    expect(pwr(g, mom(g))).toBe(7000);
  });

  it('given DON!! on the Leader add their own +1000 on top (5000 + 1000 + 1000)', () => {
    const g = game({ life: 2, leaderDon: 1 });
    expect(pwr(g, g.leader('p1'))).toBe(7000);
  });
});

describe('ST28-004 Kouzuki Momonosuke: [Activate: Main] [Once Per Turn] return 2 given DON!!: Rush and +1000', () => {
  it('2 given in total (1 Leader + 1 Momonosuke): activates, both go to the cost area RESTED, none to the DON!! deck', () => {
    const g = game({ leaderDon: 1, momDon: 1, active: 5, rested: 1 });
    const before = dons(g);
    expect(before).toEqual({ deck: 10 - 8, active: 5, rested: 1, given: 2 });
    activate(g);
    // The 2 DON!! are fixed (one per card): nothing is left to choose.
    if (kind(g) === 'choose') {
      for (const c of donChoices(g)) act(g, { type: 'pick', choice: c });
    }
    expect(atMain(g)).toBe(true);
    expect(dons(g)).toEqual({ deck: before.deck, active: 5, rested: 3, given: 0 });
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(mom(g)).don).toBe(0);
  });

  it('this Character gains +1000 power this turn: 7000 -> 8000 (no DON!! of its own)', () => {
    const g = game({ leaderDon: 2 });
    expect(pwr(g, mom(g))).toBe(7000);
    activate(g);
    if (kind(g) === 'choose') {
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    }
    expect(pwr(g, mom(g))).toBe(8000);
  });

  it('DON!! returned from Momonosuke herself lose their +1000: 7000 + 2000 -> 7000 + 1000', () => {
    const g = game({ momDon: 2 });
    expect(pwr(g, mom(g))).toBe(9000);
    activate(g);
    if (kind(g) === 'choose') {
      act(g, { type: 'pick', choice: { from: 'given', card: mom(g) } });
      act(g, { type: 'pick', choice: { from: 'given', card: mom(g) } });
    }
    expect(dons(g).given).toBe(0);
    expect(pwr(g, mom(g))).toBe(8000);
  });

  it('gains [Rush]: a Momonosuke played this turn cannot attack before, and can attack after', () => {
    const g = game({ leaderDon: 2, playedThisTurn: true });
    expect(canAttack(g, mom(g), g.leader('p2'))).toBe(false);
    activate(g);
    if (kind(g) === 'choose') {
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    }
    expect(g.card(mom(g)).keywords).toContain('Rush');
    expect(canAttack(g, mom(g), g.leader('p2'))).toBe(true);
    attack(g, mom(g), g.leader('p2'));
    need(g, 'block', 'p2');
  });

  it('unpayable: with only 1 given DON!! the ability cannot be activated (rested and active DON!! do not count)', () => {
    const g = game({ leaderDon: 1, active: 5, rested: 4 });
    expect(canActivate(g)).toBe(false);
    expect(offeredAbilities(g, mom(g))).toEqual([]);
  });

  it('unpayable: no given DON!! at all, 10 active DON!! in the cost area: not offered', () => {
    const g = game();
    expect(canActivate(g)).toBe(false);
  });

  it('three given DON!! on three cards: the cost asks which 2 (only holders are offered); a pick from two different cards pays it', () => {
    const g = game({ leaderDon: 1, momDon: 1, otherDon: 1 });
    activate(g);
    need(g, 'choose', 'p1');
    // Exact-N picks list only the cards that can start a selection (API-GAPS-d 1): a subset.
    const holders = [g.leader('p1'), mom(g), at(g, 'p1', 'characters', SC14.c2)];
    const offered = donChoices(g).map((c) => (c.from === 'given' ? c.card : c.from));
    expect(offered.length).toBeGreaterThanOrEqual(2);
    for (const o of offered) expect(holders).toContain(o);
    act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    act(g, { type: 'pick', choice: { from: 'given', card: at(g, 'p1', 'characters', SC14.c2) } });
    expect(atMain(g)).toBe(true);
    expect(g.card(mom(g)).don).toBe(1);
    expect(dons(g)).toMatchObject({ rested: 2, given: 1 });
  });

  it('both DON!! may come from ONE card: Leader with 2 given, picked twice', () => {
    const g = game({ leaderDon: 2, momDon: 1 });
    activate(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(mom(g)).don).toBe(1);
    expect(dons(g).rested).toBe(2);
  });

  it('a card with 1 given DON!! is offered only once: after picking it, only the other card remains', () => {
    const g = game({ leaderDon: 1, momDon: 2 });
    activate(g);
    act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    expect(donChoices(g).every((c) => c.from === 'given' && c.card === mom(g))).toBe(true);
    act(g, { type: 'pick', choice: { from: 'given', card: mom(g) } });
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(mom(g)).don).toBe(1);
  });

  it('Once Per Turn: after using it, even 2 more given DON!! do not allow a second activation', () => {
    const g = game({ leaderDon: 4 });
    activate(g);
    if (kind(g) === 'choose') {
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    }
    expect(dons(g).given).toBe(2);
    expect(canActivate(g)).toBe(false);
  });

  it('the +1000 and Rush last this turn only: next turn Momonosuke is back to 7000 with no Rush', () => {
    const g = game({ leaderDon: 2 });
    activate(g);
    if (kind(g) === 'choose') {
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
      act(g, { type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    }
    toMyNextMain(g);
    expect(atMain(g)).toBe(true);
    expect(pwr(g, mom(g))).toBe(7000);
    expect(g.card(mom(g)).keywords).not.toContain('Rush');
  });

  it('Main only: on the opponent’s turn it cannot be activated', () => {
    const g = theirs(LD14.neutral, {
      characters: [{ card: MOM, don: 2 }],
      costArea: { active: 0, rested: 0 },
    });
    expect(canActivate(g)).toBe(false);
  });
});
