/**
 * The battle sequence (rules digest §J; CR 7-1).
 * p1 is the turn player on turn 3 (battle allowed). Leaders: ST01-001 (Red, 5000) for p1 and
 * ST04-001 (Purple, 5000) for p2; both have only an [Activate: Main]. All Characters are vanilla
 * unless they are the [Blocker] cards OP09-072 Franky and ST10-010 Trafalgar Law (5000 each), which
 * sit on the field from the start so their [On Play] never runs.
 */
import { describe, expect, it } from 'vitest';
import { scenario, type ScenarioInput } from '../../fixtures/index.ts';
import {
  act,
  attack,
  attackTargets,
  attacks,
  blockers,
  canAttack,
  decision,
  FILL,
  fill,
  isLegal,
  K,
  L,
  noDefence,
  passBlock,
  passCounter,
  result,
  turn,
  V,
} from '../helpers.ts';

type Side = Partial<ScenarioInput['p1']>;

function battle(p1: Side = {}, p2: Side = {}) {
  return scenario({
    p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10), ...p1 },
    p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10), ...p2 },
  });
}

describe('declaring an attack (CR 7-1-1)', () => {
  it('CR 7-1 / 7-1-1-1: the active Leader or an active Character may attack; a rested one may not', () => {
    const g = battle({ characters: [V.marco, { card: V.sai, rested: true }] });
    const attackers = new Set(attacks(g).map((a) => (a.type === 'attack' ? a.attacker : '')));
    expect(attackers).toEqual(new Set([g.leader('p1'), g.find('p1', 'characters', V.marco)]));
  });

  it('CR 7-1 / 7-1-1-1: a rested Leader may not attack', () => {
    const g = battle({ leader: { card: L.redLuffy, rested: true } });
    expect(canAttack(g, g.leader('p1'), g.leader('p2'))).toBe(false);
  });

  it('CR 7-1-1-2: only the opponent’s Leader or one of their rested Characters may be attacked', () => {
    const g = battle(
      { characters: [V.marco] },
      { characters: [V.apoo, { card: V.dobon, rested: true }] },
    );
    const expected = [g.leader('p2'), g.find('p2', 'characters', V.dobon)].sort();
    expect(attackTargets(g, g.leader('p1'))).toEqual(expected);
    expect(attackTargets(g, g.find('p1', 'characters', V.marco))).toEqual(expected);
    expect(canAttack(g, g.leader('p1'), g.find('p2', 'characters', V.apoo))).toBe(false);
  });

  it('CR 7-1-1-2: the opponent’s Leader may be attacked even when rested', () => {
    const g = battle({}, { leader: { card: L.purpleKaido, rested: true } });
    expect(canAttack(g, g.leader('p1'), g.leader('p2'))).toBe(true);
  });

  it('CR 7-1-1-1: declaring an attack rests the attacker and starts a battle', () => {
    const g = battle({ characters: [V.marco] });
    const marco = g.find('p1', 'characters', V.marco);
    attack(g, marco, g.leader('p2'));
    expect(g.card(marco).rested).toBe(true);
    expect(turn(g).battleStep).not.toBeNull();
    expect(decision(g)?.player).toBe('p2');
  });

  it('CR 7-1 / 6-5-6: no new attack can be declared during a battle', () => {
    const g = battle({ characters: [V.marco] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(attacks(g)).toEqual([]);
  });
});

describe('Block Step (CR 7-1-2, 10-1-4)', () => {
  it('CR 7-1-2-1 / 10-1-4-1: the defender may block with an active [Blocker], which becomes the target', () => {
    // OP02-006 Kingdew (7000) attacks p2's Leader; OP09-072 Franky (5000, [Blocker]) blocks.
    const g = battle({ characters: [V.kingdew] }, { characters: [K.blockerFranky] });
    const franky = g.find('p2', 'characters', K.blockerFranky);
    expect(g.card(franky).keywords).toContain('Blocker');
    attack(g, g.find('p1', 'characters', V.kingdew), g.leader('p2'));
    expect(decision(g)).toMatchObject({ kind: 'block', player: 'p2' });
    expect(blockers(g)).toEqual([franky]);
    act(g, { type: 'block', blocker: franky });
    expect(g.card(franky).rested).toBe(true);
    passCounter(g);
    // 7000 ≥ 5000: the Blocker is K.O.'d and the Leader takes no damage.
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([K.blockerFranky]);
    expect(g.life('p2')).toBe(5);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });

  it('CR 10-1-4-1: a blocked attack on the Leader deals no damage even when the Blocker wins', () => {
    // OP01-012 Sai (4000) attacks; Franky (5000) blocks and wins.
    const g = battle({ characters: [V.sai] }, { characters: [K.blockerFranky] });
    const franky = g.find('p2', 'characters', K.blockerFranky);
    const sai = g.find('p1', 'characters', V.sai);
    attack(g, sai, g.leader('p2'));
    act(g, { type: 'block', blocker: franky });
    passCounter(g);
    expect(g.life('p2')).toBe(5);
    expect(g.card(franky).zone).toBe('characters');
    // The losing attacker is not K.O.'d.
    expect(g.card(sai).zone).toBe('characters');
  });

  it('QA-GR "do I have to activate [Blocker]": blocking is optional', () => {
    const g = battle({}, { characters: [K.blockerFranky] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(isLegal(g, { type: 'block', blocker: null })).toBe(true);
    act(g, { type: 'block', blocker: null });
    passCounter(g);
    expect(g.life('p2')).toBe(4);
  });

  it('CR 7-1-2-1: at most one [Blocker] per battle', () => {
    const g = battle({}, { characters: [K.blockerFranky, K.blockerLaw] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toHaveLength(2);
    act(g, { type: 'block', blocker: g.find('p2', 'characters', K.blockerFranky) });
    expect(decision(g)?.kind).not.toBe('block');
    expect(isLegal(g, { type: 'block', blocker: g.find('p2', 'characters', K.blockerLaw) })).toBe(
      false,
    );
  });

  it('CR 10-1-4-1 / QA-GR "[Blocker] of a rested Character": a rested [Blocker] cannot block', () => {
    const g = battle({}, { characters: [{ card: K.blockerFranky, rested: true }] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('CR 10-1-4-1: a Character without [Blocker] cannot block', () => {
    const g = battle({}, { characters: [V.apoo] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    expect(isLegal(g, { type: 'block', blocker: g.find('p2', 'characters', V.apoo) })).toBe(false);
  });
});

describe('Counter Step (CR 7-1-3)', () => {
  it('CR 7-1-3-1-1: the defender trashes a Character card from hand to add its Counter for the battle, for free', () => {
    // p2 hand: OP11-078 Decuplets (Counter +2000). p2 has no DON!! at all.
    const g = battle({}, { hand: [V.decuplets] });
    attack(g, g.leader('p1'), g.leader('p2'));
    passBlock(g);
    expect(decision(g)).toMatchObject({ kind: 'counter', player: 'p2' });
    const decuplets = g.find('p2', 'hand', V.decuplets);
    act(g, { type: 'counter', card: decuplets, target: g.leader('p2') });
    expect(g.power(g.leader('p2'))).toBe(7000);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.decuplets]);
    act(g, { type: 'endCounter' });
    // 5000 < 7000: no damage.
    expect(g.life('p2')).toBe(5);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });

  it('CR 7-1-3-1: the defender may use several Counters; each new trash card goes on top (CR 3-5-2)', () => {
    // OP02-084 Blugori (+1000) then OP11-078 Decuplets (+2000).
    const g = battle({}, { hand: [V.blugori, V.decuplets] });
    attack(g, g.leader('p1'), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p2', 'hand', V.blugori), target: g.leader('p2') });
    act(g, { type: 'counter', card: g.find('p2', 'hand', V.decuplets), target: g.leader('p2') });
    expect(g.power(g.leader('p2'))).toBe(8000);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.decuplets, V.blugori]);
  });

  it('CR 7-1-3-1-1 / 7-1-4-1: a Counter that only ties does not stop the attack', () => {
    // p1 Leader 5000 + 1 DON!! = 6000; p2 Leader 5000 + Blugori 1000 = 6000.
    const g = battle({ leader: { card: L.redLuffy, don: 1 } }, { hand: [V.blugori] });
    attack(g, g.leader('p1'), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p2', 'hand', V.blugori), target: g.leader('p2') });
    act(g, { type: 'endCounter' });
    expect(g.life('p2')).toBe(4);
  });

  it('QA-GR "Counters of Characters on the field": a Character in play cannot be used as a Counter', () => {
    const g = battle({}, { characters: [V.blugori] });
    attack(g, g.leader('p1'), g.leader('p2'));
    passBlock(g);
    const blugori = g.find('p2', 'characters', V.blugori);
    expect(isLegal(g, { type: 'counter', card: blugori, target: g.leader('p2') })).toBe(false);
  });

  it('CR 2-10-2 / 7-1-3-1-1: a Character card with no Counter value cannot be used as a Counter', () => {
    // OP17-022 Shanks has no Counter value.
    const g = battle({}, { hand: [K.noCounterShanks] });
    attack(g, g.leader('p1'), g.leader('p2'));
    passBlock(g);
    const shanks = g.find('p2', 'hand', K.noCounterShanks);
    expect(isLegal(g, { type: 'counter', card: shanks, target: g.leader('p2') })).toBe(false);
  });

  it('CR 7-1-3-1: only the defending player acts in the Counter Step', () => {
    const g = battle({ hand: [V.komachiyo] }, { hand: [V.blugori] });
    attack(g, g.leader('p1'), g.leader('p2'));
    passBlock(g);
    expect(decision(g)?.player).toBe('p2');
    const komachiyo = g.find('p1', 'hand', V.komachiyo);
    expect(
      isLegal(g, { type: 'counter', card: komachiyo, target: g.leader('p1'), player: 'p1' }),
    ).toBe(false);
  });
});

describe('Damage Step (CR 7-1-4)', () => {
  it('CR 7-1-4-1: the attacker wins ties (5000 vs 5000 deals damage)', () => {
    const g = battle();
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(4);
  });

  it('CR 7-1-4-1-1-2: the defender adds the top Life card to hand', () => {
    // OP01-092 Urashima is the top Life card.
    const g = battle({}, { life: [V.urashima, ...fill(FILL.purple, 4)] });
    expect(g.zone('p2', 'life')[0]!.card).toBe(V.urashima);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([V.urashima]);
    expect(g.life('p2')).toBe(4);
    expect(g.zone('p2', 'life').map((c) => c.card)).toEqual(fill(FILL.purple, 4));
  });

  it('CR 7-1-4-2: an attacker with lower power does nothing, and is not K.O.’d', () => {
    // OP01-012 Sai (4000) attacks the 5000 Leader.
    const g = battle({ characters: [V.sai] });
    const sai = g.find('p1', 'characters', V.sai);
    attack(g, sai, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(5);
    expect(g.card(sai).zone).toBe('characters');
  });

  it('CR 7-1-4-1-2 / 10-2-1-2: a Character that loses a battle is K.O.’d into its owner’s trash', () => {
    // OP01-023 Marco (5000) attacks rested OP02-077 Solitaire (5000): a tie, so Solitaire loses.
    const g = battle(
      { characters: [V.marco] },
      { characters: [{ card: V.solitaire, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', V.marco), g.find('p2', 'characters', V.solitaire));
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.solitaire]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(g.life('p2')).toBe(5);
  });

  it('CR 7-1-4-2: a Character with higher power survives the attack', () => {
    // OP01-012 Sai (4000) attacks rested OP02-077 Solitaire (5000).
    const g = battle(
      { characters: [V.sai] },
      { characters: [{ card: V.solitaire, rested: true }] },
    );
    const solitaire = g.find('p2', 'characters', V.solitaire);
    attack(g, g.find('p1', 'characters', V.sai), solitaire);
    noDefence(g);
    expect(g.card(solitaire).zone).toBe('characters');
  });

  it('CR 7-1-4-1-1 / 1-2-1-1-1: with 1 Life, a hit takes the last card and the game goes on', () => {
    const g = battle({}, { life: [FILL.purple] });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(0);
    expect(result(g)).toBeNull();
  });

  it('CR 7-1-4-1-1-1: battle damage determined against 0 Life wins the game for the attacker', () => {
    const g = battle({}, { life: [] });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(result(g)).toMatchObject({ winner: 'p1' });
    expect(decision(g)).toBeNull();
    expect(g.legal()).toEqual([]);
  });
});

describe('End of the Battle (CR 7-1-5)', () => {
  it('CR 7-1-5-5: after the battle the turn player is back in the Main Phase', () => {
    const g = battle({ characters: [V.marco] });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(turn(g)).toMatchObject({ phase: 'main', battleStep: null, activePlayer: 'p1' });
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
    // Another attacker may now attack (no per-turn attack limit, CR 6-5-2).
    expect(canAttack(g, g.find('p1', 'characters', V.marco), g.leader('p2'))).toBe(true);
  });

  it('CR 7-1-3-1-1 / 7-1-5-3 / 7-1-5-4: Counter boosts end at the End of the Battle', () => {
    const g = battle({}, { hand: [V.decuplets] });
    attack(g, g.leader('p1'), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p2', 'hand', V.decuplets), target: g.leader('p2') });
    expect(g.power(g.leader('p2'))).toBe(7000);
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});
