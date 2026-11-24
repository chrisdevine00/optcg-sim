/**
 * EB03-008 Hibari (Character, red, cost 3, 5000, {Navy}/{SWORD}).
 *
 * Card text: "[On Play]/[When Attacking] Up to 1 of your {SWORD} type Leader or Character cards can
 * also attack active Characters during this turn.
 * [Activate: Main] [Once Per Turn] Give up to 1 of your opponent's Characters -1000 power during
 * this turn."
 *
 * Rules: only rested Characters can normally be attacked (RL-17); "also" keeps that and the Leader
 * as targets. The permission does not let a Character attack the turn it was played and other
 * attack restrictions still apply (QA-OP11 OP11-119, OP11-010). "During this turn" ends with the
 * turn. Hibari is itself {SWORD}. [Activate: Main] has no summoning restriction.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  chr,
  choices,
  kind,
  mine,
  mayHit,
  need,
  none,
  noDefence,
  offeredAbilities,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  powerOf,
  toMyNextMain,
  useAbility,
  W,
  LW,
  chars,
} from './kit-w4b.ts';

const HIBARI = 'EB03-008';

/** p1's Main Phase; Hibari in hand, a {SWORD} X.Drake and a non-SWORD Marco on my field. */
function playBoard(
  p2: (string | { card: string; rested?: boolean })[] = [W.kingdew],
  leader: string = LW.croc,
) {
  return mine(leader, { hand: [HIBARI], characters: [W.drake, W.marco] }, { characters: p2 });
}

/** Hibari already on my field (not played this turn). */
function fieldBoard(
  p2: (string | { card: string; rested?: boolean })[] = [W.kingdew],
  leader: string = LW.croc,
) {
  return mine(leader, { characters: [HIBARI, W.drake, W.marco] }, { characters: p2 });
}

