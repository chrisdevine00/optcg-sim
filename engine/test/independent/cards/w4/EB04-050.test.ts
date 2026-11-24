/**
 * EB04-050 I'll Whip You Into Shape. (Event, black, cost 1, {Navy}/{SWORD}).
 *
 * Card text: "[Main] Up to 1 of your {SWORD} type Leader or Character cards can also attack active
 * Characters during this turn.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: "also" keeps rested Characters and the Leader as targets (RL-17); the permission does not let
 * a Character attack on the turn it was played and other restrictions still apply (QA-OP11
 * OP11-119, OP11-010). "During this turn" ends with the turn; "during this battle" with the battle.
 * An Event [Counter] is used in the Counter Step by paying its cost (DECISIONS 2026-10-29).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canCounterWith,
  chars,
  chr,
  choices,
  decision,
  mayHit,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  theirs,
  toMyNextMain,
  trash,
  useCounter,
  W,
  LW,
  donSum,
  fill,
  BLUE,
  act,
} from './kit-w4b.ts';

const EVENT = 'EB04-050';

/** p1's Main Phase: the Event in hand, a {SWORD} X.Drake, a non-SWORD Marco; p2 has `p2` Characters. */
function mainBoard(
  p2: (string | { card: string; rested?: boolean })[] = [W.kingdew],
  opts: { leader?: string; active?: number; drakeSick?: boolean } = {},
) {
  return mine(
    opts.leader ?? LW.croc,
    {
      hand: [EVENT],
      characters: [opts.drakeSick ? { card: W.drake, playedThisTurn: true } : W.drake, W.marco],
      costArea: { active: opts.active ?? 10, rested: 0 },
    },
    { characters: p2 },
  );
}

