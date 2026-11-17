/**
 * OP17-023 Nami (Character, Green, cost 1, 1000, Counter +2000; East Blue / Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "If one of your {East Blue} or {Straw Hat Crew} type Characters would be K.O.'d, you may rest
 *    this Character instead."
 *
 * Rules: an optional replacement (CR 8-1-3-4); it covers K.O.s from battle as well as from effects;
 * the Character resting must be able to rest (an already-rested Nami cannot, CR 8-1-3-4-5); one
 * application can cover several Characters K.O.'d at once (RL-31, QA-OP17 OP17-023); Characters
 * without the types are not covered; the opponent's Characters are not "yours".
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  act,
  CH,
  decline,
  drive,
  EV,
  F,
  LB,
  mainEvent,
  noDefence,
  offered,
  side,
  sortedIds,
  theirTurn,
} from './kit-b.ts';

const NAMI = 'OP17-023';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(LB.greenKid, F.green, {
      characters: [
        NAMI,
        { card: CH.robin, rested: true }, // Straw Hat Crew, 5000
        { card: CH.marco, rested: true }, // no covered type
        { card: CH.alvida, rested: true }, // East Blue, 3000
      ],
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew], ...p2 }),
  );
}

/** p2's Kingdew (7000) attacks the given rested p1 Character; stops at the first decision p1 owes. */
function attackOn(g: ReturnType<typeof game>, card: string) {
  act(g, {
    type: 'attack',
    attacker: g.find('p2', 'characters', CH.kingdew),
    target: g.find('p1', 'characters', card),
  });
}

describe('OP17-023 Nami: may rest this Character instead of a {East Blue} / {Straw Hat Crew} Character being K.O.’d', () => {
  it('a Straw Hat Crew Character K.O.’d in battle: the choice is offered; accepting rests Nami and saves Robin', () => {
    const g = game();
    const robin = g.find('p1', 'characters', CH.robin);
    attackOn(g, CH.robin);
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    drive(g, 'p1', {});
    expect(g.card(robin).zone).toBe('characters');
    expect(g.card(g.find('p1', 'characters', NAMI)).rested).toBe(true);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([]);
  });

  it('declining: Robin is K.O.’d and Nami stays active', () => {
    const g = game();
    attackOn(g, CH.robin);
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    drive(g, 'p1', {});
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.robin]);
    expect(g.card(g.find('p1', 'characters', NAMI)).rested).toBe(false);
  });

  it('an {East Blue} Character without the Straw Hat Crew type (OP03-023 Alvida) is covered too', () => {
    const g = game();
    const alvida = g.find('p1', 'characters', CH.alvida);
    attackOn(g, CH.alvida);
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    drive(g, 'p1', {});
    expect(g.card(alvida).zone).toBe('characters');
  });

  it('a Character with neither type (OP01-023 Marco) is not covered: no choice, it is K.O.’d', () => {
    const g = game();
    attackOn(g, CH.marco);
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.marco]);
    expect(g.card(g.find('p1', 'characters', NAMI)).rested).toBe(false);
  });

  it('CR 8-1-3-4-5: an already-rested Nami cannot be rested again: no replacement, the Character is K.O.’d', () => {
    const g = game({
      characters: [
        { card: NAMI, rested: true },
        { card: CH.robin, rested: true },
      ],
    });
    attackOn(g, CH.robin);
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.robin]);
  });

  it('a rested Nami herself (East Blue / Straw Hat Crew) K.O.’d: she cannot rest herself again, so she is K.O.’d', () => {
    const g = game({ characters: [{ card: NAMI, rested: true }, CH.marco] });
    attackOn(g, NAMI);
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([NAMI]);
  });

  it('it also covers a K.O. by the opponent’s effect: OP12-038 Rashomon on a rested Straw Hat Crew Character', () => {
    const g = game({}, { hand: [EV.rashomon], costArea: { active: 3, rested: 0 } });
    const robin = g.find('p1', 'characters', CH.robin);
    mainEvent(g, g.find('p2', 'hand', EV.rashomon), { picks: [[robin]] });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    drive(g, 'p1', {});
    expect(g.card(robin).zone).toBe('characters');
    expect(g.card(g.find('p1', 'characters', NAMI)).rested).toBe(true);
  });

  it('RL-31 / QA-OP17: one rest saves two Characters K.O.’d at once (Rashomon on Robin and Alvida): a single choice, both survive', () => {
    const g = game({}, { hand: [EV.rashomon], costArea: { active: 3, rested: 0 } });
    const robin = g.find('p1', 'characters', CH.robin);
    const alvida = g.find('p1', 'characters', CH.alvida);
    mainEvent(g, g.find('p2', 'hand', EV.rashomon), { picks: [[robin, alvida]] });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    drive(g, 'p1', {});
    expect(g.card(robin).zone).toBe('characters');
    expect(g.card(alvida).zone).toBe('characters');
    expect(sortedIds(g, 'p1', 'trash')).toEqual([]);
  });

  it('the opponent’s own Characters are not "yours": p2’s Nami would not be asked for a K.O. of p1’s Character', () => {
    const g = game({ characters: [{ card: CH.robin, rested: true }] }, {});
    attackOn(g, CH.robin);
    noDefence(g);
    expect(offered(g, 'p2')).toBe(false);
  });
});
