/**
 * OP17-060 Ulti & Page One (Character, Purple, cost 6, 6000, Counter +1000, type Animal Kingdom Pirates).
 *
 * Card text (cards/data, no override text patch):
 *   "[On Play] If your Leader has the {Animal Kingdom Pirates} type, add up to 1 DON!! card as active
 *    from your DON!! deck. Then, K.O. up to 1 of your opponent's Characters with 3000 power or less."
 *
 * Rules: CR 2-4-3 ({Type} is an exact type match), CR 4-10-1 / 8-3-3 (text after a failed "if"
 * does not resolve), CR 4-10-2 (a "then" clause still resolves when the clause before it did
 * nothing), CR 8-4-4-1 ("up to" allows 0), CR 10-2-1 (K.O. puts the Character in its owner's trash).
 * The power filter reads current power (RL-16: filters read current values unless "base").
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, noDefence } from '../helpers.ts';
import {
  accept,
  AKP,
  choiceCards,
  choose,
  chooseNone,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function game(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec> = {}, leader: string = LEAD.kaido) {
  return myTurn(side(leader, PURPLE, p1), side(LEAD.luffy, RED, p2));
}

function playUlti(g: TestGame): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.ultiPageOne) });
  // "add up to 1 DON!!" may be asked as a yes/no: take it.
  if (offered(g, 'p1')) accept(g);
}

describe('OP17-060 Ulti & Page One: [On Play] add 1 active DON!!, then K.O. a 3000-or-less Character', () => {
  it('happy path (AKP Leader): +1 active DON!! from the DON!! deck, then K.O. a 3000-power Character', () => {
    const g = game(
      { hand: [AKP.ultiPageOne], costArea: { active: 6, rested: 0 } },
      { characters: [VAN.komachiyo, VAN.sai] },
    );
    playUlti(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 6, deck: 3 });
    choose(g, [g.find('p2', 'characters', VAN.komachiyo)]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.komachiyo]);
    expect(kind(g)).toBe('main');
  });

  it('target restriction: only the opponent’s Characters with 3000 power or less are offered', () => {
    // p2: Komachiyo 3000 (yes), Sai 4000 (no). p1's own Gordon 3000 (no: opponent's only).
    const g = game(
      { hand: [AKP.ultiPageOne], costArea: { active: 6, rested: 0 }, characters: [VAN.gordon] },
      { characters: [VAN.komachiyo, VAN.sai] },
    );
    playUlti(g);
    expect(choiceCards(g)).toEqual([VAN.komachiyo]);
  });

  it('CR 8-4-4-1: "up to 1" allows choosing nothing; the DON!! is still added', () => {
    const g = game(
      { hand: [AKP.ultiPageOne], costArea: { active: 6, rested: 0 } },
      { characters: [VAN.komachiyo] },
    );
    playUlti(g);
    chooseNone(g);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.komachiyo]);
    expect(donOf(g, 'p1').deck).toBe(3);
  });

  it('CR 4-10-1 / 8-3-3: with a non-{Animal Kingdom Pirates} Leader (ST05-001 Shanks) neither the DON!! nor the K.O. happens', () => {
    const g = game(
      { hand: [AKP.ultiPageOne], costArea: { active: 6, rested: 0 } },
      { characters: [VAN.komachiyo] },
      LEAD.shanks,
    );
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.ultiPageOne) });
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: 4 });
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.komachiyo]);
  });

  it('CR 4-10-2: with an empty DON!! deck the "Then, K.O." still resolves', () => {
    const g = game(
      { hand: [AKP.ultiPageOne], costArea: { active: 10, rested: 0 } },
      { characters: [VAN.komachiyo] },
    );
    playUlti(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 6, deck: 0 });
    choose(g, [g.find('p2', 'characters', VAN.komachiyo)]);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.komachiyo]);
  });

  it('interaction with OP17-058 Kaido: a 5000 Character given −2000 this turn is a legal K.O. target (current power)', () => {
    const g = game(
      { hand: [AKP.ultiPageOne], costArea: { active: 8, rested: 0 } },
      { characters: [VAN.marco] },
    );
    const marco = g.find('p2', 'characters', VAN.marco);
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1, 'costActive');
    choose(g, [marco]);
    noDefence(g);
    expect(g.power(marco)).toBe(3000);
    playUlti(g);
    expect(choiceCards(g)).toEqual([VAN.marco]);
    choose(g, [marco]);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.marco]);
  });
});
