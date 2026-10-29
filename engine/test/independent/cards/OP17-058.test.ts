/**
 * OP17-058 Kaido (Leader, Purple, 5000, 5 Life, types Animal Kingdom Pirates / The Four Emperors).
 *
 * Card text (cards/data, no override text patch):
 *   "[When Attacking]/ [On Your Opponent's Attack] [Once Per Turn] DON!! −1: Give up to 1 of your
 *    opponent's Characters −2000 power during this turn."
 *
 * Rulings:
 * - RL-45 (QA-OP17 OP17-058): declining on one attack keeps it for a later attack that turn; it is
 *   used up only when it resolves (CR 10-2-13-1/-3). Usable once on your turn and once on each
 *   opponent turn. DON!! −1 may return a given DON!! (QA-GR). −2000 lasts the turn (CR 6-6-1-3),
 *   not just the battle. Characters only, never the Leader.
 * - RL-18 / CR 10-2-16-1: on the opponent's turn it is decided before [Blocker] and Counter.
 * - RL-23 / RL-24: DON!! −X returns DON!! to the DON!! deck (CR 8-3-1-6, 10-2-10-1).
 * - RL-34 (a [When Attacking] that moves the target) needs an attacker with such an effect; none
 *   exists in the Rocks or Kaido lists, so it is not tested here.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, noDefence, passBlock, passCounter, endTurn } from '../helpers.ts';
import {
  abilities,
  accept,
  choiceCards,
  chooseNone,
  choose,
  decider,
  decline,
  donChoices,
  donOf,
  donOnField,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit.ts';

function mine(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec> = {}) {
  return myTurn(side(LEAD.kaido, PURPLE, p1), side(LEAD.luffy, RED, p2));
}
function theirs(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(side(LEAD.kaido, PURPLE, p1), side(LEAD.luffy, RED, p2));
}

describe('OP17-058 Kaido: [When Attacking]/[On Your Opponent’s Attack] [Once Per Turn] DON!! −1: −2000', () => {
  it('[When Attacking] happy path: DON!! −1 returns 1 DON!! to the DON!! deck and gives −2000', () => {
    const g = mine({ costArea: { active: 2, rested: 0 } }, { characters: [VAN.marco] });
    const marco = g.find('p2', 'characters', VAN.marco);
    expect(donOf(g, 'p1').deck).toBe(8);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1);
    choose(g, [marco]);
    expect(g.power(marco)).toBe(3000);
    expect(donOf(g, 'p1').deck).toBe(9);
    expect(donOnField(g, 'p1')).toBe(1);
    expect(decider(g)).toBe('p2');
  });

  it('CR 6-6-1-3: −2000 lasts after the battle, until the end of the turn', () => {
    const g = mine({ costArea: { active: 2, rested: 0 } }, { characters: [VAN.marco] });
    const marco = g.find('p2', 'characters', VAN.marco);
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1);
    choose(g, [marco]);
    noDefence(g);
    expect(g.power(marco)).toBe(3000);
    endTurn(g);
    expect(g.power(marco)).toBe(5000);
  });

  it('RL-45: targets only the opponent’s Characters (not their Leader, not your own Characters)', () => {
    const g = mine(
      { costArea: { active: 2, rested: 0 }, characters: [VAN.komachiyo] },
      { characters: [VAN.marco, VAN.sai] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1);
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.sai].sort());
  });

  it('CR 8-4-4-1: "up to 1" allows choosing no Character; the DON!! −1 is still paid', () => {
    const g = mine({ costArea: { active: 2, rested: 0 } }, { characters: [VAN.marco] });
    const marco = g.find('p2', 'characters', VAN.marco);
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1);
    chooseNone(g);
    expect(g.power(marco)).toBe(5000);
    expect(donOf(g, 'p1').deck).toBe(9);
  });

  it('CR 8-3-1-3: with no DON!! on the field the cost cannot be paid, so nothing is offered', () => {
    const g = mine({ costArea: { active: 0, rested: 0 } }, { characters: [VAN.marco] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(false);
    expect(decider(g)).toBe('p2');
  });

  it('declining keeps the DON!! and the opponent’s Character untouched', () => {
    const g = mine({ costArea: { active: 2, rested: 0 } }, { characters: [VAN.marco] });
    attack(g, g.leader('p1'), g.leader('p2'));
    decline(g);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(5000);
    expect(donOf(g, 'p1').deck).toBe(8);
  });

  it('it is not an [Activate: Main]: no activate action on the Leader', () => {
    const g = mine({ costArea: { active: 2, rested: 0 } }, { characters: [VAN.marco] });
    expect(abilities(g, g.leader('p1'))).toEqual([]);
  });

  it('RL-45 / RL-18: on the opponent’s attack it is offered before the Block Step', () => {
    const g = theirs(
      { costArea: { active: 0, rested: 2 }, characters: ['OP09-072'] },
      { characters: [VAN.marco] },
    );
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    expect(kind(g)).toBe('optional');
  });

  it('RL-45 / QA-GR: DON!! −1 may return a DON!! given to the Leader (still given on the opponent’s turn)', () => {
    const g = theirs(
      { leader: { card: LEAD.kaido, don: 1 }, costArea: { active: 0, rested: 0 } },
      { characters: [VAN.marco] },
    );
    const marco = g.find('p2', 'characters', VAN.marco);
    attack(g, marco, g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    if (donChoices(g).length) expect(donChoices(g).some((c) => c.from === 'given')).toBe(true);
    payDon(g, 1, 'given', g.leader('p1'));
    choose(g, [marco]);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.power(marco)).toBe(3000);
  });

  it('RL-45: declined on the first attack, used on the second, not offered on the third', () => {
    const g = theirs(
      { costArea: { active: 0, rested: 2 } },
      { characters: [VAN.marco, VAN.sai, VAN.komachiyo] },
    );
    const marco = g.find('p2', 'characters', VAN.marco);
    const sai = g.find('p2', 'characters', VAN.sai);
    attack(g, marco, g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    noDefence(g);
    const life = g.life('p1');

    attack(g, sai, g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    choose(g, [sai]);
    expect(g.power(sai)).toBe(2000);
    expect(donOf(g, 'p1').deck).toBe(9);
    noDefence(g);
    // 2000 < 5000: no damage; the −2000 outlives the battle.
    expect(g.life('p1')).toBe(life);
    expect(g.power(sai)).toBe(2000);

    attack(g, g.find('p2', 'characters', VAN.komachiyo), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('RL-45: used on your own turn, it is available again on the opponent’s next turn', () => {
    const g = mine(
      { costArea: { active: 3, rested: 0 } },
      { characters: [VAN.marco, VAN.sai], deck: Array(15).fill(RED) },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1);
    choose(g, [g.find('p2', 'characters', VAN.marco)]);
    noDefence(g);
    endTurn(g);
    attack(g, g.find('p2', 'characters', VAN.sai), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('interaction: −2000 on the attacking Character makes its attack fail (5000 → 3000 < 5000)', () => {
    const g = theirs({ costArea: { active: 1, rested: 0 } }, { characters: [VAN.marco] });
    const marco = g.find('p2', 'characters', VAN.marco);
    attack(g, marco, g.leader('p1'));
    accept(g);
    payDon(g, 1);
    choose(g, [marco]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });
});
