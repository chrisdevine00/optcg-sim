/**
 * OP15-032 Brook (Character, Green, cost 6, 6000, Counter +1000; Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Rest up to 1 of your opponent's cards.
 *    [Activate: Main] You may trash this Character: If your Leader has the {Straw Hat Crew} type,
 *    set up to 1 of your Characters with a base cost of 8 or less as active."
 *
 * Rules: "cards" on the field covers the Leader, Characters and Stage; DON!! cards are "DON!! cards"
 * and are not meant. The Activate cost is trashing itself, so it needs no active state (a rested
 * Brook can use it, CR 8-3-1). "If" is a condition of the effect, not of the activation (CR 4-10-1):
 * with the wrong Leader type the cost is still paid and nothing is set active. "Base cost" ignores
 * cost modifiers (CR 4-9-2 analogy).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  abilities,
  accept,
  act,
  CH,
  choiceCards,
  choices,
  donChoices,
  drive,
  F,
  kind,
  LB,
  myTurn,
  offered,
  play,
  side,
  sortedIds,
  canActivate,
  viewHasActivate,
} from './kit-b.ts';

const BROOK = 'OP15-032';

describe('OP15-032 Brook [On Play]: rest up to 1 of your opponent’s cards', () => {
  function playGame() {
    const g = myTurn(
      side(LB.greenKid, F.green, {
        hand: [BROOK],
        costArea: { active: 6, rested: 0 },
        characters: [CH.alvida],
      }),
      side(LB.opp, F.red, { characters: [CH.marco], stage: 'ST31-005' }),
    );
    play(g, g.find('p1', 'hand', BROOK));
    return g;
  }

  it('candidates: the opponent’s Leader, Character and Stage; none of your own cards', () => {
    const g = playGame();
    expect(choiceCards(g)).toEqual([LB.opp, CH.marco, 'ST31-005'].sort());
  });

  // DISAGREEMENTS-b.md B-2: with DON!! in the opponent's cost area the engine offers a DON!! class as a target.
  it.fails(
    '"cards" is not "DON!! cards" (other texts say "Characters or DON!! cards" when they mean both): no DON!! class is offered',
    () => {
      const g = myTurn(
        side(LB.greenKid, F.green, { hand: [BROOK], costArea: { active: 6, rested: 0 } }),
        side(LB.opp, F.red, { characters: [CH.marco], costArea: { active: 3, rested: 0 } }),
      );
      act(g, { type: 'playCard', card: g.find('p1', 'hand', BROOK) });
      expect(choiceCards(g)).toEqual([LB.opp, CH.marco].sort());
      expect(donChoices(g)).toEqual([]);
    },
  );

  it('rest the Leader', () => {
    const g = playGame();
    drive(g, 'p1', { picks: [[g.leader('p2')]] });
    expect(g.card(g.leader('p2')).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.marco)).rested).toBe(false);
  });

  it('rest a Character', () => {
    const g = playGame();
    const marco = g.find('p2', 'characters', CH.marco);
    drive(g, 'p1', { picks: [[marco]] });
    expect(g.card(marco).rested).toBe(true);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('rest the Stage', () => {
    const g = playGame();
    const stage = g.find('p2', 'stage', 'ST31-005');
    drive(g, 'p1', { picks: [[stage]] });
    expect(g.card(stage).rested).toBe(true);
  });

  it('"up to 1": choosing nothing rests nothing', () => {
    const g = playGame();
    drive(g, 'p1', { picks: [[]] });
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', CH.marco)).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('only 1 card is rested', () => {
    const g = playGame();
    drive(g, 'p1', { picks: [[g.find('p2', 'characters', CH.marco)]] });
    const rested = [
      g.card(g.leader('p2')).rested,
      g.card(g.find('p2', 'stage', 'ST31-005')).rested,
    ].filter(Boolean);
    expect(rested).toHaveLength(0);
  });
});

describe('OP15-032 Brook [Activate: Main]: you may trash this Character: set up to 1 of your Characters (base cost ≤8) as active', () => {
  function activateGame(p1: Partial<PlayerSpec> = {}, leader: string = LB.greenShc) {
    return myTurn(
      side(leader, F.green, {
        characters: [
          BROOK,
          { card: CH.luffyG8, rested: true }, // base cost 8
          { card: CH.luffyP10, rested: true }, // base cost 10
          { card: CH.alvida, rested: true }, // base cost 1
        ],
        ...p1,
      }),
      side(LB.opp, F.red),
    );
  }

  it('happy path: Brook is trashed and the rested cost-8 Character (P-061) is set active', () => {
    const g = activateGame();
    const brook = g.find('p1', 'characters', BROOK);
    const luffy = g.find('p1', 'characters', CH.luffyG8);
    act(g, { type: 'activate', card: brook, ability: abilities(g, brook)[0]! });
    drive(g, 'p1', { picks: [[luffy]] });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([BROOK]);
    expect(g.card(luffy).rested).toBe(false);
  });

  it('candidates: Characters with base cost ≤8 (P-061 at 8, Alvida at 1); the cost-10 Character is not offered', () => {
    const g = activateGame();
    const brook = g.find('p1', 'characters', BROOK);
    act(g, { type: 'activate', card: brook, ability: abilities(g, brook)[0]! });
    if (offered(g, 'p1')) accept(g);
    const offeredNow = choices(g);
    expect(offeredNow).toContain(g.find('p1', 'characters', CH.luffyG8));
    expect(offeredNow).toContain(g.find('p1', 'characters', CH.alvida));
    expect(offeredNow).not.toContain(g.find('p1', 'characters', CH.luffyP10));
  });

  it('the cost-10 Character stays rested and the cost-8 one is the only one set active', () => {
    const g = activateGame();
    const brook = g.find('p1', 'characters', BROOK);
    act(g, { type: 'activate', card: brook, ability: abilities(g, brook)[0]! });
    drive(g, 'p1', { picks: [[g.find('p1', 'characters', CH.luffyG8)]] });
    expect(g.card(g.find('p1', 'characters', CH.luffyP10)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', CH.alvida)).rested).toBe(true);
  });

  it('a rested Brook can still activate (the cost is trashing, not resting)', () => {
    const g = activateGame({
      characters: [
        { card: BROOK, rested: true },
        { card: CH.luffyG8, rested: true },
      ],
    });
    const brook = g.find('p1', 'characters', BROOK);
    expect(canActivate(g, brook)).toBe(true);
    expect(viewHasActivate(g)).toBe(true);
    act(g, { type: 'activate', card: brook, ability: abilities(g, brook)[0]! });
    drive(g, 'p1', { picks: [[g.find('p1', 'characters', CH.luffyG8)]] });
    expect(g.card(g.find('p1', 'characters', CH.luffyG8)).rested).toBe(false);
  });

  it('"you may": not activating keeps Brook and changes nothing', () => {
    const g = activateGame();
    expect(sortedIds(g, 'p1', 'trash')).toEqual([]);
    expect(g.card(g.find('p1', 'characters', CH.luffyG8)).rested).toBe(true);
    expect(abilities(g, g.find('p1', 'characters', BROOK))).toHaveLength(1);
  });

  it('"up to 1": choosing nothing still trashes Brook (cost paid) and sets nothing active', () => {
    const g = activateGame();
    const brook = g.find('p1', 'characters', BROOK);
    act(g, { type: 'activate', card: brook, ability: abilities(g, brook)[0]! });
    drive(g, 'p1', { picks: [[]] });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([BROOK]);
    expect(g.card(g.find('p1', 'characters', CH.luffyG8)).rested).toBe(true);
  });

  it('CR 4-10-1: with a Leader that lacks the Straw Hat Crew type (ST02-001) no Character is set active, whatever happens to Brook', () => {
    const g = activateGame({}, LB.greenKid);
    const brook = g.find('p1', 'characters', BROOK);
    const ids = abilities(g, brook);
    if (ids.length) {
      act(g, { type: 'activate', card: brook, ability: ids[0]! });
      drive(g, 'p1', { picks: [[g.find('p1', 'characters', CH.luffyG8)]] });
    }
    expect(g.card(g.find('p1', 'characters', CH.luffyG8)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', CH.alvida)).rested).toBe(true);
  });
});
