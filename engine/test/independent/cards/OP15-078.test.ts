/**
 * OP15-078 Mamaragan (Event, Purple, cost 0, Sky Island).
 *
 * Card text (cards/data; textFixes sign repair "DON!! 2" → "DON!! −2"):
 *   "[Main] DON!! −2: Draw 1 card. Then, rest up to 1 of your opponent's Characters with 5000 power
 *    or less.
 *    [Counter] Up to 1 of your Leader or Character cards gains +1000 power during this battle. Then,
 *    if you have 6 or less DON!! cards on your field, draw 1 card."
 *
 * Rules relied on:
 * - CR 8-3-1-3: DON!! −2 needs 2 DON!! on the field.
 * - CR 4-10-2: a "Then" clause still resolves when the clause before it did nothing.
 * - QA-OP01 OP01-091 / RL-24: "DON!! cards on your field" includes cost-area (active and rested) and
 *   given DON!!.
 * - RL-08 / CR 7-1-5-3: "during this battle".
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, fill, isLegal, passBlock, takeDamage } from '../helpers.ts';
import {
  AKP,
  accept,
  choiceCards,
  choose,
  chooseIfAsked,
  chooseNone,
  decline,
  donOf,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function mainGame(costArea = { active: 2, rested: 0 }) {
  return myTurn(
    side(LEAD.shanks, PURPLE, {
      hand: [AKP.mamaragan],
      costArea,
      deck: [VAN.sai, ...fill(PURPLE, 10)],
    }),
    side(LEAD.luffy, RED, { characters: [VAN.marco, VAN.kingdew] }),
  );
}

function cast(g: TestGame) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.mamaragan) });
  if (offered(g, 'p1')) accept(g);
  payDon(g, 2);
}

function counterGame(p1: Partial<PlayerSpec>) {
  const g = theirTurn(
    side(LEAD.shanks, PURPLE, {
      hand: [AKP.mamaragan],
      deck: [VAN.sai, ...fill(PURPLE, 10)],
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  useCounter(g, g.find('p1', 'hand', AKP.mamaragan), g.leader('p1'));
  if (offered(g, 'p1')) accept(g);
  chooseIfAsked(g, [g.leader('p1')]);
  return g;
}

describe('OP15-078 Mamaragan: [Main] DON!! −2: draw 1, then rest a ≤5000 Character', () => {
  it('happy path: DON!! deck +2, draw 1, rest Marco (5000)', () => {
    const g = mainGame();
    const marco = g.find('p2', 'characters', VAN.marco);
    cast(g);
    expect(donOf(g, 'p1').deck).toBe(10);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(choiceCards(g)).toEqual([VAN.marco]);
    choose(g, [marco]);
    expect(g.card(marco).rested).toBe(true);
  });

  it('CR 8-4-4-1: "up to 1" rests nothing; the draw still happened', () => {
    const g = mainGame();
    cast(g);
    chooseNone(g);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(g.card(g.find('p2', 'characters', VAN.marco)).rested).toBe(false);
  });

  it('declining the DON!! −2 (if asked) draws nothing', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.mamaragan) });
    if (offered(g, 'p1')) {
      decline(g);
      expect(g.zone('p1', 'hand')).toHaveLength(0);
    }
  });

  it('CR 8-3-1-3: with 1 DON!! on the field DON!! −2 cannot be paid → no draw', () => {
    const g = mainGame({ active: 1, rested: 0 });
    const card = g.find('p1', 'hand', AKP.mamaragan);
    if (isLegal(g, { type: 'playCard', card })) {
      act(g, { type: 'playCard', card });
      expect(offered(g, 'p1')).toBe(false);
    }
    expect(g.zone('p1', 'deck')).toHaveLength(11);
  });
});

describe('OP15-078 Mamaragan: [Counter] +1000 this battle, then draw if 6 or less DON!! on the field', () => {
  it('happy path: 6 DON!! on the field → +1000 (6000 stops 5000) and draw 1', () => {
    const g = counterGame({ costArea: { active: 6, rested: 0 } });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('cost 0: usable with no DON!! at all; 0 ≤ 6 → draws', () => {
    const g = counterGame({ costArea: { active: 0, rested: 0 } });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
  });

  it('7 DON!! on the field → +1000 but no draw', () => {
    const g = counterGame({ costArea: { active: 3, rested: 4 } });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('RL-24: given DON!! count (5 in the cost area + 2 given = 7) → no draw', () => {
    const g = counterGame({
      costArea: { active: 5, rested: 0 },
      characters: [{ card: VAN.komachiyo, don: 2 }],
    });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});
