/**
 * ST21-003 Sanji (Character, Red, cost 2, 3000, Counter +2000; Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Select up to 1 of your {Straw Hat Crew} type Characters with 6000 power or more. If
 *    the selected Character attacks during this turn, your opponent cannot activate [Blocker]."
 *
 * Rules: "power" is current power (CR 4-9-2 reserves "base power" for the other wording); the
 * Blocker denial is tied to the selected Character only and lasts "during this turn" (CR 6-6-1-3);
 * [Blocker] is an activation in the Block Step (CR 7-1-2-1), so the defender gets no block choice.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  blockers,
  CH,
  choiceCards,
  chooseNone,
  drive,
  F,
  LB,
  myTurn,
  passBlock,
  play,
  side,
} from './kit-b.ts';

const SANJI = 'ST21-003';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LB.redShc, F.red, {
      hand: [SANJI],
      costArea: { active: 2, rested: 0 },
      characters: [CH.franky4, CH.robin, CH.thatch, CH.nami5],
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.blockerFranky], ...p2 }),
  );
  play(g, g.find('p1', 'hand', SANJI));
  return g;
}

describe('ST21-003 [On Play]: select up to 1 {Straw Hat Crew} Character with 6000 power or more', () => {
  it('candidates: Straw Hat Crew Characters with power ≥6000: Franky (6000, the boundary) and Nami (7000); not Robin (5000), not Thatch (8000, no type), not Sanji itself (3000)', () => {
    const g = game();
    expect(choiceCards(g)).toEqual([CH.franky4, CH.nami5].sort());
  });

  it('power, not base power: a 5000 Character with 1 DON!! (6000 on your turn) is a candidate', () => {
    const g = game({ characters: [{ card: CH.robin, don: 1 }, CH.marco] });
    expect(choiceCards(g)).toEqual([CH.robin]);
  });

  it('happy path: the selected Character attacks and the opponent’s [Blocker] cannot be activated', () => {
    const g = game();
    const franky = g.find('p1', 'characters', CH.franky4);
    drive(g, 'p1', { picks: [[franky]] });
    act(g, { type: 'attack', attacker: franky, target: g.leader('p2') });
    expect(blockers(g)).toEqual([]);
  });

  it('the denial also holds when the selected Character attacks a rested Character', () => {
    const g = game({}, { characters: [CH.blockerFranky, { card: CH.sai, rested: true }] });
    const franky = g.find('p1', 'characters', CH.franky4);
    drive(g, 'p1', { picks: [[franky]] });
    act(g, { type: 'attack', attacker: franky, target: g.find('p2', 'characters', CH.sai) });
    expect(blockers(g)).toEqual([]);
  });

  it('only the selected Character: another attacker (Nami) can still be blocked', () => {
    const g = game();
    drive(g, 'p1', { picks: [[g.find('p1', 'characters', CH.franky4)]] });
    act(g, {
      type: 'attack',
      attacker: g.find('p1', 'characters', CH.nami5),
      target: g.leader('p2'),
    });
    expect(blockers(g)).toEqual([g.find('p2', 'characters', CH.blockerFranky)]);
  });

  it('"up to 1": selecting nothing means the Blocker is available even to a 6000+ attacker', () => {
    const g = game();
    chooseNone(g);
    act(g, {
      type: 'attack',
      attacker: g.find('p1', 'characters', CH.franky4),
      target: g.leader('p2'),
    });
    expect(blockers(g)).toEqual([g.find('p2', 'characters', CH.blockerFranky)]);
  });

  it('control (no Sanji effect): a plain attack by the same Character can be blocked', () => {
    const g = myTurn(
      side(LB.redShc, F.red, { characters: [CH.franky4] }),
      side(LB.opp, F.red, { characters: [CH.blockerFranky] }),
    );
    act(g, {
      type: 'attack',
      attacker: g.find('p1', 'characters', CH.franky4),
      target: g.leader('p2'),
    });
    expect(blockers(g)).toEqual([g.find('p2', 'characters', CH.blockerFranky)]);
    passBlock(g);
  });

  it('with no Straw Hat Crew Character at 6000 or more there is nothing to select', () => {
    const g = game({ characters: [CH.robin, CH.thatch] });
    expect(choiceCards(g)).toEqual([]);
  });
});
