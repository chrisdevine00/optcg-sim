/**
 * OP18-118 Monkey.D.Luffy (Character, Green, cost 9, 10000, no Counter, types Water Seven / Straw
 * Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Set up to 3 of your DON!! cards as active. Then, up to 1 of your opponent's
 *    Characters cannot be rested until the end of your opponent's next End Phase.
 *    [End of Your Turn] Set up to 1 of your {Water Seven} type cards as active."
 *
 * Rules: "up to" CR 8-4-4-1; QA-GR "cannot be rested": the Character cannot attack, cannot activate
 * [Blocker], cannot pay a "rest this Character" cost and cannot be rested by effects (rules-digest
 * 57); [End of Your Turn] CR 10-2-?; "set as active" untaps a rested card.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, play, takeMost } from '../../helpers.ts';
import {
  abilities,
  attackers,
  choiceCards,
  choose,
  chooseNone,
  count,
  donOf,
  kind,
  LEAD,
  optionChoices,
  myTurn,
  RED,
  ROCKS,
  settleNo,
  settleYes,
  side,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LUFFY = 'OP18-118';
/** OP03-061 Kiwi & Mozu: Purple, 4000, type Water Seven (vanilla). */
const WS_A = 'OP03-061';
/** OP18-035 Michael & Hoichael: Green, 5000, type Water Seven (vanilla). */
const WS_B = 'OP18-035';

const rested = (card: string) => ({ card, rested: true });

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return myTurn(
    side(LEAD.luffy, RED, { hand: [LUFFY], costArea: { active: 10, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.kingdew], ...p2 }),
  );
}

function playLuffy(g: TestGame): void {
  play(g, g.find('p1', 'hand', LUFFY));
}

