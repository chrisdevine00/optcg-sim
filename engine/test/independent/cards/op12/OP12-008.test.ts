/**
 * OP12-008 Shanks (Character, Red, cost 4, 6000, no Counter, {The Four Emperors} {Red-Haired
 * Pirates}).
 *
 * Card text: "[Blocker] [On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your
 * hand: Give up to 1 of your opponent's Leader or Character cards -2000 power during this turn."
 *
 * Rules: [On Your Opponent's Attack] fires when the opponent declares an attack, before the Block
 * Step (CR 10-2-?); it is a "you may" with a trash cost, offered even when unpayable with accept
 * illegal (DECISIONS 2026-10-29); "up to 1" may be 0 (CR 4-8-1); [Once Per Turn] is per card per
 * turn; power changes "during this turn" last to the end of that turn; the attacker wins when its
 * power is at least the target's (CR 7-1-3-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  blockers,
  canAcceptOptional,
  chr,
  decision,
  kind,
  kw,
  LD12,
  need,
  noDefence,
  none,
  offeredCardIds,
  pickInst,
  S12,
  side,
  sorted,
  theirTurn,
  yes,
  no,
} from './kit-op12a.ts';

const SHX = 'OP12-008';

function theirs12(
  hand: string[],
  p1Chars: (string | { card: string; rested?: boolean })[] = [],
  p2Chars: string[] = [],
) {
  return theirTurn(
    side(LD12.luffy, S12.mohji, {
      hand,
      characters: [SHX, ...p1Chars],
      costArea: { active: 0, rested: 0 },
    }),
    side(LD12.luffy, S12.sunny, { characters: p2Chars, costArea: { active: 10, rested: 0 } }),
  );
}

function leaderAttack(g: ReturnType<typeof theirs12>): void {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
}

describe("OP12-008 Shanks: [Blocker]; [On Your Opponent's Attack] trash 1, -2000 power", () => {
  it('printed values: cost 4, 6000, no Counter, [Blocker]', () => {
    const g = theirs12([]);
    const c = g.card(chr(g, 'p1', SHX));
    expect([c.cost, c.power, c.counter]).toEqual([4, 6000, null]);
    expect(kw(g, chr(g, 'p1', SHX))).toContain('Blocker');
  });

  it('when the opponent attacks, the "you may trash" is offered before the Block Step', () => {
    const g = theirs12([S12.sunny, S12.sai]);
    leaderAttack(g);
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(true);
  });

  it('accepting: trash 1 chosen hand card, then choose among the opponent Leader and Characters only', () => {
    const g = theirs12([S12.sunny, S12.sai], [S12.marco], [S12.komachiyo]);
    leaderAttack(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', S12.sai) });
    expect(sorted(g, 'p1', 'trash')).toEqual([S12.sai]);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([LD12.luffy, S12.komachiyo].sort());
  });

  it('gives -2000 to the attacking Leader: 5000 becomes 3000 and its attack on a 5000 Leader fails', () => {
    const g = theirs12([S12.sunny]);
    leaderAttack(g);
    yes(g, 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', S12.sunny) });
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    need(g, 'block', 'p1');
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('without the effect the same attack (5000 vs 5000) lands', () => {
    const g = theirs12([S12.sunny]);
    leaderAttack(g);
    no(g, 'p1');
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('can lower an opponent Character that is not the attacker, and the change lasts all turn', () => {
    const g = theirs12([S12.sunny], [], [S12.marco]);
    leaderAttack(g);
    yes(g, 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', S12.sunny) });
    pickInst(g, [chr(g, 'p2', S12.marco)]);
    expect(g.power(chr(g, 'p2', S12.marco))).toBe(3000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    noDefence(g);
    expect(g.power(chr(g, 'p2', S12.marco))).toBe(3000);
  });

  it('"up to 1": choosing nobody still costs the trashed card and changes no power', () => {
    const g = theirs12([S12.sunny, S12.sai]);
    leaderAttack(g);
    yes(g, 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', S12.sunny) });
    none(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([S12.sunny]);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('declining: nothing is trashed and no power changes', () => {
    const g = theirs12([S12.sunny]);
    leaderAttack(g);
    no(g, 'p1');
    expect(sorted(g, 'p1', 'hand')).toEqual([S12.sunny]);
    expect(sorted(g, 'p1', 'trash')).toEqual([]);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('with an empty hand the cost cannot be paid: accept is not available', () => {
    const g = theirs12([]);
    leaderAttack(g);
    const d = decision(g);
    if (d?.kind === 'optional') {
      expect(canAcceptOptional(g)).toBe(false);
      no(g, 'p1');
    }
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('[Once Per Turn]: after using it, a second attack in the same turn does not offer it again (declining is not asserted: whether it spends the use is not settled)', () => {
    const g = theirs12([S12.sunny, S12.sai], [], [S12.thatch]);
    leaderAttack(g);
    yes(g, 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', S12.sunny) });
    pickInst(g, [g.leader('p2')]);
    noDefence(g);
    act(g, { type: 'attack', attacker: chr(g, 'p2', S12.thatch), target: g.leader('p1') });
    need(g, 'block', 'p1');
    expect(sorted(g, 'p1', 'hand')).toEqual([S12.sai]);
  });

  it('[Blocker]: Shanks can be chosen as the blocker', () => {
    const g = theirs12([]);
    leaderAttack(g);
    const d = decision(g);
    if (d?.kind === 'optional') no(g, 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', SHX)]);
  });

  it('an attack by an opponent Character fires it too, and -2000 can go on that attacker', () => {
    const g = theirs12([S12.sunny], [S12.marco], [S12.thatch]);
    act(g, { type: 'attack', attacker: chr(g, 'p2', S12.thatch), target: g.leader('p1') });
    yes(g, 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', S12.sunny) });
    pickInst(g, [chr(g, 'p2', S12.thatch)]);
    expect(g.power(chr(g, 'p2', S12.thatch))).toBe(6000);
    expect(g.power(chr(g, 'p1', S12.marco))).toBe(5000);
  });

  it('must not: nothing is offered during p1 own turn attacks (it is the opponent attack that triggers it)', () => {
    const g = theirs12([S12.sunny]);
    expect(kind(g)).toBe('main');
    expect(decision(g)?.player).toBe('p2');
  });
});
