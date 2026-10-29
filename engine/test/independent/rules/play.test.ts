/**
 * Playing Characters and Stages (rules digest §H; CR 2-7, 3-7, 3-8, 6-5-3).
 * All Characters here are vanilla (empty effect text), so playing them triggers nothing.
 */
import { describe, expect, it } from 'vitest';
import { scenario, type ScenarioInput } from '../../fixtures/index.ts';
import {
  canAttack,
  decision,
  don,
  FILL,
  fill,
  ids,
  isLegal,
  L,
  pickOne,
  play,
  S,
  V,
} from '../helpers.ts';

const p2Default = {
  leader: L.purpleKaido,
  life: fill(FILL.purple, 5),
  deck: fill(FILL.purple, 10),
};

function game(p1: Partial<ScenarioInput['p1']>) {
  return scenario({
    p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10), ...p1 },
    p2: p2Default,
  });
}

describe('playing a Character (CR 2-7-2, 3-7, 6-5-3-1)', () => {
  // OP01-023 Marco: cost 3, 5000 power, no effect.
  it('CR 6-5-3-1 / 2-7-2: playing a Character rests active DON!! equal to its cost', () => {
    const g = game({ hand: [V.marco], costArea: { active: 4, rested: 0 } });
    play(g, g.find('p1', 'hand', V.marco));
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.marco]);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 });
  });

  it('CR 3-7-5: a Character enters the Character area active', () => {
    const g = game({ hand: [V.marco], costArea: { active: 3, rested: 0 } });
    play(g, g.find('p1', 'hand', V.marco));
    expect(g.card(g.find('p1', 'characters', V.marco)).rested).toBe(false);
  });

  it('CR 2-7-2: a Character cannot be played without enough active DON!! (rested ones do not pay)', () => {
    const g = game({ hand: [V.marco], costArea: { active: 2, rested: 5 } });
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', V.marco) })).toBe(false);
  });

  it('CR 3-7-4: a Character cannot attack on the turn it is played', () => {
    const g = game({ hand: [V.marco], costArea: { active: 3, rested: 0 } });
    play(g, g.find('p1', 'hand', V.marco));
    const marco = g.find('p1', 'characters', V.marco);
    expect(canAttack(g, marco, g.leader('p2'))).toBe(false);
    // Control: the Leader, never "played" (digest item 80), may attack on turn 3.
    expect(canAttack(g, g.leader('p1'), g.leader('p2'))).toBe(true);
  });

  it('CR 3-7-4: a Character played on an earlier turn may attack', () => {
    const g = game({ characters: [V.marco] });
    expect(canAttack(g, g.find('p1', 'characters', V.marco), g.leader('p2'))).toBe(true);
  });

  it('CR 6-5-3-1: the non-turn player cannot play cards', () => {
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: { ...p2Default, hand: [V.blugori], costArea: { active: 2, rested: 0 } },
    });
    const blugori = g.find('p2', 'hand', V.blugori);
    expect(isLegal(g, { type: 'playCard', card: blugori, player: 'p2' })).toBe(false);
  });
});

describe('the 5-Character limit (CR 3-7-6)', () => {
  // Five vanilla Characters on board; ST01-003 Karoo (cost 1) in hand.
  const full = () =>
    game({
      characters: [V.komachiyo, V.sai, V.marco, V.hajrudin, { card: V.kingdew, rested: true }],
      hand: [V.karoo],
      costArea: { active: 2, rested: 0 },
    });

  it('CR 3-7-6 / 3-7-6-1: playing a 6th Character trashes 1 of yours first; never 6 on the field', () => {
    const g = full();
    play(g, g.find('p1', 'hand', V.karoo));
    expect(decision(g)).toMatchObject({ kind: 'choose', player: 'p1' });
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    const sai = g.find('p1', 'characters', V.sai);
    pickOne(g, sai);

    const board = g.zone('p1', 'characters').map((c) => c.card);
    expect(board).toHaveLength(5);
    expect(board).toContain(V.karoo);
    expect(board).not.toContain(V.sai);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.sai]);
    expect(g.card(g.find('p1', 'characters', V.karoo)).rested).toBe(false);
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });

  it('CR 3-7-6-1-1: the rule trash is not a K.O. (no K.O. event)', () => {
    const g = full();
    play(g, g.find('p1', 'hand', V.karoo));
    pickOne(g, g.find('p1', 'characters', V.sai));
    // Event name from ARCHITECTURE §2.8.
    expect(g.eventsOfType('KO')).toEqual([]);
  });

  it('CR 3-7-6-1: any one of your Characters may be chosen, active or rested', () => {
    const g = full();
    const board = ids(g, 'p1', 'characters');
    play(g, g.find('p1', 'hand', V.karoo));
    for (const c of board) expect(isLegal(g, { type: 'pick', choice: c })).toBe(true);
    // Not the Leader and not the card being played.
    expect(isLegal(g, { type: 'pick', choice: g.leader('p1') })).toBe(false);
  });

  it('CR 3-7-6-1 [open-question Q1]: the cost is paid before the Character is trashed', () => {
    const g = full();
    play(g, g.find('p1', 'hand', V.karoo));
    expect(decision(g)?.kind).toBe('choose');
    // Karoo costs 1: at the trash choice the DON!! are already rested.
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expect(g.zone('p1', 'characters')).toHaveLength(5);
  });
});

describe('playing a Stage (CR 2-7-4, 3-8)', () => {
  // OP05-021 Revolutionary Army HQ (Stage, cost 1) in play; OP03-020 Striker (Stage, cost 1) in hand.
  it('CR 2-7-4 / 3-8-4: a Stage is played by resting DON!! equal to its cost and enters active', () => {
    const g = game({ hand: [S.striker], costArea: { active: 1, rested: 0 } });
    play(g, g.find('p1', 'hand', S.striker));
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([S.striker]);
    expect(g.card(g.find('p1', 'stage', S.striker)).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });

  it('CR 3-8-5 / 3-8-5-1: playing a 2nd Stage trashes the one in play', () => {
    const g = game({
      stage: { card: S.armyHq, rested: true },
      hand: [S.striker],
      costArea: { active: 1, rested: 0 },
    });
    play(g, g.find('p1', 'hand', S.striker));
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([S.striker]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([S.armyHq]);
    expect(g.card(g.find('p1', 'stage', S.striker)).rested).toBe(false);
  });
});