describe('EB03-008 Hibari: [On Play] up to 1 {SWORD} Leader or Character can also attack active Characters', () => {
  it('offers only {SWORD} Characters: Hibari himself and X.Drake, not Marco or a non-SWORD Leader', () => {
    const g = playBoard();
    playRaw(g, HIBARI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HIBARI, W.drake].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('offers a {SWORD} Leader too (OP11-001 Koby)', () => {
    const g = playBoard([W.kingdew], LW.kobyLeader);
    playRaw(g, HIBARI);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(offeredIds(g)).not.toContain(W.marco);
  });

  it('the chosen {SWORD} Character can then attack an active opposing Character (it could not before)', () => {
    const g = playBoard([W.kingdew]);
    const drake = at(g, 'p1', 'characters', W.drake);
    const king = at(g, 'p2', 'characters', W.kingdew);
    expect(mayHit(g, drake, king)).toBe(false);
    playRaw(g, HIBARI);
    pickInst(g, [drake]);
    need(g, 'main', 'p1');
    expect(mayHit(g, drake, king)).toBe(true);
  });

  it('the attack on an active Character goes through: a 7000 X.Drake K.O.s an active 4000 Character', () => {
    const g = playBoard([W.sai]);
    const drake = at(g, 'p1', 'characters', W.drake);
    playRaw(g, HIBARI);
    pickInst(g, [drake]);
    attack(g, drake, at(g, 'p2', 'characters', W.sai));
    noDefence(g);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('a Character that was not chosen (Marco) still cannot attack an active Character', () => {
    const g = playBoard([W.kingdew]);
    playRaw(g, HIBARI);
    pickInst(g, [at(g, 'p1', 'characters', W.drake)]);
    expect(
      mayHit(g, at(g, 'p1', 'characters', W.marco), at(g, 'p2', 'characters', W.kingdew)),
    ).toBe(false);
  });

  it('"also": rested Characters and the Leader stay valid targets for the chosen Character', () => {
    const g = playBoard([{ card: W.sai, rested: true }, W.kingdew]);
    const drake = at(g, 'p1', 'characters', W.drake);
    playRaw(g, HIBARI);
    pickInst(g, [drake]);
    expect(mayHit(g, drake, at(g, 'p2', 'characters', W.sai))).toBe(true);
    expect(mayHit(g, drake, g.leader('p2'))).toBe(true);
    expect(mayHit(g, drake, at(g, 'p2', 'characters', W.kingdew))).toBe(true);
  });

  it('choosing Hibari himself does not let him attack on the turn he was played (QA-OP11)', () => {
    const g = playBoard([W.kingdew]);
    playRaw(g, HIBARI);
    pickInst(g, [at(g, 'p1', 'characters', HIBARI)]);
    const hib = at(g, 'p1', 'characters', HIBARI);
    expect(mayHit(g, hib, at(g, 'p2', 'characters', W.kingdew))).toBe(false);
    expect(mayHit(g, hib, g.leader('p2'))).toBe(false);
  });

  it('"up to 1": choosing nobody gives no permission', () => {
    const g = playBoard([W.kingdew]);
    playRaw(g, HIBARI);
    need(g, 'choose', 'p1');
    none(g);
    expect(
      mayHit(g, at(g, 'p1', 'characters', W.drake), at(g, 'p2', 'characters', W.kingdew)),
    ).toBe(false);
  });

  it('the permission lasts this turn only', () => {
    const g = playBoard([W.kingdew]);
    playRaw(g, HIBARI);
    pickInst(g, [at(g, 'p1', 'characters', W.drake)]);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(
      mayHit(g, at(g, 'p1', 'characters', W.drake), at(g, 'p2', 'characters', W.kingdew)),
    ).toBe(false);
  });
});

describe('EB03-008 Hibari: [When Attacking] the same permission', () => {
  it('when Hibari attacks, up to 1 {SWORD} card can be chosen; the choice may attack active Characters afterwards', () => {
    const g = fieldBoard([W.kingdew]);
    const drake = at(g, 'p1', 'characters', W.drake);
    const king = at(g, 'p2', 'characters', W.kingdew);
    expect(mayHit(g, drake, king)).toBe(false);
    attack(g, at(g, 'p1', 'characters', HIBARI), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HIBARI, W.drake].sort());
    pickInst(g, [drake]);
    noDefence(g);
    need(g, 'main', 'p1');
    expect(mayHit(g, drake, king)).toBe(true);
  });

  it('"up to 1": nobody chosen on attack leaves the others unable to attack active Characters', () => {
    const g = fieldBoard([W.kingdew]);
    attack(g, at(g, 'p1', 'characters', HIBARI), g.leader('p2'));
    need(g, 'choose', 'p1');
    none(g);
    noDefence(g);
    need(g, 'main', 'p1');
    expect(
      mayHit(g, at(g, 'p1', 'characters', W.drake), at(g, 'p2', 'characters', W.kingdew)),
    ).toBe(false);
  });
});

describe('EB03-008 Hibari: [Activate: Main] [Once Per Turn] -1000 power to an opposing Character', () => {
  it('gives up to 1 opposing Character -1000 power this turn (7000 becomes 6000), also the turn Hibari was played', () => {
    const g = playBoard([W.kingdew, W.sai]);
    playRaw(g, HIBARI);
    pickInst(g, [at(g, 'p1', 'characters', W.drake)]);
    const hib = at(g, 'p1', 'characters', HIBARI);
    useAbility(g, hib);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.kingdew, W.sai].sort());
    pickInst(g, [chr(g, 'p2', W.kingdew)]);
    expect(powerOf(g, 'p2', W.kingdew)).toBe(6000);
    expect(powerOf(g, 'p2', W.sai)).toBe(4000);
  });

  it('only opposing Characters are offered (not my Characters, not a Leader)', () => {
    const g = fieldBoard([W.kingdew]);
    useAbility(g, at(g, 'p1', 'characters', HIBARI));
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([chr(g, 'p2', W.kingdew)]);
  });

  it('is Once Per Turn: not offered again after use, offered again next turn', () => {
    const g = fieldBoard([W.kingdew]);
    const hib = at(g, 'p1', 'characters', HIBARI);
    useAbility(g, hib);
    pickInst(g, [chr(g, 'p2', W.kingdew)]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, hib)).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HIBARI))).toHaveLength(1);
  });

  it('the -1000 ends with the turn', () => {
    const g = fieldBoard([W.kingdew]);
    useAbility(g, at(g, 'p1', 'characters', HIBARI));
    pickInst(g, [chr(g, 'p2', W.kingdew)]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(powerOf(g, 'p2', W.kingdew)).toBe(7000);
  });

  it('the weakened Character is beaten by a 6000 attacker that would have lost to its printed 7000', () => {
    // My 6000 Hajrudin attacks the rested 7000 Kingdew: it loses at 7000, wins at 6000.
    const g = mine(
      LW.croc,
      { characters: [HIBARI, W.hajrudin] },
      { characters: [{ card: W.kingdew, rested: true }] },
    );
    useAbility(g, at(g, 'p1', 'characters', HIBARI));
    pickInst(g, [chr(g, 'p2', W.kingdew)]);
    attack(g, at(g, 'p1', 'characters', W.hajrudin), chr(g, 'p2', W.kingdew));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('"up to 1": choosing nobody changes nothing', () => {
    const g = fieldBoard([W.kingdew]);
    useAbility(g, at(g, 'p1', 'characters', HIBARI));
    need(g, 'choose', 'p1');
    none(g);
    expect(powerOf(g, 'p2', W.kingdew)).toBe(7000);
  });
});
