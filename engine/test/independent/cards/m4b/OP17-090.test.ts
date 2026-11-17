/**
 * OP17-090 Franky (Character, Black, cost 2, 2000, Counter +1000; Elbaph / Straw Hat Crew).
 *
 * Card text:
 *   "If there is a Character with a cost of 12 or more, this Character gains +3000 power.
 *    [On Play] If there is a Character with a cost of 12 or more, K.O. up to 1 of your opponent's
 *    Characters with a cost of 2 or less."
 *
 * Rules: "there is a Character" is either player's field (no "your"); CR 8-3-2 / 8-4-4-1 "up to 1"
 * may be zero; CR 4-10-1 a false "if" resolves nothing. Cost-12 scenery: OP17-089 Jaguar.D.Saul
 * (cost 4, "+12 cost" on the field => 16). Opponent targets: OP01-012 Sai (cost 2), OP01-023 Marco
 * (cost 3), OP01-010 Komachiyo (cost 1).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  costOf,
  kind,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit-d.ts';

const FRANKY = 'OP17-090';
const SAUL = 'OP17-089'; // cost 16 on the field

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, { hand: [FRANKY], costArea: { active: 2, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, p2),
  );
}

describe('OP17-090 Franky: +3000 power if there is a Character with cost 12 or more', () => {
  it('no cost-12 Character anywhere: 2000 power', () => {
    const g = game({ characters: [FRANKY, VAN.hajrudin] });
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(2000);
  });

  it('your own cost-16 Character: 5000 power', () => {
    const g = game({ characters: [FRANKY, SAUL] });
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(5000);
  });

  it('the opponent’s cost-16 Character counts too ("a Character", not "your")', () => {
    const g = game({ characters: [FRANKY] }, { characters: [SAUL] });
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(5000);
  });

  it('cost 7 is not enough (Hajrudin on the field): 2000 power', () => {
    const g = game({ characters: [FRANKY] }, { characters: ['OP17-088'] });
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(2000);
  });
});

describe('OP17-090 Franky: [On Play] K.O. up to 1 opposing Character with cost 2 or less', () => {
  it('condition met: only cost 2 or less is offered, and the chosen one is K.O.’d', () => {
    const g = game({ characters: [SAUL] }, { characters: [VAN.sai, VAN.marco, VAN.komachiyo] });
    playFromHand(g, FRANKY);
    expect(choiceCards(g)).toEqual([VAN.komachiyo, VAN.sai].sort());
    choose(g, [g.find('p2', 'characters', VAN.sai)]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.komachiyo, VAN.marco].sort());
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.sai]);
  });

  it('"your opponent’s": your own cost-2 Character is not offered', () => {
    const g = game({ characters: [SAUL, VAN.sai] }, { characters: [VAN.komachiyo] });
    playFromHand(g, FRANKY);
    expect(choiceCards(g)).toEqual([VAN.komachiyo]);
  });

  it('the opponent’s own cost-16 Character satisfies the condition', () => {
    const g = game({}, { characters: [SAUL, VAN.sai] });
    playFromHand(g, FRANKY);
    expect(choiceCards(g)).toEqual([VAN.sai]);
    choose(g, [g.find('p2', 'characters', VAN.sai)]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([SAUL]);
  });

  it('CR 8-4-4-1: "up to 1" lets the player K.O. nothing', () => {
    const g = game({ characters: [SAUL] }, { characters: [VAN.sai] });
    playFromHand(g, FRANKY);
    chooseNone(g);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
  });

  it('CR 4-10-1: no cost-12 Character, no K.O. and no question', () => {
    const g = game({}, { characters: [VAN.sai, VAN.komachiyo] });
    playFromHand(g, FRANKY);
    expect(kind(g)).toBe('main');
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.komachiyo, VAN.sai].sort());
  });

  it('the cost is the current cost: a cost-3 Character is not a legal target', () => {
    const g = game({ characters: [SAUL] }, { characters: [VAN.marco] });
    expect(costOf(g, g.find('p2', 'characters', VAN.marco))).toBe(3);
    playFromHand(g, FRANKY);
    expect(kind(g)).toBe('main');
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.marco]);
  });

  it('a rested cost-2 Character may be K.O.’d too', () => {
    const g = game({ characters: [SAUL] }, { characters: [{ card: VAN.sai, rested: true }] });
    playFromHand(g, FRANKY);
    expect(choiceCards(g)).toEqual([VAN.sai]);
  });
});
