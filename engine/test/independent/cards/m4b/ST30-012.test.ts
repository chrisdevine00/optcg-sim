/**
 * ST30-012 Monkey.D.Luffy (Character, Green, cost 4, 6000, no Counter; Straw Hat Crew / Impel Down).
 *
 * Card text (cards/data):
 *   "[On Play] You may rest 1 of your DON!! cards: This Character gains [Rush] during this turn.
 *    [When Attacking] Rest up to 1 of your opponent's [Blocker] Characters."
 *
 * Rules: the cost is optional (CR 8-3-1-4) and needs 1 active DON!! left after the printed cost
 * (CR 8-3-1-5); [Rush] lets a Character attack the turn it is played; "during this turn" ends in
 * the End Phase (CR 6-6-1-3); a rested Character cannot activate [Blocker] (CR 10-1-4-1 / digest 91).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  blockers,
  canAttackAny,
  CH,
  choiceCards,
  donOf,
  drive,
  endTurn,
  F,
  LB,
  myTurn,
  play,
  side,
  skipUnusable,
  accept,
  decline,
  offered,
} from './kit-b.ts';

const LUFFY = 'ST30-012';

function playGame(active: number) {
  const g = myTurn(
    side(LB.greenKid, F.green, { hand: [LUFFY], costArea: { active, rested: 0 } }),
    side(LB.opp, F.red),
  );
  play(g, g.find('p1', 'hand', LUFFY));
  return g;
}

describe('ST30-012 [On Play]: you may rest 1 DON!!: gains [Rush] during this turn', () => {
  it('accepting: Luffy gets [Rush], rests 1 more DON!! (5 in total), and can attack the turn it is played', () => {
    const g = playGame(5);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(canAttackAny(g, luffy)).toBe(true);
  });

  it('declining: no [Rush] and the Character cannot attack this turn; only the printed 4 DON!! are rested', () => {
    const g = playGame(5);
    decline(g);
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    expect(g.card(luffy).keywords).not.toContain('Rush');
    expect(canAttackAny(g, luffy)).toBe(false);
  });

  it('CR 8-3-1-5: with exactly 4 active DON!! the cost cannot be paid: no [Rush]', () => {
    const g = playGame(4);
    skipUnusable(g, 'p1');
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(g.card(luffy).keywords).not.toContain('Rush');
    expect(canAttackAny(g, luffy)).toBe(false);
  });

  it('"during this turn": the [Rush] is gone on the next turn', () => {
    const g = playGame(5);
    accept(g);
    endTurn(g);
    endTurn(g);
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).not.toContain('Rush');
  });
});

describe('ST30-012 [When Attacking]: rest up to 1 of the opponent’s [Blocker] Characters', () => {
  function attackGame(p2: Partial<PlayerSpec> = {}) {
    return myTurn(
      side(LB.greenKid, F.green, { characters: [LUFFY] }),
      side(LB.opp, F.red, { characters: [CH.blockerFranky, CH.marco], ...p2 }),
    );
  }

  it('candidates: only the [Blocker] Character (Franky OP09-072), not Marco', () => {
    const g = attackGame();
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    expect(choiceCards(g)).toEqual([CH.blockerFranky]);
  });

  it('happy path: the Blocker is rested and cannot block; Marco stays active', () => {
    const g = attackGame();
    const franky = g.find('p2', 'characters', CH.blockerFranky);
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    drive(g, 'p1', { picks: [[franky]] });
    expect(g.card(franky).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.marco)).rested).toBe(false);
    expect(blockers(g)).toEqual([]);
  });

  it('control: if the Blocker is not rested, p2 may block with it', () => {
    const g = attackGame();
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    drive(g, 'p1', { picks: [[]] });
    expect(blockers(g)).toEqual([g.find('p2', 'characters', CH.blockerFranky)]);
  });

  it('"up to 1": with two Blockers only the chosen one is rested; the other can still block', () => {
    const g = attackGame({ characters: [CH.blockerFranky, CH.blockerFranky] });
    const first = g.find('p2', 'characters', CH.blockerFranky, 0);
    const second = g.find('p2', 'characters', CH.blockerFranky, 1);
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    drive(g, 'p1', { picks: [[first]] });
    expect(g.card(first).rested).toBe(true);
    expect(g.card(second).rested).toBe(false);
    expect(blockers(g)).toEqual([second]);
  });

  it('with no [Blocker] Character on the opponent’s side there is nothing to choose', () => {
    const g = attackGame({ characters: [CH.marco] });
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    expect(choiceCards(g)).toEqual([]);
  });
});