/** p2 attacks p1's Leader with `atk`; p1 holds the Event with `active` DON!!; stops at the Counter Step. */
function counterBoard(atk: string, active = 3) {
  const g = theirs(
    LW.croc,
    { hand: [EVENT], costArea: { active, rested: 0 } },
    { characters: [atk] },
  );
  attack(g, at(g, 'p2', 'characters', atk), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe("EB04-050 I'll Whip You Into Shape.: [Main] up to 1 {SWORD} Leader or Character can also attack active Characters", () => {
  it('offers only {SWORD} cards: X.Drake, not Marco or a non-SWORD Leader', () => {
    const g = mainBoard();
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.drake]);
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('a {Navy} Character that is not {SWORD} (Yamakaji) is not offered: the filter is {SWORD}, not {Navy} (W4-R2)', () => {
    const g = mine(
      LW.croc,
      {
        hand: [EVENT],
        characters: [W.yamakaji, W.drake],
        costArea: { active: 10, rested: 0 },
      },
      { characters: [W.kingdew] },
    );
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.drake]);
  });

  it('a {SWORD} Leader is offered too (OP11-001 Koby) and may then attack an active Character', () => {
    const g = mainBoard([W.kingdew], { leader: LW.kobyLeader });
    const king = at(g, 'p2', 'characters', W.kingdew);
    expect(mayHit(g, g.leader('p1'), king)).toBe(false);
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    expect(mayHit(g, g.leader('p1'), king)).toBe(true);
  });

  it('the chosen {SWORD} Character can then attack an active opposing Character (it could not before)', () => {
    const g = mainBoard();
    const drake = at(g, 'p1', 'characters', W.drake);
    const king = at(g, 'p2', 'characters', W.kingdew);
    expect(mayHit(g, drake, king)).toBe(false);
    playRaw(g, EVENT);
    pickInst(g, [drake]);
    need(g, 'main', 'p1');
    expect(mayHit(g, drake, king)).toBe(true);
  });

  it('the attack on an active Character is carried out: a 7000 X.Drake K.O.s an active 4000 Character', () => {
    const g = mainBoard([W.sai]);
    const drake = at(g, 'p1', 'characters', W.drake);
    playRaw(g, EVENT);
    pickInst(g, [drake]);
    attack(g, drake, at(g, 'p2', 'characters', W.sai));
    noDefence(g);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('a Character that was not chosen (Marco) still cannot attack an active Character', () => {
    const g = mainBoard();
    playRaw(g, EVENT);
    pickInst(g, [at(g, 'p1', 'characters', W.drake)]);
    expect(
      mayHit(g, at(g, 'p1', 'characters', W.marco), at(g, 'p2', 'characters', W.kingdew)),
    ).toBe(false);
  });

  it('"also": the chosen Character may still attack rested Characters and the Leader', () => {
    const g = mainBoard([{ card: W.sai, rested: true }, W.kingdew]);
    const drake = at(g, 'p1', 'characters', W.drake);
    playRaw(g, EVENT);
    pickInst(g, [drake]);
    expect(mayHit(g, drake, at(g, 'p2', 'characters', W.sai))).toBe(true);
    expect(mayHit(g, drake, g.leader('p2'))).toBe(true);
  });

  it('a {SWORD} Character played this turn still cannot attack, permission or not (QA-OP11)', () => {
    const g = mainBoard([W.kingdew], { drakeSick: true });
    const drake = at(g, 'p1', 'characters', W.drake);
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    pickInst(g, [drake]);
    expect(mayHit(g, drake, at(g, 'p2', 'characters', W.kingdew))).toBe(false);
    expect(mayHit(g, drake, g.leader('p2'))).toBe(false);
  });

  it('"up to 1": choosing nobody gives no permission, and the Event is still spent', () => {
    const g = mainBoard();
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    none(g);
    expect(
      mayHit(g, at(g, 'p1', 'characters', W.drake), at(g, 'p2', 'characters', W.kingdew)),
    ).toBe(false);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the permission lasts this turn only', () => {
    const g = mainBoard();
    playRaw(g, EVENT);
    pickInst(g, [at(g, 'p1', 'characters', W.drake)]);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(
      mayHit(g, at(g, 'p1', 'characters', W.drake), at(g, 'p2', 'characters', W.kingdew)),
    ).toBe(false);
  });

  it('costs 1 DON!! and goes to the trash; with no active DON!! it cannot be played', () => {
    const g = mainBoard();
    playRaw(g, EVENT);
    pickInst(g, [at(g, 'p1', 'characters', W.drake)]);
    expect(donSum(g)).toMatchObject({ active: 9, rested: 1 });
    expect(trash(g)).toEqual([EVENT]);
    const broke = mainBoard([W.kingdew], { active: 0 });
    const ev = broke.find('p1', 'hand', EVENT);
    expect(broke.legal().some((a) => a.type === 'playCard' && a.card === ev)).toBe(false);
  });
});

describe("EB04-050 I'll Whip You Into Shape.: [Counter] your Leader gains +3000 power during this battle", () => {
  it('the Leader goes from 5000 to 8000 and a 7000 attacker no longer hurts it', () => {
    const g = counterBoard(W.kingdew);
    expect(g.power(g.leader('p1'))).toBe(5000);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('+3000 is not enough against a 9000 attacker: the hit lands', () => {
    const g = counterBoard(W.oars9);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    while (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('the boost lasts during this battle only', () => {
    const g = counterBoard(W.kingdew);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    act(g, { type: 'endCounter' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('costs 1 DON!!', () => {
    const g = counterBoard(W.kingdew);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    expect(donSum(g)).toMatchObject({ active: 2, rested: 1 });
  });

  it('with no active DON!! it cannot be used as a Counter', () => {
    const g = counterBoard(W.kingdew, 0);
    expect(canCounterWith(g, g.find('p1', 'hand', EVENT))).toBe(false);
  });

  it('it boosts the Leader, not a Character: the attacked Character keeps its power', () => {
    const g = theirs(
      LW.croc,
      {
        hand: [EVENT],
        costArea: { active: 3, rested: 0 },
        characters: [{ card: W.sai, rested: true }],
        life: fill(BLUE, 4),
      },
      { characters: [W.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', W.kingdew), chr(g, 'p1', W.sai));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(chr(g, 'p1', W.sai))).toBe(4000);
  });
});
