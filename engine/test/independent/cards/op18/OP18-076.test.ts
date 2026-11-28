/**
 * OP18-076 Shark Submerge 3 (Stage, Purple, cost 5, type Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Draw 1 card, then add up to 1 DON!! card as rested from your DON!! deck.
 *    [On Your Opponent's Attack] You may rest this Stage: Your Leader with 5000 power or less and
 *    up to 2 of your Characters gain +1000 power during this turn."
 *
 * Rules: [On Your Opponent's Attack] activates when the opponent declares an attack, before
 * [Blocker] (CR 10-2-?; RL-18 timing); "you may rest" is an optional cost, which must be payable;
 * "up to" CR 8-4-4-1; "during this turn" lasts until the end of the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, play, takeMost } from '../../helpers.ts';
import {
  accept,
  choiceCards,
  choose,
  chooseNone,
  count,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SHARK = 'OP18-076';

function defending(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return theirTurn(
    side(LEAD.shanks, PURPLE, {
      stage: SHARK,
      characters: [VAN.marco, VAN.sai, VAN.hajrudin],
      costArea: { active: 3, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, p2),
  );
}

const stageOf = (g: TestGame) => g.find('p1', 'stage', SHARK);

/** p2's Leader attacks p1's Leader. */
function opponentAttacks(g: TestGame): void {
  attack(g, g.leader('p2'), g.leader('p1'));
}

describe('OP18-076 Shark Submerge 3: [On Play] draw 1, then add up to 1 rested DON!!', () => {
  it('playing it draws the top card and adds 1 rested DON!!', () => {
    const g = myTurn(
      side(LEAD.shanks, PURPLE, {
        hand: [SHARK],
        deck: [VAN.marco, ...Array(10).fill(PURPLE)],
        costArea: { active: 5, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    play(g, g.find('p1', 'hand', SHARK));
    takeMost(g);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: 4 });
    expect(kind(g)).toBe('main');
  });
});

describe('OP18-076 Shark Submerge 3: [On Your Opponent’s Attack] rest it → Leader (≤5000) and up to 2 Characters +1000', () => {
  it('happy path: Leader 5000 → 6000, two chosen Characters +1000, the Stage rests', () => {
    const g = defending();
    opponentAttacks(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'characters', VAN.marco), g.find('p1', 'characters', VAN.sai)]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', VAN.marco))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', VAN.sai))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', VAN.hajrudin))).toBe(6000);
    expect(g.card(stageOf(g)).rested).toBe(true);
  });

  it('"up to 2": at most 2 Characters can be picked out of 3', () => {
    const g = defending();
    opponentAttacks(g);
    accept(g);
    expect(choiceCards(g)).toHaveLength(3);
    const ids = [
      g.find('p1', 'characters', VAN.marco),
      g.find('p1', 'characters', VAN.sai),
      g.find('p1', 'characters', VAN.hajrudin),
    ];
    act(g, { type: 'pick', choice: ids[0]! });
    act(g, { type: 'pick', choice: ids[1]! });
    // A third pick is not legal (done or an automatic move to the next decision instead).
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === ids[2])).toBe(false);
  });

  it('"up to 2": 1 Character, or none, may be chosen; the Leader still gains +1000', () => {
    const g = defending();
    opponentAttacks(g);
    accept(g);
    chooseNone(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', VAN.marco))).toBe(5000);
  });

  it('Leader with a DON!! given still counts as 5000 on the opponent’s turn (DON!! add power only on your own turn), so it gains +1000', () => {
    const g = defending({ leader: { card: LEAD.shanks, don: 1 } });
    opponentAttacks(g);
    if (offered(g, 'p1')) accept(g);
    if (kind(g) === 'choose') choose(g, [g.find('p1', 'characters', VAN.marco)]);
    // DON!! given count on your turn only, so on the opponent's turn the Leader is 5000 and does gain.
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('declining leaves the Stage active and nobody boosted', () => {
    const g = defending();
    opponentAttacks(g);
    decline(g);
    expect(g.card(stageOf(g)).rested).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', VAN.marco))).toBe(5000);
    expect(kind(g)).toBe('block');
  });

  it('a rested Stage cannot pay the rest cost: nothing is offered when the opponent attacks', () => {
    const g = defending({ stage: { card: SHARK, rested: true } });
    opponentAttacks(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost applies to the battle: the Leader at 6000 beats a 5000 attacker (at 5000 the tie would let it hit)', () => {
    const g = defending({}, { characters: [VAN.marco] });
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    accept(g);
    chooseNone(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('only your own Characters are offered, not the opponent’s', () => {
    const g = defending({ characters: [VAN.marco] }, { characters: [VAN.sai] });
    opponentAttacks(g);
    accept(g);
    expect(choiceCards(g)).toEqual([VAN.marco]);
    chooseNone(g);
    expect(count(g, 'p2', 'characters')).toBe(1);
  });

  it('it is not an effect of your own attacks: attacking on your turn asks nothing', () => {
    const g = myTurn(
      side(LEAD.shanks, PURPLE, { stage: SHARK, costArea: { active: 3, rested: 0 } }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(false);
    expect(g.card(g.find('p1', 'stage', SHARK)).rested).toBe(false);
  });
});