describe('OP18-118 Monkey.D.Luffy: [On Play] set up to 3 DON!! active, then an opposing Character cannot be rested', () => {
  it('sets 3 of the rested DON!! active (9 rested to pay, 1 still active)', () => {
    const g = game();
    playLuffy(g);
    takeMost(g);
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('"up to 3": the count may be lowered; choosing 1 sets only 1 DON!! active, and the Character part still resolves', () => {
    const g = game();
    playLuffy(g);
    expect(optionChoices(g)).toEqual(['3', '2', '1', '0']);
    act(g, { type: 'pick', choice: { option: '1' } });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([VAN.kingdew]);
  });

  it('"up to 3": choosing none sets no DON!! active', () => {
    const g = game();
    playLuffy(g);
    act(g, { type: 'pick', choice: { option: '0' } });
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 9 });
  });

  it('the targeted opposing Character cannot attack on the opponent’s next turn', () => {
    const g = game();
    playLuffy(g);
    takeMost(g);
    settleYes(g, 'p1'); // takes DON!!, then the Character target
    // settleYes took the first offered target (the only opposing Character).
    act(g, { type: 'endTurn' });
    settleNo(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(attackers(g)).not.toContain(g.find('p2', 'characters', VAN.kingdew));
    expect(attackers(g)).toContain(g.leader('p2'));
  });

  it('only the opponent’s Characters are offered as targets, and "up to 1" allows none', () => {
    const g = game({ characters: [VAN.marco] });
    playLuffy(g);
    takeMost(g);
    if (kind(g) === 'optional') settleYes(g, 'p1');
    while (kind(g) === 'choose' && choiceCards(g).length === 0) break;
    expect(choiceCards(g)).toEqual([VAN.kingdew]);
    chooseNone(g);
    act(g, { type: 'endTurn' });
    settleNo(g, 'p1');
    expect(attackers(g)).toContain(g.find('p2', 'characters', VAN.kingdew));
  });

  it('QA-GR: an affected [Blocker] cannot block this turn', () => {
    const g = game({ characters: [VAN.marco] }, { characters: [ROCKS.kaido] });
    playLuffy(g);
    takeMost(g);
    settleYes(g, 'p1');
    expect(g.find('p2', 'characters', ROCKS.kaido)).toBeTruthy();
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('without the effect, the same [Blocker] could block (control)', () => {
    const g = game({ characters: [VAN.marco] }, { characters: [ROCKS.kaido] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', ROCKS.kaido)]);
  });

  it('it lasts until the end of the opponent’s next End Phase, then the Character can attack again', () => {
    const g = game();
    playLuffy(g);
    takeMost(g);
    settleYes(g, 'p1');
    act(g, { type: 'endTurn' });
    settleNo(g, 'p1');
    const king = g.find('p2', 'characters', VAN.kingdew);
    expect(attackers(g)).not.toContain(king);
    act(g, { type: 'endTurn' }); // p2 ends; it is p1's turn 5
    act(g, { type: 'endTurn' }); // p1 ends (End of Turn effect declined); p2's next turn
    settleNo(g, 'p1');
    expect(attackers(g)).toContain(king);
  });
});

describe('OP18-118 Monkey.D.Luffy: [End of Your Turn] set up to 1 of your {Water Seven} cards as active', () => {
  /** Luffy already on the field; end the turn and answer the End of Turn effect with `pick`. */
  function endTurnPicking(g: TestGame, pick: string[]): void {
    act(g, { type: 'endTurn' });
    if (kind(g) === 'choose') {
      if (pick.length) choose(g, pick);
      else chooseNone(g);
    }
    settleNo(g, 'p1');
  }

  const field = (p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) =>
    game(
      { hand: [], characters: [LUFFY, rested(WS_A), rested(WS_B), rested(VAN.marco)], ...p1 },
      p2,
    );

  it('a rested {Water Seven} Character is set active at the end of your turn', () => {
    const g = field();
    const a = g.find('p1', 'characters', WS_A);
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toContain(WS_A);
    choose(g, [a]);
    expect(g.card(a).rested).toBe(false);
  });

  it('"up to 1": only one of two rested {Water Seven} Characters is set active', () => {
    const g = field();
    const a = g.find('p1', 'characters', WS_A);
    const b = g.find('p1', 'characters', WS_B);
    endTurnPicking(g, [a]);
    expect(g.card(a).rested).toBe(false);
    expect(g.card(b).rested).toBe(true);
  });

  it('a Character without the {Water Seven} type is not offered and stays rested', () => {
    const g = field();
    act(g, { type: 'endTurn' });
    expect(choiceCards(g)).not.toContain(VAN.marco);
    chooseNone(g);
    expect(g.card(g.find('p1', 'characters', VAN.marco)).rested).toBe(true);
  });

  it('"up to 1": choosing nothing leaves them rested', () => {
    const g = field();
    endTurnPicking(g, []);
    expect(g.card(g.find('p1', 'characters', WS_A)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', WS_B)).rested).toBe(true);
  });

  it('Luffy himself is a {Water Seven} card: a rested Luffy can be set active', () => {
    const g = game({ hand: [], characters: [{ card: LUFFY, rested: true }] });
    const l = g.find('p1', 'characters', LUFFY);
    act(g, { type: 'endTurn' });
    if (kind(g) === 'choose') {
      expect(choiceCards(g)).toContain(LUFFY);
      choose(g, [l]);
    }
    expect(g.card(l).rested).toBe(false);
  });

  it('only your own cards: an opposing rested {Water Seven} Character is not offered', () => {
    const g = field({}, { characters: [rested(WS_A)] });
    act(g, { type: 'endTurn' });
    expect(choiceCards(g)).toHaveLength(3);
    chooseNone(g);
    expect(count(g, 'p2', 'characters')).toBe(1);
  });

  it('it is not an [Activate: Main]: nothing can be activated on Luffy and nothing is asked before ending the turn', () => {
    const g = field();
    expect(kind(g)).toBe('main');
    expect(abilities(g, g.find('p1', 'characters', LUFFY))).toEqual([]);
  });
});
