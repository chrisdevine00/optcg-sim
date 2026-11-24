/**
 * EB03-019 Wanda (Character, Green, cost 6, 7000, Counter +1000, {Minks}, [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 * target of the attack.)" No other effect.
 *
 * Rules: CR 10-1-4 / RL ([Blocker]: once per battle, optional, from an active card other than the
 * attack target; resting is the cost), battle CR 7-1-4 (the attacker wins with equal or higher power; only the defender can be K.O.'d), a
 * Counter can still be used after a block (RL).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  chr,
  kind,
  LA,
  mine,
  need,
  noDefence,
  passBlock,
  playRaw,
  SA,
  theirs,
  useCounter,
  chooseIfAsked,
  inst,
  zoneIds,
} from './kit-eb03a.ts';

const WANDA = 'EB03-019';

/** p2's `attacker` attacks p1's Leader; p1 owns Wanda (and `own`). */
function leaderAttack(attacker: string, own: (string | { card: string; rested?: boolean })[] = []) {
  const g = theirs(LA.croc, { characters: [WANDA, ...own] }, { characters: [attacker] });
  attack(g, chr(g, 'p2', attacker), g.leader('p1'));
  return g;
}

describe('EB03-019 Wanda: printed values and [Blocker]', () => {
  it('cost 6, 7000, Counter +1000, [Blocker]', () => {
    const g = mine(LA.croc, { characters: [WANDA] });
    const w = chr(g, 'p1', WANDA);
    expect(g.card(w).cost).toBe(6);
    expect(g.power(w)).toBe(7000);
    expect(g.card(w).counter).toBe(1000);
    expect(g.card(w).keywords).toContain('Blocker');
  });

  it('playing her asks nothing: she has no [On Play]', () => {
    const g = mine(LA.croc, { hand: [WANDA] });
    playRaw(g, WANDA);
    expect(kind(g)).toBe('main');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([WANDA]);
  });
});

describe('EB03-019 Wanda: blocking', () => {
  it('blocks an attack on my Leader: the attack hits Wanda instead and no Life is lost', () => {
    const g = leaderAttack(SA.hajrudin);
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', WANDA)]);
    act(g, { type: 'block', blocker: chr(g, 'p1', WANDA) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([WANDA]);
  });

  it('blocking rests her (the cost)', () => {
    const g = leaderAttack(SA.hajrudin);
    act(g, { type: 'block', blocker: chr(g, 'p1', WANDA) });
    expect(g.card(chr(g, 'p1', WANDA)).rested).toBe(true);
  });

  it('blocking is optional', () => {
    const g = leaderAttack(SA.kingdew);
    passBlock(g);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
    expect(g.card(chr(g, 'p1', WANDA)).rested).toBe(false);
  });

  it('a rested Wanda cannot block', () => {
    const r = theirs(
      LA.croc,
      { characters: [{ card: WANDA, rested: true }] },
      { characters: [SA.kingdew] },
    );
    attack(r, chr(r, 'p2', SA.kingdew), r.leader('p1'));
    expect(blockers(r)).toEqual([]);
  });

  it('she can block an attack aimed at another of my (rested) Characters', () => {
    const g = theirs(
      LA.croc,
      { characters: [WANDA, { card: SA.marco, rested: true }] },
      { characters: [SA.hajrudin] },
    );
    attack(g, chr(g, 'p2', SA.hajrudin), chr(g, 'p1', SA.marco));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', WANDA)]);
    act(g, { type: 'block', blocker: chr(g, 'p1', WANDA) });
    noDefence(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SA.marco, WANDA].sort());
  });

  it('she cannot block an attack that targets her own rested self (no other blocker offered)', () => {
    const g = theirs(
      LA.croc,
      { characters: [{ card: WANDA, rested: true }] },
      { characters: [SA.kingdew] },
    );
    attack(g, chr(g, 'p2', SA.kingdew), chr(g, 'p1', WANDA));
    expect(blockers(g)).toEqual([]);
  });

  it("battle: Wanda (7000) blocking an 8000 attacker is K.O.'d; against a 6000 attacker only the attacker's side loses nothing and she survives", () => {
    const g = leaderAttack(SA.thatch);
    act(g, { type: 'block', blocker: chr(g, 'p1', WANDA) });
    noDefence(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.thatch]);
    const t = leaderAttack(SA.hajrudin);
    act(t, { type: 'block', blocker: chr(t, 'p1', WANDA) });
    noDefence(t);
    expect(zoneIds(t, 'p1', 'characters')).toEqual([WANDA]);
    expect(zoneIds(t, 'p2', 'characters')).toEqual([SA.hajrudin]);
  });

  it("boundary: against an equal 7000 attacker the defender Wanda is K.O.'d (the attacker wins ties)", () => {
    const t = leaderAttack(SA.kingdew);
    act(t, { type: 'block', blocker: chr(t, 'p1', WANDA) });
    noDefence(t);
    expect(zoneIds(t, 'p1', 'characters')).toEqual([]);
    expect(zoneIds(t, 'p2', 'characters')).toEqual([SA.kingdew]);
  });

  it('a Counter can still be used after the block: +2000 lets Wanda survive an 8000 attacker', () => {
    const g = theirs(
      LA.croc,
      { characters: [WANDA], hand: [SA.boost2000], costArea: { active: 2, rested: 0 } },
      { characters: [SA.thatch] },
    );
    attack(g, chr(g, 'p2', SA.thatch), g.leader('p1'));
    act(g, { type: 'block', blocker: chr(g, 'p1', WANDA) });
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', SA.boost2000), chr(g, 'p1', WANDA));
    chooseIfAsked(g, [chr(g, 'p1', WANDA)]);
    act(g, { type: 'endCounter' });
    expect(zoneIds(g, 'p1', 'characters')).toEqual([WANDA]);
  });

  it('on my own turn she has no block to make (a Blocker acts only against an attack)', () => {
    const g = mine(LA.croc, { characters: [WANDA] });
    expect(g.legal().some((a) => a.type === 'block')).toBe(false);
  });
});
